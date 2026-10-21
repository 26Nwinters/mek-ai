#!/usr/bin/env python3
"""Local, loopback-only MEK-AI bridge for TP-Link Tapo plugs.

Requires python-kasa's CLI in ~/tapo-test/bin/kasa (or MEK_KASA_BIN).
Credentials, plug addresses and pairing token stay in config.json on this computer.
No cloud endpoint, paid service or public listener is used.
"""
import hmac
import ipaddress
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parent
CONFIG_PATH = ROOT / "config.json"
HOST = "127.0.0.1"
PORT = 8765
WEB_ORIGIN = "https://26nwinters.github.io"
DEVICE_ID = re.compile(r"^[a-z0-9][a-z0-9-]{0,63}$")
PRIVATE_NETWORKS = tuple(ipaddress.ip_network(n) for n in
                         ("10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16"))


def valid_lan_ip(value):
    try:
        address = ipaddress.ip_address(value)
        return address.version == 4 and any(address in net for net in PRIVATE_NETWORKS)
    except ValueError:
        return False


def load_config():
    if not CONFIG_PATH.is_file():
        raise RuntimeError("Missing local config.json. Run: python setup.py")
    data = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    if (not isinstance(data, dict) or
            not isinstance(data.get("email"), str) or not data["email"] or
            not isinstance(data.get("password"), str) or not data["password"] or
            not isinstance(data.get("token"), str) or len(data["token"]) < 32 or
            not isinstance(data.get("devices"), list) or not data["devices"]):
        raise RuntimeError("Invalid configuration. Run: python setup.py")
    ids = set()
    for device in data["devices"]:
        if (not isinstance(device, dict) or
                not isinstance(device.get("name"), str) or not device["name"].strip() or
                not isinstance(device.get("id"), str) or
                not DEVICE_ID.fullmatch(device["id"]) or device["id"] in ids or
                not valid_lan_ip(device.get("ip"))):
            raise RuntimeError("Invalid device in configuration. Run: python setup.py")
        ids.add(device["id"])
    return data


def kasa_binary():
    supplied = os.environ.get("MEK_KASA_BIN")
    candidate = supplied or str(Path.home() / "tapo-test" / "bin" / "kasa")
    if Path(candidate).is_file():
        return candidate
    fallback = shutil.which("kasa")
    if fallback:
        return fallback
    raise RuntimeError("python-kasa was not found. Check ~/tapo-test/bin/kasa")


def kasa_failure_hint(stdout, stderr):
    """Return a safe, specific hint without exposing device output or credentials."""
    details = (str(stdout or "") + "\n" + str(stderr or "")).lower()
    if any(key in details for key in (
        "did not match our challenge", "authentication failed", "authenticationerror",
        "unknown_credentials", "invalid credentials", "incorrect password",
        "login failed", "invalid username", "unauthorized"
    )):
        return ("Tapo authentication failed. Double-check the case-sensitive Tapo email "
                "and password saved during setup. If they are correct, the plug's "
                "firmware or third-party compatibility settings may be blocking the login.")
    if any(key in details for key in (
        "network is unreachable", "host is unreachable", "no route to host",
        "connect call failed", "connection refused", "unable to connect",
        "connection reset", "cannot connect"
    )):
        return ("The plug cannot be reached at its saved IP address. Check the "
                "plug's current IP in Tapo, Wi-Fi, and power.")
    if "timed out" in details or "timeout" in details:
        return ("The plug did not respond in time. Check its power, Wi-Fi, and IP address.")
    if "no such device" in details or "device not found" in details:
        return ("No compatible plug was found at that IP address. Check its IP in Tapo.")
    return ("The plug command failed, but kasa did not report a recognizable reason. "
            "Use the local diagnostic in the setup guide to identify the cause.")


def execute_kasa(config, device, action):
    """Only known devices and the on/off/state commands are accepted."""
    if action not in ("on", "off", "state"):
        raise ValueError("Unsupported action")
    env = os.environ.copy()
    env["KASA_USERNAME"] = config["email"]
    env["KASA_PASSWORD"] = config["password"]
    try:
        completed = subprocess.run(
            [kasa_binary(), "--host", device["ip"], action],
            env=env, text=True, capture_output=True, timeout=25, check=False
        )
    except subprocess.TimeoutExpired as exc:
        raise RuntimeError("Device timed out. Check that the plug is powered and connected.") from exc
    except OSError as exc:
        raise RuntimeError("Cannot start the local Tapo command.") from exc
    if completed.returncode:
        # Classify locally; never return raw kasa output, which can contain identifiers.
        raise RuntimeError(kasa_failure_hint(completed.stdout, completed.stderr))
    if action != "state":
        return action
    matched = re.search(r"\bDevice state:\s*(True|False)\b", completed.stdout, re.I)
    if not matched:
        matched = re.search(r"\bState \(state\):\s*(True|False)\b", completed.stdout, re.I)
    return ("on" if matched.group(1).lower() == "true" else "off") if matched else "unknown"


class Handler(BaseHTTPRequestHandler):
    server_version = "MEKLocalController/1.0"
    sys_version = ""

    def log_message(self, format, *args):
        # Only request lines and HTTP statuses; do not log headers or tokens.
        super().log_message(format, *args)

    def valid_host(self):
        return self.headers.get("Host", "").lower() in (
            f"{HOST}:{PORT}", f"localhost:{PORT}"
        )

    def valid_origin(self):
        origin = self.headers.get("Origin")
        return not origin or origin == WEB_ORIGIN

    def send_json(self, status, data):
        body = json.dumps(data, separators=(",", ":")).encode("utf-8")
        self.send_response(status)
        if self.headers.get("Origin") == WEB_ORIGIN:
            self.send_header("Access-Control-Allow-Origin", WEB_ORIGIN)
        self.send_header("Vary", "Origin")
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def authorize(self):
        if not self.valid_host() or not self.valid_origin():
            self.send_json(403, {"error": "Request origin or host not allowed."})
            return False
        supplied = self.headers.get("X-MEK-Controller-Token", "")
        if not hmac.compare_digest(supplied, self.server.config["token"]):
            self.send_json(401, {"error": "Incorrect controller pairing token."})
            return False
        return True

    def do_OPTIONS(self):
        if not self.valid_host() or self.headers.get("Origin") != WEB_ORIGIN:
            self.send_json(403, {"error": "Origin not allowed."})
            return
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", WEB_ORIGIN)
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "X-MEK-Controller-Token")
        self.send_header("Access-Control-Max-Age", "600")
        self.send_header("Vary", "Origin")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()

    def find_device(self, device_id):
        return next((d for d in self.server.config["devices"] if d["id"] == device_id), None)

    def do_GET(self):
        if not self.authorize():
            return
        path = urlsplit(self.path).path
        if path == "/v1/devices":
            self.send_json(200, {"devices": [
                {"id": d["id"], "name": d["name"]} for d in self.server.config["devices"]
            ]})
            return
        match = re.fullmatch(r"/v1/devices/([a-z0-9-]+)/state", path)
        if match:
            device = self.find_device(match.group(1))
            if not device:
                self.send_json(404, {"error": "Unknown plug."})
                return
            try:
                state = execute_kasa(self.server.config, device, "state")
                self.send_json(200, {"id": device["id"], "state": state})
            except RuntimeError as exc:
                self.send_json(502, {"error": str(exc)})
            return
        self.send_json(404, {"error": "Unknown endpoint."})

    def do_POST(self):
        if not self.authorize():
            return
        if self.headers.get("Content-Length", "0") not in ("", "0"):
            self.send_json(400, {"error": "A request body is not allowed."})
            return
        match = re.fullmatch(r"/v1/devices/([a-z0-9-]+)/(on|off)", urlsplit(self.path).path)
        if not match:
            self.send_json(404, {"error": "Unknown endpoint."})
            return
        device = self.find_device(match.group(1))
        if not device:
            self.send_json(404, {"error": "Unknown plug."})
            return
        action = match.group(2)
        try:
            state = execute_kasa(self.server.config, device, action)
            self.send_json(200, {"ok": True, "id": device["id"],
                                 "name": device["name"], "state": state})
        except RuntimeError as exc:
            self.send_json(502, {"error": str(exc)})


def main():
    config = load_config()
    kasa_binary()  # fail at startup rather than on the first request
    server = ThreadingHTTPServer((HOST, PORT), Handler)
    server.config = config
    print(f"MEK-AI Tapo controller on http://{HOST}:{PORT}")
    print("Listening on this Chromebook only. Keep this terminal running.")
    print("Press Ctrl+C to stop. Do not put config.json into GitHub.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nController stopped.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()

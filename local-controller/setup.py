#!/usr/bin/env python3
"""Interactive, local-only setup for MEK-AI's Tapo bridge."""
import getpass
import json
import os
from pathlib import Path
import re
import secrets
import tempfile

from controller import CONFIG_PATH, valid_lan_ip


def unique_slug(name, used):
    base = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")[:50] or "plug"
    value = base
    count = 2
    while value in used:
        value = f"{base}-{count}"
        count += 1
    used.add(value)
    return value


def prompt_devices():
    devices, used = [], set()
    while True:
        default_name = "Bedroom lamp" if not devices else "New plug"
        name = input(f"Plug name [{default_name}]: ").strip() or default_name
        while True:
            ip = input(f"Local IP address for {name}: ").strip()
            if valid_lan_ip(ip):
                break
            print("Enter a private IPv4 address such as 192.168.1.50.")
        devices.append({"id": unique_slug(name, used), "name": name, "ip": ip})
        answer = input("Add another Tapo plug? [y/N]: ").strip().lower()
        if answer not in ("y", "yes"):
            break
    return devices


def save_private_json(payload):
    # mkstemp creates a 0600 file. Atomic replace avoids partially written secrets.
    fd, temp = tempfile.mkstemp(prefix=".mek-setup-", dir=str(CONFIG_PATH.parent))
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(payload, f, indent=2)
            f.write("\n")
        os.chmod(temp, 0o600)
        os.replace(temp, CONFIG_PATH)
    finally:
        if os.path.exists(temp):
            os.unlink(temp)


def main():
    print("\nMEK-AI // LOCAL TAPO SETUP")
    print("Credentials and plug addresses stay on this Chromebook.")
    print("Do not commit or upload local-controller/config.json.\n")
    existing = None
    if CONFIG_PATH.is_file():
        try:
            existing = json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
        except (ValueError, OSError):
            print("Existing configuration is unreadable; it will need to be replaced.")
        if existing:
            answer = input("Configuration exists. Change it? [y/N]: ").strip().lower()
            if answer not in ("y", "yes"):
                print("\nPairing token (paste into MEK-AI's HOME CONTROL panel):")
                print(existing["token"])
                print("\nStart: ~/tapo-test/bin/python controller.py")
                return

    email = input("TP-Link / Tapo account email: ").strip()
    password = getpass.getpass("TP-Link / Tapo account password (hidden): ")
    if not email or not password:
        raise SystemExit("Email and password are required; nothing was saved.")
    devices = prompt_devices()
    config = {
        "email": email,
        "password": password,
        "token": (existing.get("token") if existing and
                  isinstance(existing.get("token"), str) and
                  len(existing["token"]) >= 32 else secrets.token_urlsafe(32)),
        "devices": devices,
    }
    save_private_json(config)
    print("\nConfiguration saved locally with owner-only file permissions.")
    print("Pairing token (paste into MEK-AI's HOME CONTROL panel):")
    print(config["token"])
    print("\nStart: ~/tapo-test/bin/python controller.py")


if __name__ == "__main__":
    main()

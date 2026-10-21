#!/usr/bin/env python3
"""Offline checks: no plug, network or Tapo credentials required."""
import unittest
import json
import os
import tempfile
from pathlib import Path
from unittest.mock import patch, Mock

import controller
import repair


class ControllerTests(unittest.TestCase):
    def test_only_private_ipv4_ips_are_allowed(self):
        self.assertTrue(controller.valid_lan_ip("192.168.1.50"))
        self.assertTrue(controller.valid_lan_ip("10.0.0.5"))
        self.assertFalse(controller.valid_lan_ip("127.0.0.1"))
        self.assertFalse(controller.valid_lan_ip("8.8.8.8"))
        self.assertFalse(controller.valid_lan_ip("not-an-ip"))
        self.assertFalse(controller.valid_lan_ip(None))

    def test_command_is_limited_to_known_actions(self):
        config = {"email": "test@example.com", "password": "not-real"}
        device = {"ip": "192.168.1.50", "name": "Test", "id": "test"}
        with self.assertRaises(ValueError):
            controller.execute_kasa(config, device, "delete")

    def test_kasa_gets_credentials_only_in_process_env(self):
        config = {"email": "test@example.com", "password": "not-real"}
        device = {"ip": "192.168.1.50", "name": "Test", "id": "test"}
        result = Mock(returncode=0, stdout="== Test - TP15 ==\nDevice state: True\n", stderr="")
        with patch("controller.kasa_binary", return_value="/fake/kasa"), \
             patch("controller.subprocess.run", return_value=result) as run:
            state = controller.execute_kasa(config, device, "state")
        self.assertEqual(state, "on")
        args, kwargs = run.call_args
        self.assertEqual(args[0], ["/fake/kasa", "--host", "192.168.1.50", "state"])
        self.assertEqual(kwargs["env"]["KASA_USERNAME"], "test@example.com")
        self.assertEqual(kwargs["env"]["KASA_PASSWORD"], "not-real")

    def test_auth_failure_classification_does_not_echo_secrets(self):
        diagnostic = controller.kasa_failure_hint(
            "", "Device response did not match our challenge on ip 192.168.1.50"
        )
        self.assertIn("authentication failed", diagnostic.lower())
        self.assertNotIn("192.168.1.50", diagnostic)

    def test_unreachable_failure_classification(self):
        diagnostic = controller.kasa_failure_hint("", "Connect call failed")
        self.assertIn("cannot be reached", diagnostic)

    def test_unknown_failure_never_echoes_raw_output(self):
        diagnostic = controller.kasa_failure_hint("", "unexpected email or token: SECRET")
        self.assertNotIn("SECRET", diagnostic)

    def test_repair_save_preserves_plugs_and_token(self):
        token = "test-token-that-must-not-change-during-repair"
        payload = {
            "email": "test@example.com",
            "password": "new-password",
            "token": token,
            "devices": [{"id": "bedroom-lamp", "name": "Bedroom lamp",
                         "ip": "192.168.1.50"}],
        }
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "config.json"
            with patch.object(repair, "CONFIG_PATH", path):
                repair.save_config(payload)
            saved = json.loads(path.read_text(encoding="utf-8"))
            self.assertEqual(saved, payload)
            self.assertEqual(os.stat(path).st_mode & 0o777, 0o600)

    def test_repair_handles_success_and_safe_error(self):
        config = {"email": "someone@example.com", "password": "redacted"}
        device = {"id": "bedroom-lamp", "name": "Bedroom lamp",
                  "ip": "192.168.1.50"}
        with patch.object(repair, "execute_kasa", return_value="on"):
            ok, msg = repair.verify_credentials(config, device)
            self.assertTrue(ok)
            self.assertIn("on", msg)
        with patch.object(repair, "execute_kasa",
                          side_effect=RuntimeError("Authentication failed.")):
            ok, msg = repair.verify_credentials(config, device)
            self.assertFalse(ok)
            self.assertEqual(msg, "Authentication failed.")

    def test_failed_commands_do_not_fake_success(self):
        config = {"email": "test@example.com", "password": "not-real"}
        device = {"ip": "192.168.1.50", "name": "Test", "id": "test"}
        with patch("controller.kasa_binary", return_value="/fake/kasa"), \
             patch("controller.subprocess.run", return_value=Mock(returncode=1, stdout="", stderr="error")):
            with self.assertRaises(RuntimeError):
                controller.execute_kasa(config, device, "on")


if __name__ == "__main__":
    unittest.main()

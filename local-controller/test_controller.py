#!/usr/bin/env python3
"""Offline checks: no plug, network or Tapo credentials required."""
import unittest
from unittest.mock import patch, Mock

import controller


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

    def test_failed_commands_do_not_fake_success(self):
        config = {"email": "test@example.com", "password": "not-real"}
        device = {"ip": "192.168.1.50", "name": "Test", "id": "test"}
        with patch("controller.kasa_binary", return_value="/fake/kasa"), \
             patch("controller.subprocess.run", return_value=Mock(returncode=1, stdout="", stderr="error")):
            with self.assertRaises(RuntimeError):
                controller.execute_kasa(config, device, "on")


if __name__ == "__main__":
    unittest.main()

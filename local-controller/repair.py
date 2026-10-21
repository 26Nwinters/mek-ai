#!/usr/bin/env python3
"""Check and repair the locally saved Tapo login without losing plug settings.

Run in the Chromebook's ~/mek-ai/local-controller directory:
    ~/tapo-test/bin/python repair.py

The stored password and pairing token are never displayed or sent to GitHub.
"""
import getpass
import json
import os
import tempfile

from controller import CONFIG_PATH, execute_kasa, load_config


def save_config(config):
    """Atomically save owner-readable configuration without opening permissions."""
    fd, temp_path = tempfile.mkstemp(prefix=".mek-repair-", dir=str(CONFIG_PATH.parent))
    try:
        os.fchmod(fd, 0o600)
        with os.fdopen(fd, "w", encoding="utf-8") as output:
            json.dump(config, output, indent=2)
            output.write("\n")
        os.replace(temp_path, CONFIG_PATH)
    finally:
        if os.path.exists(temp_path):
            os.unlink(temp_path)


def select_device(devices):
    print("\nConfigured plugs:")
    for number, device in enumerate(devices, 1):
        print(f"  {number}. {device['name']} ({device['ip']})")
    while True:
        answer = input("\nWhich plug showed the error? [1]: ").strip() or "1"
        try:
            number = int(answer)
        except ValueError:
            print("Enter a number from the list.")
            continue
        if 1 <= number <= len(devices):
            return devices[number - 1]
        print("Enter a number from the list.")


def verify_credentials(config, device):
    try:
        state = execute_kasa(config, device, "state")
        return True, "Authenticated. Device state: " + state + "."
    except RuntimeError as error:
        # execute_kasa classifies failures and never exposes its raw subprocess output.
        return False, str(error)


def main():
    print("\nMEK-AI // TAPO LOGIN REPAIR")
    print("This tests the saved login and will not erase your plugs or pairing token.")
    print("You can keep the existing controller running for the test,")
    print("but you must RESTART it to load any repaired credentials.")
    config = load_config()
    device = select_device(config["devices"])

    print("\nChecking the credentials currently saved on this Chromebook...")
    valid, detail = verify_credentials(config, device)
    print(detail)
    if valid:
        print("\nThe saved login works from Terminal. Do not change it.")
        print("Restart the existing MEK-AI controller (Ctrl+C, then run controller.py).")
        print("If another plug fails, rerun repair.py and select that plug.")
        return

    print("\nNow test the same email and password that worked in your old Terminal test.")
    print("The email is case-sensitive. Press Enter to keep the saved email.")
    email = input("Tapo account email [keep saved]: ").strip() or config["email"]
    password = getpass.getpass("Tapo account password (hidden): ")
    if not password:
        print("No password entered. Nothing was changed.")
        return
    proposed = dict(config)
    proposed["email"] = email
    proposed["password"] = password
    print("\nTesting the re-entered credentials (no settings saved yet)...")
    valid, detail = verify_credentials(proposed, device)
    print(detail)
    if not valid:
        print("\nThe new login did not authenticate either. Nothing was changed.")
        print("Verify the plug IP in the Tapo app, check the account that owns it,")
        print("and confirm that Third-Party Compatibility is enabled.")
        print("If those are correct, a device firmware/protocol issue is possible.")
        return

    save_config(proposed)
    print("\nSaved the working credentials. Plug names, IPs and token were preserved.")
    print("IMPORTANT: Restart the controller in its other terminal now:")
    print("  Ctrl+C")
    print("  cd ~/mek-ai/local-controller")
    print("  ~/tapo-test/bin/python controller.py")
    print("Then retry the plug in MEK-AI.")


if __name__ == "__main__":
    main()

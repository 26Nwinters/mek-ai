# MEK-AI local Tapo controller

This companion runs on the **same Chromebook** that opens the MEK-AI GitHub Pages website. It controls Tapo TP15 plugs directly over your home Wi-Fi through [python-kasa](https://python-kasa.readthedocs.io/). The website stays hosted on GitHub Pages. No Home Assistant, Docker, paid hosting, public tunnel or Tapo password in the website is needed.

## Install on your Chromebook

The original python-kasa installation at \`~/tapo-test\` is reused, so you do not need to install another copy.

If you have not downloaded the repository yet, open ChromeOS Linux Terminal and paste:

\`\`\`bash
git clone https://github.com/26Nwinters/mek-ai.git ~/mek-ai
cd ~/mek-ai/local-controller
~/tapo-test/bin/python setup.py
~/tapo-test/bin/python controller.py
\`\`\`

If you already cloned the repository, update it first:

\`\`\`bash
git -C ~/mek-ai pull --ff-only
cd ~/mek-ai/local-controller
~/tapo-test/bin/python setup.py
~/tapo-test/bin/python controller.py
\`\`\`

**During setup**, enter:
- Your normal TP-Link / Tapo account email and password (the password input stays hidden).
- A plug name, for example \`Bedroom lamp\`.
- The plug's local IPv4 address from Tapo or your router (the one confirmed working in the earlier terminal test).
- More plugs if desired (you can add them later by running setup again).

Setup displays a long **pairing token**. This is **not** your TP-Link password. Keep the token private. The setup saves the account password, plug addresses and token **only** in \`local-controller/config.json\` on your Chromebook with owner-only file permissions. That file is excluded from Git.

Keep the terminal that runs \`controller.py\` open. The controller starts on \`http://127.0.0.1:8765\` and listens only on the Chromebook's loopback interface.

## Pair MEK-AI

1. Open [MEK-AI](https://26nwinters.github.io/mek-ai/) in Chrome **on the Chromebook** and sign in.
2. In the ambient dashboard, choose **LIGHTS** to reach **HOME CONTROL // TAPO**.
3. Paste the pairing token into the password-style field and select **CONNECT CONTROLLER**.
4. If Chrome asks whether this website can access **Apps on device**, choose **Allow**.
5. Use the ON / OFF buttons. Then try typing or saying: **“Mecha, turn off my bedroom lamp.”**

Commands are intercepted by a local rule *before* the AI model is called. Mecha speaks a success message only after the Tapo command finishes successfully. If more than one plug could match, Mecha asks you to name the plug.

Chrome's Local Network Access protection requires permission for a public HTTPS page to reach a local companion. If access is blocked, open the controls beside the address bar, then Site settings, and look for **Apps on device** / loopback network permission. Do not disable Chrome security flags.

## Troubleshooting

- **Controller offline**: Is \`controller.py\` still running? Chromebook Linux and the browser must both be running. Sleeping or restarting stops the controller.
- **Plug unavailable**: Verify the Chromebook and plug are on the same Wi-Fi/network, the IP address is current, and the Tapo account credentials work. Routers can change DHCP addresses; consider reserving the plug's address in your router.
- **Incorrect token**: Run \`~/tapo-test/bin/python setup.py\` again from the \`local-controller\` directory to display the saved token.
- **Missing kasa CLI**: The old environment should contain \`~/tapo-test/bin/kasa\`. If it was deleted, recreate a virtual environment and install python-kasa before starting the controller.
- **Linux can reach the server but Chrome cannot**: ChromeOS normally forwards Crostini localhost ports. Check Chrome's Apps on device permission and whether local port 8765 is accessible; port forwarding behavior can vary by Chromebook version.

The controller is **not** exposed to the Wi-Fi network. Consequently, a phone opening the same GitHub Pages website cannot talk to this Chromebook controller. A dedicated always-on box or a separate secured relay is a future project.

## Security

- Do not commit, screenshot, share or publish \`config.json\` or your pairing token.
- The controller listens on **127.0.0.1** only and restricts browser requests to the MEK-AI GitHub Pages origin.
- A random secret token must accompany every API action; requests cannot specify arbitrary plug IP addresses.
- The device account password is supplied to the python-kasa subprocess as an environment variable, not to GitHub or the browser.
- The pairing token is remembered in **this browser's localStorage** only after successful connection; use **FORGET TOKEN** on a shared device.
- This is a local-home-control convenience integration, not a hardened solution for Internet-accessible remote control.

Stop the controller with **Ctrl+C**. To reconfigure plugs, run \`~/tapo-test/bin/python setup.py\` again, answer Yes, and restart the controller. The pairing token stays the same when reconfiguring.

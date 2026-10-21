# MEK-AI // The Hideaway

An illustrated, locally controlled personal-assistant console hosted on GitHub Pages.

## What runs where

- **index.html** retains the original application, Supabase authentication, voice/wake-word flow, timers, reminders, local memory, weather data, and navigation.
- **smart-home.js** talks to the operator's **local** Chromebook Tapo controller at \`127.0.0.1:8765\` using a per-browser pairing token. It automatically retries the initial connection if a token is saved. It is not a cloud smart-home service.
- **mek-rebirth.js** supplies the personality settings and authoritative face-state events.
- **mek-atelier.css** implements the approved three-column illustrated design, desktop/wall-display layout, and smaller-screen layouts.
- **mek-atelier.js** adds the illustrated robot, expressive poses, interactive console navigation, current conversation, voice status, and house switches. Its switches activate the existing smart-home buttons; they do **not** bypass the controller.
- **ASSETS/** holds original approved artwork. CSS uses sprites from the full-size source sheets rather than duplicating every image.
- **sw.js** caches the application shell, not credentials or local controller responses.

## Visual states

The original \`#eye\` element remains in the document as the application's state signal, although its legacy picture is hidden. When the original code enters \`idle\`, \`listening\`, \`thinking\`, \`speaking\`, \`happy\`, \`confused\`, or \`sleep\`, the art layer changes expression/pose accordingly.

The activity bars indicate voice *state*, not measured microphone audio amplitude. The original browser speech-recognition implementation remains subject to device and browser permissions.

## Practical limits

- Smart-home status is local to the device running the controller. The UI must say offline when it cannot connect, even if historical conversation messages say a lamp was switched successfully.
- Browser-local timers and reminders are not guaranteed while the tab is closed or the computer is asleep.
- Expression frames are CSS crops of illustration sheets, not an independently rigged 3D model.
- The interface must be tested in Chrome with real microphone and controller permissions after deployment.

## Testing

Run the offline regression checks from the project root:

\`\`\`sh
node --test tests/*.test.cjs
\`\`\`

The UI is served from \`https://26nwinters.github.io/mek-ai/\` on GitHub Pages. After an update, reload the page; the service worker caches shell files by version. Keep all \`ASSETS\` paths capitalized exactly as in the repository.

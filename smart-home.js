/* MEK-AI local Tapo integration. No TP-Link credentials or plug IPs are stored here. */
(() => {
  'use strict';

  const BASE = 'http://127.0.0.1:8765';
  const TOKEN_KEY = 'mekai:local-controller-token';
  const field = document.getElementById('smartToken');
  const status = document.getElementById('smartStatus');
  const message = document.getElementById('smartMessage');
  const devicesNode = document.getElementById('smartDevices');
  const connectButton = document.getElementById('smartConnect');
  const refreshButton = document.getElementById('smartRefresh');
  const forgetButton = document.getElementById('smartForget');

  let token = '';
  let devices = [];
  let connected = false;
  try { token = localStorage.getItem(TOKEN_KEY) || ''; } catch (_) { /* private browsing */ }
  field.value = token;

  function report(text, online = false) {
    status.textContent = online ? 'CONTROLLER ONLINE' : 'CONTROLLER OFFLINE';
    status.classList.toggle('smart-online', online);
    message.textContent = text;
  }

  async function request(path, method = 'GET', candidateToken = token) {
    if (!candidateToken) throw new Error('Pair the controller first using its setup token.');
    const aborter = new AbortController();
    const timer = setTimeout(() => aborter.abort(), 40000);
    try {
      const response = await fetch(BASE + path, {
        method,
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-store',
        targetAddressSpace: 'loopback',
        headers: { 'X-MEK-Controller-Token': candidateToken },
        signal: aborter.signal
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || ('Controller returned HTTP ' + response.status));
      return data;
    } catch (error) {
      if (error.name === 'AbortError') throw new Error('The controller or Tapo plug timed out.');
      if (error instanceof TypeError) {
        throw new Error('Cannot reach the Chromebook controller. Start it in Linux, then allow "Apps on device" for this site in Chrome.');
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
  }

  function deviceCard(device) {
    const wrap = document.createElement('div');
    wrap.className = 'smart-device';
    const info = document.createElement('div');
    const label = document.createElement('strong');
    label.textContent = device.name;
    const state = document.createElement('small');
    state.className = 'smart-device-state';
    state.textContent = 'CHECKING STATE...';
    info.append(label, state);
    const buttons = document.createElement('div');
    buttons.className = 'smart-device-actions';

    async function run(action) {
      for (const b of buttons.querySelectorAll('button')) b.disabled = true;
      state.textContent = 'SENDING ' + action.toUpperCase() + '...';
      try {
        const result = await request('/v1/devices/' + encodeURIComponent(device.id) + '/' + action, 'POST');
        state.textContent = result.state === 'on' ? 'POWER ON' : 'POWER OFF';
        report(device.name + ' switched ' + result.state + '.', true);
      } catch (error) {
        state.textContent = 'DEVICE UNAVAILABLE';
        report(error.message, connected);
      } finally {
        for (const b of buttons.querySelectorAll('button')) b.disabled = false;
      }
    }
    for (const action of ['on', 'off']) {
      const b = document.createElement('button');
      b.className = action === 'on' ? 'primary' : 'secondary';
      b.type = 'button';
      b.textContent = action.toUpperCase();
      b.addEventListener('click', () => run(action));
      buttons.append(b);
    }
    wrap.append(info, buttons);
    return { wrap, state };
  }

  async function loadStates() {
    const cards = Array.from(devicesNode.querySelectorAll('.smart-device'));
    await Promise.all(devices.map(async (device, index) => {
      const label = cards[index]?.querySelector('.smart-device-state');
      if (!label) return;
      try {
        const data = await request('/v1/devices/' + encodeURIComponent(device.id) + '/state');
        label.textContent = data.state === 'on' ? 'POWER ON' : data.state === 'off' ? 'POWER OFF' : 'STATE UNKNOWN';
      } catch (_) {
        label.textContent = 'DEVICE UNAVAILABLE';
      }
    }));
  }

  async function connect() {
    const candidate = field.value.trim() || token;
    if (!candidate) {
      report('Start controller setup on your Chromebook, then paste its pairing token here.');
      return false;
    }
    connectButton.disabled = true;
    refreshButton.disabled = true;
    report('Looking for the local controller...');
    try {
      const data = await request('/v1/devices', 'GET', candidate);
      if (!Array.isArray(data.devices)) throw new Error('Controller returned an invalid device list.');
      token = candidate;
      try { localStorage.setItem(TOKEN_KEY, token); } catch (_) { /* optional */ }
      field.value = token;
      devices = data.devices;
      connected = true;
      devicesNode.replaceChildren();
      for (const device of devices) devicesNode.append(deviceCard(device).wrap);
      report(devices.length + ' Tapo plug' + (devices.length === 1 ? '' : 's') + ' connected. Controls are local to this Chromebook.', true);
      // The list is usable immediately; current states are checked separately.
      void loadStates();
      return true;
    } catch (error) {
      connected = false;
      devices = [];
      devicesNode.replaceChildren();
      report(error.message);
      return false;
    } finally {
      connectButton.disabled = false;
      refreshButton.disabled = false;
    }
  }

  connectButton.addEventListener('click', connect);
  refreshButton.addEventListener('click', connect);
  forgetButton.addEventListener('click', () => {
    token = '';
    connected = false;
    devices = [];
    field.value = '';
    devicesNode.replaceChildren();
    try { localStorage.removeItem(TOKEN_KEY); } catch (_) { /* optional */ }
    report('Pairing token forgotten in this browser. The local controller was not changed.');
  });

  // Speech recognition often turns "Mecha" into "Mecca", and treats
  // "Growlight" as two words. Normalize both spoken requests and device names.
  const deviceTypeWords = new Set([
    'light', 'lights', 'lamp', 'lamps', 'plug', 'plugs', 'outlet', 'outlets'
  ]);
  const commandWords = new Set([
    'hey', 'hi', 'hello', 'yo', 'ok', 'okay', 'mecha', 'mecca', 'mekka',
    'meka', 'mech', 'meesha', 'misha', 'meshah', 'mechuh', 'meca', 'mek',
    'ai', 'please', 'can', 'could', 'would', 'will', 'you', 'your', 'i',
    'me', 'want', 'to', 'turn', 'switch', 'power', 'on', 'off', 'my',
    'the', 'a', 'an', 'for', 'in', 'of', 'and', 'it', 'that', 'this',
    'home', 'all', 'up', 'down', ...deviceTypeWords
  ]);

  function wordsOf(value) {
    return String(value || '')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .toLowerCase()
      .replace(/['’]s\b/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .split(/\s+/)
      .filter(Boolean);
  }

  function aliasesOf(device) {
    const words = wordsOf(device.name);
    const aliases = new Set(words);
    // Recognize names that combine a description and a device noun:
    // "Growlight" matches "grow light"; "Growlights" matches "grow lights".
    const combined = words.join('');
    if (combined) aliases.add(combined);
    for (const word of words) {
      const stem = word.replace(/(lights?|lamps?|plugs?|outlets?)$/, '');
      if (stem && stem !== word) aliases.add(stem);
    }
    return aliases;
  }

  function resolveDeviceCommand(input, knownDevices) {
    const words = wordsOf(input);
    const text = words.join(' ');
    if (!/\b(turn|switch|power)\b/.test(text)) return null;
    const operations = [...new Set(words.filter(word => word === 'on' || word === 'off'))];
    if (!operations.length) return null;

    // Do not hijack unrelated requests such as "turn off my computer".
    const hasDeviceNoun = words.some(word => deviceTypeWords.has(word));
    const compactText = words.join('');
    const hasFullDeviceName = knownDevices.some(device => {
      const compactName = wordsOf(device.name).join('');
      return compactName.length >= 3 && compactText.includes(compactName);
    });
    if (!hasDeviceNoun && !hasFullDeviceName) return null;
    if (operations.length > 1) {
      return { error: 'Please give me one on or off command at a time.' };
    }

    const descriptors = words.filter(word => !commandWords.has(word));
    const matching = knownDevices.filter(device => {
      const aliases = aliasesOf(device);
      return descriptors.every(word => aliases.has(word));
    });
    if (matching.length === 1) return { device: matching[0], action: operations[0] };
    if (matching.length === 0) {
      return {
        error: "I don't know that light yet. The configured plugs are: " +
          knownDevices.map(device => device.name).join(', ') + '.'
      };
    }
    return {
      error: 'Which light? Say the name of one plug: ' +
        matching.map(device => device.name).join(', ') + '.'
    };
  }

  // Export only the pure matcher for offline regression tests.
  // This function cannot operate plugs on its own.
  window.mekResolveDeviceCommand = resolveDeviceCommand;

  // This is called from the existing chat/voice path BEFORE the remote AI.
  // Device actions are deterministic; no LLM receives a device-control capability.
  window.mekSmartHomeIntent = async function (input) {
    // Recognize the intent before opening a connection, so unrelated chat
    // requests still go to the AI rather than the smart-home controller.
    const preliminary = resolveDeviceCommand(input, devices);
    if (preliminary === null) {
      // When we have not connected yet, a device-name-only phrase like
      // "turn on Growlight" is not recognizable. A standard "light" phrase
      // can still trigger the controller connection.
      const pendingWords = wordsOf(input);
      if (connected || !/\b(turn|switch|power)\b/.test(pendingWords.join(' ')) ||
          !pendingWords.some(word => deviceTypeWords.has(word)) ||
          !pendingWords.some(word => word === 'on' || word === 'off')) {
        return null;
      }
    }
    if (!connected) {
      const ready = await connect();
      if (!ready) return 'Home control is unavailable. ' + message.textContent;
    }
    const parsed = resolveDeviceCommand(input, devices);
    if (parsed === null) return null;
    if (parsed.error) return parsed.error;

    try {
      const result = await request('/v1/devices/' +
        encodeURIComponent(parsed.device.id) + '/' + parsed.action, 'POST');
      report(parsed.device.name + ' switched ' + result.state + '.', true);
      void loadStates();
      return result.name + ' is now ' + result.state + '.';
    } catch (error) {
      report(error.message, connected);
      return 'I could not control ' + device.name + '. ' + error.message;
    }
  };
})();

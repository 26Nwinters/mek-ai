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

  // This is called from the existing chat/voice path BEFORE the remote AI.
  // Device actions are deterministic; no LLM receives a device-control capability.
  window.mekSmartHomeIntent = async function (input) {
    const text = String(input || '').toLowerCase().replace(/[^\w\s-]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!/\b(turn|switch|power)\b/.test(text) || !/\b(lights?|lamps?|plugs?|outlets?)\b/.test(text)) {
      return null;
    }
    const operations = Array.from(new Set((text.match(/\b(on|off)\b/g) || [])));
    if (!operations.length) return null;
    if (operations.length > 1) return 'Please give me one on or off command at a time.';

    if (!connected) {
      const ready = await connect();
      if (!ready) return 'Home control is unavailable. ' + message.textContent;
    }
    const stopWords = new Set([
      'turn', 'switch', 'power', 'on', 'off', 'my', 'the', 'a', 'an', 'all',
      'mecha', 'mek', 'ai', 'please', 'can', 'could', 'would', 'you', 'i',
      'want', 'to', 'for', 'in', 'of', 'and', 'it', 'that', 'this', 'home',
      'light', 'lights', 'lamp', 'lamps', 'plug', 'plugs', 'outlet', 'outlets'
    ]);
    const descriptors = text.split(/\s+/).filter(word => word && !stopWords.has(word));
    const matching = devices.filter(device => {
      const deviceWords = device.name.toLowerCase().split(/[^a-z0-9]+/);
      return descriptors.every(word => deviceWords.includes(word));
    });

    let device = null;
    if (matching.length === 1) {
      device = matching[0];
    } else if (!descriptors.length && devices.length === 1) {
      device = devices[0];
    } else if (!matching.length) {
      return "I don't know that light yet. The configured plugs are: " + devices.map(d => d.name).join(', ') + '.';
    } else {
      return 'Which light? Say the name of one plug: ' + matching.map(d => d.name).join(', ') + '.';
    }

    try {
      const result = await request('/v1/devices/' + encodeURIComponent(device.id) + '/' + operations[0], 'POST');
      report(device.name + ' switched ' + result.state + '.', true);
      void loadStates();
      return result.name + ' is now ' + result.state + '.';
    } catch (error) {
      report(error.message, connected);
      return 'I could not control ' + device.name + '. ' + error.message;
    }
  };
})();

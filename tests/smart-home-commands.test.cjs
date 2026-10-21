/* Run with Node.js 18+: node --test tests/smart-home-commands.test.cjs */
'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '..', 'smart-home.js'), 'utf8');
const devices = [
  { id: 'bedroom-lamp', name: 'Bedroom Lamp' },
  { id: 'growlight', name: 'Growlight' },
  { id: 'couch-lamp', name: 'Couch Lamp' }
];

function buildMatcher() {
  const window = {};
  const elements = new Map();
  const element = id => {
    if (!elements.has(id)) {
      elements.set(id, {
        value: '',
        textContent: '',
        classList: { toggle() {} },
        addEventListener() {},
        replaceChildren() {},
        append() {},
        querySelectorAll() { return []; }
      });
    }
    return elements.get(id);
  };
  vm.runInNewContext(source, {
    window,
    document: { getElementById: element },
    localStorage: { getItem() { return null; } }
  }, { timeout: 1000 });
  return window.mekResolveDeviceCommand;
}

test('actual speech-transcription examples resolve to the right plugs', () => {
  const resolve = buildMatcher();
  const examples = [
    ['hey Mecca turn off bedroom lights', 'bedroom-lamp', 'off'],
    ['hey Mecca turn off bedroom lamp', 'bedroom-lamp', 'off'],
    ['hey Mecca turn on grow light', 'growlight', 'on']
  ];
  for (const [command, deviceId, action] of examples) {
    const matched = resolve(command, devices);
    assert.equal(matched?.device?.id, deviceId, command);
    assert.equal(matched?.action, action, command);
  }
});

test('standard names, shorthand and speech variants', () => {
  const resolve = buildMatcher();
  for (const [command, id, action] of [
    ['Mecha please turn ON Growlight', 'growlight', 'on'],
    ['switch off the couch lamps', 'couch-lamp', 'off'],
    ['please turn off my bedroom light', 'bedroom-lamp', 'off'],
    ['MEK turn on the couch outlet', 'couch-lamp', 'on'],
    ['hey Meka turn the bedroom lamp off', 'bedroom-lamp', 'off'],
    ['please turn on my grow lights', 'growlight', 'on']
  ]) {
    assert.equal(resolve(command, devices)?.device?.id, id, command);
    assert.equal(resolve(command, devices)?.action, action, command);
  }
});

test('ambiguous or multi-action requests never silently control all plugs', () => {
  const resolve = buildMatcher();
  assert.match(resolve('turn off the lights', devices).error, /which light/i);
  assert.match(resolve('turn off bedroom lamp and turn on couch lamp', devices).error, /one on or off/i);
});

test('unrelated requests are not hijacked by smart-home intent handler', () => {
  const resolve = buildMatcher();
  assert.equal(resolve('turn off my computer', devices), null);
  assert.equal(resolve('tell me about turning on lights', devices), null);
  assert.equal(resolve('what is the weather like', devices), null);
});

test('unknown lights produce an explicit list, never choose at random', () => {
  const resolve = buildMatcher();
  assert.match(resolve('turn on kitchen lights', devices).error, /configured plugs/i);
});

test('a device noun can trigger connection before devices are loaded', () => {
  const resolve = buildMatcher();
  assert.notEqual(resolve('turn on grow light', []), null);
  assert.notEqual(resolve('turn on growlight', []), null);
});

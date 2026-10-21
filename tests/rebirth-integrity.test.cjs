/* MEK-AI / The Hideaway regression guards.
   Run: node --test tests/*.test.cjs
   All checks run offline and do not need credentials or hardware. */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname,'..');
const read = file => fs.readFileSync(path.join(root,file),'utf8');
const html = read('index.html');
const base = read('mek-rebirth.js');
const style = read('mek-atelier.css');
const view = read('mek-atelier.js');
const home = read('smart-home.js');
const sw = read('sw.js');

test('retains authentication, assistant, wake word and original smart-home controls',()=>{
 for(const id of ['authGate','authForm','authPassword','mekApp','eye','chatForm',
   'voiceInput','voiceStatus','mainTalk','ambientTalk','ambientDashboard',
   'smartHomePanel','smartToken','smartDevices','saveSettings','voiceToggle',
   'timerList','reminderList','memoryList','ambientModal','ambientFaceSlot',
   'weatherPanelContent','ambientReminders']){
   assert.match(html,new RegExp('id="'+id+'"'),id+' remains present');
 }
 for(const code of ['supabase.createClient','startHandsFreeCapture','setFace(',
   'handsFreeVoice','smart-home.js','mekSmartHomeIntent']){
   assert.ok(html.includes(code),code+' is preserved');
 }
});
test('loads the final illustrated console, without resurrecting the old renderer',()=>{
 assert.match(html,/href="\/mek-ai\/mek-rebirth\.css"/);
 assert.match(html,/href="\/mek-ai\/mek-atelier\.css"/);
 assert.match(html,/src="\/mek-ai\/mek-rebirth\.js"/);
 assert.match(html,/src="\/mek-ai\/mek-atelier\.js"/);
 assert.doesNotMatch(html,/src="\/mek-ai\/mek-hideaway\.js"/);
 assert.doesNotMatch(html,/src="\/mek-ai\/mek-avatar3d\.js"/);
 assert.match(base,/mek-face-state/);
 assert.match(view,/mek-face-state/);
});
test('all first-party JavaScript and embedded app scripts parse',()=>{
 for(const source of [base,view,home,sw]){
  assert.doesNotThrow(()=>new Function(source));
 }
 const snippets=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x=>x[1]);
 assert.ok(snippets.length>0);
 for(const script of snippets)assert.doesNotThrow(()=>new Function(script));
});
test('illustration, expression sheets, live data and real controls are wired',()=>{
 for(const asset of ['Sunlit%20Overgrown%20Industrial%20Workshop.png',
   'Curious%20Amber-Eyed%20Hooded%20Android.png',
   'Robot%20Hoodie%20Expression%20Sticker%20Sheet.png',
   'Kawaii%20Raccoon%20Expression%20Sticker%20Sheet.png']){
   assert.ok(style.includes(asset)||view.includes(asset),asset+' is referenced');
 }
 assert.match(style,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
 assert.match(view,/smart-device-state/);
 assert.match(view,/\.smart-device-actions button/);
 assert.match(view,/\.click\(\)/);
 assert.match(view,/aria-checked/);
 assert.match(view,/MutationObserver/);
 assert.match(view,/atTranscript/);
 assert.match(view,/atTalkButton/);
 assert.doesNotMatch(view,/fetch\(['"]http/);
});
test('PWA shell version tracks the final files and avoids caching secrets',()=>{
 for(const asset of ['mek-rebirth.css','mek-rebirth.js','mek-atelier.css','mek-atelier.js','smart-home.js']){
  assert.ok(sw.includes(asset),asset+' in shell');
 }
 assert.doesNotMatch(sw,/mek-hideaway\.js|mek-avatar3d\.js/);
 assert.match(sw,/k\.startsWith\('mek-ai-'\)/);
 assert.doesNotMatch(sw,/keys\.filter\(k=>k!==CACHE\)/);
});
test('sensitive credentials and local controller endpoints stay in existing code only',()=>{
 for(const source of [view,style]){
  assert.doesNotMatch(source,/sb_secret_|sk-[A-Za-z0-9]{12}/);
  assert.doesNotMatch(source,/https?:\/\/127\.0\.0\.1|https?:\/\/localhost/);
 }
 assert.match(home,/127\.0\.0\.1:8765/);
 assert.match(home,/mekai:local-controller-token/);
});

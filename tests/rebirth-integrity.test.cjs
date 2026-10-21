/* Regression guards for the MEK-AI Rebirth visual update.
   Run: node --test tests/rebirth-integrity.test.cjs
   No external dependencies, tokens, browser automation, or device access required. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const base=path.join(__dirname,'..');
const read=name=>fs.readFileSync(path.join(base,name),'utf8');
const html=read('index.html');
const css=read('mek-rebirth.css');
const client=read('mek-rebirth.js');
const three=read('mek-avatar3d.js');
const sw=read('sw.js');

test('keeps critical functioning controls and auth IDs',()=>{
 for(const id of ['authGate','authForm','authPassword','mekApp','eye','chatForm','voiceInput',
   'mainTalk','ambientTalk','ambientDashboard','smartHomePanel','smartToken','smartDevices',
   'saveSettings','voiceToggle','timerList','reminderList','memoryList']){
  assert.match(html,new RegExp('id="'+id+'"'),id+' must remain present');
 }
 assert.match(html,/supabase\.createClient/);
 assert.match(html,/setFace\(/);
 assert.match(html,/handsFreeVoice/);
 assert.match(html,/startHandsFreeCapture/);
 assert.match(html,/smart-home\.js/);
});
test('loads redesigned styles and graphics after existing scripts',()=>{
 assert.match(html,/href="\/mek-ai\/mek-rebirth\.css"/);
 assert.match(html,/src="\/mek-ai\/mek-rebirth\.js"/);
 assert.match(html,/type="module" src="\/mek-ai\/mek-avatar3d\.js"/);
 assert.match(html,/cdn\.jsdelivr\.net\/npm\/gsap@/);
 assert.match(html,/mek-rebirth\.js/);
 assert.match(css,/\.mek-3d-ready/);
 assert.match(css,/body\.ambient-mode #ambientDashboard/);
 assert.match(client,/MutationObserver/);
 assert.match(client,/mek-face-state/);
 assert.match(three,/webglcontextlost/);
});
test('all first-party JavaScript is syntactically valid',()=>{
 const snippets=[...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x=>x[1]);
 assert.ok(snippets.length>0);
 for(const snippet of snippets)assert.doesNotThrow(()=>new Function(snippet));
 assert.doesNotThrow(()=>new Function(client));
 assert.doesNotThrow(()=>new Function(three.replace(/import \* as THREE from '[^']+';/,'const THREE = {};')));
 assert.doesNotThrow(()=>new Function(sw));
});
test('PWA caches the new first-party assets and avoids deleting unrelated site caches',()=>{
 for(const asset of ['mek-rebirth.css','mek-rebirth.js','mek-avatar3d.js','smart-home.js']){
  assert.ok(sw.includes(asset));
 }
 assert.match(sw,/k\.startsWith\('mek-ai-'\)/);
 assert.doesNotMatch(sw,/keys\.filter\(k=>k!==CACHE\)/);
});
test('visual enhancement does not hardcode user secrets or change controller endpoints',()=>{
 assert.doesNotMatch(client,/sb_secret_|sk-[A-Za-z0-9]{12}/);
 assert.doesNotMatch(three,/sb_secret_|sk-[A-Za-z0-9]{12}/);
 assert.doesNotMatch(client,/https?:\/\/127\.0\.0\.1|https?:\/\/localhost/);
});

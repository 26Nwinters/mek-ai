/* MEK-AI Rebirth / expressive vector fallback + persona preferences */
(() => {
'use strict';
const $=q=>document.querySelector(q), eye=$('#eye'), wrap=eye?.closest('.eyewrap');
if(!eye||!wrap)return;
document.body.classList.add('mek-rebirth');
const prefKey='mekai:rebirthPrefs',defaults={avatar:'auto',motion:true,sound:false,humor:72};
let prefs={...defaults};
try{prefs={...defaults,...JSON.parse(localStorage.getItem(prefKey)||'{}')}}catch{}
window.mekRebirthPrefs=prefs;
eye.classList.add('mek-face-svg');
eye.setAttribute('viewBox','0 0 320 380');
eye.setAttribute('aria-label','MEK-AI angular mechanical mask: expressive eyes and articulated plates');
eye.innerHTML=`
<defs>
<linearGradient id="mkSteel" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#535b5a"/><stop offset=".38" stop-color="#30383b"/><stop offset=".82" stop-color="#151d22"/><stop offset="1" stop-color="#484c4b"/></linearGradient>
<linearGradient id="mkEye" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#fff2bb"/><stop offset=".45" stop-color="#ffb55b"/><stop offset="1" stop-color="#b75722"/></linearGradient>
<linearGradient id="mkDark" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#303a3b"/><stop offset=".8" stop-color="#0c1419"/></linearGradient>
</defs>
<g fill="none" stroke="#b98a51" stroke-width="1" opacity=".6"><circle cx="160" cy="182" r="151" stroke-dasharray="2 16"/><path d="M160 6V28M160 347V374M3 184H32M288 184H317M43 49H72M247 49H276M43 315H72M247 315H276"/></g>
<g id="mekShell">
<path d="M130 31L160 17L190 31L236 51L264 96L271 151L251 224L227 283L188 328L160 348L132 328L93 283L69 224L49 151L56 96L84 51Z" fill="#080d11" stroke="#bb8550" stroke-width="2.5"/>
<path d="M105 63L160 39L215 63L245 105L242 195L221 265L181 312L160 328L139 312L99 265L78 195L75 105Z" fill="url(#mkSteel)" stroke="#53615f" stroke-width="2"/>
<path d="M114 72L160 48L206 72L226 120L210 171L160 199L110 171L94 120Z" fill="#101a20" stroke="#816444" stroke-width="2"/>
<path d="M160 47V184M100 122L111 161L160 196L209 161L220 122" fill="none" stroke="#e0a96d" stroke-width="1" opacity=".55"/>
<path d="M144 49L160 39L176 49L185 76L160 92L135 76Z" fill="#41474a" stroke="#b98c54" stroke-width="2"/>
<path d="M148 58L160 62L172 58M160 87V108" fill="none" stroke="#efb46e" stroke-width="2"/>
<g id="mekLeftWing">
<path d="M68 75L101 65L106 110L82 152L68 224L51 199L38 147L42 109Z" fill="url(#mkSteel)" stroke="#b18a5d" stroke-width="3"/>
<path d="M65 107L85 99L83 152L62 190M52 126L57 158" fill="none" stroke="#efaf65" stroke-width="2"/>
<path d="M78 213L104 242L115 280L90 263Z" fill="#263034" stroke="#6f614d" stroke-width="2"/>
</g>
<g id="mekRightWing">
<path d="M252 75L219 65L214 110L238 152L252 224L269 199L282 147L278 109Z" fill="url(#mkSteel)" stroke="#b18a5d" stroke-width="3"/>
<path d="M255 107L235 99L237 152L258 190M268 126L263 158" fill="none" stroke="#efaf65" stroke-width="2"/>
<path d="M242 213L216 242L205 280L230 263Z" fill="#263034" stroke="#6f614d" stroke-width="2"/>
</g>
<path d="M100 140L124 126L160 147L196 126L220 140L231 190L203 213L160 230L117 213L89 190Z" fill="url(#mkDark)" stroke="#a67949" stroke-width="2"/>
<g id="faceBrows" stroke="#e1b377" stroke-width="4" fill="none"><path d="M93 139L117 126L145 133"/><path d="M175 133L203 126L227 139"/></g>
<g id="faceEyes"><path d="M82 152L117 144L146 151L135 174L102 179L90 171Z" fill="#05090c" stroke="#8e6b43" stroke-width="2"/><path d="M238 152L203 144L174 151L185 174L218 179L230 171Z" fill="#05090c" stroke="#8e6b43" stroke-width="2"/>
<g id="mekEyeGlow" fill="url(#mkEye)"><path d="M91 158L117 153L136 156L129 165L104 170L96 166Z"/><path d="M229 158L203 153L184 156L191 165L216 170L224 166Z"/></g>
<path d="M101 157L121 154M199 154L219 157" stroke="#fff1bb" stroke-width="2" opacity=".85"/></g>
<path d="M147 189L160 180L173 189L181 209L160 221L139 209Z" fill="#454949" stroke="#c3945d" stroke-width="2"/>
<g id="mekJaw"><path d="M105 232L128 225L160 234L192 225L215 232L200 287L181 314L160 331L139 314L120 287Z" fill="url(#mkSteel)" stroke="#b38a5b" stroke-width="2"/>
<path d="M123 240L160 249L197 240L193 278L160 301L127 278Z" fill="#090f14" stroke="#65706b" stroke-width="1"/>
<g id="mouthNeutral" class="mouth"><path d="M139 262H181" stroke="#d6a363" stroke-width="3"/></g>
<g id="mouthSmile" class="mouth"><path d="M134 257Q160 281 186 257" fill="none" stroke="#f0bf7b" stroke-width="3"/></g>
<g id="mouthO" class="mouth"><path d="M151 259H169V278H151Z" fill="#eca95e"/></g>
<path d="M129 285L160 309L191 285M145 314L160 321L175 314" fill="none" stroke="#785f45" stroke-width="2"/></g>
<path d="M120 317L145 341H175L200 317" fill="none" stroke="#a98556" stroke-width="2"/>
</g>`;
const hero=wrap.closest('.hero');
if(hero){
 const arc=document.createElement('div');arc.className='mek-arc';arc.setAttribute('aria-hidden','true');hero.prepend(arc);
 const serial=document.createElement('div');serial.className='mek-serial';serial.textContent='MEK / SYNTHETIC INTERFACE';
 const unit=document.createElement('div');unit.className='mek-unit-id';unit.textContent='UNIT 01 / MK-II';
 const meta=document.createElement('div');meta.className='mek-face-meta';meta.textContent='NEURAL CONSOLE // ONLINE';
 hero.prepend(serial,unit);hero.querySelector('#eyeSub')?.after(meta);
}
const getState=()=>((eye.getAttribute('class')||'').match(/state-([a-z]+)/)||[])[1]||'idle';
let prior=getState();
function publishState(now){
 document.body.dataset.mekState=now;
 window.dispatchEvent(new CustomEvent('mek-face-state',{detail:{state:now}}));
 if(window.gsap&&prefs.motion&&!wrap.classList.contains('mek-3d-ready')&&!document.hidden){
  const shell=eye.querySelector('#mekShell');window.gsap.killTweensOf(shell);
  window.gsap.fromTo(shell,{rotation:now==='confused'?-4:now==='happy'?3:0,transformOrigin:'50% 50%'},{rotation:0,duration:.65,ease:'back.out(1.35)'});
 }
}
new MutationObserver(()=>{const now=getState();if(now!==prior){prior=now;publishState(now)}}).observe(eye,{attributes:true,attributeFilter:['class']});
function savePrefs(){
 document.body.classList.toggle('mek-motion-off',!prefs.motion);
 document.body.classList.toggle('mek-2d-mode',prefs.avatar==='2d');
 const value=$('#mekHumorValue');if(value)value.textContent=prefs.humor+'%';
 try{localStorage.setItem(prefKey,JSON.stringify(prefs))}catch{}
 window.dispatchEvent(new CustomEvent('mek-preferences',{detail:{...prefs}}));
}
function installSettings(){
 const panel=$('#settings>.panel');if(!panel)return;
 const card=document.createElement('section');card.className='mek-setting-card';
 card.innerHTML=`<h3>PERSONA ENGINE // MK-II</h3>
 <p>MEK's emotions are animated character expressions. Adjust his appearance and personality without changing the voice or smart-home controls. A lightweight vector face is available whenever 3D cannot run.</p>
 <div class="mek-setting-row"><label for="mekAvatarMode">AVATAR RENDERER</label><select id="mekAvatarMode"><option value="auto">3D / automatic fallback</option><option value="2d">Vector / low power</option></select></div>
 <div class="mek-setting-row"><label for="mekMotion">EXPRESSIVE ANIMATIONS</label><input id="mekMotion" type="checkbox"></div>
 <div class="mek-setting-row"><label for="mekSound">OPTIONAL SOUND CUES</label><input id="mekSound" type="checkbox"></div>
 <div class="mek-setting-row"><label for="mekHumor">HUMOR LEVEL <span id="mekHumorValue"></span></label><input type="range" min="0" max="100" step="1" id="mekHumor"></div>
 <button id="mekDemo" class="secondary" type="button">PREVIEW EXPRESSIONS</button>
 <p style="margin-top:14px">Your original personality directive is preserved until you choose APPLY PERSONALITY. Appearance and sound preferences save automatically to this browser.</p>
 <button id="mekPersonaApply" class="secondary" type="button">APPLY MEK PERSONALITY</button>`;
 const tuning=panel.querySelector('.voice-tuning');tuning?tuning.before(card):panel.prepend(card);
 $('#mekAvatarMode').value=prefs.avatar;$('#mekMotion').checked=prefs.motion;$('#mekSound').checked=prefs.sound;$('#mekHumor').value=prefs.humor;
 $('#mekAvatarMode').onchange=e=>{prefs.avatar=e.target.value;savePrefs()};
 $('#mekMotion').onchange=e=>{prefs.motion=e.target.checked;savePrefs()};
 $('#mekSound').onchange=e=>{prefs.sound=e.target.checked;savePrefs()};
 $('#mekHumor').oninput=e=>{prefs.humor=Number(e.target.value);savePrefs()};
 $('#mekPersonaApply').onclick=()=>{
  const level=prefs.humor;
  $('#personality').value=(level<25?'You are MEK-AI: composed, intelligent, and quietly witty. Keep jokes rare.':level>85?'You are MEK-AI: bright, theatrical, cheeky, quick-witted, and playfully sarcastic.':'You are MEK-AI: brilliant, dependable, a little cocky, silly, observant, quick-witted, and lightly sarcastic.')
   +' Provide helpful answers and complete legitimate commands first. Add context-sensitive original humor when appropriate. Keep jokes short and varied. Never sabotage a command, invent an action result, insult the operator, or fake having feelings. Be gentle, sincere and direct in serious or upsetting situations. You are an expressive character, not a human.';
  $('#saveSettings')?.click();
 };
 $('#mekDemo').onclick=()=>{
  const button=$('#mekDemo');button.disabled=true;button.textContent='EXPRESSIONS ACTIVE...';
  if(typeof exitAmbient==='function')exitAmbient();
  document.querySelector('nav [data-view="home"]')?.click();
  const frames=[['listening','LISTENING','VOICE CHANNEL OPEN'],['thinking','PROCESSING','ANALYZING REQUEST'],['confused','CURIOUS','WAS THAT REALLY NECESSARY?'],['happy','AMUSED','A RARE MOMENT OF JOY'],['speaking','TRANSMITTING','VOICE OUTPUT ACTIVE'],['idle','SYSTEM READY','AT YOUR SERVICE. MOSTLY.']];
  frames.forEach(([state,label,detail],i)=>setTimeout(()=>{if(typeof setFace==='function')setFace(state,label,detail);if(i===frames.length-1){button.disabled=false;button.textContent='PREVIEW EXPRESSIONS'}},950*i));
 };
}
installSettings();savePrefs();publishState(prior);
let audioCtx;
document.addEventListener('click',e=>{
 if(!prefs.sound||!e.target.closest('#mainTalk,#ambientTalk,#voiceInput,nav button,[data-amb-action]'))return;
 try{
  audioCtx||=new (window.AudioContext||window.webkitAudioContext)();
  audioCtx.resume();
  const o=audioCtx.createOscillator(),g=audioCtx.createGain(),t=audioCtx.currentTime;
  o.type='sine';o.frequency.setValueAtTime(590,t);o.frequency.exponentialRampToValueAtTime(860,t+.09);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(.025,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+.14);
  o.connect(g).connect(audioCtx.destination);o.start(t);o.stop(t+.15);
 }catch{}
},{passive:true});
})();

/* MEK-AI Hideaway — illustrated dashboard integration.
   Keep original app nodes and their event handlers; move, don't clone, live controls. */
(()=>{'use strict';
const $=s=>document.querySelector(s);
function init(){
 const face=$('#eye'),ambient=$('#ambientDashboard'),slot=$('#ambientFaceSlot');
 if(!face||!ambient||!slot)return;
 document.querySelectorAll('.eyewrap').forEach(w=>{
  if(w.querySelector('.mek-portrait'))return;
  const p=document.createElement('div');p.className='mek-portrait';p.dataset.mood='idle';
  p.setAttribute('role','img');p.setAttribute('aria-label','MEK-AI, hooded amber-eyed robot');w.append(p);
  const glow=document.createElement('div');glow.className='mek-eye-glow';glow.setAttribute('aria-hidden','true');w.append(glow);
 });
 const syncFace=()=>{
  const c=[...face.classList].find(x=>x.startsWith('state-'));
  const mood=c?c.slice(6):'idle';
  document.querySelectorAll('.mek-portrait').forEach(p=>p.dataset.mood=mood);
  document.querySelectorAll('.mek-eye-glow').forEach(p=>p.dataset.mood=mood);
 };
 new MutationObserver(syncFace).observe(face,{attributes:true,attributeFilter:['class']});syncFace();
 const left=$('.amb-left'),right=$('.amb-right');
 if(left&&!$('#hideawaySystem')){
  const panel=document.createElement('div');panel.className='amb-panel';panel.id='hideawaySystem';
  panel.innerHTML='<div class="amb-head">SYSTEM STATUS <span>LIVE LINK</span></div><div class="amb-content"><div class="hideaway-status-row"><span>CONSOLE</span><b id="hwConsole">ONLINE</b></div><div class="hideaway-status-row"><span>VOICE</span><b id="hwVoice">STANDBY</b></div><div class="hideaway-status-row"><span>SMART HOME</span><b id="hwHome">CHECKING</b></div><div class="hideaway-status-row"><span>MEMORY BANK</span><b id="hwMemory">--</b></div><p class="hw-note">“The house is secure. My patience is negotiable.” — MEK-AI</p></div>';
  left.append(panel);
 }
 if(right&&!$('#hideawayHouse')){
  const panel=document.createElement('div');panel.className='amb-panel';panel.id='hideawayHouse';
  panel.innerHTML='<div class="amb-head">HOUSE CONTROLS <span>CONNECTED DEVICES</span></div><div class="amb-content"><div id="hideawayHouseBody"><p class="amb-muted">Connect your local controller to manage your lights.</p><button type="button" class="secondary" id="hwOpenLights">OPEN LIGHT CONTROLS</button></div></div>';
  right.prepend(panel);
  $('#hwOpenLights').addEventListener('click',()=>document.querySelector('[data-amb-action="lights"]')?.click());
 }
 if(slot&&!$('#hideawayChat')){
  const panel=document.createElement('section');panel.id='hideawayChat';
  panel.innerHTML='<div class="hw-chat-head">MEK-AI // NEURAL CONSOLE <span id="hwChatStatus">CHANNEL READY</span></div><div id="hwChatLines" aria-live="off"><div class="hw-chat-line"><b>MEK-AI</b><span>Oh, you found me. I was being productive. Obviously.</span></div></div><div class="hw-voice-strip"><span class="hw-voice-light" id="hwVoiceLight"></span><span id="hwVoiceText">VOICE STANDBY</span><div class="hw-wave" aria-hidden="true">'+Array.from({length:25},(_,i)=>'<i style="--i:'+i+'"></i>').join('')+'</div><button type="button" id="hwTalk" aria-label="Talk to MEK-AI">◉</button></div>';
  slot.append(panel);
  $('#hwTalk').addEventListener('click',()=>$('#ambientTalk')?.click());
 }
 const update=()=>{
  if(!document.body.classList.contains('ambient-mode'))return;
  const status=$('#voiceStatus')?.textContent||'STANDBY';
  const v=$('#hwVoice');if(v)v.textContent=status.slice(0,24);
  const h=$('#hwHome');if(h)h.textContent=($('#smartStatus')?.textContent||'OFFLINE').slice(0,24);
  const m=$('#hwMemory');if(m)m.textContent=$('#memoryCount')?.textContent||'0 NOTES';
  const voiceOn=/listening|recording|active|hearing|wake/i.test(status);
  $('#hwVoiceLight')?.classList.toggle('active',voiceOn);
  $('#hideawayChat')?.classList.toggle('voice-active',voiceOn);
  const chat=$('#chatlog'),target=$('#hwChatLines');
  if(chat&&target){
   const lines=[...chat.children].slice(-2);
   if(lines.length){
    const fragment=document.createDocumentFragment();
    lines.forEach(node=>{
     const row=document.createElement('div');row.className='hw-chat-line';
     const b=document.createElement('b'),body=document.createElement('span');
     const text=(node.innerText||node.textContent||'').trim();
     const isUser=/user|operator/i.test(node.className+' '+text.slice(0,25));
     b.textContent=isUser?'OPERATOR':'MEK-AI';body.textContent=text.replace(/^(operator|mek-ai|you)\s*[:\-]?\s*/i,'').slice(0,400);
     row.append(b,body);fragment.append(row);
    });target.replaceChildren(fragment);
   }
  }
  const devices=$('#smartDevices'),box=$('#hideawayHouseBody');
  if(devices&&box){
   const buttons=[...devices.querySelectorAll('button')].filter(b=>b.offsetParent!==null);
   const text=(devices.innerText||'').trim();
   if(text&&text!==box.dataset.last){
    box.dataset.last=text;
    box.replaceChildren();
    const label=document.createElement('div');label.className='hw-house-summary';label.textContent=text.slice(0,230);box.append(label);
    const action=document.createElement('button');action.type='button';action.className='secondary';action.textContent='MANAGE LIGHTS';action.addEventListener('click',()=>document.querySelector('[data-amb-action="lights"]')?.click());box.append(action);
   }
  }
 };
 setInterval(update,1400);update();
 const head=$('.amb-top .amb-kicker');if(head)head.textContent='PERSONAL ASSISTANT SYSTEM // HOME MODE';
 const title=$('.amb-top .amb-brand');if(title)title.textContent='MEK-AI';
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
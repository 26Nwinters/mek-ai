/* MEK-AI / The Hideaway — illustration-driven view layer.
   Existing authentication, requests, wake word, reminders and light actions stay authoritative.
   This module never invents device state or sends controller requests itself. */
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const esc = value => String(value == null ? '' : value);
  const iconPaths = {
    timer: '<circle cx="12" cy="13" r="8"/><path d="M12 8v5l3 2M9 2h6"/>',
    reminder: '<rect x="4" y="5" width="16" height="16" rx="1"/><path d="M8 2v6M16 2v6M4 10h16M8 14h2M14 14h2M8 18h2"/>',
    weather: '<path d="M12 2v2m0 16v2M4 12H2m20 0h-2M5 5l2 2m10 10 2 2M19 5l-2 2M7 17l-2 2"/><circle cx="12" cy="12" r="4"/>',
    memory: '<path d="M8 4a3 3 0 0 0-4 4 3 3 0 0 0 0 5 3 3 0 0 0 4 6c2 0 4-2 4-4V7c0-2-2-4-4-3Zm8 0a3 3 0 0 1 4 4 3 3 0 0 1 0 5 3 3 0 0 1-4 6c-2 0-4-2-4-4V7c0-2 2-4 4-3Z"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M10 2h4l.6 2.8 2.4 1.4 2.7-1.1 2 3.4-2.2 1.8v2.8l2.2 1.8-2 3.4-2.7-1.1-2.4 1.4L14 22h-4l-.6-2.8L7 17.8l-2.7 1.1-2-3.4 2.2-1.8v-2.8L2.3 9l2-3.4L7 6.7l2.4-1.4Z"/>',
    voice: '<rect x="9" y="3" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4m-4 0h8"/>',
    chat: '<path d="M4 5h16v12H9l-5 4Z"/><circle cx="8" cy="11" r=".7"/><circle cx="12" cy="11" r=".7"/><circle cx="16" cy="11" r=".7"/>',
    lights: '<path d="M8 15a7 7 0 1 1 8 0c-1 1-2 2-2 4h-4c0-2-1-3-2-4ZM10 22h4M9 19h6"/>',
    sleep: '<path d="M19 16.4A8 8 0 0 1 7.6 5a8 8 0 1 0 11.4 11.4Z"/><path d="m17 4 2-2m-2 0 2 2"/>'
  };
  const svgIcon = name => '<svg viewBox="0 0 24 24" aria-hidden="true" width="21" height="21" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + (iconPaths[name] || iconPaths.chat) + '</svg>';
  const make = (tag, className, parent) => {
    const node = document.createElement(tag); if (className) node.className = className;
    if (parent) parent.append(node); return node;
  };

  function init() {
    const dashboard = $('#ambientDashboard'), slot = $('#ambientFaceSlot'),
      head = dashboard && dashboard.querySelector('.amb-top'),
      left = dashboard && dashboard.querySelector('.amb-left'),
      right = dashboard && dashboard.querySelector('.amb-right'),
      eye = $('#eye'), wrap = eye && eye.closest('.eyewrap');
    if (!dashboard || !slot || !head || !left || !right || !eye || !wrap) return;

    // Toolbar buttons follow the real existing actions, not artificial screens.
    const originalCaption = head.querySelector('.amb-top>.amb-kicker');
    if (originalCaption) originalCaption.remove();
    const subline = head.querySelector('.amb-kicker');
    if (subline) subline.textContent = 'PERSONAL ASSISTANT SYSTEM // HOME MODE';
    const tabs = make('div', 'atelier-tabs', head);
    for (const [label, action] of [
      ['CONSOLE','console'], ['HOUSE','house'], ['TOOLS','timer'],
      ['MEMORY','memory'], ['SETTINGS','settings']
    ]) {
      const b = make('button', action === 'console' ? 'active' : '', tabs);
      b.type = 'button'; b.textContent = label;
      b.setAttribute('aria-label', label === 'TOOLS' ? 'Open timer and utility tools' : 'Open '+label.toLowerCase());
      b.addEventListener('click', () => {
        if (action === 'console') {
          document.querySelector('#atelierComms')?.scrollIntoView({block:'nearest',behavior:'smooth'});
        } else if (action === 'house') {
          const home = $('#atelierHousePanel');
          home?.scrollIntoView({block:'nearest',behavior:'smooth'});
          const switchEl = home?.querySelector('.at-switch:not(:disabled)');
          if (switchEl) switchEl.focus({preventScroll:true});
          else home?.querySelector('.at-house-empty button')?.focus({preventScroll:true});
        } else {
          dashboard.querySelector('[data-amb-action="'+action+'"]')?.click();
        }
      });
    }
    const conn = make('div', 'atelier-connection', head);
    conn.innerHTML = '<div><span class="at-live"></span><b>ONLINE</b> // HOME MODE</div><div class="at-small">USER SESSION // LOCAL CONSOLE</div>';

    // Preserve original state-bearing SVG in the DOM; only replace its artwork.
    // The same state changes still drive voice feedback throughout the app.
    // Mount the artwork in the SCENE, not inside the old SVG face wrapper.
    // The old wrapper can collapse to zero height when its contents are absolute.
    // Keep a separate portrait inside the standard dashboard's face container.
    const avatar = make('div', 'at-avatar at-stage-avatar', slot);
    const inlineAvatar = make('div', 'at-avatar at-inline-avatar', wrap);
    const portraitUrl = '/mek-ai/ASSETS/Curious%20Amber-Eyed%20Hooded%20Android.png';
    for (const target of [avatar, inlineAvatar]) {
      target.dataset.mood = 'idle';
      const portrait = make('img', '', target);
      portrait.alt = 'MEK-AI, the amber-eyed robot in his worn hooded jacket';
      portrait.src = portraitUrl;
      portrait.loading = 'eager'; portrait.decoding = 'async';
      make('div', 'at-avatar-pose', target).setAttribute('aria-hidden','true');
      portrait.addEventListener('error', () => {
        target.classList.add('at-art-unavailable');
        target.setAttribute('aria-label', 'MEK-AI character art failed to load');
      });
    }
    const oldArt = wrap.querySelector('.mek-portrait');
    if (oldArt) oldArt.remove();
    const oldGlow = wrap.querySelector('.mek-eye-glow');
    if (oldGlow) oldGlow.remove();

    make('div', 'at-scene-kicker', slot).textContent = 'MEK-AI // NEURAL CONSOLE';
    make('div', 'at-scene-id', slot).textContent = 'UNIT 01 / MK-II';
    make('div', 'at-pin-note', slot).textContent = 'SAME CHAOS. DIFFERENT DAY. — MEK';
    make('div', 'at-scene-seal', slot).textContent = '✦ WHERE STORIES TAKE ROOT';

    // The original hero is inserted here by the existing enterAmbient() function.
    // These decorations belong to the room and are not another nameplate.
    const housePanel = document.createElement('div');housePanel.className='amb-panel';
    housePanel.id='atelierHousePanel';
    housePanel.innerHTML='<div class="amb-head">HOUSE CONTROLS <span id="atHomeCaption">LOCAL CONTROLLER</span></div><div class="amb-content" id="atHouseDevices"></div>';
    right.prepend(housePanel);
    const oldHouse = $('#hideawayHouse');
    if (oldHouse) oldHouse.remove();

    const toolContainer = right.querySelector('.amb-tools');
    if (toolContainer) {
      const actionIcons = {
        timer:'timer', reminder:'reminder', weather:'weather',
        memory:'memory', settings:'settings', voice:'voice',
        chat:'chat', lights:'lights'
      };
      toolContainer.querySelectorAll('[data-amb-action]').forEach(button => {
        const action = button.dataset.ambAction;
        button.replaceChildren();
        button.innerHTML = '<strong>' + svgIcon(actionIcons[action] || 'chat') + '</strong><span>' + action.toUpperCase() + '</span>';
      });
      const sleep = make('button','amb-tool',toolContainer);
      sleep.type='button';sleep.id='atSleepTool';
      sleep.innerHTML='<strong>' + svgIcon('sleep') + '</strong><span>SLEEP</span>';
      sleep.addEventListener('click',()=>$('#sleepToggle')?.click());
    }

    // Accessible, actionable communication controls and recent real messages.
    const comms = make('section','',slot);comms.id='atelierComms';
    comms.setAttribute('aria-label','Latest conversation and voice controls');
    comms.innerHTML = '<div class="at-comms-head">MEK-AI // COMMUNICATION <span id="atCommsState">CHANNEL READY</span></div>' +
      '<div id="atTranscript" role="log" aria-live="off"></div>' +
      '<div class="at-voice-row"><div class="at-voice-pill"><i class="at-voice-led" id="atVoiceLED"></i>' +
      '<span id="atVoiceLabel">VOICE STANDBY</span></div><div class="at-wave" id="atWave" aria-hidden="true">' +
      Array.from({length:28}, (_,index) => '<i style="--n:' + ((index*7)%19+1) + '"></i>').join('') +
      '</div><button type="button" class="at-talk" id="atTalkButton" aria-pressed="false" aria-label="Start or stop talking to MEK-AI">' + svgIcon('voice') + '</button></div>';
    $('#atTalkButton')?.addEventListener('click',()=>$('#ambientTalk')?.click());
    const lineSource=$('#chatlog'),target=$('#atTranscript');

    let lastMessagesSignature='';
    const updateMessages=()=>{
      if(!lineSource||!target)return;
      const data=[...lineSource.querySelectorAll(':scope > .msg')].slice(-3).map(row=>{
        const who=row.querySelector('.who')?.textContent?.trim()||'MEK-AI';
        const body=[...row.children].filter(c=>!c.classList.contains('who')).map(c=>c.textContent).join(' ').trim();
        return {who,body};
      });
      const signature=JSON.stringify(data);
      if(signature===lastMessagesSignature)return;
      lastMessagesSignature=signature;
      const fragment=document.createDocumentFragment();
      for (const msg of data.length ? data : [{who:'MEK-AI',body:'Systems ready. Try not to break anything before breakfast.'}]) {
        const row=make('div','at-msg' + (/operator|you/i.test(msg.who)?' operator':''),fragment);
        const who=make('b','',row);who.textContent=msg.who;
        const text=make('span','',row);text.textContent=msg.body;
      }
      target.replaceChildren(fragment);target.scrollTop=target.scrollHeight;
    };
    if(lineSource)new MutationObserver(updateMessages).observe(lineSource,{childList:true,subtree:true,characterData:true});
    updateMessages();

    // The actual voice state comes from MEK-AI's existing state engine.
    function getMood(){
      const match=(eye.getAttribute('class')||'').match(/state-([a-z]+)/);
      return match?match[1]:'idle';
    }
    let lastMood='';
    const updateMood=()=>{
      const mood=getMood();if(mood===lastMood)return;
      lastMood=mood;avatar.dataset.mood=mood;inlineAvatar.dataset.mood=mood;
      const stage=$('#atCommsState');
      if(stage)stage.textContent=({
        listening:'LISTENING',thinking:'PROCESSING',speaking:'RESPONDING',sleep:'LOW POWER',
        confused:'UNCERTAIN',happy:'AMUSED',idle:'CHANNEL READY'
      })[mood]||'CHANNEL READY';
      const sleeping=mood==='sleep';
      $('#atSleepTool')?.setAttribute('aria-pressed',String(sleeping));
      const sleepLabel=$('#atSleepTool span');if(sleepLabel)sleepLabel.textContent=sleeping?'WAKE':'SLEEP';
    };
    window.addEventListener('mek-face-state',updateMood);
    new MutationObserver(updateMood).observe(eye,{attributes:true,attributeFilter:['class']});
    updateMood();

    const updateVoice=()=>{
      const raw=$('#voiceStatus')?.textContent||'MICROPHONE STANDBY';
      const status=raw.toUpperCase();
      const isActive=/LISTEN|CAPTUR|RECORD|HEARING|SPEAK NOW|WAITING FOR/.test(status);
      const speaking=getMood()==='speaking', thinking=getMood()==='thinking';
      const label=speaking?'MEK IS SPEAKING':thinking?'PROCESSING':isActive?'VOICE LISTENING':status.includes('OFF')?'VOICE OFF':'VOICE STANDBY';
      const at=$('#atVoiceLabel');if(at)at.textContent=label;
      const active=isActive||speaking;
      $('#atVoiceLED')?.classList.toggle('active',active);
      $('#atWave')?.classList.toggle('active',active);
      $('#atTalkButton')?.setAttribute('aria-pressed',String(isActive));
    };
    const voiceStatus=$('#voiceStatus');
    if(voiceStatus)new MutationObserver(updateVoice).observe(voiceStatus,{childList:true,subtree:true,characterData:true});
    window.addEventListener('mek-face-state',updateVoice);
    updateVoice();

    // Snapshot of the *actual* Tapo devices. A switch triggers the original
    // authenticated local-controller button, preserving its error handling.
    const devicesNode=$('#smartDevices'),statusNode=$('#smartStatus'),dest=$('#atHouseDevices');
    let lastHomeSignature='';
    const openHomeSettings=()=>dashboard.querySelector('[data-amb-action="lights"]')?.click();
    function updateHome(){
      const connected=/CONTROLLER ONLINE/i.test(statusNode?.textContent||'');
      const actual=devicesNode?[...devicesNode.querySelectorAll('.smart-device')]:[];
      const snapshot=actual.map(el=>({
        node:el, name:el.querySelector('strong')?.textContent?.trim()||'Unnamed device',
        state:el.querySelector('.smart-device-state')?.textContent?.trim()||'STATE UNKNOWN'
      }));
      const signature=JSON.stringify({connected,items:snapshot.map(({name,state})=>({name,state}))});
      if(signature===lastHomeSignature)return;lastHomeSignature=signature;
      $('#atHomeCaption').textContent=connected?'CONTROLLER ONLINE':'CONTROLLER OFFLINE';
      if(!dest)return;
      dest.replaceChildren();
      if(!connected||!snapshot.length){
        const empty=make('div','at-house-empty',dest);
        const p=make('p','',empty);
        p.textContent=connected?'No devices were returned by the controller.':'The local light controller is not connected on this device.';
        const b=make('button','secondary',empty);
        b.type='button';b.textContent=connected?'MANAGE CONTROLLER':'CONNECT HOUSE';
        b.addEventListener('click',openHomeSettings);
        return;
      }
      for(const {node,name,state} of snapshot){
        const row=make('div','at-house-row',dest);
        const ico=make('span','at-house-emoji',row);ico.textContent=/grow|plant/i.test(name)?'♧':'◈';ico.setAttribute('aria-hidden','true');
        const text=make('div','at-house-info',row);
        make('b','',text).textContent=name;
        make('small','',text).textContent=state;
        const toggle=make('button','at-switch',row);
        const on=/POWER ON/i.test(state),off=/POWER OFF/i.test(state);
        toggle.type='button';toggle.setAttribute('role','switch');
        toggle.setAttribute('aria-label',name);
        toggle.setAttribute('aria-checked',String(on));
        toggle.disabled=!on&&!off;
        toggle.title=toggle.disabled?'Checking device state':('Turn '+name+' '+(on?'off':'on'));
        toggle.addEventListener('click',()=>{
          if(toggle.disabled)return;
          const action=on?'OFF':'ON';
          const original=[...node.querySelectorAll('.smart-device-actions button')].find(b=>b.textContent.trim().toUpperCase()===action);
          if(!original)return;
          toggle.disabled=true;original.click();
        });
      }
    }
    if(devicesNode)new MutationObserver(updateHome).observe(devicesNode,{childList:true,subtree:true,characterData:true});
    if(statusNode)new MutationObserver(updateHome).observe(statusNode,{childList:true,subtree:true,characterData:true});
    window.addEventListener('mek:home-update',updateHome);updateHome();

    const online=$('#networkStatus');
    const refreshConnection=()=>{
      const value=online?.textContent|| (navigator.onLine?'BROWSER ONLINE':'OFFLINE');
      const el=$('#atOnline');if(el)el.textContent=navigator.onLine?'ONLINE':'OFFLINE';
      const label=conn.querySelector('.at-live');
      if(label)label.style.background=navigator.onLine?'#b2ce86':'#ce8964';
      conn.querySelector('b').textContent=navigator.onLine?'ONLINE':'OFFLINE';
      conn.title=value;
    };
    window.addEventListener('online',refreshConnection);
    window.addEventListener('offline',refreshConnection);
    refreshConnection();

    // Consistent icon and theme labels without a second inert interface.
    const brand=head.querySelector('.amb-brand');if(brand)brand.textContent='MEK-AI';
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();
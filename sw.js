/* MEK-AI Rebirth — cache local application files, not account or controller responses. */
const CACHE='mek-ai-hideaway-2026-10-21';
const SHELL=[
 '/mek-ai/','/mek-ai/index.html','/mek-ai/manifest.webmanifest','/mek-ai/icon.svg',
 '/mek-ai/mek-rebirth.css','/mek-ai/mek-rebirth.js','/mek-ai/mek-hideaway.css','/mek-ai/mek-hideaway.js','/mek-ai/smart-home.js'
];
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('mek-ai-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url);
 if(req.method!=='GET'||url.origin!==self.location.origin)return;
 if(req.mode==='navigate'){
  event.respondWith(fetch(req).then(res=>{
   if(res.ok){const copy=res.clone();caches.open(CACHE).then(c=>c.put('/mek-ai/index.html',copy)).catch(()=>{})}
   return res;
  }).catch(()=>caches.match('/mek-ai/index.html')));
  return;
 }
 if(SHELL.includes(url.pathname)){
  event.respondWith(caches.match(req).then(hit=>hit||fetch(req).then(res=>{
   if(res.ok)caches.open(CACHE).then(c=>c.put(req,res.clone())).catch(()=>{});
   return res;
  })));
 }
});
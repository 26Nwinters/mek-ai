const CACHE='mek-ai-shell-v1';
const SHELL=['/mek-ai/','/mek-ai/index.html','/mek-ai/manifest.webmanifest','/mek-ai/icon.svg'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
 const req=event.request,url=new URL(req.url);
 if(req.method!=='GET'||url.origin!==self.location.origin)return;
 if(req.mode==='navigate'){event.respondWith(fetch(req).then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put('/mek-ai/index.html',copy));return res}).catch(()=>caches.match('/mek-ai/index.html')));return}
 if(SHELL.includes(url.pathname)){event.respondWith(caches.match(req).then(hit=>hit||fetch(req)));return}
});
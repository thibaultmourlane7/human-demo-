/* HUMAN — offline app shell only; NEVER cache private application data. */
const VERSION='human-batiment-static-v12-1';
const ROOT=self.registration.scope;
const STATIC=/\.(?:js|css|svg|png|ico|woff2?)$/i;
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(VERSION).then(cache=>cache.add(ROOT)));
 self.skipWaiting();
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys
   .filter(k=>k.startsWith('human-batiment-static-') && k!==VERSION)
   .map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET'||req.headers.has('authorization')||req.headers.has('x-human-api-key'))return;
 const url=new URL(req.url);
 if(url.origin!==new URL(ROOT).origin||!url.href.startsWith(ROOT))return;
 if(url.pathname.includes('/functions/')||url.pathname.includes('/auth/')
   ||url.pathname.includes('/storage/'))return;
 if(req.mode==='navigate'){
   event.respondWith(fetch(req).catch(async()=>await caches.match(ROOT)??Response.error()));
   return;
 }
 if(!STATIC.test(url.pathname))return;
 event.respondWith(caches.match(req).then(cached=>cached??fetch(req).then(response=>{
   if(response.ok&&response.type==='basic'){
     const copy=response.clone();
     void caches.open(VERSION).then(cache=>cache.put(req,copy));
   }
   return response;
 })));
});

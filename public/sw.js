/* HUMAN — offline shell only. NEVER cache private messages, uploads, tokens or API calls. */
const VERSION='human-batiment-static-v12-3';
const ROOT=self.registration.scope;
const SCOPE=new URL(ROOT);
// Allowlist: only hashed Vite assets and fixed, public branding files.
// A generic .png/.js regex could cache confidential same-origin documents.
function isPublicAsset(url){
 if(url.origin!==SCOPE.origin||!url.pathname.startsWith(SCOPE.pathname))return false;
 const relative=url.pathname.slice(SCOPE.pathname.length);
 return /^assets\/[A-Za-z0-9_-]+\.(?:js|css|woff2?)$/.test(relative)
   || /^icons\/human-(?:192|512)\.png$/.test(relative)
   || relative==='human-icon.svg';
}
self.addEventListener('install',event=>{
 event.waitUntil(caches.open(VERSION).then(cache=>cache.add(ROOT)));
 self.skipWaiting();
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys
  .filter(k=>k.startsWith('human-batiment-static-')&&k!==VERSION)
  .map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 const req=event.request;
 if(req.method!=='GET'||req.headers.has('authorization')||req.headers.has('x-human-api-key'))return;
 const url=new URL(req.url);
 if(url.origin!==SCOPE.origin||!url.href.startsWith(ROOT))return;
 if(req.mode==='navigate'){
   event.respondWith(fetch(req).catch(async()=>await caches.match(ROOT)??Response.error()));
   return;
 }
 if(!isPublicAsset(url))return;
 event.respondWith(caches.match(req).then(cached=>cached??fetch(req).then(response=>{
   if(response.ok&&response.type==='basic'){
     const copy=response.clone();
     void caches.open(VERSION).then(cache=>cache.put(req,copy));
   }
   return response;
 })));
});

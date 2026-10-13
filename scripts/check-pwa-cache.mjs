import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const listeners={};
const scope='https://human.example/human-demo-/';
const sw=readFileSync(new URL('../public/sw.js',import.meta.url),'utf8');
runInNewContext(sw,{
 URL,Response,
 caches:{match:()=>Promise.resolve({}),open:()=>Promise.resolve({})},
 fetch:()=>Promise.resolve({ok:true,type:'basic',clone:()=>({})}),
 self:{registration:{scope},addEventListener:(type,fn)=>{listeners[type]=fn;},skipWaiting() {},clients:{claim(){}}},
});
assert.equal(typeof listeners.fetch,'function');
function handled(path,{headers=[],method='GET',mode='no-cors'}={}){
 let found=false;
 listeners.fetch({
  request:{url:scope+path,headers:{has:key=>headers.includes(key)},method,mode},
  respondWith(){found=true;}
 });
 return found;
}
assert.equal(handled('assets/index-Ab9X7.js'),true,'public app script');
assert.equal(handled('assets/index-f4a2.css'),true,'public stylesheet');
assert.equal(handled('icons/human-192.png'),true,'public icon');
for(const path of ['uploads/private.png','documents/piece-jointe.jpg','storage/v1/object/photo.png',
 'api/mission.js','auth/token.js','assets/private.pdf','assets/secret.png']){
 assert.equal(handled(path),false,'private/dynamic path cannot be cached: '+path);
}
assert.equal(handled('assets/index-Ab9X7.js',{headers:['authorization']}),false);
assert.equal(handled('assets/index-Ab9X7.js',{headers:['x-human-api-key']}),false);
assert.equal(handled('assets/index-Ab9X7.js',{method:'POST'}),false);
console.log('OK — offline cache only allows static public assets; no private route intercepted.');

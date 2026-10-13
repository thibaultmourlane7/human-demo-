import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=p=>readFileSync(p,'utf8');
const cfg=read('capacitor.config.ts');
assert.match(cfg,/appId:'fr\.human\.batiment'/);
assert.match(cfg,/webDir:'dist'/);
assert.doesNotMatch(cfg,/url\s*:/);
const bridge=read('src/platform/mobileRuntime.ts');
assert.match(bridge,/getHumanRuntime/);
assert.match(bridge,/confidentialOfflineStorage:false/);
assert.match(bridge,/backgroundPayments:false/);
const app=read('src/App.tsx');
assert.match(app,/MobileEnvironmentNote/);
const html=read('index.source.html');
assert.match(html,/viewport/);
const pkg=JSON.parse(read('package.json'));
assert.ok(pkg.scripts?.build);
for(const name of ['@capacitor/core','@capacitor/cli','@capacitor/android','@capacitor/ios']) {
 const version=pkg.dependencies?.[name]??pkg.devDependencies?.[name];
 assert.equal(version,'8.5.3',name+' must remain pinned and consistent');
}
assert.match(pkg.scripts['mobile:sync'],/cap sync/);
assert.match(pkg.scripts['mobile:android:init'],/cap add android/);
assert.match(pkg.scripts['mobile:ios:init'],/cap add ios/);
assert.ok(existsSync('docs/SPRINT12_MOBILE.md'));
if (!existsSync('package-lock.json')) {
 console.warn('ATTENTION : package-lock.json absent ; livraison native non reproductible à ce stade.');
} else {
 const lock=JSON.parse(read('package-lock.json'));
 for (const name of ['@capacitor/core','@capacitor/cli','@capacitor/android','@capacitor/ios']) {
  assert.equal(lock.packages?.['node_modules/'+name]?.version,'8.5.3',
   name+' must be pinned in the native lockfile');
 }
}
console.log('HUMAN mobile configuration checks passed. No native app compiled.');

import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=(path)=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const client=read('src/lib/supabase.ts');
const runtime=read('src/platform/mobileRuntime.ts');
const auth=read('src/components/AuthPanel.tsx');
const config=read('capacitor.config.ts');

assert.match(client,/detectSessionInUrl:\s*getHumanRuntime\(\) === 'web'/);
assert.match(runtime,/nativeDeepLinkLogin:false/);
assert.match(runtime,/isNativePlatform/);
assert.match(auth,/signInWithPassword\(/);
assert.doesNotMatch(client,/detectSessionInUrl:\s*true/);
assert.doesNotMatch(client,/flowType:\s*['"]implicit['"]/);
assert.doesNotMatch(config,/server:\s*\{[^}]*url\s*:/);
console.log('OK — mobile sessions keep password login but block unaudited URL token detection.');

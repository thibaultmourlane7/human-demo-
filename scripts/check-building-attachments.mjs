import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=file=>readFileSync(new URL('../'+file,import.meta.url),'utf8');
const adapter=read('src/services/buildingAttachments.ts');
const form=read('src/components/BuildingIntakeDraft.tsx');
const viewer=read('src/components/BuildingAttachments.tsx');
const app=read('src/App.tsx');
const sw=read('public/sw.js');
const common='VITE_HUMAN_BUILDING_UPLOAD_ENABLED';
assert.ok(adapter.includes(common),'uploads must require a separate explicit feature flag');
assert.ok(adapter.includes('VITE_HUMAN_BUILDING_API_ENABLED'));
assert.ok(adapter.includes('VITE_HUMAN_BUILDING_PREVIEW'));
assert.ok(adapter.includes('upsert:false'),'uploads must not overwrite files');
assert.ok(adapter.includes('cacheControl:\'0\''));
for(const type of ['image/jpeg','image/png','image/webp','application/pdf'])assert.ok(adapter.includes(type));
assert.ok(adapter.includes('MAX_BUILDING_ATTACHMENTS=5'));
assert.ok(adapter.includes('MAX_BUILDING_ATTACHMENT_BYTES=10*1024*1024'));
assert.ok(adapter.includes('crypto.randomUUID()'));
assert.ok(adapter.includes('.list(requestId'));
assert.ok(adapter.includes('.download(requestId'));
for(const source of [adapter,form,viewer,app]){
 assert.doesNotMatch(source,/getPublicUrl|createSignedUrl|SUPABASE_SERVICE_ROLE_KEY/);
}
assert.ok(form.includes('initialFiles={files}'));
assert.ok(viewer.includes('onClick={()=>void upload()}'));
assert.ok(app.includes("selected.request.category_code === 'building'"));
assert.ok(app.includes("job.category_code === 'building'"));
assert.ok(!sw.includes('human-building-private'));
console.log('OK — building uploads are gated, private, and require explicit user action.');

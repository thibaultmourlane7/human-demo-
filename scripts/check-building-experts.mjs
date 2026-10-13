import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const flags=read('src/features/buildingExperts.ts');
const profile=read('src/components/ExpertProfileForm.tsx');
const expert=read('src/components/BuildingTradeDeclaration.tsx');
const admin=read('src/components/BuildingTradeAdmin.tsx');
const api=read('src/services/humanApi.ts');
const app=read('src/App.tsx');
const adminArea=read('src/components/AdminArea.tsx');
const intake=read('src/components/BuildingIntakeDraft.tsx');
for(const flag of ['VITE_HUMAN_BUILDING_PREVIEW','VITE_HUMAN_BUILDING_API_ENABLED','VITE_HUMAN_BUILDING_EXPERT_ENABLED'])
 assert.ok(flags.includes(flag),'missing feature switch: '+flag);
assert.ok(profile.includes('...(buildingExpertWorkflowEnabled() ?'),'specialty onboarding must be gated');
assert.ok(expert.includes('buildingExpertWorkflowEnabled()'));
assert.ok(admin.includes('buildingExpertWorkflowEnabled()'));
assert.ok(api.includes('if (!buildingExpertWorkflowEnabled())'));
for(const command of ['declare_building_trades','get_my_building_trades','admin_list_building_trades','admin_review_building_trade'])
 assert.ok(api.includes(command),'missing authenticated command '+command);
assert.ok(admin.includes('!item.expert_verified'),'trade approval requires globally verified expert');
assert.ok(admin.includes('Retirer la validation'),'admin must be able to revoke approval');
assert.ok(expert.includes('Un administrateur doit vérifier'),'expert must not claim automatic validation');
assert.ok(app.includes('<BuildingTradeDeclaration session={session} />'));
assert.ok(adminArea.includes('<BuildingTradeAdmin session={session} />'));
assert.ok(intake.includes('BUILDING_TRADES'),'front trade catalogue must be shared');
console.log('OK — building expert intake, admin decisions and API are gated and linked.');

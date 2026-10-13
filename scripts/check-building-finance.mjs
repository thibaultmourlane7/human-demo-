import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const gate=read('src/features/buildingFinancialJourney.ts');
const app=read('src/App.tsx');
const request=read('src/components/RequestForm.tsx');
const finance=read('src/components/FinancePanel.tsx');
for(const flag of ['VITE_HUMAN_BUILDING_PREVIEW','VITE_HUMAN_BUILDING_API_ENABLED',
                   'VITE_HUMAN_BUILDING_QUOTE_ENABLED']){
 assert.ok(gate.includes(flag),flag+' must guard Bâtiment finance');
}
assert.ok(app.includes("buildingFinanceBlocked = selected?.request.category_code === 'building'"));
assert.ok(app.includes("!buildingFinanceBlocked && ['draft'"));
assert.ok(app.includes("busy || !!buildingFinanceBlocked"));
assert.ok(app.includes("job.category_code === 'building' && (!buildingFinancialJourneyEnabled() || payment?.state !== 'reserved')"));
assert.ok(request.includes("Exclude<HumanCategory, 'building'>"));
assert.ok(finance.includes("Exclude<HumanCategory, 'building'>"));
console.log('OK — Bâtiment pricing, credit reservation and work start are locked until explicit activation.');

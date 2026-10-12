/** HUMAN Bâtiment — draft creation, explicit user action only.
 * Service is NOT enabled by default and must not be used before database
 * migrations and the human-building Edge Function are deployed and verified.
 */
import type { Session } from '@supabase/supabase-js';

const url=import.meta.env.VITE_SUPABASE_URL as string|undefined;
const publishableKey=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string|undefined;

export interface HumanBuildingDraftInput {
 tradeCode:string;
 question:string;
 context?:string;
 title?:string;
 urgency?:'normal'|'urgent';
}
export interface HumanBuildingDraftReceipt {
 request_id:string;
 status:'draft';
 building_trade_code:string;
 matching_started:false;
 payment_accepted:false;
}
export async function createBuildingDraft(
 session:Session,
 draft:HumanBuildingDraftInput,
):Promise<HumanBuildingDraftReceipt> {
 if(import.meta.env.VITE_HUMAN_BUILDING_API_ENABLED!=='true'){
  throw new Error('API_BATIMENT_NON_ACTIVEE');
 }
 if(!url||!publishableKey)throw new Error('CONFIGURATION_MANQUANTE');
 const response=await fetch(url+'/functions/v1/human-building',{
  method:'POST',
  cache:'no-store',
  headers:{
   Authorization:'Bearer '+session.access_token,
   apikey:publishableKey,
   'Content-Type':'application/json',
  },
  body:JSON.stringify({action:'create_draft',...draft}),
 });
 let parsed:unknown;
 try { parsed=await response.json(); } catch { throw new Error('REPONSE_API_INVALIDE'); }
 if(!response.ok||!parsed||typeof parsed!=='object'
    ||(parsed as {ok?:unknown}).ok!==true){
  throw new Error('ENREGISTREMENT_BROUILLON_INDISPONIBLE');
 }
 const data=(parsed as {data:unknown}).data;
 if(!data||typeof data!=='object')throw new Error('REPONSE_API_INVALIDE');
 const receipt=data as Partial<HumanBuildingDraftReceipt>;
 if(receipt.status!=='draft'||receipt.matching_started!==false
   ||receipt.payment_accepted!==false||typeof receipt.request_id!=='string'){
  throw new Error('VALIDATION_BROUILLON_INCOMPLETE');
 }
 return receipt as HumanBuildingDraftReceipt;
}

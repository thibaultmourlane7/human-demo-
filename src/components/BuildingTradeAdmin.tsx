import {useCallback,useEffect,useState} from 'react';
import type {Session} from '@supabase/supabase-js';
import {buildingExpertWorkflowEnabled} from '../features/buildingExperts';
import {humanApi,type HumanBuildingAdminTrade} from '../services/humanApi';

/** Human verification, not automated trust inference. Requires an admin JWT. */
export function BuildingTradeAdmin({session}:{session:Session}){
 const enabled=buildingExpertWorkflowEnabled();
 const [items,setItems]=useState<HumanBuildingAdminTrade[]>([]);
 const [busy,setBusy]=useState<string|null>(null);
 const [error,setError]=useState<string|null>(null);
 const [notice,setNotice]=useState<string|null>(null);
 const [reasons,setReasons]=useState<Record<string,string>>({});
 const load=useCallback(async()=>{
  if(!enabled)return;
  setItems(await humanApi.adminListBuildingTrades(session));
 },[enabled,session]);
 useEffect(()=>{
  if(!enabled)return;
  void load().catch(()=>setError('Impossible de charger les qualifications du bâtiment.'));
 },[enabled,load]);
 if(!enabled)return null;

 async function review(item:HumanBuildingAdminTrade,approve:boolean){
  const key=item.expert_id+':'+item.trade_code;
  const reason=reasons[key]?.trim()??'';
  if(!approve&&reason.length<3){
   setError('Un motif de retrait d’au moins trois caractères est requis.');
   return;
  }
  setBusy(key);setError(null);setNotice(null);
  try{
   await humanApi.adminReviewBuildingTrade(session,item.expert_id,item.trade_code,approve,reason);
   await load();
   setReasons(current=>({...current,[key]:''}));
   setNotice(approve?'Qualification vérifiée par un administrateur.':'Validation du métier retirée.');
  }catch{setError('Décision impossible. Vérifiez le statut global de l’expert et la déclaration.');}
  finally{setBusy(null);}
 }
 return <section className="panel admin-wide building-trade-admin">
  <div className="panel-heading"><div>
   <p className="eyebrow">Expert clearance — Bâtiment</p>
   <h2>Validation humaine des métiers</h2>
  </div><button type="button" className="secondary-button" onClick={()=>void load().catch(()=>setError('Actualisation impossible.'))}>Actualiser</button></div>
  <p className="muted">La vérification d’un expert HUMAN ne valide pas automatiquement ses métiers. Contrôlez les justificatifs hors de ce formulaire avant toute décision.</p>
  {!items.length&&<p className="muted">Aucune qualification déclarée.</p>}
  <div className="admin-expert-grid">
   {items.map(item=>{
    const key=item.expert_id+':'+item.trade_code;
    return <article className="admin-expert-card" key={key}>
     <strong>{item.expert_name||'Expert HUMAN'}</strong>
     <p>{item.profession} · {item.label}</p>
     <div className="status-row"><span>Profil global</span><strong>{item.expert_verified?'Vérifié':'Non vérifié'}</strong></div>
     <div className="status-row"><span>Qualification métier</span><strong>{item.verified?'Validée':'À contrôler'}</strong></div>
     <label className="admin-reason">Motif / note de contrôle
      <textarea rows={2} value={reasons[key]??''} onChange={e=>setReasons(v=>({...v,[key]:e.target.value}))}
       placeholder="Obligatoire pour retirer une validation" />
     </label>
     <div className="button-row">
      {!item.verified&&<button className="primary-button" type="button" disabled={busy===key||!item.expert_verified}
       onClick={()=>void review(item,true)}>Vérifier ce métier</button>}
      {item.verified&&<button className="secondary-button danger-action" type="button" disabled={busy===key}
       onClick={()=>void review(item,false)}>Retirer la validation</button>}
     </div>
    </article>;
   })}
  </div>
  {notice&&<p role="status">{notice}</p>}
  {error&&<p role="alert" className="error-banner">{error}</p>}
 </section>;
}

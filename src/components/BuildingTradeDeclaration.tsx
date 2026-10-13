import {useEffect,useState} from 'react';
import type {Session} from '@supabase/supabase-js';
import {BUILDING_TRADES,buildingExpertWorkflowEnabled} from '../features/buildingExperts';
import {humanApi,type HumanBuildingExpertTrade} from '../services/humanApi';

/** Declarations need human admin review. This component never verifies skills. */
export function BuildingTradeDeclaration({session}:{session:Session}) {
 const enabled=buildingExpertWorkflowEnabled();
 const [declared,setDeclared]=useState<HumanBuildingExpertTrade[]>([]);
 const [selected,setSelected]=useState<string[]>([]);
 const [busy,setBusy]=useState(false);
 const [error,setError]=useState<string|null>(null);
 const [notice,setNotice]=useState<string|null>(null);
 useEffect(()=>{
  if(!enabled)return;
  let alive=true;
  humanApi.getMyBuildingTrades(session).then(items=>{if(alive)setDeclared(items);})
   .catch(()=>{if(alive)setError('Qualification métier non disponible.');});
  return ()=>{alive=false;};
 },[enabled,session.user.id,session.access_token]);
 if(!enabled)return null;
 function toggle(code:string){
  setSelected(current=>current.includes(code)?current.filter(x=>x!==code):[...current,code]);
 }
 async function submit(){
  if(busy||selected.length===0)return;
  setBusy(true);setError(null);setNotice(null);
  try{
   await humanApi.declareBuildingTrades(session,selected);
   setDeclared(await humanApi.getMyBuildingTrades(session));
   setSelected([]);
   setNotice('Métiers déclarés. Un administrateur doit vérifier chaque qualification avant toute attribution.');
  }catch{setError('Déclaration impossible. Votre profil expert et les métiers doivent être valides.');}
  finally{setBusy(false);}
 }
 return <section className="panel building-trade-declaration">
   <p className="eyebrow">HUMAN Bâtiment — Expert</p>
   <h3>Mes qualifications du bâtiment</h3>
   <p className="muted">Déclarez vos métiers réels. Seul un administrateur peut vérifier chaque spécialité, indépendamment de votre statut d’expert.</p>
   <div className="specialty-grid">
    {BUILDING_TRADES.map(t=><label className="check-card" key={t.code}>
     <input type="checkbox" checked={selected.includes(t.code)} disabled={busy}
      onChange={()=>toggle(t.code)}/> {t.name}
    </label>)}
   </div>
   <button type="button" className="secondary-button" disabled={busy||selected.length===0}
    onClick={()=>void submit()}>{busy?'Envoi…':'Déclarer les métiers sélectionnés'}</button>
   {declared.length>0&&<ul>{declared.map(t=><li key={t.trade_code}>
    {t.label} — {t.verified?'Qualification vérifiée':'En attente de validation humaine'}
   </li>)}</ul>}
   {notice&&<p role="status">{notice}</p>}
   {error&&<p role="alert" className="error-banner">{error}</p>}
 </section>;
}

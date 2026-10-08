import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import {
  humanConnectApi,
  type AdminPayoutOverview,
  type ExpertPayoutOverview,
} from '../services/humanConnectApi';

const euros=(cents:number)=>
  new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'}).format(cents/100);

export function ExpertPaymentsPanel({session}:{session:Session}) {
  const [overview,setOverview]=useState<ExpertPayoutOverview|null>(null);
  const [error,setError]=useState<string|null>(null);
  const [busy,setBusy]=useState(false);

  async function load() {
    setError(null);
    try { setOverview(await humanConnectApi.getExpertOverview(session)); }
    catch (e) { setError(e instanceof Error?e.message:'Erreur HUMAN Connect'); }
  }
  useEffect(()=>{void load();},[session.access_token]);

  async function onboard() {
    setBusy(true);
    setError(null);
    try {
      const result=await humanConnectApi.beginOnboarding(session);
      const url=new URL(result.onboarding_url);
      if(url.protocol!=='https:' || !url.hostname.endsWith('.stripe.com')) {
        throw new Error('URL Stripe invalide');
      }
      window.location.assign(url.toString());
    } catch(e) {
      setError(e instanceof Error?e.message:'Impossible de démarrer Stripe Connect');
      setBusy(false);
    }
  }

  async function sync() {
    setBusy(true);
    try {
      await humanConnectApi.syncOnboarding(session);
      await load();
    } catch(e) { setError(e instanceof Error?e.message:'Synchronisation impossible'); }
    finally { setBusy(false); }
  }

  return <section className="panel finance-panel">
    <div className="panel-heading">
      <div><p className="eyebrow">Stripe Connect / Experts</p><h2>Mes rémunérations</h2></div>
    </div>
    {error && <div className="error-banner" role="alert">{error}</div>}
    {!overview && !error && <p className="muted">Chargement des rémunérations…</p>}
    {overview && <>
      <div className="finance-metrics">
        <div><span>Gains enregistrés</span><strong>{euros(overview.total_earned_cents)}</strong></div>
        <div><span>Solde métier</span><strong>{euros(overview.wallet_available_cents)}</strong></div>
        <div><span>En attente</span><strong>{euros(overview.wallet_reserved_cents)}</strong></div>
      </div>
      <div className="finance-card">
        <h3>Compte Stripe Connect</h3>
        <p>Statut : <strong>{overview.connect.state==='ready'?'Vérifié':overview.connect.state==='pending'?'En cours':overview.connect.state==='not_started'?'Non configuré':'À compléter'}</strong></p>
        <p className="muted">Les coordonnées bancaires et les justificatifs sont recueillis par Stripe. HUMAN ne les conserve pas.</p>
        <div className="topup-packs">
          <button className="primary-button" disabled={busy} onClick={()=>void onboard()}>
            {busy?'Ouverture…':overview.connect.state==='not_started'?'Configurer Stripe Connect':'Continuer dans Stripe'}
          </button>
          <button className="secondary-button" disabled={busy} onClick={()=>void sync()}>Actualiser le statut</button>
        </div>
      </div>
      <div className="finance-card">
        <h3>Versements</h3>
        <p className="muted">
          {overview.withdrawals_enabled
            ? 'Le suivi des demandes est disponible.'
            : 'Demandes de versement temporairement désactivées : vérification des fonds et tests en attente.'}
        </p>
        <p className="muted">Le solde HUMAN est indicatif et ne représente pas une disponibilité de fonds Stripe.</p>
        {overview.withdrawals.length===0 && <p>Aucun versement enregistré.</p>}
        {overview.withdrawals.map(item=><div className="topup-row" key={item.id}>
          <strong>{euros(item.amount_cents)}</strong>
          <span>{item.status==='transferred'?'Transféré vers Stripe Connect':item.status}</span>
        </div>)}
      </div>
    </>}
  </section>;
}

export function AdminExpertPaymentsPanel({session}:{session:Session}) {
  const [overview,setOverview]=useState<AdminPayoutOverview|null>(null);
  const [error,setError]=useState<string|null>(null);
  useEffect(()=>{
    let cancelled=false;
    void humanConnectApi.getAdminOverview(session)
      .then(result=>{if(!cancelled)setOverview(result);})
      .catch(e=>{if(!cancelled)setError(e instanceof Error?e.message:'Erreur');});
    return()=>{cancelled=true;};
  },[session.access_token]);

  return <section className="panel finance-panel">
    <div className="panel-heading">
      <div><p className="eyebrow">Pilotage HUMAN</p><h2>Comptes et versements experts</h2></div>
    </div>
    <p className="muted">Aucun transfert Stripe ni virement bancaire n'est activé à cette étape.</p>
    {error && <div role="alert" className="error-banner">{error}</div>}
    {!overview && !error && <p className="muted">Chargement du tableau…</p>}
    {overview && <>
      <div className="finance-metrics">
        <div><span>Comptes Connect</span><strong>{overview.accounts.length}</strong></div>
        <div><span>Comptes prêts</span><strong>{overview.accounts.filter(a=>a.state==='ready').length}</strong></div>
        <div><span>Demandes de versement</span><strong>{overview.payout_requests.length}</strong></div>
      </div>
      <div className="topup-history">
        <h3>Expert Connect</h3>
        {overview.accounts.length===0 && <p className="muted">Aucun expert connecté pour le moment.</p>}
        {overview.accounts.map(account=><div className="topup-row" key={account.expert_user_id}>
          <strong>{account.email}</strong><span>{account.state}</span>
        </div>)}
      </div>
      <div className="topup-history">
        <h3>Demandes</h3>
        {overview.payout_requests.length===0 && <p className="muted">Aucune demande.</p>}
        {overview.payout_requests.map(item=><div className="topup-row" key={item.id}>
          <span>{item.email}</span><strong>{euros(item.amount_cents)}</strong><span>{item.status}</span>
        </div>)}
      </div>
    </>}
  </section>;
}

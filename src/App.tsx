import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { AuthPanel } from './components/AuthPanel';
import { AdminArea } from './components/AdminArea';
import { ExpertProfileForm } from './components/ExpertProfileForm';
import { FinancePanel } from './components/FinancePanel';
import { MessageThread } from './components/MessageThread';
import { RequestForm } from './components/RequestForm';
import type { HumanDashboard, HumanFinanceDashboard, HumanJob, HumanRequestDetail, HumanRequestInput } from './domain/request';
import { humanConfigReady, supabase } from './lib/supabase';
import { humanApi } from './services/humanApi';

const statusLabel: Record<string, string> = {
  draft: 'Brouillon', searching: 'Recherche expert', offered: 'Proposée à un expert', accepted: 'Expert trouvé',
  in_progress: 'Intervention en cours', answered: 'Réponse reçue', completed: 'Terminée', cancelled: 'Annulée',
};

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [dashboard, setDashboard] = useState<HumanDashboard | null>(null);
  const [finance, setFinance] = useState<HumanFinanceDashboard | null>(null);
  const [selected, setSelected] = useState<HumanRequestDetail | null>(null);
  const [answerDraft, setAnswerDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const syncDashboard = useCallback(async (activeSession: Session) => {
    const data = await humanApi.getDashboard(activeSession);
    setDashboard(data);
  }, []);

  const syncFinance = useCallback(async (activeSession: Session) => {
    const data = await humanApi.getFinanceDashboard(activeSession);
    setFinance(data);
  }, []);

  const refresh = useCallback(async (activeSession: Session) => {
    const desiredRole = activeSession.user.user_metadata?.human_role === 'expert' ? 'expert' : 'user';
    await humanApi.bootstrapAccount(activeSession, {
      role: desiredRole,
      firstName: activeSession.user.user_metadata?.first_name,
      lastName: activeSession.user.user_metadata?.last_name,
    });
    await Promise.all([syncDashboard(activeSession), syncFinance(activeSession)]);
  }, [syncDashboard, syncFinance]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setDashboard(null);
      setFinance(null);
      setSelected(null);
      return;
    }
    setError(null);
    refresh(session).catch((err) => setError(err instanceof Error ? err.message : 'Erreur HUMAN'));
  }, [session, refresh]);

  useEffect(() => {
    if (!session || !dashboard) return;
    const timer = window.setInterval(() => {
      void syncDashboard(session).catch(() => undefined);
      void syncFinance(session).catch(() => undefined);
      const requestId = selected?.request.id;
      if (requestId) {
        void humanApi.getRequestDetail(session, requestId)
          .then(setSelected)
          .catch(() => undefined);
      }
    }, 8000);
    return () => window.clearInterval(timer);
  }, [session, dashboard?.profile?.id, selected?.request.id, syncDashboard, syncFinance]);

  async function run(action: () => Promise<unknown>, reload = true) {
    if (!session) return;
    setBusy(true);
    setError(null);
    try {
      await action();
      if (reload) await Promise.all([syncDashboard(session), syncFinance(session)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur HUMAN');
    } finally {
      setBusy(false);
    }
  }

  async function createRequest(input: HumanRequestInput) {
    if (!session) return;
    await run(async () => {
      const created = await humanApi.createRequest(session, input);
      await humanApi.startMatching(session, created.request_id);
    });
  }

  async function openRequest(requestId: string) {
    if (!session) return;
    setBusy(true);
    setError(null);
    try {
      setSelected(await humanApi.getRequestDetail(session, requestId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible d’ouvrir la mission');
    } finally {
      setBusy(false);
    }
  }

  if (!humanConfigReady) {
    return <main><section className="panel auth-shell"><h2>Configuration HUMAN manquante</h2><p>Les variables publiques Supabase ne sont pas configurées.</p></section></main>;
  }

  return <main>
    <header className="topbar">
      <div className="brand-lockup">
        <div className="brand-mark" aria-hidden="true"><span>H</span><i /></div>
        <div className="brand-copy"><strong>HUMAN</strong><span>Human fallback infrastructure</span></div>
      </div>
      {session && <div className="top-actions"><span>{session.user.email}</span><button className="secondary-button" onClick={() => supabase.auth.signOut()}>Déconnexion</button></div>}
    </header>

    <section className="hero compact-hero human-hero">
      <div className="hero-copy">
        <div className="hero-badge">HUMAN / SIGNAL 08</div>
        <h1>L’IA bloque.<br/><span>Un humain prend le relais.</span></h1>
        <p>Une infrastructure qui connecte les intelligences artificielles à des experts qualifiés quand la certitude ne suffit plus.</p>
        <div className="relay-strip" aria-label="Flux HUMAN">
          <span>AI</span><b>→</b><span className="fault">?</span><b>→</b><span className="human-node">HUMAN</span><b>→</b><span>EXPERT</span>
        </div>
      </div>
      <div className="signal-stage" aria-hidden="true">
        <div className="signal-grid" />
        <div className="signal-ring ring-a" />
        <div className="signal-ring ring-b" />
        <div className="signal-ring ring-c" />
        <div className="signal-core"><span>H</span><small>LIVE</small></div>
        <div className="signal-caption"><span>ESCALATION</span><strong>HUMAN<br/>RELAY</strong><em>QUALIFIED / VERIFIED</em></div>
      </div>
    </section>

    {!session ? <AuthPanel /> : !dashboard ? <section className="panel auth-shell"><div className="spinner" /><p>Chargement de votre espace HUMAN…</p></section> : <>
      {error && <div className="error-banner">{error}</div>}
      <section className="account-strip panel">
        <div><p className="eyebrow">Compte</p><h2>{dashboard.profile?.first_name || 'Compte'} {dashboard.profile?.last_name || ''}</h2></div>
        <div className="role-pill">{dashboard.profile?.role === 'expert' ? 'Expert' : dashboard.profile?.role === 'admin' ? 'Admin' : 'Utilisateur'}</div>
      </section>

      <FinancePanel session={session} finance={finance} role={dashboard.profile?.role || 'user'} onRefresh={() => syncFinance(session)} />

      {dashboard.profile?.role === 'admin' ? (
        <AdminArea session={session} />
      ) : dashboard.profile?.role === 'expert' ? (
        <ExpertArea dashboard={dashboard} finance={finance} session={session} busy={busy} run={run} refresh={syncDashboard} refreshFinance={syncFinance} answerDraft={answerDraft} setAnswerDraft={setAnswerDraft} />
      ) : (
        <UserArea dashboard={dashboard} finance={finance} busy={busy} createRequest={createRequest} openRequest={openRequest} selected={selected} session={session} run={run} refreshFinance={syncFinance} setSelected={setSelected} />
      )}
    </>}

    <footer>HUMAN · infrastructure d’intervention humaine pour agents IA</footer>
  </main>;
}

function UserArea({ dashboard, finance, busy, createRequest, openRequest, selected, session, run, refreshFinance, setSelected }: {
  dashboard: HumanDashboard;
  finance: HumanFinanceDashboard | null;
  busy: boolean;
  createRequest: (input: HumanRequestInput) => Promise<void>;
  openRequest: (id: string) => Promise<void>;
  selected: HumanRequestDetail | null;
  session: Session;
  run: (action: () => Promise<unknown>, reload?: boolean) => Promise<void>;
  refreshFinance: (session: Session) => Promise<void>;
  setSelected: (value: HumanRequestDetail | null) => void;
}) {
  const payment = selected ? finance?.requests.find((item) => item.request_id === selected.request.id) ?? null : null;
  const canQuote = !!selected && ['draft','searching','offered','accepted'].includes(selected.request.status);

  return <section className="workspace live-workspace">
    <div className="panel form-panel">
      <div className="panel-heading"><div><p className="eyebrow">Nouvelle mission</p><h2>Demander un expert</h2></div><span className="demo-pill live-pill">Connecté</span></div>
      <RequestForm onSubmit={createRequest} disabled={busy} />
    </div>
    <aside className="panel status-panel">
      <p className="eyebrow">Mes missions</p>
      <div className="mission-list">
        {!dashboard.requests.length && <p className="muted">Aucune mission pour le moment.</p>}
        {dashboard.requests.map((request) => <button className="mission-card" key={request.id} onClick={() => openRequest(request.id)}>
          <span>{request.category_label}</span><strong>{request.title || 'Mission HUMAN'}</strong><small>{statusLabel[request.status] || request.status}</small>
        </button>)}
      </div>
    </aside>

    {selected && <div className="panel detail-panel wide-panel">
      <div className="panel-heading"><div><p className="eyebrow">Mission</p><h2>{selected.request.category_label}</h2></div><button className="text-button" onClick={() => setSelected(null)}>Fermer</button></div>
      <p className="question-box">{selected.content.question}</p>
      {selected.content.context && <p className="muted">Contexte : {selected.content.context}</p>}
      <div className="status-row"><span>Statut</span><strong>{statusLabel[selected.request.status] || selected.request.status}</strong></div>
      {selected.request.status === 'searching' && <div className="matching-state">Recherche automatique active — HUMAN attend le prochain expert compatible disponible.</div>}
      {selected.request.status === 'offered' && <div className="matching-state signal">Un expert compatible a été sollicité. En cas de refus ou d’expiration, HUMAN passe automatiquement au suivant.</div>}
      <div className="payment-box">
        <div className="status-row"><span>Financement</span><strong>{payment ? payment.state : 'Non chiffré'}</strong></div>
        {!payment && canQuote && <button className="secondary-button" disabled={busy} onClick={() => void run(async () => { await humanApi.prepareQuote(session, selected.request.id); await refreshFinance(session); })}>Calculer le tarif</button>}
        {payment?.state === 'quoted' && <><div className="payment-price">{new Intl.NumberFormat('fr-FR', { style: 'currency', currency: payment.currency_code }).format(payment.total_cents / 100)}</div><p className="muted">Ce montant sera réservé dans vos crédits avant l’intervention.</p><button className="primary-button" disabled={busy || !finance || finance.wallet.available_cents < payment.total_cents} onClick={() => void run(async () => { if (!payment.quote_id) return; await humanApi.acceptQuote(session, payment.quote_id); await refreshFinance(session); })}>Réserver les crédits</button>{finance && finance.wallet.available_cents < payment.total_cents && <div className="notice">Crédits insuffisants. Un administrateur doit créditer votre compte pour le test.</div>}</>}
        {payment?.state === 'reserved' && <div className="matching-state signal">Crédits réservés — l’expert peut démarrer l’intervention.</div>}
        {payment?.state === 'settled' && <div className="matching-state signal">Mission réglée.</div>}
        {payment?.state === 'refunded' && <div className="matching-state">Crédits remboursés.</div>}
      </div>
      <MessageThread session={session} requestId={selected.request.id} canSend={['accepted', 'in_progress', 'answered'].includes(selected.request.status)} defaultOpen />
      {selected.result?.expert_answer && <div className="answer-card"><small>Réponse de l’expert</small><p>{selected.result.expert_answer}</p></div>}
      {selected.request.status === 'answered' && selected.result?.expert_answer && <div className="button-row">
        <button className="primary-button" disabled={busy} onClick={() => run(async () => {
          await humanApi.returnResult(session, selected.request.id, selected.result!.expert_answer!);
          await humanApi.completeRequest(session, selected.request.id, { validationStatus: 'accepted' });
          setSelected(await humanApi.getRequestDetail(session, selected.request.id));
        })}>Valider et clôturer</button>
        <button className="secondary-button" disabled={busy} onClick={() => run(async () => {
          await humanApi.returnResult(session, selected.request.id, selected.result!.expert_answer!);
          await humanApi.completeRequest(session, selected.request.id, { validationStatus: 'rejected', feedback: 'Réponse refusée depuis l’interface web.' });
          setSelected(await humanApi.getRequestDetail(session, selected.request.id));
        })}>Refuser la réponse</button>
      </div>}
    </div>}
  </section>;
}

function ExpertArea({ dashboard, finance, session, busy, run, refresh, refreshFinance, answerDraft, setAnswerDraft }: {
  dashboard: HumanDashboard;
  finance: HumanFinanceDashboard | null;
  session: Session;
  busy: boolean;
  run: (action: () => Promise<unknown>, reload?: boolean) => Promise<void>;
  refresh: (session: Session) => Promise<void>;
  refreshFinance: (session: Session) => Promise<void>;
  answerDraft: string;
  setAnswerDraft: (value: string) => void;
}) {
  if (!dashboard.expert) {
    return <section className="panel form-panel single-panel"><div className="panel-heading"><div><p className="eyebrow">Profil expert</p><h2>Compléter votre candidature</h2></div></div>
      <ExpertProfileForm busy={busy} onSave={(input) => run(() => humanApi.saveExpertProfile(session, input))} />
    </section>;
  }

  const expert = dashboard.expert;
  return <section className="expert-layout">
    <div className="panel expert-summary">
      <div><p className="eyebrow">Profil expert</p><h2>{expert.profession}</h2><p className="muted">{expert.specialties.map((item) => item.label).join(' · ')}</p></div>
      <div className={`verification-badge ${expert.verified ? 'verified' : ''}`}>{expert.verified ? 'Vérifié' : `Validation : ${expert.verification_status}`}</div>
      <label className="availability-toggle"><input type="checkbox" checked={expert.available} disabled={!expert.verified || busy} onChange={(e) => run(() => humanApi.setExpertAvailability(session, e.target.checked))} /> Disponible pour les missions</label>
      {!expert.verified && <div className="notice">Votre profil doit être validé par HUMAN avant de pouvoir recevoir des missions.</div>}
    </div>

    <div className="panel form-panel"><div className="panel-heading"><div><p className="eyebrow">Propositions</p><h2>Missions à accepter</h2></div><span className="count-pill">{expert.offers.length}</span></div>
      {!expert.offers.length && <div className="matching-state">{expert.available ? 'Disponible — aucune mission compatible en attente pour le moment.' : 'Vous êtes indisponible. Activez la disponibilité pour recevoir les prochaines missions compatibles.'}</div>}
      {expert.offers.map((offer) => <article className="offer-card" key={offer.match_id}>
        <small>{offer.category_label} · {offer.urgency === 'urgent' ? 'Urgent' : 'Normal'}</small><h3>{offer.question}</h3>{offer.context && <p>{offer.context}</p>}{offer.expires_at && <p className="offer-expiry">Réponse attendue avant {new Date(offer.expires_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>}
        <div className="button-row"><button className="primary-button" disabled={busy} onClick={() => run(() => humanApi.expertRespond(session, offer.request_id, true))}>Accepter</button><button className="secondary-button" disabled={busy} onClick={() => run(() => humanApi.expertRespond(session, offer.request_id, false))}>Refuser</button></div>
      </article>)}
    </div>

    <div className="panel form-panel wide-panel"><div className="panel-heading"><div><p className="eyebrow">Interventions</p><h2>Missions en cours</h2></div><button className="text-button" onClick={() => refresh(session)}>Actualiser</button></div>
      {!expert.jobs.length && <p className="muted">Aucune intervention en cours.</p>}
      {expert.jobs.map((job: HumanJob) => <article className="job-card" key={job.request_id}>
        <div className="status-row"><span>{job.category_label}</span><strong>{statusLabel[job.status] || job.status}</strong></div><h3>{job.question}</h3>{job.context && <p className="muted">{job.context}</p>}
        <MessageThread session={session} requestId={job.request_id} canSend={['accepted', 'in_progress', 'answered'].includes(job.status)} />
        {job.status === 'accepted' && (() => { const payment = finance?.requests.find((item) => item.request_id === job.request_id) ?? null; const blocked = payment?.state === 'quoted'; return <div className="button-row"><button className="primary-button" disabled={busy || blocked} onClick={() => run(async () => { await humanApi.startIntervention(session, job.request_id); await refreshFinance(session); })}>{blocked ? 'Paiement en attente' : 'Démarrer l’intervention'}</button>{payment?.state === 'reserved' && <span className="finance-ok">Crédits réservés</span>}</div>; })()}
        {job.status === 'in_progress' && <div className="answer-editor"><textarea rows={5} value={answerDraft} onChange={(e) => setAnswerDraft(e.target.value)} placeholder="Rédigez la réponse experte…" /><button className="primary-button" disabled={busy || answerDraft.trim().length < 2} onClick={() => run(async () => { await humanApi.submitAnswer(session, job.request_id, answerDraft); setAnswerDraft(''); })}>Envoyer la réponse</button></div>}
        {job.expert_answer && <div className="answer-card"><small>Réponse envoyée</small><p>{job.expert_answer}</p></div>}
      </article>)}
    </div>
  </section>;
}

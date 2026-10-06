import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { AuthPanel } from './components/AuthPanel';
import { ExpertProfileForm } from './components/ExpertProfileForm';
import { RequestForm } from './components/RequestForm';
import type { HumanDashboard, HumanJob, HumanRequestDetail, HumanRequestInput } from './domain/request';
import { humanConfigReady, supabase } from './lib/supabase';
import { humanApi } from './services/humanApi';

const statusLabel: Record<string, string> = {
  draft: 'Brouillon', searching: 'Recherche expert', offered: 'Proposée à un expert', accepted: 'Expert trouvé',
  in_progress: 'Intervention en cours', answered: 'Réponse reçue', completed: 'Terminée', cancelled: 'Annulée',
};

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [dashboard, setDashboard] = useState<HumanDashboard | null>(null);
  const [selected, setSelected] = useState<HumanRequestDetail | null>(null);
  const [answerDraft, setAnswerDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (activeSession: Session) => {
    const desiredRole = activeSession.user.user_metadata?.human_role === 'expert' ? 'expert' : 'user';
    await humanApi.bootstrapAccount(activeSession, {
      role: desiredRole,
      firstName: activeSession.user.user_metadata?.first_name,
      lastName: activeSession.user.user_metadata?.last_name,
    });
    const data = await humanApi.getDashboard(activeSession);
    setDashboard(data);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setDashboard(null);
      setSelected(null);
      return;
    }
    setError(null);
    refresh(session).catch((err) => setError(err instanceof Error ? err.message : 'Erreur HUMAN'));
  }, [session, refresh]);

  async function run(action: () => Promise<unknown>, reload = true) {
    if (!session) return;
    setBusy(true);
    setError(null);
    try {
      await action();
      if (reload) await refresh(session);
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
      <div><strong>HUMAN</strong><span>Human fallback for AI</span></div>
      {session && <div className="top-actions"><span>{session.user.email}</span><button className="secondary-button" onClick={() => supabase.auth.signOut()}>Déconnexion</button></div>}
    </header>

    <section className="hero compact-hero">
      <div className="hero-badge">HUMAN · SPRINT 4</div>
      <h1>Quand l’IA atteint sa limite, <span>HUMAN appelle la bonne personne.</span></h1>
      <p>Compte réel, missions réelles, matching sécurisé et espace expert connecté au backend privé HUMAN.</p>
    </section>

    {!session ? <AuthPanel /> : !dashboard ? <section className="panel auth-shell"><div className="spinner" /><p>Chargement de votre espace HUMAN…</p></section> : <>
      {error && <div className="error-banner">{error}</div>}
      <section className="account-strip panel">
        <div><p className="eyebrow">Compte</p><h2>{dashboard.profile?.first_name || 'Compte'} {dashboard.profile?.last_name || ''}</h2></div>
        <div className="role-pill">{dashboard.profile?.role === 'expert' ? 'Expert' : dashboard.profile?.role === 'admin' ? 'Admin' : 'Utilisateur'}</div>
      </section>

      {dashboard.profile?.role === 'expert' || dashboard.profile?.role === 'admin' ? (
        <ExpertArea dashboard={dashboard} session={session} busy={busy} run={run} refresh={refresh} answerDraft={answerDraft} setAnswerDraft={setAnswerDraft} />
      ) : (
        <UserArea dashboard={dashboard} busy={busy} createRequest={createRequest} openRequest={openRequest} selected={selected} session={session} run={run} setSelected={setSelected} />
      )}
    </>}

    <footer>HUMAN · infrastructure d’intervention humaine pour agents IA</footer>
  </main>;
}

function UserArea({ dashboard, busy, createRequest, openRequest, selected, session, run, setSelected }: {
  dashboard: HumanDashboard;
  busy: boolean;
  createRequest: (input: HumanRequestInput) => Promise<void>;
  openRequest: (id: string) => Promise<void>;
  selected: HumanRequestDetail | null;
  session: Session;
  run: (action: () => Promise<unknown>, reload?: boolean) => Promise<void>;
  setSelected: (value: HumanRequestDetail | null) => void;
}) {
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

function ExpertArea({ dashboard, session, busy, run, refresh, answerDraft, setAnswerDraft }: {
  dashboard: HumanDashboard;
  session: Session;
  busy: boolean;
  run: (action: () => Promise<unknown>, reload?: boolean) => Promise<void>;
  refresh: (session: Session) => Promise<void>;
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
      {!expert.offers.length && <p className="muted">Aucune proposition active.</p>}
      {expert.offers.map((offer) => <article className="offer-card" key={offer.match_id}>
        <small>{offer.category_label} · {offer.urgency === 'urgent' ? 'Urgent' : 'Normal'}</small><h3>{offer.question}</h3>{offer.context && <p>{offer.context}</p>}
        <div className="button-row"><button className="primary-button" disabled={busy} onClick={() => run(() => humanApi.expertRespond(session, offer.request_id, true))}>Accepter</button><button className="secondary-button" disabled={busy} onClick={() => run(() => humanApi.expertRespond(session, offer.request_id, false))}>Refuser</button></div>
      </article>)}
    </div>

    <div className="panel form-panel wide-panel"><div className="panel-heading"><div><p className="eyebrow">Interventions</p><h2>Missions en cours</h2></div><button className="text-button" onClick={() => refresh(session)}>Actualiser</button></div>
      {!expert.jobs.length && <p className="muted">Aucune intervention en cours.</p>}
      {expert.jobs.map((job: HumanJob) => <article className="job-card" key={job.request_id}>
        <div className="status-row"><span>{job.category_label}</span><strong>{statusLabel[job.status] || job.status}</strong></div><h3>{job.question}</h3>{job.context && <p className="muted">{job.context}</p>}
        {job.status === 'accepted' && <button className="primary-button" disabled={busy} onClick={() => run(() => humanApi.startIntervention(session, job.request_id))}>Démarrer l’intervention</button>}
        {job.status === 'in_progress' && <div className="answer-editor"><textarea rows={5} value={answerDraft} onChange={(e) => setAnswerDraft(e.target.value)} placeholder="Rédigez la réponse experte…" /><button className="primary-button" disabled={busy || answerDraft.trim().length < 2} onClick={() => run(async () => { await humanApi.submitAnswer(session, job.request_id, answerDraft); setAnswerDraft(''); })}>Envoyer la réponse</button></div>}
        {job.expert_answer && <div className="answer-card"><small>Réponse envoyée</small><p>{job.expert_answer}</p></div>}
      </article>)}
    </div>
  </section>;
}

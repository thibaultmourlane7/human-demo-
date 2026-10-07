import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import type {
  HumanAdminDashboard,
  HumanAdminExpert,
  HumanExpertVerificationStatus,
  HumanRequestDetail,
} from '../domain/request';
import { humanApi } from '../services/humanApi';
import { MessageThread } from './MessageThread';

interface Props {
  session: Session;
}

const statusLabel: Record<string, string> = {
  pending: 'À vérifier',
  verified: 'Vérifié',
  rejected: 'Refusé',
  suspended: 'Suspendu',
  draft: 'Brouillon',
  searching: 'Recherche expert',
  offered: 'Proposée',
  accepted: 'Expert trouvé',
  in_progress: 'En cours',
  answered: 'Réponse reçue',
  completed: 'Terminée',
  cancelled: 'Annulée',
};

export function AdminArea({ session }: Props) {
  const [data, setData] = useState<HumanAdminDashboard | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<HumanRequestDetail | null>(null);
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [filter, setFilter] = useState<HumanExpertVerificationStatus | 'all'>('pending');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setData(await humanApi.getAdminDashboard(session));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de charger l’administration HUMAN');
    }
  }, [session]);

  useEffect(() => { void load(); }, [load]);

  const experts = useMemo(() => {
    if (!data) return [];
    return filter === 'all' ? data.experts : data.experts.filter((expert) => expert.verification_status === filter);
  }, [data, filter]);

  async function setStatus(expert: HumanAdminExpert, status: HumanExpertVerificationStatus) {
    const reason = reasons[expert.id]?.trim() || '';
    if ((status === 'rejected' || status === 'suspended') && reason.length < 3) {
      setError('Un motif d’au moins 3 caractères est obligatoire pour refuser ou suspendre un expert.');
      return;
    }

    setBusy(expert.id);
    setError(null);
    try {
      await humanApi.setAdminExpertStatus(session, expert.id, status, reason);
      setReasons((current) => ({ ...current, [expert.id]: '' }));
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action admin impossible');
    } finally {
      setBusy(null);
    }
  }

  async function openRequest(requestId: string) {
    setBusy(requestId);
    setError(null);
    try {
      setSelectedRequest(await humanApi.getRequestDetail(session, requestId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible d’ouvrir la mission');
    } finally {
      setBusy(null);
    }
  }

  if (!data) {
    return <section className="panel admin-loading"><div className="spinner" /><strong>Ouverture du poste de contrôle HUMAN…</strong>{error && <div className="error-banner">{error}</div>}</section>;
  }

  return <section className="admin-layout">
    {error && <div className="error-banner admin-wide">{error}</div>}

    <div className="admin-console panel">
      <div className="admin-console-head">
        <div>
          <p className="eyebrow">Control room</p>
          <h2>Administration HUMAN</h2>
        </div>
        <button className="secondary-button" onClick={() => void load()}>Synchroniser</button>
      </div>
      <div className="admin-stats">
        <Stat label="Experts à vérifier" value={data.stats.experts_pending} signal />
        <Stat label="Experts vérifiés" value={data.stats.experts_verified} />
        <Stat label="Missions actives" value={data.stats.requests_active} />
        <Stat label="Missions terminées" value={data.stats.requests_completed} />
      </div>
    </div>

    <div className="panel admin-experts">
      <div className="panel-heading">
        <div><p className="eyebrow">Expert clearance</p><h2>Validation des experts</h2></div>
        <span className="count-pill">{data.experts.length}</span>
      </div>

      <div className="admin-filter">
        {(['pending','verified','suspended','rejected','all'] as const).map((item) =>
          <button key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>
            {item === 'all' ? 'Tous' : statusLabel[item]}
          </button>
        )}
      </div>

      <div className="admin-expert-grid">
        {!experts.length && <div className="admin-empty">Aucun expert dans cette catégorie.</div>}
        {experts.map((expert) => <article className="admin-expert-card" key={expert.id}>
          <div className="admin-expert-top">
            <div>
              <small>{expert.country_code} / {expert.languages.join(', ').toUpperCase()}</small>
              <h3>{[expert.first_name, expert.last_name].filter(Boolean).join(' ') || 'Expert HUMAN'}</h3>
              <strong>{expert.profession}</strong>
            </div>
            <span className={"admin-status " + expert.verification_status}>{statusLabel[expert.verification_status]}</span>
          </div>

          <p>{expert.bio || 'Aucune présentation fournie.'}</p>
          <div className="admin-specialties">
            {expert.specialties.map((item) => <span key={item.code}>{item.label}</span>)}
          </div>

          <div className="admin-meta-row">
            <span>Disponible</span><strong>{expert.available ? 'OUI' : 'NON'}</strong>
          </div>
          <div className="admin-meta-row">
            <span>Candidature</span><strong>{new Date(expert.created_at).toLocaleDateString('fr-FR')}</strong>
          </div>

          <label className="admin-reason">
            Note / motif admin
            <textarea
              rows={2}
              value={reasons[expert.id] || ''}
              onChange={(e) => setReasons((current) => ({ ...current, [expert.id]: e.target.value }))}
              placeholder="Obligatoire pour un refus ou une suspension"
            />
          </label>

          <div className="button-row admin-actions">
            {expert.verification_status !== 'verified' && <button className="primary-button" disabled={busy === expert.id} onClick={() => void setStatus(expert, 'verified')}>Valider</button>}
            {expert.verification_status === 'pending' && <button className="secondary-button" disabled={busy === expert.id} onClick={() => void setStatus(expert, 'rejected')}>Refuser</button>}
            {expert.verification_status === 'verified' && <button className="secondary-button danger-action" disabled={busy === expert.id} onClick={() => void setStatus(expert, 'suspended')}>Suspendre</button>}
            {(expert.verification_status === 'rejected' || expert.verification_status === 'suspended') && <button className="secondary-button" disabled={busy === expert.id} onClick={() => void setStatus(expert, 'pending')}>Remettre en examen</button>}
          </div>
        </article>)}
      </div>
    </div>

    <div className="panel admin-requests">
      <div className="panel-heading"><div><p className="eyebrow">Mission watch</p><h2>Missions récentes</h2></div><span className="count-pill">{data.requests.length}</span></div>
      <div className="admin-request-list">
        {!data.requests.length && <div className="admin-empty">Aucune mission créée pour le moment.</div>}
        {data.requests.map((request) => <button key={request.id} onClick={() => void openRequest(request.id)}>
          <span className="admin-request-code">{request.category_code.toUpperCase()}</span>
          <span><strong>{request.client_name || 'Client HUMAN'}</strong><small>{request.category_label}</small></span>
          <span><strong>{statusLabel[request.status] || request.status}</strong><small>{request.selected_expert_profession || 'Aucun expert'}</small></span>
          <b>↗</b>
        </button>)}
      </div>
    </div>

    <div className="panel admin-audit">
      <div className="panel-heading"><div><p className="eyebrow">Audit trail</p><h2>Décisions experts</h2></div></div>
      <div className="admin-event-list">
        {!data.events.length && <div className="admin-empty">Aucune décision enregistrée.</div>}
        {data.events.map((event) => <article key={event.id}>
          <div className="admin-event-line"><span>{event.previous_status}</span><b>→</b><span className="event-next">{event.new_status}</span></div>
          <strong>{event.expert_name || 'Expert HUMAN'}</strong>
          <p>{event.reason || 'Aucun motif requis.'}</p>
          <small>{event.actor_name || 'Admin HUMAN'} · {new Date(event.created_at).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</small>
        </article>)}
      </div>
    </div>

    {selectedRequest && <div className="panel admin-request-detail admin-wide">
      <div className="panel-heading">
        <div><p className="eyebrow">Mission inspection</p><h2>{selectedRequest.request.category_label}</h2></div>
        <button className="text-button" onClick={() => setSelectedRequest(null)}>Fermer</button>
      </div>
      <div className="status-row"><span>Statut</span><strong>{statusLabel[selectedRequest.request.status] || selectedRequest.request.status}</strong></div>
      <p className="question-box">{selectedRequest.content.question}</p>
      {selectedRequest.content.context && <p className="muted">{selectedRequest.content.context}</p>}
      <MessageThread
        session={session}
        requestId={selectedRequest.request.id}
        canSend={['accepted','in_progress','answered'].includes(selectedRequest.request.status)}
      />
      {selectedRequest.result?.expert_answer && <div className="answer-card"><small>Réponse expert</small><p>{selectedRequest.result.expert_answer}</p></div>}
    </div>}
  </section>;
}

function Stat({ label, value, signal = false }: { label: string; value: number; signal?: boolean }) {
  return <article className={signal ? 'admin-stat signal' : 'admin-stat'}>
    <span>{label}</span>
    <strong>{String(value).padStart(2, '0')}</strong>
  </article>;
}

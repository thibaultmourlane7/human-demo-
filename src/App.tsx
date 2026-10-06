import { useState } from 'react';
import { RequestForm } from './components/RequestForm';
import type { DemoRequest, DemoRequestInput } from './domain/request';
import { answerDemoRequest, createDemoRequest, matchDemoExpert } from './services/mockHuman';

const statusLabel: Record<DemoRequest['status'], string> = {
  draft: 'Brouillon',
  searching: 'Recherche d’un expert',
  offered: 'Proposée à un expert',
  accepted: 'Expert trouvé',
  answered: 'Réponse reçue',
  completed: 'Terminée',
};

export default function App() {
  const [request, setRequest] = useState<DemoRequest | null>(null);

  function submit(input: DemoRequestInput) {
    const created = createDemoRequest(input);
    setRequest(created);
    window.setTimeout(() => {
      setRequest((current) => (current ? matchDemoExpert(current) : current));
    }, 700);
  }

  function simulateAnswer() {
    setRequest((current) => (current ? answerDemoRequest(current) : current));
  }

  function complete() {
    setRequest((current) => (current ? { ...current, status: 'completed' } : current));
  }

  function reset() {
    setRequest(null);
  }

  return (
    <main>
      <section className="hero">
        <div className="hero-badge">HUMAN · DÉMO PUBLIQUE</div>
        <h1>Votre IA hésite ? <span>Faites vérifier sa réponse par un véritable expert.</span></h1>
        <p>
          HUMAN est une infrastructure de secours humain pour les IA et les agents. Cette première démo illustre le parcours sans connecter de données sensibles ni de backend privé.
        </p>
        <div className="hero-flow" aria-label="Fonctionnement HUMAN">
          <span>Utilisateur</span><b>→</b><span>IA</span><b>→</b><span className="accent">HUMAN</span><b>→</b><span>Expert</span><b>→</b><span>IA</span>
        </div>
      </section>

      <section className="workspace">
        <div className="panel form-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Étape 1</p>
              <h2>Décrire la demande</h2>
            </div>
            <span className="demo-pill">Simulation</span>
          </div>
          <RequestForm onSubmit={submit} disabled={Boolean(request)} />
        </div>

        <aside className="panel status-panel">
          <p className="eyebrow">Parcours HUMAN</p>
          {!request ? (
            <div className="empty-state">
              <div className="empty-icon">H</div>
              <h3>Aucune demande en cours</h3>
              <p>Posez une question pour voir la recherche et l'intervention d'un expert.</p>
            </div>
          ) : (
            <div className="request-status">
              <div className="status-row">
                <span>Statut</span>
                <strong>{statusLabel[request.status]}</strong>
              </div>
              <div className="status-row">
                <span>Domaine</span>
                <strong>{request.category}</strong>
              </div>
              <div className="status-row">
                <span>Pays</span>
                <strong>{request.country}</strong>
              </div>

              {request.status === 'searching' && (
                <div className="matching-card">
                  <div className="spinner" />
                  <div><strong>Recherche sécurisée</strong><p>Un expert compatible est recherché.</p></div>
                </div>
              )}

              {request.expert && (
                <div className="expert-card">
                  <div className="avatar">✓</div>
                  <div>
                    <small>Expert vérifié · profil démo</small>
                    <h3>{request.expert.displayName}</h3>
                    <p>{request.expert.profession} · {request.expert.specialty}</p>
                    <span>Réponse estimée : ~{request.expert.etaMinutes} min</span>
                  </div>
                </div>
              )}

              {request.status === 'accepted' && (
                <button className="primary-button full" onClick={simulateAnswer}>Simuler la réponse de l'expert</button>
              )}

              {request.answer && (
                <div className="answer-card">
                  <small>Réponse humaine</small>
                  <p>{request.answer}</p>
                </div>
              )}

              {request.status === 'answered' && (
                <button className="primary-button full" onClick={complete}>Clôturer la demande</button>
              )}

              {request.status === 'completed' && (
                <button className="secondary-button full" onClick={reset}>Nouvelle démonstration</button>
              )}
            </div>
          )}
        </aside>
      </section>

      <section className="principles">
        <article><strong>01</strong><h3>Expert unique</h3><p>La demande n'est pas publiée à toute une marketplace.</p></article>
        <article><strong>02</strong><h3>France d'abord</h3><p>Droit, comptabilité, fiscalité et développement.</p></article>
        <article><strong>03</strong><h3>API-ready</h3><p>Le moteur privé sera utilisable plus tard par ChatGPT, Claude et d'autres agents.</p></article>
      </section>

      <footer>HUMAN · Sprint 1 · Démo sans paiement ni donnée réelle</footer>
    </main>
  );
}

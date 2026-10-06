import { FormEvent, useState } from 'react';
import type { DemoCategory, DemoRequestInput, DemoUrgency } from '../domain/request';

interface Props {
  onSubmit: (input: DemoRequestInput) => void;
  disabled?: boolean;
}

const labels: Record<DemoCategory, string> = {
  legal: 'Droit français',
  accounting: 'Comptabilité française',
  tax: 'Fiscalité française',
  development: 'Développement informatique',
};

export function RequestForm({ onSubmit, disabled = false }: Props) {
  const [category, setCategory] = useState<DemoCategory>('legal');
  const [question, setQuestion] = useState('');
  const [context, setContext] = useState('');
  const [urgency, setUrgency] = useState<DemoUrgency>('normal');

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (question.trim().length < 10) return;

    onSubmit({
      category,
      question: question.trim(),
      context: context.trim(),
      country: 'France',
      language: 'fr',
      urgency,
    });
  }

  return (
    <form className="request-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label>
          Domaine
          <select value={category} onChange={(e) => setCategory(e.target.value as DemoCategory)} disabled={disabled}>
            {Object.entries(labels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label>
          Urgence
          <select value={urgency} onChange={(e) => setUrgency(e.target.value as DemoUrgency)} disabled={disabled}>
            <option value="normal">Normale</option>
            <option value="urgent">Urgente</option>
          </select>
        </label>
      </div>

      <label>
        Question
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ex. Cette clause est-elle conforme au droit français ?"
          rows={5}
          minLength={10}
          required
          disabled={disabled}
        />
      </label>

      <label>
        Contexte utile
        <textarea
          value={context}
          onChange={(e) => setContext(e.target.value)}
          placeholder="Ajoutez uniquement les éléments nécessaires. Cette démo ne transmet rien à un vrai expert."
          rows={4}
          disabled={disabled}
        />
      </label>

      <div className="form-footer">
        <span className="privacy-note">Démo publique : aucune donnée n'est envoyée à HUMAN.</span>
        <button className="primary-button" type="submit" disabled={disabled || question.trim().length < 10}>
          Demander un expert
        </button>
      </div>
    </form>
  );
}

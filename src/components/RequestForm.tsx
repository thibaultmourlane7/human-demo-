import { FormEvent, useState } from 'react';
import type { HumanCategory, HumanRequestInput, HumanUrgency } from '../domain/request';

interface Props {
  onSubmit: (input: HumanRequestInput) => Promise<void> | void;
  disabled?: boolean;
}

const labels: Record<HumanCategory, string> = {
  legal: 'Droit français',
  accounting: 'Comptabilité française',
  tax: 'Fiscalité française',
  development: 'Développement informatique',
};

export function RequestForm({ onSubmit, disabled = false }: Props) {
  const [category, setCategory] = useState<HumanCategory>('legal');
  const [question, setQuestion] = useState('');
  const [context, setContext] = useState('');
  const [urgency, setUrgency] = useState<HumanUrgency>('normal');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (question.trim().length < 10) return;
    await onSubmit({
      category,
      question: question.trim(),
      context: context.trim(),
      country: 'FR',
      language: 'fr',
      urgency,
    });
    setQuestion('');
    setContext('');
  }

  return (
    <form className="request-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label>Domaine
          <select value={category} onChange={(e) => setCategory(e.target.value as HumanCategory)} disabled={disabled}>
            {Object.entries(labels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
        </label>
        <label>Urgence
          <select value={urgency} onChange={(e) => setUrgency(e.target.value as HumanUrgency)} disabled={disabled}>
            <option value="normal">Normale</option>
            <option value="urgent">Urgente</option>
          </select>
        </label>
      </div>
      <label>Question
        <textarea value={question} onChange={(e) => setQuestion(e.target.value)} rows={5} minLength={10} required disabled={disabled} placeholder="Décrivez précisément la question à faire vérifier." />
      </label>
      <label>Contexte utile
        <textarea value={context} onChange={(e) => setContext(e.target.value)} rows={4} disabled={disabled} placeholder="Ajoutez uniquement les éléments nécessaires à l'expert." />
      </label>
      <div className="form-footer">
        <span className="privacy-note">La mission est transmise uniquement à l’expert sélectionné par HUMAN.</span>
        <button className="primary-button" type="submit" disabled={disabled || question.trim().length < 10}>Créer la mission</button>
      </div>
    </form>
  );
}

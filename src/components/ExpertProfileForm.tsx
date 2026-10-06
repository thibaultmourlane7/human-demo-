import { FormEvent, useState } from 'react';
import type { HumanCategory } from '../domain/request';

const categories: Array<{ code: HumanCategory; label: string }> = [
  { code: 'legal', label: 'Droit français' },
  { code: 'accounting', label: 'Comptabilité française' },
  { code: 'tax', label: 'Fiscalité française' },
  { code: 'development', label: 'Développement informatique' },
];

export function ExpertProfileForm({ onSave, busy }: {
  onSave: (input: { profession: string; bio: string; country: string; languages: string[]; specialties: string[] }) => Promise<void>;
  busy: boolean;
}) {
  const [profession, setProfession] = useState('');
  const [bio, setBio] = useState('');
  const [specialties, setSpecialties] = useState<HumanCategory[]>([]);

  function toggle(code: HumanCategory) {
    setSpecialties((current) => current.includes(code) ? current.filter((item) => item !== code) : [...current, code]);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!specialties.length) return;
    await onSave({ profession, bio, country: 'FR', languages: ['fr'], specialties });
  }

  return <form className="request-form" onSubmit={submit}>
    <label>Profession<input value={profession} onChange={(e) => setProfession(e.target.value)} placeholder="Avocat, expert-comptable, développeur…" required /></label>
    <label>Présentation<textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={4} /></label>
    <fieldset className="specialty-grid"><legend>Spécialités</legend>
      {categories.map((item) => <label className="check-card" key={item.code}>
        <input type="checkbox" checked={specialties.includes(item.code)} onChange={() => toggle(item.code)} /> {item.label}
      </label>)}
    </fieldset>
    <button className="primary-button" disabled={busy || !profession.trim() || !specialties.length}>{busy ? 'Enregistrement…' : 'Enregistrer mon profil expert'}</button>
  </form>;
}

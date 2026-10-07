import { useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import type {
  HumanCategory,
  HumanFinanceDashboard,
} from '../domain/request';
import { humanApi } from '../services/humanApi';

interface Props {
  session: Session;
  finance: HumanFinanceDashboard | null;
  role: 'user' | 'expert' | 'admin';
  onRefresh: () => Promise<void>;
}

const categoryLabel: Record<HumanCategory, string> = {
  legal: 'Droit français',
  accounting: 'Comptabilité',
  tax: 'Fiscalité',
  development: 'Développement logiciel',
};

function euros(cents: number, currency = 'EUR') {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency }).format(cents / 100);
}

export function FinancePanel({ session, finance, role, onRefresh }: Props) {
  const [category, setCategory] = useState<HumanCategory>('legal');
  const [base, setBase] = useState('50');
  const [expert, setExpert] = useState('35');
  const [urgent, setUrgent] = useState('10');
  const [target, setTarget] = useState('');
  const [credit, setCredit] = useState('100');
  const [reason, setReason] = useState('Crédits de test HUMAN');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedAccount = useMemo(
    () => finance?.accounts.find((item) => item.user_id === target) ?? null,
    [finance, target],
  );

  if (!finance) {
    return <section className="panel finance-panel"><div className="spinner" /><strong>Chargement finances…</strong></section>;
  }

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      await onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur financière HUMAN');
    } finally {
      setBusy(false);
    }
  }

  return <section className="panel finance-panel">
    <div className="panel-heading">
      <div>
        <p className="eyebrow">Credits / finance</p>
        <h2>{role === 'expert' ? 'Revenus expert' : role === 'admin' ? 'Pilotage financier' : 'Mes crédits HUMAN'}</h2>
      </div>
      <span className="finance-balance">{euros(finance.wallet.available_cents, finance.wallet.currency_code)}</span>
    </div>

    <div className="finance-metrics">
      <div><span>Disponible</span><strong>{euros(finance.wallet.available_cents, finance.wallet.currency_code)}</strong></div>
      <div><span>Réservé</span><strong>{euros(finance.wallet.reserved_cents, finance.wallet.currency_code)}</strong></div>
      {role === 'admin' && <div><span>Commission HUMAN</span><strong>{euros(finance.platform?.available_cents ?? 0, finance.platform?.currency_code ?? 'EUR')}</strong></div>}
      {role === 'expert' && <div><span>Missions réglées</span><strong>{finance.requests.filter((r) => r.state === 'settled').length}</strong></div>}
      {role === 'user' && <div><span>Missions financées</span><strong>{finance.requests.filter((r) => ['reserved','settled'].includes(r.state)).length}</strong></div>}
    </div>

    {error && <div className="error-banner">{error}</div>}

    {role === 'admin' && <>
      <div className="finance-admin-grid">
        <div className="finance-card">
          <h3>Tarification</h3>
          <label>Domaine
            <select value={category} onChange={(e) => setCategory(e.target.value as HumanCategory)}>
              {Object.entries(categoryLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <div className="finance-fields">
            <label>Prix client (€)<input type="number" min="0" step="0.01" value={base} onChange={(e) => setBase(e.target.value)} /></label>
            <label>Part expert (€)<input type="number" min="0" step="0.01" value={expert} onChange={(e) => setExpert(e.target.value)} /></label>
            <label>Supplément urgent (€)<input type="number" min="0" step="0.01" value={urgent} onChange={(e) => setUrgent(e.target.value)} /></label>
          </div>
          <button className="primary-button" disabled={busy} onClick={() => void run(() => humanApi.setAdminPricingPolicy(session, {
            categoryCode: category,
            basePriceCents: Math.round(Number(base) * 100),
            expertCompensationCents: Math.round(Number(expert) * 100),
            urgentSurchargeCents: Math.round(Number(urgent) * 100),
          }))}>Enregistrer le tarif</button>
        </div>

        <div className="finance-card">
          <h3>Créditer un compte</h3>
          <label>Compte
            <select value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="">Sélectionner…</option>
              {finance.accounts.map((account) => <option key={account.user_id} value={account.user_id}>
                {account.email} · {account.role} · {euros(account.available_cents, account.currency_code)}
              </option>)}
            </select>
          </label>
          <label>Montant (€)<input type="number" step="0.01" value={credit} onChange={(e) => setCredit(e.target.value)} /></label>
          <label>Motif<input value={reason} onChange={(e) => setReason(e.target.value)} /></label>
          <button className="primary-button" disabled={busy || !selectedAccount || Math.round(Number(credit) * 100) === 0 || reason.trim().length < 3} onClick={() => {
            if (!selectedAccount) return;
            void run(() => humanApi.adjustAdminWallet(session, {
              targetUserId: selectedAccount.user_id,
              walletKind: selectedAccount.wallet_kind,
              amountCents: Math.round(Number(credit) * 100),
              reason,
            }));
          }}>Appliquer</button>
        </div>
      </div>

      <div className="finance-policy-list">
        <h3>Tarifs actifs</h3>
        {!finance.policies.length && <p className="muted">Aucun tarif configuré pour le moment.</p>}
        {finance.policies.map((policy) => <div className="finance-policy" key={policy.id}>
          <strong>{categoryLabel[policy.category_code] || policy.category_code}</strong>
          <span>Client {euros(policy.base_price_cents, policy.currency_code)}</span>
          <span>Expert {euros(policy.expert_compensation_cents, policy.currency_code)}</span>
          <span>Urgent +{euros(policy.urgent_surcharge_cents, policy.currency_code)}</span>
          <span>Commission base {euros(policy.base_price_cents - policy.expert_compensation_cents, policy.currency_code)}</span>
        </div>)}
      </div>
    </>}

    {role !== 'admin' && <div className="finance-ledger">
      <h3>Derniers mouvements</h3>
      {!finance.ledger.length && <p className="muted">Aucun mouvement pour le moment.</p>}
      {finance.ledger.slice(0, 6).map((entry) => <div key={entry.id}>
        <span>{entry.entry_type.replaceAll('_', ' ')}</span>
        <strong>{entry.delta_available_cents >= 0 ? '+' : ''}{euros(entry.delta_available_cents, finance.wallet.currency_code)}</strong>
      </div>)}
    </div>}
  </section>;
}

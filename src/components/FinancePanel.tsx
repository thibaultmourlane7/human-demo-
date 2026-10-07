import { useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { HumanCategory, HumanFinanceDashboard } from '../domain/request';
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
  const [clientRate, setClientRate] = useState('1.00');
  const [expertRate, setExpertRate] = useState('0.70');
  const [blockMinutes, setBlockMinutes] = useState('10');
  const [urgentMultiplier, setUrgentMultiplier] = useState('1.00');
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
          <h3>Tarification à la minute</h3>
          <label>Domaine
            <select value={category} onChange={(e) => setCategory(e.target.value as HumanCategory)}>
              {Object.entries(categoryLabel).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          <div className="finance-fields">
            <label>Client €/min<input type="number" min="0.01" step="0.01" value={clientRate} onChange={(e) => setClientRate(e.target.value)} /></label>
            <label>Expert €/min<input type="number" min="0" step="0.01" value={expertRate} onChange={(e) => setExpertRate(e.target.value)} /></label>
            <label>Bloc minimum (min)<input type="number" min="1" max="120" step="1" value={blockMinutes} onChange={(e) => setBlockMinutes(e.target.value)} /></label>
            <label>Urgence ×<input type="number" min="1" max="3" step="0.05" value={urgentMultiplier} onChange={(e) => setUrgentMultiplier(e.target.value)} /></label>
          </div>
          <button className="primary-button" disabled={busy} onClick={() => void run(() => humanApi.setAdminPricingPolicy(session, {
            categoryCode: category,
            clientRatePerMinuteCents: Math.round(Number(clientRate) * 100),
            expertRatePerMinuteCents: Math.round(Number(expertRate) * 100),
            billingBlockMinutes: Math.round(Number(blockMinutes)),
            urgentMultiplierBps: Math.round(Number(urgentMultiplier) * 10000),
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
          <span>Client {euros(policy.client_rate_per_minute_cents, policy.currency_code)}/min</span>
          <span>Expert {euros(policy.expert_rate_per_minute_cents, policy.currency_code)}/min</span>
          <span>HUMAN {euros(policy.client_rate_per_minute_cents - policy.expert_rate_per_minute_cents, policy.currency_code)}/min</span>
          <span>Bloc {policy.billing_block_minutes} min</span>
          <span>Urgence ×{(policy.urgent_multiplier_bps / 10000).toFixed(2)}</span>
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

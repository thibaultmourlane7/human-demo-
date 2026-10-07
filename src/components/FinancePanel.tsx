import { useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { HumanCategory, HumanFinanceDashboard, HumanTopup } from '../domain/request';
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

const topupStatusLabel: Record<string, string> = {
  created: 'Créée',
  checkout_created: 'Paiement en cours',
  paid: 'Payée',
  failed: 'Échec',
  expired: 'Expirée',
  refund_requested: 'Remboursement demandé',
  refunded: 'Remboursée',
  refund_review: 'À vérifier',
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
  const [topupAmount, setTopupAmount] = useState('20');
  const [topups, setTopups] = useState<HumanTopup[]>([]);
  const [busy, setBusy] = useState(false);
  const [topupBusy, setTopupBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedAccount = useMemo(
    () => finance?.accounts.find((item) => item.user_id === target) ?? null,
    [finance, target],
  );

  const returnState = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('topup')
    : null;

  async function refreshTopups() {
    if (role === 'expert') return;
    try {
      setTopups(await humanApi.getTopups(session));
    } catch {
      // Finance remains usable even if history is temporarily unavailable.
    }
  }

  useEffect(() => {
    if (role === 'expert') return;
    let cancelled = false;
    let attempts = 0;

    const load = async () => {
      try {
        const data = await humanApi.getTopups(session);
        if (!cancelled) setTopups(data);
        if (returnState === 'success') await onRefresh();
      } catch {
        // Polling is best-effort; actionable errors surface on explicit user actions.
      }
    };

    void load();

    if (returnState !== 'success') {
      return () => { cancelled = true; };
    }

    const timer = window.setInterval(() => {
      attempts += 1;
      void load();
      if (attempts >= 8) window.clearInterval(timer);
    }, 2500);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [session.access_token, role, returnState]);

  if (!finance) {
    return <section className="panel finance-panel"><div className="spinner" /><strong>Chargement finances…</strong></section>;
  }

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      await Promise.all([onRefresh(), refreshTopups()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur financière HUMAN');
    } finally {
      setBusy(false);
    }
  }

  async function startTopup(amountEuros: number) {
    const amountCents = Math.round(amountEuros * 100);
    if (!Number.isInteger(amountCents) || amountCents < 500 || amountCents > 50000) {
      setError('Le montant de recharge doit être compris entre 5 € et 500 €.');
      return;
    }

    setTopupBusy(true);
    setError(null);
    try {
      const checkout = await humanApi.createTopupCheckout(session, amountCents);
      window.location.assign(checkout.checkout_url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Impossible de créer le paiement Stripe');
      setTopupBusy(false);
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

    {returnState === 'success' && role !== 'expert' && <div className="matching-state signal">
      Paiement terminé chez Stripe. HUMAN confirme le webhook avant d’ajouter les crédits.
    </div>}
    {returnState === 'cancel' && role !== 'expert' && <div className="matching-state">
      Paiement annulé — aucun crédit n’a été ajouté.
    </div>}

    <div className="finance-metrics">
      <div><span>Disponible</span><strong>{euros(finance.wallet.available_cents, finance.wallet.currency_code)}</strong></div>
      <div><span>Réservé</span><strong>{euros(finance.wallet.reserved_cents, finance.wallet.currency_code)}</strong></div>
      {role === 'admin' && <div><span>Commission HUMAN</span><strong>{euros(finance.platform?.available_cents ?? 0, finance.platform?.currency_code ?? 'EUR')}</strong></div>}
      {role === 'expert' && <div><span>Missions réglées</span><strong>{finance.requests.filter((r) => r.state === 'settled').length}</strong></div>}
      {role === 'user' && <div><span>Missions financées</span><strong>{finance.requests.filter((r) => ['reserved','settled'].includes(r.state)).length}</strong></div>}
    </div>

    {error && <div className="error-banner">{error}</div>}

    {role === 'user' && <div className="finance-card topup-card">
      <div>
        <p className="eyebrow">Recharge Stripe</p>
        <h3>Acheter des crédits HUMAN</h3>
        <p className="muted">1 € payé = 1 crédit HUMAN. Les crédits sont ajoutés uniquement après confirmation du paiement par Stripe.</p>
      </div>
      <div className="topup-packs">
        {[20, 50, 100].map((amount) => <button
          key={amount}
          className="secondary-button"
          disabled={topupBusy}
          onClick={() => void startTopup(amount)}
        >{amount} €</button>)}
      </div>
      <div className="topup-custom">
        <label>Autre montant (€)
          <input
            type="number"
            min="5"
            max="500"
            step="1"
            value={topupAmount}
            onChange={(e) => setTopupAmount(e.target.value)}
          />
        </label>
        <button
          className="primary-button"
          disabled={topupBusy}
          onClick={() => void startTopup(Number(topupAmount))}
        >{topupBusy ? 'Ouverture Stripe…' : 'Recharger'}</button>
      </div>
    </div>}

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

    {role !== 'expert' && <div className="topup-history">
      <div className="panel-heading">
        <div><p className="eyebrow">Paiements</p><h3>{role === 'admin' ? 'Recharges Stripe récentes' : 'Mes recharges'}</h3></div>
        <button className="text-button" onClick={() => void refreshTopups()}>Actualiser</button>
      </div>
      {!topups.length && <p className="muted">Aucune recharge enregistrée.</p>}
      {topups.slice(0, role === 'admin' ? 20 : 8).map((topup) => <div className="topup-row" key={topup.id}>
        <div>
          <strong>{euros(topup.amount_cents, topup.currency_code)}</strong>
          {role === 'admin' && topup.email && <small>{topup.email}</small>}
          <small>{new Date(topup.created_at).toLocaleString('fr-FR')}</small>
        </div>
        <span className={`topup-status ${topup.status}`}>{topupStatusLabel[topup.status] || topup.status}</span>
      </div>)}
    </div>}

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

export type HumanCategory = 'legal' | 'accounting' | 'tax' | 'development';
export type HumanUrgency = 'normal' | 'urgent';
export type HumanRequestStatus =
  | 'draft'
  | 'searching'
  | 'offered'
  | 'accepted'
  | 'in_progress'
  | 'answered'
  | 'completed'
  | 'cancelled';

export interface HumanRequestInput {
  category: HumanCategory;
  question: string;
  context: string;
  country: 'FR';
  language: 'fr';
  urgency: HumanUrgency;
}

export interface HumanRequestSummary {
  id: string;
  title: string | null;
  status: HumanRequestStatus;
  urgency: HumanUrgency;
  category_code: HumanCategory;
  category_label: string;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

export interface HumanOffer {
  match_id: string;
  request_id: string;
  status: 'pending';
  offered_at: string;
  expires_at: string | null;
  title: string | null;
  urgency: HumanUrgency;
  category_code: HumanCategory;
  category_label: string;
  question: string;
  context: string | null;
}

export interface HumanJob {
  request_id: string;
  status: HumanRequestStatus;
  title: string | null;
  urgency: HumanUrgency;
  category_code: HumanCategory;
  category_label: string;
  question: string;
  context: string | null;
  expert_answer: string | null;
  updated_at: string;
}

export interface HumanExpertDashboard {
  id: string;
  profession: string;
  bio: string | null;
  country_code: string;
  languages: string[];
  available: boolean;
  verified: boolean;
  verification_status: 'pending' | 'verified' | 'rejected' | 'suspended';
  specialties: Array<{ code: HumanCategory; label: string }>;
  offers: HumanOffer[];
  jobs: HumanJob[];
}

export interface HumanDashboard {
  profile: null | {
    id: string;
    role: 'user' | 'expert' | 'admin';
    first_name: string | null;
    last_name: string | null;
  };
  requests: HumanRequestSummary[];
  expert: HumanExpertDashboard | null;
}

export interface HumanRequestDetail {
  request: HumanRequestSummary & {
    country_code: string;
    language_code: string;
  };
  content: {
    question: string;
    context: string | null;
  };
  result: null | {
    expert_answer: string | null;
    result_returned_to_ai: string | null;
    validation_status: 'pending' | 'accepted' | 'rejected' | 'needs_followup';
    feedback_text: string | null;
    quality_score: number | null;
    answered_at: string | null;
    returned_at: string | null;
    validated_at: string | null;
  };
}

export interface HumanMessage {
  id: string;
  request_id: string;
  sender_kind: 'user' | 'expert' | 'admin';
  is_mine: boolean;
  message: string;
  created_at: string;
}

export type HumanExpertVerificationStatus = 'pending' | 'verified' | 'rejected' | 'suspended';

export interface HumanAdminStats {
  experts_total: number;
  experts_pending: number;
  experts_verified: number;
  experts_suspended: number;
  requests_total: number;
  requests_active: number;
  requests_completed: number;
}

export interface HumanAdminExpert {
  id: string;
  profile_id: string;
  first_name: string | null;
  last_name: string | null;
  profession: string;
  bio: string | null;
  country_code: string;
  languages: string[];
  available: boolean;
  verified: boolean;
  verification_status: HumanExpertVerificationStatus;
  created_at: string;
  updated_at: string;
  specialties: Array<{ code: HumanCategory; label: string }>;
}

export interface HumanAdminRequest {
  id: string;
  title: string | null;
  status: HumanRequestStatus;
  urgency: HumanUrgency;
  category_code: HumanCategory;
  category_label: string;
  client_name: string | null;
  selected_expert_id: string | null;
  selected_expert_profession: string | null;
  pending_expert_id: string | null;
  pending_expert_profession: string | null;
  pending_expert_name: string | null;
  offer_expires_at: string | null;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
}

export interface HumanAdminEvent {
  id: string;
  expert_id: string;
  expert_name: string | null;
  previous_status: HumanExpertVerificationStatus;
  new_status: HumanExpertVerificationStatus;
  reason: string | null;
  actor_name: string | null;
  created_at: string;
}

export interface HumanAdminDashboard {
  stats: HumanAdminStats;
  experts: HumanAdminExpert[];
  requests: HumanAdminRequest[];
  events: HumanAdminEvent[];
}


export type HumanPaymentState = 'quoted' | 'reserved' | 'settled' | 'refunded';

export interface HumanFinanceWallet {
  id: string;
  kind: 'user' | 'expert' | 'platform';
  available_cents: number;
  reserved_cents: number;
  currency_code: string;
}

export interface HumanFinanceRequest {
  request_id: string;
  quote_id?: string;
  state: HumanPaymentState;
  total_cents: number;
  settled_total_cents?: number | null;
  refunded_cents?: number | null;
  expert_compensation_cents?: number;
  human_commission_cents?: number;
  client_rate_per_minute_cents?: number | null;
  expert_rate_per_minute_cents?: number | null;
  billing_block_minutes?: number | null;
  reserved_minutes?: number | null;
  billed_minutes?: number | null;
  work_started_at?: string | null;
  work_ended_at?: string | null;
  currency_code: string;
  reserved_at?: string | null;
  settled_at?: string | null;
  refunded_at?: string | null;
  quote_valid_until?: string | null;
  quote_accepted_at?: string | null;
}

export interface HumanPricingPolicy {
  id: string;
  code: string;
  version: number;
  active: boolean;
  model: 'fixed' | 'per_minute' | 'hybrid' | 'custom';
  category_code: HumanCategory;
  client_rate_per_minute_cents: number;
  expert_rate_per_minute_cents: number;
  billing_block_minutes: number;
  urgent_multiplier_bps: number;
  currency_code: string;
}

export interface HumanFinanceAccount {
  user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: 'user' | 'expert' | 'admin';
  wallet_kind: 'user' | 'expert';
  available_cents: number;
  reserved_cents: number;
  currency_code: string;
}

export interface HumanFinanceDashboard {
  wallet: HumanFinanceWallet;
  ledger: Array<{
    id: string;
    request_id: string | null;
    entry_type: string;
    delta_available_cents: number;
    delta_reserved_cents: number;
    balance_available_after_cents: number;
    balance_reserved_after_cents: number;
    created_at: string;
  }>;
  requests: HumanFinanceRequest[];
  policies: HumanPricingPolicy[];
  platform: null | {
    available_cents: number;
    reserved_cents: number;
    currency_code: string;
  };
  accounts: HumanFinanceAccount[];
}


export type HumanTopupStatus =
  | 'created'
  | 'checkout_created'
  | 'paid'
  | 'failed'
  | 'expired'
  | 'refund_requested'
  | 'refunded'
  | 'refund_review';

export interface HumanTopup {
  id: string;
  user_id?: string;
  email?: string;
  status: HumanTopupStatus;
  amount_cents: number;
  credits_cents: number;
  currency_code: string;
  checkout_session_id?: string | null;
  payment_intent_id?: string | null;
  error_code?: string | null;
  error_message?: string | null;
  created_at: string;
  checkout_created_at?: string | null;
  paid_at?: string | null;
  failed_at?: string | null;
  expired_at?: string | null;
  refunded_at?: string | null;
}

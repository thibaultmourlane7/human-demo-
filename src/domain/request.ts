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

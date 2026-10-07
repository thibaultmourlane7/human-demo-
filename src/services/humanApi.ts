import type { Session } from '@supabase/supabase-js';
import type {
  HumanDashboard,
  HumanRequestDetail,
  HumanRequestInput,
  HumanMessage,
  HumanAdminDashboard,
  HumanExpertVerificationStatus,
} from '../domain/request';

const baseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

type ApiEnvelope<T> = { ok: true; action: string; data: T } | { ok: false; error: string; action?: string };

async function command<T>(session: Session, action: string, payload: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(`${baseUrl}/functions/v1/human-command`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: publishableKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, payload }),
  });

  const body = await res.json() as ApiEnvelope<T>;
  if (!res.ok || !body.ok) {
    throw new Error(body.ok ? `HTTP_${res.status}` : body.error);
  }
  return body.data;
}

export const humanApi = {
  bootstrapAccount: (session: Session, input: { role: 'user' | 'expert'; firstName?: string; lastName?: string }) =>
    command(session, 'bootstrap_account', input),

  getDashboard: (session: Session) => command<HumanDashboard>(session, 'get_dashboard'),

  getRequestDetail: (session: Session, requestId: string) =>
    command<HumanRequestDetail>(session, 'get_request_detail', { requestId }),

  getMessages: (session: Session, requestId: string) =>
    command<HumanMessage[]>(session, 'get_messages', { requestId }),

  sendMessage: (session: Session, requestId: string, message: string) =>
    command<HumanMessage>(session, 'send_message', { requestId, message }),

  saveExpertProfile: (session: Session, input: {
    profession: string;
    bio?: string;
    country: string;
    languages: string[];
    specialties: string[];
  }) => command(session, 'save_expert_profile', input),

  setExpertAvailability: (session: Session, available: boolean) =>
    command(session, 'set_expert_availability', { available }),

  createRequest: (session: Session, input: HumanRequestInput) =>
    command<{ request_id: string; status: string }>(session, 'create_request', {
      domain: input.category,
      question: input.question,
      context: input.context || null,
      country: input.country,
      language: input.language,
      urgency: input.urgency,
      origin: { sourceType: 'web', applicationName: 'human-demo' },
      dataPermissions: {
        retention: 'unknown',
        anonymization: 'unknown',
        research: 'unknown',
        dataset: 'unknown',
        reuseProhibited: false,
        policyVersion: 'sprint4-unset',
      },
    }),

  startMatching: (session: Session, requestId: string) =>
    command(session, 'start_matching', { requestId }),

  expertRespond: (session: Session, requestId: string, accept: boolean) =>
    command(session, 'expert_respond', { requestId, accept }),

  startIntervention: (session: Session, requestId: string) =>
    command(session, 'start_intervention', { requestId }),

  submitAnswer: (session: Session, requestId: string, answer: string) =>
    command(session, 'submit_answer', { requestId, answer }),

  returnResult: (session: Session, requestId: string, resultForAi: string) =>
    command(session, 'return_result', { requestId, resultForAi }),

  completeRequest: (session: Session, requestId: string, input: { validationStatus: 'accepted' | 'rejected'; feedback?: string }) =>
    command(session, 'complete_request', { requestId, ...input }),

  getAdminDashboard: (session: Session) =>
    command<HumanAdminDashboard>(session, 'admin_get_dashboard'),

  setAdminExpertStatus: (session: Session, expertId: string, status: HumanExpertVerificationStatus, reason?: string) =>
    command<{ expert_id: string; verification_status: HumanExpertVerificationStatus; verified: boolean; available: boolean; unchanged: boolean }>(
      session,
      'admin_set_expert_status',
      { expertId, status, reason: reason || null },
    ),
};

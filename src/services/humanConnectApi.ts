import type { Session } from '@supabase/supabase-js';

const supabaseUrl=import.meta.env.VITE_SUPABASE_URL as string;
const publishableKey=import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export type HumanConnectState='not_started'|'pending'|'ready'|'restricted'|'disabled';
export type HumanPayoutState='requested'|'approved'|'processing'|'transferred'|
  'rejected'|'cancelled'|'failed'|'review';

export interface ExpertPayout {
  id:string;
  status:HumanPayoutState;
  amount_cents:number;
  currency_code:string;
  created_at:string;
  approved_at:string|null;
  transferred_at:string|null;
  failure_reason:string|null;
}
export interface ExpertPayoutOverview {
  currency_code:'EUR';
  total_earned_cents:number;
  wallet_available_cents:number;
  wallet_reserved_cents:number;
  connect:{
    state:HumanConnectState;
    transfers_enabled:boolean;
    onboarding_completed:boolean;
    last_sync_at:string|null;
  };
  withdrawals_enabled:boolean;
  withdrawals:ExpertPayout[];
  notice:string;
}
export interface AdminPayoutOverview {
  transfers_enabled:false;
  live_transfers_enabled:false;
  notice:string;
  accounts:Array<{
    expert_user_id:string;
    email:string;
    state:HumanConnectState;
    transfers_enabled:boolean;
    last_sync_at:string|null;
  }>;
  payout_requests:Array<{
    id:string;
    expert_user_id:string;
    email:string;
    status:HumanPayoutState;
    amount_cents:number;
    currency_code:string;
    requested_at:string;
    approved_at:string|null;
    transferred_at:string|null;
  }>;
}

async function connectCommand<T>(
  session:Session, action:string, payload:Record<string,unknown>={},
):Promise<T> {
  const res=await fetch(supabaseUrl+'/functions/v1/human-connect',{
    method:'POST',
    headers:{
      Authorization:'Bearer '+session.access_token,
      apikey:publishableKey,
      'Content-Type':'application/json',
    },
    body:JSON.stringify({action,payload}),
  });
  const json=await res.json() as {ok:boolean;data?:T;error?:string};
  if (!res.ok || !json.ok || json.data===undefined) {
    throw new Error(json.error ?? 'CONNECT_API_FAILED');
  }
  return json.data;
}

export const humanConnectApi={
  getExpertOverview:(s:Session)=>connectCommand<ExpertPayoutOverview>(s,'expert_overview'),
  beginOnboarding:(s:Session)=>connectCommand<{onboarding_url:string}>(s,'begin_onboarding'),
  syncOnboarding:(s:Session)=>connectCommand<{state:HumanConnectState;transfers_enabled?:boolean}>(s,'sync_onboarding'),
  getAdminOverview:(s:Session)=>connectCommand<AdminPayoutOverview>(s,'admin_overview'),
  reviewPayout:(s:Session,id:string,decision:'approve'|'reject',reason?:string)=>
    connectCommand<{id:string;status:HumanPayoutState;transferred:false}>(s,'admin_review',{
      payoutId:id,decision,reason,
    }),
};

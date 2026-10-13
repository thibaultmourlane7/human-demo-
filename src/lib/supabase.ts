import { createClient } from '@supabase/supabase-js';
import { getHumanRuntime } from '../platform/mobileRuntime';

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

export const humanConfigReady = Boolean(url && publishableKey);

export const supabase = createClient(
  url ?? 'https://invalid.local',
  publishableKey ?? 'missing-publishable-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      // Email/password works natively; redirect-based OAuth/magic links require
      // verified App/Universal Links and must NOT be auto-consumed in a WebView.
      detectSessionInUrl: getHumanRuntime() === 'web',
    },
  },
);

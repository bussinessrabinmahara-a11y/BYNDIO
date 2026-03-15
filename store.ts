import { createClient } from '@supabase/supabase-js';

// These are read at RUNTIME in the browser, not at build time.
// Netlify injects them as window.__env__ or directly via VITE_ prefix.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Graceful fallback so build never fails — runtime will show auth errors instead
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

// Helper to check if Supabase is properly configured at runtime
export const isSupabaseConfigured = (): boolean =>
  Boolean(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder'));

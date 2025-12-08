
import { createClient } from '@supabase/supabase-js';

// 1. Resolve Credentials
// Priority: 
// A. Vite standard (import.meta.env.VITE_...) - REQUIRED for Vercel
// B. Process env (process.env.REACT_APP_...) - Fallback for local/legacy
// C. Hardcoded fallback (Not recommended for production)

const getEnv = (key: string, legacyKey: string) => {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    // @ts-ignore
    return import.meta.env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[legacyKey]) {
    return process.env[legacyKey];
  }
  return '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL', 'REACT_APP_SUPABASE_URL') || 'https://wxoehohuxmjzjlkpxayw.supabase.co';
const supabaseKey = getEnv('VITE_SUPABASE_ANON_KEY', 'REACT_APP_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4b2Vob2h1eG1qempsa3B4YXl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMDU3NDksImV4cCI6MjA4MDY4MTc0OX0.b3dC4kHCwE-r5EN8zm5qRftwQSPWIx6Aoowp61Kxdtc';

// 2. Validate Configuration
export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseKey && 
  supabaseUrl !== 'https://placeholder.supabase.co' &&
  supabaseKey !== 'placeholder'
);

if (!isSupabaseConfigured) {
  console.warn('Supabase credentials missing. App will run in configuration mode.');
} else {
  // Basic validation check for key format
  if (!supabaseKey.startsWith('ey')) {
     console.warn('WARNING: The provided Supabase Key does not look like a standard JWT.');
  }
}

// 3. Create Client with Explicit Auth Config
// persistSession: true ensures localStorage is used effectively.
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: window.localStorage, // Force use of LocalStorage
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

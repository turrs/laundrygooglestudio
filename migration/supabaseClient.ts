import { createClient } from '@supabase/supabase-js';

// 1. Define the values. 
// Priority: Environment Variable -> Hardcoded Value
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://wxoehohuxmjzjlkpxayw.supabase.co';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind4b2Vob2h1eG1qempsa3B4YXl3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxMDU3NDksImV4cCI6MjA4MDY4MTc0OX0.b3dC4kHCwE-r5EN8zm5qRftwQSPWIx6Aoowp61Kxdtc';

// 2. Check if configuration is present.
// We verify that the values exist and are not the dummy placeholders used in the template.
export const isSupabaseConfigured = Boolean(
  supabaseUrl && 
  supabaseKey && 
  supabaseUrl !== 'https://placeholder.supabase.co' &&
  supabaseKey !== 'placeholder'
);

if (!isSupabaseConfigured) {
  console.warn('Supabase credentials missing. App will run in configuration mode.');
} else {
  // Warn if key looks suspicious (standard Supabase Anon keys start with 'ey')
  if (!supabaseKey.startsWith('ey')) {
     console.warn('WARNING: The provided Supabase Key does not look like a standard JWT (usually starts with "ey..."). Check if you pasted the "anon public" key correctly from API Settings.');
  }
}

// 3. Create the client with the resolved values
export const supabase = createClient(supabaseUrl, supabaseKey);

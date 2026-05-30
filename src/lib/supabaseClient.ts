import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in your .env file');
}

// This is the single Supabase client used throughout the entire app.
// Think of it like a phone line to your database — you create it once and reuse it everywhere.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

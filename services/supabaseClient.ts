import { createClient } from '@supabase/supabase-js';

// It is safe to expose Supabase URL and Anon Key in a browser environment
// as long as you have Row Level Security (RLS) enabled on your tables.
// RLS ensures that users can only access data they are permitted to.
const supabaseUrl = (window as any).process.env.SUPABASE_URL;
const supabaseAnonKey = (window as any).process.env.SUPABASE_ANON_KEY;

// Check if the variables are still placeholders. If so, throw a clear error.
if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('YOUR_SUPABASE_URL_HERE') || supabaseAnonKey.includes('YOUR_SUPABASE_ANON_KEY_HERE')) {
  throw new Error("Supabase environment variables are not configured. Please replace the placeholder values in your index.html file with your actual Supabase project URL and Anon Key.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
import { createClient } from '@supabase/supabase-js';

// It is safe to expose Supabase URL and Anon Key in a browser environment
// as long as you have Row Level Security (RLS) enabled on your tables.
// RLS ensures that users can only access data they are permitted to.

// Read environment variables provided by the build tool (e.g., Vite)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if the variables are configured. If not, throw a clear error.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY) are not configured. Please set them in your .env file or hosting provider's settings.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
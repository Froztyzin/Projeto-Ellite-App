import { createClient } from '@supabase/supabase-js';

// These variables should be configured in your environment
// For local development, you might use a .env file, but in production,
// they should be set as environment variables on your hosting platform.
const supabaseUrl = process.env.SUPABASE_URL as string;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL and Anon Key are missing. Please provide them in your environment variables.");
  // Display a user-friendly message on the page
  document.body.innerHTML = `
    <div style="font-family: sans-serif; padding: 2rem; text-align: center; color: #fecaca; background-color: #1e293b; height: 100vh;">
      <h1 style="color: #f87171;">Configuration Error</h1>
      <p>The application is not configured to connect to the database.</p>
      <p>Please make sure the Supabase environment variables (SUPABASE_URL, SUPABASE_ANON_KEY) are set correctly.</p>
    </div>
  `;
  throw new Error('Supabase environment variables are not set.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

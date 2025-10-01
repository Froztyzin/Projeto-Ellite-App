import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL and a Key (SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY) are required.');
}

export const supabase = createClient(supabaseUrl, supabaseKey);
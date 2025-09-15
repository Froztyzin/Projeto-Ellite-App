import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY

let supabaseClient = null;
let configError = null;

if (!supabaseUrl || !supabaseKey) {
    configError = "As variáveis de ambiente SUPABASE_URL e SUPABASE_KEY são obrigatórias. Por favor, verifique se elas estão configuradas corretamente no ambiente do seu projeto.";
    console.error(configError);
} else {
    try {
        supabaseClient = createClient(supabaseUrl, supabaseKey);
    } catch (e) {
        configError = `Error initializing Supabase client: ${(e as Error).message}`;
        console.error(configError);
    }
}

export const supabase = supabaseClient;
export const supabaseConfigurationError = configError;
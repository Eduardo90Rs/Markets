import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'your_supabase_url_here' || supabaseAnonKey === 'your_supabase_anon_key_here') {
  throw new Error(`
⚠️  CONFIGURAÇÃO DO SUPABASE NECESSÁRIA ⚠️

Por favor, configure suas credenciais do Supabase:

1. Acesse: https://supabase.com
2. Crie um projeto (se ainda não tiver)
3. Vá em Settings > API
4. Copie:
   - Project URL
   - anon/public key

5. Edite o arquivo .env e cole suas credenciais:

VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui

6. Reinicie o servidor (Ctrl+C e npm run dev)

Consulte o README.md ou GUIA_RAPIDO.md para mais detalhes.
  `);
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

import dotenv from 'dotenv';

dotenv.config();

const hasSupabase =
  Boolean(process.env.SUPABASE_URL) && Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);

// Modo de dados: 'supabase' quando ha credenciais, senao 'memory' (demo local).
// Pode forcar com DATA_MODE=memory | supabase.
const dataMode = process.env.DATA_MODE || (hasSupabase ? 'supabase' : 'memory');

if (dataMode === 'supabase' && !hasSupabase) {
  console.error(
    '[config] DATA_MODE=supabase mas faltam SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.\n' +
      'Preencha server/.env ou rode em modo demo (sem essas variaveis).'
  );
  process.exit(1);
}

if (dataMode === 'memory') {
  console.warn(
    '[config] MODO DEMO (em memoria): dados nao sao persistidos e somem ao reiniciar.\n' +
      '         Para persistir, configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY.'
  );
}

export const env = {
  dataMode,
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  port: Number(process.env.PORT) || 3001,
  clientOrigins: (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};

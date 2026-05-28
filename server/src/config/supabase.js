import { createClient } from '@supabase/supabase-js';
import WebSocket from 'ws';
import { env } from './env.js';

// O supabase-js inicializa o cliente de realtime na construcao e, no
// Node < 22, precisa de um WebSocket. Nao usamos o realtime do Supabase
// (quem cuida do tempo real e o Socket.IO), mas fornecemos o "ws" para
// que o createClient nao quebre em Node 20 (ambiente do Render).
export const supabase = createClient(env.supabaseUrl, env.supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  realtime: {
    transport: WebSocket,
  },
});

export const GLOBAL_ROOM_ID = '00000000-0000-0000-0000-000000000001';

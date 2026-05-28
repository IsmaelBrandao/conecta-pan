import { supabase } from '../config/supabase.js';

/** Marca que o usuario leu a sala ate agora. Retorna o timestamp. */
export async function markRead(roomId, userId) {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('room_reads')
    .upsert(
      { room_id: roomId, user_id: userId, last_read_at: now },
      { onConflict: 'room_id,user_id' }
    );
  if (error) throw error;
  return now;
}

/** Retorna o mapa { userId: last_read_at } de uma sala. */
export async function getReads(roomId) {
  const { data, error } = await supabase
    .from('room_reads')
    .select('user_id, last_read_at')
    .eq('room_id', roomId);
  if (error) throw error;
  const map = {};
  (data || []).forEach((r) => {
    map[r.user_id] = r.last_read_at;
  });
  return map;
}

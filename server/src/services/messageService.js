import { supabase } from '../config/supabase.js';

const SELECT =
  'id, room_id, content, type, created_at, sender:profiles(id, display_name, avatar_color)';

/** Historico de mensagens de uma sala (ordem cronologica). */
export async function listMessages(roomId, limit = 100) {
  const { data, error } = await supabase
    .from('messages')
    .select(SELECT)
    .eq('room_id', roomId)
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error) throw error;
  return (data || []).map(shape);
}

/** Persiste uma nova mensagem (texto ou imagem) e retorna ja formatada. */
export async function createMessage({ roomId, senderId, content, type = 'text' }) {
  const value = type === 'image' ? content : content.trim();
  const { data, error } = await supabase
    .from('messages')
    .insert({ room_id: roomId, sender_id: senderId, content: value, type })
    .select(SELECT)
    .single();
  if (error) throw error;
  return shape(data);
}

function shape(row) {
  return {
    id: row.id,
    roomId: row.room_id,
    content: row.content,
    type: row.type || 'text',
    createdAt: row.created_at,
    sender: {
      id: row.sender?.id,
      displayName: row.sender?.display_name,
      avatarColor: row.sender?.avatar_color,
    },
  };
}

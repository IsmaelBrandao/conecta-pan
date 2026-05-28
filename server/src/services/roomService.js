import { supabase } from '../config/supabase.js';

/**
 * Lista as salas em que o usuario participa, com a ultima mensagem
 * de cada uma (para a lista estilo WhatsApp).
 */
export async function listRoomsForUser(userId) {
  const { data: memberships, error } = await supabase
    .from('room_members')
    .select('room:rooms(*)')
    .eq('user_id', userId);
  if (error) throw error;

  const rooms = (memberships || []).map((m) => m.room).filter(Boolean);

  // anexa ultima mensagem + membros de cada sala
  const enriched = await Promise.all(
    rooms.map(async (room) => {
      const [{ data: lastMsg }, { data: members }] = await Promise.all([
        supabase
          .from('messages')
          .select('content, type, created_at, sender:profiles(display_name)')
          .eq('room_id', room.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle(),
        supabase
          .from('room_members')
          .select('profile:profiles(id, username, display_name, avatar_color)')
          .eq('room_id', room.id),
      ]);

      const memberProfiles = (members || []).map((x) => x.profile).filter(Boolean);
      return {
        ...room,
        lastMessage: lastMsg
          ? {
              content: lastMsg.content,
              type: lastMsg.type || 'text',
              createdAt: lastMsg.created_at,
              senderName: lastMsg.sender?.display_name || '',
            }
          : null,
        members: memberProfiles,
      };
    })
  );

  // ordena por atividade (ultima mensagem) desc
  enriched.sort((a, b) => {
    const ta = a.lastMessage?.createdAt || a.created_at;
    const tb = b.lastMessage?.createdAt || b.created_at;
    return new Date(tb) - new Date(ta);
  });

  return enriched;
}

/** Cria uma sala/grupo e adiciona os membros. */
export async function createRoom({ name, description, createdBy, memberIds }) {
  const { data: room, error } = await supabase
    .from('rooms')
    .insert({
      name: name.trim(),
      description: (description || '').trim(),
      type: 'group',
      created_by: createdBy,
    })
    .select('*')
    .single();
  if (error) throw error;

  const uniqueMembers = Array.from(new Set([createdBy, ...(memberIds || [])]));
  const rows = uniqueMembers.map((user_id) => ({ room_id: room.id, user_id }));
  const { error: memberError } = await supabase.from('room_members').insert(rows);
  if (memberError) throw memberError;

  return room;
}

/**
 * Encontra (ou cria) uma sala de DM entre dois usuarios.
 * DMs sao salas type='dm' com exatamente 2 membros.
 */
export async function getOrCreateDM(userA, userB) {
  // salas de DM do usuario A
  const { data: aRooms } = await supabase
    .from('room_members')
    .select('room_id, room:rooms!inner(type)')
    .eq('user_id', userA)
    .eq('room.type', 'dm');

  const candidateIds = (aRooms || []).map((r) => r.room_id);

  if (candidateIds.length > 0) {
    const { data: shared } = await supabase
      .from('room_members')
      .select('room_id')
      .eq('user_id', userB)
      .in('room_id', candidateIds);
    if (shared && shared.length > 0) {
      const { data: room } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', shared[0].room_id)
        .single();
      return room;
    }
  }

  // cria nova DM
  const { data: room, error } = await supabase
    .from('rooms')
    .insert({ name: 'DM', type: 'dm', created_by: userA })
    .select('*')
    .single();
  if (error) throw error;

  await supabase.from('room_members').insert([
    { room_id: room.id, user_id: userA },
    { room_id: room.id, user_id: userB },
  ]);

  return room;
}

export async function isMember(roomId, userId) {
  const { data } = await supabase
    .from('room_members')
    .select('room_id')
    .eq('room_id', roomId)
    .eq('user_id', userId)
    .maybeSingle();
  return Boolean(data);
}

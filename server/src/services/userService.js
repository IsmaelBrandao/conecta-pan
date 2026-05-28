import { supabase, GLOBAL_ROOM_ID } from '../config/supabase.js';

const AVATAR_COLORS = [
  '#d9822b', '#c0392b', '#8e44ad', '#2980b9',
  '#16a085', '#27ae60', '#e67e22', '#7f8c8d',
];

function randomColor() {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

/**
 * Cria ou recupera um perfil pelo username. Garante que o usuario
 * esteja na sala global. Usado no fluxo de "login" leve.
 */
export async function loginOrCreate({ username, displayName }) {
  const cleanUsername = username.trim().toLowerCase();
  const name = (displayName || username).trim();

  let { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', cleanUsername)
    .maybeSingle();

  if (!profile) {
    const { data, error } = await supabase
      .from('profiles')
      .insert({
        username: cleanUsername,
        display_name: name,
        avatar_color: randomColor(),
      })
      .select('*')
      .single();
    if (error) throw error;
    profile = data;
  }

  // garante presenca na sala global
  await supabase
    .from('room_members')
    .upsert(
      { room_id: GLOBAL_ROOM_ID, user_id: profile.id },
      { onConflict: 'room_id,user_id', ignoreDuplicates: true }
    );

  return profile;
}

export async function getProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function updateProfile(userId, patch) {
  const allowed = {};
  if (typeof patch.display_name === 'string') allowed.display_name = patch.display_name.trim();
  if (typeof patch.status === 'string') allowed.status = patch.status.trim();
  if (typeof patch.avatar_color === 'string') allowed.avatar_color = patch.avatar_color;

  const { data, error } = await supabase
    .from('profiles')
    .update(allowed)
    .eq('id', userId)
    .select('*')
    .single();
  if (error) throw error;
  return data;
}

/** Lista todos os perfis (para iniciar DMs / descobrir pessoas). */
export async function listProfiles(exceptUserId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_color, status')
    .neq('id', exceptUserId || '00000000-0000-0000-0000-000000000000')
    .order('display_name', { ascending: true });
  if (error) throw error;
  return data || [];
}

/**
 * Implementacao em memoria das services (modo DEMO).
 * Mesma assinatura/forma de retorno das versions reais (Supabase),
 * mas guardando tudo em Maps. Os dados somem ao reiniciar o servidor.
 */
import crypto from 'crypto';

const GLOBAL_ROOM_ID = '00000000-0000-0000-0000-000000000001';
const AVATAR_COLORS = [
  '#d9822b', '#c0392b', '#8e44ad', '#2980b9',
  '#16a085', '#27ae60', '#e67e22', '#7f8c8d',
];

// "tabelas"
const profiles = new Map();   // id -> profile
const rooms = new Map();       // id -> room
const members = new Map();     // roomId -> Set(userId)
const messages = [];           // lista cronologica
const reads = new Map();       // `${roomId}:${userId}` -> iso

// seed da sala global
rooms.set(GLOBAL_ROOM_ID, {
  id: GLOBAL_ROOM_ID,
  name: 'Conecta Pan - Geral',
  type: 'global',
  description: 'O balcao principal da padaria. Diga oi para todo mundo!',
  created_by: null,
  created_at: new Date().toISOString(),
});
members.set(GLOBAL_ROOM_ID, new Set());

const uuid = () => crypto.randomUUID();
const now = () => new Date().toISOString();
const randomColor = () => AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];

function addMember(roomId, userId) {
  if (!members.has(roomId)) members.set(roomId, new Set());
  members.get(roomId).add(userId);
}

function memberProfiles(roomId) {
  const set = members.get(roomId) || new Set();
  return Array.from(set)
    .map((id) => profiles.get(id))
    .filter(Boolean)
    .map(({ id, username, display_name, avatar_color }) => ({
      id, username, display_name, avatar_color,
    }));
}

function lastMessageOf(roomId) {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].room_id === roomId) {
      const m = messages[i];
      const sender = profiles.get(m.sender_id);
      return {
        content: m.content,
        type: m.type,
        createdAt: m.created_at,
        senderName: sender?.display_name || '',
      };
    }
  }
  return null;
}

function shapeMessage(m) {
  const sender = profiles.get(m.sender_id);
  return {
    id: m.id,
    roomId: m.room_id,
    content: m.content,
    type: m.type,
    createdAt: m.created_at,
    sender: {
      id: sender?.id,
      displayName: sender?.display_name,
      avatarColor: sender?.avatar_color,
    },
  };
}

// ---------------- users ----------------
export const users = {
  async loginOrCreate({ username, displayName }) {
    const uname = username.trim().toLowerCase();
    let profile = [...profiles.values()].find((p) => p.username === uname);
    if (!profile) {
      profile = {
        id: uuid(),
        username: uname,
        display_name: (displayName || username).trim(),
        avatar_color: randomColor(),
        status: 'Disponivel para um cafezinho',
        created_at: now(),
      };
      profiles.set(profile.id, profile);
    }
    addMember(GLOBAL_ROOM_ID, profile.id);
    return profile;
  },

  async updateProfile(userId, patch) {
    const profile = profiles.get(userId);
    if (!profile) throw new Error('Perfil nao encontrado');
    if (typeof patch.display_name === 'string') profile.display_name = patch.display_name.trim();
    if (typeof patch.status === 'string') profile.status = patch.status.trim();
    if (typeof patch.avatar_color === 'string') profile.avatar_color = patch.avatar_color;
    return profile;
  },

  async listProfiles(exceptUserId) {
    return [...profiles.values()]
      .filter((p) => p.id !== exceptUserId)
      .sort((a, b) => a.display_name.localeCompare(b.display_name))
      .map(({ id, username, display_name, avatar_color, status }) => ({
        id, username, display_name, avatar_color, status,
      }));
  },
};

// ---------------- rooms ----------------
export const roomsService = {
  async listRoomsForUser(userId) {
    const list = [];
    for (const [roomId, set] of members.entries()) {
      if (!set.has(userId)) continue;
      const room = rooms.get(roomId);
      if (!room) continue;
      list.push({
        ...room,
        lastMessage: lastMessageOf(roomId),
        members: memberProfiles(roomId),
      });
    }
    list.sort((a, b) => {
      const ta = a.lastMessage?.createdAt || a.created_at;
      const tb = b.lastMessage?.createdAt || b.created_at;
      return new Date(tb) - new Date(ta);
    });
    return list;
  },

  async createRoom({ name, description, createdBy, memberIds }) {
    const room = {
      id: uuid(),
      name: name.trim(),
      description: (description || '').trim(),
      type: 'group',
      created_by: createdBy,
      created_at: now(),
    };
    rooms.set(room.id, room);
    [createdBy, ...(memberIds || [])].forEach((id) => addMember(room.id, id));
    return room;
  },

  async getOrCreateDM(userA, userB) {
    for (const [roomId, set] of members.entries()) {
      const room = rooms.get(roomId);
      if (room?.type === 'dm' && set.has(userA) && set.has(userB) && set.size === 2) {
        return room;
      }
    }
    const room = {
      id: uuid(),
      name: 'DM',
      type: 'dm',
      description: '',
      created_by: userA,
      created_at: now(),
    };
    rooms.set(room.id, room);
    addMember(room.id, userA);
    addMember(room.id, userB);
    return room;
  },
};

// ---------------- messages ----------------
export const messagesService = {
  async listMessages(roomId, limit = 100) {
    return messages
      .filter((m) => m.room_id === roomId)
      .slice(-limit)
      .map(shapeMessage);
  },

  async createMessage({ roomId, senderId, content, type = 'text' }) {
    const m = {
      id: uuid(),
      room_id: roomId,
      sender_id: senderId,
      content: type === 'image' ? content : content.trim(),
      type,
      created_at: now(),
    };
    messages.push(m);
    return shapeMessage(m);
  },
};

// ---------------- storage ----------------
export const storage = {
  // no modo demo, a propria dataURL ja e exibivel no <img>; devolvemos ela.
  async uploadImage({ dataUrl }) {
    if (!/^data:image\//.test(dataUrl || '')) throw new Error('Imagem invalida');
    return dataUrl;
  },
};

// ---------------- reads ----------------
export const reads_ = {
  async markRead(roomId, userId) {
    const at = now();
    reads.set(`${roomId}:${userId}`, at);
    return at;
  },
  async getReads(roomId) {
    const map = {};
    for (const [key, at] of reads.entries()) {
      const [rid, uid] = key.split(':');
      if (rid === roomId) map[uid] = at;
    }
    return map;
  },
};

// nomes finais exportados pelo facade
export { roomsService as rooms, messagesService as messages, reads_ as reads };

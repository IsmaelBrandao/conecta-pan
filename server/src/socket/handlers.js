import { users, rooms, messages, storage, reads } from '../services/index.js';
import * as presence from './presence.js';

// resposta padrao para os callbacks (ack) do socket
const ok = (data) => ({ ok: true, data });
const fail = (error) => ({ ok: false, error: error?.message || 'Erro inesperado' });

export function registerHandlers(io, socket) {
  // dados do usuario autenticado nesta conexao
  const ctx = { userId: null, profile: null };

  function broadcastPresence() {
    io.emit('presence:update', { online: presence.getOnlineIds() });
  }

  // ----- AUTENTICACAO (login leve) -----
  socket.on('auth:login', async ({ username, displayName }, cb = () => {}) => {
    try {
      const profile = await users.loginOrCreate({ username, displayName });
      ctx.userId = profile.id;
      ctx.profile = profile;
      socket.join(`user:${profile.id}`);

      presence.addOnline(profile.id, socket.id);
      broadcastPresence();

      // entra (join) em todas as salas do usuario
      const userRooms = await rooms.listRoomsForUser(profile.id);
      userRooms.forEach((r) => socket.join(`room:${r.id}`));

      cb(ok({ profile, rooms: userRooms, online: presence.getOnlineIds() }));
    } catch (error) {
      cb(fail(error));
    }
  });

  // ----- PERFIL -----
  socket.on('profile:update', async (patch, cb = () => {}) => {
    if (!ctx.userId) return cb(fail(new Error('Nao autenticado')));
    try {
      const profile = await users.updateProfile(ctx.userId, patch);
      ctx.profile = profile;
      cb(ok({ profile }));
    } catch (error) {
      cb(fail(error));
    }
  });

  // ----- LISTAS -----
  socket.on('rooms:list', async (_payload, cb = () => {}) => {
    if (!ctx.userId) return cb(fail(new Error('Nao autenticado')));
    try {
      const userRooms = await rooms.listRoomsForUser(ctx.userId);
      userRooms.forEach((r) => socket.join(`room:${r.id}`));
      cb(ok({ rooms: userRooms }));
    } catch (error) {
      cb(fail(error));
    }
  });

  socket.on('users:list', async (_payload, cb = () => {}) => {
    if (!ctx.userId) return cb(fail(new Error('Nao autenticado')));
    try {
      const profiles = await users.listProfiles(ctx.userId);
      cb(ok({ users: profiles, online: presence.getOnlineIds() }));
    } catch (error) {
      cb(fail(error));
    }
  });

  // ----- MENSAGENS -----
  socket.on('messages:list', async ({ roomId }, cb = () => {}) => {
    if (!ctx.userId) return cb(fail(new Error('Nao autenticado')));
    try {
      const [list, readMap] = await Promise.all([
        messages.listMessages(roomId),
        reads.getReads(roomId),
      ]);
      cb(ok({ messages: list, reads: readMap }));
    } catch (error) {
      cb(fail(error));
    }
  });

  socket.on('message:send', async ({ roomId, content }, cb = () => {}) => {
    if (!ctx.userId) return cb(fail(new Error('Nao autenticado')));
    if (!content || !content.trim()) return cb(fail(new Error('Mensagem vazia')));
    try {
      const message = await messages.createMessage({
        roomId,
        senderId: ctx.userId,
        content,
      });
      // limpa o "digitando" deste usuario nessa sala
      presence.setTyping(roomId, ctx.userId, ctx.profile.display_name, false);
      io.to(`room:${roomId}`).emit('typing:update', {
        roomId,
        users: presence.getTyping(roomId),
      });
      // entrega a todos da sala (inclusive remetente para confirmar)
      io.to(`room:${roomId}`).emit('message:new', message);
      cb(ok({ message }));
    } catch (error) {
      cb(fail(error));
    }
  });

  // ----- ENVIAR IMAGEM (dataURL base64) -----
  socket.on('message:image', async ({ roomId, dataUrl }, cb = () => {}) => {
    if (!ctx.userId) return cb(fail(new Error('Nao autenticado')));
    try {
      const url = await storage.uploadImage({ dataUrl, senderId: ctx.userId });
      const message = await messages.createMessage({
        roomId,
        senderId: ctx.userId,
        content: url,
        type: 'image',
      });
      io.to(`room:${roomId}`).emit('message:new', message);
      cb(ok({ message }));
    } catch (error) {
      cb(fail(error));
    }
  });

  // ----- CONFIRMACAO DE LEITURA -----
  socket.on('room:read', async ({ roomId }, cb = () => {}) => {
    if (!ctx.userId) return cb(fail(new Error('Nao autenticado')));
    try {
      const at = await reads.markRead(roomId, ctx.userId);
      // avisa os outros da sala que este usuario leu ate "at"
      socket.to(`room:${roomId}`).emit('reads:update', {
        roomId,
        userId: ctx.userId,
        lastReadAt: at,
      });
      cb(ok({ lastReadAt: at }));
    } catch (error) {
      cb(fail(error));
    }
  });

  // ----- DIGITANDO -----
  socket.on('typing:start', ({ roomId }) => {
    if (!ctx.userId) return;
    presence.setTyping(roomId, ctx.userId, ctx.profile.display_name, true);
    socket.to(`room:${roomId}`).emit('typing:update', {
      roomId,
      users: presence.getTyping(roomId, null),
    });
  });

  socket.on('typing:stop', ({ roomId }) => {
    if (!ctx.userId) return;
    presence.setTyping(roomId, ctx.userId, ctx.profile.display_name, false);
    socket.to(`room:${roomId}`).emit('typing:update', {
      roomId,
      users: presence.getTyping(roomId, null),
    });
  });

  // ----- CRIAR GRUPO -----
  socket.on('room:create', async ({ name, description, memberIds }, cb = () => {}) => {
    if (!ctx.userId) return cb(fail(new Error('Nao autenticado')));
    if (!name || !name.trim()) return cb(fail(new Error('Nome do grupo obrigatorio')));
    try {
      const room = await rooms.createRoom({
        name,
        description,
        createdBy: ctx.userId,
        memberIds,
      });
      // faz todos os membros online entrarem na sala via socket
      const all = Array.from(new Set([ctx.userId, ...(memberIds || [])]));
      all.forEach((uid) => {
        io.in(`user:${uid}`).socketsJoin(`room:${room.id}`);
        io.to(`user:${uid}`).emit('rooms:changed');
      });
      cb(ok({ room }));
    } catch (error) {
      cb(fail(error));
    }
  });

  // ----- ABRIR / CRIAR DM -----
  socket.on('dm:open', async ({ targetUserId }, cb = () => {}) => {
    if (!ctx.userId) return cb(fail(new Error('Nao autenticado')));
    try {
      const room = await rooms.getOrCreateDM(ctx.userId, targetUserId);
      [ctx.userId, targetUserId].forEach((uid) => {
        io.in(`user:${uid}`).socketsJoin(`room:${room.id}`);
        io.to(`user:${uid}`).emit('rooms:changed');
      });
      cb(ok({ room }));
    } catch (error) {
      cb(fail(error));
    }
  });

  // ----- DESCONEXAO -----
  socket.on('disconnect', () => {
    if (!ctx.userId) return;
    const wentOffline = presence.removeOnline(ctx.userId, socket.id);
    if (wentOffline) {
      presence.clearTypingForUser(ctx.userId);
      broadcastPresence();
    }
  });
}

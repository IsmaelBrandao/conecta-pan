/**
 * Controle de presenca em memoria.
 *  - online: userId -> Set de socketIds (suporta multiplas abas)
 *  - typing: roomId -> Map(userId -> displayName)
 */
const online = new Map();
const typing = new Map();

export function addOnline(userId, socketId) {
  if (!online.has(userId)) online.set(userId, new Set());
  online.get(userId).add(socketId);
}

export function removeOnline(userId, socketId) {
  const set = online.get(userId);
  if (!set) return false;
  set.delete(socketId);
  if (set.size === 0) {
    online.delete(userId);
    return true; // ficou totalmente offline
  }
  return false;
}

export function getOnlineIds() {
  return Array.from(online.keys());
}

export function isOnline(userId) {
  return online.has(userId);
}

export function setTyping(roomId, userId, displayName, isTyping) {
  if (!typing.has(roomId)) typing.set(roomId, new Map());
  const room = typing.get(roomId);
  if (isTyping) room.set(userId, displayName);
  else room.delete(userId);
  if (room.size === 0) typing.delete(roomId);
}

export function getTyping(roomId, exceptUserId) {
  const room = typing.get(roomId);
  if (!room) return [];
  return Array.from(room.entries())
    .filter(([uid]) => uid !== exceptUserId)
    .map(([id, name]) => ({ id, displayName: name }));
}

export function clearTypingForUser(userId) {
  for (const [roomId, room] of typing.entries()) {
    if (room.delete(userId) && room.size === 0) typing.delete(roomId);
  }
}

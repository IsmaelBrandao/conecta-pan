/** Helpers de formatacao de data/hora e nomes. */

export function formatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

export function formatDayLabel(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const sameDay = (a, b) =>
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear();

  if (sameDay(d, today)) return 'Hoje';
  if (sameDay(d, yesterday)) return 'Ontem';
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' });
}

export function lastSeenTime(iso) {
  if (!iso) return '';
  return formatTime(iso);
}

export function initials(name = '') {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Nome de exibicao de uma sala conforme o tipo. */
export function roomDisplayName(room, currentUserId) {
  if (!room) return '';
  if (room.type === 'dm') {
    const other = (room.members || []).find((m) => m.id !== currentUserId);
    return other?.display_name || 'Conversa';
  }
  return room.name;
}

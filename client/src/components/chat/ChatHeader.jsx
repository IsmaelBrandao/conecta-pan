import { ArrowLeft, Users, Hash, Search } from 'lucide-react';
import Avatar from '../ui/Avatar.jsx';
import { roomDisplayName } from '../../lib/format.js';

/** Cabecalho da conversa com nome, subtitulo (online / membros), voltar e busca. */
export default function ChatHeader({ room, currentUserId, onlineIds, typingUsers, onBack, onToggleSearch }) {
  const name = roomDisplayName(room, currentUserId);
  const isDM = room.type === 'dm';
  const isGlobal = room.type === 'global';

  let subtitle;
  if (typingUsers.length > 0) {
    subtitle = 'digitando...';
  } else if (isDM) {
    const other = (room.members || []).find((m) => m.id !== currentUserId);
    subtitle = other && onlineIds.includes(other.id) ? 'online' : 'offline';
  } else {
    const count = (room.members || []).length;
    subtitle = `${count} ${count === 1 ? 'membro' : 'membros'}`;
  }

  const other = isDM ? (room.members || []).find((m) => m.id !== currentUserId) : null;
  const color = isDM ? other?.avatar_color : '#3b2417';

  return (
    <header className="chat-header">
      <button className="icon-btn chat-header__back" onClick={onBack} aria-label="Voltar">
        <ArrowLeft size={22} />
      </button>

      {isDM ? (
        <Avatar name={name} color={color} size={42} online={onlineIds.includes(other?.id)} showStatus />
      ) : (
        <div className="chat-header__roomicon" style={{ background: color }}>
          {isGlobal ? <Hash size={20} /> : <Users size={20} />}
        </div>
      )}

      <div className="chat-header__info">
        <strong className="chat-header__name">{name}</strong>
        <span className={`chat-header__subtitle ${typingUsers.length ? 'is-typing' : ''}`}>
          {subtitle}
        </span>
      </div>

      <button className="icon-btn chat-header__action" onClick={onToggleSearch} aria-label="Buscar mensagens">
        <Search size={20} />
      </button>
    </header>
  );
}

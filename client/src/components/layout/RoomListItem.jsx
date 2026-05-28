import { Users, Hash } from 'lucide-react';
import Avatar from '../ui/Avatar.jsx';
import { formatTime, roomDisplayName } from '../../lib/format.js';

/** Item da lista de conversas (estilo linha do WhatsApp). */
export default function RoomListItem({ room, currentUserId, onlineIds, active, typing, onClick }) {
  const name = roomDisplayName(room, currentUserId);
  const isDM = room.type === 'dm';
  const isGlobal = room.type === 'global';
  const other = isDM ? (room.members || []).find((m) => m.id !== currentUserId) : null;

  const prefix =
    room.type !== 'dm' && room.lastMessage?.senderName
      ? `${room.lastMessage.senderName.split(' ')[0]}: `
      : '';
  const body =
    room.lastMessage?.type === 'image' ? 'Foto' : room.lastMessage?.content;
  const preview = typing
    ? 'digitando...'
    : room.lastMessage
      ? prefix + body
      : 'Toque para conversar';

  return (
    <button className={`room-item ${active ? 'is-active' : ''}`} onClick={onClick}>
      {isDM ? (
        <Avatar
          name={name}
          color={other?.avatar_color}
          size={48}
          online={onlineIds.includes(other?.id)}
          showStatus
        />
      ) : (
        <div className="room-item__icon" style={{ background: isGlobal ? '#3b2417' : '#a8631f' }}>
          {isGlobal ? <Hash size={22} /> : <Users size={22} />}
        </div>
      )}

      <div className="room-item__body">
        <div className="room-item__top">
          <span className="room-item__name">{name}</span>
          {room.lastMessage && (
            <span className="room-item__time">{formatTime(room.lastMessage.createdAt)}</span>
          )}
        </div>
        <span className={`room-item__preview ${typing ? 'is-typing' : ''}`}>{preview}</span>
      </div>
    </button>
  );
}

import { useState, useMemo } from 'react';
import { Search, MessageSquarePlus, Croissant, Wifi, WifiOff } from 'lucide-react';
import Avatar from '../ui/Avatar.jsx';
import RoomListItem from './RoomListItem.jsx';
import NewChatModal from './NewChatModal.jsx';
import ProfilePanel from '../profile/ProfilePanel.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useChat } from '../../context/ChatContext.jsx';
import { roomDisplayName } from '../../lib/format.js';

/** Coluna da esquerda: header do usuario, busca e lista de conversas. */
export default function Sidebar() {
  const { profile, connected } = useAuth();
  const { rooms, activeRoomId, openRoom, onlineIds } = useChat();
  const [query, setQuery] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rooms;
    return rooms.filter((r) =>
      roomDisplayName(r, profile.id).toLowerCase().includes(q)
    );
  }, [rooms, query, profile.id]);

  return (
    <aside className="sidebar">
      <header className="sidebar__header">
        <button className="sidebar__me" onClick={() => setShowProfile(true)}>
          <Avatar name={profile.display_name} color={profile.avatar_color} size={44} />
          <div className="sidebar__me-info">
            <strong>{profile.display_name}</strong>
            <span className={`conn ${connected ? 'is-on' : 'is-off'}`}>
              {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
              {connected ? 'conectado' : 'reconectando...'}
            </span>
          </div>
        </button>
        <button
          className="icon-btn icon-btn--accent"
          onClick={() => setShowNewChat(true)}
          aria-label="Nova conversa"
          title="Nova conversa"
        >
          <MessageSquarePlus size={22} />
        </button>
      </header>

      <div className="sidebar__brand">
        <Croissant size={18} />
        <span>Conecta Pan</span>
      </div>

      <div className="searchbar">
        <Search size={16} />
        <input
          placeholder="Buscar conversa..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <nav className="room-list">
        {filtered.length === 0 && (
          <p className="muted muted--center">Nenhuma conversa encontrada.</p>
        )}
        {filtered.map((room) => (
          <RoomListItem
            key={room.id}
            room={room}
            currentUserId={profile.id}
            onlineIds={onlineIds}
            active={room.id === activeRoomId}
            typing={false}
            onClick={() => openRoom(room.id)}
          />
        ))}
      </nav>

      <NewChatModal open={showNewChat} onClose={() => setShowNewChat(false)} />
      <ProfilePanel open={showProfile} onClose={() => setShowProfile(false)} />
    </aside>
  );
}

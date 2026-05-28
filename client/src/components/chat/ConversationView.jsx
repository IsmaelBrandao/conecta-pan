import { useState, useEffect } from 'react';
import { Croissant, Search, X } from 'lucide-react';
import ChatHeader from './ChatHeader.jsx';
import MessageList from './MessageList.jsx';
import MessageInput from './MessageInput.jsx';
import { useChat } from '../../context/ChatContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

/** Painel da direita: conversa ativa ou estado vazio. */
export default function ConversationView({ onBack }) {
  const { profile } = useAuth();
  const { activeRoom, messages, typingUsers, onlineIds, loadingMessages, reads } = useChat();
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [lightbox, setLightbox] = useState(null);

  // fecha a busca ao trocar de sala
  useEffect(() => {
    setSearchOpen(false);
    setSearch('');
  }, [activeRoom?.id]);

  if (!activeRoom) {
    return (
      <section className="conversation conversation--empty">
        <div className="welcome">
          <div className="welcome__logo">
            <Croissant size={48} />
          </div>
          <h1>Conecta Pan</h1>
          <p>Selecione uma conversa para comecar a trocar ideia.</p>
          <span className="welcome__hint">
            Suas mensagens ficam fresquinhas e sincronizadas em tempo real.
          </span>
        </div>
      </section>
    );
  }

  return (
    <section className="conversation">
      <ChatHeader
        room={activeRoom}
        currentUserId={profile.id}
        onlineIds={onlineIds}
        typingUsers={typingUsers}
        onBack={onBack}
        onToggleSearch={() => setSearchOpen((v) => !v)}
      />

      {searchOpen && (
        <div className="chat-search">
          <Search size={16} />
          <input
            autoFocus
            placeholder="Buscar nesta conversa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            className="icon-btn"
            onClick={() => {
              setSearch('');
              setSearchOpen(false);
            }}
            aria-label="Fechar busca"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <MessageList
        messages={messages}
        currentUserId={profile.id}
        isGroup={activeRoom.type !== 'dm'}
        members={activeRoom.members}
        reads={reads}
        typingUsers={typingUsers}
        loading={loadingMessages}
        search={search}
        onImageClick={setLightbox}
      />

      <MessageInput roomId={activeRoom.id} />

      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <button className="lightbox__close" aria-label="Fechar">
            <X size={26} />
          </button>
          <img src={lightbox} alt="imagem ampliada" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </section>
  );
}

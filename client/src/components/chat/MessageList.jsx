import { useEffect, useRef } from 'react';
import { Loader2, SearchX } from 'lucide-react';
import MessageBubble from './MessageBubble.jsx';
import TypingIndicator from './TypingIndicator.jsx';
import { formatDayLabel } from '../../lib/format.js';

/**
 * Lista de mensagens com separadores de data, auto-scroll, busca,
 * confirmacao de leitura e abertura de imagem.
 */
export default function MessageList({
  messages,
  currentUserId,
  isGroup,
  members = [],
  reads = {},
  typingUsers,
  loading,
  search = '',
  onImageClick,
}) {
  const endRef = useRef(null);

  const query = search.trim().toLowerCase();
  const filtered = query
    ? messages.filter(
        (m) => m.type !== 'image' && m.content.toLowerCase().includes(query)
      )
    : messages;

  useEffect(() => {
    if (!query) endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [filtered, typingUsers, query]);

  // ids dos outros membros (para calcular "lida por todos")
  const others = members.filter((m) => m.id !== currentUserId).map((m) => m.id);
  const isReadByAll = (message) => {
    if (others.length === 0) return false;
    const t = new Date(message.createdAt).getTime();
    return others.every((id) => reads[id] && new Date(reads[id]).getTime() >= t);
  };

  if (loading) {
    return (
      <div className="message-list message-list--empty">
        <Loader2 className="spin" size={28} />
        <p>Carregando conversa...</p>
      </div>
    );
  }

  if (query && filtered.length === 0) {
    return (
      <div className="message-list message-list--empty">
        <SearchX size={28} />
        <p>Nenhuma mensagem encontrada</p>
        <span>Tente outra palavra.</span>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="message-list message-list--empty">
        <p>Ainda nao tem migalha por aqui.</p>
        <span>Mande a primeira mensagem e quebre o gelo (ou o pao).</span>
      </div>
    );
  }

  let lastDay = null;

  return (
    <div className="message-list">
      {filtered.map((m, i) => {
        const day = formatDayLabel(m.createdAt);
        const showDay = day !== lastDay;
        lastDay = day;
        const prev = filtered[i - 1];
        const mine = m.sender.id === currentUserId;
        const showSender = isGroup && (!prev || prev.sender.id !== m.sender.id);
        return (
          <div key={m.id}>
            {showDay && (
              <div className="day-divider">
                <span>{day}</span>
              </div>
            )}
            <MessageBubble
              message={m}
              mine={mine}
              showSender={showSender}
              read={mine ? isReadByAll(m) : false}
              onImageClick={onImageClick}
            />
          </div>
        );
      })}
      {!query && <TypingIndicator users={typingUsers} />}
      <div ref={endRef} />
    </div>
  );
}

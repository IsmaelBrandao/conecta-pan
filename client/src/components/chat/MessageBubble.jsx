import { Check, CheckCheck } from 'lucide-react';
import { formatTime } from '../../lib/format.js';

/**
 * Balao de mensagem estilo WhatsApp.
 * - mine: alinhado a direita
 * - showSender: mostra nome (em grupos)
 * - read: dois tiques azuis (lida por todos os outros)
 */
export default function MessageBubble({ message, mine, showSender, read, onImageClick }) {
  const isImage = message.type === 'image';

  return (
    <div className={`bubble-row ${mine ? 'is-mine' : 'is-theirs'}`}>
      <div className={`bubble ${isImage ? 'bubble--image' : ''}`}>
        {!mine && showSender && (
          <span className="bubble__sender" style={{ color: message.sender.avatarColor }}>
            {message.sender.displayName}
          </span>
        )}

        {isImage ? (
          <img
            className="bubble__img"
            src={message.content}
            alt="imagem enviada"
            loading="lazy"
            onClick={() => onImageClick?.(message.content)}
          />
        ) : (
          <span className="bubble__text">{message.content}</span>
        )}

        <span className="bubble__meta">
          {formatTime(message.createdAt)}
          {mine &&
            (read ? (
              <CheckCheck size={15} className="bubble__check bubble__check--read" />
            ) : (
              <Check size={15} className="bubble__check" />
            ))}
        </span>
      </div>
    </div>
  );
}

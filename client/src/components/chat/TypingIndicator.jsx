/**
 * Animacao de "digitando..." com tres bolinhas pulsando.
 * Mostra os nomes de quem esta digitando na sala.
 */
export default function TypingIndicator({ users = [] }) {
  if (users.length === 0) return null;

  const label =
    users.length === 1
      ? `${users[0].displayName} esta digitando`
      : users.length === 2
        ? `${users[0].displayName} e ${users[1].displayName} estao digitando`
        : `${users.length} pessoas estao digitando`;

  return (
    <div className="typing">
      <span className="typing__dots" aria-hidden="true">
        <i></i>
        <i></i>
        <i></i>
      </span>
      <span className="typing__label">{label}</span>
    </div>
  );
}

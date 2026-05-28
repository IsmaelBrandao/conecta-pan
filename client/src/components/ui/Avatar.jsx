import { initials } from '../../lib/format.js';

/**
 * Avatar circular com iniciais e cor de fundo do perfil.
 * Mostra um ponto verde quando online.
 */
export default function Avatar({ name, color = '#d9822b', size = 44, online, showStatus }) {
  return (
    <div className="avatar" style={{ width: size, height: size }}>
      <div
        className="avatar__circle"
        style={{ background: color, fontSize: size * 0.38 }}
        aria-hidden="true"
      >
        {initials(name)}
      </div>
      {showStatus && (
        <span
          className={`avatar__status ${online ? 'is-online' : 'is-offline'}`}
          title={online ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
}

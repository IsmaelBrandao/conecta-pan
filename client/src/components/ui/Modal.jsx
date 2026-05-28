import { X } from 'lucide-react';
import { useEffect } from 'react';

/** Modal centralizado e responsivo, fecha no ESC e no clique do fundo. */
export default function Modal({ open, onClose, title, children, icon: Icon }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal__backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <header className="modal__header">
          <h2 className="modal__title">
            {Icon && <Icon size={20} />}
            {title}
          </h2>
          <button className="icon-btn" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </header>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}

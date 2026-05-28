import { useState } from 'react';
import { Pencil, Check, LogOut, Loader2, Palette, AtSign } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Avatar from '../ui/Avatar.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

const COLORS = [
  '#d9822b', '#c0392b', '#8e44ad', '#2980b9',
  '#16a085', '#27ae60', '#e67e22', '#7f8c8d',
];

/** Secao de perfil: editar nome, recado (status) e cor do avatar. */
export default function ProfilePanel({ open, onClose }) {
  const { profile, updateProfile, logout } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile?.display_name || '');
  const [status, setStatus] = useState(profile?.status || '');
  const [color, setColor] = useState(profile?.avatar_color || COLORS[0]);
  const [busy, setBusy] = useState(false);

  if (!profile) return null;

  const startEdit = () => {
    setName(profile.display_name);
    setStatus(profile.status);
    setColor(profile.avatar_color);
    setEditing(true);
  };

  const save = async () => {
    setBusy(true);
    try {
      await updateProfile({ display_name: name, status, avatar_color: color });
      setEditing(false);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Meu perfil">
      <div className="profile">
        <div className="profile__avatar">
          <Avatar name={editing ? name : profile.display_name} color={color} size={120} />
        </div>

        {editing ? (
          <>
            <label className="field-label">
              <span><AtSign size={14} /> Nome</span>
              <input className="field" value={name} onChange={(e) => setName(e.target.value)} />
            </label>

            <label className="field-label">
              <span><Pencil size={14} /> Recado</span>
              <input
                className="field"
                value={status}
                maxLength={80}
                onChange={(e) => setStatus(e.target.value)}
              />
            </label>

            <div className="field-label">
              <span><Palette size={14} /> Cor do avatar</span>
              <div className="color-grid">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    className={`color-dot ${color === c ? 'is-active' : ''}`}
                    style={{ background: c }}
                    onClick={() => setColor(c)}
                    aria-label={`Cor ${c}`}
                  />
                ))}
              </div>
            </div>

            <button className="btn btn--primary btn--full" onClick={save} disabled={busy}>
              {busy ? <Loader2 size={18} className="spin" /> : <Check size={18} />}
              Salvar alteracoes
            </button>
          </>
        ) : (
          <>
            <div className="profile__field">
              <span className="profile__label">Nome</span>
              <strong>{profile.display_name}</strong>
            </div>
            <div className="profile__field">
              <span className="profile__label">Usuario</span>
              <span className="profile__value">@{profile.username}</span>
            </div>
            <div className="profile__field">
              <span className="profile__label">Recado</span>
              <span className="profile__value">{profile.status}</span>
            </div>

            <button className="btn btn--ghost btn--full" onClick={startEdit}>
              <Pencil size={16} /> Editar perfil
            </button>
            <button className="btn btn--danger btn--full" onClick={logout}>
              <LogOut size={16} /> Sair da conta
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}

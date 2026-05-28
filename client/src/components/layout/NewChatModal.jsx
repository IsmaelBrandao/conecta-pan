import { useState, useMemo } from 'react';
import { MessageSquarePlus, Users, Check, Loader2, Search } from 'lucide-react';
import Modal from '../ui/Modal.jsx';
import Avatar from '../ui/Avatar.jsx';
import { useChat } from '../../context/ChatContext.jsx';

/** Modal para iniciar uma DM ou criar um grupo a partir das pessoas online. */
export default function NewChatModal({ open, onClose }) {
  const { people, onlineIds, openDM, createGroup } = useChat();
  const [mode, setMode] = useState('dm'); // 'dm' | 'group'
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState([]);
  const [groupName, setGroupName] = useState('');
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return people.filter((p) => p.display_name.toLowerCase().includes(q));
  }, [people, query]);

  const reset = () => {
    setMode('dm');
    setQuery('');
    setSelected([]);
    setGroupName('');
  };

  const close = () => {
    reset();
    onClose();
  };

  const toggle = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSelectPerson = async (id) => {
    if (mode === 'group') return toggle(id);
    setBusy(true);
    try {
      await openDM(id);
      close();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selected.length === 0) return;
    setBusy(true);
    try {
      await createGroup({ name: groupName, memberIds: selected });
      close();
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={close} title="Nova conversa" icon={MessageSquarePlus}>
      <div className="newchat__tabs">
        <button
          className={`tab ${mode === 'dm' ? 'is-active' : ''}`}
          onClick={() => setMode('dm')}
        >
          <MessageSquarePlus size={16} /> Conversa
        </button>
        <button
          className={`tab ${mode === 'group' ? 'is-active' : ''}`}
          onClick={() => setMode('group')}
        >
          <Users size={16} /> Novo grupo
        </button>
      </div>

      {mode === 'group' && (
        <input
          className="field"
          placeholder="Nome do grupo (ex: Turma do Forno)"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />
      )}

      <div className="searchbar searchbar--inline">
        <Search size={16} />
        <input
          placeholder="Buscar pessoas..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="people-list">
        {filtered.length === 0 && <p className="muted">Ninguem por aqui ainda.</p>}
        {filtered.map((p) => {
          const isSelected = selected.includes(p.id);
          return (
            <button
              key={p.id}
              className={`person ${isSelected ? 'is-selected' : ''}`}
              onClick={() => handleSelectPerson(p.id)}
              disabled={busy}
            >
              <Avatar
                name={p.display_name}
                color={p.avatar_color}
                size={42}
                online={onlineIds.includes(p.id)}
                showStatus
              />
              <div className="person__info">
                <strong>{p.display_name}</strong>
                <span>{p.status}</span>
              </div>
              {mode === 'group' && (
                <span className={`checkbox ${isSelected ? 'is-checked' : ''}`}>
                  {isSelected && <Check size={14} />}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {mode === 'group' && (
        <button
          className="btn btn--primary btn--full"
          disabled={busy || !groupName.trim() || selected.length === 0}
          onClick={handleCreateGroup}
        >
          {busy ? <Loader2 size={18} className="spin" /> : <Users size={18} />}
          Criar grupo ({selected.length})
        </button>
      )}
    </Modal>
  );
}

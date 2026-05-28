import { useState } from 'react';
import { Croissant, ArrowRight, Loader2, Wheat } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

/** Tela de entrada: escolhe um @usuario e o nome de exibicao. */
export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const u = username.trim();
    if (u.length < 3) {
      setError('O usuario precisa de pelo menos 3 letras.');
      return;
    }
    setError('');
    setBusy(true);
    try {
      await login({ username: u, displayName: displayName.trim() || u });
    } catch (err) {
      setError(err.message || 'Nao foi possivel entrar.');
      setBusy(false);
    }
  };

  return (
    <div className="login">
      <div className="login__art" aria-hidden="true">
        <Wheat className="login__wheat login__wheat--1" size={120} />
        <Wheat className="login__wheat login__wheat--2" size={90} />
        <Croissant className="login__croissant" size={140} />
      </div>

      <form className="login__card" onSubmit={handleSubmit}>
        <div className="login__logo">
          <Croissant size={40} />
        </div>
        <h1 className="login__title">Conecta Pan</h1>
        <p className="login__subtitle">
          O bate-papo quentinho da padaria. Entre e puxe assunto.
        </p>

        <label className="field-label">
          <span>Seu @usuario</span>
          <input
            className="field"
            value={username}
            onChange={(e) => setUsername(e.target.value.replace(/\s/g, ''))}
            placeholder="ex: joao_padeiro"
            autoFocus
            maxLength={24}
          />
        </label>

        <label className="field-label">
          <span>Nome de exibicao (opcional)</span>
          <input
            className="field"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="ex: Joao do Forno"
            maxLength={32}
          />
        </label>

        {error && <p className="login__error">{error}</p>}

        <button className="btn btn--primary btn--full" type="submit" disabled={busy}>
          {busy ? <Loader2 size={18} className="spin" /> : <ArrowRight size={18} />}
          Entrar na padaria
        </button>

        <p className="login__hint">
          Sem senha por enquanto: e so escolher um nome e comecar.
        </p>
      </form>
    </div>
  );
}

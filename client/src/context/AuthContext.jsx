import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { socket, emitAck } from '../lib/socket.js';

const AuthContext = createContext(null);
const STORAGE_KEY = 'conecta-pan:auth';

export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [connected, setConnected] = useState(false);
  const [booting, setBooting] = useState(true);

  // status da conexao socket
  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
    };
  }, []);

  const doLogin = useCallback(async ({ username, displayName }) => {
    if (!socket.connected) socket.connect();
    const data = await emitAck('auth:login', { username, displayName });
    setProfile(data.profile);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ username: data.profile.username, displayName: data.profile.display_name })
    );
    return data;
  }, []);

  // re-login automatico se ja existir sessao salva
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      setBooting(false);
      return;
    }
    const { username, displayName } = JSON.parse(saved);
    socket.connect();
    const tryLogin = async () => {
      try {
        await doLogin({ username, displayName });
      } catch (e) {
        console.warn('auto-login falhou', e.message);
      } finally {
        setBooting(false);
      }
    };
    if (socket.connected) tryLogin();
    else socket.once('connect', tryLogin);
  }, [doLogin]);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setProfile(null);
    socket.disconnect();
  }, []);

  const updateProfile = useCallback(async (patch) => {
    const data = await emitAck('profile:update', patch);
    setProfile(data.profile);
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...saved, displayName: data.profile.display_name })
    );
    return data.profile;
  }, []);

  return (
    <AuthContext.Provider
      value={{ profile, connected, booting, login: doLogin, logout, updateProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}

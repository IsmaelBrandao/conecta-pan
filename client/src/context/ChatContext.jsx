import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from 'react';
import { socket, emitAck } from '../lib/socket.js';
import { useAuth } from './AuthContext.jsx';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const { profile } = useAuth();
  const [rooms, setRooms] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [messagesByRoom, setMessagesByRoom] = useState({});
  const [typingByRoom, setTypingByRoom] = useState({});
  const [readsByRoom, setReadsByRoom] = useState({});
  const [onlineIds, setOnlineIds] = useState([]);
  const [people, setPeople] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const activeRoomRef = useRef(null);
  activeRoomRef.current = activeRoomId;

  const refreshRooms = useCallback(async () => {
    const data = await emitAck('rooms:list');
    setRooms(data.rooms);
    return data.rooms;
  }, []);

  const refreshPeople = useCallback(async () => {
    const data = await emitAck('users:list');
    setPeople(data.users);
    setOnlineIds(data.online);
    return data.users;
  }, []);

  // carrega salas/pessoas quando o perfil logar
  useEffect(() => {
    if (!profile) return;
    refreshRooms().catch((e) => console.error(e));
    refreshPeople().catch((e) => console.error(e));
  }, [profile, refreshRooms, refreshPeople]);

  // listeners de tempo real
  useEffect(() => {
    if (!profile) return;

    const onNewMessage = (message) => {
      setMessagesByRoom((prev) => {
        const list = prev[message.roomId] || [];
        if (list.some((m) => m.id === message.id)) return prev;
        return { ...prev, [message.roomId]: [...list, message] };
      });
      // atualiza preview/ordem da lista de salas
      setRooms((prev) =>
        prev
          .map((r) =>
            r.id === message.roomId
              ? {
                  ...r,
                  lastMessage: {
                    content: message.content,
                    type: message.type,
                    createdAt: message.createdAt,
                    senderName: message.sender.displayName,
                  },
                }
              : r
          )
          .sort((a, b) => {
            const ta = a.lastMessage?.createdAt || a.created_at;
            const tb = b.lastMessage?.createdAt || b.created_at;
            return new Date(tb) - new Date(ta);
          })
      );
    };

    const onTyping = ({ roomId, users }) => {
      setTypingByRoom((prev) => ({ ...prev, [roomId]: users }));
    };

    const onPresence = ({ online }) => setOnlineIds(online);
    const onRoomsChanged = () => refreshRooms().catch(() => {});

    const onReadsUpdate = ({ roomId, userId, lastReadAt }) => {
      setReadsByRoom((prev) => ({
        ...prev,
        [roomId]: { ...(prev[roomId] || {}), [userId]: lastReadAt },
      }));
    };

    socket.on('message:new', onNewMessage);
    socket.on('typing:update', onTyping);
    socket.on('presence:update', onPresence);
    socket.on('rooms:changed', onRoomsChanged);
    socket.on('reads:update', onReadsUpdate);

    return () => {
      socket.off('message:new', onNewMessage);
      socket.off('typing:update', onTyping);
      socket.off('presence:update', onPresence);
      socket.off('rooms:changed', onRoomsChanged);
      socket.off('reads:update', onReadsUpdate);
    };
  }, [profile, refreshRooms]);

  // marca a sala ativa como lida sempre que chega mensagem nova de outro
  const markRead = useCallback((roomId) => {
    socket.emit('room:read', { roomId }, (res) => {
      if (res?.ok && profile) {
        setReadsByRoom((prev) => ({
          ...prev,
          [roomId]: { ...(prev[roomId] || {}), [profile.id]: res.data.lastReadAt },
        }));
      }
    });
  }, [profile]);

  useEffect(() => {
    const last = messagesByRoom[activeRoomId]?.slice(-1)[0];
    if (activeRoomId && last && profile && last.sender.id !== profile.id) {
      markRead(activeRoomId);
    }
  }, [messagesByRoom, activeRoomId, profile, markRead]);

  const openRoom = useCallback(async (roomId) => {
    setActiveRoomId(roomId);
    setLoadingMessages(true);
    try {
      const data = await emitAck('messages:list', { roomId });
      setMessagesByRoom((prev) => ({ ...prev, [roomId]: data.messages }));
      setReadsByRoom((prev) => ({ ...prev, [roomId]: data.reads || {} }));
      markRead(roomId);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMessages(false);
    }
  }, [markRead]);

  const sendMessage = useCallback(async (content) => {
    const roomId = activeRoomRef.current;
    if (!roomId || !content.trim()) return;
    await emitAck('message:send', { roomId, content });
  }, []);

  const sendImage = useCallback(async (dataUrl) => {
    const roomId = activeRoomRef.current;
    if (!roomId || !dataUrl) return;
    await emitAck('message:image', { roomId, dataUrl });
  }, []);

  const startTyping = useCallback((roomId) => {
    socket.emit('typing:start', { roomId });
  }, []);
  const stopTyping = useCallback((roomId) => {
    socket.emit('typing:stop', { roomId });
  }, []);

  const createGroup = useCallback(
    async ({ name, description, memberIds }) => {
      const data = await emitAck('room:create', { name, description, memberIds });
      await refreshRooms();
      return data.room;
    },
    [refreshRooms]
  );

  const openDM = useCallback(
    async (targetUserId) => {
      const data = await emitAck('dm:open', { targetUserId });
      await refreshRooms();
      await openRoom(data.room.id);
      return data.room;
    },
    [refreshRooms, openRoom]
  );

  const value = {
    rooms,
    activeRoomId,
    activeRoom: rooms.find((r) => r.id === activeRoomId) || null,
    messages: messagesByRoom[activeRoomId] || [],
    typingUsers: typingByRoom[activeRoomId] || [],
    reads: readsByRoom[activeRoomId] || {},
    onlineIds,
    people,
    loadingMessages,
    openRoom,
    sendMessage,
    sendImage,
    startTyping,
    stopTyping,
    createGroup,
    openDM,
    refreshRooms,
    refreshPeople,
    setActiveRoomId,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat deve ser usado dentro de ChatProvider');
  return ctx;
}

import Sidebar from '../components/layout/Sidebar.jsx';
import ConversationView from '../components/chat/ConversationView.jsx';
import { useChat } from '../context/ChatContext.jsx';

/**
 * Layout principal de duas colunas. No mobile, a classe
 * `has-active` desliza para a conversa aberta.
 */
export default function ChatPage() {
  const { activeRoomId, setActiveRoomId } = useChat();

  return (
    <div className={`app-shell ${activeRoomId ? 'has-active' : ''}`}>
      <Sidebar />
      <ConversationView onBack={() => setActiveRoomId(null)} />
    </div>
  );
}

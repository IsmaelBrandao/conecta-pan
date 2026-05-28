import { Croissant, Loader2 } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { ChatProvider } from './context/ChatContext.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ChatPage from './pages/ChatPage.jsx';

function Gate() {
  const { profile, booting } = useAuth();

  if (booting) {
    return (
      <div className="boot">
        <Croissant size={48} className="boot__logo" />
        <Loader2 size={22} className="spin" />
        <p>Aquecendo o forno...</p>
      </div>
    );
  }

  if (!profile) return <LoginPage />;

  return (
    <ChatProvider>
      <ChatPage />
    </ChatProvider>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}

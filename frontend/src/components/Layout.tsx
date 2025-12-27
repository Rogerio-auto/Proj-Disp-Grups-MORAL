import React, { ReactNode, useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  MessageSquare, 
  Users, 
  Send, 
  Settings, 
  LogOut,
  User,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [zapiConnected, setZapiConnected] = useState<boolean | null>(null);

  useEffect(() => {
    checkZapiStatus();
    const interval = setInterval(checkZapiStatus, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  const checkZapiStatus = async () => {
    try {
      const response = await api.get('/dashboard/zapi-status');
      setZapiConnected(response.data.data.connected);
    } catch (error) {
      setZapiConnected(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', path: '/dashboard' },
    { icon: <MessageSquare size={20} />, label: 'Mensagens', path: '/messages' },
    { icon: <Users size={20} />, label: 'Grupos', path: '/groups' },
    { icon: <Send size={20} />, label: 'Campanhas', path: '/campaigns' },
    { icon: <Settings size={20} />, label: 'Configurações', path: '/settings' },
  ];

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md flex flex-col">
        <div className="p-6 border-b">
          <h1 className="text-xl font-bold text-blue-600 flex items-center gap-2">
            <Send size={24} />
            Disp-Canais
          </h1>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-2 rounded-md transition-colors ${
                location.pathname === item.path
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center gap-3 px-4 py-2 mb-2">
            <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <User size={18} />
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.nome}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
          >
            <LogOut size={20} />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white shadow-sm flex items-center justify-between px-8">
          <h2 className="text-lg font-semibold text-gray-800">
            {menuItems.find(item => item.path === location.pathname)?.label || 'Sistema'}
          </h2>
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold ${
              zapiConnected === null ? 'bg-gray-100 text-gray-400' :
              zapiConnected ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {zapiConnected === null ? (
                'Verificando...'
              ) : zapiConnected ? (
                <><Wifi size={14} /> WhatsApp Conectado</>
              ) : (
                <><WifiOff size={14} /> WhatsApp Desconectado</>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;

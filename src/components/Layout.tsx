import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAlerts } from '../contexts/AlertContext';
import { 
  LayoutDashboard, 
  Receipt, 
  Target, 
  PiggyBank,
  BarChart2,
  Lightbulb,
  Users,
  FileText,
  User,
  LogOut,
  Wallet,
  Bell,
  Moon,
  Sun
} from 'lucide-react';
import { WalletSelector } from './WalletSelector';
import { AlertBell } from './AlertBell';

interface LayoutProps {
  children: React.ReactNode;
}

const NotificationMenuItem = ({ unreadCount }: { unreadCount: number }) => {
  return (
    <div className="relative flex items-center w-full">
      <Bell className="h-5 w-5 mr-3" />
      <span>Notificações</span>
      {unreadCount > 0 && (
        <div className="flex items-center ml-auto">
          <span className="animate-pulse bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
            {unreadCount} {unreadCount === 1 ? 'nova' : 'novas'}
          </span>
        </div>
      )}
    </div>
  );
};

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, userProfile } = useAuth();
  const { unreadCount } = useAlerts();

  const menuItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/transactions', icon: Receipt, label: 'Transações' },
    { path: '/goals', icon: Target, label: 'Metas' },
    { path: '/budget', icon: PiggyBank, label: 'Orçamentos' },
    { path: '/charts', icon: BarChart2, label: 'Gráficos' },
    { path: '/reports', icon: FileText, label: 'Relatórios' },
    { path: '/suggestions', icon: Lightbulb, label: 'Sugestões' },
    { path: '/family', icon: Users, label: 'Compartilhamento' }
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="fixed w-64 h-full">
        <div className="flex flex-col h-full bg-white border-r border-gray-200">
          {/* Logo/Header */}
          <div className="p-4 border-b">
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <div className="flex items-center space-x-2">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-2 rounded-lg">
                    <Wallet className="h-6 w-6 text-white" />
                  </div>
                  <div className="flex flex-col">
                    <div className="flex items-center">
                      <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
                        Wise
                      </span>
                      <span className="text-2xl font-bold text-gray-700">Wallet</span>
                    </div>
                    <span className="text-xs text-gray-500">Gestão Financeira Inteligente</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.label}
                </Link>
              );
            })}

            {/* Item especial para notificações */}
            <Link
              to="/notifications"
              className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                location.pathname === '/notifications'
                  ? 'bg-blue-50 text-blue-700'
                  : unreadCount > 0
                  ? 'bg-red-50 text-red-700 animate-pulse-subtle'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <NotificationMenuItem unreadCount={unreadCount} />
            </Link>
          </nav>
      {/* WalletSelector moved here, before notifications */}
              <WalletSelector />
          {/* User Profile & Logout */}
          <div className="p-4 border-t">
            <Link
              to="/profile"
              className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <User className="h-5 w-5 mr-3" />
              {userProfile?.name || 'Perfil'}
            </Link>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5 mr-3" />
              Sair
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="ml-64 flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
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
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed bottom-0 sm:bottom-auto sm:top-0 left-0 w-full sm:w-64 bg-white border-t sm:border-t-0 sm:border-r border-gray-200 z-40">
        {/* Logo - Visível apenas em desktop */}
        <div className="hidden sm:block p-4 border-b">
          <div className="flex items-center space-x-4">
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

        {/* Container principal para desktop */}
        <div className="hidden sm:flex sm:flex-col sm:h-[calc(100vh-76px)]"> {/* 76px é a altura do logo */}
          {/* Menu Principal com scroll */}
          <div className="flex-1 overflow-y-auto">
            <nav className="flex flex-col p-4 space-y-1">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center p-2 sm:px-4 sm:py-2 rounded-lg transition-colors ${
                      isActive
                        ? 'text-blue-600 sm:bg-blue-50'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className="h-5 w-5 sm:mr-3" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                );
              })}

              {/* Notificações */}
              <Link
                to="/notifications"
                className={`flex items-center p-2 sm:px-4 sm:py-2 rounded-lg transition-colors ${
                  location.pathname === '/notifications'
                    ? 'text-blue-600 sm:bg-blue-50'
                    : unreadCount > 0
                    ? 'text-red-600 animate-pulse-subtle'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Bell className="h-5 w-5 sm:mr-3" />
                <span className="hidden sm:inline">Notificações</span>
                {unreadCount > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </Link>
            </nav>
          </div>

          {/* Footer fixo */}
          <div className="border-t bg-white">
            <WalletSelector />
            <div className="p-4 space-y-2">
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
                <span>Sair</span>
              </button>
            </div>
          </div>
        </div>

        {/* Menu mobile */}
        <div className="flex sm:hidden h-16">
          <nav className="flex flex-1 justify-around items-center">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center p-2 sm:px-4 sm:py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'text-blue-600 sm:bg-blue-50'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="h-5 w-5 sm:mr-3" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="sm:ml-64 pb-16 sm:pb-0 pt-16 sm:pt-0">
        {children}
      </div>

      {/* Menu flutuante para mobile */}
      <div className="fixed sm:hidden top-0 left-0 right-0 bg-white border-b border-gray-200 p-2 flex items-center justify-between z-50">
        {/* Logo versão mobile */}
        <div className="flex items-center">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-1.5 rounded-lg mr-2">
            <Wallet className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-500 bg-clip-text text-transparent">
            Wise
          </span>
          <span className="text-lg font-bold text-gray-700">Wallet</span>
        </div>

        {/* Área direita com Wallet Selector e botões */}
        <div className="flex items-center space-x-2">
          <WalletSelector />
          <div className="flex items-center space-x-1 ml-2 border-l pl-2">
            <Link to="/profile" className="p-1.5 text-gray-600 hover:bg-gray-50 rounded-lg">
              <User className="h-5 w-5" />
            </Link>
            <button 
              onClick={handleSignOut}
              className="p-1.5 text-gray-600 hover:bg-gray-50 rounded-lg"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
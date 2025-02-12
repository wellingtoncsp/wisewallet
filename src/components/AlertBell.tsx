import React, { useState, useRef, useEffect } from 'react';
import { Bell, X, Check, ChevronRight } from 'lucide-react';
import { useAlerts } from '../contexts/AlertContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';

export const AlertBell: React.FC = () => {
  const { alerts, unreadCount, markAsRead, markAllAsRead } = useAlerts();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (alertId: string) => {
    await markAsRead(alertId);
  };

  return (
    <div className="fixed top-4 right-4 z-50" ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 bg-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
      >
        <Bell className={`h-6 w-6 ${unreadCount > 0 ? 'text-blue-600' : 'text-gray-600'}`} />
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs flex items-center justify-center rounded-full"
            >
              {unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-4 w-96 bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            <div className="p-4 border-b bg-gradient-to-r from-blue-500 to-blue-600">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-white">Notificações</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead()}
                    className="text-sm text-white/80 hover:text-white flex items-center gap-1"
                  >
                    <Check className="h-4 w-4" />
                    Marcar todas como lidas
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-[70vh] overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="bg-blue-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                    <Bell className="h-8 w-8 text-blue-500" />
                  </div>
                  <p className="text-gray-500 font-medium">Nenhuma notificação ainda! 🎉</p>
                  <p className="text-gray-400 text-sm mt-1">Você está em dia com tudo!</p>
                </div>
              ) : (
                <div className="divide-y">
                  {alerts.map(alert => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`group relative ${!alert.read ? 'bg-blue-50/50' : 'hover:bg-gray-50'}`}
                    >
                      <div 
                        className="p-4 cursor-pointer"
                        onClick={() => handleMarkAsRead(alert.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
                            <span className="text-xl">{alert.icon}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900">{alert.title}</p>
                            <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{alert.message}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {format(alert.createdAt, "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                            </p>
                          </div>
                          <ChevronRight className="h-5 w-5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                      {!alert.read && (
                        <div className="absolute top-0 right-0 w-2 h-full bg-blue-500 rounded-l" />
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}; 
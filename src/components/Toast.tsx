import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ToastProps {
  message: string;
  title: string;
  icon?: string;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ message, title, icon, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 5000); // Fecha após 5 segundos
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50, x: 'calc(100% + 24px)' }}
        animate={{ opacity: 1, y: 0, x: 0 }}
        exit={{ opacity: 0, x: 'calc(100% + 24px)' }}
        className="fixed top-4 right-4 w-96 bg-white rounded-lg shadow-lg z-50 overflow-hidden"
      >
        <div className="p-4">
          <div className="flex items-start">
            {icon && <span className="text-2xl mr-3">{icon}</span>}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900">{title}</p>
              <p className="mt-1 text-sm text-gray-500">{message}</p>
            </div>
            <button
              onClick={onClose}
              className="ml-4 text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: 0 }}
          transition={{ duration: 5 }}
          className="h-1 bg-blue-500"
        />
      </motion.div>
    </AnimatePresence>
  );
}; 
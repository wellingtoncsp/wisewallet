import React, { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useAuth } from '../contexts/AuthContext';
import { ChevronDown, Wallet, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const WalletSelector = () => {
  const { wallets, currentWallet, setCurrentWallet, sharedWallets, isSharedWallet } = useWallet();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  console.log('WalletSelector - user:', user?.email);
  console.log('WalletSelector - wallets:', wallets);
  console.log('WalletSelector - currentWallet:', currentWallet);

  if (wallets.length <= 1) {
    console.log('WalletSelector - retornando null porque wallets.length <= 1');
    return null;
  }

  const ownedWallets = wallets.filter(w => w.userId === user?.uid);
  console.log('WalletSelector - ownedWallets:', ownedWallets);

  return (
    <div className="relative p-4 border-t border-gray-200">
      {/* Menu dropdown - Moved above the button */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute left-4 right-4 bottom-full mb-2 py-2 bg-white rounded-lg shadow-lg z-50"
          >
            {/* Carteiras próprias */}
            <div className="px-4 py-1 text-xs font-semibold text-gray-500 uppercase">
              Minhas Carteiras
            </div>
            {ownedWallets.map(wallet => (
              <button
                key={wallet.id}
                onClick={() => {
                  setCurrentWallet(wallet);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center px-4 py-2 text-left hover:bg-gray-50 ${
                  currentWallet?.id === wallet.id ? 'bg-blue-50' : ''
                }`}
              >
                <Wallet className="h-5 w-5 text-blue-500" />
                <span className="ml-3 text-gray-900">{wallet.name}</span>
              </button>
            ))}

            {/* Carteiras compartilhadas */}
            {sharedWallets.length > 0 && (
              <>
                <div className="mt-2 px-4 py-1 text-xs font-semibold text-gray-500 uppercase">
                  Carteiras Compartilhadas
                </div>
                {sharedWallets.map(wallet => (
                  <button
                    key={wallet.id}
                    onClick={() => {
                      setCurrentWallet(wallet);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center px-4 py-2 text-left hover:bg-gray-50 ${
                      currentWallet?.id === wallet.id ? 'bg-purple-50' : ''
                    }`}
                  >
                    <Users className="h-5 w-5 text-purple-500" />
                    <span className="ml-3 text-gray-900">{wallet.name}</span>
                  </button>
                ))}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botão principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center">
          {currentWallet?.id && isSharedWallet(currentWallet.id) ? (
            <Users className="h-5 w-5 text-purple-500" />
          ) : (
            <Wallet className="h-5 w-5 text-blue-500" />
          )}
          <span className="ml-3 font-medium text-gray-900">
            {currentWallet?.name || 'Selecione uma carteira'}
          </span>
        </div>
        <ChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
    </div>
  );
};
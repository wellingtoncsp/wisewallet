import React, { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useAuth } from '../contexts/AuthContext';
import { ChevronDown, Wallet, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const WalletSelector = () => {
  const { wallets, currentWallet, setCurrentWallet, sharedWallets, isSharedWallet } = useWallet();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (wallets.length <= 1) {
    return null;
  }

  const ownedWallets = wallets.filter(w => w.userId === user?.uid);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 sm:p-3 text-sm sm:text-base"
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

      {isOpen && (
        <div 
          className={`
            absolute w-48 sm:w-64 bg-white rounded-lg shadow-lg
            ${window.innerWidth >= 640 ? 'bottom-full mb-2' : 'top-full mt-2'}
            right-0
          `}
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
        </div>
      )}
    </div>
  );
}; 
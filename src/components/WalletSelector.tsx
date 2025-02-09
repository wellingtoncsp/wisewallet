import React from 'react';
import { useWallet } from '../contexts/WalletContext';
import { Wallet } from 'lucide-react';

export function WalletSelector() {
  const { currentWallet, wallets, setCurrentWallet } = useWallet();

  if (wallets.length <= 1) return null;

  return (
    <div className="relative">
      <select
        value={currentWallet?.id}
        onChange={(e) => {
          const wallet = wallets.find(w => w.id === e.target.value);
          if (wallet) setCurrentWallet(wallet);
        }}
        className="appearance-none bg-white border border-gray-300 rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {wallets.map(wallet => (
          <option key={wallet.id} value={wallet.id}>
            {wallet.name}
          </option>
        ))}
      </select>
      <Wallet className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
    </div>
  );
} 
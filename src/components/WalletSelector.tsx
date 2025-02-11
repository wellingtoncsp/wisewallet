import React from 'react';
import { useWallet } from '../contexts/WalletContext';
import { useAuth } from '../contexts/AuthContext';
import { Wallet } from 'lucide-react';

export function WalletSelector() {
  const { currentWallet, wallets, setCurrentWallet, sharedWallets } = useWallet();
  const { user } = useAuth();

  console.log('WalletSelector - user:', user?.email);
  console.log('WalletSelector - wallets:', wallets);
  console.log('WalletSelector - sharedWallets:', sharedWallets);
  console.log('WalletSelector - currentWallet:', currentWallet);

  if (wallets.length <= 1) {
    console.log('WalletSelector - retornando null porque wallets.length <= 1');
    return null;
  }

  const ownedWallets = wallets.filter(w => w.userId === user?.uid);
  console.log('WalletSelector - ownedWallets:', ownedWallets);

  return (
    <div className="relative">
      <select
        value={currentWallet?.id}
        onChange={(e) => {
          console.log('WalletSelector - wallet selecionada:', e.target.value);
          const wallet = wallets.find(w => w.id === e.target.value);
          if (wallet) setCurrentWallet(wallet);
        }}
        className="appearance-none bg-white border border-gray-300 rounded-md pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <optgroup label="Minhas Carteiras">
          {ownedWallets.map(wallet => (
            <option key={wallet.id} value={wallet.id}>
              {wallet.name}
            </option>
          ))}
        </optgroup>
        {sharedWallets.length > 0 && (
          <optgroup label="Carteiras Compartilhadas">
            {sharedWallets.map(wallet => (
              <option key={wallet.id} value={wallet.id}>
                {wallet.name} (Compartilhada)
              </option>
            ))}
          </optgroup>
        )}
      </select>
      <Wallet className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
    </div>
  );
} 
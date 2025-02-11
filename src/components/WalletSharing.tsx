import React, { useState } from 'react';
import { useWallet } from '../contexts/WalletContext';
import { Share2, Check, X } from 'lucide-react';

export function WalletSharing() {
  const { 
    currentWallet, 
    wallets,
    shareWallet, 
    pendingShares,
    acceptShare,
    rejectShare 
  } = useWallet();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await shareWallet(selectedWalletId, email);
      setIsModalOpen(false);
      setEmail('');
      setSelectedWalletId('');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Erro ao compartilhar carteira');
    }
  };

  return (
    <>
      {/* Notificações de compartilhamento pendente */}
      {pendingShares.length > 0 && (
        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Compartilhamentos Pendentes</h3>
          <div className="space-y-2">
            {pendingShares.map(share => (
              <div key={share.id} className="bg-white p-4 rounded-lg shadow-sm flex items-center justify-between">
                <div>
                  <p className="font-medium">Carteira compartilhada por: {share.sharedByUserId}</p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => acceptShare(share.id)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-full"
                  >
                    <Check className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => rejectShare(share.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Botão de compartilhar */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
      >
        <Share2 className="h-4 w-4 mr-2" />
        Compartilhar Carteira
      </button>

      {/* Modal de compartilhamento */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">Compartilhar Carteira</h2>
            <form onSubmit={handleShare} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Selecione a Carteira
                </label>
                <select
                  value={selectedWalletId}
                  onChange={(e) => setSelectedWalletId(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300"
                  required
                >
                  <option value="">Selecione uma carteira</option>
                  {wallets.map(wallet => (
                    <option key={wallet.id} value={wallet.id}>
                      {wallet.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email do usuário
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300"
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md"
                >
                  Compartilhar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
} 
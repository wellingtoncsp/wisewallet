import React, { useState, useEffect } from 'react';

import { Users,  X, Share2, Check } from 'lucide-react';
import { useWallet } from '../contexts/WalletContext';
import { useAlerts } from '../contexts/AlertContext';

interface SharedByUser {
  name: string;
  email: string;
}

interface ShareData {
  id: string;
  sharedByUser: SharedByUser;
  sharedByUserId: string;
  sharedWithEmail: string;
  walletId: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export default function Family() {
  const { 
    wallets,
    shareWallet, 
    pendingShares,
    acceptShare,
    rejectShare,
    activeShares,
    removeShare,
    sentPendingShares
  } = useWallet();
  const { createAlert } = useAlerts();

  console.log('Family - wallets:', wallets);
  console.log('Family - pendingShares:', pendingShares);
  console.log('Family - activeShares:', activeShares);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (pendingShares.length > 0) {
      console.log('Dados do compartilhamento:', pendingShares);
    }
  }, [pendingShares]);

  const handleAcceptShare = async (shareId: string) => {
    try {
      setError('');
      await acceptShare(shareId);
      setSuccess('Convite aceito com sucesso!');
      
      // Criar alerta de sucesso
      await createAlert('share_invite', {
        status: 'accepted'
      }, shareId);

      // Limpar mensagem de sucesso após 3 segundos
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError('Erro ao aceitar convite. Tente novamente.');
      console.error('Erro ao aceitar convite:', err);
    }
  };

  const handleRejectShare = async (shareId: string) => {
    try {
      setError('');
      await rejectShare(shareId);
      setSuccess('Convite rejeitado com sucesso!');
      
      // Criar alerta de rejeição
      await createAlert('share_invite', {
        status: 'rejected'
      }, shareId);

      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err) {
      setError('Erro ao rejeitar convite. Tente novamente.');
      console.error('Erro ao rejeitar convite:', err);
    }
  };

  const handleShare = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await shareWallet(selectedWalletId, email);
      setIsModalOpen(false);
      setEmail('');
      setSelectedWalletId('');
      setSuccess('Oba! Convite enviado com sucesso! 🎉 Agora é só aguardar a resposta do seu amigo!');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Ops! Algo deu errado ao compartilhar a carteira 😅');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center mb-8">
        <Users className="h-8 w-8 text-purple-500 mr-3" />
        <h1 className="text-3xl font-bold text-gray-900">Compartilhamento</h1>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          {success}
        </div>
      )}

      {/* Notificações de compartilhamento pendente */}
      {pendingShares.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            <span className="mr-2">��</span>
            Convites Pendentes
          </h3>
          <div className="space-y-4">
            {pendingShares.map(share => (
              <div key={share.id} className="border-b last:border-0 pb-4 last:pb-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      Hey! Você recebeu um convite especial! ✨
                    </p>
                    <p className="text-sm text-gray-600">
                      <strong>{share.sharedByUser?.name}</strong> ({share.sharedByUser?.email}) 
                      quer compartilhar uma carteira com você!
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Carteira: <strong>
                        {wallets.find(w => w.id === share.walletId)?.name || 'Carteira Compartilhada'}
                      </strong>
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleAcceptShare(share.id)}
                      className="flex items-center px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Aceitar
                    </button>
                    <button
                      onClick={() => handleRejectShare(share.id)}
                      className="flex items-center px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                    >
                      <X className="h-4 w-4 mr-2" />
                      Recusar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Solicitações Enviadas Pendentes */}
      {sentPendingShares.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            <span className="mr-2">🚀</span>
            Convites Enviados
          </h3>
          <div className="space-y-4">
            {sentPendingShares.map(share => {
              const wallet = wallets.find(w => w.id === share.walletId);
              if (!wallet) return null;

              return (
                <div key={share.id} className="border-b last:border-0 pb-4 last:pb-0">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{wallet.name}</p>
                      <p className="text-sm text-gray-600">
                        Aguardando resposta de {share.sharedWithEmail}
                      </p>
                      <span className="inline-block px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full mt-1">
                        ⏳ Pendente
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm(`Deseja cancelar o convite enviado para ${share.sharedWithEmail}?`)) {
                          removeShare(share.id);
                        }
                      }}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                      title="Cancelar convite"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lista de carteiras compartilhadas */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Carteiras Compartilhadas</h2>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            <Share2 className="h-5 w-5 mr-2" />
            Novo Compartilhamento
          </button>
        </div>

        <div className="space-y-4">
          {activeShares.length > 0 ? (
            activeShares.map(share => {
              const wallet = wallets.find(w => w.id === share.walletId);
              if (!wallet) return null;

              return (
                <div key={share.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">{wallet.name}</h3>
                    <p className="text-sm text-gray-500">
                      Compartilhada com: {share.sharedWithEmail}
                    </p>
                    {share.sharedByUser && (
                      <p className="text-xs text-gray-400">
                        Compartilhada por: {share.sharedByUser.name} ({share.sharedByUser.email})
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Deseja remover o compartilhamento com ${share.sharedWithEmail}?`)) {
                        removeShare(share.id);
                      }
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              );
            })
          ) : (
            <div className="text-center py-6 text-gray-500">
              <Share2 className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p>Nenhuma carteira compartilhada</p>
            </div>
          )}
        </div>
      </div>

     

      {/* Modal de compartilhamento */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
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
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-purple-500 focus:ring-purple-500"
                  placeholder="Digite o email do usuário"
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
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-md hover:bg-purple-700"
                >
                  Compartilhar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
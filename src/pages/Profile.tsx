import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Lock, Users, UserPlus, X, Wallet, Plus, Edit2, Trash2 } from 'lucide-react';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { FamilyMember } from '../types/user';
import { useWallet } from '../contexts/WalletContext';

export default function Profile() {
  const { userProfile, updateUserProfile, updateUserPassword } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isFamilyModalOpen, setIsFamilyModalOpen] = useState(false);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [formData, setFormData] = useState({
    name: userProfile?.name || '',
    birthDate: userProfile?.birthDate || '',
    cpf: userProfile?.cpf || '',
    gender: (userProfile?.gender || '') as '' | 'male' | 'female' | 'other',
    currency: userProfile?.currency || 'BRL'
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (userProfile?.familyId) {
      fetchFamilyMembers();
    }
  }, [userProfile]);

  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || '',
        birthDate: userProfile.birthDate || '',
        cpf: userProfile.cpf || '',
        gender: (userProfile.gender || '') as '' | 'male' | 'female' | 'other',
        currency: userProfile.currency || 'BRL'
      });
    }
  }, [userProfile]);

  const fetchFamilyMembers = async () => {
    if (!userProfile?.familyId) return;

    const membersRef = collection(db, 'familyMembers');
    const q = query(membersRef, where('familyId', '==', userProfile.familyId));
    const snapshot = await getDocs(q);
    
    const members = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as FamilyMember[];

    setFamilyMembers(members);
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userProfile?.familyId) {
      // Create new family group if user doesn't have one
      const familyRef = await addDoc(collection(db, 'families'), {
        createdBy: userProfile?.uid,
        createdAt: new Date()
      });

      await updateUserProfile({
        familyId: familyRef.id,
        isHeadOfFamily: true
      });

      // Add current user as head of family
      await addDoc(collection(db, 'familyMembers'), {
        familyId: familyRef.id,
        userId: userProfile?.uid,
        name: userProfile?.name,
        email: userProfile?.email,
        role: 'head',
        joinedAt: new Date()
      });
    }

    // Create invitation
    await addDoc(collection(db, 'familyInvitations'), {
      familyId: userProfile?.familyId,
      email: inviteEmail,
      invitedBy: userProfile?.uid,
      status: 'pending',
      createdAt: new Date()
    });

    setInviteEmail('');
    setSuccess('Convite enviado com sucesso!');
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Tem certeza que deseja remover este membro da família?')) return;

    const memberRef = doc(db, 'familyMembers', memberId);
    await deleteDoc(memberRef);
    
    // Update user profile to remove family association
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('familyId', '==', userProfile?.familyId));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const userDoc = snapshot.docs[0];
      await updateDoc(doc(db, 'users', userDoc.id), {
        familyId: null,
        isHeadOfFamily: false
      });
    }

    fetchFamilyMembers();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'gender' ? 
        (value as '' | 'male' | 'female' | 'other') : 
        name === 'cpf' ? 
          value.replace(/\D/g, '')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1') : 
          name === 'currency' ? value :
          value
    }));
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (!formData.name || !formData.birthDate) {
        setError('Por favor, preencha todos os campos obrigatórios');
        return;
      }

      const updateData = {
        name: formData.name.trim(),
        birthDate: formData.birthDate,
        cpf: formData.cpf || undefined,
        gender: formData.gender || undefined,
        currency: formData.currency,
        updatedAt: new Date()
      };

      await updateUserProfile(updateData);
      
      // Forçar atualização do estado local
      if (userProfile) {
        setFormData({
          ...formData,
          name: updateData.name
        });
      }
      
      setSuccess('Perfil atualizado com sucesso!');
      setIsEditing(false);
    } catch (err) {
      console.error('Erro ao atualizar perfil:', err);
      setError('Erro ao atualizar perfil. Por favor, tente novamente.');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('As novas senhas não coincidem');
      return;
    }

    try {
      await updateUserPassword(passwordData.currentPassword, passwordData.newPassword);
      setSuccess('Senha atualizada com sucesso!');
      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      setError('Erro ao atualizar senha');
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Perfil do Usuário</h1>

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

      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <User className="h-6 w-6 text-blue-500 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Dados Pessoais</h2>
          </div>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="text-blue-600 hover:text-blue-800"
          >
            {isEditing ? 'Cancelar' : 'Editar'}
          </button>
        </div>

        {isEditing ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={userProfile?.email || ''}
                disabled
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-50 cursor-not-allowed"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">Nome</label>
              <input
                type="text"
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700">
                Data de Nascimento <span className="text-red-500">*</span>
              </label>
              <input
                id="birthDate"
                name="birthDate"
                type="date"
                required
                value={formData.birthDate}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="cpf" className="block text-sm font-medium text-gray-700">
                CPF
              </label>
              <input
                id="cpf"
                name="cpf"
                type="text"
                maxLength={14}
                value={formData.cpf}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700">
                Gênero
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">Selecione</option>
                <option value="male">Masculino</option>
                <option value="female">Feminino</option>
                <option value="other">Outro</option>
              </select>
            </div>

            <div>
              <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
                Moeda Padrão
              </label>
              <select
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="BRL">Real (R$)</option>
                <option value="USD">Dólar ($)</option>
                <option value="EUR">Euro (€)</option>
                <option value="GBP">Libra (£)</option>
              </select>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Salvar Alterações
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Nome</p>
              <p className="mt-1">{userProfile?.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="mt-1">{userProfile?.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Data de Nascimento</p>
              <p className="mt-1">{userProfile?.birthDate}</p>
            </div>
            {userProfile?.cpf && (
              <div>
                <p className="text-sm font-medium text-gray-500">CPF</p>
                <p className="mt-1">{userProfile.cpf}</p>
              </div>
            )}
            {userProfile?.gender && (
              <div>
                <p className="text-sm font-medium text-gray-500">Gênero</p>
                <p className="mt-1">
                  {userProfile.gender === 'male' ? 'Masculino' :
                   userProfile.gender === 'female' ? 'Feminino' :
                   userProfile.gender === 'other' ? 'Outro' : ''}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Lock className="h-6 w-6 text-blue-500 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Alterar Senha</h2>
          </div>
          <button
            onClick={() => setIsChangingPassword(!isChangingPassword)}
            className="text-blue-600 hover:text-blue-800"
          >
            {isChangingPassword ? 'Cancelar' : 'Alterar'}
          </button>
        </div>

        {isChangingPassword && (
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                Senha Atual
              </label>
              <input
                id="currentPassword"
                name="currentPassword"
                type="password"
                required
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                Nova Senha
              </label>
              <input
                id="newPassword"
                name="newPassword"
                type="password"
                required
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirmar Nova Senha
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Atualizar Senha
              </button>
            </div>
          </form>
        )}
      </div>

      <WalletManagement />
    </div>
  );
}

function WalletManagement() {
  const { user } = useAuth();
  const { wallets, sharedWallets, createWallet, updateWallet, deleteWallet, removeShare } = useWallet();
  const [error, setError] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [newWalletName, setNewWalletName] = useState('');
  const [editingWallet, setEditingWallet] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Filtrar carteiras próprias usando user.uid ao invés de userProfile?.uid
  const ownedWallets = wallets.filter(w => w.userId === user?.uid);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      if (!newWalletName.trim()) {
        setError('Por favor, insira um nome para a carteira');
        return;
      }

      await createWallet(newWalletName);
      setNewWalletName('');
      setIsCreating(false);
    } catch (error) {
      console.error('Erro ao criar carteira:', error);
      setError(error instanceof Error ? error.message : 'Erro ao criar carteira');
    }
  };

  const handleUpdate = async (id: string) => {
    setError('');
    
    try {
      await updateWallet(id, editingName);
      setEditingWallet(null);
      setEditingName('');
    } catch (error) {
      setError('Erro ao atualizar carteira');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja excluir esta carteira?')) return;
    
    setError('');
    try {
      await deleteWallet(id);
    } catch (error) {
      setError('Erro ao excluir carteira');
    }
  };

  const handleLeaveShare = async (walletId: string) => {
    if (!window.confirm('Tem certeza que deseja deixar de compartilhar esta carteira?')) return;
    
    try {
      await removeShare(walletId);
    } catch (error) {
      setError('Erro ao remover compartilhamento');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <Wallet className="h-6 w-6 mr-2 text-blue-500" />
        Gerenciar Carteiras
      </h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Minhas Carteiras</h3>
        <div className="space-y-4">
          {ownedWallets.map(wallet => (
            <div key={wallet.id} className="flex items-center justify-between p-3 border rounded-lg">
              {editingWallet === wallet.id ? (
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleUpdate(wallet.id);
                  }}
                  className="flex-1 flex items-center"
                >
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    className="flex-1 mr-2 px-2 py-1 border rounded"
                    placeholder="Nome da carteira"
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 mr-2"
                  >
                    Salvar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingWallet(null);
                      setEditingName('');
                    }}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                </form>
              ) : (
                <>
                  <div className="flex items-center">
                    <span className="font-medium">{wallet.name}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setEditingWallet(wallet.id);
                        setEditingName(wallet.name);
                      }}
                      className="p-1 text-gray-600 hover:text-blue-600"
                      title="Editar nome"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    {ownedWallets.length > 1 && (
                      <button
                        onClick={() => handleDelete(wallet.id)}
                        className="p-1 text-gray-600 hover:text-red-600"
                        title="Excluir carteira"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {ownedWallets.length < 3 && !isCreating ? (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full mt-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-blue-500 hover:text-blue-500 flex items-center justify-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Adicionar Carteira
          </button>
        ) : isCreating && (
          <form onSubmit={handleCreate} className="mt-4 flex items-center space-x-2">
            <input
              type="text"
              value={newWalletName}
              onChange={(e) => setNewWalletName(e.target.value)}
              className="flex-1 px-3 py-2 border rounded"
              placeholder="Nome da nova carteira"
              autoFocus
            />
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Criar
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCreating(false);
                setNewWalletName('');
              }}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Cancelar
            </button>
          </form>
        )}
      </div>

      {/* Carteiras Compartilhadas */}
      {sharedWallets.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Carteiras Compartilhadas Comigo</h3>
          <div className="space-y-4">
            {sharedWallets.map(wallet => (
              <div key={wallet.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                <div className="flex items-center">
                  <span className="font-medium">{wallet.name}</span>
                  <span className="ml-2 text-sm text-gray-500">
                    (Criada por: {wallet.userId})
                  </span>
                </div>
                <button
                  onClick={() => handleLeaveShare(wallet.id)}
                  className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                  title="Deixar de compartilhar"
                >
                  Sair
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
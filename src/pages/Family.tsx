import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Users, UserPlus, X } from 'lucide-react';
import { FamilyMember } from '../types/user';

export default function Family() {
  const { userProfile } = useAuth();
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (userProfile?.familyId) {
      fetchFamilyMembers();
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
    setError('');
    setSuccess('');

    try {
      if (!userProfile?.familyId) {
        // Criar novo grupo familiar se o usuário não tiver um
        const familyRef = await addDoc(collection(db, 'families'), {
          createdBy: userProfile?.id,
          createdAt: new Date()
        });

        // Adicionar usuário atual como administrador
        await addDoc(collection(db, 'familyMembers'), {
          familyId: familyRef.id,
          userId: userProfile?.id,
          name: userProfile?.name,
          email: userProfile?.email,
          role: 'head',
          joinedAt: new Date()
        });
      }

      // Criar convite
      await addDoc(collection(db, 'familyInvitations'), {
        familyId: userProfile?.familyId,
        email: inviteEmail,
        invitedBy: userProfile?.id,
        status: 'pending',
        createdAt: new Date()
      });

      setInviteEmail('');
      setSuccess('Convite enviado com sucesso!');
      setIsInviteModalOpen(false);
    } catch (err) {
      setError('Erro ao enviar convite. Tente novamente.');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Tem certeza que deseja remover este membro da família?')) return;

    try {
      const memberRef = doc(db, 'familyMembers', memberId);
      await deleteDoc(memberRef);
      fetchFamilyMembers();
      setSuccess('Membro removido com sucesso!');
    } catch (err) {
      setError('Erro ao remover membro. Tente novamente.');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center mb-8">
        <Users className="h-8 w-8 text-lime-500 mr-3" />
        <h1 className="text-3xl font-bold text-gray-900">Compartilhamento Familiar</h1>
      </div>
      <div className="flex justify-between items-center mb-8">
        <button
          onClick={() => setIsInviteModalOpen(true)}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <UserPlus className="h-5 w-5 mr-2" />
          Convidar Membro
        </button>
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

      {/* Lista de Membros */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Membros da Família</h2>
        
        {familyMembers.length > 0 ? (
          <div className="grid gap-4">
            {familyMembers.map(member => (
              <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{member.name}</p>
                  <p className="text-sm text-gray-500">{member.email}</p>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full mt-1 
                    ${member.role === 'head' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}
                  >
                    {member.role === 'head' ? 'Administrador' : 'Membro'}
                  </span>
                </div>
                {userProfile?.isHeadOfFamily && member.role !== 'head' && (
                  <button
                    onClick={() => handleRemoveMember(member.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhum membro da família adicionado</p>
            <p className="text-sm text-gray-400 mt-1">
              Convide membros da família para compartilhar as finanças
            </p>
          </div>
        )}
      </div>

      {/* Modal de Convite */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold mb-4">Convidar Membro da Família</h3>
            <form onSubmit={handleInviteMember} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email do membro
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="email@exemplo.com"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  Enviar Convite
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
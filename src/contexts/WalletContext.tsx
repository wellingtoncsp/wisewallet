import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { Timestamp } from 'firebase/firestore';

interface Wallet {
  id: string;
  name: string;
  userId: string;
  createdAt: Date;
}

interface WalletShare {
  id: string;
  walletId: string;
  sharedByUserId: string;
  sharedWithEmail: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Timestamp;
}

interface UserData {
  name: string;
  email: string;
}

interface WalletShareWithUser extends WalletShare {
  sharedByUser?: UserData;
}

interface WalletContextType {
  currentWallet: Wallet | null;
  wallets: Wallet[];
  setCurrentWallet: (wallet: Wallet) => void;
  isLoading: boolean;
  createWallet: (name: string) => Promise<Wallet>;
  updateWallet: (id: string, name: string) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
  shareWallet: (walletId: string, email: string) => Promise<void>;
  acceptShare: (shareId: string) => Promise<void>;
  rejectShare: (shareId: string) => Promise<void>;
  pendingShares: WalletShareWithUser[];
  sharedWallets: Wallet[];
  activeShares: WalletShareWithUser[];
  removeShare: (shareId: string) => Promise<void>;
  sentPendingShares: WalletShareWithUser[];
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [currentWallet, setCurrentWalletState] = useState<Wallet | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingShares, setPendingShares] = useState<WalletShareWithUser[]>([]);
  const [sharedWallets, setSharedWallets] = useState<Wallet[]>([]);
  const [activeShares, setActiveShares] = useState<WalletShareWithUser[]>([]);
  const [sentPendingShares, setSentPendingShares] = useState<WalletShareWithUser[]>([]);

  useEffect(() => {
    if (user) {
      fetchWallets();
      fetchSharedWallets();
      fetchActiveShares();
      fetchSentPendingShares();
    }
  }, [user]);

  const fetchWallets = async () => {
    if (!user) return;

    try {
      // Buscar carteiras próprias
      const walletsRef = collection(db, 'wallets');
      const q = query(walletsRef, where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      
      const ownedWallets = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate()
      })) as Wallet[];
      
      console.log('Carteiras próprias:', ownedWallets);

      // Buscar carteiras compartilhadas
      const sharesRef = collection(db, 'wallet_shares');
      const sharesQuery = query(
        sharesRef,
        where('sharedWithEmail', '==', user.email),
        where('status', '==', 'accepted')
      );
      
      const sharesSnapshot = await getDocs(sharesQuery);
      console.log('Compartilhamentos encontrados:', sharesSnapshot.docs.map(d => d.data()));
      
      const sharedWalletIds = sharesSnapshot.docs.map(doc => doc.data().walletId);
      console.log('IDs das carteiras compartilhadas:', sharedWalletIds);

      // Buscar detalhes das carteiras compartilhadas
      const sharedWallets = await Promise.all(
        sharedWalletIds.map(async (id) => {
          const walletDoc = await getDoc(doc(db, 'wallets', id));
          return { id: walletDoc.id, ...walletDoc.data() };
        })
      );
      
      console.log('Detalhes das carteiras compartilhadas:', sharedWallets);

      // Combinar carteiras próprias e compartilhadas
      const allWallets = [...ownedWallets, ...sharedWallets];
      console.log('Todas as carteiras combinadas:', allWallets);
      setWallets(allWallets as Wallet[]);
      setSharedWallets(sharedWallets as Wallet[]); // Garantir que sharedWallets está sendo atualizado

      // Se não houver carteiras próprias, criar uma padrão
      if (ownedWallets.length === 0) {
        const defaultWallet = await createWallet('Carteira Principal');
        allWallets.push(defaultWallet);
      }

      // Selecionar a primeira carteira como atual se nenhuma estiver selecionada
      if (!currentWallet && allWallets.length > 0) {
        setCurrentWalletState(allWallets[0]);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Erro ao buscar carteiras:', error);
      setIsLoading(false);
    }
  };

  const fetchSharedWallets = async () => {
    if (!user) return;

    // Buscar compartilhamentos aceitos
    const sharesRef = collection(db, 'wallet_shares');
    const q = query(
      sharesRef,
      where('sharedWithEmail', '==', user.email),
      where('status', '==', 'accepted')
    );
    
    const snapshot = await getDocs(q);
    const shares = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as WalletShare[];

    // Buscar as carteiras compartilhadas
    const walletIds = shares.map(share => share.walletId);
    const walletsData = await Promise.all(
      walletIds.map(async (id) => {
        const walletDoc = await getDoc(doc(db, 'wallets', id));
        return { id: walletDoc.id, ...walletDoc.data() };
      })
    );

    setSharedWallets(walletsData as Wallet[]);

    // Buscar compartilhamentos pendentes com dados do usuário
    const pendingQ = query(
      sharesRef,
      where('sharedWithEmail', '==', user.email),
      where('status', '==', 'pending')
    );
    
    const pendingSnapshot = await getDocs(pendingQ);
    const pendingSharesPromises = pendingSnapshot.docs.map(async doc => {
      const shareData = doc.data();
      const userData = await fetchUserData(shareData.sharedByUserId);
      return {
        id: doc.id,
        ...shareData,
        sharedByUser: userData
      };
    });

    const pendingShares = await Promise.all(pendingSharesPromises);
    setPendingShares(pendingShares as WalletShareWithUser[]);
  };

  const fetchUserData = async (userId: string): Promise<UserData | null> => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('uid', '==', userId));
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const userData = snapshot.docs[0].data();
      return {
        name: userData.name,
        email: userData.email
      };
    }
    return null;
  };

  const fetchActiveShares = async () => {
    if (!user) return;

    const sharesRef = collection(db, 'wallet_shares');
    const q = query(
      sharesRef,
      where('sharedByUserId', '==', user.uid),
      where('status', '==', 'accepted')
    );
    
    const snapshot = await getDocs(q);
    const shares = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const shareData = doc.data();
        const userData = await fetchUserData(shareData.sharedByUserId);
        return {
          id: doc.id,
          ...shareData,
          sharedByUser: userData
        };
      })
    ) as WalletShareWithUser[];

    setActiveShares(shares);
  };

  const fetchSentPendingShares = async () => {
    if (!user) return;

    const sharesRef = collection(db, 'wallet_shares');
    const q = query(
      sharesRef,
      where('sharedByUserId', '==', user.uid),
      where('status', '==', 'pending')
    );
    
    const snapshot = await getDocs(q);
    const shares = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const shareData = doc.data();
        const userData = await fetchUserData(shareData.sharedByUserId);
        return {
          id: doc.id,
          ...shareData,
          sharedByUser: userData
        };
      })
    ) as WalletShareWithUser[];

    setSentPendingShares(shares);
  };

  const createWallet = async (name: string) => {
    if (!user) return;

    // Contar carteiras próprias e compartilhadas
    const ownedWalletsCount = wallets.filter(w => w.userId === user.uid).length;
    const sharedWalletsCount = sharedWallets.length;
    const totalWallets = ownedWalletsCount + sharedWalletsCount;

    if (totalWallets >= 3) {
      throw new Error('Limite máximo de 3 carteiras atingido (incluindo compartilhadas)');
    }

    const newWallet = {
      name,
      userId: user.uid,
      createdAt: new Date()
    };

    const docRef = await addDoc(collection(db, 'wallets'), newWallet);
    const wallet = { id: docRef.id, ...newWallet };
    
    setWallets(prev => [...prev, wallet]);
    if (!currentWallet) {
      setCurrentWalletState(wallet);
    }

    return wallet;
  };

  const updateWallet = async (id: string, name: string) => {
    if (!user) return;

    try {
      const walletRef = doc(db, 'wallets', id);
      await updateDoc(walletRef, { name });
      
      // Atualizar estado local
      setWallets(prev => prev.map(wallet => 
        wallet.id === id ? { ...wallet, name } : wallet
      ));
    } catch (error) {
      console.error('Erro ao atualizar carteira:', error);
      throw error;
    }
  };

  const deleteWallet = async (id: string) => {
    if (!user || wallets.length <= 1) {
      throw new Error('Não é possível excluir a única carteira');
    }

    try {
      await deleteDoc(doc(db, 'wallets', id));
      
      // Atualizar estado local
      const updatedWallets = wallets.filter(w => w.id !== id);
      setWallets(updatedWallets);

      // Se a carteira excluída era a atual, selecionar outra
      if (currentWallet?.id === id) {
        setCurrentWalletState(updatedWallets[0]);
      }
    } catch (error) {
      console.error('Erro ao excluir carteira:', error);
      throw error;
    }
  };

  const setCurrentWallet = (wallet: Wallet) => {
    setCurrentWalletState(wallet);
    // Disparar um evento customizado para notificar a mudança de carteira
    window.dispatchEvent(new CustomEvent('walletChanged', { detail: wallet }));
  };

  const shareWallet = async (walletId: string, email: string) => {
    if (!user) return;

    // Verificar se o email existe
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', email));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      throw new Error('Usuário não encontrado');
    }

    // Verificar se já não está compartilhado
    const sharesRef = collection(db, 'wallet_shares');
    const shareQ = query(
      sharesRef,
      where('walletId', '==', walletId),
      where('sharedWithEmail', '==', email)
    );
    const shareSnapshot = await getDocs(shareQ);

    if (!shareSnapshot.empty) {
      throw new Error('Carteira já compartilhada com este usuário');
    }

    // Criar o compartilhamento
    await addDoc(collection(db, 'wallet_shares'), {
      walletId,
      sharedByUserId: user.uid,
      sharedWithEmail: email,
      status: 'pending',
      createdAt: Timestamp.now()
    });
  };

  const acceptShare = async (shareId: string) => {
    if (!user) return;

    const shareRef = doc(db, 'wallet_shares', shareId);
    await updateDoc(shareRef, {
      status: 'accepted'
    });

    fetchSharedWallets();
  };

  const rejectShare = async (shareId: string) => {
    if (!user) return;

    const shareRef = doc(db, 'wallet_shares', shareId);
    await updateDoc(shareRef, {
      status: 'rejected'
    });

    setPendingShares(prev => prev.filter(share => share.id !== shareId));
  };

  const removeShare = async (shareId: string) => {
    if (!user) return;

    const shareRef = doc(db, 'wallet_shares', shareId);
    await deleteDoc(shareRef);
    await fetchActiveShares();
  };

  return (
    <WalletContext.Provider 
      value={{ 
        currentWallet, 
        wallets, 
        setCurrentWallet,
        isLoading,
        createWallet,
        updateWallet,
        deleteWallet,
        shareWallet,
        acceptShare,
        rejectShare,
        pendingShares,
        sharedWallets,
        activeShares,
        removeShare,
        sentPendingShares,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
} 
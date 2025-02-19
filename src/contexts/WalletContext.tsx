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
  shared?: boolean;
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
  wallets: Wallet[];
  sharedWallets: Wallet[];
  currentWallet: Wallet | null;
  setCurrentWallet: (walletId: string) => void;
  isSharedWallet: (walletId: string) => boolean;
  pendingShares: WalletShareWithUser[];
  activeShares: WalletShareWithUser[];
  sentPendingShares: WalletShareWithUser[];
  shareWallet: (walletId: string, email: string) => Promise<void>;
  acceptShare: (shareId: string) => Promise<void>;
  rejectShare: (shareId: string) => Promise<void>;
  removeShare: (shareId: string) => Promise<void>;
  createWallet: (name: string) => Promise<void>;
  updateWallet: (id: string, name: string) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [sharedWallets, setSharedWallets] = useState<Wallet[]>([]);
  const [currentWallet, setCurrentWallet] = useState<Wallet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingShares, setPendingShares] = useState<WalletShareWithUser[]>([]);
  const [activeShares, setActiveShares] = useState<WalletShareWithUser[]>([]);
  const [sentPendingShares, setSentPendingShares] = useState<WalletShareWithUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWallets();
      fetchSharedWallets();
      fetchActiveShares();
      fetchSentPendingShares();
      fetchPendingShares();
      
      // Recuperar carteira selecionada do localStorage
      const savedWalletId = localStorage.getItem('currentWalletId');
      if (savedWalletId) {
        const allWallets = [...wallets, ...sharedWallets];
        const savedWallet = allWallets.find(w => w.id === savedWalletId);
        if (savedWallet) {
          setCurrentWallet(savedWallet);
        }
      }
    }
    setLoading(false);
  }, [user]);

  const fetchWallets = async () => {
    if (!user) return;
    setIsLoading(true);

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

      setWallets(ownedWallets);
      
      // Se não houver carteiras, criar uma padrão
      if (ownedWallets.length === 0) {
        const defaultWallet = await createWallet('Carteira Principal');
        setWallets([defaultWallet]);
        setCurrentWallet(defaultWallet);
      } else if (!currentWallet) {
        setCurrentWallet(ownedWallets[0]);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Erro ao buscar carteiras:', error);
      setIsLoading(false);
    }
  };

  const fetchSharedWallets = async () => {
    if (!user) return;

    try {
      const sharesRef = collection(db, 'wallet_shares');
      const q = query(
        sharesRef,
        where('sharedWithEmail', '==', user.email),
        where('status', '==', 'accepted')
      );
      
      const snapshot = await getDocs(q);
      const shares = snapshot.docs.map(doc => doc.data());

      // Buscar as carteiras compartilhadas
      const walletIds = shares.map(share => share.walletId);
      const walletsData = await Promise.all(
        walletIds.map(async (id) => {
          const walletDoc = await getDoc(doc(db, 'wallets', id));
          const data = walletDoc.data();
          return {
            id: walletDoc.id,
            name: data?.name,
            userId: data?.userId,
            createdAt: data?.createdAt.toDate(),
            shared: true
          } as Wallet;
        })
      );

      setSharedWallets(walletsData);
    } catch (error) {
      console.error('Error fetching shared wallets:', error);
    }
  };

  const fetchUserData = async (userId: string): Promise<UserData | null> => {
    try {
      // Buscar diretamente pelo documento do usuário
      const userDoc = await getDoc(doc(db, 'users', userId));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return {
          name: userData.name,
          email: userData.email
        };
      }
      
      console.log('Usuário não encontrado:', userId);
      return null;
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      return null;
    }
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

  const fetchPendingShares = async () => {
    if (!user?.email) return;

    try {
      const sharesRef = collection(db, 'wallet_shares');
      const q = query(
        sharesRef,
        where('sharedWithEmail', '==', user.email),
        where('status', '==', 'pending')
      );
      
      const snapshot = await getDocs(q);
      const shares = await Promise.all(
        snapshot.docs.map(async (doc) => {
          const shareData = doc.data();
          const userData = await fetchUserData(shareData.sharedByUserId);
          
          if (!userData) {
            console.warn('Dados do usuário não encontrados para:', shareData.sharedByUserId);
          }

          return {
            id: doc.id,
            ...shareData,
            sharedByUser: userData || {
              name: 'Usuário Desconhecido',
              email: 'email não encontrado'
            }
          };
        })
      ) as WalletShareWithUser[];

      console.log('Convites pendentes encontrados:', shares);
      setPendingShares(shares);
    } catch (error) {
      console.error('Erro ao buscar convites pendentes:', error);
    }
  };

  const createWallet = async (name: string) => {
    if (!user) return;
    
    try {
      const walletRef = await addDoc(collection(db, 'wallets'), {
        name,
        userId: user.uid,
        createdAt: new Date()
      });

      const newWallet = {
        id: walletRef.id,
        name,
        userId: user.uid,
        createdAt: new Date()
      };

      setWallets(prev => [...prev, newWallet]);
      return newWallet;
    } catch (error) {
      console.error('Erro ao criar carteira:', error);
      throw error;
    }
  };

  const updateWallet = async (id: string, name: string) => {
    if (!user) return;
    
    const walletRef = doc(db, 'wallets', id);
    await updateDoc(walletRef, { name });
    
    setWallets(prev => prev.map(wallet => 
      wallet.id === id ? { ...wallet, name } : wallet
    ));
  };

  const deleteWallet = async (id: string) => {
    if (!user) return;
    
    const walletRef = doc(db, 'wallets', id);
    await deleteDoc(walletRef);
    
    setWallets(prev => prev.filter(wallet => wallet.id !== id));
    if (currentWallet?.id === id) {
      setCurrentWallet(null);
    }
  };

  const handleSwitchWallet = (walletId: string) => {
    const wallet = [...wallets, ...sharedWallets].find(w => w.id === walletId);
    if (wallet) {
      setCurrentWallet(wallet);
      localStorage.setItem('currentWalletId', wallet.id);
    }
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
    try {
      const shareRef = doc(db, 'wallet_shares', shareId);
      const shareDoc = await getDoc(shareRef);
      
      if (!shareDoc.exists()) {
        throw new Error('Compartilhamento não encontrado');
      }

      await updateDoc(shareRef, {
        status: 'accepted'
      });

      // Atualizar estado local
      setPendingShares(prev => prev.filter(share => share.id !== shareId));
      
      // Recarregar carteiras
      await fetchWallets();
    } catch (error) {
      console.error('Erro ao aceitar compartilhamento:', error);
      throw error;
    }
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

  // Função para verificar se uma carteira é compartilhada
  const isSharedWallet = (walletId: string) => {
    return sharedWallets.some(wallet => wallet.id === walletId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <WalletContext.Provider value={{
      wallets,
      sharedWallets,
      currentWallet,
      setCurrentWallet: handleSwitchWallet,
      isSharedWallet: (walletId: string) => sharedWallets.some(w => w.id === walletId),
      pendingShares,
      activeShares,
      sentPendingShares,
      shareWallet,
      acceptShare,
      rejectShare,
      removeShare,
      createWallet,
      updateWallet,
      deleteWallet
    }}>
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

function WalletSelector() {
  const { wallets, sharedWallets, currentWallet, setCurrentWallet } = useWallet();
  
  const handleWalletChange = (walletId: string) => {
    const allWallets = [...wallets, ...sharedWallets];
    const selectedWallet = allWallets.find(w => w.id === walletId);
    if (selectedWallet) {
      setCurrentWallet(selectedWallet.id);
    }
  };

  return (
    <select
      value={currentWallet?.id || ''}
      onChange={(e) => handleWalletChange(e.target.value)}
      className="..."
    >
      <optgroup label="Minhas Carteiras">
        {wallets.map(wallet => (
          <option key={wallet.id} value={wallet.id}>
            {wallet.name}
          </option>
        ))}
      </optgroup>
      
      {sharedWallets.length > 0 && (
        <optgroup label="Carteiras Compartilhadas">
          {sharedWallets.map(wallet => (
            <option key={wallet.id} value={wallet.id}>
              {wallet.name}
            </option>
          ))}
        </optgroup>
      )}
    </select>
  );
} 
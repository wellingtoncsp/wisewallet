import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';

interface Wallet {
  id: string;
  name: string;
  userId: string;
  createdAt: Date;
}

interface WalletContextType {
  currentWallet: Wallet | null;
  wallets: Wallet[];
  setCurrentWallet: (wallet: Wallet) => void;
  isLoading: boolean;
  createWallet: (name: string) => Promise<Wallet>;
  updateWallet: (id: string, name: string) => Promise<void>;
  deleteWallet: (id: string) => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [currentWallet, setCurrentWalletState] = useState<Wallet | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWallets();
    }
  }, [user]);

  const fetchWallets = async () => {
    if (!user) return;

    try {
      const walletsRef = collection(db, 'wallets');
      const q = query(walletsRef, where('userId', '==', user.uid));
      const querySnapshot = await getDocs(q);
      
      const fetchedWallets = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate()
      })) as Wallet[];

      setWallets(fetchedWallets);

      // Se não houver carteiras, criar uma padrão
      if (fetchedWallets.length === 0) {
        const defaultWallet = await createWallet('Carteira Principal');
        fetchedWallets.push(defaultWallet);
      }

      // Selecionar a primeira carteira como atual se nenhuma estiver selecionada
      if (!currentWallet && fetchedWallets.length > 0) {
        setCurrentWalletState(fetchedWallets[0]);
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Erro ao buscar carteiras:', error);
      setIsLoading(false);
    }
  };

  const createWallet = async (name: string) => {
    if (!user) return;

    if (wallets.length >= 3) {
      throw new Error('Limite máximo de 3 carteiras atingido');
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

  return (
    <WalletContext.Provider 
      value={{ 
        currentWallet, 
        wallets, 
        setCurrentWallet,
        isLoading,
        createWallet,
        updateWallet,
        deleteWallet
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
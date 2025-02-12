import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

type CurrencyType = 'BRL' | 'USD' | 'EUR' | 'GBP';

interface CurrencyContextType {
  currency: CurrencyType;
  setCurrency: (currency: CurrencyType) => Promise<void>;
  currencySymbol: string;
}

const CurrencyContext = createContext<CurrencyContextType>({} as CurrencyContextType);

export const useCurrency = () => useContext(CurrencyContext);

const CURRENCY_SYMBOLS: Record<CurrencyType, string> = {
  BRL: 'R$',
  USD: 'US$',
  EUR: '€',
  GBP: '£'
};

export const CurrencyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currency, setCurrencyState] = useState<CurrencyType>('BRL');

  useEffect(() => {
    if (user) {
      const fetchUserCurrency = async () => {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setCurrencyState(userDoc.data().currency || 'BRL');
        }
      };
      fetchUserCurrency();
    }
  }, [user]);

  const setCurrency = async (newCurrency: CurrencyType) => {
    if (user) {
      await updateDoc(doc(db, 'users', user.uid), { currency: newCurrency });
      setCurrencyState(newCurrency);
    }
  };

  return (
    <CurrencyContext.Provider value={{
      currency,
      setCurrency,
      currencySymbol: CURRENCY_SYMBOLS[currency]
    }}>
      {children}
    </CurrencyContext.Provider>
  );
}; 
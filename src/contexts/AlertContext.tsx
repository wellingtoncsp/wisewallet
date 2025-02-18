import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, doc, orderBy, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { useWallet } from './WalletContext';
import { Alert, AlertType } from '../types/alert';
import { Toast } from '../components/Toast';
import { getCategoryLabel } from '../utils/categories';

interface AlertContextType {
  alerts: Alert[];
  unreadCount: number;
  markAsRead: (alertId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  createAlert: (type: AlertType, data: any, walletId: string) => Promise<void>;
}

const AlertContext = createContext<AlertContextType>({} as AlertContextType);

export const useAlerts = () => useContext(AlertContext);

interface Toast {
  title: string;
  message: string;
  icon?: string;
}

const getAlertMessage = (type: AlertType, data: any): { title: string; message: string; icon: string } => {
  switch (type) {
    case 'share_invite':
      return {
        title: '🤝 Nova Parceria Financeira!',
        message: `${data.senderName} quer compartilhar uma carteira com você! Que tal juntar forças? 💪`,
        icon: '🤝'
      };

    case 'saving_tip':
      return {
        title: '💡 Dica Esperta!',
        message: `${data.message} #FicaADica ✨`,
        icon: '💡'
      };

    case 'budget_warning':
      return {
        title: '⚠️ Atenção ao Orçamento!',
        message: `Ei! Você já usou ${data.percentage}% do orçamento de ${getCategoryLabel(data.category)}. Bora segurar a onda? 🌊`,
        icon: '⚠️'
      };

    case 'budget_exceeded':
      return {
        title: '🚨 Orçamento Estourado!',
        message: `Ops! O orçamento de ${getCategoryLabel(data.category)} passou do limite. Mas relaxa, amanhã é um novo dia pra recomeçar! 🌅`,
        icon: '🚨'
      };

    case 'goal_milestone':
      return {
        title: '🎯 Meta Parcial Alcançada!',
        message: `Uhul! Você já conquistou ${data.percentage}% da sua meta "${data.goalName}"! Tá voando! 🚀`,
        icon: '🎯'
      };

    case 'goal_achieved':
      return {
        title: '🏆 Meta Conquistada!',
        message: `PARABÉNS! Você alcançou sua meta "${data.goalName}"! Você é incrível! 🎉`,
        icon: '🏆'
      };

    case 'spending_pattern':
      return {
        title: '🔍 Gastos Identificados',
        message: `Notei que você tem gastado bastante com ${data.category}. Que tal dar uma conferida? 👀`,
        icon: '🔍'
      };

    case 'saving_streak':
      return {
        title: '🔥 Sequência Incrível!',
        message: `${data.days} dias economizando! Você tá on fire! Continue assim! 🎯`,
        icon: '🔥'
      };

    case 'transaction_large':
      return {
        title: '💰 Movimento Importante',
        message: `Uau! Uma ${data.type === 'income' ? 'receita' : 'despesa'} de ${data.amount} foi registrada. Quer categorizar? 📝`,
        icon: '💰'
      };

    case 'monthly_summary':
      return {
        title: '📊 Resumo do Mês',
        message: `Você economizou ${data.savedAmount} este mês! ${data.comparison > 0 ? 'Melhor que mês passado! 🚀' : 'Vamos melhorar mês que vem? 💪'}`,
        icon: '📊'
      };

    default:
      return {
        title: 'Notificação',
        message: 'Nova atualização disponível',
        icon: '📢'
      };
  }
};

export const AlertProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [toast, setToast] = useState<Toast | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchAlerts = async (walletId: string) => {
    if (!user) return;

    const alertsRef = collection(db, 'alerts');
    const q = query(
      alertsRef,
      where('walletId', '==', walletId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(q);
    const fetchedAlerts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate()
    })) as Alert[];

    setAlerts(fetchedAlerts);
    setUnreadCount(fetchedAlerts.filter(alert => !alert.read).length);
  };

  // Função para gerar um hash único para cada notificação
  const generateAlertHash = (type: AlertType, data: any): string => {
    const relevantData = {
      type,
      ...data,
      date: new Date().toDateString() // Inclui a data para permitir notificações iguais em dias diferentes
    };
    return JSON.stringify(relevantData);
  };

  // Verifica se uma notificação similar já existe nas últimas 24 horas
  const isDuplicateAlert = async (type: AlertType, data: any): Promise<boolean> => {
    if (!user) return true;

    const alertHash = generateAlertHash(type, data);
    const alertsRef = collection(db, 'alerts');
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const q = query(
      alertsRef,
      where('userId', '==', user.uid),
      where('createdAt', '>=', oneDayAgo)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.some(doc => doc.data().alertHash === alertHash);
  };

  const createAlert = async (type: AlertType, data: any, walletId: string) => {
    if (!user) return;

    try {
      if (await isDuplicateAlert(type, data)) {
        return;
      }

      const { title, message, icon } = getAlertMessage(type, data);
      const alertHash = generateAlertHash(type, data);

      const newAlert = {
        type,
        title,
        message,
        icon,
        createdAt: new Date(),
        read: false,
        userId: user.uid,
        walletId,
        data,
        alertHash
      };

      await addDoc(collection(db, 'alerts'), newAlert);
      fetchAlerts(walletId);
      
      // Mostrar toast
      setToast(newAlert);
    } catch (error) {
      console.error('Erro ao criar alerta:', error);
    }
  };

  const markAsRead = async (alertId: string) => {
    if (!alerts.length) return;
    const alertRef = doc(db, 'alerts', alertId);
    await updateDoc(alertRef, { read: true });
    fetchAlerts(alerts[0].walletId);
  };

  const markAllAsRead = async () => {
    if (!alerts.length) return;
    const unreadAlerts = alerts.filter(alert => !alert.read);
    await Promise.all(
      unreadAlerts.map(alert => 
        updateDoc(doc(db, 'alerts', alert.id), { read: true })
      )
    );
    fetchAlerts(alerts[0].walletId);
  };

  useEffect(() => {
    if (user && alerts.length > 0) {
      fetchAlerts(alerts[0].walletId);
    }
  }, [user]);

  return (
    <AlertContext.Provider value={{
      alerts,
      unreadCount,
      markAsRead,
      markAllAsRead,
      createAlert
    }}>
      {children}
      {toast && (
        <Toast
          title={toast.title}
          message={toast.message}
          icon={toast.icon}
          onClose={() => setToast(null)}
        />
      )}
    </AlertContext.Provider>
  );
}; 
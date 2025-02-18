import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Lightbulb as LightBulb, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { transactionCategories, getCategoryLabel } from '../utils/categories';
import { useWallet } from '../contexts/WalletContext';
import { useAlerts } from '../contexts/AlertContext';
import { useFormatCurrency } from '../utils/formatCurrency';

interface Transaction {
  amount: number;
  type: 'income' | 'expense';
  category: string;
  date: Date;
}

interface CategoryAnalysis {
  category: string;
  currentAmount: number;
  previousAmount: number;
  percentageChange: number;
  hasBudget: boolean;
}

export default function Suggestions() {
  const { user } = useAuth();
  const { currentWallet } = useWallet();
  const [categoryAnalysis, setCategoryAnalysis] = useState<CategoryAnalysis[]>([]);
  const [loading, setLoading] = useState(true);
  const { createAlert } = useAlerts();
  const formatCurrency = useFormatCurrency();

  useEffect(() => {
    if (user && currentWallet) {
      analyzeCategoryTrends();
    }
  }, [user, currentWallet]);

  useEffect(() => {
    const generateSavingTips = async () => {
      if (!currentWallet) return;

      const tips = [
        "Que tal criar um cofrinho virtual? Arredonde suas despesas e guarde a diferença! 🐷",
        "Já pensou em fazer um 'No Spend Day' por semana? Escolha um dia para não gastar nada! 💪",
        "Anote TODOS os seus gastos por uma semana. Você vai se surpreender! 📝",
        "Compare preços online antes de comprar. Pode economizar muito! 🔍",
        "Planeje suas refeições da semana. Evita desperdício e economiza! 🥗"
      ];

      const randomTip = tips[Math.floor(Math.random() * tips.length)];
      
      await createAlert('saving_tip', {
        message: randomTip,
        tipId: Date.now()
      }, currentWallet.id);
    };

    const lastTipTime = localStorage.getItem('lastTipTime');
    const now = Date.now();
    
    if (!lastTipTime || now - Number(lastTipTime) >= 24 * 60 * 60 * 1000) {
      generateSavingTips();
      localStorage.setItem('lastTipTime', now.toString());
    }
  }, []);

  const analyzeCategoryTrends = async () => {
    if (!user || !currentWallet) return;

    const currentDate = new Date();
    const currentMonth = {
      start: startOfMonth(currentDate),
      end: endOfMonth(currentDate)
    };
    const previousMonth = {
      start: startOfMonth(subMonths(currentDate, 1)),
      end: endOfMonth(subMonths(currentDate, 1))
    };

    // Buscar transações
    const transactionsRef = collection(db, 'transactions');
    const q = query(
      transactionsRef,
      where('userId', '==', user.uid),
      where('walletId', '==', currentWallet.id)
    );
    
    const querySnapshot = await getDocs(q);
    const transactions = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      date: doc.data().date.toDate()
    })) as Transaction[];

    // Buscar orçamentos
    const budgetsRef = collection(db, 'budgets');
    const budgetsQuery = query(
      budgetsRef,
      where('userId', '==', user.uid),
      where('month', '==', format(currentDate, 'yyyy-MM'))
    );
    const budgetsSnapshot = await getDocs(budgetsQuery);
    const budgets = budgetsSnapshot.docs.map(doc => doc.data());

    // Analisar gastos por categoria
    const analysis: CategoryAnalysis[] = [];

    transactionCategories.forEach(category => {
      const currentMonthTransactions = transactions.filter(t => 
        t.category === category.id &&
        t.date >= currentMonth.start &&
        t.date <= currentMonth.end
      );

      const previousMonthTransactions = transactions.filter(t =>
        t.category === category.id &&
        t.date >= previousMonth.start &&
        t.date <= previousMonth.end
      );

      const currentAmount = currentMonthTransactions.reduce((sum, t) => sum + t.amount, 0);
      const previousAmount = previousMonthTransactions.reduce((sum, t) => sum + t.amount, 0);

      if (currentAmount > 0 || previousAmount > 0) {
        const percentageChange = previousAmount === 0
          ? 100
          : ((currentAmount - previousAmount) / previousAmount) * 100;

        analysis.push({
          category: category.id,
          currentAmount,
          previousAmount,
          percentageChange,
          hasBudget: budgets.some(b => b.category === category.id)
        });
      }
    });

    // Ordenar por maior variação percentual
    analysis.sort((a, b) => Math.abs(b.percentageChange) - Math.abs(a.percentageChange));
    
    setCategoryAnalysis(analysis);
    setLoading(false);
  };

  const getSuggestion = (analysis: CategoryAnalysis) => {
    const category = transactionCategories.find(cat => cat.id === analysis.category)?.label;
    
    if (analysis.percentageChange > 20) {
      return {
        icon: <TrendingUp className="h-6 w-6 text-red-500" />,
        message: `Seus gastos com ${category} aumentaram ${analysis.percentageChange.toFixed(0)}% em relação ao mês anterior. ${
          !analysis.hasBudget 
            ? 'Que tal definir um limite mensal para esta categoria?' 
            : 'Considere revisar seu limite mensal.'
        }`
      };
    } else if (analysis.percentageChange < -20) {
      return {
        icon: <TrendingDown className="h-6 w-6 text-green-500" />,
        message: `Ótimo trabalho! Você reduziu seus gastos com ${category} em ${Math.abs(analysis.percentageChange).toFixed(0)}% em relação ao mês anterior.`
      };
    } else if (!analysis.hasBudget && analysis.currentAmount > 0) {
      return {
        icon: <AlertTriangle className="h-6 w-6 text-yellow-500" />,
        message: `Você ainda não tem um orçamento definido para ${category}. Definir um limite pode ajudar a controlar estes gastos.`
      };
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center mb-8">
        <LightBulb className="h-8 w-8 text-yellow-500 mr-3" />
        <h1 className="text-3xl font-bold text-gray-900">Sugestões de Economia</h1>
      </div>

      <div className="space-y-6">
        {categoryAnalysis.map(analysis => {
          const suggestion = getSuggestion({
            ...analysis,
            category: getCategoryLabel(analysis.category)
          });
          if (!suggestion) return null;

          return (
            <div key={analysis.category} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 mr-4">
                  {suggestion.icon}
                </div>
                <div className="flex-1">
                  <p className="text-gray-800">{suggestion.message}</p>
                  <div className="mt-2 text-sm text-gray-500">
                    <p>Gasto atual: {formatCurrency(analysis.currentAmount)}</p>
                    <p>Gasto anterior: {formatCurrency(analysis.previousAmount)}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {categoryAnalysis.length === 0 && (
          <div className="text-center py-12">
            <LightBulb className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">Nenhuma sugestão disponível no momento</p>
            <p className="text-sm text-gray-400 mt-1">
              Continue registrando suas transações para receber sugestões personalizadas
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
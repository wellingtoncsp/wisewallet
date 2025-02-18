import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { useAlerts } from '../contexts/AlertContext';
import { Plus, Pencil, Trash2, AlertTriangle, PiggyBank } from 'lucide-react';
import { format, parseISO, startOfDay, endOfDay, lastDayOfMonth, startOfMonth } from 'date-fns';
import { transactionCategories, getCategoryLabel } from '../utils/categories';
import { ptBR } from 'date-fns/locale';
import { useFormatCurrency } from '../utils/formatCurrency';
import { CurrencyInput } from '../components/CurrencyInput';

interface Budget {
  id: string;
  category: string;
  limit: number;
  userId: string;
  walletId: string;
}

interface BudgetSummary {
  category: string;
  currentSpent: number;
  limit: number;
  percentage: number;
  status: 'success' | 'warning' | 'danger';
  message: string;
}

interface Transaction {
  amount: number;
  category: string;
  date: Date;
  type: 'income' | 'expense';
}

export default function Budget() {
  const { user } = useAuth();
  const { currentWallet, isSharedWallet } = useWallet();
  const { createAlert } = useAlerts();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [formData, setFormData] = useState({
    category: '',
    limit: ''
  });
  const formatCurrency = useFormatCurrency();

  useEffect(() => {
    if (user && currentWallet) {
      Promise.all([
        fetchBudgets(),
        fetchTransactions()
      ]);
    }
  }, [user, currentWallet]);

  const checkAllBudgets = async () => {
    if (!currentWallet) return;

    budgets.forEach(async (budget) => {
      const spent = transactions
        .filter(t => t.category === budget.category)
        .reduce((sum, t) => sum + t.amount, 0);
      
      const percentage = (spent / budget.limit) * 100;

      if (percentage >= 80 && percentage < 100) {
        await createAlert('budget_warning', {
          category: budget.category,
          percentage: Math.round(percentage),
        }, currentWallet.id);
      }
      
      if (percentage >= 100) {
        await createAlert('budget_exceeded', {
          category: budget.category,
          percentage: Math.round(percentage),
          budgetId: budget.id,
          month: new Date().toISOString().slice(0, 7)
        }, currentWallet.id);
      }
    });
  };

  useEffect(() => {
    if (budgets.length > 0 && transactions.length > 0) {
      checkAllBudgets();
    }
  }, [transactions]);

  const fetchBudgets = async () => {
    if (!user || !currentWallet) return;
    
    const budgetsRef = collection(db, 'budgets');
    const q = query(
      budgetsRef, 
      where('walletId', '==', currentWallet.id)
    );

    const snapshot = await getDocs(q);
    
    setBudgets(snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Budget[]);
  };

  const fetchTransactions = async () => {
    if (!user) return;

    const now = new Date();
    const monthStart = startOfMonth(now);
    const endOfMonth = endOfDay(lastDayOfMonth(now));

    const transactionsRef = collection(db, 'transactions');
    const q = query(
      transactionsRef,
      where('userId', '==', user.uid),
      where('date', '>=', monthStart),
      where('date', '<=', endOfMonth),
      where('type', '==', 'expense')
    );
    
    const snapshot = await getDocs(q);
    setTransactions(snapshot.docs.map(doc => ({
      ...doc.data(),
      date: doc.data().date.toDate()
    })) as Transaction[]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !currentWallet) return;
    
    const budget = {
      category: formData.category,
      limit: Number(formData.limit.replace(/\D/g, '')) / 100,
      userId: user.uid,
      walletId: currentWallet.id
    };

    if (editingBudget) {
      const budgetRef = doc(db, 'budgets', editingBudget.id);
      await updateDoc(budgetRef, budget);
    } else {
      await addDoc(collection(db, 'budgets'), budget);
    }

    setIsModalOpen(false);
    setEditingBudget(null);
    resetForm();
    fetchBudgets();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este orçamento?')) return;

    const budgetRef = doc(db, 'budgets', id);
    await deleteDoc(budgetRef);
    fetchBudgets();
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setFormData({
      category: budget.category,
      limit: formatCurrencyInput(budget.limit),
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      category: '',
      limit: '',
    });
  };

  const formatCurrencyInput = (value: string | number) => {
    const numericValue = typeof value === 'string' ? 
      Number(value.replace(/\D/g, '')) / 100 : 
      value;
    
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericValue);
  };

  const handleCurrencyInput = (value: string) => {
    // Remover tudo que não é número
    const numericValue = value.replace(/\D/g, '');
    
    // Converter para número e dividir por 100 para considerar centavos
    const floatValue = Number(numericValue) / 100;
    
    // Formatar com Intl.NumberFormat
    const formattedValue = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(floatValue);

    setFormData(prev => ({
      ...prev,
      limit: formattedValue
    }));
  };

  const getBudgetSummaries = (): BudgetSummary[] => {
    return budgets.map(budget => {
      const spent = transactions
        .filter(t => t.category === budget.category)
        .reduce((sum, t) => sum + t.amount, 0);
      
      const percentage = (spent / budget.limit) * 100;
      
      let status: 'success' | 'warning' | 'danger' = 'success';
      let message = '';

      if (percentage >= 100) {
        status = 'danger';
        message = 'Você ultrapassou o limite! Que tal revisar seus gastos?';
      } else if (percentage >= 80) {
        status = 'warning';
        message = 'Atenção! Você está próximo do limite.';
      } else if (percentage <= 30) {
        message = 'Ótimo trabalho! Seus gastos estão bem controlados.';
      }

      return {
        category: budget.category,
        currentSpent: spent,
        limit: budget.limit,
        percentage,
        status,
        message
      };
    });
  };

  const handleAddTransaction = async (transaction: Transaction) => {
    // ... código existente ...

    // Verificar limites do orçamento
    const budget = budgets.find(b => b.category === transaction.category);
    if (budget) {
      const currentSpent = transactions
        .filter(t => t.category === transaction.category)
        .reduce((sum, t) => sum + t.amount, 0);
      await checkAllBudgets();
    }
  };

  const renderBudgetItem = (budget: Budget) => (
    <div key={budget.id} className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {getCategoryLabel(budget.category)}
        </h3>
        <div className="flex space-x-2">
          <button onClick={() => handleEdit(budget)}>
            <Pencil className="h-5 w-5 text-blue-600" />
          </button>
          <button onClick={() => handleDelete(budget.id)}>
            <Trash2 className="h-5 w-5 text-red-600" />
          </button>
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-2">
        {formatCurrency(budget.limit)}
      </p>
      <p className="text-sm text-gray-500">Limite mensal</p>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center mb-8">
        <PiggyBank className="h-8 w-8 text-green-500 mr-3" />
        <h1 className="text-3xl font-bold text-gray-900">Orçamentos</h1>
      </div>

      <div className="mb-8">
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Novo Orçamento
        </button>
      </div>

      {budgets.length === 0 ? (
        <div className="text-center py-8 bg-white rounded-xl shadow-sm">
          <PiggyBank className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">Nenhum orçamento definido</p>
          <p className="text-sm text-gray-400">
            Clique em "Novo Orçamento" para começar a controlar seus gastos
          </p>
        </div>
      ) : (
        <>
          {/* Lista de Orçamentos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {budgets.map(renderBudgetItem)}
          </div>

          {/* Resumo e Sugestões */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Resumo do Mês Atual</h2>
            <div className="space-y-6">
              {getBudgetSummaries().map(summary => (
                <div key={summary.category} className="border-b pb-4 last:border-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {getCategoryLabel(summary.category)}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {formatCurrency(summary.currentSpent)} de {formatCurrency(summary.limit)}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-sm font-medium
                      ${summary.status === 'success' ? 'bg-green-100 text-green-800' : 
                        summary.status === 'warning' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'}`}>
                      {summary.percentage.toFixed(0)}%
                    </span>
                  </div>
                  <p className={`text-sm
                    ${summary.status === 'success' ? 'text-green-600' : 
                      summary.status === 'warning' ? 'text-yellow-600' : 
                      'text-red-600'}`}>
                    {summary.message}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Modal de Orçamento */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingBudget ? 'Editar' : 'Novo'} Orçamento
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Categoria
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300"
                  required
                >
                  <option value="">Selecione uma categoria</option>
                  {transactionCategories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Limite Mensal
                </label>
                <CurrencyInput
                  value={formData.limit}
                  onChange={(e) => handleCurrencyInput(e.target.value)}
                  required
                />
              </div>

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
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
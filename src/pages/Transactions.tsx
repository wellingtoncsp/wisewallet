import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { useAlerts } from '../contexts/AlertContext';
import { Plus, Pencil, Trash2, ArrowUpCircle, ArrowDownCircle, Receipt } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { transactionCategories } from '../utils/categories';
import { useFormatCurrency } from '../utils/formatCurrency';
import { CurrencyInput } from '../components/CurrencyInput';

interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: Date;
  type: 'income' | 'expense';
  category: string;
  userId: string;
  walletId: string;
}

export default function Transactions() {
  const { user } = useAuth();
  const { currentWallet, isSharedWallet } = useWallet();
  const { createAlert } = useAlerts();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    type: 'expense',
    category: ''
  });
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const formatCurrency = useFormatCurrency();

  useEffect(() => {
    if (user && currentWallet) {
      fetchTransactions();
    }
  }, [user, currentWallet]);

  const fetchTransactions = async () => {
    if (!user || !currentWallet) return;

    const transactionsRef = collection(db, 'transactions');
    let q;
    
    if (isSharedWallet(currentWallet.id)) {
      // Para carteiras compartilhadas, buscar por walletId
      q = query(
        transactionsRef, 
        where('walletId', '==', currentWallet.id)
      );
    } else {
      // Para carteiras próprias, buscar por userId e walletId
      q = query(
        transactionsRef, 
        where('walletId', '==', currentWallet.id),
        where('userId', '==', user.uid)
      );
    }

    const querySnapshot = await getDocs(q);
    const transactionsData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate()
    })) as Transaction[];

    setTransactions(transactionsData);
  };

  const formatCurrencyInput = (value: string | number) => {
    // Se for string, limpar caracteres não numéricos
    const numericValue = typeof value === 'string' ? 
      Number(value.replace(/\D/g, '')) / 100 : 
      value;
    
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericValue);
  };

  const handleAmountChange = (value: string) => {
    const formattedValue = formatCurrencyInput(value);
    setFormData(prev => ({
      ...prev,
      amount: formattedValue
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !currentWallet) return;

    try {
      const amount = Number(formData.amount.replace(/\D/g, '')) / 100;
      
      // Criar a data usando parseISO e ajustar para meio-dia no horário local
      const localDate = parseISO(formData.date);
      const date = new Date(
        localDate.getFullYear(),
        localDate.getMonth(),
        localDate.getDate(),
        12, // meio-dia
        0,
        0,
        0
      );

      const newTransaction = {
        description: formData.description,
        amount,
        type: formData.type,
        category: formData.category,
        date,
        userId: user.uid,
        walletId: currentWallet.id
      };

      if (editingTransaction) {
        const transactionRef = doc(db, 'transactions', editingTransaction.id);
        await updateDoc(transactionRef, newTransaction);
      } else {
        await addDoc(collection(db, 'transactions'), newTransaction);
      }

      setIsModalOpen(false);
      setEditingTransaction(null);
      resetForm();
      fetchTransactions();
      setSuccess('Transação salva com sucesso!');

      // Notificar transações grandes
      if (amount >= 1000) {
        await createAlert('transaction_large', {
          type: newTransaction.type,
          amount: formatCurrency(amount)
        });
      }

      // Verificar padrões de gastos
      if (newTransaction.type === 'expense') {
        const categoryTransactions = transactions.filter(t => 
          t.category === newTransaction.category &&
          t.type === 'expense'
        );

        if (categoryTransactions.length >= 3) {
          const totalAmount = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
          if (totalAmount > 2000) {
            await createAlert('spending_pattern', {
              category: newTransaction.category
            });
          }
        }
      }

      // Verificar sequência de economia
      if (newTransaction.type === 'income') {
        const lastMonthExpenses = transactions
          .filter(t => 
            t.type === 'expense' && 
            t.date >= startOfMonth(new Date())
          )
          .reduce((sum, t) => sum + t.amount, 0);

        if (lastMonthExpenses < amount * 0.7) {
          await createAlert('saving_streak', {
            days: 30
          });
        }
      }
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
      setError('Erro ao salvar transação. Tente novamente.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta transação?')) return;

    const transactionRef = doc(db, 'transactions', id);
    await deleteDoc(transactionRef);
    fetchTransactions();
  };

  const handleEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      amount: formatCurrencyInput(transaction.amount),
      description: transaction.description,
      date: format(transaction.date, 'yyyy-MM-dd'),
      type: transaction.type,
      category: transaction.category
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      amount: '',
      description: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      type: 'expense',
      category: ''
    });
  };

  // Gerar resumo mensal
  useEffect(() => {
    const generateMonthlySummary = async () => {
      const now = new Date();
      const isLastDayOfMonth = endOfMonth(now).getDate() === now.getDate();

      if (isLastDayOfMonth) {
        const monthIncome = transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);

        const monthExpenses = transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        const savedAmount = monthIncome - monthExpenses;
        
        await createAlert('monthly_summary', {
          savedAmount: formatCurrency(savedAmount),
          comparison: savedAmount > 0 ? 1 : -1
        });
      }
    };

    generateMonthlySummary();
  }, [transactions]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center mb-8">
        <Receipt className="h-8 w-8 text-purple-500 mr-3" />
        <h1 className="text-3xl font-bold text-gray-900">Transações</h1>
      </div>
      <div className="flex justify-between items-center mb-8">
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nova Transação
        </button>
      </div>

      {/* Lista de Transações */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Data
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Descrição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Valor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {transactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(transaction.date, 'dd/MM/yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {transaction.type === 'income' ? (
                        <ArrowUpCircle className="h-5 w-5 text-green-500 mr-2" />
                      ) : (
                        <ArrowDownCircle className="h-5 w-5 text-red-500 mr-2" />
                      )}
                      <span className="text-sm text-gray-900">{transaction.description}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {transactionCategories.find(cat => cat.id === transaction.category)?.label || transaction.category}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-medium ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(transaction.amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(transaction)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        <Pencil className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Nenhuma transação encontrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Formulário */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingTransaction ? 'Editar Transação' : 'Nova Transação'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Tipo <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as 'income' | 'expense' })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="expense">Despesa</option>
                  <option value="income">Receita</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Valor <span className="text-red-500">*</span>
                </label>
                <CurrencyInput
                  value={formData.amount}
                  onChange={(e) => handleAmountChange(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Descrição
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Categoria <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                >
                  <option value="">Selecione uma categoria</option>
                  {transactionCategories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Data <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="text-sm text-gray-500">
                <span className="text-red-500">*</span> Campos obrigatórios
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingTransaction(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  {editingTransaction ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
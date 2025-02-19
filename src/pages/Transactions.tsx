import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, where, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { useAlerts } from '../contexts/AlertContext';
import { Plus, Pencil, Trash2, ArrowUpCircle, ArrowDownCircle, Receipt } from 'lucide-react';
import { transactionCategories } from '../utils/categories';
import { useFormatCurrency } from '../utils/formatCurrency';
import { CurrencyInput } from '../components/CurrencyInput';
import { DateInput } from '../components/DateInput';
import { format,  startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';


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

    try {
      const transactionsRef = collection(db, 'transactions');
      let q;
      
      if (isSharedWallet(currentWallet.id)) {
        q = query(
          transactionsRef, 
          where('walletId', '==', currentWallet.id),
          orderBy('date', 'desc')
        );
      } else {
        q = query(
          transactionsRef, 
          where('walletId', '==', currentWallet.id),
          where('userId', '==', user.uid),
          orderBy('date', 'desc')
        );
      }

      const querySnapshot = await getDocs(q);
      const transactionsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate()
      })) as Transaction[];

      setTransactions(transactionsData);
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
      if (error instanceof Error && error.message.includes('index')) {
        console.log('É necessário criar um índice no Firestore');
      }
    }
  };

  const handleAmountChange = (value: any) => {
    try {
      // Garante que o valor é uma string
      const stringValue = String(value?.target?.value || value || '');
      
      // Remove tudo que não é número
      const numericValue = stringValue.replace(/\D/g, '');
      
      // Converte para número e divide por 100 para ter os centavos
      const amount = Number(numericValue) / 100;
      
      // Formata usando Intl
      const formattedValue = new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);

      setFormData(prev => ({
        ...prev,
        amount: formattedValue
      }));
    } catch (error) {
      console.error('Erro ao formatar valor:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !currentWallet) return;

    try {
      const transactionData = {
        amount: Number(formData.amount.replace(/\D/g, '')) / 100,
        description: formData.description,
        date: new Date(formData.date),
        type: formData.type as 'income' | 'expense',
        category: formData.category,
        userId: user.uid,
        walletId: currentWallet.id
      };

      if (editingTransaction) {
        await updateDoc(doc(db, 'transactions', editingTransaction.id), transactionData);
      } else {
        await addDoc(collection(db, 'transactions'), transactionData);
      }

      // Notificar transações grandes
      if (transactionData.amount >= 1000) {
        console.log('Criando alerta de transação grande:', transactionData);
        await createAlert('transaction_large', {
          type: transactionData.type,
          amount: formatCurrency(transactionData.amount)
        }, currentWallet.id);
      }

      // Verificar padrões de gastos
      if (transactionData.type === 'expense') {
        const categoryTransactions = transactions.filter(t => 
          t.category === transactionData.category &&
          t.type === 'expense'
        );

        console.log('Transações da categoria:', categoryTransactions);

        if (categoryTransactions.length >= 3) {
          const totalAmount = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
          console.log('Total gasto na categoria:', totalAmount);
          
          if (totalAmount > 2000) {
            await createAlert('spending_pattern', {
              category: transactionData.category
            }, currentWallet.id);
          }
        }
      }

      setIsModalOpen(false);
      setEditingTransaction(null);
      resetForm();
      fetchTransactions();
      setSuccess('Transação salva com sucesso!');

      // Verificar sequência de economia
      if (transactionData.type === 'income') {
        const lastMonthExpenses = transactions
          .filter(t => 
            t.type === 'expense' && 
            t.date >= startOfMonth(new Date())
          )
          .reduce((sum, t) => sum + t.amount, 0);

        if (lastMonthExpenses < transactionData.amount * 0.7) {
          await createAlert('saving_streak', {
            days: 30
          }, currentWallet.id);
        }
      }
    } catch (error) {
      console.error('Erro ao salvar transação:', error);
      setError('Erro ao salvar transação');
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
      amount: new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(transaction.amount),
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
      if (!currentWallet) return;

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
        }, currentWallet.id);
      }
    };

    generateMonthlySummary();
  }, [transactions]);

  // Função para abrir o modal de nova transação
  const handleNewTransaction = () => {
    setEditingTransaction(null);
    resetForm();
    setIsModalOpen(true);
  };

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Receipt className="h-6 w-6 text-blue-500 mr-2" />
          <h1 className="text-2xl font-bold text-gray-900">Transações</h1>
        </div>
        
        <button
          onClick={handleNewTransaction}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nova Transação
        </button>
      </div>

      {/* Lista de transações */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {transactions.length === 0 ? (
          <div className="text-center py-8">
            <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Nenhuma transação registrada</p>
            <p className="text-sm text-gray-400">
              Clique em "Nova Transação" para começar a registrar suas movimentações
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {transactions.map(transaction => (
              <div 
                key={transaction.id} 
                className="p-4 hover:bg-gray-50 transition-colors"
              >
                {/* Layout adaptativo para mobile */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Ícone e informações principais */}
                  <div className="flex items-start gap-3 flex-1">
                    <div className={`p-2 rounded-lg flex-shrink-0 ${
                      transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                    }`}>
                      {transaction.type === 'income' ? (
                        <ArrowUpCircle className="h-6 w-6 text-green-600" />
                      ) : (
                        <ArrowDownCircle className="h-6 w-6 text-red-600" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {transaction.description}
                      </p>
                      <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm text-gray-500">
                        <span>{format(transaction.date, 'dd/MM/yyyy', { locale: ptBR })}</span>
                        <span className="hidden sm:inline">•</span>
                        <span>{transactionCategories.find(cat => cat.id === transaction.category)?.label || transaction.category}</span>
                      </div>
                    </div>
                  </div>

                  {/* Valor e ações */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 mt-2 sm:mt-0">
                    <span className={`text-sm font-medium ${
                      transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'} 
                      {formatCurrency(transaction.amount)}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(transaction)}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(transaction.id)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded-full hover:bg-gray-100"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Transação */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingTransaction ? 'Editar' : 'Nova'} Transação
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
                  onChange={handleAmountChange}
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
                  Data <span className="text-red-500">*</span>
                </label>
                <DateInput
                  value={formData.date}
                  onChange={(value) => setFormData({ ...formData, date: value })}
                  required
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

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingTransaction(null);
                    resetForm();
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
import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, where, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { Plus, Pencil, Trash2, Target, Check, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Goal {
  id: string;
  name: string;
  target_amount: number;
  priority: number;
  deadline: Date;
  completed: boolean;
  completedAt: Timestamp;
}

interface Transaction {
  amount: number;
  type: 'income' | 'expense';
}

export default function Goals() {
  const { user } = useAuth();
  const { currentWallet } = useWallet();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    target_amount: '',
    priority: '2',
    deadline: format(new Date(), 'yyyy-MM-dd')
  });
  const [completedGoals, setCompletedGoals] = useState<Goal[]>([]);
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [shouldCreateTransaction, setShouldCreateTransaction] = useState(false);

  useEffect(() => {
    if (user && currentWallet) {
      Promise.all([
        fetchGoals(),
        fetchCompletedGoals(),
        calculateCurrentBalance()
      ]);
    }
  }, [user, currentWallet]);

  const calculateCurrentBalance = async () => {
    if (!user) return;

    const transactionsRef = collection(db, 'transactions');
    const q = query(transactionsRef, where('userId', '==', user.uid));
    const querySnapshot = await getDocs(q);
    
    const transactions = querySnapshot.docs.map(doc => doc.data()) as Transaction[];
    
    const balance = transactions.reduce((sum, transaction) => {
      return sum + (transaction.type === 'income' ? transaction.amount : -transaction.amount);
    }, 0);

    setCurrentBalance(balance);
  };

  const fetchGoals = async () => {
    if (!user) return;

    const goalsRef = collection(db, 'goals');
    const q = query(goalsRef, where('userId', '==', user.uid));
    const querySnapshot = await getDocs(q);
    
    const goalsData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      deadline: new Date(doc.data().deadline.seconds * 1000)
    })) as Goal[];

    // Ordenar primeiro por prioridade (1 a 3) e depois por valor (menor para maior)
    const sortedGoals = goalsData.sort((a, b) => {
      // Primeiro critério: prioridade
      if (a.priority !== b.priority) {
        return a.priority - b.priority;
      }
      // Segundo critério: valor (menor para maior)
      return a.target_amount - b.target_amount;
    });

    const activeGoals = sortedGoals.filter(goal => !goal.completed);
    setGoals(activeGoals);
  };

  const fetchCompletedGoals = async () => {
    if (!user) return;

    const goalsRef = collection(db, 'goals');
    const q = query(
      goalsRef, 
      where('userId', '==', user.uid),
      where('completed', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    const completedGoals = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      deadline: new Date(doc.data().deadline.seconds * 1000)
    })) as Goal[];

    setCompletedGoals(completedGoals);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    const goal = {
      name: formData.name,
      target_amount: Number(formData.target_amount.replace(/\D/g, '')) / 100,
      priority: Number(formData.priority),
      deadline: new Date(formData.deadline),
      userId: user.uid
    };

    if (editingGoal) {
      const goalRef = doc(db, 'goals', editingGoal.id);
      await updateDoc(goalRef, goal);
    } else {
      await addDoc(collection(db, 'goals'), goal);
    }

    setIsModalOpen(false);
    setEditingGoal(null);
    resetForm();
    fetchGoals();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta meta?')) return;

    const goalRef = doc(db, 'goals', id);
    await deleteDoc(goalRef);
    fetchGoals();
  };

  const handleEdit = (goal: Goal) => {
    setEditingGoal(goal);
    setFormData({
      name: goal.name,
      target_amount: formatCurrencyInput(goal.target_amount),
      priority: goal.priority.toString(),
      deadline: format(goal.deadline, 'yyyy-MM-dd')
    });
    setIsModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      target_amount: '',
      priority: '2',
      deadline: format(new Date(), 'yyyy-MM-dd')
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatCurrencyInput = (value: number | string) => {
    const numericValue = typeof value === 'string' ? 
      Number(value.replace(/\D/g, '')) / 100 : 
      value;
    
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericValue);
  };

  const handleCurrencyInput = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    setFormData({
      ...formData,
      target_amount: formatCurrencyInput(numericValue)
    });
  };

  const calculateGoalProgress = (goalIndex: number, targetAmount: number) => {
    let remainingBalance = currentBalance;
    
    // Subtrair os valores das metas anteriores
    for (let i = 0; i < goalIndex; i++) {
      if (remainingBalance <= 0) break;
      remainingBalance -= Math.min(remainingBalance, goals[i].target_amount);
    }

    // Calcular o progresso da meta atual
    const currentGoalProgress = Math.min(remainingBalance, targetAmount);
    return Math.max(0, (currentGoalProgress / targetAmount) * 100);
  };

  const getGoalProgressAmount = (goalIndex: number, targetAmount: number) => {
    let remainingBalance = currentBalance;
    
    // Subtrair os valores das metas anteriores
    for (let i = 0; i < goalIndex; i++) {
      if (remainingBalance <= 0) break;
      remainingBalance -= Math.min(remainingBalance, goals[i].target_amount);
    }

    // Retornar o valor disponível para a meta atual
    return Math.max(0, Math.min(remainingBalance, targetAmount));
  };

  const getPriorityLabel = (priority: number) => {
    switch (priority) {
      case 1:
        return 'Alta';
      case 2:
        return 'Média';
      case 3:
        return 'Baixa';
      default:
        return 'Média';
    }
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1:
        return 'text-red-600';
      case 2:
        return 'text-yellow-600';
      case 3:
        return 'text-green-600';
      default:
        return 'text-yellow-600';
    }
  };

  const openCompleteModal = (goal: Goal) => {
    setSelectedGoal(goal);
    setIsCompleteModalOpen(true);
    setShouldCreateTransaction(false);
  };

  const handleCompleteGoal = async () => {
    if (!selectedGoal || !user) return;

    try {
      const goalRef = doc(db, 'goals', selectedGoal.id);
      const now = new Date();
      
      await updateDoc(goalRef, {
        completed: true,
        completedAt: Timestamp.fromDate(now)
      });

      if (shouldCreateTransaction) {
        // Criar transação de despesa
        await addDoc(collection(db, 'transactions'), {
          type: 'expense',
          amount: selectedGoal.target_amount,
          description: `Meta concluída: ${selectedGoal.name}`,
          category: 'goals',
          date: now,
          userId: user.uid
        });
      }

      // Atualizar as listas
      await fetchGoals();
      await fetchCompletedGoals();
      if (shouldCreateTransaction) {
        await calculateCurrentBalance();
      }
      
      setIsCompleteModalOpen(false);
      setSelectedGoal(null);
      setShouldCreateTransaction(false);
    } catch (error) {
      console.error('Erro ao concluir meta:', error);
      alert('Erro ao concluir meta. Tente novamente.');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center mb-8">
        <Target className="h-8 w-8 text-orange-500 mr-3" />
        <h1 className="text-3xl font-bold text-gray-900">Metas Financeiras</h1>
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
          Nova Meta
        </button>
      </div>

      {/* Saldo Atual */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Saldo Disponível</h2>
        <p className="text-3xl font-bold text-blue-600">{formatCurrency(currentBalance)}</p>
      </div>

      {/* Lista de Metas Ativas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {goals.map((goal, index) => {
          const progressAmount = getGoalProgressAmount(index, goal.target_amount);
          const isComplete = progressAmount >= goal.target_amount;

          return (
            <div key={goal.id} className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <Target className="h-5 w-5 text-blue-500 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">{goal.name}</h3>
                </div>
                <div className="flex space-x-2">
                  {isComplete && (
                    <button
                      onClick={() => openCompleteModal(goal)}
                      className="p-1 text-green-600 hover:text-green-800"
                      title="Concluir Meta"
                    >
                      <Check className="h-5 w-5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleEdit(goal)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <Pencil className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(goal.id)}
                    className="text-red-600 hover:text-red-900"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Progresso</span>
                    <span>
                      {formatCurrency(progressAmount)} / {formatCurrency(goal.target_amount)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${isComplete ? 'bg-green-600' : 'bg-blue-600'}`}
                      style={{
                        width: `${Math.min(
                          (progressAmount / goal.target_amount) * 100,
                          100
                        )}%`
                      }}
                    ></div>
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  Previsão: {format(goal.deadline, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Metas Concluídas */}
      {completedGoals.length > 0 && (
        <div className="mt-12">
          <div className="flex items-center mb-6">
            <Trophy className="h-6 w-6 text-yellow-500 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Metas Concluídas</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedGoals.map((goal) => (
              <div key={goal.id} className="bg-gray-50 rounded-xl shadow-sm p-6">
                <div className="flex items-center mb-4">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">{goal.name}</h3>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">
                    Valor: {formatCurrency(goal.target_amount)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Previsão: {format(goal.deadline, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                  <p className="text-sm text-gray-600">
                    Concluída em: {format(goal.completedAt.toDate(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {goals.length === 0 && (
        <div className="text-center py-12">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">Nenhuma meta financeira definida</p>
        </div>
      )}

      {/* Modal de Formulário */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingGoal ? 'Editar Meta' : 'Nova Meta'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nome da Meta</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Valor Alvo</label>
                <div className="relative mt-1">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                    R$
                  </span>
                  <input
                    type="text"
                    required
                    value={formData.target_amount}
                    onChange={(e) => handleCurrencyInput(e.target.value)}
                    className="pl-8 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Prioridade</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="1">Alta</option>
                  <option value="2">Média</option>
                  <option value="3">Baixa</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Data prevista para alcançar a meta
                </label>
                <input
                  type="date"
                  required
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingGoal(null);
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md"
                >
                  {editingGoal ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adicionar o Modal de Conclusão */}
      {isCompleteModalOpen && selectedGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">Concluir Meta</h2>
            
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja marcar a meta "{selectedGoal.name}" como concluída?
            </p>

            <div className="mb-6">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={shouldCreateTransaction}
                  onChange={(e) => setShouldCreateTransaction(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Registrar valor como despesa ({formatCurrency(selectedGoal.target_amount)})
                </span>
              </label>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsCompleteModalOpen(false);
                  setSelectedGoal(null);
                  setShouldCreateTransaction(false);
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
              <button
                onClick={handleCompleteGoal}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
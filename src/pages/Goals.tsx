import React, { useEffect, useState } from 'react';
import { collection, query, getDocs, addDoc, updateDoc, deleteDoc, doc, where, Timestamp, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { useAlerts } from '../contexts/AlertContext';
import { Plus, Pencil, Trash2, Target, Check, Trophy } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useFormatCurrency } from '../utils/formatCurrency';
import { CurrencyInput } from '../components/CurrencyInput';

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
  const { currentWallet, isSharedWallet } = useWallet();
  const { createAlert } = useAlerts();
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
  const formatCurrency = useFormatCurrency();
  const [goalsProgress, setGoalsProgress] = useState<Record<string, number>>({});

  useEffect(() => {
    if (user && currentWallet) {
      const loadData = async () => {
        try {
          // Primeiro buscar as transações e calcular o saldo
          const transactionsRef = collection(db, 'transactions');
          const q = query(
            transactionsRef,
            where('walletId', '==', currentWallet.id)
          );

          const querySnapshot = await getDocs(q);
          const transactions = querySnapshot.docs.map(doc => ({
            ...doc.data(),
            date: doc.data().date.toDate(),
            amount: doc.data().amount,
            type: doc.data().type
          })) as Transaction[];

          // Calcular saldo total
          const totalBalance = transactions.reduce((sum, t) => {
            return sum + (t.type === 'income' ? t.amount : -t.amount);
          }, 0);
          setCurrentBalance(totalBalance);

          // Depois buscar as metas
          const goalsRef = collection(db, 'goals');
          const goalsQuery = query(
            goalsRef,
            where('walletId', '==', currentWallet.id),
            where('completed', '==', false)
          );

          const goalsSnapshot = await getDocs(goalsQuery);
          const goalsData = goalsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            deadline: doc.data().deadline.toDate()
          })) as Goal[];

          // Ordenar metas e calcular progresso
          const sortedGoals = [...goalsData].sort((a, b) => {
            if (a.priority !== b.priority) {
              return a.priority - b.priority;
            }
            return a.target_amount - b.target_amount;
          });

          let remainingBalance = totalBalance;
          const progress: Record<string, number> = {};

          sortedGoals.forEach(goal => {
            if (remainingBalance <= 0) {
              progress[goal.id] = 0;
              return;
            }

            const amountForThisGoal = Math.min(remainingBalance, goal.target_amount);
            const goalProgress = (amountForThisGoal / goal.target_amount) * 100;
            progress[goal.id] = goalProgress;

            if (amountForThisGoal >= goal.target_amount) {
              remainingBalance -= goal.target_amount;
            } else {
              remainingBalance = 0;
            }
          });

          setGoals(sortedGoals);
          setGoalsProgress(progress);
          await fetchCompletedGoals();

        } catch (error) {
          console.error('Erro ao carregar dados:', error);
        }
      };

      loadData();

      // Criar listener para atualizações
      const unsubscribe = onSnapshot(
        query(collection(db, 'transactions'), where('walletId', '==', currentWallet.id)),
        () => {
          loadData();
        }
      );

      return () => unsubscribe();
    }
  }, [user, currentWallet]);

  useEffect(() => {
    if (!currentWallet || goals.length === 0) return;

    const checkGoalsProgress = async () => {
      goals.forEach(async (goal) => {
        if (goal.completed) return;
        
        const progress = (currentBalance / goal.target_amount) * 100;

        [25, 50, 75].forEach(async (milestone) => {
          if (progress >= milestone && progress < milestone + 10) {
            await createAlert('goal_milestone', {
              goalName: goal.name,
              percentage: milestone,
              goalId: goal.id
            }, currentWallet.id);
          }
        });

        // Notificar quando a meta for atingida
        if (progress >= 100 && !goal.completed) {
          await createAlert('goal_achieved', {
            goalName: goal.name,
            targetAmount: goal.target_amount
          }, currentWallet.id);
        }
      });
    };

    checkGoalsProgress();
  }, [currentBalance]);

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
    if (!user || !currentWallet) return;

    const goalsRef = collection(db, 'goals');
    const q = query(
      goalsRef, 
      where('walletId', '==', currentWallet.id),
      where('completed', '==', false)
    );

    const querySnapshot = await getDocs(q);
    const goalsData = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      deadline: doc.data().deadline.toDate()
    })) as Goal[];

    setGoals(goalsData);
  };

  const fetchCompletedGoals = async () => {
    if (!user || !currentWallet) return;

    const goalsRef = collection(db, 'goals');
    const q = query(
      goalsRef, 
      where('walletId', '==', currentWallet.id),
      where('completed', '==', true)
    );
    
    const querySnapshot = await getDocs(q);
    const completedGoals = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      deadline: doc.data().deadline.toDate()
    })) as Goal[];

    setCompletedGoals(completedGoals);
  };

  const fetchTransactions = async () => {
    if (!user || !currentWallet) return;

    try {
      const transactionsRef = collection(db, 'transactions');
      const q = query(
        transactionsRef,
        where('walletId', '==', currentWallet.id)
      );

      const querySnapshot = await getDocs(q);
      const transactions = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        date: doc.data().date.toDate(),
        amount: doc.data().amount,
        type: doc.data().type
      })) as Transaction[];

      // Calcular saldo total
      let totalBalance = transactions.reduce((sum, t) => {
        return sum + (t.type === 'income' ? t.amount : -t.amount);
      }, 0);

      // Ordenar metas por prioridade e valor
      const sortedGoals = [...goals].sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        return a.target_amount - b.target_amount;
      });

      // Calcular progresso respeitando a ordem de prioridade
      const progress: Record<string, number> = {};
      let remainingBalance = totalBalance;

      sortedGoals.forEach(goal => {
        // Se não há saldo, meta tem 0% de progresso
        if (remainingBalance <= 0) {
          progress[goal.id] = 0;
          return;
        }

        // Calcular quanto da meta atual pode ser preenchida
        const amountForThisGoal = Math.min(remainingBalance, goal.target_amount);
        const goalProgress = (amountForThisGoal / goal.target_amount) * 100;
        progress[goal.id] = goalProgress;

        // Subtrair do saldo disponível apenas se a meta foi completamente preenchida
        if (amountForThisGoal >= goal.target_amount) {
          remainingBalance -= goal.target_amount;
        } else {
          // Se a meta não foi completamente preenchida, usar todo o saldo restante
          remainingBalance = 0;
        }
      });

      setGoalsProgress(progress);
    } catch (error) {
      console.error('Erro ao buscar transações:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !currentWallet) return;
    
    const goal = {
      name: formData.name,
      target_amount: Number(formData.target_amount.replace(/\D/g, '')) / 100,
      priority: Number(formData.priority),
      deadline: new Date(formData.deadline),
      userId: user.uid,
      walletId: currentWallet.id,
      completed: false
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
      target_amount: formatCurrency(goal.target_amount),
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

  const handleCompleteGoal = async (goal: Goal) => {
    if (!user || !currentWallet) return;

    try {
      // Atualizar o status da meta no Firestore
      const goalRef = doc(db, 'goals', goal.id);
      await updateDoc(goalRef, {
        completed: true,
        completedAt: new Date()
      });

      // Criar notificação de meta alcançada
      await createAlert('goal_achieved', {
        goalName: goal.name,
        targetAmount: goal.target_amount
      }, currentWallet.id);

      // Atualizar a lista de metas
      await Promise.all([
        fetchGoals(),
        fetchCompletedGoals()
      ]);

      // Fechar o modal
      setIsCompleteModalOpen(false);
      setSelectedGoal(null);

      // Opcional: Criar transação se o usuário escolheu
      if (shouldCreateTransaction) {
        const transactionsRef = collection(db, 'transactions');
        await addDoc(transactionsRef, {
          amount: goal.target_amount,
          description: `Meta alcançada: ${goal.name}`,
          category: 'savings', // ou categoria específica para metas
          type: 'income',
          date: new Date(),
          userId: user.uid,
          walletId: currentWallet.id
        });
      }
    } catch (error) {
      console.error('Erro ao concluir meta:', error);
    }
  };

  const handleCurrencyInput = (value: string) => {
    // Remove tudo que não for número
    const numericValue = value.replace(/\D/g, '');
    
    // Converte para número e formata
    const amount = Number(numericValue) / 100;
    const formattedValue = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);

    setFormData(prev => ({
      ...prev,
      target_amount: formattedValue
    }));
  };

  const renderGoal = (goal: Goal) => {
    const progress = goalsProgress[goal.id] || 0;
    const currentAmount = Math.min((progress * goal.target_amount) / 100, goal.target_amount);

    return (
      <div key={goal.id} className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start mb-4">
          <div className="flex items-center mb-2 sm:mb-0">
            <Target className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500 mr-2" />
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">{goal.name}</h3>
          </div>
          <div className="flex space-x-2 w-full sm:w-auto justify-end">
            {progress >= 100 && !goal.completed && (
              <button
                onClick={() => openCompleteModal(goal)}
                className="text-green-600 hover:text-green-800"
                title="Concluir meta"
              >
                <Check className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={() => handleEdit(goal)}
              className="text-blue-600 hover:text-blue-800"
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
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Progresso</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          <div className="text-sm text-gray-600">
            <div>Valor atual: {formatCurrency(currentAmount)}</div>
            <div>Meta: {formatCurrency(goal.target_amount)}</div>
            <div>Previsão: {format(goal.deadline, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</div>
          </div>
        </div>
      </div>
    );
  };

  const sortedGoals = [...goals].sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    return a.target_amount - b.target_amount;
  });

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto">
      {/* Cabeçalho */}
      <div className="flex items-center mb-4 sm:mb-8">
        <Target className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500 mr-2 sm:mr-3" />
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Metas Financeiras</h1>
      </div>

      {/* Botão de adicionar meta */}
      <div className="mb-8">
        <button
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="h-5 w-5 mr-2" />
          Nova Meta
        </button>
      </div>

      {/* Metas Ativas */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Metas em Andamento</h2>
        {goals.length === 0 ? (
          <div className="text-center py-8 bg-white rounded-xl shadow-sm">
            <Target className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500">Nenhuma meta financeira definida</p>
            <p className="text-sm text-gray-400">
              Clique em "Nova Meta" para começar a planejar seus objetivos
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-6">
            {sortedGoals.map((goal) => renderGoal(goal))}
          </div>
        )}
      </div>

      {/* Metas Concluídas */}
      {completedGoals.length > 0 && (
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">🏆 Metas Concluídas</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
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

      {/* Modal de Formulário */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-lg w-full max-w-lg mx-3 p-4 sm:p-6">
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
                <CurrencyInput
                  value={formData.target_amount}
                  onChange={(e) => handleCurrencyInput(e.target.value)}
                  required
                />
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

      {/* Modal de Conclusão */}
      {isCompleteModalOpen && selectedGoal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">Concluir Meta</h2>
            <p className="text-gray-600 mb-4">
              Parabéns por atingir sua meta "{selectedGoal.name}"!
            </p>
            
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={shouldCreateTransaction}
                  onChange={(e) => setShouldCreateTransaction(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-600">
                  Criar transação com o valor da meta
                </span>
              </label>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsCompleteModalOpen(false);
                  setSelectedGoal(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-300 rounded-md"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleCompleteGoal(selectedGoal)}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md"
              >
                Concluir Meta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
{/* Remover o gráfico de evolução financeira */}
import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Target, 
  Download, 
  TrendingUp, 
  TrendingDown,
  LayoutDashboard, 
  PiggyBank 
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, isFuture, isPast, isToday, isWithinInterval } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { transactionCategories } from '../utils/categories';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { useFormatCurrency } from '../utils/formatCurrency';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Area, AreaChart 
} from 'recharts';

interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  date: Date;
  description: string;
  category: string;
  userId: string;
  walletId: string;
}

interface Goal {
  id: string;
  name: string;
  target_amount: number;
  deadline: Date;
  priority: number;
  userId: string;
  walletId: string;
  completed?: boolean;
  progress?: number;
}

interface Budget {
  id: string;
  category: string;
  limit: number;
  userId: string;
  walletId: string;
}

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  balance: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const { currentWallet } = useWallet();
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [filterDates, setFilterDates] = useState({
    startDate: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd')
  });
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [upcomingGoals, setUpcomingGoals] = useState<Goal[]>([]);
  const [upcomingBills, setUpcomingBills] = useState<Transaction[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState({
    previousMonth: { income: 0, expenses: 0 },
    currentMonth: { income: 0, expenses: 0 }
  });
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const formatCurrency = useFormatCurrency();
  const [trendData, setTrendData] = useState<MonthlyData[]>([]);

  useEffect(() => {
    if (user && currentWallet) {
      loadDashboardData();
    }
  }, [user, currentWallet]);

  useEffect(() => {
    const handleWalletChange = () => {
      loadDashboardData();
    };

    window.addEventListener('walletChanged', handleWalletChange);
    return () => window.removeEventListener('walletChanged', handleWalletChange);
  }, []);

  const loadDashboardData = async () => {
    if (!user || !currentWallet) return;

    try {
      // Buscar todas as transações da carteira
      const transactionsRef = collection(db, 'transactions');
      const q = query(
        transactionsRef, 
        where('walletId', '==', currentWallet.id)
      );
      
      const querySnapshot = await getDocs(q);
      const transactions = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate()
      })) as Transaction[];

      // Calcular saldo total
      const totalBalance = transactions.reduce((sum, transaction) => {
        return sum + (transaction.type === 'income' ? transaction.amount : -transaction.amount);
      }, 0);
      setCurrentBalance(totalBalance);

      // Buscar metas
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

      // Ordenar metas por prioridade e valor
      const sortedGoals = [...goalsData].sort((a, b) => {
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        return a.target_amount - b.target_amount;
      });

      let remainingBalance = totalBalance;
      const goalsProgress = sortedGoals.map(goal => {
        if (remainingBalance <= 0) {
          return { ...goal, progress: 0 };
        }

        const amountForThisGoal = Math.min(remainingBalance, goal.target_amount);
        const progress = (amountForThisGoal / goal.target_amount) * 100;

        if (amountForThisGoal >= goal.target_amount) {
          remainingBalance -= goal.target_amount;
        } else {
          remainingBalance = 0;
        }

        return { ...goal, progress };
      });

      setUpcomingGoals(goalsProgress);

      // Buscar orçamentos
      const budgetsRef = collection(db, 'budgets');
      const budgetsQuery = query(
        budgetsRef,
        where('walletId', '==', currentWallet.id)
      );
      
      const budgetsSnapshot = await getDocs(budgetsQuery);
      const budgetsData = budgetsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Budget[];
      setBudgets(budgetsData);

      // Filtrar transações do mês atual
      const now = new Date();
      const firstDayOfMonth = startOfMonth(now);
      const lastDayOfMonth = endOfMonth(now);

      const currentMonthTransactions = transactions.filter(transaction => 
        isWithinInterval(transaction.date, {
          start: firstDayOfMonth,
          end: lastDayOfMonth
        })
      );

      // Calcular receitas e despesas do mês atual
      const monthIncome = currentMonthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const monthExpenses = currentMonthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      setMonthlyIncome(monthIncome);
      setMonthlyExpenses(monthExpenses);

      // Calcular tendência mensal
      const previousMonthStart = startOfMonth(subMonths(now, 1));
      const previousMonthEnd = endOfMonth(subMonths(now, 1));

      const previousMonthTransactions = transactions.filter(transaction =>
        isWithinInterval(transaction.date, {
          start: previousMonthStart,
          end: previousMonthEnd
        })
      );

      const previousMonthIncome = previousMonthTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

      const previousMonthExpenses = previousMonthTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      setMonthlyTrend({
        previousMonth: { 
          income: previousMonthIncome, 
          expenses: previousMonthExpenses 
        },
        currentMonth: { 
          income: monthIncome, 
          expenses: monthExpenses 
        }
      });

      // Ordenar transações por data
      const sortedTransactions = [...transactions].sort(
        (a, b) => b.date.getTime() - a.date.getTime()
      );
      setRecentTransactions(sortedTransactions.slice(0, 5));

      // Usar as transações já carregadas para o gráfico
      const lastMonths = Array.from({ length: 6 }, (_, i) => {
        const date = subMonths(new Date(), i);
        return {
          start: startOfMonth(date),
          end: endOfMonth(date),
          monthLabel: format(date, 'MMM/yyyy', { locale: ptBR })
        };
      }).reverse();

      // Processar dados mensais usando as transações já carregadas
      const monthlyData = lastMonths.map(({ start, end, monthLabel }) => {
        const monthTransactions = transactions.filter(
          t => t.date >= start && t.date <= end
        );

        const income = monthTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);

        const expenses = monthTransactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        return {
          month: monthLabel,
          income,
          expenses,
          balance: income - expenses
        };
      });

      setTrendData(monthlyData);

    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    }
  };

  const fetchGoals = async () => {
    if (!user || !currentWallet) return;

    try {
      const goalsRef = collection(db, 'goals');
      const q = query(
        goalsRef, 
        where('userId', '==', user.uid),
        where('walletId', '==', currentWallet.id)
      );
      
      const querySnapshot = await getDocs(q);
      
      const goals = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          deadline: data.deadline.toDate(),
          completed: data.completed || false
        };
      }) as Goal[];

      // Filtrar apenas metas não concluídas
      const activeMetas = goals.filter(goal => !goal.completed);
      console.log('Metas ativas:', activeMetas);

      // Ordenar por prioridade e valor
      const orderedGoals = activeMetas
        .sort((a, b) => {
          // Primeiro por prioridade
          if (a.priority !== b.priority) {
            return a.priority - b.priority;
          }
          // Depois por valor (menor para maior)
          return a.target_amount - b.target_amount;
        })
        .slice(0, 3); // Limitar a 3 metas

      console.log('Metas ordenadas (max 3):', orderedGoals);
      setUpcomingGoals(orderedGoals);

    } catch (error) {
      console.error('Erro ao buscar metas:', error);
    }
  };

  const fetchUpcomingBills = async () => {
    if (!user) return;

    const now = new Date();
    const endOfNextMonth = endOfMonth(subMonths(now, -1));

    const transactionsRef = collection(db, 'transactions');
    const q = query(
      transactionsRef,
      where('userId', '==', user.uid),
      where('type', '==', 'expense'),
      where('category', '==', 'bills')
    );
    
    const querySnapshot = await getDocs(q);
    const bills = querySnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        date: doc.data().date.toDate()
      }))
      .filter(bill => 
        (isFuture(bill.date) || isToday(bill.date)) && 
        bill.date <= endOfNextMonth
      )
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 5) as Transaction[];

    setUpcomingBills(bills);
  };

  const fetchBudgets = async () => {
    if (!user || !currentWallet) return;

    try {
      const budgetsRef = collection(db, 'budgets');
      const q = query(
        budgetsRef, 
        where('userId', '==', user.uid),
        where('walletId', '==', currentWallet.id)
      );
      
      const querySnapshot = await getDocs(q);
      const budgetsData = querySnapshot.docs.map(doc => ({
        ...doc.data()
      })) as Budget[];

      console.log('Debug - Orçamentos carregados:', budgetsData);
      
      setBudgets(budgetsData);
    } catch (error) {
      console.error('Erro ao buscar orçamentos:', error);
    }
  };

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto">
      <div className="flex items-center mb-4 sm:mb-8">
        <LayoutDashboard className="h-6 w-6 sm:h-8 sm:w-8 text-emerald-500 mr-2 sm:mr-3" />
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Painel Financeiro</h1>
      </div>
      
      {/* Cards superiores - ajuste do grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mb-3 sm:mb-6">
        {[
          {
            id: 'income',
            title: 'Receitas do Mês',
            value: monthlyIncome,
            icon: <ArrowUpCircle className="h-8 w-8 text-green-500" />,
            valueClass: 'text-green-600'
          },
          {
            id: 'expenses',
            title: 'Despesas do Mês',
            value: monthlyExpenses,
            icon: <ArrowDownCircle className="h-8 w-8 text-red-500" />,
            valueClass: 'text-red-600'
          },
          {
            id: 'balance',
            title: 'Saldo Total',
            value: currentBalance,
            icon: <TrendingUp className="h-8 w-8 text-blue-500" />,
            valueClass: currentBalance >= 0 ? 'text-blue-600' : 'text-red-600'
          }
        ].map((card) => (
          <div key={card.id} className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600">{card.title}</p>
                <p className={`text-lg sm:text-2xl font-bold ${card.valueClass}`}>
                  {formatCurrency(card.value)}
                </p>
              </div>
              {card.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Grid de informações - ajuste para mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6 mb-3 sm:mb-6">
        {/* Transações Recentes */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Transações Recentes</h2>
          <div className="space-y-4">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    {transaction.type === 'income' ? (
                      <ArrowUpCircle className="h-5 w-5 text-green-500 mr-3" />
                    ) : (
                      <ArrowDownCircle className="h-5 w-5 text-red-500 mr-3" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{transaction.description}</p>
                      <p className="text-xs text-gray-500">
                        {format(transaction.date, "dd 'de' MMMM", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                  <span className={`font-medium ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(transaction.amount)}
                  </span>
                </div>
              ))
            ) : (
              <div key="no-transactions" className="text-center py-6">
                <p className="text-gray-500">Nenhuma transação recente</p>
              </div>
            )}
          </div>
        </div>

        {/* Próximas Metas */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Próximas Metas</h2>
          <div className="space-y-4">
            {upcomingGoals.length > 0 ? (
              upcomingGoals.map((goal) => {
                const currentAmount = Math.min((goal.progress ?? 0) * goal.target_amount / 100, goal.target_amount);
                return (
                  <div key={goal.id} className="border-b pb-4 last:border-0">
                    <div className="flex justify-between items-start mb-2">
                      <div className="w-full">
                        <p className="text-sm font-medium text-gray-900">{goal.name}</p>
                        <p className="text-xs text-gray-500">
                          {formatCurrency(currentAmount)} de {formatCurrency(goal.target_amount)}
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${Math.min(goal.progress ?? 0, 100)}%` }}
                          ></div>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-gray-600 ml-4">
                        {Math.min(goal.progress ?? 0, 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">Nenhuma meta definida</p>
              </div>
            )}
          </div>
        </div>

        {/* Resumo dos Orçamentos */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Orçamentos do Mês</h2>
            <Link to="/budget" className="text-sm text-blue-600 hover:text-blue-700">
              Ver todos
            </Link>
          </div>

          <div className="space-y-4">
            {budgets.map(budget => {
              const monthStart = startOfMonth(new Date());
              const monthEnd = endOfMonth(new Date());

              console.log('Debug - Período de análise:', {
                categoria: budget.category,
                inicio: format(monthStart, 'dd/MM/yyyy'),
                fim: format(monthEnd, 'dd/MM/yyyy')
              });

              const transactionsForBudget = recentTransactions.filter(t => 
                t.category === budget.category && 
                t.type === 'expense' &&
                isWithinInterval(t.date, {
                  start: monthStart,
                  end: monthEnd
                })
              );

              console.log('Debug - Transações encontradas:', {
                categoria: budget.category,
                transacoes: transactionsForBudget.map(t => ({
                  data: format(t.date, 'dd/MM/yyyy'),
                  valor: t.amount
                }))
              });

              const spent = transactionsForBudget.reduce((sum, t) => sum + t.amount, 0);
              const percentage = (spent / budget.limit) * 100;

              console.log('Debug - Cálculos:', {
                categoria: budget.category,
                gasto: spent,
                limite: budget.limit,
                porcentagem: percentage
              });

              // Só mostrar orçamentos que precisam de atenção
              if (percentage < 80) {
                console.log('Debug - Orçamento ignorado (< 80%):', budget.category);
                return null;
              }

              return (
                <div key={budget.category} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`p-2 rounded-lg mr-3 
                      ${percentage >= 100 ? 'bg-red-100' : 'bg-yellow-100'}`}>
                      <PiggyBank className={`h-5 w-5 
                        ${percentage >= 100 ? 'text-red-600' : 'text-yellow-600'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {transactionCategories.find(cat => cat.id === budget.category)?.label}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatCurrency(spent)} de {formatCurrency(budget.limit)}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full
                    ${percentage >= 100 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-yellow-100 text-yellow-800'}`}>
                    {percentage.toFixed(0)}%
                  </span>
                </div>
              );
            }).filter(Boolean)}

            {/* Mensagem de controle apenas se não houver nenhum orçamento acima de 80% */}
            {budgets.length > 0 && !budgets.some(budget => {
              const spent = recentTransactions
                .filter(t => 
                  t.category === budget.category && 
                  t.type === 'expense' &&
                  isWithinInterval(t.date, {
                    start: startOfMonth(new Date()),
                    end: endOfMonth(new Date())
                  })
                )
                .reduce((sum, t) => sum + t.amount, 0);

              return (spent / budget.limit) * 100 >= 80;
            }) && (
              <div className="text-center py-6">
                <PiggyBank className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Seus orçamentos estão sob controle!</p>
              </div>
            )}

            {budgets.length === 0 && (
              <div className="text-center py-6">
                <PiggyBank className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Nenhum orçamento definido</p>
                <Link to="/budget" className="text-sm text-blue-600 hover:text-blue-700">
                  Definir orçamentos
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Resumo do Mês */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">Resumo do Mês</h2>
          <div className="space-y-4">
            {[
              {
                id: 'income-trend',
                label: 'Receitas vs Mês Anterior',
                value: monthlyIncome,
                comparison: monthlyIncome > monthlyTrend.previousMonth.income,
                type: 'income'
              },
              {
                id: 'expense-trend',
                label: 'Despesas vs Mês Anterior',
                value: monthlyExpenses,
                comparison: monthlyExpenses < monthlyTrend.previousMonth.expenses,
                type: 'expense'
              }
            ].map((item) => (
              <div key={item.id} className="flex flex-col">
                <p className="text-sm text-gray-600 mb-1">{item.label}</p>
                <div className="flex items-center">
                  <span className="text-lg font-medium text-gray-900">
                    {formatCurrency(item.value)}
                  </span>
                  <div key={`trend-${item.id}`}>
                    {item.comparison ? (
                      <TrendingUp 
                        className={`h-5 w-5 ml-2 ${
                          item.type === 'income' ? 'text-green-500' : 'text-red-500'
                        }`} 
                      />
                    ) : (
                      <TrendingDown 
                        className={`h-5 w-5 ml-2 ${
                          item.type === 'income' ? 'text-red-500' : 'text-green-500'
                        }`} 
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gráfico responsivo */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
          Evolução Financeira
        </h2>
        <div className="h-60 sm:h-80">
          <ResponsiveContainer>
            <AreaChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                contentStyle={{ backgroundColor: 'white', borderRadius: '0.5rem' }}
              />
              <Area 
                type="monotone" 
                dataKey="income" 
                name="Receitas" 
                fill="#10B981" 
                stroke="#059669" 
                fillOpacity={0.6}
              />
              <Area 
                type="monotone" 
                dataKey="expenses" 
                name="Despesas" 
                fill="#EF4444" 
                stroke="#DC2626" 
                fillOpacity={0.6}
              />
              <Area 
                type="monotone" 
                dataKey="balance" 
                name="Saldo" 
                fill="#3B82F6" 
                stroke="#2563EB" 
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
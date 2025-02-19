import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, 
  ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, RadarChart, Radar, PolarGrid, 
  PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { transactionCategories } from '../utils/categories';
import { TrendingUp, PieChart as PieChartIcon, BarChart2, Calendar } from 'lucide-react';
import { useFormatCurrency } from '../utils/formatCurrency';

interface Transaction {
  amount: number;
  type: 'income' | 'expense';
  date: Date;
  category: string;
}

interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  balance: number;
}

interface CategoryData {
  category: string;
  amount: number;
}

export default function Charts() {
  const { user } = useAuth();
  const { currentWallet } = useWallet();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [trendData, setTrendData] = useState<MonthlyData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('6');
  const [selectedChart, setSelectedChart] = useState<
    'trend' | 'category' | 'comparison' | 'daily' | 'balance' | 'categories-pie'
  >('trend');
  const [dateRange, setDateRange] = useState({ start: new Date(), end: new Date() });
  const formatCurrency = useFormatCurrency();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#ff0000', '#00ff00', '#0000ff'];

  useEffect(() => {
    if (user && currentWallet) {
      fetchTransactions();
    }
  }, [user, currentWallet, selectedPeriod, dateRange]);

  const fetchTransactions = async () => {
    if (!user || !currentWallet) return;

    const months = Number(selectedPeriod);
    const lastMonths = Array.from({ length: months }, (_, i) => {
      const date = subMonths(new Date(), i);
      return {
        start: startOfMonth(date),
        end: endOfMonth(date),
        monthLabel: format(date, 'MMM/yyyy')
      };
    }).reverse();

    const transactionsRef = collection(db, 'transactions');
    const q = query(
      transactionsRef,
      where('walletId', '==', currentWallet.id)
    );

    const querySnapshot = await getDocs(q);
    const fetchedTransactions = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      date: doc.data().date.toDate()
    })) as Transaction[];

    setTransactions(fetchedTransactions);

    // Filtra as transações pelo período selecionado
    const filteredTransactions = fetchedTransactions.filter(t => 
      t.date >= lastMonths[0].start && t.date <= lastMonths[lastMonths.length - 1].end
    );

    // Dados de tendência mensal
    const monthlyData = lastMonths.map(({ start, end, monthLabel }) => {
      const monthTransactions = filteredTransactions.filter(
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

    // Dados por categoria
    const expensesByCategory = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, transaction) => {
        const category = transactionCategories.find(cat => cat.id === transaction.category)?.label || transaction.category;
        acc[category] = (acc[category] || 0) + transaction.amount;
        return acc;
      }, {} as Record<string, number>);

    const categoryDataArray = Object.entries(expensesByCategory)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);

    setCategoryData(categoryDataArray);
  };

  const chartTypes = {
    'trend': {
      title: 'Evolução Financeira',
      icon: TrendingUp,
      content: () => (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Evolução do Saldo</h2>
          <div className="h-96">
            <ResponsiveContainer>
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => formatCurrency(value)} />
                <Legend />
                <Area type="monotone" dataKey="income" name="Receitas" fill="#10B981" stroke="#059669" />
                <Area type="monotone" dataKey="expenses" name="Despesas" fill="#EF4444" stroke="#DC2626" />
                <Area type="monotone" dataKey="balance" name="Saldo" fill="#3B82F6" stroke="#2563EB" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )
    },

    'daily': {
      title: 'Gastos Diários',
      icon: Calendar,
      content: () => {
        const dailyExpenses = transactions
          .filter(t => t.type === 'expense')
          .reduce((acc, t) => {
            const day = format(t.date, 'dd/MM');
            acc[day] = (acc[day] || 0) + t.amount;
            return acc;
          }, {} as Record<string, number>);

        const dailyData = Object.entries(dailyExpenses).map(([day, amount]) => ({
          day,
          amount
        }));

        return (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Gastos por Dia</h2>
            <div className="h-96">
              <ResponsiveContainer>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="amount" name="Valor" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      }
    },

    'category-radar': {
      title: 'Análise por Categoria',
      icon: PieChartIcon,
      content: () => {
        const categoryData = transactions
          .filter(t => t.type === 'expense')
          .reduce((acc, t) => {
            const category = transactionCategories.find(cat => cat.id === t.category)?.label || t.category;
            acc[category] = (acc[category] || 0) + t.amount;
            return acc;
          }, {} as Record<string, number>);

        const radarData = Object.entries(categoryData).map(([category, amount]) => ({
          category,
          amount
        }));

        return (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Distribuição de Gastos</h2>
            <div className="h-96">
              <ResponsiveContainer>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="category" />
                  <PolarRadiusAxis />
                  <Radar
                    name="Valor"
                    dataKey="amount"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.6}
                  />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      }
    },

    'income-expense-ratio': {
      title: 'Proporção Receitas/Despesas',
      icon: PieChartIcon,
      content: () => {
        const income = transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        
        const expenses = transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        const data = [
          { name: 'Receitas', value: income },
          { name: 'Despesas', value: expenses }
        ];

        return (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Proporção Receitas/Despesas</h2>
            <div className="h-96">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={data}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={150}
                    fill="#8884d8"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    <Cell fill="#10B981" />
                    <Cell fill="#EF4444" />
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      }
    },

    'categories-pie': {
      title: 'Categorias (Pizza)',
      icon: PieChartIcon,
      content: () => {
        const categoryData = transactions
          .filter(t => t.type === 'expense')
          .reduce((acc, t) => {
            const category = transactionCategories.find(cat => cat.id === t.category)?.label || t.category;
            acc[category] = (acc[category] || 0) + t.amount;
            return acc;
          }, {} as Record<string, number>);

        const pieData = Object.entries(categoryData)
          .map(([category, amount]) => ({
            name: category,
            value: amount
          }));

        return (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Distribuição de Gastos</h2>
            <div className="h-96">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={150}
                    fill="#8884d8"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      }
    },

    'balance': {
      title: 'Saldo Acumulado',
      icon: TrendingUp,
      content: () => {
        const balanceData = trendData.map((data, index) => ({
          month: data.month,
          balance: trendData
            .slice(0, index + 1)
            .reduce((sum, item) => sum + (item.income - item.expenses), 0)
        }));

        return (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Saldo Acumulado</h2>
            <div className="h-96">
              <ResponsiveContainer>
                <LineChart data={balanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Line 
                    type="monotone" 
                    dataKey="balance" 
                    stroke="#3B82F6" 
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    name="Saldo"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      }
    }
  };

  // Renderiza apenas o gráfico selecionado
  const renderSelectedChart = () => {
    const chart = chartTypes[selectedChart === 'category' ? 'category-radar' : 
                           selectedChart === 'comparison' ? 'income-expense-ratio' : 
                           selectedChart];
    
    return chart ? (
      <div className="bg-white rounded-xl shadow-sm p-6">
        {chart.content()}
      </div>
    ) : null;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center mb-8">
        <BarChart2 className="h-8 w-8 text-indigo-500 mr-3" />
        <h1 className="text-3xl font-bold text-gray-900">Gráficos</h1>
      </div>

      {/* Filtros de período */}
      <div className="flex justify-between items-center mb-8">
        <div className="flex space-x-4">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="3">Últimos 3 meses</option>
            <option value="6">Últimos 6 meses</option>
            <option value="12">Último ano</option>
          </select>
        </div>
      </div>

      {/* Seletor de Gráficos */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
        <div className="flex space-x-4 overflow-x-auto pb-2">
          {[
            { id: 'trend', label: 'Evolução Financeira', icon: TrendingUp },
            { id: 'daily', label: 'Gastos Diários', icon: Calendar },
            { id: 'category', label: 'Radar de Categorias', icon: PieChartIcon },
            { id: 'categories-pie', label: 'Pizza de Categorias', icon: PieChartIcon },
            { id: 'comparison', label: 'Receitas vs Despesas', icon: BarChart2 },
            { id: 'balance', label: 'Saldo Acumulado', icon: TrendingUp },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setSelectedChart(id as typeof selectedChart)}
              className={`flex items-center px-4 py-2 rounded-lg transition-colors whitespace-nowrap ${
                selectedChart === id ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Icon className="h-5 w-5 mr-2" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Renderiza apenas o gráfico selecionado */}
      {renderSelectedChart()}
    </div>
  );
}
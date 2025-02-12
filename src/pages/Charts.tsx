import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { transactionCategories } from '../utils/categories';
import { TrendingUp, PieChart as PieChartIcon, BarChart2 } from 'lucide-react';
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
  const [trendData, setTrendData] = useState<MonthlyData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState('6');
  const [selectedChart, setSelectedChart] = useState<'trend' | 'category' | 'comparison'>('trend');
  const formatCurrency = useFormatCurrency();

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#ff0000', '#00ff00', '#0000ff'];

  useEffect(() => {
    if (user && currentWallet) {
      fetchTransactions();
    }
  }, [user, currentWallet]);

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
    const transactions = querySnapshot.docs.map(doc => ({
      ...doc.data(),
      date: doc.data().date.toDate()
    })) as Transaction[];

    // Filtra as transações pelo período selecionado
    const filteredTransactions = transactions.filter(t => 
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

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center mb-8">
        <BarChart2 className="h-8 w-8 text-indigo-500 mr-3" />
        <h1 className="text-3xl font-bold text-gray-900">Gráficos</h1>
      </div>
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
        <div className="flex space-x-4">
          <button
            onClick={() => setSelectedChart('trend')}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              selectedChart === 'trend' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <TrendingUp className="h-5 w-5 mr-2" />
            Evolução Financeira
          </button>
          <button
            onClick={() => setSelectedChart('category')}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              selectedChart === 'category' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <PieChartIcon className="h-5 w-5 mr-2" />
            Gastos por Categoria
          </button>
          <button
            onClick={() => setSelectedChart('comparison')}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              selectedChart === 'comparison' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <BarChart2 className="h-5 w-5 mr-2" />
            Comparativo Mensal
          </button>
        </div>
      </div>

      {/* Gráficos */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        {selectedChart === 'trend' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Evolução Financeira</h2>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                    labelStyle={{ color: '#374151' }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="income"
                    stroke="#10B981"
                    name="Receitas"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    stroke="#EF4444"
                    name="Despesas"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    stroke="#3B82F6"
                    name="Saldo"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {selectedChart === 'category' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Gastos por Categoria</h2>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="amount"
                    nameKey="category"
                    cx="50%"
                    cy="50%"
                    outerRadius={150}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {selectedChart === 'comparison' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Comparativo Mensal</h2>
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend />
                  <Bar dataKey="income" name="Receitas" fill="#10B981" />
                  <Bar dataKey="expenses" name="Despesas" fill="#EF4444" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
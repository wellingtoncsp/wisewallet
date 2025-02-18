import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useWallet } from '../contexts/WalletContext';
import { useFormatCurrency } from '../utils/formatCurrency';
import { 
  BarChart2, 
  TrendingUp, 
  Target, 
  List,
  Download,
  FileText,
  PieChart,
  Calendar,
  Filter,
  FileType2,
  FileSpreadsheet
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, startOfDay, endOfDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { transactionCategories, getCategoryLabel } from '../utils/categories';

interface Transaction {
  id: string;
  amount: number;
  type: 'income' | 'expense';
  date: Date;
  description: string;
  category: string;
}

interface Goal {
  id: string;
  name: string;
  target_amount: number;
  current_amount?: number;
  deadline: Date;
  priority: number;
  completed?: boolean;
}

interface Report {
  title: string;
  icon: React.ElementType;
  content: () => JSX.Element;
}

declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

export default function Reports() {
  const { user } = useAuth();
  const { currentWallet } = useWallet();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<string>('1');
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    const firstDay = startOfMonth(today);
    const lastDay = endOfMonth(today);
    return {
      startDate: format(firstDay, 'yyyy-MM-dd'),
      endDate: format(lastDay, 'yyyy-MM-dd')
    };
  });
  const [selectedReport, setSelectedReport] = useState<string>('income-expense');
  const formatCurrency = useFormatCurrency();

  useEffect(() => {
    if (user && currentWallet) {
      fetchData();
    }
  }, [user, currentWallet, dateRange]);

  const fetchData = async () => {
    if (!user || !currentWallet) return;

    const transactionsRef = collection(db, 'transactions');
    const q = query(
      transactionsRef,
      where('walletId', '==', currentWallet.id)
    );
    const querySnapshot = await getDocs(q);
    
    const fetchedTransactions = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      date: doc.data().date.toDate()
    })) as Transaction[];

    setTransactions(fetchedTransactions);

    const goalsRef = collection(db, 'goals');
    const goalsQuery = query(
      goalsRef, 
      where('walletId', '==', currentWallet.id)
    );
    const goalsSnapshot = await getDocs(goalsQuery);
    
    const fetchedGoals = goalsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      deadline: doc.data().deadline.toDate()
    })) as Goal[];

    setGoals(fetchedGoals);
  };

  const getFilteredTransactions = () => {
    const start = startOfDay(parseISO(dateRange.startDate));
    const end = endOfDay(parseISO(dateRange.endDate));

    console.log('Filtro atual:', {
      inicio: format(start, 'dd/MM/yyyy'),
      fim: format(end, 'dd/MM/yyyy')
    });

    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      const isWithinRange = transactionDate >= start && transactionDate <= end;
      
      console.log('Verificando transação:', {
        data: format(transactionDate, 'dd/MM/yyyy'),
        dentroDoIntervalo: isWithinRange
      });

      return isWithinRange;
    });
  };

  useEffect(() => {
    const today = new Date();
    let startDate: Date;
    let endDate: Date = today;

    switch (selectedPeriod) {
      case '1': // Mês atual
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
        break;
      case '3': // Últimos 3 meses
        startDate = startOfMonth(subMonths(today, 2));
        endDate = endOfMonth(today);
        break;
      case '6': // Últimos 6 meses
        startDate = startOfMonth(subMonths(today, 5));
        endDate = endOfMonth(today);
        break;
      case '12': // Últimos 12 meses
        startDate = startOfMonth(subMonths(today, 11));
        endDate = endOfMonth(today);
        break;
      case 'all': // Todos
        startDate = new Date('2000-01-01');
        endDate = today;
        break;
      default:
        startDate = startOfMonth(today);
        endDate = endOfMonth(today);
    }

    setDateRange({
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd')
    });
  }, [selectedPeriod]);

  const reports: Record<string, Report> = {
    'income-expense': {
      title: 'Receitas vs. Despesas',
      icon: BarChart2,
      content: () => {
        const filtered = getFilteredTransactions();
        const income = filtered
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0);
        const expenses = filtered
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + t.amount, 0);

        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-green-700">Receitas</h3>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(income)}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-red-700">Despesas</h3>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(expenses)}</p>
              </div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-blue-700">Saldo</h3>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(income - expenses)}</p>
            </div>
          </div>
        );
      }
    },
    'monthly-balance': {
      title: 'Saldo Mensal',
      icon: TrendingUp,
      content: () => {
        const filtered = getFilteredTransactions();
        
        console.log('Transações filtradas:', filtered.map(t => ({
          data: format(t.date, 'dd/MM/yyyy'),
          valor: t.amount,
          tipo: t.type
        })));
        
        // Agrupar transações por mês usando a data filtrada
        const monthlyData = filtered.reduce((acc, transaction) => {
          const monthKey = format(transaction.date, 'yyyy-MM');
          
          console.log('Processando transação:', {
            data: format(transaction.date, 'dd/MM/yyyy'),
            monthKey,
            valor: transaction.amount,
            tipo: transaction.type
          });
          
          if (!acc[monthKey]) {
            acc[monthKey] = { income: 0, expenses: 0 };
          }
          
          if (transaction.type === 'income') {
            acc[monthKey].income += transaction.amount;
          } else {
            acc[monthKey].expenses += transaction.amount;
          }
          
          return acc;
        }, {} as Record<string, { income: number; expenses: number }>);

        console.log('Dados mensais agrupados:', monthlyData);

        // Ordenar os meses em ordem decrescente
        const sortedMonths = Object.entries(monthlyData)
          .sort((a, b) => {
            const dateA = parseISO(a[0] + '-01');
            const dateB = parseISO(b[0] + '-01');
            return dateB.getTime() - dateA.getTime();
          });

        console.log('Meses ordenados:', sortedMonths.map(([month, data]) => ({
          mes: format(parseISO(month + '-01'), 'MMMM yyyy', { locale: ptBR }),
          receitas: data.income,
          despesas: data.expenses
        })));

        return (
          <div className="space-y-4">
            {sortedMonths.map(([month, data]) => (
              <div key={month} className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-700">
                  {format(parseISO(month + '-01'), 'MMMM yyyy', { locale: ptBR })}
                </h3>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-green-600">
                    Receitas: {formatCurrency(data.income)}
                  </p>
                  <p className="text-sm text-red-600">
                    Despesas: {formatCurrency(data.expenses)}
                  </p>
                  <p className="text-sm font-medium text-blue-600">
                    Saldo: {formatCurrency(data.income - data.expenses)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        );
      }
    },
    'categories': {
      title: 'Análise por Categorias',
      icon: PieChart,
      content: () => {
        const filtered = getFilteredTransactions();
        const categoryData = filtered.reduce((acc, transaction) => {
          const categoryLabel = getCategoryLabel(transaction.category);
          if (!acc[categoryLabel]) {
            acc[categoryLabel] = 0;
          }
          acc[categoryLabel] += transaction.amount;
          return acc;
        }, {} as Record<string, number>);

        return (
          <div className="space-y-4">
            {Object.entries(categoryData)
              .sort((a, b) => b[1] - a[1])
              .map(([category, total]) => (
                <div key={category} className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium text-gray-700">
                      {category}
                    </h3>
                    <p className="text-lg font-medium text-red-600">
                      {formatCurrency(total)}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        );
      }
    },
    'goals': {
      title: 'Progresso das Metas',
      icon: Target,
      content: () => (
        <div className="space-y-4">
          {goals.map(goal => {
            const progress = getGoalProgress(goal);
            return (
              <div key={goal.id} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-medium text-gray-700">{goal.name}</h3>
                    <p className="text-sm text-gray-500">
                      Meta: {formatCurrency(goal.target_amount)}
                    </p>
                  </div>
                  <span className={`text-sm font-medium ${
                    goal.completed ? 'text-green-600' : 'text-blue-600'
                  }`}>
                    {goal.completed ? 'Concluída' : `${Math.round(progress)}%`}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      goal.completed ? 'bg-green-600' : 'bg-blue-600'
                    }`}
                    style={{ width: `${Math.min(progress, 100)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )
    },
    'transactions': {
      title: 'Transações Detalhadas',
      icon: List,
      content: () => {
        const filtered = getFilteredTransactions();
        return (
          <div className="space-y-4">
            {filtered.map(transaction => (
              <div key={transaction.id} className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-700">
                      {transaction.description}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {format(transaction.date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                    <p className="text-sm text-gray-500">
                      {transactionCategories.find(c => c.label === transaction.category)?.label}
                    </p>
                  </div>
                  <span className={`font-medium ${
                    transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatCurrency(transaction.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        );
      }
    }
  };

  const getGoalProgress = (goal: Goal) => {
    if (goal.completed) return 100;
    
    const totalTransactions = transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    return (totalTransactions / goal.target_amount) * 100;
  };

  const addReportHeader = (doc: jsPDF) => {
    const title = reports[selectedReport].title;
    const now = new Date();
    
    // Configurações do cabeçalho
    doc.setFontSize(20);
    doc.text(title, 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Gerado em: ${format(now, "dd/MM/yyyy 'às' HH:mm:ss")}`, 20, 30);
    
    return 60; // Retorna a posição Y após o cabeçalho
  };

  const getExcelHeader = () => {
    const title = reports[selectedReport].title;
    const now = new Date();

    return [
      [title],
      [''],
      ['Informações do Relatório:'],
      [`Período: ${format(new Date(dateRange.startDate), 'dd/MM/yyyy')} até ${format(new Date(dateRange.endDate), 'dd/MM/yyyy')}`],
      [`Gerado em: ${format(now, "dd/MM/yyyy 'às' HH:mm:ss")}`],
      [`Usuário: ${user?.displayName || 'Não identificado'}`],
      [`Email: ${user?.email || 'Não identificado'}`],
      [''] // Linha em branco antes dos dados
    ];
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const filtered = getFilteredTransactions();
    
    // Adiciona o cabeçalho e obtém a posição Y para iniciar o conteúdo
    const startY = addReportHeader(doc);

    // Conteúdo específico para cada tipo de relatório
    switch (selectedReport) {
      case 'income-expense': {
        const income = filtered.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expenses = filtered.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        
        doc.autoTable({
          startY,
          head: [['Tipo', 'Valor']],
          body: [
            ['Receitas', formatCurrency(income)],
            ['Despesas', formatCurrency(expenses)],
            ['Saldo', formatCurrency(income - expenses)]
          ]
        });
        break;
      }

      case 'monthly-balance': {
        const monthlyData = filtered.reduce((acc, transaction) => {
          const monthKey = format(transaction.date, 'yyyy-MM');
          if (!acc[monthKey]) {
            acc[monthKey] = { income: 0, expenses: 0 };
          }
          if (transaction.type === 'income') {
            acc[monthKey].income += transaction.amount;
          } else {
            acc[monthKey].expenses += transaction.amount;
          }
          return acc;
        }, {} as Record<string, { income: number; expenses: number }>);

        const tableData = Object.entries(monthlyData).map(([month, data]) => [
          format(new Date(month), 'MMMM yyyy', { locale: ptBR }),
          formatCurrency(data.income),
          formatCurrency(data.expenses),
          formatCurrency(data.income - data.expenses)
        ]);

        doc.autoTable({
          startY,
          head: [['Mês', 'Receitas', 'Despesas', 'Saldo']],
          body: tableData
        });
        break;
      }

      case 'categories': {
        const categoryData = filtered.reduce((acc, transaction) => {
          const categoryLabel = getCategoryLabel(transaction.category);
          if (!acc[categoryLabel]) {
            acc[categoryLabel] = 0;
          }
          acc[categoryLabel] += transaction.amount;
          return acc;
        }, {} as Record<string, number>);

        const tableData = Object.entries(categoryData)
          .sort((a, b) => b[1] - a[1])
          .map(([category, total]) => [
            category,
            formatCurrency(total)
          ]);

        doc.autoTable({
          startY,
          head: [['Categoria', 'Total']],
          body: tableData
        });
        break;
      }

      case 'goals': {
        const tableData = goals.map(goal => [
          goal.name,
          formatCurrency(goal.target_amount),
          `${Math.round(getGoalProgress(goal))}%`,
          goal.completed ? 'Concluída' : 'Em andamento'
        ]);

        doc.autoTable({
          startY,
          head: [['Meta', 'Valor Alvo', 'Progresso', 'Status']],
          body: tableData
        });
        break;
      }

      case 'transactions': {
        const tableData = filtered.map(transaction => [
          format(transaction.date, 'dd/MM/yyyy'),
          transaction.description,
          transactionCategories.find(c => c.label === transaction.category)?.label || transaction.category,
          transaction.type === 'income' ? 'Receita' : 'Despesa',
          formatCurrency(transaction.amount)
        ]);

        doc.autoTable({
          startY,
          head: [['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor']],
          body: tableData
        });
        break;
      }
    }

    doc.save(`relatorio-${selectedReport === 'goals' ? 'metas' : selectedReport}-${format(new Date(), 'yyyyMMdd-HHmmss')}.pdf`);
  };

  const exportExcel = () => {
    const filtered = getFilteredTransactions();
    let reportData: any[] = [];

    // Adiciona o cabeçalho do relatório
    reportData = [...getExcelHeader()];

    // Preparar dados específicos para cada tipo de relatório
    switch (selectedReport) {
      case 'income-expense': {
        const income = filtered.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expenses = filtered.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        
        reportData.push(
          ['Tipo', 'Valor'],
          ['Receitas', formatCurrency(income)],
          ['Despesas', formatCurrency(expenses)],
          ['Saldo', formatCurrency(income - expenses)]
        );
        break;
      }

      case 'monthly-balance': {
        const monthlyData = filtered.reduce((acc, transaction) => {
          const monthKey = format(transaction.date, 'yyyy-MM');
          if (!acc[monthKey]) {
            acc[monthKey] = { income: 0, expenses: 0 };
          }
          if (transaction.type === 'income') {
            acc[monthKey].income += transaction.amount;
          } else {
            acc[monthKey].expenses += transaction.amount;
          }
          return acc;
        }, {} as Record<string, { income: number; expenses: number }>);

        reportData.push(
          ['Mês', 'Receitas', 'Despesas', 'Saldo'],
          ...Object.entries(monthlyData).map(([month, values]) => [
            format(new Date(month), 'MMMM yyyy', { locale: ptBR }),
            formatCurrency(values.income),
            formatCurrency(values.expenses),
            formatCurrency(values.income - values.expenses)
          ])
        );
        break;
      }

      case 'categories': {
        const categoryData = filtered.reduce((acc, transaction) => {
          const categoryLabel = getCategoryLabel(transaction.category);
          if (!acc[categoryLabel]) {
            acc[categoryLabel] = 0;
          }
          acc[categoryLabel] += transaction.amount;
          return acc;
        }, {} as Record<string, number>);

        reportData.push(
          ['Categoria', 'Total'],
          ...Object.entries(categoryData)
            .sort((a, b) => b[1] - a[1])
            .map(([category, total]) => [
              category,
              formatCurrency(total)
            ])
        );
        break;
      }

      case 'goals': {
        reportData.push(
          ['Meta', 'Valor Alvo', 'Progresso', 'Status'],
          ...goals.map(goal => [
            goal.name,
            formatCurrency(goal.target_amount),
            `${Math.round(getGoalProgress(goal))}%`,
            goal.completed ? 'Concluída' : 'Em andamento'
          ])
        );
        break;
      }

      case 'transactions': {
        reportData.push(
          ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor'],
          ...filtered.map(transaction => [
            format(transaction.date, 'dd/MM/yyyy'),
            transaction.description,
            transactionCategories.find(c => c.label === transaction.category)?.label || transaction.category,
            transaction.type === 'income' ? 'Receita' : 'Despesa',
            formatCurrency(transaction.amount)
          ])
        );
        break;
      }
    }

    const ws = XLSX.utils.aoa_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Relatório");
    
    // Nome do arquivo inclui timestamp para evitar sobrescrita
    XLSX.writeFile(wb, `relatorio-${selectedReport === 'goals' ? 'metas' : selectedReport}-${format(new Date(), 'yyyyMMdd-HHmmss')}.xlsx`);
  };

  const handlePeriodChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const period = event.target.value;
    setSelectedPeriod(period);

    const today = new Date();
    let startDate: Date;
    let endDate: Date = today;

    switch (period) {
      case '1': // Mês atual
        startDate = startOfMonth(today);
        break;
      case '3': // Últimos 3 meses
        startDate = startOfMonth(subMonths(today, 2));
        break;
      case '6': // Últimos 6 meses
        startDate = startOfMonth(subMonths(today, 5));
        break;
      case '12': // Últimos 12 meses
        startDate = startOfMonth(subMonths(today, 11));
        break;
      case 'all': // Todos
        startDate = new Date('2000-01-01');
        break;
      default:
        startDate = today;
    }

    setDateRange({
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd')
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <FileText className="h-8 w-8 text-blue-500 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
        </div>
      </div>

      {/* Cards de Relatórios */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {Object.entries(reports).map(([key, report]) => {
          const Icon = report.icon;
          return (
            <button
              key={key}
              onClick={() => setSelectedReport(key)}
              className={`p-6 rounded-xl shadow-sm transition-all ${
                selectedReport === key
                  ? 'bg-blue-50 border-2 border-blue-500'
                  : 'bg-white hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <div className="flex items-center mb-4">
                <Icon className={`h-6 w-6 ${
                  selectedReport === key ? 'text-blue-500' : 'text-gray-500'
                } mr-3`} />
                <h2 className={`text-lg font-semibold ${
                  selectedReport === key ? 'text-blue-700' : 'text-gray-700'
                }`}>
                  {report.title}
                </h2>
              </div>
              <p className="text-sm text-gray-500 text-left">
                {getReportDescription(key)}
              </p>
            </button>
          );
        })}
      </div>

      {/* Área do Relatório Selecionado */}
      {selectedReport && (
        <div className="bg-white rounded-xl shadow-sm">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {reports[selectedReport].title}
              </h2>
              <div className="flex items-center space-x-4">
                <button 
                  onClick={exportPDF} 
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors"
                >
                  <FileType2 className="h-4 w-4 mr-2" />
                  PDF
                </button>
                <button 
                  onClick={exportExcel} 
                  className="flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
                >
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Excel
                </button>
              </div>
            </div>

            {/* Filtros */}
            <div className="mt-6">
              {selectedReport === 'monthly-balance' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Selecionar Período</label>
                  <select
                    value={selectedPeriod}
                    onChange={handlePeriodChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  >
                    <option value="1">Mês Atual</option>
                    <option value="3">Últimos 3 Meses</option>
                    <option value="6">Últimos 6 Meses</option>
                    <option value="12">Últimos 12 Meses</option>
                    <option value="all">Todos</option>
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data Início</label>
                    <input
                      type="date"
                      value={dateRange.startDate}
                      onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data Fim</label>
                    <input
                      type="date"
                      value={dateRange.endDate}
                      onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Conteúdo do Relatório */}
          <div className="p-6">
            {reports[selectedReport].content()}
          </div>
        </div>
      )}
    </div>
  );
}

// Função auxiliar para descrições dos relatórios
function getReportDescription(key: string): string {
  switch (key) {
    case 'income-expense':
      return 'Comparação detalhada entre receitas e despesas no período selecionado';
    case 'monthly-balance':
      return 'Evolução do saldo ao longo dos meses';
    case 'categories':
      return 'Análise de gastos por categoria';
    case 'goals':
      return 'Acompanhamento do progresso das metas financeiras';
    case 'transactions':
      return 'Lista detalhada de todas as transações com filtros avançados';
    default:
      return '';
  }
} 
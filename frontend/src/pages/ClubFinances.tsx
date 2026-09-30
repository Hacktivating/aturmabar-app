import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, Wallet, Search, ArrowUpRight, ArrowDownRight, 
  Download, ChevronDown, RefreshCcw, X, Plus, LogOut, 
  Globe, Sun, Moon, Settings as SettingsIcon, TrendingUp,
  ChevronLeft, ChevronRight, Zap, Activity, PieChart, BarChart2
} from 'lucide-react';
import api from '../api/axios';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function ClubFinances() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  
  const [isDark, setIsDark] = useState(() => localStorage.getItem('theme') === 'dark');
  const [communityData, setCommunityData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all'); 
  const [timeFilter, setTimeFilter] = useState('all'); // 'all' or 'month'
  const [catType, setCatType] = useState<'all'|'income'|'expense'>('all'); // 3-Mode Toggle
  const [hoveredCat, setHoveredCat] = useState<string | null>(null); // Interactive Donut State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const [isTransactionModalOpen, setTransactionModalOpen] = useState(false);
  const [transactionForm, setTransactionForm] = useState({ description: '', amount: '', type: 'expense', category: 'EXPENSE' });

  const [finances, setFinances] = useState({
    transactions: [] as any[]
  });

  useEffect(() => {
    if (isDark) { document.documentElement.classList.add('dark'); localStorage.setItem('theme', 'dark'); }
    else { document.documentElement.classList.remove('dark'); localStorage.setItem('theme', 'light'); }
  }, [isDark]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filterType, timeFilter]);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'id' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // -------------------------------------------------------------
  // SECURE AGGREGATOR: CORRECTLY FETCHES & MERGES EXPENSES
  // -------------------------------------------------------------
  const fetchFinances = useCallback(async (showIndicator = false) => {
    if (showIndicator) setIsRefreshing(true);
    try {
      const userRes = await api.get('/users/me').catch(() => null);
      if (userRes) setCommunityData(userRes.data.community);

      const sessionsRes = await api.get('/sessions').catch(() => ({ data: [] }));
      const sessions = sessionsRes.data;

      const aggregatedTransactions: any[] = [];

      const sessionPromises = sessions.map(async (s: any) => {
        try {
          const [detailRes, attRes] = await Promise.all([
            api.get(`/sessions/${s.id}`).catch(() => ({ data: s })),
            api.get(`/sessions/${s.id}/attendances`).catch(() => ({ data: [] }))
          ]);

          const sessionDetail = detailRes.data;
          const attendances = attRes.data || [];
          const expenses = sessionDetail.expenses || s.expenses || []; 

          // 1. Calculate Merged Session Income
          const sessionIncome = attendances.reduce((sum: number, a: any) => {
            const status = a.attendance?.paymentStatus || a.paymentStatus || 'unpaid';
            const amount = a.attendance?.paymentAmount || a.paymentAmount || 0;
            if (status === 'paid' || status === 'member') return sum + Number(amount);
            return sum;
          }, 0);
          
          if (sessionIncome > 0) {
            aggregatedTransactions.push({ 
              id: `inc-${s.id}`, 
              date: s.date, 
              description: `Session Revenue: ${s.name}`, 
              type: 'income', 
              amount: sessionIncome, 
              category: 'SESSION' 
            });
          }

          // 2. Calculate Merged Session Expenses (Outflow)
          let sessionTotalExpense = 0;
          expenses.forEach((e: any) => {
            sessionTotalExpense += Number(e.amount || 0);
          });

          if (sessionTotalExpense > 0) {
            aggregatedTransactions.push({ 
              id: `exp-${s.id}-merged`, 
              date: s.date, 
              description: `Session Expenses: ${s.name}`, 
              type: 'expense', 
              amount: sessionTotalExpense, 
              category: 'EXPENSE' 
            });
          }
        } catch (e) {
          console.error(`Error processing session ${s.id}`, e);
        }
      });

      await Promise.all(sessionPromises);

      // 3. Add Manual Global Transactions
      let manualTransactions: any[] = [];
      try {
        const manualRes = await api.get('/finances/transactions');
        manualTransactions = manualRes.data || [];
      } catch (e) {}

      // 4. Combine & Sort
      const allTransactions = [...aggregatedTransactions, ...manualTransactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setFinances({ transactions: allTransactions });
    } catch (error) {
      console.error("Failed to aggregate finances", error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchFinances();
  }, [fetchFinances]);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsRefreshing(true);
    try {
      await api.post('/finances/transactions', {
        description: transactionForm.description,
        amount: parseInt(transactionForm.amount),
        type: transactionForm.type,
        category: transactionForm.category,
        date: new Date().toISOString()
      });
      setTransactionModalOpen(false);
      setTransactionForm({ description: '', amount: '', type: 'expense', category: 'EXPENSE' });
      fetchFinances(true);
    } catch (err) {
      console.error("Failed to add transaction", err);
      alert("Error: /finances/transactions route required on backend.");
      setIsRefreshing(false);
    }
  };

  // -------------------------------------------------------------
  // FILTERING, CHART DATA, & CATEGORIZATION
  // -------------------------------------------------------------
  
  const timeFilteredData = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return finances.transactions.filter(t => {
      if (timeFilter === 'month') {
        const txDate = new Date(t.date);
        return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
      }
      return true;
    });
  }, [finances.transactions, timeFilter]);

  // Card Metrics
  const { cardIncome, cardExpense, cardBalance } = useMemo(() => {
    let inc = 0; let exp = 0;
    timeFilteredData.forEach(t => {
      if (t.type === 'income') inc += Number(t.amount);
      if (t.type === 'expense') exp += Number(t.amount);
    });
    return { cardIncome: inc, cardExpense: exp, cardBalance: inc - exp };
  }, [timeFilteredData]);

  // Dynamic 3-Mode Categorization Data (Overview, Inflow, Outflow)
  const categoryData = useMemo(() => {
    const filtered = timeFilteredData.filter(t => catType === 'all' ? true : t.type === catType);
    const total = filtered.reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);
    
    const groups = filtered.reduce((acc: any, t) => {
      acc[t.category] = (acc[t.category] || 0) + Math.abs(Number(t.amount));
      return acc;
    }, {});

    const categoryColors: Record<string, string> = {
      'EQUIPMENT': '#8b5cf6', // Violet
      'VENUE': '#10b981',     // Emerald
      'SESSION': '#3b82f6',   // Blue
      'EXPENSE': '#f43f5e',   // Rose
      'OTHER': '#f59e0b',     // Amber
    };

    const fallbackColors = ['#f472b6', '#38bdf8', '#fbbf24', '#a3e635', '#c084fc'];
    let colorIndex = 0;
    let currentOffset = 0;

    const dataList = Object.entries(groups)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .map(([name, amount]) => {
        let color = categoryColors[name];
        if (!color) {
          color = fallbackColors[colorIndex % fallbackColors.length];
          colorIndex++;
        }
        const percent = total > 0 ? ((amount as number) / total) * 100 : 0;
        const offset = currentOffset;
        currentOffset += percent;
        
        return {
          name,
          amount: amount as number,
          percent,
          color,
          offset
        };
      });

    return { total, list: dataList };
  }, [timeFilteredData, catType]);

  const activeHoverData = useMemo(() => {
    if (!hoveredCat) return null;
    return categoryData.list.find(c => c.name === hoveredCat) || null;
  }, [hoveredCat, categoryData]);

  // CSS Donut Chart Generator
  const donutGradient = useMemo(() => {
    if (categoryData.list.length === 0) return 'conic-gradient(#27272a 0% 100%)';
    let gradientStops = [];
    let currentPercent = 0;
    for (const cat of categoryData.list) {
      gradientStops.push(`${cat.color} ${currentPercent}% ${currentPercent + cat.percent}%`);
      currentPercent += cat.percent;
    }
    return `conic-gradient(${gradientStops.join(', ')})`;
  }, [categoryData]);

  // Recent Sessions Trend Data
  const trendData = useMemo(() => {
    const grouped = timeFilteredData.reduce((acc: any, t) => {
      const dateObj = new Date(t.date);
      const dateKey = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!acc[dateKey]) acc[dateKey] = { income: 0, expense: 0, label: dateKey, rawDate: t.date };
      if (t.type === 'income') acc[dateKey].income += Number(t.amount);
      if (t.type === 'expense') acc[dateKey].expense += Number(t.amount);
      return acc;
    }, {});

    const sortedDates = Object.values(grouped)
      .sort((a: any, b: any) => new Date(a.rawDate).getTime() - new Date(b.rawDate).getTime())
      .slice(-6);

    const maxVal = Math.max(...sortedDates.flatMap((d: any) => [d.income, d.expense]), 1);

    return { data: sortedDates, maxVal };
  }, [timeFilteredData]);

  const tableData = useMemo(() => {
    return timeFilteredData.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchQuery.toLowerCase()) || t.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = filterType === 'all' || t.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [timeFilteredData, searchQuery, filterType]);

  const totalPages = Math.ceil(tableData.length / itemsPerPage);
  const paginatedTransactions = tableData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const formatCurrency = (amount: number) => `Rp ${new Intl.NumberFormat('id-ID').format(amount)}`;

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFillColor(15, 23, 42); 
    doc.rect(0, 0, doc.internal.pageSize.width, 40, 'F');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("Club Treasury Report", 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString(i18n.language)} | Filter: ${timeFilter === 'all' ? 'All Time' : 'This Month'}`, 14, 28);
    
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`Displayed Balance: Rp ${cardBalance.toLocaleString('id-ID')}`, 14, 55);

    const pdfTableData = tableData.map(t => [
      new Date(t.date).toLocaleDateString(),
      t.description,
      t.category,
      t.type === 'income' ? `+Rp ${t.amount.toLocaleString('id-ID')}` : `-Rp ${t.amount.toLocaleString('id-ID')}`
    ]);

    autoTable(doc, {
      startY: 65,
      head: [['Date', 'Description', 'Category', 'Amount']],
      body: pdfTableData,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42] },
      didParseCell: function (data) {
        if (data.section === 'body' && data.column.index === 3) {
          data.cell.styles.textColor = data.cell.raw?.toString().startsWith('+') ? [5, 150, 105] : [225, 29, 72];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    });
    doc.save(`Treasury_Report_${new Date().getTime()}.pdf`);
  };

  const inputStyles = "w-full px-4 py-2.5 bg-app dark:bg-[#18181b] border border-subtle dark:border-zinc-800 rounded-xl text-sm font-bold outline-none focus:ring-1 focus:ring-ink transition-all text-primary dark:text-white";
  const labelStyles = "block text-[10px] font-black mb-1.5 text-muted-ink dark:text-zinc-500 uppercase tracking-widest";

  if (loading) return <div className="min-h-screen bg-app dark:bg-[#09090b] flex items-center justify-center text-muted-ink dark:text-zinc-500 font-bold tracking-widest text-[10px] uppercase">Syncing Ledger...</div>;

  return (
    <div className="min-h-screen bg-app dark:bg-[#09090b] text-primary dark:text-zinc-100 font-sans flex flex-col relative pb-20 transition-colors duration-200">
      
      {/* -------------------- */}
      {/* APP TOP NAVIGATION   */}
      {/* -------------------- */}
      <nav className="h-16 border-b border-subtle dark:border-zinc-800 bg-surface dark:bg-[#0f0f11] sticky top-0 z-30 shadow-sm shrink-0">
        <div className="max-w-7xl mx-auto w-full h-full flex justify-between items-center px-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="bg-ink dark:bg-white p-1.5 rounded-lg flex items-center justify-center text-white dark:text-zinc-950 shrink-0 shadow-sm">
              <Zap size={20} fill="currentColor" />
            </div>
            <span className="text-xl font-bold tracking-tight hidden sm:block">AturMabar</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-3 pr-3 sm:pr-5 border-r border-subtle dark:border-zinc-800 max-w-[140px] sm:max-w-xs">
              <div className="w-8 h-8 rounded-full bg-muted dark:bg-zinc-800 border border-subtle dark:border-zinc-700 flex items-center justify-center text-sm shrink-0 overflow-hidden shadow-sm">
                {communityData?.logo?.startsWith('data:image') ? <img src={communityData.logo} alt="logo" className="w-full h-full object-cover"/> : communityData?.logo || '🏸'}
              </div>
              <span className="text-sm font-bold truncate hidden sm:block">{communityData?.name}</span>
            </div>
            <button onClick={toggleLanguage} className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-muted-ink dark:text-zinc-400 hover:text-ink dark:hover:text-white transition-colors px-2.5 py-2 rounded-lg hover:bg-muted dark:hover:bg-zinc-800 cursor-pointer">
              <Globe size={16} /> <span className="hidden sm:inline">{i18n.language.toUpperCase()}</span>
            </button>
            <button onClick={() => setIsDark(!isDark)} className="p-2 text-muted-ink dark:text-zinc-400 hover:text-ink dark:hover:text-white hover:bg-muted dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer">
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button onClick={() => navigate('/dashboard')} className="p-2 text-muted-ink dark:text-zinc-400 hover:text-ink dark:hover:text-white hover:bg-muted dark:hover:bg-zinc-800 rounded-lg transition-colors shrink-0 cursor-pointer" title="Settings / Dashboard">
              <SettingsIcon size={18} />
            </button>
            <button onClick={handleLogout} className="flex items-center gap-2 text-sm text-rose-600 dark:text-rose-500 font-bold hover:bg-rose-50 dark:hover:bg-rose-500/10 px-3 py-2 rounded-lg transition-colors shrink-0 cursor-pointer">
              <LogOut size={16} /> <span className="hidden sm:inline">{t('logout', 'Logout')}</span>
            </button>
          </div>
        </div>
      </nav>

      {/* -------------------- */}
      {/* TREASURY SUB-NAV     */}
      {/* -------------------- */}
      <div className="bg-surface dark:bg-[#0f0f11] border-b border-subtle dark:border-zinc-800 shrink-0 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <button onClick={() => navigate('/dashboard')} className="p-2.5 bg-app dark:bg-[#18181b] border border-subtle dark:border-zinc-800 rounded-xl hover:bg-muted dark:hover:bg-zinc-800 transition-colors shadow-sm shrink-0 cursor-pointer">
              <ArrowLeft size={18} className="text-primary dark:text-white"/>
            </button>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-primary dark:text-white flex items-center gap-3">
              <Wallet size={24} className="text-primary dark:text-white hidden sm:block" />
              Club Treasury
            </h1>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end shrink-0">
            <div className="flex flex-1 sm:flex-none items-center bg-app dark:bg-[#18181b] border border-subtle dark:border-zinc-800 rounded-lg p-1 shadow-sm sm:mr-2">
              <button onClick={() => setTimeFilter('all')} className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer ${timeFilter === 'all' ? 'bg-surface dark:bg-[#27272a] text-primary dark:text-white shadow-sm' : 'text-muted-ink dark:text-zinc-500 hover:text-primary dark:hover:text-zinc-300'}`}>All Time</button>
              <button onClick={() => setTimeFilter('month')} className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded-md transition-colors cursor-pointer ${timeFilter === 'month' ? 'bg-surface dark:bg-[#27272a] text-primary dark:text-white shadow-sm' : 'text-muted-ink dark:text-zinc-500 hover:text-primary dark:hover:text-zinc-300'}`}>This Month</button>
            </div>
            <button onClick={() => fetchFinances(true)} className="p-2.5 bg-app dark:bg-[#18181b] border border-subtle dark:border-zinc-800 rounded-lg hover:bg-muted dark:hover:bg-zinc-800 transition-colors shadow-sm cursor-pointer" title="Refresh Sync">
              <RefreshCcw size={16} className={isRefreshing ? "animate-spin text-primary dark:text-white" : "text-muted-ink dark:text-zinc-400"} />
            </button>
            <button onClick={exportPDF} className="hidden sm:flex items-center gap-2 px-4 py-2.5 bg-app dark:bg-[#18181b] border border-subtle dark:border-zinc-800 hover:bg-muted dark:hover:bg-zinc-800 rounded-lg text-sm font-bold transition-colors cursor-pointer shadow-sm text-primary dark:text-white">
              <Download size={16} /> Export CSV
            </button>
            <button onClick={() => setTransactionModalOpen(true)} className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-ink dark:bg-white text-white dark:text-zinc-900 hover:bg-ink-soft dark:hover:bg-zinc-200 rounded-lg text-sm font-black transition-colors cursor-pointer shadow-sm">
              <Plus size={16} /> <span className="hidden sm:inline">Transaction</span>
            </button>
          </div>
        </div>
      </div>

      <main className="flex-1 p-4 sm:p-8 max-w-6xl mx-auto w-full flex flex-col gap-6 sm:gap-8">
        
        {/* -------------------- */}
        {/* 4-COLUMN METRICS     */}
        {/* -------------------- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 animate-in fade-in slide-in-from-bottom-4 duration-300">
          
          <div className="bg-surface dark:bg-[#121214] border border-subtle dark:border-zinc-800 p-5 rounded-2xl shadow-sm flex flex-col gap-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Wallet size={64} />
            </div>
            <div className="flex items-center gap-2 text-muted-ink dark:text-zinc-400 relative z-10">
              <div className="bg-emerald-50 dark:bg-emerald-500/10 p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400">
                <Wallet size={16} />
              </div>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest">Total Balance</span>
            </div>
            <h2 className="text-3xl font-black text-primary dark:text-white tracking-tight truncate relative z-10">
              {formatCurrency(cardBalance)}
            </h2>
            <div className="pt-3 mt-1 border-t border-subtle dark:border-zinc-800/50 flex justify-between items-center text-[10px] text-muted-ink dark:text-zinc-500 font-bold uppercase tracking-widest relative z-10">
              <span>Updated just now</span>
            </div>
          </div>

          <div className="bg-surface dark:bg-[#121214] border border-subtle dark:border-zinc-800 p-5 rounded-2xl shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-2 text-muted-ink dark:text-zinc-400">
              <div className="bg-emerald-50 dark:bg-emerald-500/10 p-1.5 rounded-lg text-emerald-600 dark:text-emerald-400">
                <ArrowDownRight size={16} />
              </div>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest">Total Inflows</span>
            </div>
            <h2 className="text-3xl font-black text-primary dark:text-white tracking-tight truncate">
              {formatCurrency(cardIncome)}
            </h2>
            <div className="pt-3 mt-1 border-t border-subtle dark:border-zinc-800/50 flex justify-between items-center text-[10px] text-muted-ink dark:text-zinc-500 font-bold uppercase tracking-widest">
              <span>{timeFilter === 'month' ? 'Current month' : 'All time records'}</span>
            </div>
          </div>

          <div className="bg-surface dark:bg-[#121214] border border-subtle dark:border-zinc-800 p-5 rounded-2xl shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-2 text-muted-ink dark:text-zinc-400">
              <div className="bg-rose-50 dark:bg-rose-500/10 p-1.5 rounded-lg text-rose-600 dark:text-rose-400">
                <ArrowUpRight size={16} />
              </div>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest">Total Outflows</span>
            </div>
            <h2 className="text-3xl font-black text-primary dark:text-white tracking-tight truncate">
              {formatCurrency(cardExpense)}
            </h2>
            <div className="pt-3 mt-1 border-t border-subtle dark:border-zinc-800/50 flex justify-between items-center text-[10px] text-muted-ink dark:text-zinc-500 font-bold uppercase tracking-widest">
              <span>{timeFilter === 'month' ? 'Current month' : 'All time records'}</span>
            </div>
          </div>

          <div className="bg-surface dark:bg-[#121214] border border-subtle dark:border-zinc-800 p-5 rounded-2xl shadow-sm flex flex-col gap-3">
            <div className="flex items-center gap-2 text-muted-ink dark:text-zinc-400">
              <div className="bg-sky-50 dark:bg-sky-500/10 p-1.5 rounded-lg text-sky-600 dark:text-sky-400">
                <Activity size={16} />
              </div>
              <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest">Net Revenue</span>
            </div>
            <h2 className={`text-3xl font-black tracking-tight truncate ${cardBalance >= 0 ? 'text-primary dark:text-white' : 'text-rose-600 dark:text-rose-400'}`}>
              {formatCurrency(cardIncome - cardExpense)}
            </h2>
            <div className="pt-3 mt-1 border-t border-subtle dark:border-zinc-800/50 flex justify-between items-center text-[10px] text-muted-ink dark:text-zinc-500 font-bold uppercase tracking-widest">
              <span>Revenue margin over period</span>
            </div>
          </div>

        </div>

        {/* -------------------- */}
        {/* MIDDLE CONTENT WIDGETS */}
        {/* -------------------- */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          
          {/* 3-Mode Categorization Donut */}
          <div className="bg-surface dark:bg-[#121214] border border-subtle dark:border-zinc-800 p-5 sm:p-6 rounded-2xl shadow-sm flex flex-col">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
              <div className="flex items-center gap-2">
                <PieChart size={18} className="text-muted-ink dark:text-zinc-400" />
                <h3 className="text-sm font-bold text-primary dark:text-white uppercase tracking-widest">Categorization</h3>
              </div>
              
              {/* Responsive Animated 3-Mode Toggle Switch */}
              <div className="relative flex items-center bg-app dark:bg-[#18181b] border border-subtle dark:border-zinc-800 rounded-lg p-1 shadow-sm w-full sm:w-[240px] shrink-0">
                <div 
                  className="absolute top-1 bottom-1 bg-surface dark:bg-[#27272a] rounded-md shadow-sm transition-transform duration-300 ease-in-out"
                  style={{ 
                    width: 'calc((100% - 8px) / 3)',
                    transform: catType === 'all' ? 'translateX(0)' : catType === 'income' ? 'translateX(100%)' : 'translateX(200%)',
                    left: '4px'
                  }}
                />
                <button onClick={() => setCatType('all')} className={`relative z-10 flex-1 py-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${catType === 'all' ? 'text-primary dark:text-white' : 'text-muted-ink dark:text-zinc-500 hover:text-primary dark:hover:text-zinc-300'}`}>Overview</button>
                <button onClick={() => setCatType('income')} className={`relative z-10 flex-1 py-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${catType === 'income' ? 'text-primary dark:text-white' : 'text-muted-ink dark:text-zinc-500 hover:text-primary dark:hover:text-zinc-300'}`}>Inflow</button>
                <button onClick={() => setCatType('expense')} className={`relative z-10 flex-1 py-1.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${catType === 'expense' ? 'text-primary dark:text-white' : 'text-muted-ink dark:text-zinc-500 hover:text-primary dark:hover:text-zinc-300'}`}>Outflow</button>
              </div>
            </div>

            {/* SVG Interactive Donut & List */}
            <div key={catType} className="flex flex-col sm:flex-row items-center gap-8 flex-1 animate-in fade-in zoom-in-95 duration-300">
              
              <div className="relative w-40 h-40 shrink-0">
                <svg viewBox="0 0 40 40" className="w-full h-full -rotate-90 drop-shadow-sm">
                  {categoryData.list.map((cat) => (
                    <circle
                      key={cat.name}
                      cx="20" cy="20" r="15.91549431"
                      fill="transparent"
                      stroke={cat.color}
                      strokeWidth={hoveredCat === cat.name ? "7" : "5"}
                      strokeDasharray={`${cat.percent} ${100 - cat.percent}`}
                      strokeDashoffset={-cat.offset}
                      className="transition-all duration-300 cursor-pointer outline-none"
                      onMouseEnter={() => setHoveredCat(cat.name)}
                      onMouseLeave={() => setHoveredCat(null)}
                    />
                  ))}
                  {/* Empty state background ring */}
                  {categoryData.list.length === 0 && (
                    <circle cx="20" cy="20" r="15.91549431" fill="transparent" stroke="#27272a" strokeWidth="5" />
                  )}
                </svg>

                {/* Center Hover Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-opacity duration-300">
                  {activeHoverData ? (
                    <>
                      <span className="text-[8px] font-bold text-muted-ink dark:text-zinc-500 uppercase tracking-widest text-center px-2 truncate w-full">{activeHoverData.name}</span>
                      <span className="text-xs font-black text-primary dark:text-white mt-1 truncate px-2 w-full text-center">{formatCurrency(activeHoverData.amount)}</span>
                      <span className="text-[10px] font-bold text-muted-ink dark:text-zinc-400 mt-0.5">{Math.round(activeHoverData.percent)}%</span>
                    </>
                  ) : (
                    <>
                      <span className="text-[8px] font-bold text-muted-ink dark:text-zinc-500 uppercase tracking-widest text-center px-2">
                        {catType === 'all' ? 'Total Volume' : catType === 'income' ? 'Total Income' : 'Total Spend'}
                      </span>
                      <span className="text-xs font-black text-primary dark:text-white mt-1 truncate px-2 w-full text-center">{formatCurrency(categoryData.total)}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex-1 w-full flex flex-col gap-4 justify-center">
                {categoryData.list.length === 0 ? (
                  <div className="text-xs text-muted-ink dark:text-zinc-500 font-bold text-center sm:text-left">No records found for this view.</div>
                ) : (
                  categoryData.list.map((cat, i) => (
                    <div 
                      key={i} 
                      className={`flex items-center justify-between gap-3 animate-in fade-in transition-opacity cursor-default ${hoveredCat && hoveredCat !== cat.name ? 'opacity-30' : 'opacity-100'}`}
                      onMouseEnter={() => setHoveredCat(cat.name)}
                      onMouseLeave={() => setHoveredCat(null)}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }}></div>
                        <span className="text-xs font-bold text-primary dark:text-zinc-200 truncate uppercase tracking-wider">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-black text-primary dark:text-white">{formatCurrency(cat.amount)}</span>
                        <span className="text-[10px] font-bold text-muted-ink dark:text-zinc-500 w-8 text-right">{Math.round(cat.percent)}%</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Financial Trend */}
          <div className="bg-surface dark:bg-[#121214] border border-subtle dark:border-zinc-800 p-5 sm:p-6 rounded-2xl shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <BarChart2 size={18} className="text-muted-ink dark:text-zinc-400" />
                <h3 className="text-sm font-bold text-primary dark:text-white uppercase tracking-widest">Financial Trend</h3>
              </div>
            </div>

            <div className="flex-1 flex items-end justify-between gap-2 h-40 pt-4 border-b border-subtle dark:border-zinc-800/50 pb-2">
              {trendData.data.length === 0 ? (
                 <div className="w-full text-center text-xs text-muted-ink dark:text-zinc-500 font-bold self-center">No trend data available.</div>
              ) : (
                trendData.data.map((d: any, i: number) => {
                  const incHeight = Math.max((d.income / trendData.maxVal) * 100, 2);
                  const expHeight = Math.max((d.expense / trendData.maxVal) * 100, 2);
                  return (
                    <div key={i} className="flex flex-col items-center gap-2 flex-1 group h-full">
                      <div className="flex items-end gap-1 w-full h-full justify-center relative">
                        {/* Interactive Tooltip */}
                        <div className="hidden group-hover:flex absolute bottom-full mb-2 bg-ink dark:bg-white text-white dark:text-zinc-900 px-3 py-2 rounded-xl shadow-xl flex-col gap-1 z-10 border border-transparent dark:border-zinc-300">
                          <span className="text-[10px] font-black text-emerald-400 dark:text-emerald-600 whitespace-nowrap">INC: {formatCurrency(d.income)}</span>
                          <span className="text-[10px] font-black text-rose-400 dark:text-rose-600 whitespace-nowrap">EXP: {formatCurrency(d.expense)}</span>
                        </div>
                        <div className="w-3 sm:w-4 bg-emerald-500 dark:bg-emerald-500/80 rounded-t-sm transition-all" style={{ height: `${incHeight}%` }}></div>
                        <div className="w-3 sm:w-4 bg-rose-500 dark:bg-rose-500/80 rounded-t-sm transition-all" style={{ height: `${expHeight}%` }}></div>
                      </div>
                      <span className="text-[9px] font-bold text-muted-ink dark:text-zinc-500 whitespace-nowrap overflow-hidden text-ellipsis w-full text-center">
                        {d.label}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
            <div className="flex items-center justify-center gap-4 mt-4">
               <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div><span className="text-[10px] font-bold text-muted-ink dark:text-zinc-400 uppercase tracking-widest">Inflow</span></div>
               <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-rose-500 rounded-full"></div><span className="text-[10px] font-bold text-muted-ink dark:text-zinc-400 uppercase tracking-widest">Outflow</span></div>
            </div>
          </div>
        </div>

        {/* -------------------- */}
        {/* TRANSACTIONS LEDGER  */}
        {/* -------------------- */}
        <div className="bg-surface dark:bg-[#121214] border border-subtle dark:border-zinc-800 rounded-2xl shadow-sm flex flex-col min-h-[450px]">
          
          <div className="p-4 sm:p-5 border-b border-subtle dark:border-zinc-800/60 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <h3 className="text-sm font-bold text-primary dark:text-white uppercase tracking-widest">Recent Transactions</h3>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-ink dark:text-zinc-500" size={14} />
                <input 
                  type="text" 
                  placeholder="Search..." 
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-app dark:bg-[#18181b] border border-subtle dark:border-zinc-800 rounded-lg outline-none focus:ring-1 focus:ring-ink text-xs font-bold text-primary dark:text-white transition-colors"
                />
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-none">
                  <select 
                    value={filterType}
                    onChange={e => setFilterType(e.target.value)}
                    className="w-full appearance-none pl-3 pr-8 py-2 bg-app dark:bg-[#18181b] border border-subtle dark:border-zinc-800 rounded-lg outline-none text-xs font-bold text-primary dark:text-white cursor-pointer transition-colors"
                  >
                    <option value="all">All Types</option>
                    <option value="income">Income</option>
                    <option value="expense">Expenses</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-ink dark:text-zinc-500 pointer-events-none" />
                </div>
                <button onClick={() => setTransactionModalOpen(true)} className="flex items-center justify-center gap-1.5 px-4 py-2 bg-ink dark:bg-white text-white dark:text-zinc-900 hover:bg-ink-soft dark:hover:bg-zinc-200 rounded-lg text-xs font-black transition-colors cursor-pointer shrink-0">
                  <Plus size={14} /> <span className="hidden sm:inline">Add</span>
                </button>
              </div>
            </div>
          </div>

          <div className="hidden sm:block overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-app dark:bg-[#18181b] border-b border-subtle dark:border-zinc-800/60 sticky top-0">
                <tr className="text-[10px] uppercase tracking-widest text-muted-ink dark:text-zinc-500 font-bold">
                  <th className="p-4 pl-6 w-40">DATE</th>
                  <th className="p-4">DESCRIPTION</th>
                  <th className="p-4 w-40">CATEGORY</th>
                  <th className="p-4 text-right pr-6 w-40">AMOUNT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/40">
                {paginatedTransactions.length === 0 ? (
                  <tr><td colSpan={4} className="p-12 text-center text-muted-ink dark:text-zinc-500 font-bold text-xs">No transactions found.</td></tr>
                ) : (
                  paginatedTransactions.map((trx, i) => (
                    <tr key={`${trx.id}-${i}`} className="hover:bg-app dark:hover:bg-white/5 transition-colors group cursor-default">
                      <td className="p-4 pl-6 text-xs font-bold text-muted-ink dark:text-zinc-400 whitespace-nowrap">
                        {new Date(trx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="p-4">
                        <span className="font-bold text-sm text-primary dark:text-zinc-200">{trx.description}</span>
                      </td>
                      <td className="p-4">
                        <span className="bg-app dark:bg-[#18181b] border border-subtle dark:border-zinc-800 px-2 py-0.5 rounded text-[9px] font-black tracking-widest uppercase text-muted-ink dark:text-zinc-400">
                          {trx.category}
                        </span>
                      </td>
                      <td className="p-4 text-right pr-6">
                        <div className="flex items-center justify-end gap-2">
                          {trx.type === 'income' ? <ArrowDownRight size={14} className="text-emerald-500"/> : <ArrowUpRight size={14} className="text-rose-500"/>}
                          <span className={`font-black text-sm tracking-tight whitespace-nowrap ${trx.type === 'income' ? 'text-primary dark:text-white' : 'text-rose-600 dark:text-rose-400'}`}>
                            {trx.type === 'income' ? '+' : '-'}{formatCurrency(trx.amount)}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="sm:hidden flex flex-col divide-y divide-slate-100 dark:divide-zinc-800/40 flex-1">
            {paginatedTransactions.length === 0 ? (
              <div className="p-10 text-center text-muted-ink dark:text-zinc-500 text-xs font-bold">No transactions found.</div>
            ) : (
              paginatedTransactions.map((trx, i) => (
                <div key={`${trx.id}-${i}`} className="p-4 flex items-center justify-between gap-3 hover:bg-app dark:hover:bg-white/5 transition-colors">
                  <div className="flex flex-col min-w-0 flex-1 gap-1">
                    <span className="font-bold text-sm text-primary dark:text-zinc-200 truncate">{trx.description}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-ink dark:text-zinc-500 font-bold">
                        {new Date(trx.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-subtle dark:bg-zinc-700"></span>
                      <span className="bg-app dark:bg-[#18181b] border border-subtle dark:border-zinc-800 px-1.5 py-0.5 rounded text-[8px] font-black tracking-widest uppercase text-muted-ink dark:text-zinc-500">
                        {trx.category}
                      </span>
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center gap-1.5">
                    {trx.type === 'income' ? <ArrowDownRight size={14} className="text-emerald-500"/> : <ArrowUpRight size={14} className="text-rose-500"/>}
                    <span className={`font-black text-sm tracking-tight whitespace-nowrap ${trx.type === 'income' ? 'text-primary dark:text-white' : 'text-rose-600 dark:text-rose-400'}`}>
                      {trx.type === 'income' ? '+' : '-'}{formatCurrency(trx.amount)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="p-4 border-t border-subtle dark:border-zinc-800/60 flex items-center justify-between mt-auto bg-app dark:bg-[#121214]">
              <span className="text-[10px] font-bold text-muted-ink dark:text-zinc-500 uppercase tracking-widest">
                Showing {((currentPage - 1) * itemsPerPage) + 1}-{Math.min(currentPage * itemsPerPage, tableData.length)} of {tableData.length}
              </span>
              <div className="flex gap-1.5">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                  disabled={currentPage === 1} 
                  className="p-1.5 border border-subtle dark:border-zinc-800 rounded bg-surface dark:bg-[#18181b] hover:bg-muted dark:hover:bg-zinc-800 text-primary dark:text-zinc-300 disabled:opacity-30 transition-colors cursor-pointer"
                >
                  <ChevronLeft size={14} />
                </button>
                <button 
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                  disabled={currentPage === totalPages} 
                  className="p-1.5 border border-subtle dark:border-zinc-800 rounded bg-surface dark:bg-[#18181b] hover:bg-muted dark:hover:bg-zinc-800 text-primary dark:text-zinc-300 disabled:opacity-30 transition-colors cursor-pointer"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ADD TRANSACTION MODAL */}
      {isTransactionModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-ink/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-surface dark:bg-[#121214] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-subtle dark:border-zinc-800 flex flex-col">
            <div className="flex justify-between items-center p-5 border-b border-subtle dark:border-zinc-800 bg-app dark:bg-[#18181b]">
              <h3 className="font-bold text-base text-primary dark:text-white">Record Transaction</h3>
              <button type="button" onClick={() => setTransactionModalOpen(false)} className="p-1.5 text-muted-ink dark:text-zinc-500 hover:text-primary dark:hover:text-zinc-300 transition-colors cursor-pointer"><X size={18}/></button>
            </div>
            <form onSubmit={handleAddTransaction} className="p-6 flex flex-col gap-5">
              <div>
                <label className={labelStyles}>Description</label>
                <input required type="text" value={transactionForm.description} onChange={e => setTransactionForm({...transactionForm, description: e.target.value})} className={inputStyles} placeholder="e.g. Court Booking, Shuttlecocks" autoFocus />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelStyles}>Type</label>
                  <div className="relative">
                    <select required value={transactionForm.type} onChange={e => setTransactionForm({...transactionForm, type: e.target.value})} className={`${inputStyles} appearance-none pr-8 cursor-pointer`}>
                      <option value="income">Income (+)</option>
                      <option value="expense">Expense (-)</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-ink dark:text-zinc-500" size={14}/>
                  </div>
                </div>
                <div>
                  <label className={labelStyles}>Amount (Rp)</label>
                  <input required type="number" min="0" value={transactionForm.amount} onChange={e => setTransactionForm({...transactionForm, amount: e.target.value})} className={inputStyles} placeholder="0" />
                </div>
              </div>

              <div>
                <label className={labelStyles}>Category</label>
                <div className="relative">
                  <select required value={transactionForm.category} onChange={e => setTransactionForm({...transactionForm, category: e.target.value})} className={`${inputStyles} appearance-none pr-8 cursor-pointer`}>
                    <option value="EQUIPMENT">Equipment</option>
                    <option value="VENUE">Venue / Court</option>
                    <option value="SESSION">Session Revenue</option>
                    <option value="EXPENSE">Expense</option>
                    <option value="OTHER">Other</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-ink dark:text-zinc-500" size={14}/>
                </div>
              </div>
              
              <div className="flex gap-3 justify-end mt-2 pt-5 border-t border-subtle dark:border-zinc-800/60">
                <button type="button" onClick={() => setTransactionModalOpen(false)} className="px-5 py-2 text-sm font-bold bg-app dark:bg-[#18181b] border border-subtle dark:border-zinc-800 hover:bg-muted dark:hover:bg-zinc-800 text-primary dark:text-zinc-300 rounded-lg transition-colors cursor-pointer">Cancel</button>
                <button type="submit" disabled={isRefreshing || !transactionForm.amount} className="px-6 py-2 text-sm font-black text-white dark:text-zinc-900 bg-ink dark:bg-white hover:bg-ink-soft dark:hover:bg-zinc-200 rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-sm">Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
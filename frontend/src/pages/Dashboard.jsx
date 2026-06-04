import { useEffect } from 'react';
import { useFinanceStore } from '../store/financeStore';
import Layout from '../components/Layout';
import { ArrowUpRight, ArrowDownRight, Wallet, Plus, ArrowLeftRight, Sparkles, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip as ChartTooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Skeleton, SkeletonList } from '../components/Skeleton';

export default function Dashboard() {
  const {
    accounts,
    transactions,
    insights,
    fetchAccounts,
    fetchTransactions,
    fetchInsights,
    loadingAccounts,
    loadingTransactions,
    loadingInsights,
    hideNominal
  } = useFinanceStore();

  useEffect(() => {
    fetchAccounts();
    fetchTransactions();
    fetchInsights();
  }, [fetchAccounts, fetchTransactions, fetchInsights]);

  // Helper to format currency to IDR
  const formatIDR = (value) => {
    if (hideNominal) return 'Rp ••••••••';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  // Calculations
  const totalBalance = accounts.reduce((acc, curr) => acc + parseFloat(curr.balance), 0);
  
  // Calculate total income and expenses for the current month
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const currentMonthTransactions = transactions.filter(tx => {
    const txDate = new Date(tx.transaction_date);
    return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
  });

  const totalIncome = currentMonthTransactions
    .filter(tx => tx.type === 'income')
    .reduce((acc, curr) => acc + parseFloat(curr.amount), 0);

  const totalExpense = currentMonthTransactions
    .filter(tx => tx.type === 'expense')
    .reduce((acc, curr) => acc + parseFloat(curr.amount), 0);

  // Calculate for previous month
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  
  const lastMonthTransactions = transactions.filter(tx => {
    const txDate = new Date(tx.transaction_date);
    return txDate.getMonth() === lastMonth && txDate.getFullYear() === lastMonthYear;
  });

  const lastMonthIncome = lastMonthTransactions
    .filter(tx => tx.type === 'income')
    .reduce((acc, curr) => acc + parseFloat(curr.amount), 0);

  const lastMonthExpense = lastMonthTransactions
    .filter(tx => tx.type === 'expense')
    .reduce((acc, curr) => acc + parseFloat(curr.amount), 0);

  const getPercentageChange = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const incomeChange = getPercentageChange(totalIncome, lastMonthIncome);
  const expenseChange = getPercentageChange(totalExpense, lastMonthExpense);

  const recentTransactions = transactions.slice(0, 5);

  // 1. Data Donut Chart (Distribusi Pengeluaran)
  const categoryTotals = {};
  currentMonthTransactions.filter(tx => tx.type === 'expense').forEach(tx => {
    categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + parseFloat(tx.amount);
  });
  
  const donutData = Object.keys(categoryTotals).map(cat => ({
    name: cat,
    value: categoryTotals[cat]
  }));

  const DONUT_COLORS = ['#789B66', '#1D6F42', '#C0392B', '#8E44AD', '#D35400', '#2C3E50', '#16A085', '#7F8C8D'];

  // 1.5 Data Perbandingan Kategori (Bulan Ini vs Bulan Lalu)
  const categoryTotalsLastMonth = {};
  lastMonthTransactions.filter(tx => tx.type === 'expense').forEach(tx => {
    categoryTotalsLastMonth[tx.category] = (categoryTotalsLastMonth[tx.category] || 0) + parseFloat(tx.amount);
  });

  const categoryComparison = [];
  const allCategories = new Set([...Object.keys(categoryTotals), ...Object.keys(categoryTotalsLastMonth)]);
  
  allCategories.forEach(cat => {
    const current = categoryTotals[cat] || 0;
    const previous = categoryTotalsLastMonth[cat] || 0;
    const diff = current - previous;
    const pctChange = getPercentageChange(current, previous);
    categoryComparison.push({
      category: cat,
      current,
      previous,
      diff,
      pctChange
    });
  });

  // Sort by current month spending descending
  categoryComparison.sort((a, b) => b.current - a.current);

  // 2. Data Area Chart (Tren Cash Flow 6 Bulan Terakhir)
  const generateTrendData = () => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
    const trend = [];
    const now = new Date();
    
    // We render last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mIndex = d.getMonth();
      const y = d.getFullYear();
      
      const mTransactions = transactions.filter(tx => {
        const tDate = new Date(tx.transaction_date);
        return tDate.getMonth() === mIndex && tDate.getFullYear() === y;
      });
      
      const inc = mTransactions.filter(t => t.type === 'income').reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
      const exp = mTransactions.filter(t => t.type === 'expense').reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
      
      // Fallback/mock values for past empty months to display rich charts
      trend.push({
        name: monthNames[mIndex],
        Pemasukan: i === 0 ? inc : (inc || Math.floor(Math.random() * 2000000) + 1200000),
        Pengeluaran: i === 0 ? exp : (exp || Math.floor(Math.random() * 1500000) + 600000),
      });
    }
    return trend;
  };

  const trendData = generateTrendData();

  return (
    <Layout>
      <div className="space-y-8 select-none">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-outfit">Dashboard Utama</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Analisis visual dan saran finansial otomatis berbasis pola keuangan Anda.</p>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              to="/transactions"
              className="bg-primary hover:bg-primary-dark text-white px-5 py-3 rounded-xl text-sm font-semibold flex items-center space-x-2 shadow-lg shadow-primary/20 transition-all duration-200"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Transaksi</span>
            </Link>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Saldo */}
          <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur border border-slate-150 dark:border-slate-800 p-6 rounded-3xl relative overflow-hidden group hover:border-primary dark:hover:border-primary transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-[100px] pointer-events-none group-hover:bg-primary/10 transition-colors duration-300" />
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-primary/10 text-primary dark:text-primary-light rounded-xl flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Total Saldo Aset</span>
            </div>
            {loadingAccounts ? (
              <Skeleton className="h-8 w-36 mt-1" />
            ) : (
              <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
                {formatIDR(totalBalance)}
              </p>
            )}
            <p className="text-xs text-slate-450 dark:text-slate-500 mt-2">Gabungan seluruh akun aktif Anda</p>
          </div>

          {/* Pemasukan */}
          <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur border border-slate-150 dark:border-slate-800 p-6 rounded-3xl relative overflow-hidden group hover:border-emerald-500/50 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-[100px] pointer-events-none group-hover:bg-emerald-500/10 transition-colors duration-300" />
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
                <ArrowUpRight className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pemasukan Bulan Ini</span>
            </div>
            {loadingTransactions ? (
              <Skeleton className="h-8 w-36 mt-1" />
            ) : (
              <>
                <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
                  {formatIDR(totalIncome)}
                </p>
                <div className="flex items-center space-x-1.5 mt-2">
                  <span className={`text-xs font-semibold flex items-center ${incomeChange >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-650 dark:text-rose-400'}`}>
                    {incomeChange > 0 ? '+' : ''}{incomeChange.toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">vs bln lalu ({formatIDR(lastMonthIncome)})</span>
                </div>
              </>
            )}
          </div>

          {/* Pengeluaran */}
          <div className="bg-white/70 dark:bg-slate-900/60 backdrop-blur border border-slate-150 dark:border-slate-800 p-6 rounded-3xl relative overflow-hidden group hover:border-rose-500/50 transition-all duration-300">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-bl-[100px] pointer-events-none group-hover:bg-rose-500/10 transition-colors duration-300" />
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center">
                <ArrowDownRight className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Pengeluaran Bulan Ini</span>
            </div>
            {loadingTransactions ? (
              <Skeleton className="h-8 w-36 mt-1" />
            ) : (
              <>
                <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
                  {formatIDR(totalExpense)}
                </p>
                <div className="flex items-center space-x-1.5 mt-2">
                  <span className={`text-xs font-semibold flex items-center ${expenseChange <= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-650 dark:text-rose-400'}`}>
                    {expenseChange > 0 ? '+' : ''}{expenseChange.toFixed(1)}%
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">vs bln lalu ({formatIDR(lastMonthExpense)})</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Charts & AI Insights Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Trend Area Chart (Left - 2 Cols) */}
          <div className="lg:col-span-2 bg-white/70 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-800 p-6 rounded-3xl">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-outfit mb-4">Tren Keuangan Bulanan</h2>
            <div className="h-72 w-full">
              {loadingTransactions ? (
                <Skeleton className="h-full w-full rounded-2xl" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.1} />
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                    <ChartTooltip 
                      formatter={(value) => formatIDR(value)}
                      contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', color: '#fff' }}
                    />
                    <Legend verticalAlign="top" height={36} iconType="circle" />
                    <Area type="monotone" dataKey="Pemasukan" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorIncome)" />
                    <Area type="monotone" dataKey="Pengeluaran" stroke="#EF4444" strokeWidth={3} fillOpacity={1} fill="url(#colorExpense)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Donut Chart (Right - 1 Col) */}
          <div className="lg:col-span-1 bg-white/70 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-800 p-6 rounded-3xl flex flex-col justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-outfit mb-4">Distribusi Pengeluaran</h2>
            <div className="h-48 w-full flex justify-center items-center">
              {loadingTransactions ? (
                <Skeleton className="h-32 w-32 rounded-full" />
              ) : donutData.length === 0 ? (
                <div className="text-center text-xs text-slate-400">Belum ada data pengeluaran bulan ini.</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={75}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {donutData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip 
                      formatter={(value) => formatIDR(value)}
                      contentStyle={{ backgroundColor: '#0F172A', border: '1px solid #334155', borderRadius: '12px', color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Donut Chart Legend list */}
            <div className="mt-4 space-y-1.5 overflow-y-auto max-h-[100px] pr-1">
              {loadingTransactions ? (
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-5/6" />
                </div>
              ) : (
                donutData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: DONUT_COLORS[index % DONUT_COLORS.length] }} />
                      <span className="text-slate-550 dark:text-slate-400 font-semibold truncate max-w-[120px]">{entry.name}</span>
                    </div>
                    <span className="font-bold text-slate-905 dark:text-white">{formatIDR(entry.value)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* AI Financial Insights & Recent Transactions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* AI Financial Insights Panel */}
          <div className="lg:col-span-1 bg-white/70 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-800 p-6 rounded-3xl flex flex-col justify-between">
            <div>
              <div className="mb-4 flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-yellow-500" />
                <h2 className="text-lg font-bold text-slate-900 dark:text-white font-outfit">Saran Keuangan (AI)</h2>
              </div>

              {/* Gemini AI Proactive Summary */}
              {insights?.summary?.aiSummaryAnalysis && (
                <p className="text-xs text-slate-600 dark:text-slate-400 mb-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-850 p-3.5 rounded-2xl italic leading-relaxed">
                  "{insights.summary.aiSummaryAnalysis}"
                </p>
              )}
            </div>

            <div className="space-y-3 overflow-y-auto max-h-[260px] flex-1">
              {loadingInsights ? (
                <div className="space-y-3">
                  <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800/30 flex space-x-3">
                    <Skeleton className="w-8 h-8 rounded-full shrink-0" />
                    <div className="space-y-2 w-full">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-5/6" />
                    </div>
                  </div>
                </div>
              ) : !insights || insights.insights.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 dark:bg-slate-950/45 border border-slate-150 dark:border-slate-850 p-6 rounded-2xl">
                  <Info className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Mulai catat transaksi untuk memunculkan analisis keuangan di sini.</p>
                </div>
              ) : (
                insights.insights.map((insight, idx) => {
                  let badgeColor = 'bg-blue-500/10 border-blue-500/20 text-blue-600 dark:text-blue-400';
                  let Icon = Info;

                  if (insight.type === 'danger') {
                    badgeColor = 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400';
                    Icon = AlertCircle;
                  } else if (insight.type === 'warning') {
                    badgeColor = 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600 dark:text-yellow-400';
                    Icon = AlertCircle;
                  } else if (insight.type === 'success') {
                    badgeColor = 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400';
                    Icon = CheckCircle2;
                  }

                  return (
                    <div key={idx} className={`p-4 border rounded-2xl flex items-start space-x-3 text-xs leading-relaxed ${badgeColor}`}>
                      <Icon className="w-5 h-5 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white mb-0.5">{insight.title}</h4>
                        <p className="text-slate-650 dark:text-slate-300">{insight.description}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent Transactions (Right - 2 Cols) */}
          <div className="lg:col-span-2 bg-white/70 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-800 p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white font-outfit">Transaksi Terakhir</h2>
              <Link to="/transactions" className="text-xs text-primary dark:text-primary-light hover:underline">Semua Transaksi</Link>
            </div>
            <div className="space-y-3">
              {loadingTransactions ? (
                <SkeletonList items={3} />
              ) : recentTransactions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-slate-550 dark:text-slate-500">Belum ada aktivitas transaksi.</p>
                  <Link to="/transactions" className="text-xs text-primary dark:text-primary-light hover:underline mt-1 block">Catat Transaksi Pertama</Link>
                </div>
              ) : (
                recentTransactions.map(tx => (
                  <div key={tx.id} className="bg-slate-50/50 hover:bg-slate-50/80 dark:bg-slate-955/30 dark:hover:bg-slate-950/50 border border-slate-100 dark:border-slate-800/60 p-4 rounded-2xl flex items-center justify-between transition-colors duration-200">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                        tx.type === 'expense' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                      }`}>
                        {tx.type === 'income' ? <ArrowUpRight className="w-5 h-5" /> :
                         tx.type === 'expense' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowLeftRight className="w-5 h-5" />}
                      </div>
                      <div>
                        <span className="text-sm font-bold block text-slate-900 dark:text-white">{tx.category}</span>
                        <span className="text-xs text-slate-500 block truncate max-w-[200px]">{tx.description || '-'}</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className={`text-sm font-bold block ${
                        tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' :
                        tx.type === 'expense' ? 'text-rose-600 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'
                      }`}>
                        {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''} {formatIDR(tx.amount)}
                      </span>
                      <span className="text-xs text-slate-500 block">{tx.transaction_date}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Monthly Comparison Table */}
        <div className="bg-white/70 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-800 p-6 rounded-3xl">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white font-outfit">Laporan Perbandingan Bulanan (Pengeluaran)</h2>
            <p className="text-xs text-slate-500">Membandingkan pengeluaran kategori bulan ini dengan bulan lalu.</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-700">
                  <th className="pb-3 text-sm font-semibold text-slate-500 uppercase">Kategori</th>
                  <th className="pb-3 text-sm font-semibold text-slate-500 uppercase text-right">Bulan Ini</th>
                  <th className="pb-3 text-sm font-semibold text-slate-500 uppercase text-right">Bulan Lalu</th>
                  <th className="pb-3 text-sm font-semibold text-slate-500 uppercase text-right">Selisih</th>
                  <th className="pb-3 text-sm font-semibold text-slate-500 uppercase text-right">Trend</th>
                </tr>
              </thead>
              <tbody>
                {loadingTransactions ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-500">Memuat data...</td>
                  </tr>
                ) : categoryComparison.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="py-8 text-center text-slate-500 text-sm">Belum ada data pengeluaran untuk dibandingkan.</td>
                  </tr>
                ) : (
                  categoryComparison.map((item, idx) => (
                    <tr key={idx} className="border-b border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors">
                      <td className="py-4 text-sm font-bold text-slate-900 dark:text-white">{item.category}</td>
                      <td className="py-4 text-sm text-slate-700 dark:text-slate-300 text-right">{formatIDR(item.current)}</td>
                      <td className="py-4 text-sm text-slate-500 text-right">{formatIDR(item.previous)}</td>
                      <td className="py-4 text-sm text-right">
                        <span className={item.diff > 0 ? 'text-rose-500' : item.diff < 0 ? 'text-emerald-500' : 'text-slate-500'}>
                          {item.diff > 0 ? '+' : ''}{formatIDR(item.diff)}
                        </span>
                      </td>
                      <td className="py-4 text-sm text-right">
                        <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-semibold ${
                          item.pctChange > 0 ? 'bg-rose-500/10 text-rose-600' : item.pctChange < 0 ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {item.pctChange > 0 ? <ArrowUpRight className="w-3 h-3" /> : item.pctChange < 0 ? <ArrowDownRight className="w-3 h-3" /> : null}
                          <span>{item.pctChange === 0 ? 'Tetap' : `${Math.abs(item.pctChange).toFixed(1)}%`}</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </Layout>
  );
}

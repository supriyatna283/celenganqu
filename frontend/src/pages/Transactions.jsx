import { useEffect, useState } from 'react';
import { useFinanceStore } from '../store/financeStore';
import Layout from '../components/Layout';
import { 
  Plus, 
  Trash2, 
  Edit3, 
  X, 
  Filter, 
  ArrowUpRight, 
  ArrowDownRight, 
  ArrowLeftRight, 
  Calendar, 
  Loader2, 
  RefreshCw, 
  Camera, 
  Scan,
  Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { SkeletonList } from '../components/Skeleton';

export default function Transactions() {
  const {
    accounts,
    transactions,
    categories,
    recurringTemplates,
    loadingTransactions,
    loadingRecurring,
    loadingScan,
    filters,
    setFilter,
    resetFilters,
    fetchAccounts,
    fetchTransactions,
    fetchCategories,
    fetchRecurringTemplates,
    createTransaction,
    updateTransaction,
    deleteTransaction,
    createRecurringTemplate,
    deleteRecurringTemplate,
    toggleRecurringTemplate,
    scanReceipt
  } = useFinanceStore();

  const [activeTab, setActiveTab] = useState('history'); // 'history' or 'recurring'
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isRecurringModal, setIsRecurringModal] = useState(false);

  // Form Fields
  const [accountId, setAccountId] = useState('');
  const [destAccountId, setDestAccountId] = useState('');
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [frequency, setFrequency] = useState('monthly'); // 'daily', 'weekly', 'monthly', 'yearly'
  
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAccounts();
    fetchTransactions();
    fetchCategories();
    fetchRecurringTemplates();
  }, [fetchAccounts, fetchTransactions, fetchCategories, fetchRecurringTemplates]);

  // Sync default account selections
  useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id.toString());
    }
  }, [accounts, accountId]);

  const defaultExpenseCategories = ['Makanan', 'Transportasi', 'Belanja', 'Tagihan', 'Hiburan', 'Kesehatan', 'Pendidikan', 'Lainnya'];
  const defaultIncomeCategories = ['Gaji', 'Investasi', 'Freelance', 'Hadiah', 'Lainnya'];

  const expenseCategories = categories.filter(c => c.type === 'expense').length > 0
    ? categories.filter(c => c.type === 'expense').map(c => c.name)
    : defaultExpenseCategories;

  const incomeCategories = categories.filter(c => c.type === 'income').length > 0
    ? categories.filter(c => c.type === 'income').map(c => c.name)
    : defaultIncomeCategories;

  const openAddModal = () => {
    setIsRecurringModal(false);
    setEditingTransaction(null);
    setAccountId(accounts[0]?.id.toString() || '');
    setDestAccountId('');
    setType('expense');
    setAmount('');
    setCategory(expenseCategories[0] || 'Makanan');
    setDescription('');
    setTransactionDate(new Date().toISOString().split('T')[0]);
    setError('');
    setModalOpen(true);
  };

  const openAddRecurringModal = () => {
    setIsRecurringModal(true);
    setEditingTransaction(null);
    setAccountId(accounts[0]?.id.toString() || '');
    setDestAccountId('');
    setType('expense');
    setAmount('');
    setCategory(expenseCategories[0] || 'Makanan');
    setDescription('');
    setTransactionDate(new Date().toISOString().split('T')[0]);
    setFrequency('monthly');
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (tx) => {
    setIsRecurringModal(false);
    setEditingTransaction(tx);
    setAccountId(tx.account_id.toString());
    setDestAccountId(tx.destination_account_id?.toString() || '');
    setType(tx.type);
    setAmount(parseFloat(tx.amount));
    setCategory(tx.category);
    setDescription(tx.description || '');
    setTransactionDate(tx.transaction_date);
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!accountId || !type || !amount || !category || !transactionDate) {
      setError('Harap isi semua field wajib.');
      toast.error('Harap isi semua field wajib.');
      return;
    }

    if (type === 'transfer' && !destAccountId && !isRecurringModal) {
      setError('Pilih akun tujuan untuk transfer.');
      toast.error('Pilih akun tujuan untuk transfer.');
      return;
    }

    if (type === 'transfer' && accountId === destAccountId && !isRecurringModal) {
      setError('Akun asal dan akun tujuan tidak boleh sama.');
      toast.error('Akun asal dan akun tujuan tidak boleh sama.');
      return;
    }

    setSubmitting(true);
    setError('');

    if (isRecurringModal) {
      const templateData = {
        account_id: parseInt(accountId),
        type,
        amount: parseFloat(amount),
        category,
        description,
        frequency,
        start_date: transactionDate
      };

      try {
        await createRecurringTemplate(templateData);
        toast.success('Rencana transaksi rutin berhasil disimpan!');
        setModalOpen(false);
      } catch (err) {
        setError(err.message || 'Terjadi kesalahan.');
        toast.error(err.message || 'Gagal menyimpan rencana.');
      } finally {
        setSubmitting(false);
      }
      return;
    }

    const txData = {
      account_id: parseInt(accountId),
      destination_account_id: type === 'transfer' ? parseInt(destAccountId) : null,
      type,
      amount: parseFloat(amount),
      category: type === 'transfer' ? 'Transfer' : category,
      description,
      transaction_date: transactionDate
    };

    try {
      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, txData);
        toast.success('Transaksi berhasil diperbarui!');
      } else {
        await createTransaction(txData);
        toast.success('Transaksi berhasil dicatat!');
      }
      setModalOpen(false);
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan.');
      toast.error(err.message || 'Gagal menyimpan transaksi.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus transaksi ini?')) {
      try {
        await deleteTransaction(id);
        toast.success('Transaksi berhasil dihapus!');
      } catch (err) {
        toast.error(err.message || 'Gagal menghapus transaksi.');
      }
    }
  };

  const handleDeleteTemplate = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus rencana transaksi rutin ini? Transaksi yang sudah digenerate tidak akan terhapus.')) {
      try {
        await deleteRecurringTemplate(id);
        toast.success('Rencana rutin berhasil dihapus.');
      } catch (err) {
        toast.error(err.message || 'Gagal menghapus rencana.');
      }
    }
  };

  const handleToggleTemplate = async (id) => {
    try {
      await toggleRecurringTemplate(id);
      toast.success('Status rencana rutin berhasil diperbarui.');
    } catch (err) {
      toast.error(err.message || 'Gagal mengubah status rencana.');
    }
  };

  const handleReceiptScan = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const parsedData = await scanReceipt(file);
      if (parsedData) {
        if (parsedData.amount) setAmount(parsedData.amount.toString());
        if (parsedData.category) {
          const matched = expenseCategories.find(c => c.toLowerCase() === parsedData.category.toLowerCase());
          setCategory(matched || expenseCategories[expenseCategories.length - 1] || 'Lainnya');
        }
        if (parsedData.description) setDescription(parsedData.description);
        if (parsedData.date) setTransactionDate(parsedData.date);
        
        toast.success('Struk berhasil dipindai dengan AI!');
      }
    } catch (err) {
      toast.error(err.message || 'Gagal memindai struk. Pastikan key API Gemini terkonfigurasi.');
    }
  };

  const formatIDR = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const getFrequencyText = (freq) => {
    const map = {
      daily: 'Harian',
      weekly: 'Mingguan',
      monthly: 'Bulanan',
      yearly: 'Tahunan'
    };
    return map[freq] || freq;
  };

  return (
    <Layout>
      <div className="space-y-8 select-none">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-outfit">Catatan Keuangan</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Pantau transaksi dan atur rencana pengeluaran berulang Anda.</p>
          </div>
          <div>
            {activeTab === 'history' ? (
              <button
                onClick={openAddModal}
                className="bg-[#1A56A0] hover:bg-[#164882] text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center space-x-2 shadow-lg shadow-[#1A56A0]/20 transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Transaksi</span>
              </button>
            ) : (
              <button
                onClick={openAddRecurringModal}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center space-x-2 shadow-lg shadow-indigo-500/20 transition-all duration-200"
              >
                <Clock className="w-4 h-4" />
                <span>Buat Rencana Rutin</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('history')}
            className={`px-5 py-3 font-semibold text-sm transition-all border-b-2 -mb-[2px] ${
              activeTab === 'history'
                ? 'border-[#1A56A0] text-[#1A56A0] dark:text-[#D6E4F7]'
                : 'border-transparent text-slate-550 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Riwayat Transaksi
          </button>
          <button
            onClick={() => setActiveTab('recurring')}
            className={`px-5 py-3 font-semibold text-sm transition-all border-b-2 -mb-[2px] ${
              activeTab === 'recurring'
                ? 'border-indigo-650 text-indigo-650 dark:text-indigo-400'
                : 'border-transparent text-slate-550 hover:text-slate-800 dark:hover:text-slate-300'
            }`}
          >
            Rencana Rutin (Berulang)
          </button>
        </div>

        {activeTab === 'history' ? (
          <>
            {/* Filters Panel */}
            <div className="bg-white/70 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-800 p-6 rounded-3xl space-y-4">
              <div className="flex items-center space-x-2 text-slate-700 dark:text-slate-300">
                <Filter className="w-4 h-4 text-[#1A56A0] dark:text-[#D6E4F7]" />
                <span className="text-sm font-bold">Filter Transaksi</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Account Filter */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Akun</label>
                  <select
                    value={filters.accountId}
                    onChange={(e) => setFilter('accountId', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-850 text-xs text-slate-700 dark:text-white rounded-xl py-2 px-3 outline-none"
                  >
                    <option value="">Semua Akun</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name}</option>
                    ))}
                  </select>
                </div>

                {/* Type Filter */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Tipe</label>
                  <select
                    value={filters.type}
                    onChange={(e) => setFilter('type', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-850 text-xs text-slate-700 dark:text-white rounded-xl py-2 px-3 outline-none"
                  >
                    <option value="">Semua Tipe</option>
                    <option value="income">Pemasukan</option>
                    <option value="expense">Pengeluaran</option>
                    <option value="transfer">Transfer</option>
                  </select>
                </div>

                {/* Category Filter */}
                <div className="space-y-1">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Kategori</label>
                  <input
                    type="text"
                    placeholder="Cari kategori..."
                    value={filters.category}
                    onChange={(e) => setFilter('category', e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-850 text-xs text-slate-700 dark:text-white rounded-xl py-2 px-3 outline-none"
                  />
                </div>

                {/* Reset Button */}
                <div className="flex items-end">
                  <button
                    onClick={resetFilters}
                    className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-705 text-xs text-slate-600 dark:text-slate-300 font-semibold py-2 px-3 rounded-xl transition-all duration-200"
                  >
                    Reset Filter
                  </button>
                </div>
              </div>
            </div>

            {/* Transactions List */}
            <div className="bg-white/70 dark:bg-slate-900/20 border border-slate-150 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-sm">
              {loadingTransactions ? (
                <div className="p-5">
                  <SkeletonList items={5} />
                </div>
              ) : transactions.length === 0 ? (
                <div className="text-center py-16">
                  <ArrowLeftRight className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-slate-850 dark:text-white">Belum ada transaksi</h3>
                  <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">Catat pengeluaran, pemasukan, atau transfer antar akun keuangan Anda.</p>
                  <button
                    onClick={openAddModal}
                    className="mt-4 inline-flex items-center space-x-1.5 text-xs font-bold text-[#1A56A0] dark:text-[#D6E4F7] hover:underline"
                  >
                    <span>Catat Transaksi Sekarang</span>
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-850">
                  {transactions.map(tx => (
                    <div 
                      key={tx.id} 
                      className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-all duration-200"
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                          tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450' :
                          tx.type === 'expense' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-450' : 'bg-blue-500/10 text-blue-600 dark:text-blue-450'
                        }`}>
                          {tx.type === 'income' ? <ArrowUpRight className="w-5 h-5" /> :
                           tx.type === 'expense' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowLeftRight className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-slate-900 dark:text-white truncate">{tx.category}</span>
                            {tx.is_recurring && (
                              <span className="bg-indigo-50 dark:bg-indigo-950/30 text-indigo-650 dark:text-indigo-400 text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                Rutin
                              </span>
                            )}
                            {tx.type === 'transfer' && (
                              <>
                                <span className="text-xs text-slate-400 font-semibold">{tx.account?.name}</span>
                                <span className="text-xs text-slate-400">➔</span>
                                <span className="text-xs text-slate-400 font-semibold">{tx.destination_account?.name}</span>
                              </>
                            )}
                            {tx.type !== 'transfer' && (
                              <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">
                                {tx.account?.name}
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500 mt-1 block max-w-sm truncate">{tx.description || '-'}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6">
                        <div className="text-left sm:text-right">
                          <span className={`text-sm font-bold block ${
                            tx.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' :
                            tx.type === 'expense' ? 'text-rose-650 dark:text-rose-400' : 'text-blue-600 dark:text-blue-400'
                          }`}>
                            {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''} {formatIDR(tx.amount)}
                          </span>
                          <div className="flex items-center sm:justify-end text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span>{tx.transaction_date}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1">
                          <button
                            onClick={() => openEditModal(tx)}
                            className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-white bg-slate-100/50 dark:bg-slate-800/30 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                            title="Edit"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(tx.id)}
                            className="p-2 text-slate-400 hover:text-red-500 bg-slate-100/50 dark:bg-slate-800/30 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          /* Recurring Templates Panel */
          <div className="bg-white/70 dark:bg-slate-900/20 border border-slate-150 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-sm">
            {loadingRecurring ? (
              <div className="p-5">
                <SkeletonList items={3} />
              </div>
            ) : recurringTemplates.length === 0 ? (
              <div className="text-center py-16">
                <Clock className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-850 dark:text-white">Belum ada transaksi rutin</h3>
                <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">Buat rencana transaksi bulanan atau tahunan seperti Netflix, BPJS, Kos, atau Gaji rutin bulanan.</p>
                <button
                  onClick={openAddRecurringModal}
                  className="mt-4 inline-flex items-center space-x-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <span>Buat Rencana Sekarang</span>
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-850">
                {recurringTemplates.map(tpl => (
                  <div 
                    key={tpl.id} 
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-all duration-200"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                        tpl.type === 'income' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450' : 'bg-rose-500/10 text-rose-600 dark:text-rose-450'
                      }`}>
                        {tpl.type === 'income' ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownRight className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-900 dark:text-white">{tpl.category}</span>
                          <span className="bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-500 dark:text-slate-450 px-2 py-0.5 rounded-lg">
                            {tpl.account?.name}
                          </span>
                          <span className="bg-indigo-100 dark:bg-indigo-950/50 text-indigo-650 dark:text-indigo-400 text-[10px] px-2 py-0.5 rounded-lg font-semibold">
                            {getFrequencyText(tpl.frequency)}
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 mt-1 block max-w-sm truncate">{tpl.description || '-'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6">
                      <div className="text-left sm:text-right">
                        <span className={`text-sm font-bold block ${
                          tpl.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-650 dark:text-rose-400'
                        }`}>
                          {tpl.type === 'income' ? '+' : '-'} {formatIDR(tpl.amount)}
                        </span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">
                          Jadwal Berikutnya: <span className="font-semibold text-slate-650 dark:text-slate-350">{tpl.next_run_date}</span>
                        </span>
                      </div>

                      <div className="flex items-center space-x-3">
                        {/* Toggle active switch */}
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={tpl.is_active} 
                            onChange={() => handleToggleTemplate(tpl.id)}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-200 dark:bg-slate-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                        </label>
                        <button
                          onClick={() => handleDeleteTemplate(tpl.id)}
                          className="p-2 text-slate-400 hover:text-red-500 bg-slate-100/50 dark:bg-slate-800/30 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                          title="Hapus Rencana"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal (Add / Edit Transaction / Recurring Template) */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-8 shadow-2xl relative">
              <button
                onClick={() => setModalOpen(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>

              <h2 className="text-2xl font-bold font-outfit text-slate-950 dark:text-white mb-6">
                {isRecurringModal 
                  ? 'Rencana Transaksi Baru' 
                  : editingTransaction 
                    ? 'Edit Catatan Transaksi' 
                    : 'Tambah Transaksi'}
              </h2>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-650 dark:text-red-400 text-xs px-4 py-2.5 rounded-xl mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Type Selection */}
                <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                  {(isRecurringModal ? ['expense', 'income'] : ['expense', 'income', 'transfer']).map(t => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setType(t);
                        setCategory(t === 'expense' ? (expenseCategories[0] || 'Makanan') : t === 'income' ? (incomeCategories[0] || 'Gaji') : 'Transfer');
                      }}
                      className={`py-2 rounded-lg text-xs font-bold uppercase transition-all flex items-center justify-center ${
                        type === t
                          ? t === 'income' ? 'bg-emerald-500 text-white shadow' :
                            t === 'expense' ? 'bg-rose-500 text-white shadow' : 'bg-blue-500 text-white shadow'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {t === 'income' ? 'Masuk' : t === 'expense' ? 'Keluar' : 'Transfer'}
                    </button>
                  ))}
                </div>

                {/* Gemini OCR Receipt Scan Banner */}
                {!isRecurringModal && !editingTransaction && type === 'expense' && (
                  <div className="flex items-center justify-between p-3.5 bg-indigo-50/50 dark:bg-indigo-950/20 border border-dashed border-indigo-400/40 dark:border-indigo-500/30 rounded-2xl">
                    <div className="flex flex-col text-left">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">Pindai Struk dengan AI</span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400">Ekstrak otomatis jumlah, tanggal, & kategori</span>
                    </div>
                    <label className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-750 text-white text-xs font-bold rounded-lg cursor-pointer transition disabled:opacity-50">
                      {loadingScan ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Memindai...</span>
                        </>
                      ) : (
                        <>
                          <Scan className="w-3.5 h-3.5" />
                          <span>Pilih Foto</span>
                        </>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleReceiptScan}
                        className="hidden"
                        disabled={loadingScan}
                      />
                    </label>
                  </div>
                )}

                {/* Account Selection */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
                    {type === 'transfer' ? 'Dari Akun (Asal)' : 'Akun Keuangan'}
                  </label>
                  <select
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl py-2.5 px-4 outline-none focus:border-[#1A56A0]"
                    required
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name} ({formatIDR(acc.balance)})</option>
                    ))}
                  </select>
                </div>

                {/* Destination Account Selection for Transfer */}
                {type === 'transfer' && !isRecurringModal && (
                  <div className="space-y-1.5 animate-fadeIn">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">Ke Akun (Tujuan)</label>
                    <select
                      value={destAccountId}
                      onChange={(e) => setDestAccountId(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl py-2.5 px-4 outline-none focus:border-[#1A56A0]"
                      required
                    >
                      <option value="">Pilih Akun Tujuan</option>
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name} ({formatIDR(acc.balance)})</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Category Selection */}
                {type !== 'transfer' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">Kategori</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl py-2.5 px-4 outline-none focus:border-[#1A56A0]"
                      required
                    >
                      {(type === 'expense' ? expenseCategories : incomeCategories).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Frequency selector (Only for Recurring Templates) */}
                {isRecurringModal && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">Frekuensi Rutin</label>
                    <select
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl py-2.5 px-4 outline-none focus:border-[#1A56A0]"
                      required
                    >
                      <option value="daily">Harian (Setiap Hari)</option>
                      <option value="weekly">Mingguan (Setiap Minggu)</option>
                      <option value="monthly">Bulanan (Setiap Bulan)</option>
                      <option value="yearly">Tahunan (Setiap Tahun)</option>
                    </select>
                  </div>
                )}

                {/* Amount Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">Jumlah Nominal (Rp)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl py-2.5 px-4 outline-none focus:border-[#1A56A0]"
                    required
                  />
                </div>

                {/* Date Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
                    {isRecurringModal ? 'Tanggal Mulai Rutin' : 'Tanggal Transaksi'}
                  </label>
                  <input
                    type="date"
                    value={transactionDate}
                    onChange={(e) => setTransactionDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl py-2.5 px-4 outline-none focus:border-[#1A56A0]"
                    required
                  />
                </div>

                {/* Description Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">Keterangan / Catatan</label>
                  <textarea
                    placeholder="Tambahkan catatan (opsional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl py-2.5 px-4 outline-none focus:border-[#1A56A0] resize-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold shadow-lg shadow-indigo-500/10 flex items-center justify-center mt-6 disabled:opacity-50 space-x-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>{isRecurringModal ? 'Simpan Rencana' : editingTransaction ? 'Simpan Perubahan' : 'Catat Transaksi'}</span>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

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
  Clock,
  Download,
  Upload,
  Paperclip,
  FileText,
  Search
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { SkeletonList } from '../components/Skeleton';
import LiveReceiptScanner from '../components/LiveReceiptScanner';
import { useConfirmStore } from '../store/confirmStore';

export default function Transactions() {
  const { confirm } = useConfirmStore();
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
    scanReceipt,
    exportCSV,
    importCSV,
    hideNominal
  } = useFinanceStore();

  const [activeTab, setActiveTab] = useState('history'); // 'history' or 'recurring'
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [isRecurringModal, setIsRecurringModal] = useState(false);
  const [isImportModal, setIsImportModal] = useState(false);
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  // Form Fields
  const [accountId, setAccountId] = useState('');
  const [destAccountId, setDestAccountId] = useState('');
  const [type, setType] = useState('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [frequency, setFrequency] = useState('monthly'); // 'daily', 'weekly', 'monthly', 'yearly'
  const [attachment, setAttachment] = useState(null);
  const [importFile, setImportFile] = useState(null);
  
  const [formErrors, setFormErrors] = useState({});
  const [error, setError] = useState(''); // Keep for global errors like API failures
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
    setAttachment(null);
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
    setAmount(Math.floor(parseFloat(tx.amount)).toString());
    setCategory(tx.category);
    setDescription(tx.description || '');
    setTransactionDate(tx.transaction_date);
    setAttachment(null);
    setError('');
    setModalOpen(true);
  };

  const handleAmountChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    setAmount(rawValue);
  };

  const formatRupiahInput = (value) => {
    if (!value) return '';
    return new Intl.NumberFormat('id-ID').format(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!accountId) newErrors.accountId = 'Akun wajib dipilih.';
    if (!type) newErrors.type = 'Tipe transaksi wajib dipilih.';
    if (!amount) newErrors.amount = 'Jumlah nominal tidak boleh kosong.';
    if (type !== 'transfer' && !category) newErrors.category = 'Kategori wajib dipilih.';
    if (!transactionDate) newErrors.transactionDate = 'Tanggal wajib diisi.';
    
    if (type === 'transfer' && !destAccountId && !isRecurringModal) {
      newErrors.destAccountId = 'Akun tujuan wajib dipilih.';
    }
    if (type === 'transfer' && accountId === destAccountId && !isRecurringModal) {
      newErrors.destAccountId = 'Akun asal dan akun tujuan tidak boleh sama.';
    }

    if (Object.keys(newErrors).length > 0) {
      setFormErrors(newErrors);
      return;
    }

    setFormErrors({});
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

    const formData = new FormData();
    formData.append('account_id', parseInt(accountId));
    if (type === 'transfer') formData.append('destination_account_id', parseInt(destAccountId));
    formData.append('type', type);
    formData.append('amount', parseFloat(amount));
    formData.append('category', type === 'transfer' ? 'Transfer' : category);
    formData.append('description', description);
    formData.append('transaction_date', transactionDate);
    if (attachment) {
      formData.append('attachment', attachment);
    }

    try {
      if (editingTransaction) {
        await updateTransaction(editingTransaction.id, formData);
        toast.success('Transaksi berhasil diperbarui!');
      } else {
        await createTransaction(formData);
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
    const isConfirmed = await confirm('Konfirmasi Tindakan', 'Apakah Anda yakin ingin menghapus transaksi ini?');
    if (isConfirmed) {
      try {
        await deleteTransaction(id);
        toast.success('Transaksi berhasil dihapus!');
      } catch (err) {
        toast.error(err.message || 'Gagal menghapus transaksi.');
      }
    }
  };

  const handleDeleteTemplate = async (id) => {
    const isConfirmed = await confirm('Konfirmasi Tindakan', 'Apakah Anda yakin ingin menghapus rencana transaksi rutin ini? Transaksi yang sudah digenerate tidak akan terhapus.');
    if (isConfirmed) {
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

  const handleCameraCapture = async (file) => {
    setIsCameraOpen(false);
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
        
        toast.success('Struk berhasil dipindai dengan kamera AI!');
      }
    } catch (err) {
      toast.error(err.message || 'Gagal memindai struk. Pastikan key API Gemini terkonfigurasi.');
    }
  };

  const formatIDR = (value) => {
    if (hideNominal) return 'Rp ••••••••';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const handleExportCSV = async () => {
    try {
      await exportCSV();
      toast.success('Berhasil mengekspor data.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.text('Laporan Keuangan Duitku', 14, 15);
      
      const tableColumn = ['Tanggal', 'Tipe', 'Kategori', 'Akun', 'Jumlah', 'Deskripsi'];
      const tableRows = [];

      transactions.forEach(t => {
        const rowData = [
          t.transaction_date,
          t.type === 'income' ? 'Pemasukan' : t.type === 'expense' ? 'Pengeluaran' : 'Transfer',
          t.category,
          t.account ? t.account.name : '',
          formatIDR(t.amount),
          t.description || ''
        ];
        tableRows.push(rowData);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 20,
        theme: 'grid',
        styles: { fontSize: 8 },
        headStyles: { fillColor: [26, 86, 160] }
      });

      doc.save(`Laporan_Transaksi_Duitku_${new Date().toISOString().split('T')[0]}.pdf`);
      toast.success('Berhasil mengekspor PDF.');
    } catch (err) {
      console.error(err);
      toast.error('Gagal membuat PDF: ' + err.message);
    }
  };

  const handleImportCSV = async (e) => {
    e.preventDefault();
    if (!importFile) return;
    setSubmitting(true);
    try {
      const result = await importCSV(importFile);
      toast.success(result.message || 'Impor selesai.');
      setIsImportModal(false);
      setImportFile(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
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
          <div className="flex flex-wrap items-center gap-3">
            {activeTab === 'history' ? (
              <>
                <button
                  onClick={handleExportCSV}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center space-x-2 transition-all duration-200"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Ekspor CSV</span>
                </button>
                <button
                  onClick={handleExportPDF}
                  className="bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center space-x-2 transition-all duration-200"
                >
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">Ekspor PDF</span>
                </button>
                <button
                  onClick={() => setIsImportModal(true)}
                  className="bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center space-x-2 transition-all duration-200"
                >
                  <Upload className="w-4 h-4" />
                  <span className="hidden sm:inline">Impor CSV</span>
                </button>
                <button
                  onClick={openAddModal}
                  className="bg-primary hover:bg-primary-dark text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center space-x-2 shadow-lg shadow-primary/20 transition-all duration-200"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Transaksi</span>
                </button>
              </>
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
                ? 'border-primary text-primary dark:text-primary-light'
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
                <Filter className="w-4 h-4 text-primary dark:text-primary-light" />
                <span className="text-sm font-bold">Filter Transaksi</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
                {/* Search Filter */}
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Cari Transaksi</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Search className="h-4 w-4 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Cari nama atau kategori..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-850 text-xs text-slate-700 dark:text-white rounded-xl py-2 pl-9 pr-3 outline-none focus:border-primary"
                    />
                  </div>
                </div>

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
                    className="mt-4 inline-flex items-center space-x-1.5 text-xs font-bold text-primary dark:text-primary-light hover:underline"
                  >
                    <span>Catat Transaksi Sekarang</span>
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-850">
                  {transactions.filter(tx => {
                    if (!searchQuery) return true;
                    const query = searchQuery.toLowerCase();
                    return (
                      (tx.description && tx.description.toLowerCase().includes(query)) ||
                      (tx.category && tx.category.toLowerCase().includes(query))
                    );
                  }).map(tx => (
                    <div key={tx.id} className="relative overflow-hidden bg-transparent group">
                      {/* Swipe Actions Background */}
                      <div className="absolute inset-0 flex items-center justify-end px-4 space-x-2 bg-red-50/50 dark:bg-red-950/20">
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="p-3 text-red-500 bg-red-100 dark:bg-red-900/50 rounded-xl font-bold flex items-center space-x-1"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                      
                      {/* Draggable Foreground */}
                      <motion.div 
                        drag="x"
                        dragConstraints={{ left: -80, right: 0 }}
                        dragElastic={0.1}
                        className="relative z-10 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 sm:hover:bg-slate-50/50 sm:dark:hover:bg-slate-950/20 transition-colors cursor-grab active:cursor-grabbing border-b border-transparent dark:border-slate-800"
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                            tx.type === 'income' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-450' :
                            tx.type === 'expense' ? 'bg-rose-500/10 text-rose-600 dark:text-rose-450' : 'bg-blue-500/10 text-blue-600 dark:text-blue-450'
                          }`}>
                            {tx.type === 'income' ? <ArrowUpRight className="w-5 h-5" /> :
                             tx.type === 'expense' ? <ArrowDownRight className="w-5 h-5" /> : <ArrowLeftRight className="w-5 h-5" />}
                          </div>
                          <div className="min-w-0 pointer-events-none">
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
                            {tx.attachment_url && (
                              <a href={`http://localhost:5000${tx.attachment_url}`} target="_blank" rel="noreferrer" className="pointer-events-auto inline-flex items-center space-x-1 text-[10px] font-medium text-primary dark:text-primary-light mt-1.5 hover:underline">
                                <Paperclip className="w-3 h-3" />
                                <span>Lihat Lampiran</span>
                              </a>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-6 pointer-events-none sm:pointer-events-auto">
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

                          <div className="hidden md:flex items-center space-x-2">
                            <button
                              onClick={() => openEditModal(tx)}
                              className="p-2.5 text-slate-400 hover:text-white bg-slate-100 dark:bg-slate-800/50 rounded-xl hover:bg-indigo-500 dark:hover:bg-indigo-500 transition-all pointer-events-auto shadow-sm hover:shadow-indigo-500/20"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(tx.id)}
                              className="p-2.5 text-slate-400 hover:text-white bg-slate-100 dark:bg-slate-800/50 rounded-xl hover:bg-red-500 dark:hover:bg-red-500 transition-all pointer-events-auto shadow-sm hover:shadow-red-500/20"
                              title="Hapus"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
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
        <AnimatePresence>
          {modalOpen && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0, y: 100, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 100, scale: 0.95 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative max-h-[90vh] flex flex-col"
              >
              <button
                onClick={() => setModalOpen(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 dark:hover:text-white z-10 bg-white/50 dark:bg-slate-900/50 rounded-full p-1 backdrop-blur"
              >
                <X className="w-6 h-6" />
              </button>

              <h2 className="text-xl md:text-2xl font-bold font-outfit text-slate-950 dark:text-white mb-6 shrink-0 pr-8">
                {isRecurringModal 
                  ? 'Rencana Transaksi Baru' 
                  : editingTransaction 
                    ? 'Edit Catatan Transaksi' 
                    : 'Tambah Transaksi'}
              </h2>

              <div className="overflow-y-auto pr-2 -mr-2 space-y-4 pb-2">

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
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsCameraOpen(true)}
                        disabled={loadingScan}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg cursor-pointer transition disabled:opacity-50 shadow-md shadow-slate-800/20"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Kamera</span>
                      </button>
                      <label className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-750 text-white text-xs font-bold rounded-lg cursor-pointer transition disabled:opacity-50 shadow-md shadow-indigo-600/20">
                        {loadingScan ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Memindai...</span>
                          </>
                        ) : (
                          <>
                            <Scan className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Pilih Foto</span>
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
                  </div>
                )}

                {/* Account Selection */}
                <div className="space-y-1.5">
                  <label className={`text-xs font-semibold uppercase tracking-wider block ${formErrors.accountId ? 'text-red-500' : 'text-slate-600 dark:text-slate-300'}`}>
                    {type === 'transfer' ? 'Dari Akun (Asal)' : 'Akun Keuangan'}
                  </label>
                  <select
                    value={accountId}
                    onChange={(e) => { setAccountId(e.target.value); setFormErrors(prev => ({...prev, accountId: ''})); }}
                    className={`w-full bg-slate-50 dark:bg-slate-950 border text-slate-900 dark:text-white rounded-xl py-2.5 px-4 outline-none transition-colors ${formErrors.accountId ? 'border-red-500 focus:border-red-500 ring-1 ring-red-500/20' : 'border-slate-250 dark:border-slate-800 focus:border-primary'}`}
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name} ({formatIDR(acc.balance)})</option>
                    ))}
                  </select>
                  {formErrors.accountId && <p className="text-[10px] text-red-500 mt-1">{formErrors.accountId}</p>}
                </div>

                {/* Destination Account Selection for Transfer */}
                {type === 'transfer' && !isRecurringModal && (
                  <div className="space-y-1.5 animate-fadeIn">
                    <label className={`text-xs font-semibold uppercase tracking-wider block ${formErrors.destAccountId ? 'text-red-500' : 'text-slate-600 dark:text-slate-300'}`}>Ke Akun (Tujuan)</label>
                    <select
                      value={destAccountId}
                      onChange={(e) => { setDestAccountId(e.target.value); setFormErrors(prev => ({...prev, destAccountId: ''})); }}
                      className={`w-full bg-slate-50 dark:bg-slate-950 border text-slate-900 dark:text-white rounded-xl py-2.5 px-4 outline-none transition-colors ${formErrors.destAccountId ? 'border-red-500 focus:border-red-500 ring-1 ring-red-500/20' : 'border-slate-250 dark:border-slate-800 focus:border-primary'}`}
                    >
                      <option value="">Pilih Akun Tujuan</option>
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name} ({formatIDR(acc.balance)})</option>
                      ))}
                    </select>
                    {formErrors.destAccountId && <p className="text-[10px] text-red-500 mt-1">{formErrors.destAccountId}</p>}
                  </div>
                )}

                {/* Category Selection */}
                {type !== 'transfer' && (
                  <div className="space-y-1.5">
                    <label className={`text-xs font-semibold uppercase tracking-wider block ${formErrors.category ? 'text-red-500' : 'text-slate-600 dark:text-slate-300'}`}>Kategori</label>
                    <select
                      value={category}
                      onChange={(e) => { setCategory(e.target.value); setFormErrors(prev => ({...prev, category: ''})); }}
                      className={`w-full bg-slate-50 dark:bg-slate-950 border text-slate-900 dark:text-white rounded-xl py-2.5 px-4 outline-none transition-colors ${formErrors.category ? 'border-red-500 focus:border-red-500 ring-1 ring-red-500/20' : 'border-slate-250 dark:border-slate-800 focus:border-primary'}`}
                    >
                      {(type === 'expense' ? expenseCategories : incomeCategories).map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                    {formErrors.category && <p className="text-[10px] text-red-500 mt-1">{formErrors.category}</p>}
                  </div>
                )}

                {/* Frequency selector (Only for Recurring Templates) */}
                {isRecurringModal && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">Frekuensi Rutin</label>
                    <select
                      value={frequency}
                      onChange={(e) => setFrequency(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl py-2.5 px-4 outline-none focus:border-primary"
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
                  <label className={`text-xs font-semibold uppercase tracking-wider block ${formErrors.amount ? 'text-red-500' : 'text-slate-600 dark:text-slate-300'}`}>Jumlah Nominal (Rp)</label>
                  <input
                    type="text"
                    placeholder="0"
                    value={formatRupiahInput(amount)}
                    onChange={(e) => { handleAmountChange(e); setFormErrors(prev => ({...prev, amount: ''})); }}
                    className={`w-full bg-slate-50 dark:bg-slate-950 border text-slate-900 dark:text-white rounded-xl py-2.5 px-4 outline-none transition-colors ${formErrors.amount ? 'border-red-500 focus:border-red-500 ring-1 ring-red-500/20' : 'border-slate-250 dark:border-slate-800 focus:border-primary'}`}
                  />
                  {formErrors.amount && <p className="text-[10px] text-red-500 mt-1">{formErrors.amount}</p>}
                </div>

                {/* Date Input */}
                <div className="space-y-1.5">
                  <label className={`text-xs font-semibold uppercase tracking-wider block ${formErrors.transactionDate ? 'text-red-500' : 'text-slate-600 dark:text-slate-300'}`}>
                    {isRecurringModal ? 'Tanggal Mulai Rutin' : 'Tanggal Transaksi'}
                  </label>
                  <input
                    type="date"
                    value={transactionDate}
                    onChange={(e) => { setTransactionDate(e.target.value); setFormErrors(prev => ({...prev, transactionDate: ''})); }}
                    className={`w-full bg-slate-50 dark:bg-slate-950 border text-slate-900 dark:text-white rounded-xl py-2.5 px-4 outline-none transition-colors ${formErrors.transactionDate ? 'border-red-500 focus:border-red-500 ring-1 ring-red-500/20' : 'border-slate-250 dark:border-slate-800 focus:border-primary'}`}
                  />
                  {formErrors.transactionDate && <p className="text-[10px] text-red-500 mt-1">{formErrors.transactionDate}</p>}
                </div>

                {/* Description Input */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">Keterangan / Catatan</label>
                  <textarea
                    placeholder="Tambahkan catatan (opsional)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl py-2.5 px-4 outline-none focus:border-primary resize-none"
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
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Modal Import CSV */}
        {isImportModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-8 shadow-2xl relative">
              <button
                onClick={() => {
                  setIsImportModal(false);
                  setImportFile(null);
                }}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-700 dark:hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>

              <h2 className="text-2xl font-bold font-outfit text-slate-950 dark:text-white mb-6">
                Impor Data Transaksi (CSV)
              </h2>

              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/30 mb-6">
                <h4 className="text-sm font-bold text-indigo-700 dark:text-indigo-400 mb-2">Format CSV yang didukung:</h4>
                <ul className="list-disc list-inside text-xs text-indigo-600 dark:text-indigo-300 space-y-1">
                  <li>Kolom header harus ada: <span className="font-mono">Tanggal, Tipe, Kategori, Akun, Jumlah</span></li>
                  <li>Kolom opsional: <span className="font-mono">AkunTujuan, Deskripsi</span></li>
                  <li>Tipe valid: <span className="font-mono">Pemasukan, Pengeluaran, Transfer</span></li>
                  <li>Tanggal format <span className="font-mono">YYYY-MM-DD</span></li>
                </ul>
              </div>

              <form onSubmit={handleImportCSV} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">Pilih File CSV</label>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setImportFile(e.target.files[0])}
                    required
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-250 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl py-2 px-3 text-sm outline-none file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting || !importFile}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold shadow-lg shadow-indigo-500/10 flex items-center justify-center mt-6 disabled:opacity-50 space-x-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Mengimpor...</span>
                    </>
                  ) : (
                    <span>Mulai Impor Data</span>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Camera Modal */}
      {isCameraOpen && (
        <LiveReceiptScanner 
          onClose={() => setIsCameraOpen(false)} 
          onCapture={handleCameraCapture} 
        />
      )}
    </Layout>
  );
}

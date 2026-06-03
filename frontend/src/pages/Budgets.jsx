import { useEffect, useState } from 'react';
import { useFinanceStore } from '../store/financeStore';
import Layout from '../components/Layout';
import { Plus, Trash2, Edit3, X, AlertTriangle, CheckCircle, HelpCircle, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { SkeletonCard } from '../components/Skeleton';

export default function Budgets() {
  const { budgets, fetchBudgets, createBudget, updateBudget, deleteBudget, copyPreviousBudgets, loadingBudgets, categories, fetchCategories } = useFinanceStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [copying, setCopying] = useState(false);

  // Form Fields
  const [category, setCategory] = useState('Makanan');
  const [amountLimit, setAmountLimit] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    fetchBudgets(currentMonth, currentYear);
    fetchCategories();
  }, [fetchBudgets, fetchCategories]);

  const openAddModal = () => {
    setEditingBudget(null);
    setCategory(expenseCategories[0] || 'Makanan');
    setAmountLimit('');
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (b) => {
    setEditingBudget(b);
    setCategory(b.category);
    setAmountLimit(Math.floor(parseFloat(b.amount_limit)).toString());
    setError('');
    setModalOpen(true);
  };

  const formatRupiahInput = (value) => {
    if (!value) return '';
    return new Intl.NumberFormat('id-ID').format(value);
  };

  const handleAmountLimitChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    setAmountLimit(rawValue);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!category || !amountLimit) {
      setError('Kategori dan batas nominal wajib diisi.');
      toast.error('Kategori dan batas nominal wajib diisi.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      if (editingBudget) {
        await updateBudget(editingBudget.id, { amount_limit: parseFloat(amountLimit) });
        toast.success('Anggaran berhasil diperbarui!');
      } else {
        await createBudget({
          category,
          amount_limit: parseFloat(amountLimit),
          period_month: currentMonth,
          period_year: currentYear
        });
        toast.success('Anggaran berhasil dibuat!');
      }
      setModalOpen(false);
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan.');
      toast.error(err.message || 'Gagal menyimpan anggaran.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus anggaran ini?')) {
      try {
        await deleteBudget(id);
        toast.success('Anggaran berhasil dihapus!');
      } catch (err) {
        toast.error(err.message || 'Gagal menghapus anggaran.');
      }
    }
  };

  const handleCopyBudgets = async () => {
    setCopying(true);
    try {
      const res = await copyPreviousBudgets(currentMonth, currentYear);
      toast.success(res.message || 'Anggaran berhasil disalin!');
    } catch (err) {
      toast.error(err.message || 'Gagal menyalin anggaran.');
    } finally {
      setCopying(false);
    }
  };

  const formatIDR = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const defaultExpenseCategories = ['Makanan', 'Transportasi', 'Belanja', 'Tagihan', 'Hiburan', 'Kesehatan', 'Pendidikan', 'Lainnya'];
  const expenseCategories = categories.filter(c => c.type === 'expense').length > 0
    ? categories.filter(c => c.type === 'expense').map(c => c.name)
    : defaultExpenseCategories;

  const categoriesList = expenseCategories;

  return (
    <Layout>
      <div className="space-y-8 select-none">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold font-outfit tracking-tight">Anggaran Bulanan</h1>
            <p className="text-slate-400 text-sm mt-1">
              Batas pengeluaran bulanan per kategori untuk mengendalikan pengeluaran Anda.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="bg-primary hover:bg-primary-dark text-white px-5 py-3 rounded-xl text-sm font-semibold flex items-center space-x-2 shadow-lg shadow-primary/20 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>Buat Anggaran</span>
          </button>
        </div>

        {/* Budgets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {loadingBudgets ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : budgets.length === 0 ? (
            <div className="col-span-full bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center">
              <CheckCircle className="w-12 h-12 text-emerald-500/80 mx-auto mb-4" />
              <h3 className="text-lg font-bold">Belum ada anggaran bulanan</h3>
              <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
                Buat batasan bulanan (misal: budget belanja atau makan) agar pengeluaran Anda lebih terkontrol.
              </p>
              <div className="flex justify-center space-x-3 mt-4">
                <button
                  onClick={handleCopyBudgets}
                  disabled={copying}
                  className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-semibold disabled:opacity-50"
                >
                  {copying ? 'Menyalin...' : 'Salin dari Bulan Lalu'}
                </button>
                <button
                  onClick={openAddModal}
                  className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-xs font-semibold"
                >
                  Buat Anggaran Pertama
                </button>
              </div>
            </div>
          ) : (
            budgets.map(b => {
              const limit = parseFloat(b.amount_limit);
              const spent = parseFloat(b.total_spent || 0);
              const percent = Math.min(Math.round((spent / limit) * 100), 100);
              const remaining = Math.max(limit - spent, 0);

              // Colors based on spending limit percentage
              let progressColor = 'bg-emerald-500';
              let borderColor = 'border-slate-800';
              let alertText = null;

              if (spent >= limit) {
                progressColor = 'bg-rose-500';
                borderColor = 'border-rose-500/35';
                alertText = 'Batas limit terlampaui!';
              } else if (percent >= 80) {
                progressColor = 'bg-yellow-500';
                borderColor = 'border-yellow-500/35';
                alertText = 'Hampir menyentuh limit (>= 80%)';
              }

              return (
                <div
                  key={b.id}
                  className={`bg-slate-900/60 border ${borderColor} rounded-3xl p-6 transition-all duration-200 hover:border-slate-700`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">{b.category}</h3>
                      <span className="text-xs text-slate-500 block mt-0.5">Bulan Ini</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openEditModal(b)}
                        className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-slate-800/40 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 rounded-lg hover:bg-slate-800 transition-colors"
                        title="Edit Budget"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(b.id)}
                        className="p-2 text-slate-400 hover:text-red-400 bg-slate-800/40 rounded-lg hover:bg-red-500/10 transition-colors"
                        title="Hapus Budget"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Info */}
                  <div className="mt-6 space-y-2">
                    <div className="flex justify-between text-xs font-semibold text-slate-400">
                      <span>Terpakai ({percent}%)</span>
                      <span>Sisa: {formatIDR(remaining)}</span>
                    </div>
                    {/* Progress Bar Track */}
                    <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden">
                      <div className={`h-full ${progressColor} transition-all duration-505`} style={{ width: `${percent}%` }} />
                    </div>
                  </div>

                  <div className="flex justify-between items-end mt-4 pt-4 border-t border-slate-800/50">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase font-semibold">Telah Dibelanjakan</span>
                      <span className="text-base font-bold text-slate-900 dark:text-white">{formatIDR(spent)}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block uppercase font-semibold">Limit Anggaran</span>
                      <span className="text-base font-bold text-primary-light">{formatIDR(limit)}</span>
                    </div>
                  </div>

                  {/* Warning Alerts */}
                  {alertText && (
                    <div className={`mt-4 px-3.5 py-2 rounded-xl flex items-center space-x-2 text-xs font-semibold ${
                      spent >= limit ? 'bg-rose-500/10 text-rose-400' : 'bg-yellow-500/10 text-yellow-400'
                    }`}>
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{alertText}</span>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-2xl relative max-h-[90vh] flex flex-col overflow-y-auto">
              <button
                onClick={() => setModalOpen(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-800 dark:hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>

              <h2 className="text-2xl font-bold font-outfit mb-6">
                {editingBudget ? 'Ubah Batas Anggaran' : 'Buat Anggaran Baru'}
              </h2>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-2.5 rounded-xl mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {!editingBudget && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Kategori Belanja</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl py-2.5 px-4 outline-none focus:border-primary"
                      required
                    >
                      {categoriesList.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Limit Anggaran (Rp)</label>
                  <input
                    type="text"
                    placeholder="misal: 1000000"
                    value={formatRupiahInput(amountLimit)}
                    onChange={handleAmountLimitChange}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl py-2.5 px-4 outline-none focus:border-primary"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-gradient-to-r from-primary to-primary-dark text-white py-3 rounded-xl font-semibold shadow-lg shadow-primary/10 flex items-center justify-center mt-6 disabled:opacity-50 space-x-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>{editingBudget ? 'Simpan Batas' : 'Buat Batas Bulanan'}</span>
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

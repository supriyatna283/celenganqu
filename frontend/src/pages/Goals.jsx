import { useEffect, useState } from 'react';
import { useFinanceStore } from '../store/financeStore';
import Layout from '../components/Layout';
import { Plus, Trash2, Edit3, X, PiggyBank, Target, Calendar, ArrowUpRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { SkeletonCard } from '../components/Skeleton';

export default function Goals() {
  const {
    goals,
    accounts,
    fetchGoals,
    fetchAccounts,
    createGoal,
    updateGoal,
    deleteGoal,
    depositToGoal,
    loadingGoals
  } = useFinanceStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [selectedGoalForDeposit, setSelectedGoalForDeposit] = useState(null);

  // Goal Form Fields
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [color, setColor] = useState('#1A56A0');

  // Deposit Form Fields
  const [sourceAccountId, setSourceAccountId] = useState('');
  const [depositAmount, setDepositAmount] = useState('');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchGoals();
    fetchAccounts();
  }, [fetchGoals, fetchAccounts]);

  // Sync default source account selection for deposits
  useEffect(() => {
    if (accounts.length > 0 && !sourceAccountId) {
      setSourceAccountId(accounts[0].id.toString());
    }
  }, [accounts, sourceAccountId]);

  const openAddModal = () => {
    setEditingGoal(null);
    setName('');
    setTargetAmount('');
    setTargetDate('');
    setColor('#1A56A0');
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (g) => {
    setEditingGoal(g);
    setName(g.name);
    setTargetAmount(Math.floor(parseFloat(g.target_amount)).toString());
    setTargetDate(g.target_date || '');
    setColor(g.color || '#1A56A0');
    setError('');
    setModalOpen(true);
  };

  const handleTargetAmountChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    setTargetAmount(rawValue);
  };

  const handleDepositAmountChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    setDepositAmount(rawValue);
  };

  const formatRupiahInput = (value) => {
    if (!value) return '';
    return new Intl.NumberFormat('id-ID').format(value);
  };

  const openDepositModal = (g) => {
    setSelectedGoalForDeposit(g);
    setSourceAccountId(accounts[0]?.id.toString() || '');
    setDepositAmount('');
    setError('');
    setDepositModalOpen(true);
  };

  const handleSubmitGoal = async (e) => {
    e.preventDefault();
    if (!name || !targetAmount) {
      setError('Nama tujuan dan target nominal wajib diisi.');
      toast.error('Nama tujuan dan target nominal wajib diisi.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const data = {
        name,
        target_amount: parseFloat(targetAmount),
        target_date: targetDate || null,
        color
      };

      if (editingGoal) {
        await updateGoal(editingGoal.id, data);
        toast.success('Target tabungan berhasil diperbarui!');
      } else {
        await createGoal(data);
        toast.success('Target tabungan berhasil dibuat!');
      }
      setModalOpen(false);
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan.');
      toast.error(err.message || 'Gagal menyimpan target tabungan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitDeposit = async (e) => {
    e.preventDefault();
    if (!sourceAccountId || !depositAmount) {
      setError('Harap isi semua kolom.');
      toast.error('Harap isi semua kolom.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await depositToGoal(selectedGoalForDeposit.id, {
        account_id: parseInt(sourceAccountId),
        amount: parseFloat(depositAmount)
      });
      toast.success('Dana berhasil disimpan ke target tabungan!');
      setDepositModalOpen(false);
    } catch (err) {
      setError(err.message || 'Gagal menabung.');
      toast.error(err.message || 'Gagal menabung dana.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus tujuan keuangan ini?')) {
      try {
        await deleteGoal(id);
        toast.success('Target tabungan berhasil dihapus!');
      } catch (err) {
        toast.error(err.message || 'Gagal menghapus target tabungan.');
      }
    }
  };

  const formatIDR = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const colors = ['#1A56A0', '#1D6F42', '#C0392B', '#8E44AD', '#D35400', '#2C3E50', '#16A085'];

  return (
    <Layout>
      <div className="space-y-8 select-none">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold font-outfit tracking-tight">Tujuan Keuangan</h1>
            <p className="text-slate-400 text-sm mt-1">
              Rencanakan target tabungan impian Anda dan pantau progress pencapaiannya.
            </p>
          </div>
          <button
            onClick={openAddModal}
            className="bg-primary hover:bg-primary-dark text-white px-5 py-3 rounded-xl text-sm font-semibold flex items-center space-x-2 shadow-lg shadow-primary/20 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>Target Baru</span>
          </button>
        </div>

        {/* Goals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loadingGoals ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : goals.length === 0 ? (
            <div className="col-span-full bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center">
              <PiggyBank className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold">Belum ada target tabungan</h3>
              <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
                Beli kendaraan, liburan, rumah, atau dana darurat? Buat target tabungan dan mulailah menyisihkan uang Anda!
              </p>
              <button
                onClick={openAddModal}
                className="mt-4 bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-xl text-xs font-semibold"
              >
                Buat Target Pertama
              </button>
            </div>
          ) : (
            goals.map(g => {
              const target = parseFloat(g.target_amount);
              const current = parseFloat(g.current_amount || 0);
              const percent = Math.min(Math.round((current / target) * 100), 100);

              return (
                <div
                  key={g.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between hover:border-slate-700 transition-all duration-300"
                >
                  {/* Goal Accent Color Top */}
                  <div className="absolute top-0 inset-x-0 h-1.5" style={{ backgroundColor: g.color }} />

                  <div>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white truncate max-w-[180px]">{g.name}</h3>
                        {g.target_date && (
                          <span className="text-[10px] text-slate-500 flex items-center space-x-1 mt-1">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Target: {g.target_date}</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openEditModal(g)}
                          className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-slate-800 dark:hover:text-white bg-slate-100 dark:bg-slate-800/40 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 rounded-lg hover:bg-slate-800 transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(g.id)}
                          className="p-2 text-slate-400 hover:text-red-400 bg-slate-800/40 rounded-lg hover:bg-red-500/10 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Progress */}
                    <div className="mt-8 space-y-2">
                      <div className="flex justify-between text-xs font-semibold text-slate-400">
                        <span>Terkumpul ({percent}%)</span>
                        <span>Target: {formatIDR(target)}</span>
                      </div>
                      <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${percent}%`,
                            backgroundColor: g.color || '#1A56A0'
                          }}
                        />
                      </div>
                      <span className="text-xl font-bold text-slate-900 dark:text-white block mt-2">
                        {formatIDR(current)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-800/50">
                    {g.is_completed ? (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-center py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5">
                        <Target className="w-4 h-4" />
                        <span>Target Tercapai!</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => openDepositModal(g)}
                        className="w-full bg-slate-800 hover:bg-slate-750 text-white py-2.5 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors duration-200"
                      >
                        <ArrowUpRight className="w-4 h-4 text-primary-light" />
                        <span>Tabung Dana</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Goal (Add / Edit) */}
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
                {editingGoal ? 'Edit Target Tabungan' : 'Buat Target Baru'}
              </h2>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-2.5 rounded-xl mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmitGoal} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Nama Target</label>
                  <input
                    type="text"
                    placeholder="misal: Beli Motor, Dana Darurat"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl py-2.5 px-4 outline-none focus:border-primary"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Target Nominal (Rp)</label>
                  <input
                    type="text"
                    placeholder="0"
                    value={formatRupiahInput(targetAmount)}
                    onChange={handleTargetAmountChange}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl py-2.5 px-4 outline-none focus:border-primary"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Target Tanggal (Opsional)</label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl py-2.5 px-4 outline-none focus:border-primary"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Warna Tema</label>
                  <div className="flex flex-wrap gap-2">
                    {colors.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${
                          color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'
                        }`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
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
                    <span>{editingGoal ? 'Simpan Target' : 'Buat Target Tabungan'}</span>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Modal Deposit (Tabung Uang) */}
        {depositModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-2xl relative max-h-[90vh] flex flex-col overflow-y-auto">
              <button
                onClick={() => setDepositModalOpen(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-slate-800 dark:hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>

              <h2 className="text-2xl font-bold font-outfit mb-2">Tabung Dana Ke Target</h2>
              <p className="text-slate-400 text-xs mb-6">Pindahkan sebagian saldo Anda ke target tabungan "{selectedGoalForDeposit?.name}".</p>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-2.5 rounded-xl mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmitDeposit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Sumber Akun Asal</label>
                  <select
                    value={sourceAccountId}
                    onChange={(e) => setSourceAccountId(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-xl py-2.5 px-4 outline-none focus:border-primary"
                    required
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name} ({formatIDR(acc.balance)})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Nominal Tabungan (Rp)</label>
                  <input
                    type="text"
                    placeholder="0"
                    value={formatRupiahInput(depositAmount)}
                    onChange={handleDepositAmountChange}
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
                      <span>Mentransfer...</span>
                    </>
                  ) : (
                    <span>Konfirmasi Tabungan</span>
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

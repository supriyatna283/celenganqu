import { useEffect, useState } from 'react';
import { useFinanceStore } from '../store/financeStore';
import Layout from '../components/Layout';
import { Plus, Trash2, Edit3, X, CreditCard, Sparkles, Loader2, UserPlus, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { SkeletonCard } from '../components/Skeleton';
import { useConfirmStore } from '../store/confirmStore';
import EmptyState from '../components/EmptyState';

export default function Accounts() {
  const { confirm } = useConfirmStore();
  const {
    accounts,
    fetchAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
    shareAccount,
    loadingAccounts,
    hideNominal
  } = useFinanceStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [activeAccountId, setActiveAccountId] = useState(null);

  // Form Fields
  const [name, setName] = useState('');
  const [type, setType] = useState('savings');
  const [balance, setBalance] = useState('');
  const [color, setColor] = useState('#1A56A0');

  // Share Form Fields
  const [shareEmail, setShareEmail] = useState('');
  const [shareRole, setShareRole] = useState('editor');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const openAddModal = () => {
    setEditingAccount(null);
    setName('');
    setType('savings');
    setBalance('');
    setColor('#1A56A0');
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (acc) => {
    setEditingAccount(acc);
    setName(acc.name);
    setType(acc.type);
    setBalance(parseFloat(acc.balance));
    setColor(acc.color || '#1A56A0');
    setError('');
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !type) {
      setError('Nama dan tipe akun wajib diisi.');
      toast.error('Nama dan tipe akun wajib diisi.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      if (editingAccount) {
        await updateAccount(editingAccount.id, { name, type, color });
        toast.success('Akun berhasil diperbarui!');
      } else {
        await createAccount({ name, type, balance: parseFloat(balance) || 0, color });
        toast.success('Akun berhasil dibuat!');
      }
      setModalOpen(false);
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan.');
      toast.error(err.message || 'Gagal menyimpan akun.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirm('Konfirmasi Tindakan', 'Apakah Anda yakin ingin menghapus akun ini?');
    if (isConfirmed) {
      try {
        await deleteAccount(id);
        toast.success('Akun berhasil dihapus!');
      } catch (err) {
        toast.error(err.message || 'Gagal menghapus akun.');
      }
    }
  };

  const openShareModal = (id) => {
    setActiveAccountId(id);
    setShareEmail('');
    setShareRole('editor');
    setError('');
    setShareModalOpen(true);
  };

  const handleShare = async (e) => {
    e.preventDefault();
    if (!shareEmail) return;
    setSubmitting(true);
    setError('');
    try {
      const result = await shareAccount(activeAccountId, shareEmail, shareRole);
      toast.success(result.message || 'Akun berhasil dibagikan!');
      setShareModalOpen(false);
    } catch (err) {
      setError(err.message || 'Gagal membagikan akun.');
    } finally {
      setSubmitting(false);
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

  const formatRupiahInput = (value) => {
    if (!value) return '';
    return new Intl.NumberFormat('id-ID').format(value);
  };

  const handleBalanceChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    setBalance(rawValue);
  };

  const accountTypes = [
    { value: 'savings', label: 'Tabungan Bank' },
    { value: 'wallet', label: 'Dompet / Cash' },
    { value: 'credit', label: 'Kartu Kredit' },
    { value: 'investment', label: 'Investasi' }
  ];

  const colors = ['#1A56A0', '#1D6F42', '#C0392B', '#8E44AD', '#D35400', '#2C3E50', '#16A085'];

  return (
    <Layout>
      <div className="space-y-8 select-none">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold font-outfit tracking-tight">Akun Keuangan</h1>
            <p className="text-slate-400 text-sm mt-1">Kelola beberapa dompet, bank, atau investasi Anda dalam satu tempat.</p>
          </div>
          <button
            onClick={openAddModal}
            className="bg-primary hover:bg-primary-dark text-white px-5 py-3 rounded-xl text-sm font-semibold flex items-center space-x-2 shadow-lg shadow-primary/20 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Akun</span>
          </button>
        </div>

        {/* Grid of Accounts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loadingAccounts ? (
            <>
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </>
          ) : accounts.length === 0 ? (
            <EmptyState
              icon={CreditCard}
              title="Belum ada akun keuangan"
              description="Mulai kelola keuangan Anda dengan membuat akun pertama, seperti dompet tunai atau rekening bank utama Anda."
              buttonText="Buat Akun Pertama"
              onAction={openAddModal}
            />
          ) : (
            accounts.map(acc => (
              <div
                key={acc.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl p-6 relative overflow-hidden group hover:border-slate-700 transition-all duration-300"
              >
                {/* Accent top line */}
                <div className="absolute top-0 inset-x-0 h-1.5" style={{ backgroundColor: acc.color }} />

                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 capitalize block flex items-center space-x-1">
                      <span>{acc.type}</span>
                      {acc.is_shared && (
                        <>
                          <span>•</span>
                          <Users className="w-3 h-3 text-indigo-400" />
                          <span className="text-indigo-400">Shared by {acc.owner?.name}</span>
                        </>
                      )}
                    </span>
                    <h3 className="text-xl font-bold mt-1 text-slate-900 dark:text-white truncate max-w-[180px]">{acc.name}</h3>
                  </div>

                  {!acc.is_shared && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => openShareModal(acc.id)}
                        className="p-2 text-indigo-500 dark:text-indigo-400 hover:text-white bg-indigo-50 dark:bg-indigo-500/10 rounded-lg hover:bg-indigo-500 dark:hover:bg-indigo-500/30 transition-colors"
                        title="Bagikan Akun"
                      >
                        <UserPlus className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(acc)}
                        className="p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800/40 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                        title="Edit Akun"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(acc.id)}
                        className="p-2 text-slate-400 hover:text-red-500 dark:hover:text-red-400 bg-slate-100 dark:bg-slate-800/40 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                        title="Hapus Akun"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="mt-8">
                  <span className="text-xs text-slate-500 block uppercase font-semibold">Saldo Saat Ini</span>
                  <span className="text-2xl font-black text-slate-900 dark:text-white mt-1 block tracking-tight">
                    {formatIDR(acc.balance)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {modalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-2xl relative max-h-[90vh] flex flex-col overflow-y-auto">
              <button
                onClick={() => setModalOpen(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>

              <h2 className="text-2xl font-bold font-outfit mb-6">
                {editingAccount ? 'Edit Akun Keuangan' : 'Tambah Akun Baru'}
              </h2>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-2.5 rounded-xl mb-4">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Nama Akun</label>
                  <input
                    type="text"
                    placeholder="misal: Bank BCA, Dompet Utama"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-white rounded-xl py-2.5 px-4 outline-none focus:border-primary"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Tipe Akun</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-white rounded-xl py-2.5 px-4 outline-none focus:border-primary capitalize"
                  >
                    {accountTypes.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {!editingAccount && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Saldo Awal (Rp)</label>
                    <input
                      type="text"
                      placeholder="0"
                      value={formatRupiahInput(balance)}
                      onChange={handleBalanceChange}
                      className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-white rounded-xl py-2.5 px-4 outline-none focus:border-primary"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Warna Penanda</label>
                  <div className="flex flex-wrap gap-2">
                    {colors.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        className={`w-8 h-8 rounded-full border-2 transition-all ${color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'
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
                    <span>{editingAccount ? 'Simpan Perubahan' : 'Buat Akun'}</span>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Share Modal */}
        {shareModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-2xl relative max-h-[90vh] flex flex-col overflow-y-auto">
              <button
                onClick={() => setShareModalOpen(false)}
                className="absolute top-6 right-6 text-slate-400 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="mb-6 text-center">
                <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-indigo-400" />
                </div>
                <h2 className="text-2xl font-bold font-outfit text-white">Bagikan Akun</h2>
                <p className="text-slate-400 text-sm mt-1">Undang pasangan atau partner bisnis untuk mencatat bersama di akun ini.</p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-2.5 rounded-xl mb-4 text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleShare} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Email Pengguna CelenganQu</label>
                  <input
                    type="email"
                    placeholder="misal: istri@email.com"
                    value={shareEmail}
                    onChange={(e) => setShareEmail(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-white rounded-xl py-2.5 px-4 outline-none focus:border-indigo-500"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Hak Akses</label>
                  <select
                    value={shareRole}
                    onChange={(e) => setShareRole(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-white rounded-xl py-2.5 px-4 outline-none focus:border-indigo-500"
                  >
                    <option value="editor">Editor (Bisa mencatat transaksi)</option>
                    <option value="viewer">Viewer (Hanya bisa melihat)</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-xl font-semibold shadow-lg flex items-center justify-center mt-6 disabled:opacity-50 space-x-2 transition-all"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Mengirim Undangan...</span>
                    </>
                  ) : (
                    <span>Bagikan Sekarang</span>
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

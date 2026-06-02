import { useEffect, useState } from 'react';
import { useFinanceStore } from '../store/financeStore';
import Layout from '../components/Layout';
import { Plus, Trash2, Edit3, X, CreditCard, Sparkles, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { SkeletonCard } from '../components/Skeleton';

export default function Accounts() {
  const { accounts, fetchAccounts, createAccount, updateAccount, deleteAccount, loadingAccounts } = useFinanceStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);

  // Form Fields
  const [name, setName] = useState('');
  const [type, setType] = useState('savings');
  const [balance, setBalance] = useState('');
  const [color, setColor] = useState('#1A56A0');
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
    if (window.confirm('Apakah Anda yakin ingin menghapus akun ini?')) {
      try {
        await deleteAccount(id);
        toast.success('Akun berhasil dihapus!');
      } catch (err) {
        toast.error(err.message || 'Gagal menghapus akun.');
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
            className="bg-[#1A56A0] hover:bg-[#164882] text-white px-5 py-3 rounded-xl text-sm font-semibold flex items-center space-x-2 shadow-lg shadow-[#1A56A0]/20 transition-all duration-200"
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
            <div className="col-span-full bg-slate-900/30 border border-slate-800 rounded-3xl p-12 text-center">
              <CreditCard className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold">Belum ada akun</h3>
              <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">Mulai dengan membuat akun keuangan seperti dompet tunai atau rekening bank Anda.</p>
              <button
                onClick={openAddModal}
                className="mt-4 bg-[#1A56A0] hover:bg-[#164882] text-white px-4 py-2 rounded-xl text-xs font-semibold"
              >
                Buat Akun Pertama
              </button>
            </div>
          ) : (
            accounts.map(acc => (
              <div
                key={acc.id}
                className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-6 relative overflow-hidden group hover:border-slate-700 transition-all duration-300"
              >
                {/* Accent top line */}
                <div className="absolute top-0 inset-x-0 h-1.5" style={{ backgroundColor: acc.color }} />

                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-400 capitalize block">{acc.type}</span>
                    <h3 className="text-xl font-bold mt-1 text-white truncate max-w-[180px]">{acc.name}</h3>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => openEditModal(acc)}
                      className="p-2 text-slate-400 hover:text-white bg-slate-800/40 rounded-lg hover:bg-slate-800 transition-colors"
                      title="Edit Akun"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(acc.id)}
                      className="p-2 text-slate-400 hover:text-red-400 bg-slate-800/40 rounded-lg hover:bg-red-500/10 transition-colors"
                      title="Hapus Akun"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-8">
                  <span className="text-xs text-slate-500 block uppercase font-semibold">Saldo Saat Ini</span>
                  <span className="text-2xl font-black text-white mt-1 block tracking-tight">
                    {formatIDR(acc.balance)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal (Add / Edit) */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl relative">
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
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-2.5 px-4 outline-none focus:border-[#1A56A0]"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block">Tipe Akun</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-2.5 px-4 outline-none focus:border-[#1A56A0] capitalize"
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
                      type="number"
                      placeholder="0"
                      value={balance}
                      onChange={(e) => setBalance(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl py-2.5 px-4 outline-none focus:border-[#1A56A0]"
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
                  className="w-full bg-gradient-to-r from-[#1A56A0] to-[#164882] text-white py-3 rounded-xl font-semibold shadow-lg shadow-[#1A56A0]/10 flex items-center justify-center mt-6 disabled:opacity-50 space-x-2"
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
      </div>
    </Layout>
  );
}

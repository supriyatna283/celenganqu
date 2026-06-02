import { useEffect, useState } from 'react';
import { useFinanceStore } from '../store/financeStore';
import Layout from '../components/Layout';
import { Plus, Trash2, X, Folder, HelpCircle, Utensils, Car, ShoppingBag, Film, CreditCard, HeartPulse, Briefcase, TrendingUp, Gift, Home, BookOpen, Smartphone, Plane, Activity } from 'lucide-react';
import toast from 'react-hot-toast';

// Helper to map icon names to Lucide icon components
const IconMap = {
  Folder: Folder,
  Utensils: Utensils,
  Car: Car,
  ShoppingBag: ShoppingBag,
  Film: Film,
  CreditCard: CreditCard,
  HeartPulse: HeartPulse,
  Briefcase: Briefcase,
  TrendingUp: TrendingUp,
  Gift: Gift,
  Home: Home,
  BookOpen: BookOpen,
  Smartphone: Smartphone,
  Plane: Plane,
  Activity: Activity,
  HelpCircle: HelpCircle
};

const PRESETS_COLORS = [
  '#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EC4899', '#6B7280',
  '#F43F5E', '#14B8A6', '#06B6D4', '#6366F1', '#A855F7', '#D946EF', '#84CC16'
];

export default function Settings() {
  const { categories, fetchCategories, createCustomCategory, deleteCustomCategory, loadingCategories } = useFinanceStore();
  const [activeTab, setActiveTab] = useState('expense');
  const [modalOpen, setModalOpen] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [type, setType] = useState('expense');
  const [color, setColor] = useState('#3B82F6');
  const [icon, setIcon] = useState('Folder');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Nama kategori tidak boleh kosong.');
      return;
    }

    setSubmitting(true);
    try {
      await createCustomCategory({ name, type, color, icon });
      toast.success('Kategori berhasil ditambahkan!');
      setModalOpen(false);
      setName('');
      setIcon('Folder');
      setColor('#3B82F6');
    } catch (err) {
      toast.error(err.message || 'Gagal menambahkan kategori.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus kategori ini? Transaksi yang sudah menggunakan kategori ini tidak akan terhapus, namun kategori ini tidak akan muncul lagi di pilihan.')) {
      try {
        await deleteCustomCategory(id);
        toast.success('Kategori berhasil dihapus!');
      } catch (err) {
        toast.error(err.message || 'Gagal menghapus kategori.');
      }
    }
  };

  const filteredCategories = categories.filter(c => c.type === activeTab);

  return (
    <Layout>
      <div className="space-y-8 select-none">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-outfit">Pengaturan</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Kelola preferensi dan kategori kustom Anda.</p>
          </div>
          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md shadow-indigo-100 dark:shadow-none transition duration-200 font-medium"
          >
            <Plus size={18} />
            Kategori Baru
          </button>
        </div>

        {/* Settings Panel */}
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl border border-slate-100 dark:border-slate-700/50 p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-slate-800 dark:text-white font-outfit mb-4">Manajemen Kategori</h2>
          
          {/* Tabs */}
          <div className="flex border-b border-slate-100 dark:border-slate-700 mb-6">
            <button
              onClick={() => setActiveTab('expense')}
              className={`px-4 py-2.5 font-medium text-sm transition-all border-b-2 -mb-[2px] ${
                activeTab === 'expense'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              Pengeluaran (Expense)
            </button>
            <button
              onClick={() => setActiveTab('income')}
              className={`px-4 py-2.5 font-medium text-sm transition-all border-b-2 -mb-[2px] ${
                activeTab === 'income'
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              Pemasukan (Income)
            </button>
          </div>

          {loadingCategories ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              Belum ada kategori kustom untuk jenis ini.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCategories.map((cat) => {
                const SelectedIcon = IconMap[cat.icon] || HelpCircle;
                return (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700/30 hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="p-2.5 rounded-lg text-white"
                        style={{ backgroundColor: cat.color || '#3B82F6' }}
                      >
                        <SelectedIcon size={20} />
                      </div>
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{cat.name}</span>
                        <span className="block text-xs text-slate-400 capitalize">{cat.type === 'expense' ? 'Pengeluaran' : 'Pemasukan'}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(cat.id)}
                      className="p-2 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                      title="Hapus Kategori"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Category Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-950 dark:text-white font-outfit">Tambah Kategori Baru</h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="p-6 space-y-5">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Nama Kategori
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Kopi, Bioskop, Investasi Emas"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>

                {/* Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Jenis Kategori
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setType('expense')}
                      className={`py-2 px-4 rounded-xl border font-medium transition ${
                        type === 'expense'
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-650 dark:text-indigo-400'
                          : 'border-slate-200 dark:border-slate-700 bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                      }`}
                    >
                      Pengeluaran
                    </button>
                    <button
                      type="button"
                      onClick={() => setType('income')}
                      className={`py-2 px-4 rounded-xl border font-medium transition ${
                        type === 'income'
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-650 dark:text-indigo-400'
                          : 'border-slate-200 dark:border-slate-700 bg-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900'
                      }`}
                    >
                      Pemasukan
                    </button>
                  </div>
                </div>

                {/* Preset Colors */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Warna Kategori
                  </label>
                  <div className="flex flex-wrap gap-2.5">
                    {PRESETS_COLORS.map((c) => (
                      <button
                        type="button"
                        key={c}
                        onClick={() => setColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-7 h-7 rounded-full transition-transform focus:outline-none ${
                          color === c ? 'scale-125 ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-slate-800' : 'hover:scale-110'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Preset Icons */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Ikon Kategori
                  </label>
                  <div className="grid grid-cols-6 gap-2 max-h-32 overflow-y-auto p-1 border border-slate-100 dark:border-slate-700/50 rounded-xl bg-slate-50 dark:bg-slate-900/50">
                    {Object.keys(IconMap).map((iconName) => {
                      const IconComp = IconMap[iconName];
                      return (
                        <button
                          type="button"
                          key={iconName}
                          onClick={() => setIcon(iconName)}
                          className={`flex items-center justify-center p-2 rounded-lg transition ${
                            icon === iconName
                              ? 'bg-indigo-600 text-white shadow-md'
                              : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-350'
                          }`}
                        >
                          <IconComp size={18} />
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl font-medium transition disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Kategori'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

import { useEffect, useState } from 'react';
import { useFinanceStore } from '../store/financeStore';
import Layout from '../components/Layout';
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  ToggleLeft,
  ToggleRight,
  TrendingDown
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useConfirmStore } from '../store/confirmStore';
import EmptyState from '../components/EmptyState';

export default function Subscriptions() {
  const { confirm } = useConfirmStore();
  const { recurrings, fetchRecurrings, toggleRecurring, deleteRecurring, loadingRecurrings, hideNominal } = useFinanceStore();
  
  useEffect(() => {
    fetchRecurrings();
  }, [fetchRecurrings]);

  const handleToggle = async (id) => {
    try {
      await toggleRecurring(id);
      toast.success('Status tagihan diperbarui.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirm('Konfirmasi Tindakan', 'Yakin ingin menghapus tagihan rutin ini?');
    if (isConfirmed) {
      try {
        await deleteRecurring(id);
        toast.success('Tagihan rutin dihapus.');
      } catch (err) {
        toast.error(err.message);
      }
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

  const calculateMonthlyFixedCost = () => {
    return recurrings
      .filter(r => r.is_active && r.type === 'expense')
      .reduce((total, r) => {
        let amount = parseFloat(r.amount);
        if (r.frequency === 'daily') amount *= 30;
        if (r.frequency === 'weekly') amount *= 4;
        if (r.frequency === 'yearly') amount /= 12;
        return total + amount;
      }, 0);
  };

  return (
    <Layout>
      <div className="space-y-8 select-none">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-outfit">Langganan & Tagihan</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Pantau tagihan tetap Anda. Sistem akan memotong otomatis pada tanggal jatuh tempo.</p>
          </div>
          <button className="bg-gradient-primary hover:brightness-110 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center space-x-2 shadow-lg shadow-primary/20 transition-all duration-200">
            <Plus className="w-4 h-4" />
            <span>Tambah Tagihan</span>
          </button>
        </div>

        {/* Dashboard Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 text-white shadow-lg shadow-primary/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-32 h-32 rounded-full bg-white/10 blur-2xl"></div>
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 p-3 rounded-2xl">
                  <TrendingDown className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-indigo-100 text-sm font-medium mb-1">Estimasi Beban Tetap Bulanan</p>
              <h2 className="text-3xl font-bold font-outfit tracking-tight">
                {formatIDR(calculateMonthlyFixedCost())}
              </h2>
            </div>
          </div>
        </div>

        {/* Subscriptions List */}
        <div className="bg-white/70 dark:bg-slate-900/40 border border-slate-150 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm">
          <div className="p-6 border-b border-slate-150 dark:border-slate-800">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
              <CreditCard className="w-5 h-5 text-indigo-500" />
              <span>Daftar Tagihan Aktif</span>
            </h2>
          </div>
          
          {loadingRecurrings ? (
            <div className="p-8 text-center text-slate-500">Memuat data tagihan...</div>
          ) : recurrings.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Calendar}
                title="Belum ada tagihan rutin"
                description="Tambahkan tagihan bulanan Anda seperti langganan internet, listrik, atau Netflix agar tidak ada yang terlewat."
                buttonText="Tambah Tagihan"
                onAction={() => window.location.href = '/transactions'}
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-850">
              {recurrings.map(r => (
                <div key={r.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-950/20 transition-all duration-200">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${r.is_active ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className={`font-bold text-base ${r.is_active ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>
                        {r.category}
                      </h3>
                      <div className="flex items-center space-x-2 text-xs mt-1">
                        <span className="text-slate-500 font-medium capitalize">{r.frequency}</span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className="text-slate-500">Dari rekening <span className="font-semibold">{r.account?.name}</span></span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between md:justify-end gap-6">
                    <div className="text-left md:text-right">
                      <div className={`text-lg font-bold ${r.is_active ? (r.type === 'expense' ? 'text-rose-600 dark:text-rose-450' : 'text-emerald-600 dark:text-emerald-450') : 'text-slate-400 dark:text-slate-600'}`}>
                        {r.type === 'expense' ? '-' : '+'} {formatIDR(r.amount)}
                      </div>
                      <div className="flex items-center md:justify-end text-[10px] mt-1 space-x-1">
                        <Clock className={`w-3 h-3 ${r.is_active ? 'text-amber-500' : 'text-slate-400'}`} />
                        <span className={r.is_active ? 'text-amber-600 dark:text-amber-400 font-semibold' : 'text-slate-400'}>
                          Jatuh tempo: {r.next_run_date}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 border-l border-slate-200 dark:border-slate-800 pl-6">
                      <button 
                        onClick={() => handleToggle(r.id)}
                        className={`p-2 rounded-lg transition-colors ${r.is_active ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-900/50' : 'text-slate-400 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700'}`}
                        title={r.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                      >
                        {r.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                      </button>
                      <button 
                        onClick={() => handleDelete(r.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Hapus"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

import { useEffect, useState } from 'react';
import { useFinanceStore } from '../store/financeStore';
import Layout from '../components/Layout';
import { Plus, Trash2, X, AlertTriangle, CheckCircle, Handshake, Calendar, DollarSign, Wallet, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useConfirmStore } from '../store/confirmStore';
import EmptyState from '../components/EmptyState';
import confetti from 'canvas-confetti';

export default function DebtLoans() {
  const { confirm } = useConfirmStore();
  const { 
    debtsLoans, 
    accounts,
    fetchDebtsLoans, 
    fetchAccounts,
    createDebtLoan, 
    payDebtLoan, 
    deleteDebtLoan, 
    loadingDebtsLoans,
    hideNominal
  } = useFinanceStore();

  const [activeTab, setActiveTab] = useState('debt'); // 'debt' or 'loan'
  const [modalOpen, setModalOpen] = useState(false);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // Add Form Fields
  const [personName, setPersonName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [addType, setAddType] = useState('debt');
  const [submitting, setSubmitting] = useState(false);

  // Pay Form Fields
  const [payAmount, setPayAmount] = useState('');
  const [accountId, setAccountId] = useState('');
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    fetchDebtsLoans();
    fetchAccounts();
  }, [fetchDebtsLoans, fetchAccounts]);

  useEffect(() => {
    if (accounts.length > 0 && !accountId) {
      setAccountId(accounts[0].id.toString());
    }
  }, [accounts, accountId]);

  const openAddModal = (type) => {
    setAddType(type);
    setPersonName('');
    setAmount('');
    setDueDate('');
    setDescription('');
    setModalOpen(true);
  };

  const openPayModal = (record) => {
    setSelectedRecord(record);
    setPayAmount(Math.floor(parseFloat(record.remaining_amount)).toString());
    setPayModalOpen(true);
  };

  const handleAmountChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    setAmount(rawValue);
  };

  const handlePayAmountChange = (e) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    setPayAmount(rawValue);
  };

  const formatRupiahInput = (value) => {
    if (!value) return '';
    return new Intl.NumberFormat('id-ID').format(value);
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!personName.trim() || !amount) {
      toast.error('Nama orang dan nominal wajib diisi.');
      return;
    }

    setSubmitting(true);
    try {
      await createDebtLoan({
        type: addType,
        person_name: personName.trim(),
        amount: parseFloat(amount),
        due_date: dueDate || null,
        description
      });
      toast.success(addType === 'debt' ? 'Catatan hutang berhasil dibuat!' : 'Catatan piutang berhasil dibuat!');
      setModalOpen(false);
    } catch (err) {
      toast.error(err.message || 'Gagal menyimpan catatan.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaySubmit = async (e) => {
    e.preventDefault();
    if (!payAmount || !accountId) {
      toast.error('Jumlah bayar dan akun wajib diisi.');
      return;
    }

    setPaying(true);
    try {
      const payVal = parseFloat(payAmount);
      const remaining = parseFloat(selectedRecord.remaining_amount || 0);

      await payDebtLoan(selectedRecord.id, {
        amount: payVal,
        account_id: parseInt(accountId)
      });
      toast.success('Pembayaran berhasil dicatat!');
      setPayModalOpen(false);

      if (payVal >= remaining) {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d', '#ff36ff']
        });
      }
    } catch (err) {
      toast.error(err.message || 'Gagal memproses pembayaran.');
    } finally {
      setPaying(false);
    }
  };

  const handleDelete = async (id) => {
    const isConfirmed = await confirm('Konfirmasi Tindakan', 'Apakah Anda yakin ingin menghapus catatan ini?');
    if (isConfirmed) {
      try {
        await deleteDebtLoan(id);
        toast.success('Catatan berhasil dihapus.');
      } catch (err) {
        toast.error(err.message || 'Gagal menghapus catatan.');
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

  const filteredRecords = debtsLoans.filter(r => r.type === activeTab);

  return (
    <Layout>
      <div className="space-y-8 select-none">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white font-outfit">Hutang & Piutang</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Kelola catatan hutang Anda ke pihak lain serta piutang orang lain ke Anda.</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => openAddModal('debt')}
              className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-md transition duration-200 font-medium"
            >
              <Plus size={18} />
              Catat Hutang
            </button>
            <button
              onClick={() => openAddModal('loan')}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition duration-200 font-medium"
            >
              <Plus size={18} />
              Catat Piutang
            </button>
          </div>
        </div>

        {/* Content Section */}
        <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-md rounded-2xl border border-slate-150 dark:border-slate-700/50 p-6 shadow-sm">
          {/* Tabs */}
          <div className="flex border-b border-slate-100 dark:border-slate-700 mb-6">
            <button
              onClick={() => setActiveTab('debt')}
              className={`px-5 py-3 font-medium text-sm transition-all border-b-2 -mb-[2px] flex items-center gap-2 ${
                activeTab === 'debt'
                  ? 'border-rose-600 text-rose-650 dark:text-rose-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <ArrowDownRight size={16} />
              Hutang Saya (Uang Keluar)
            </button>
            <button
              onClick={() => setActiveTab('loan')}
              className={`px-5 py-3 font-medium text-sm transition-all border-b-2 -mb-[2px] flex items-center gap-2 ${
                activeTab === 'loan'
                  ? 'border-emerald-600 text-emerald-650 dark:text-emerald-400'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
              }`}
            >
              <ArrowUpRight size={16} />
              Piutang Saya (Uang Masuk)
            </button>
          </div>

          {loadingDebtsLoans ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-650"></div>
            </div>
          ) : filteredRecords.length === 0 ? (
            <EmptyState
              icon={Handshake}
              title={`Belum ada catatan ${activeTab === 'debt' ? 'hutang' : 'piutang'}`}
              description={activeTab === 'debt' 
                ? 'Bagus! Anda tidak memiliki tanggungan hutang ke siapapun saat ini.' 
                : 'Belum ada orang yang meminjam uang dari Anda.'}
              buttonText={`Catat ${activeTab === 'debt' ? 'Hutang' : 'Piutang'} Baru`}
              onAction={() => openAddModal(activeTab)}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecords.map((record) => {
                const isPaid = record.status === 'paid';
                return (
                  <div
                    key={record.id}
                    className={`relative p-5 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800/60 flex flex-col justify-between hover:shadow-md transition-all duration-200 ${
                      isPaid ? 'opacity-65' : ''
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-lg">{record.person_name}</h4>
                          <span className={`inline-block text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${
                            isPaid 
                              ? 'bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400' 
                              : record.type === 'debt' 
                                ? 'bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-450' 
                                : 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-450'
                          }`}>
                            {isPaid ? 'Lunas' : record.type === 'debt' ? 'Hutang' : 'Piutang'}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="p-1 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                          title="Hapus Catatan"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>

                      <div className="space-y-2 mt-4">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Total Nominal:</span>
                          <span className="font-semibold text-slate-700 dark:text-slate-350">{formatIDR(record.amount)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Sisa Tagihan:</span>
                          <span className={`font-bold ${isPaid ? 'text-slate-500' : record.type === 'debt' ? 'text-rose-500' : 'text-emerald-500'}`}>
                            {formatIDR(record.remaining_amount)}
                          </span>
                        </div>
                        {record.due_date && (
                          <div className="flex justify-between text-xs items-center">
                            <span className="text-slate-400">Jatuh Tempo:</span>
                            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                              <Calendar size={12} />
                              {record.due_date}
                            </span>
                          </div>
                        )}
                        {record.description && (
                          <p className="text-xs text-slate-500 bg-slate-100 dark:bg-slate-900/50 p-2.5 rounded-xl mt-2 italic">
                            "{record.description}"
                          </p>
                        )}
                      </div>
                    </div>

                    {!isPaid && (
                      <button
                        onClick={() => openPayModal(record)}
                        className="w-full mt-5 py-2 text-center text-xs font-semibold rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-750 transition"
                      >
                        Catat Pembayaran
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Add Debt/Loan Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-950 dark:text-white font-outfit">
                {addType === 'debt' ? 'Catat Hutang Baru' : 'Catat Piutang Baru'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div className="p-6 space-y-4">
                {/* Person Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {addType === 'debt' ? 'Pemberi Hutang (Kreditur)' : 'Penerima Piutang (Debitur)'}
                  </label>
                  <input
                    type="text"
                    required
                    value={personName}
                    onChange={(e) => setPersonName(e.target.value)}
                    placeholder="misal: Bank Mandiri, Teman Andi"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>

                {/* Amount */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Nominal Pinjaman (Rp)
                  </label>
                  <input
                    type="text"
                    required
                    value={formatRupiahInput(amount)}
                    onChange={handleAmountChange}
                    placeholder="0"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>

                {/* Due Date */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Tanggal Jatuh Tempo (Opsional)
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Keterangan
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="misal: Untuk modal usaha, pinjaman bayar kuliah"
                    rows={3}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
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
                  className={`flex items-center gap-2 px-5 py-2 text-white rounded-xl font-medium transition disabled:opacity-50 ${
                    addType === 'debt' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Catatan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Pay Debt/Loan Modal */}
      {payModalOpen && selectedRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-700">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-700">
              <h3 className="text-lg font-bold text-slate-950 dark:text-white font-outfit">
                {selectedRecord.type === 'debt' ? 'Bayar Hutang' : 'Terima Cicilan Piutang'}
              </h3>
              <button
                onClick={() => setPayModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePaySubmit}>
              <div className="p-6 space-y-4">
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-xs space-y-1 border border-slate-100 dark:border-slate-800">
                  <p className="text-slate-500">Nama Orang: <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedRecord.person_name}</span></p>
                  <p className="text-slate-500">Sisa Tagihan: <span className="font-semibold text-slate-700 dark:text-slate-300">{formatIDR(selectedRecord.remaining_amount)}</span></p>
                </div>

                {/* Amount to Pay */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Nominal Pembayaran (Rp)
                  </label>
                  <input
                    type="text"
                    required
                    value={formatRupiahInput(payAmount)}
                    onChange={handlePayAmountChange}
                    placeholder="0"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  />
                </div>

                {/* Account to Link */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {selectedRecord.type === 'debt' ? 'Potong dari Akun' : 'Terima ke Akun'}
                  </label>
                  <select
                    required
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition"
                  >
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.name} ({formatIDR(acc.balance)})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                <button
                  type="button"
                  onClick={() => setPayModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={paying}
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-primary hover:brightness-110 text-white rounded-xl font-medium transition disabled:opacity-50"
                >
                  {paying ? 'Memproses...' : 'Catat Bayar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}

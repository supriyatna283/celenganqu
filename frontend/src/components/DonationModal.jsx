import React, { useState } from 'react';
import { Heart, X, Gift, ShieldCheck, ChevronRight } from 'lucide-react';

const DonationModal = ({ isOpen, onClose }) => {
  const [selectedAmount, setSelectedAmount] = useState(25000);
  const [customAmount, setCustomAmount] = useState('');

  if (!isOpen) return null;

  const amounts = [10000, 25000, 50000, 100000];

  const handleSelectAmount = (amount) => {
    setSelectedAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (e) => {
    const val = e.target.value.replace(/\D/g, '');
    setCustomAmount(val);
    setSelectedAmount(null);
  };

  const formatRupiah = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(value);
  };

  const handleDonate = () => {
    const finalAmount = customAmount ? parseInt(customAmount) : selectedAmount;
    if (!finalAmount || finalAmount < 1000) {
      alert("Nominal dukungan minimal Rp1.000");
      return;
    }
    
    // In a real app, this would redirect to Midtrans / Saweria / Trakteer
    // For now we will just show an alert or open a dummy link
    alert(`Terima kasih banyak atas niat baik Anda untuk mendukung CelenganQu sebesar ${formatRupiah(finalAmount)}! 💚\n\n(Simulasi tombol klik)`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>
      
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden relative z-10 animate-in zoom-in-95 duration-300 border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh]">
        {/* Header with Pattern */}
        <div className="relative bg-gradient-to-br from-emerald-400 to-primary p-8 text-white overflow-hidden shrink-0">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors backdrop-blur-md"
          >
            <X className="w-5 h-5 text-white" />
          </button>
          
          <div className="relative z-10 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-4 shadow-inner border border-white/30">
              <Heart className="w-8 h-8 text-white fill-white animate-pulse" />
            </div>
            <h2 className="text-2xl font-bold font-outfit mb-2 tracking-tight">Dukung CelenganQu</h2>
            <p className="text-emerald-50 text-sm leading-relaxed max-w-[280px]">
              Dukungan Anda membantu kami menjaga server tetap hidup & menghadirkan fitur baru.
            </p>
          </div>
        </div>

        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
          <div className="mb-6">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3 uppercase tracking-wider">Pilih Nominal</h3>
            <div className="grid grid-cols-2 gap-3">
              {amounts.map((amount) => (
                <button
                  key={amount}
                  onClick={() => handleSelectAmount(amount)}
                  className={`relative overflow-hidden py-3 px-4 rounded-2xl border-2 font-bold text-sm transition-all duration-200 ${
                    selectedAmount === amount
                      ? 'border-primary bg-primary/10 text-primary dark:text-primary-light dark:bg-primary/20 shadow-[0_0_15px_rgba(34,197,94,0.15)]'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:border-primary/50 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  {selectedAmount === amount && (
                    <div className="absolute top-0 right-0 w-8 h-8 bg-primary/10 rounded-bl-full"></div>
                  )}
                  {formatRupiah(amount)}
                </button>
              ))}
              
              <div className="col-span-2 relative mt-1">
                <input
                  type="text"
                  placeholder="Nominal Lainnya..."
                  value={customAmount ? formatRupiah(customAmount).replace('Rp', '').trim() : ''}
                  onChange={handleCustomAmountChange}
                  className={`w-full py-3 px-4 rounded-2xl border-2 font-bold text-sm transition-all duration-200 outline-none ${
                    customAmount
                      ? 'border-primary bg-primary/5 text-slate-900 dark:text-white dark:bg-primary/10'
                      : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-white placeholder:text-slate-400 font-normal focus:border-primary/50'
                  }`}
                />
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  {customAmount && <span className="font-bold text-sm text-slate-900 dark:text-white mr-1">Rp</span>}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 mb-8 border border-slate-100 dark:border-slate-800 flex items-start space-x-3">
            <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Donasi bersifat sukarela. Semua fitur CelenganQu tetap dapat digunakan 100% gratis tanpa batasan apapun.
            </p>
          </div>

          <button
            onClick={handleDonate}
            className="w-full relative group overflow-hidden bg-gradient-to-r from-emerald-500 to-primary hover:from-emerald-400 hover:to-emerald-500 text-white font-bold text-lg py-4 px-6 rounded-2xl transition-all duration-300 shadow-[0_8px_30px_rgb(16,185,129,0.3)] hover:shadow-[0_8px_40px_rgb(16,185,129,0.4)] hover:-translate-y-0.5 flex items-center justify-center space-x-2"
          >
            <div className="absolute inset-0 w-1/4 h-full bg-white/20 skew-x-[-20deg] group-hover:animate-[shine_1s_ease-in-out] -translate-x-full"></div>
            <Gift className="w-5 h-5" />
            <span>Beri Dukungan</span>
            <ChevronRight className="w-5 h-5 opacity-70 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shine {
          100% { transform: translateX(400%); }
        }
      `}} />
    </div>
  );
};

export default DonationModal;

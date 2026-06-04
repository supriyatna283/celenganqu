import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, CreditCard, ArrowLeftRight, Bot, ChevronRight, Check, X } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const slides = [
  {
    id: 'welcome',
    icon: Sparkles,
    iconColor: 'text-amber-500',
    iconBg: 'bg-amber-100 dark:bg-amber-500/20',
    title: 'Selamat Datang di CelenganQu!',
    description: 'Aplikasi manajemen keuangan pribadi yang cepat, aman, dan pintar. Mari kita lihat cara kerjanya dalam 3 langkah sederhana.'
  },
  {
    id: 'accounts',
    icon: CreditCard,
    iconColor: 'text-blue-500',
    iconBg: 'bg-blue-100 dark:bg-blue-500/20',
    title: '1. Buat Akun Keuangan',
    description: 'Pertama, tambahkan rekening bank, dompet digital, atau uang tunai yang Anda miliki di halaman Akun.'
  },
  {
    id: 'transactions',
    icon: ArrowLeftRight,
    iconColor: 'text-green-500',
    iconBg: 'bg-green-100 dark:bg-green-500/20',
    title: '2. Catat Transaksi',
    description: 'Setiap ada pemasukan atau pengeluaran, catat segera di halaman Transaksi agar arus kas Anda tetap terlacak.'
  },
  {
    id: 'ai',
    icon: Bot,
    iconColor: 'text-indigo-500',
    iconBg: 'bg-indigo-100 dark:bg-indigo-500/20',
    title: '3. Gunakan Asisten AI',
    description: 'Bingung mengatur anggaran? Ketuk ikon Robot di navigasi bawah untuk mendapatkan saran finansial yang cerdas dari AI kami!'
  }
];

export default function OnboardingTour() {
  const { user } = useAuthStore();
  const [isVisible, setIsVisible] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!user) return;
    const storageKey = `celenganqu_onboarded_${user.uuid}`;
    const hasSeen = localStorage.getItem(storageKey);
    
    // Slight delay so it doesn't pop up too aggressively upon render
    if (!hasSeen) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const finishOnboarding = () => {
    if (user) {
      const storageKey = `celenganqu_onboarded_${user.uuid}`;
      localStorage.setItem(storageKey, 'true');
    }
    setIsVisible(false);
  };

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      finishOnboarding();
    }
  };

  const skipTour = () => {
    finishOnboarding();
  };

  if (!isVisible) return null;

  const CurrentIcon = slides[currentSlide].icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 relative flex flex-col"
      >
        {/* Skip button */}
        <button
          onClick={skipTour}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content Area */}
        <div className="pt-12 px-8 pb-8 flex flex-col items-center text-center relative h-64 justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center w-full"
            >
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-6 ${slides[currentSlide].iconBg}`}>
                <CurrentIcon className={`w-10 h-10 ${slides[currentSlide].iconColor}`} />
              </div>
              <h3 className="text-xl font-bold font-outfit text-slate-900 dark:text-white mb-2">
                {slides[currentSlide].title}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {slides[currentSlide].description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Footer Area: Dots and Controls */}
        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            {/* Dots */}
            <div className="flex items-center space-x-2">
              {slides.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentSlide
                      ? 'w-6 bg-primary'
                      : 'w-2 bg-slate-200 dark:bg-slate-700'
                  }`}
                />
              ))}
            </div>

            {/* Next Button */}
            <button
              onClick={nextSlide}
              className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-primary hover:brightness-110 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-primary/20 active:scale-95"
            >
              <span>{currentSlide === slides.length - 1 ? 'Mulai Sekarang' : 'Lanjut'}</span>
              {currentSlide === slides.length - 1 ? (
                <Check className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

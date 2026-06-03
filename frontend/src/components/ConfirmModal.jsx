import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useConfirmStore } from '../store/confirmStore';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal() {
  const { isOpen, title, message, onConfirm, onCancel } = useConfirmStore();

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={onCancel}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: "spring", duration: 0.4, bounce: 0.1 }}
            className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl p-6 shadow-2xl z-10 overflow-hidden"
          >
            {/* Background Glow */}
            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-red-500/10 dark:bg-red-500/20 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mb-2 shadow-inner border border-red-200 dark:border-red-500/30">
                <AlertTriangle className="w-8 h-8" />
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 dark:text-white font-outfit tracking-tight">
                {title}
              </h3>
              
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed px-2">
                {message}
              </p>

              <div className="flex items-center space-x-3 w-full pt-4 mt-2">
                <button
                  onClick={onCancel}
                  className="flex-1 px-4 py-3 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-semibold transition-colors"
                >
                  Batal
                </button>
                <button
                  onClick={onConfirm}
                  className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-semibold shadow-lg shadow-red-500/30 transition-all hover:shadow-red-500/40 active:scale-95"
                >
                  Hapus
                </button>
              </div>
            </div>
            
            <button
              onClick={onCancel}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

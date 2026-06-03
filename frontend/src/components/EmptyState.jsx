import React from 'react';
import { Plus } from 'lucide-react';
import { motion } from 'framer-motion';

export default function EmptyState({ 
  title, 
  description, 
  buttonText, 
  onAction, 
  icon: Icon,
  children
}) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="col-span-full flex flex-col items-center justify-center p-12 text-center bg-slate-50 dark:bg-slate-900/30 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] w-full"
    >
      <div className="w-24 h-24 bg-primary/10 dark:bg-primary/5 text-primary dark:text-primary-light rounded-full flex items-center justify-center mb-6 shadow-inner">
        {Icon ? <Icon className="w-12 h-12 opacity-80" /> : <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />}
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white font-outfit">{title}</h3>
      <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-2 mb-8 text-sm leading-relaxed">
        {description}
      </p>
      {children ? (
        children
      ) : (
        buttonText && onAction && (
          <button
            onClick={onAction}
            className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl text-sm font-semibold flex items-center space-x-2 shadow-lg shadow-primary/20 transition-all duration-200 transform hover:-translate-y-0.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{buttonText}</span>
          </button>
        )
      )}
    </motion.div>
  );
}

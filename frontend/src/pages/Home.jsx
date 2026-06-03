import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { LogOut, Wallet, User as UserIcon, Mail } from 'lucide-react';

export default function Home() {
  const { user, logout, isAuthenticated, initializeAuth } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* Header navbar */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight font-outfit">
            Celengan<span className="text-primary-light font-medium">Qu</span>
          </span>
        </div>
        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="flex items-center space-x-2 text-slate-400 hover:text-white transition-colors duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-semibold">Keluar</span>
        </button>
      </header>

      {/* Main dashboard content */}
      <main className="flex-1 p-8 max-w-4xl mx-auto w-full flex flex-col justify-center items-center text-center">
        <div className="bg-slate-900/60 border border-slate-800 p-8 rounded-3xl shadow-xl w-full max-w-lg backdrop-blur-xl">
          <div className="w-20 h-20 bg-primary/10 text-primary-light rounded-full flex items-center justify-center mx-auto mb-6">
            <UserIcon className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-extrabold mb-2 font-outfit">Selamat Datang, {user.name}!</h1>
          <p className="text-slate-400 mb-6 flex items-center justify-center space-x-2">
            <Mail className="w-4 h-4" />
            <span>{user.email}</span>
          </p>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-6">
            <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80">
              <span className="text-xs text-slate-500 block uppercase font-semibold mb-1">Mata Uang</span>
              <span className="text-lg font-bold text-primary-light">{user.currency}</span>
            </div>
            <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800/80">
              <span className="text-xs text-slate-500 block uppercase font-semibold mb-1">Status Akun</span>
              <span className="text-lg font-bold text-emerald-400">Aktif</span>
            </div>
          </div>

          <div className="mt-8 bg-primary/10 border border-primary/20 text-primary-light p-4 rounded-2xl text-sm">
            Fase 1 (Backend Setup) & Fase 2 (Frontend Auth) telah berhasil diimplementasikan. Halaman dashboard utama, transaksi, budgeting, dan goals akan hadir di Fase 3 & 4.
          </div>
        </div>
      </main>
    </div>
  );
}

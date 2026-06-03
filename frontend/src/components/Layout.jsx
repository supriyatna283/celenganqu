import { useEffect, useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { 
  Wallet, 
  LayoutDashboard, 
  CreditCard, 
  ArrowLeftRight, 
  LogOut, 
  Menu, 
  X, 
  Target, 
  Coins, 
  Settings as SettingsIcon, 
  Sun, 
  Moon,
  Handshake,
  Calendar,
  Bot,
  Plus
} from 'lucide-react';
import NotificationBell from './NotificationBell';
import AIChatbot from './AIChatbot';
import ConfirmModal from './ConfirmModal';

export default function Layout({ children }) {
  const { user, logout, isAuthenticated, initializeAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  if (!user) return null;

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Daftar Akun', path: '/accounts', icon: CreditCard },
    { name: 'Transaksi', path: '/transactions', icon: ArrowLeftRight },
    { name: 'Langganan', path: '/subscriptions', icon: Calendar },
    { name: 'Anggaran', path: '/budgets', icon: Target },
    { name: 'Tujuan Tabungan', path: '/goals', icon: Coins },
    { name: 'Hutang & Piutang', path: '/debts-loans', icon: Handshake },
    { name: 'Pengaturan', path: '/settings', icon: SettingsIcon },
  ];

  return (
    <div className="h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white flex transition-colors duration-305 overflow-hidden">
      {/* Sidebar for Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-6 shrink-0 transition-colors duration-305">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
              <Coins className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight font-outfit text-slate-900 dark:text-white">
              Celengan<span className="text-primary dark:text-primary-light font-medium">Qu</span>
            </span>
          </div>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-primary text-white shadow-lg shadow-primary/25'
                    : 'text-slate-550 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Panel (Theme Toggle, User Info, Logout) */}
        <div className="border-t border-slate-200 dark:border-slate-800 pt-6 mt-6 flex flex-col space-y-4">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-550 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-slate-900 dark:hover:text-white transition-all"
          >
            {theme === 'light' ? (
              <>
                <Moon className="w-5 h-5 text-indigo-500" />
                <span>Mode Gelap</span>
              </>
            ) : (
              <>
                <Sun className="w-5 h-5 text-amber-500" />
                <span>Mode Terang</span>
              </>
            )}
          </button>
          
          <div className="flex items-center justify-center p-2 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800">
            <NotificationBell />
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center font-bold text-slate-800 dark:text-primary-light border border-slate-200 dark:border-slate-700">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate text-slate-900 dark:text-white">{user.name}</p>
              <p className="text-xs text-slate-500 dark:text-slate-500 truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => {
              logout();
              navigate('/login');
            }}
            className="flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold text-red-500 dark:text-red-400 hover:bg-red-500/10 transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* Main Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-5 py-3 transition-colors duration-305 sticky top-0 z-40">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center font-bold text-slate-800 dark:text-primary-light border border-slate-200 dark:border-slate-700">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Halo,</span>
              <span className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">{user.name.split(' ')[0]}</span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={toggleTheme}
              className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            <div className="flex items-center justify-center p-1">
              <NotificationBell />
            </div>
          </div>
        </header>

        {/* Mobile "More" Menu Overlay */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
            <div className="bg-white dark:bg-slate-900 w-full rounded-t-3xl p-6 pb-8 relative z-10 animate-in slide-in-from-bottom-full border-t border-slate-200 dark:border-slate-800">
              <div className="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto mb-6"></div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4">Menu Lainnya</h3>
              <nav className="space-y-2 mb-6">
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3.5 rounded-xl text-sm font-semibold transition-colors ${
                        isActive 
                          ? 'bg-primary text-white shadow-md' 
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </nav>
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="w-full flex items-center justify-center space-x-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 py-3.5 rounded-xl font-bold transition-colors hover:bg-red-100 dark:hover:bg-red-900/30"
              >
                <LogOut className="w-5 h-5" />
                <span>Keluar</span>
              </button>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-5 md:p-10 pb-28 md:pb-10 overflow-y-auto max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Bottom Navigation for Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-2xl border-t border-slate-200 dark:border-slate-800 z-40 pb-safe shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
        <div className="flex items-center justify-around px-2 py-1.5 relative">
          <Link to="/" className={`flex flex-col items-center p-2 min-w-[64px] transition-colors ${location.pathname === '/' ? 'text-primary dark:text-primary-light' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}>
            <LayoutDashboard className={`w-6 h-6 mb-1 transition-transform ${location.pathname === '/' ? 'fill-current opacity-20 scale-110' : 'active:scale-95'}`} />
            <span className="text-[10px] font-medium">Beranda</span>
          </Link>
          
          <Link to="/transactions" className={`flex flex-col items-center p-2 min-w-[64px] transition-colors ${location.pathname === '/transactions' ? 'text-primary dark:text-primary-light' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}>
            <ArrowLeftRight className={`w-6 h-6 mb-1 transition-transform ${location.pathname === '/transactions' ? 'fill-current opacity-20 scale-110' : 'active:scale-95'}`} />
            <span className="text-[10px] font-medium">Transaksi</span>
          </Link>

          {/* Floating Action Button */}
          <div className="relative -top-7 flex flex-col items-center px-2">
            <Link 
              to="/transactions" 
              className="w-14 h-14 bg-gradient-to-tr from-primary to-indigo-500 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/30 transform transition-transform hover:scale-105 active:scale-95 border-4 border-slate-50 dark:border-slate-900"
            >
              <Plus className="w-7 h-7" />
            </Link>
          </div>

          <button 
            onClick={() => window.dispatchEvent(new Event('open-ai-chat'))}
            className="flex flex-col items-center p-2 min-w-[64px] text-slate-400 dark:text-slate-500 hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors active:scale-95"
          >
            <Bot className="w-6 h-6 mb-1 transition-transform" />
            <span className="text-[10px] font-medium">AI Chat</span>
          </button>

          <button 
            onClick={() => setMobileMenuOpen(true)}
            className={`flex flex-col items-center p-2 min-w-[64px] transition-colors active:scale-95 ${mobileMenuOpen ? 'text-primary dark:text-primary-light' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
          >
            <Menu className="w-6 h-6 mb-1 transition-transform" />
            <span className="text-[10px] font-medium">Lainnya</span>
          </button>
        </div>
      </nav>

      <AIChatbot />
      <ConfirmModal />
    </div>
  );
}

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
} from 'lucide-react';
import NotificationBell from './NotificationBell';
import AIChatbot from './AIChatbot';

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
            <div className="w-10 h-10 bg-[#1A56A0] rounded-xl flex items-center justify-center shadow-lg shadow-[#1A56A0]/20">
              <Coins className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight font-outfit text-slate-900 dark:text-white">
              Celengan<span className="text-[#1A56A0] dark:text-[#D6E4F7] font-medium">Qu</span>
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
                    ? 'bg-[#1A56A0] text-white shadow-lg shadow-[#1A56A0]/25'
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
            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center font-bold text-slate-800 dark:text-[#D6E4F7] border border-slate-200 dark:border-slate-700">
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
        <header className="md:hidden flex items-center justify-between bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-6 py-4 transition-colors duration-305">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-[#1A56A0] rounded-lg flex items-center justify-center">
              <Coins className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white font-outfit">
              Celengan<span className="text-[#1A56A0] dark:text-[#D6E4F7]">Qu</span>
            </span>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={toggleTheme}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            <NotificationBell />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </header>

        {/* Mobile Menu Panel */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 top-[65px] bg-white dark:bg-slate-950/95 backdrop-blur-md z-50 p-6 flex flex-col justify-between">
            <nav className="space-y-4">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-4 rounded-xl text-base font-semibold ${
                      isActive 
                        ? 'bg-[#1A56A0] text-white shadow-md' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="border-t border-slate-200 dark:border-slate-800 pt-6">
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="w-full flex items-center justify-center space-x-2 bg-red-550/10 border border-red-500/20 text-red-500 dark:text-red-400 py-3 rounded-xl font-semibold"
              >
                <LogOut className="w-5 h-5" />
                <span>Keluar</span>
              </button>
            </div>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
      <AIChatbot />
    </div>
  );
}

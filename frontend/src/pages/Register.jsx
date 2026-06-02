import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import logoImg from '../assets/logo.png';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { User as UserIcon, Mail, Lock, Eye, EyeOff, Loader2, ArrowRight, Wallet } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const navigate = useNavigate();
  const loginStore = useAuthStore((state) => state.login);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !email || !password || !confirmPassword) {
      setError('Semua field wajib diisi.');
      toast.error('Semua field wajib diisi.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Password dan konfirmasi password tidak cocok.');
      toast.error('Password dan konfirmasi password tidak cocok.');
      return;
    }

    if (password.length < 6) {
      setError('Password minimal harus 6 karakter.');
      toast.error('Password minimal harus 6 karakter.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/register', { name, email, password });
      const { user, accessToken, refreshToken } = response.data;
      loginStore(user, accessToken, refreshToken);
      toast.success('Pendaftaran berhasil! Selamat datang.');
      navigate('/');
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Gagal mendaftar. Hubungi administrator.';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4 relative overflow-hidden select-none">
      {/* Decorative background gradients */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#1A56A0]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#1A56A0]/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main glass card */}
      <div className="w-full max-w-md bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl relative z-10 transition-all duration-300 hover:border-slate-700">
        
        {/* Logo/Header */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-16 h-16 mb-4 transform hover:rotate-12 transition-transform duration-300 flex items-center justify-center">
            <img src={logoImg} className="w-full h-full object-contain" alt="CelenganQu Logo" />
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight font-outfit">
            Celengan<span className="text-[#D6E4F7] font-medium">Qu</span>
          </h2>
          <p className="text-slate-400 text-sm mt-2 text-center">
            Mulai kelola keuangan dengan mendaftar di bawah ini
          </p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-4 flex items-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 tracking-wider uppercase block">Nama Lengkap</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                <UserIcon className="w-5 h-5 text-slate-500" />
              </span>
              <input
                type="text"
                placeholder="Nama Anda"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl py-2.5 pl-11 pr-4 outline-none transition-all duration-200 focus:border-[#1A56A0] focus:ring-1 focus:ring-[#1A56A0]/20 placeholder:text-slate-600"
                required
              />
            </div>
          </div>

          {/* Email input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 tracking-wider uppercase block">Email</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                <Mail className="w-5 h-5 text-slate-500" />
              </span>
              <input
                type="email"
                placeholder="nama@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl py-2.5 pl-11 pr-4 outline-none transition-all duration-200 focus:border-[#1A56A0] focus:ring-1 focus:ring-[#1A56A0]/20 placeholder:text-slate-600"
                required
              />
            </div>
          </div>

          {/* Password input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 tracking-wider uppercase block">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                <Lock className="w-5 h-5 text-slate-500" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Minimal 6 karakter"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl py-2.5 pl-11 pr-12 outline-none transition-all duration-200 focus:border-[#1A56A0] focus:ring-1 focus:ring-[#1A56A0]/20 placeholder:text-slate-600"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Confirm Password input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 tracking-wider uppercase block">Konfirmasi Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none">
                <Lock className="w-5 h-5 text-slate-500" />
              </span>
              <input
                type="password"
                placeholder="Ulangi password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-800 text-white rounded-xl py-2.5 pl-11 pr-4 outline-none transition-all duration-200 focus:border-[#1A56A0] focus:ring-1 focus:ring-[#1A56A0]/20 placeholder:text-slate-600"
                required
              />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#1A56A0] to-[#164882] text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-[#1A56A0]/20 flex items-center justify-center space-x-2 transition-all duration-300 hover:brightness-110 active:scale-[0.98] disabled:opacity-50 mt-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <span>Daftar Akun Baru</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          Sudah punya akun?{' '}
          <Link to="/login" className="text-[#D6E4F7] hover:underline font-medium">
            Masuk Di Sini
          </Link>
        </div>
      </div>
    </div>
  );
}

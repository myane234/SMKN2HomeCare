import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../utils/auth';
import logo from '../assets/logo.png';
import { FaShieldAlt } from 'react-icons/fa';

export default function LoginAdminCms() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!form.email || !form.password) {
      setError('Email dan password wajib diisi');
      return;
    }

    setLoading(true);
    const isSuperAdminPath = window.location.pathname.includes('super-admin');
    const result = await login(form.email, form.password, isSuperAdminPath);
    setLoading(false);
    if (result.success) {
      navigate('/dashboard', { replace: true });
    } else {
      setError(result.message);
    }
  }

  const renderLoginForm = () => (
    <div className="w-full bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100">
      <div className="mb-4 flex items-center justify-start">
        <img src={logo} alt="Smartcare" className="h-8 sm:h-10 w-auto object-contain" />
      </div>

      <h2 className="text-2xl font-black text-slate-800 mb-1">Selamat Datang</h2>
      <p className="mb-5 text-xs sm:text-sm text-slate-500 font-medium">
        Masuk ke panel admin CMS HomeCare
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col">
        <label className="text-xs font-bold text-slate-600 mb-1.5">Email</label>
        <input
          type="email"
          name="email"
          placeholder="admin@smarthomecare.com"
          value={form.email}
          onChange={handleChange}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 mb-3.5 text-sm focus:border-sky-500 outline-none transition bg-slate-50/50"
          autoComplete="username"
        />

        <label className="text-xs font-bold text-slate-600 mb-1.5">Password</label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="••••••••"
            value={form.password}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 mb-3.5 text-sm focus:border-sky-500 outline-none pr-16 transition bg-slate-50/50"
            autoComplete="current-password"
          />
          <button
            type="button"
            className="absolute right-4 top-3.5 text-xs font-bold text-sky-600 cursor-pointer hover:opacity-80"
            onClick={() => setShowPassword((s) => !s)}
            tabIndex={-1}
          >
            {showPassword ? 'Sembunyikan' : 'Lihat'}
          </button>
        </div>

        {error && (
          <div className="mt-1 mb-3 rounded-xl bg-red-50 text-red-600 px-3 py-2.5 text-xs">
            {error}
          </div>
        )}

        <button 
          type="submit" 
          className="w-full py-3.5 bg-[#004fa4] text-white rounded-xl font-bold text-sm hover:bg-sky-700 transition shadow-md cursor-pointer mt-1" 
          disabled={loading}
        >
          {loading ? 'Memproses...' : 'Masuk'}
        </button>
      </form>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <p className="text-[11px] text-slate-400">
          Butuh bantuan akses? Hubungi tim IT Support.
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen w-full bg-slate-50 overflow-x-hidden items-center justify-center">
      
      {/* TAMPILAN MOBILE & TABLET */}
      <div className="flex lg:hidden w-full min-h-screen flex-col relative bg-white">
        <div className="w-full bg-gradient-to-br from-[#0284c7] via-[#004fa4] to-[#2dd4bf] px-6 pt-10 pb-20 flex flex-col items-start justify-start rounded-b-[40px] shadow-lg text-left">
          <img src={logo} alt="Smartcare Logo" className="h-6 w-auto object-contain brightness-0 invert drop-shadow-[0_2px_6px_rgba(0,0,0,0.2)] mb-2" />
          
          <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/25 backdrop-blur-md text-[10px] font-bold uppercase tracking-wider text-white shadow-sm mb-3">
            <FaShieldAlt size={9} className="text-white" /> PORTAL RESMI
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight leading-snug text-white drop-shadow-md mb-2">
            Sistem Informasi <span className="text-yellow-200">HomeCare Terpadu</span>
          </h1>
          <p className="text-white/90 text-xs leading-relaxed font-medium max-w-sm">
            Solusi digital profesional untuk manajemen layanan kesehatan.
          </p>
        </div>

        <div className="w-full px-6 -mt-12 pb-12 z-10 flex justify-center">
          <div className="w-full max-w-md">{renderLoginForm()}</div>
        </div>
      </div>

      {/* TAMPILAN DESKTOP */}
      <div className="hidden lg:flex w-full min-h-screen bg-slate-50 flex-row">
        {/* Sisi Kiri: Branding / Informasi (Diubah menjadi justify-start dengan padding atas besar agar teks naik ke atas) */}
        <div className="w-1/2 bg-gradient-to-br from-[#0284c7] via-[#004fa4] to-[#2dd4bf] text-white px-16 py-16 xl:px-20 xl:py-20 flex flex-col justify-start rounded-r-[140px] shadow-lg relative">
          <div className="max-w-xl">
            <div className="mb-8">
              <img src={logo} alt="Smartcare Logo" className="h-12 w-auto object-contain brightness-0 invert drop-shadow-[0_2px_8px_rgba(0,0,0,0.2)] mb-6" />
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider border border-white/30 text-white shadow-sm">
                <FaShieldAlt size={12} className="text-white" /> PORTAL RESMI
              </div>
            </div>

            <h1 className="text-4xl xl:text-5xl font-black tracking-tight leading-tight mb-5 text-white drop-shadow-md">
              Sistem Informasi <br />
              <span className="text-yellow-200 drop-shadow-lg">HomeCare Terpadu</span>
            </h1>
            <p className="text-white/95 text-base xl:text-lg leading-relaxed font-medium drop-shadow-sm">
              Solusi digital profesional untuk manajemen layanan kesehatan, penjadwalan tenaga medis, rekam medis pasien, serta kontrol operasional harian secara efisien dan aman.
            </p>
          </div>
        </div>

        {/* Sisi Kanan: Form Login */}
        <div className="w-1/2 flex items-center justify-center p-12 xl:p-20">
          <div className="w-full max-w-[460px]">{renderLoginForm()}</div>
        </div>
      </div>
    </div>
  );
}
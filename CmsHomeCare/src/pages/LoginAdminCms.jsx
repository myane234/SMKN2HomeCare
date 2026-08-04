import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../utils/auth';
import logo from '../assets/logo.png';

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
      if (result.roles?.includes('super_admin')) {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } else {
      setError(result.message);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-accent to-slate-100 p-5">
      <div className="w-full max-w-[380px] rounded-card bg-white p-7 shadow-card sm:p-9">
        <div className="mb-1 flex items-center justify-center">
          <img src={logo} alt="Smartcare" className="h-14 w-auto object-contain" />
        </div>
        <p className="mb-7 text-center text-[13px] text-slate-500">
          Masuk ke panel admin CMS HomeCare
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col">
          <label className="form-label">Email</label>
          <input
            type="email"
            name="email"
            placeholder="admin@smarthomecare.com"
            value={form.email}
            onChange={handleChange}
            className="form-input"
            autoComplete="username"
          />

          <label className="form-label">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              className="form-input pr-20"
              autoComplete="current-password"
            />
            <button
              type="button"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary"
              onClick={() => setShowPassword((s) => !s)}
              tabIndex={-1}
            >
              {showPassword ? 'Sembunyikan' : 'Lihat'}
            </button>
          </div>

          {error && (
            <div className="mt-3.5 rounded-lg bg-danger-bg px-3 py-2.5 text-[13px] text-danger">
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary mt-6 w-full py-3 text-[15px]" disabled={loading}>
            {loading ? 'Memproses...' : 'Masuk'}
          </button>
        </form>

        <p className="mt-5 text-center text-[11px] text-slate-500">
          Super Admin: admin@gmail.com / faruqganteng<br/>
          Admin: faruq@homecare.com / faruqganteng
        </p>

        <div className="mt-6 border-t border-slate-200 pt-5 text-center">
          {window.location.pathname.includes('super-admin') ? (
            <a href="/login" className="text-sm font-medium text-primary hover:underline">
              ← Kembali ke Login Admin Biasa
            </a>
          ) : (
            <a href="/super-admin/login" className="text-sm font-medium text-primary hover:underline">
              Masuk sebagai Super Admin →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

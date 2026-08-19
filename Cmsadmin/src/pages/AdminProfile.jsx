'use client';

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

const API_BASE_URL = 'https://citra.faaruq.com'; 

export default function AdminProfile() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    deskripsi: '',
    role: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Helper ambil dan decode cookie auth_token
  const getToken = () => {
    try {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; auth_token=`);
      if (parts.length === 2) {
        const rawToken = parts.pop().split(';').shift();
        // Decode URL-encoded string (%7C menjadi |)
        return decodeURIComponent(rawToken);
      }
    } catch (e) {
      return '';
    }
    return '';
  };

  // 1. GET /api/admin/me
  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        const token = getToken();

        const response = await fetch(`${API_BASE_URL}/api/admin/me`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        });

        const result = await response.json();

        if (response.ok) {
          const adminData = result.data || result;
          setFormData((prev) => ({
            ...prev,
            name: adminData.nama_lengkap || adminData.name || '',
            email: adminData.email || '',
            deskripsi: adminData.deskripsi || '',
            role: adminData.role || 'Admin',
          }));
        } else {
          setErrorMessage(result.message || 'Gagal memuat data profil.');
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setErrorMessage('Terjadi kesalahan koneksi ke server.');
      } finally {
        setFetching(false);
      }
    };

    fetchAdminProfile();
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleFileChange(e) {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  }

  function handleCancel() {
    navigate('/dashboard');
  }

  // 2. Submit Update Profile & Password
  async function handleSubmit(e) {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');
    setLoading(true);

    try {
      const token = getToken();

      // A. POST /api/admin/profile (Tanpa csrf-cookie, murni pakai Bearer Token)
      const profileData = new FormData();
      profileData.append('nama_lengkap', formData.name);
      profileData.append('email', formData.email);
      if (formData.deskripsi) {
        profileData.append('deskripsi', formData.deskripsi);
      }
      if (selectedFile) {
        profileData.append('foto_profile', selectedFile);
      }

      const profileResponse = await fetch(`${API_BASE_URL}/api/admin/profile`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: profileData
      });

      const profileResult = await profileResponse.json();

      if (!profileResponse.ok) {
        throw new Error(profileResult.message || 'Gagal memperbarui informasi profil.');
      }

      // B. PUT /api/admin/profile/admin/profile/ubah-password (Jika password diisi)
      if (formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          setErrorMessage('Konfirmasi password baru tidak cocok.');
          setLoading(false);
          return;
        }

        const passwordPayload = {
          password_lama: formData.currentPassword,
          password_baru: formData.newPassword,
          password_baru_confirmation: formData.confirmPassword
        };

        const passwordResponse = await fetch(`${API_BASE_URL}/api/admin/profile/admin/profile/ubah-password`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
          },
          body: JSON.stringify(passwordPayload)
        });

        const passwordResult = await passwordResponse.json();

        if (!passwordResponse.ok) {
          throw new Error(passwordResult.message || 'Gagal mengubah password.');
        }
      }

      setSuccessMessage('Profil berhasil diperbarui!');
      
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
      setSelectedFile(null);

      setTimeout(() => {
        navigate('/dashboard');
      }, 1000);

    } catch (error) {
      console.error("Error updating profile:", error);
      setErrorMessage(error.message || 'Terjadi kesalahan saat menyimpan perubahan.');
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="flex justify-center items-center h-screen text-sm text-slate-500 bg-slate-50">
        Memuat data profil...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <button
            type="button"
            onClick={handleCancel}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors cursor-pointer bg-transparent border-0 p-0 shadow-none"
          >
            <FaArrowLeft />
            <span>Kembali ke Dashboard</span>
          </button>
        </div>

        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Informasi Akun</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Kelola informasi profil dan keamanan akun Anda di sini.
          </p>
        </div>

        {successMessage && (
          <div className="p-4 rounded-xl bg-emerald-50 text-emerald-700 text-sm font-medium">
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="p-4 rounded-xl bg-rose-50 text-rose-700 text-sm font-medium">
            {errorMessage}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden w-full">
          <div className="bg-gradient-to-r from-slate-100 via-slate-50 to-emerald-50 px-8 py-6 flex flex-col sm:flex-row items-center gap-5">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-100 text-2xl font-bold text-emerald-800 shadow-sm overflow-hidden">
              {(formData.name?.[0] || 'A').toUpperCase()}
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-lg font-bold text-slate-900">{formData.name || 'Admin'}</h2>
              <p className="text-xs text-slate-500">{formData.email}</p>
              <div className="mt-2">
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                  {formData.role || 'Admin'}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  Nama Lengkap
                </label>
                <input
                  type="text"
                  name="name"
                  autoComplete="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl bg-slate-50 px-4 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all"
                  placeholder="Masukkan nama lengkap"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full rounded-xl bg-slate-50 px-4 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all"
                  placeholder="Masukkan email"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  Deskripsi / Bio
                </label>
                <input
                  type="text"
                  name="deskripsi"
                  autoComplete="organization-title"
                  value={formData.deskripsi}
                  onChange={handleChange}
                  className="w-full rounded-xl bg-slate-50 px-4 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all"
                  placeholder="Contoh: Admin Operasional"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                  Foto Profil Baru (Opsional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200 cursor-pointer"
                />
              </div>
            </div>

            <div className="pt-6">
              <h3 className="text-sm font-bold text-slate-900 mb-1">Ubah Password</h3>
              <p className="text-xs text-slate-500 mb-4">
                Kosongkan bagian ini jika Anda tidak ingin mengubah password akun Anda.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                    Password Saat Ini
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    autoComplete="current-password"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    className="w-full rounded-xl bg-slate-50 px-4 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all"
                    placeholder="••••••••"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                      Password Baru
                    </label>
                    <input
                      type="password"
                      name="newPassword"
                      autoComplete="new-password"
                      value={formData.newPassword}
                      onChange={handleChange}
                      className="w-full rounded-xl bg-slate-50 px-4 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all"
                      placeholder="••••••••"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                      Konfirmasi Password Baru
                    </label>
                    <input
                      type="password"
                      name="confirmPassword"
                      autoComplete="new-password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="w-full rounded-xl bg-slate-50 px-4 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-all cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-all disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaKey, FaCamera, FaTimes } from "react-icons/fa";
import { URL } from "../utils/getUrl.js"; // Sesuaikan path jika berbeda
import { getAuthHeaders, handleUnauthorized } from "../utils/auth.js"; // Sesuaikan path jika berbeda

export default function AdminProfile() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    deskripsi: "",
    role: "",
    foto_profile: "",
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [modalError, setModalError] = useState("");
  const [modalSuccess, setModalSuccess] = useState("");

  // Helper untuk format URL Foto
  const getImageUrl = (path) => {
    if (!path) return null;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${URL.replace(/\/api\/?$/, "")}/storage${cleanPath}`;
  };

  // 1. GET Admin Profile
  useEffect(() => {
    const fetchAdminProfile = async () => {
      try {
        const response = await fetch(`${URL}/admin/me`, {
          method: "GET",
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
        });

        if (response.status === 401) {
          handleUnauthorized();
          return;
        }

        const result = await response.json();

        if (response.ok) {
          const adminData = result.data || result;
          setFormData((prev) => ({
            ...prev,
            name: adminData.nama_lengkap || adminData.name || "",
            email: adminData.email || "",
            deskripsi: adminData.deskripsi || "",
            role: adminData.tier_admin || adminData.role || "Admin",
            foto_profile: adminData.foto_profile || "",
          }));
        } else {
          setErrorMessage(result.message || "Gagal memuat data profil.");
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
        setErrorMessage("Terjadi kesalahan koneksi ke server.");
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

  function handlePasswordChange(e) {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
  }

  function handleFileChange(e) {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setPreviewImage(URL.createObjectURL(file));
    }
  }

  function handleCancel() {
    navigate("/dashboard");
  }

  // 2. Submit Update Profil Info & Foto
  async function handleSubmitProfile(e) {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");
    setLoading(true);

    try {
      const profileData = new FormData();
      profileData.append("nama_lengkap", formData.name);
      profileData.append("email", formData.email);
      if (formData.deskripsi) {
        profileData.append("deskripsi", formData.deskripsi);
      }
      if (selectedFile) {
        profileData.append("foto_profile", selectedFile);
      }

      const profileResponse = await fetch(`${URL}/admin/profile`, {
        method: "POST",
        headers: getAuthHeaders(),
        body: profileData,
      });

      if (profileResponse.status === 401) {
        handleUnauthorized();
        return;
      }

      const profileResult = await profileResponse.json();

      if (!profileResponse.ok) {
        throw new Error(
          profileResult.message || "Gagal memperbarui informasi profil.",
        );
      }

      setSuccessMessage("Profil berhasil diperbarui!");
      setSelectedFile(null);

      // Refresh data foto jika dikembalikan dari server
      if (profileResult.data?.foto_profile) {
        setFormData((prev) => ({
          ...prev,
          foto_profile: profileResult.data.foto_profile,
        }));
        setPreviewImage(null);
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      setErrorMessage(
        error.message || "Terjadi kesalahan saat menyimpan perubahan.",
      );
    } finally {
      setLoading(false);
    }
  }

  // 3. Submit Ubah Password (Modal)
  async function handleSubmitPassword(e) {
    e.preventDefault();
    setModalError("");
    setModalSuccess("");

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setModalError("Konfirmasi password baru tidak cocok.");
      return;
    }

    setPasswordLoading(true);

    try {
      const passwordPayload = {
        password_lama: passwordData.currentPassword,
        password_baru: passwordData.newPassword,
        password_baru_confirmation: passwordData.confirmPassword,
      };

      const passwordResponse = await fetch(
        `${URL}/admin/profile/ubah-password`,
        {
          method: "PUT",
          headers: getAuthHeaders({ "Content-Type": "application/json" }),
          body: JSON.stringify(passwordPayload),
        },
      );

      if (passwordResponse.status === 401) {
        handleUnauthorized();
        return;
      }

      const passwordResult = await passwordResponse.json();

      if (!passwordResponse.ok) {
        throw new Error(passwordResult.message || "Gagal mengubah password.");
      }

      setModalSuccess("Password berhasil diubah!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      setTimeout(() => {
        setIsPasswordModalOpen(false);
        setModalSuccess("");
      }, 1500);
    } catch (error) {
      console.error("Error updating password:", error);
      setModalError(error.message || "Gagal memperbarui password.");
    } finally {
      setPasswordLoading(false);
    }
  }

  // 3. Submit Khusus Ubah Password dari Pop-up (Modal)
  async function handlePasswordSubmit(e) {
    e.preventDefault();
    setErrorMessage('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorMessage('Konfirmasi password baru tidak cocok.');
      return;
    }

    setPasswordLoading(true);

    try {
      const token = getToken();

      const passwordPayload = {
        password_lama: passwordData.currentPassword,
        password_baru: passwordData.newPassword,
        password_baru_confirmation: passwordData.confirmPassword
      };

      const passwordResponse = await fetch(`${API_BASE_URL}/admin/profile/ubah-password`, {
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

      setSuccessMessage('Password berhasil diubah!');
      setIsPasswordModalOpen(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

    } catch (error) {
      console.error("Error updating password:", error);
      setErrorMessage(error.message || 'Terjadi kesalahan saat mengubah password.');
    } finally {
      setPasswordLoading(false);
    }
  }

  if (fetching) {
    return (
      <div className="flex justify-center items-center h-screen text-sm text-slate-500 bg-slate-50">
        Memuat data profil...
      </div>
    );
  }

  const currentAvatarSrc = previewImage || getImageUrl(formData.foto_profile);

  return (
    <div className="min-h-screen w-full bg-slate-50 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-6">
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
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
            Informasi Akun
          </h1>
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

        <div className="w-full overflow-hidden rounded-2xl bg-white shadow-sm">
          {/* Header Profil & Foto */}
          <div className="bg-gradient-to-r from-slate-100 via-slate-50 to-emerald-50 px-8 py-6 flex flex-col sm:flex-row items-center gap-6">
            <div className="relative group">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-3xl font-bold text-emerald-800 shadow-sm overflow-hidden border-2 border-white">
                {currentAvatarSrc ? (
                  <img
                    src={currentAvatarSrc}
                    alt={formData.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  (formData.name?.[0] || "A").toUpperCase()
                )}
              </div>

              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 p-2 bg-slate-900 text-white rounded-full cursor-pointer hover:bg-slate-800 transition-all shadow-md"
                title="Ubah Foto Profil"
              >
                <FaCamera className="text-xs" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>

            <div className="text-center sm:text-left space-y-1">
              <h2 className="text-lg font-bold text-slate-900">
                {formData.name || "Admin"}
              </h2>
              <p className="text-xs text-slate-500">{formData.email}</p>
              <div className="pt-1">
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600">
                  {formData.role || "Admin"}
                </span>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmitProfile} className="p-8 space-y-6">
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
                  className="w-full rounded-xl bg-slate-50 px-4 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all border border-slate-200"
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
                  className="w-full rounded-xl bg-slate-50 px-4 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all border border-slate-200"
                  placeholder="Masukkan email"
                />
              </div>
            </div>

            {/* Deskripsi (Textarea Luas) */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                Deskripsi / Bio
              </label>
              <textarea
                name="deskripsi"
                rows={4}
                value={formData.deskripsi}
                onChange={handleChange}
                className="w-full rounded-xl bg-slate-50 px-4 py-2.5 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all border border-slate-200 resize-y"
                placeholder="Tuliskan deskripsi singkat atau bio admin di sini..."
              />
            </div>

            {/* Bagian Keamanan / Tombol Modal Ubah Password */}
            <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Keamanan Kata Sandi
                </h3>
                <p className="text-xs text-slate-500">
                  Perbarui kata sandi Anda secara berkala untuk menjaga keamanan
                  akun.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 text-slate-800 text-xs font-semibold hover:bg-slate-200 transition-all cursor-pointer border border-slate-200"
              >
                <FaKey className="text-slate-500" />
                <span>Ubah Password</span>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
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
                {loading ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Pop-up Modal Ubah Password */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">
                Ubah Password
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsPasswordModalOpen(false);
                  setModalError("");
                  setModalSuccess("");
                }}
                className="text-slate-400 hover:text-slate-600 transition-colors p-1"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleSubmitPassword} className="p-6 space-y-4">
              {modalSuccess && (
                <div className="p-3 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-medium">
                  {modalSuccess}
                </div>
              )}
              {modalError && (
                <div className="p-3 rounded-lg bg-rose-50 text-rose-700 text-xs font-medium">
                  {modalError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Password Saat Ini
                </label>
                <input
                  type="password"
                  name="currentPassword"
                  autoComplete="current-password"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  required
                  className="w-full rounded-xl bg-slate-50 px-4 py-2 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all border border-slate-200"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Password Baru
                </label>
                <input
                  type="password"
                  name="newPassword"
                  autoComplete="new-password"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  required
                  className="w-full rounded-xl bg-slate-50 px-4 py-2 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all border border-slate-200"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Konfirmasi Password Baru
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  autoComplete="new-password"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  required
                  className="w-full rounded-xl bg-slate-50 px-4 py-2 text-sm text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all border border-slate-200"
                  placeholder="••••••••"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsPasswordModalOpen(false);
                    setModalError("");
                    setModalSuccess("");
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-all"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-all disabled:opacity-50"
                >
                  {passwordLoading ? "Menyimpan..." : "Simpan Password"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

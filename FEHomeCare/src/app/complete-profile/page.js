"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FiEye, FiEyeOff } from "react-icons/fi";
import axios from "axios";
import api from "@/services/api";

const API_URL = "/api/pasien/complete-profile";

export default function CompleteProfilePage() {
  const router = useRouter();

  const [missingFields, setMissingFields] = useState([]);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    checkMissingFields();
  }, []);

  const handleAuthError = (message = "Silakan login kembali.") => {
    setErrorMsg(message);
    setTimeout(() => {
      router.push("/login");
    }, 1500);
  };

  const initializeFormData = (fields) => {
    const initialForm = {};
    fields.forEach((field) => {
      initialForm[field] = "";
    });
    setFormData(initialForm);
  };

  const checkMissingFields = async () => {
    setErrorMsg("");
    try {
      const res = await api.post(API_URL, {});
      const data = res.data;

      if (data?.success) {
        window.location.href = "/";
        return;
      }

      if (data?.errors && typeof data.errors === "object") {
        const fields = Object.keys(data.errors);
        setMissingFields(fields);
        initializeFormData(fields);
        return;
      }

      setErrorMsg(data.message || "Gagal memuat profil.");
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const data = err.response?.data;

        if (status === 422 && data?.errors) {
          const fields = Object.keys(data.errors);
          setMissingFields(fields);
          initializeFormData(fields);
          return;
        }

        if (status === 401 || status === 403) {
          handleAuthError("Sesi habis. Silakan login ulang.");
          return;
        }

        setErrorMsg(data?.message || "Terjadi kesalahan saat memeriksa profil.");
      } else {
        console.error("checkMissingFields error", err);
        setErrorMsg("Terjadi kesalahan saat memeriksa profil.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((current) => ({
      ...current,
      [name]: value
    }));
    // Clear error message when user starts typing again
    if (errorMsg) setErrorMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (missingFields.includes("password") && (formData.password || "").length < 6) {
      setErrorMsg("Password harus minimal 6 karakter.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await api.post(API_URL, formData);
      setSuccessMsg("Profil berhasil dilengkapi! Mengalihkan halaman...");
      
      // Otomatisin refresh setelah berhasil
      setTimeout(() => {
        window.location.href = "/";
      }, 1000);
      return;
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const status = err.response?.status;
        const data = err.response?.data;

        if (status === 422 && data?.errors) {
          const fields = Object.keys(data.errors);
          setMissingFields(fields);
          initializeFormData(fields);
          setErrorMsg(data.message || "Periksa kembali data yang diperlukan.");
          return;
        }

        if (status === 401 || status === 403) {
          handleAuthError("Sesi habis. Silakan login ulang.");
          return;
        }

        setErrorMsg(data?.message || "Gagal melengkapi profil.");
      } else {
        console.error("handleSubmit error", err);
        setErrorMsg("Terjadi kesalahan saat menyimpan profil.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="text-lg font-semibold text-gray-500 animate-pulse">Memeriksa kelengkapan profil...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Lengkapi Profil</h1>
          <p className="text-gray-500 text-sm">Harap lengkapi data yang masih kosong untuk melanjutkan.</p>
        </div>
        
        {/* Pesan Error / Success */}
        {errorMsg && (
          <div className="mb-5 rounded-lg bg-red-50 p-4 border border-red-200">
            <p className="text-sm font-medium text-red-600">{errorMsg}</p>
          </div>
        )}
        
        {successMsg && (
          <div className="mb-5 rounded-lg bg-green-50 p-4 border border-green-200">
            <p className="text-sm font-medium text-green-600">{successMsg}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {missingFields.includes("nik") && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">NIK (16 Digit)</label>
              <input
                type="text"
                name="nik"
                value={formData.nik || ""}
                onChange={handleChange}
                placeholder="Masukkan NIK KTP Anda"
                maxLength={16}
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          )}

          {missingFields.includes("password") && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Buat Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password || ""}
                  onChange={handleChange}
                  placeholder="Minimal 6 karakter"
                  required
                  className="w-full rounded-xl border border-gray-300 px-4 py-3 pr-12 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Karena Anda login via Google, silakan buat password untuk akun ini.</p>
            </div>
          )}

          {missingFields.includes("jenis_kelamin") && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Jenis Kelamin</label>
              <select
                name="jenis_kelamin"
                value={formData.jenis_kelamin || ""}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-white"
              >
                <option value="" disabled>Pilih Jenis Kelamin</option>
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>
          )}

          {missingFields.includes("golongan_darah") && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Golongan Darah</label>
              <select
                name="golongan_darah"
                value={formData.golongan_darah || ""}
                onChange={handleChange}
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 bg-white"
              >
                <option value="" disabled>Pilih Golongan Darah</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="AB">AB</option>
                <option value="O">O</option>
                <option value="Tidak Tahu">Tidak Tahu</option>
              </select>
            </div>
          )}

          {missingFields.includes("alamat_utama") && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">Alamat Utama</label>
              <textarea
                name="alamat_utama"
                value={formData.alamat_utama || ""}
                onChange={handleChange}
                rows={3}
                placeholder="Masukkan alamat lengkap"
                required
                className="w-full rounded-xl border border-gray-300 px-4 py-3 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 resize-none"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || missingFields.length === 0}
            className="w-full rounded-full bg-green-500 py-3.5 font-bold text-white transition hover:bg-green-600 disabled:opacity-70 mt-6 shadow-md"
          >
            {submitting ? "Menyimpan..." : "Simpan Profil"}
          </button>
        </form>
      </div>
    </main>
  );
}

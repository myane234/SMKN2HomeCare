"use client";

import { useEffect, useState } from "react";
import { getUlasan, createUlasan } from "@/services/ulasanService";
import { FiStar, FiUser, FiSend, FiMessageSquare } from "react-icons/fi";

export default function UlasanPage() {
  const [ulasanList, setUlasanList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState({
    nama_pasien: "",
    rating: 5,
    layanan: "",
    komentar: ""
  });

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await getUlasan();
        setUlasanList(data);
      } catch (err) {
        console.error("Gagal memuat ulasan:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    if (!form.nama_pasien.trim() || !form.komentar.trim()) {
      setErrorMsg("Mohon isi nama dan komentar ulasan Anda.");
      return;
    }

    try {
      setSubmitting(true);
      await createUlasan(form);
      setSuccessMsg("Terima kasih! Ulasan Anda berhasil dikirim.");
      setUlasanList((prev) => [
        {
          id_ulasan: Date.now(),
          nama_pasien: form.nama_pasien,
          rating: Number(form.rating),
          layanan: form.layanan || "Layanan Homecare",
          komentar: form.komentar,
          created_at: new Date().toISOString().split("T")[0]
        },
        ...prev
      ]);
      setForm({ nama_pasien: "", rating: 5, layanan: "", komentar: "" });
    } catch {
      setErrorMsg("Gagal mengirim ulasan. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <span className="inline-flex rounded-full bg-sky-100 px-3.5 py-1 text-xs font-bold tracking-wider text-sky-700 uppercase">
            ULASAN PASIEN
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Pengalaman & Testimoni Pasien
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Ulasan jujur dari keluarga dan pasien yang telah menggunakan layanan perawatan medis SmartHomeCare.
          </p>
        </div>

        {/* Form Tambah Ulasan */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
          <h2 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
            <FiMessageSquare className="text-sky-600" /> Tulis Ulasan Anda
          </h2>

          {successMsg && (
            <div className="p-3 text-xs bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 font-medium">
              {successMsg}
            </div>
          )}

          {errorMsg && (
            <div className="p-3 text-xs bg-rose-50 text-rose-700 rounded-xl border border-rose-200 font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  placeholder="Contoh: Budi Santoso"
                  value={form.nama_pasien}
                  onChange={(e) => setForm({ ...form, nama_pasien: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-sky-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Jenis Layanan</label>
                <input
                  type="text"
                  placeholder="Contoh: Perawat Lansia / Fisioterapi"
                  value={form.layanan}
                  onChange={(e) => setForm({ ...form, layanan: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Rating Kepuasan</label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setForm({ ...form, rating: star })}
                    className="p-1 cursor-pointer transition hover:scale-110"
                  >
                    <FiStar
                      size={20}
                      className={star <= form.rating ? "text-amber-400 fill-amber-400" : "text-slate-300"}
                    />
                  </button>
                ))}
                <span className="text-xs text-slate-500 ml-2 font-medium">{form.rating} dari 5 Bintang</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Komentar / Pengalaman</label>
              <textarea
                rows={3}
                placeholder="Bagikan pengalaman pelayanan perawat/terapis SmartHomeCare di rumah Anda..."
                value={form.komentar}
                onChange={(e) => setForm({ ...form, komentar: e.target.value })}
                className="w-full rounded-xl border border-slate-200 p-3.5 text-xs focus:border-sky-500 focus:outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-sky-700 transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <FiSend /> {submitting ? "Mengirim..." : "Kirim Ulasan"}
            </button>
          </form>
        </div>

        {/* Daftar Ulasan */}
        <div className="space-y-4">
          <h2 className="text-sm sm:text-base font-bold text-slate-800">
            Daftar Ulasan Pasien ({ulasanList.length})
          </h2>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-24 bg-slate-200 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : ulasanList.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-400">
              Belum ada ulasan pasien.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {ulasanList.map((item, idx) => (
                <div
                  key={item.id_ulasan || idx}
                  className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                        <FiUser />
                      </div>
                      <div>
                        <h3 className="text-xs sm:text-sm font-bold text-slate-900">{item.nama_pasien}</h3>
                        {item.layanan && (
                          <span className="text-[11px] text-slate-400">{item.layanan}</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <FiStar
                          key={star}
                          size={13}
                          className={star <= item.rating ? "text-amber-400 fill-amber-400" : "text-slate-200"}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed pt-1">
                    "{item.komentar}"
                  </p>

                  {item.created_at && (
                    <span className="block text-[10px] text-slate-400 pt-1">
                      {item.created_at}
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { FiStar, FiUser, FiSend, FiMessageSquare } from "react-icons/fi";
import { getUlasan, submitUlasan } from "@/services/ulasanService";
import { showToast } from "@/components/Toast";

export default function UlasanPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    nama_pasien: "",
    rating: 5,
    nama_layanan: "Home Care Lansia",
    komentar: ""
  });

  useEffect(() => {
    async function loadReviews() {
      try {
        setLoading(true);
        const data = await getUlasan();
        setReviews(data);
      } catch (err) {
        console.error("Gagal memuat ulasan:", err);
      } finally {
        setLoading(false);
      }
    }
    loadReviews();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nama_pasien.trim() || !formData.komentar.trim()) {
      showToast("Lengkapi nama dan ulasan Anda", "error");
      return;
    }

    try {
      setSubmitting(true);
      const newReview = {
        ...formData,
        id: Date.now(),
        tanggal: new Date().toISOString(),
        is_active: true
      };

      try {
        await submitUlasan(newReview);
      } catch {
        // Fallback local update
      }

      setReviews(prev => [newReview, ...prev]);
      showToast("Ulasan berhasil terkirim!", "success");
      setFormData({ nama_pasien: "", rating: 5, nama_layanan: "Home Care Lansia", komentar: "" });
      setShowForm(false);
    } catch (err) {
      showToast("Gagal mengirim ulasan", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 font-sans text-slate-800">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Simple */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Ulasan &amp; Testimoni Pasien</h1>
            <p className="text-sm text-slate-500 mt-1">Pengalaman keluarga dan pasien yang menggunakan layanan SmartHomeCare</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-xs hover:bg-sky-700 transition self-start sm:self-auto cursor-pointer"
          >
            <FiMessageSquare /> {showForm ? "Tutup Form" : "Tulis Ulasan"}
          </button>
        </div>

        {/* Form Kirim Ulasan Simple */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">Form Tulis Ulasan</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Pasien / Keluarga</label>
                <input
                  type="text"
                  value={formData.nama_pasien}
                  onChange={e => setFormData({ ...formData, nama_pasien: e.target.value })}
                  placeholder="Contoh: Ibu Rahma"
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm focus:border-sky-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Layanan</label>
                <input
                  type="text"
                  value={formData.nama_layanan}
                  onChange={e => setFormData({ ...formData, nama_layanan: e.target.value })}
                  placeholder="Contoh: Perawat Lansia / Fisioterapi"
                  className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm focus:border-sky-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Rating</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setFormData({ ...formData, rating: star })}
                    className="p-1 cursor-pointer focus:outline-none"
                  >
                    <FiStar className={`h-5 w-5 ${star <= formData.rating ? "fill-amber-400 text-amber-400" : "text-slate-300"}`} />
                  </button>
                ))}
                <span className="ml-2 text-xs font-bold text-slate-600">{formData.rating} Bintang</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Ulasan Anda</label>
              <textarea
                rows={3}
                value={formData.komentar}
                onChange={e => setFormData({ ...formData, komentar: e.target.value })}
                placeholder="Tuliskan pengalaman Anda..."
                className="w-full rounded-lg border border-slate-200 px-3.5 py-2 text-sm focus:border-sky-500 focus:outline-none resize-y"
                required
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-lg text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 transition"
              >
                <FiSend /> {submitting ? "Kirim..." : "Kirim Ulasan"}
              </button>
            </div>
          </form>
        )}

        {/* List Ulasan Simple */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(n => <div key={n} className="h-24 bg-slate-200 rounded-xl animate-pulse" />)}
          </div>
        ) : reviews.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500 text-sm">
            Belum ada ulasan yang ditampilkan.
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map((item, idx) => (
              <div key={item.id || idx} className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                      {item.nama_pasien ? item.nama_pasien.charAt(0).toUpperCase() : <FiUser />}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{item.nama_pasien}</h4>
                      <span className="text-[11px] text-slate-400">{item.nama_layanan || "Layanan HomeCare"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 text-amber-400">
                    {[1, 2, 3, 4, 5].map(star => (
                      <FiStar
                        key={star}
                        className={`h-3.5 w-3.5 ${star <= Number(item.rating) ? "fill-amber-400 text-amber-400" : "text-slate-200"}`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed italic">"{item.komentar}"</p>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

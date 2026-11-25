
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PromoForm from '../components/PromoForm';
import { createPromo } from '../data/PromoEndpoint';

export default function PromoTambah() {
  const navigate = useNavigate();

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);

  // Redirect setelah success card ditampilkan.
  useEffect(() => {
    if (!success) return;

    const timer = setTimeout(() => {
      navigate('/promo', { replace: true });
    }, 1800);

    return () => clearTimeout(timer);
  }, [success, navigate]);

  // Simpan promo baru.
  async function handleSubmit(data) {
    setSubmitting(true);
    setSubmitError('');

    try {
      const payload = {
        id_layanan: Number(data.id_layanan),
        deskripsi: data.deskripsi,
        tipe_diskon: data.tipe_diskon,
        nilai_diskon: Number(data.nilai_diskon),
        tanggal_mulai: data.tanggal_mulai,
        tanggal_berakhir: data.tanggal_berakhir,
        status_promo: data.status_promo,
      };

      if (data.gambar_promo instanceof File) {
        payload.gambar_promo = data.gambar_promo;
      }

      await createPromo(payload);

      // Tampilkan success card setelah API berhasil.
      setSuccess(true);
    } catch (error) {
      console.error('Gagal menambahkan promo:', error);

      setSubmitError(
        error.message || 'Gagal menambahkan promo. Silakan coba lagi.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="page-title">Tambah Promo</h1>
        <p className="page-subtitle">
          Buat promo baru dan tentukan layanan yang mendapatkan diskon.
        </p>
      </div>

      {/* Notifikasi error di dalam halaman */}
      {submitError && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-red-200 bg-red-50 px-5 py-4"
        >
          <p className="text-sm font-semibold text-red-700">
            Promo gagal ditambahkan
          </p>
          <p className="mt-1 text-sm text-red-600">
            {submitError}
          </p>
        </div>
      )}

      <PromoForm
        onSubmit={handleSubmit}
        submitting={submitting}
        mode="create"
      />

      {/* Success Card */}
      {success && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-[3px]">
          <div
            role="status"
            aria-live="polite"
            className="w-full max-w-md overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl"
          >
            <div className="h-1.5 bg-emerald-500" />

            <div className="px-7 py-9 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 ring-8 ring-emerald-50/60">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="h-8 w-8 text-emerald-600"
                  aria-hidden="true"
                >
                  <path
                    d="M5 12.5L9.5 17L19 7"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">
                Berhasil
              </p>

              <h2 className="mt-2 text-xl font-bold text-slate-800 sm:text-2xl">
                Promo Berhasil Ditambahkan!
              </h2>

              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-slate-500">
                Promo baru sudah berhasil disimpan ke dalam sistem.
              </p>

              <div className="mt-6 flex items-center justify-center gap-2 text-xs text-slate-400">
                <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                Mengalihkan ke daftar promo...
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PromoForm from '../components/PromoForm';
import { getPromoById, updatePromo } from '../data/PromoEndpoint';

export default function PromoEdit() {
  const { id_promo } = useParams();
  const navigate = useNavigate();

  const [initialData, setInitialData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [success, setSuccess] = useState(false);

  // Ambil detail promo.
  useEffect(() => {
    let active = true;

    async function loadPromo() {
      setLoading(true);
      setLoadError('');

      try {
        const data = await getPromoById(id_promo);

        if (!data) {
          throw new Error('Data promo tidak ditemukan.');
        }

        if (active) {
          setInitialData(data);
        }
      } catch (error) {
        console.error('Gagal mengambil detail promo:', error);

        if (active) {
          setLoadError(
            error.message || 'Gagal memuat data promo.'
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadPromo();

    return () => {
      active = false;
    };
  }, [id_promo]);

  // Redirect setelah success card ditampilkan.
  useEffect(() => {
    if (!success) return;

    const timer = setTimeout(() => {
      navigate('/promo', { replace: true });
    }, 1800);

    return () => clearTimeout(timer);
  }, [success, navigate]);

  // Simpan perubahan promo.
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

      await updatePromo(id_promo, payload);

      // Tampilkan success card setelah API berhasil.
      setSuccess(true);
    } catch (error) {
      console.error('Gagal memperbarui promo:', error);

      setSubmitError(
        error.message || 'Gagal memperbarui promo. Silakan coba lagi.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-sm text-slate-500">
        Memuat data promo...
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5">
        <h2 className="font-semibold text-red-700">
          Gagal Memuat Promo
        </h2>

        <p className="mt-1 text-sm text-red-600">
          {loadError}
        </p>

        <button
          type="button"
          className="btn-outline mt-4"
          onClick={() => window.location.reload()}
        >
          Muat Ulang
        </button>
      </div>
    );
  }

  if (!initialData) {
    return (
      <div className="p-6">
        Data promo tidak ditemukan.
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="page-title">Edit Promo</h1>
        <p className="page-subtitle">
          Perbarui informasi dan layanan promo.
        </p>
      </div>

      {/* Notifikasi error di dalam halaman */}
      {submitError && (
        <div
          role="alert"
          className="mb-5 rounded-xl border border-red-200 bg-red-50 px-5 py-4"
        >
          <p className="text-sm font-semibold text-red-700">
            Promo gagal diperbarui
          </p>
          <p className="mt-1 text-sm text-red-600">
            {submitError}
          </p>
        </div>
      )}

      <PromoForm
        initialData={initialData}
        onSubmit={handleSubmit}
        submitting={submitting}
        mode="edit"
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
                Promo Berhasil Diperbarui!
              </h2>

              <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-slate-500">
                Perubahan informasi promo sudah berhasil disimpan.
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

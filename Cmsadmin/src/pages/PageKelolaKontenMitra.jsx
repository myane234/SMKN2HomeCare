import { useEffect, useState } from 'react';
import { getMitraContent, updateMitraContent } from '../data/contentData';
import { resolveImageUrl } from '../utils/resolveImage';
import { FaHandshake, FaSave, FaImage, FaSpinner } from 'react-icons/fa';

export default function PageKelolaKontenMitra() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Gabung Mitra Form States
  const [mitraTextBanner, setMitraTextBanner] = useState('');
  const [mitraDescription, setMitraDescription] = useState('');
  const [mitraBannerFile, setMitraBannerFile] = useState(null);
  const [mitraBannerPreview, setMitraBannerPreview] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const mitraRes = await getMitraContent();
      const m = mitraRes?.data || mitraRes;
      if (m) {
        setMitraTextBanner(m.mitra_text_banner || '');
        setMitraDescription(m.mitra_description || '');
        setMitraBannerPreview(m.mitra_banner ? resolveImageUrl(m.mitra_banner) : '');
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Gagal memuat konten Gabung Mitra' });
    } finally {
      setLoading(false);
    }
  }

  const handleMitraSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      if (mitraBannerFile) formData.append('mitra_banner', mitraBannerFile);
      if (mitraTextBanner) formData.append('mitra_text_banner', mitraTextBanner);
      if (mitraDescription) formData.append('mitra_description', mitraDescription);

      const res = await updateMitraContent(formData);
      setMessage({ type: 'success', text: res.message || 'Konten Gabung Mitra berhasil diperbarui' });
      if (res.data?.mitra_banner) {
        setMitraBannerPreview(resolveImageUrl(res.data.mitra_banner));
        setMitraBannerFile(null);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Gagal memperbarui konten Gabung Mitra' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <FaSpinner className="animate-spin text-3xl text-primary" />
        <span className="ml-3 text-slate-600 font-medium">Memuat konten Gabung Mitra...</span>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="page-title flex items-center gap-2.5">
            <FaHandshake className="text-primary" /> Kelola Konten Gabung Mitra
          </h1>
          <p className="page-subtitle">
            Pengaturan banner hero, judul headline, dan deskripsi pendaftaran mitra nakes
          </p>
        </div>
      </div>

      {/* Alert Notification */}
      {message.text && (
        <div
          className={`p-4 rounded-xl text-sm font-medium border ${
            message.type === 'success'
              ? 'bg-primary-light text-primary-dark border-primary/20'
              : 'bg-danger-bg text-danger border-danger/20'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleMitraSubmit} className="card p-5 sm:p-7 space-y-6">
        <h2 className="text-base font-semibold text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-2">
          <FaHandshake className="text-primary" /> Form Konten Halaman Gabung Mitra
        </h2>

        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
          <label className="form-label">Banner Hero Gabung Mitra</label>
          <p className="text-xs text-slate-500">Format: jpeg, png, jpg, webp (Maksimal 2MB)</p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {mitraBannerPreview ? (
              <div className="relative w-full sm:w-72 aspect-video rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                <img src={mitraBannerPreview} alt="Mitra Banner" className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="w-full sm:w-72 aspect-video rounded-xl border-2 border-dashed border-slate-200 bg-white flex flex-col items-center justify-center text-slate-400">
                <FaImage size={28} />
                <span className="text-xs mt-1">Belum ada banner</span>
              </div>
            )}
            <input
              type="file"
              accept="image/jpeg,image/png,image/jpg,image/webp"
              onChange={(e) => {
                if (e.target.files[0]) {
                  setMitraBannerFile(e.target.files[0]);
                  setMitraBannerPreview(URL.createObjectURL(e.target.files[0]));
                }
              }}
              className="w-full sm:w-auto text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-light file:text-primary-dark hover:file:bg-primary-light/80 cursor-pointer"
            />
          </div>
        </div>

        <div>
          <label className="form-label">Teks Banner Mitra (Headline)</label>
          <input
            type="text"
            value={mitraTextBanner}
            onChange={(e) => setMitraTextBanner(e.target.value)}
            placeholder='Contoh: "Ayo Bergabung Bersama Kami"'
            className="form-input bg-white"
          />
        </div>

        <div>
          <label className="form-label">Deskripsi Gabung Mitra</label>
          <textarea
            rows={4}
            value={mitraDescription}
            onChange={(e) => setMitraDescription(e.target.value)}
            placeholder='Contoh: "Daftar sekarang untuk menjangkau pasien lebih luas."'
            className="form-input resize-none bg-white"
          />
        </div>

        <div className="flex items-center justify-end pt-4 border-t border-slate-200">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex items-center justify-center gap-2 px-6 py-2.5 cursor-pointer"
          >
            {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
            <span>{saving ? "Menyimpan..." : "Simpan Konten Gabung Mitra"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { getAboutContent, updateAboutContent } from '../data/contentData';
import { resolveImageUrl } from '../utils/resolveImage';
import { FaInfoCircle, FaSave, FaImage, FaSpinner } from 'react-icons/fa';

export default function PageKelolaKontenAbout() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // About Form States
  const [aboutTextBanner, setAboutTextBanner] = useState('');
  const [aboutDescriptionText, setAboutDescriptionText] = useState('');
  const [aboutBannerFile, setAboutBannerFile] = useState(null);
  const [aboutBannerPreview, setAboutBannerPreview] = useState('');
  const [aboutDescImageFile, setAboutDescImageFile] = useState(null);
  const [aboutDescImagePreview, setAboutDescImagePreview] = useState('');
  const [visiMisi, setVisiMisi] = useState('');
  const [caraKerja, setCaraKerja] = useState('');
  const [wilayahLayanan, setWilayahLayanan] = useState('');
  const [komitmen, setKomitmen] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const aboutRes = await getAboutContent();

      if (aboutRes) {
        setAboutTextBanner(aboutRes.about_text_banner || '');
        setAboutDescriptionText(aboutRes.about_description_text || '');
        setAboutBannerPreview(aboutRes.about_banner ? resolveImageUrl(aboutRes.about_banner) : '');
        setAboutDescImagePreview(aboutRes.about_description_image ? resolveImageUrl(aboutRes.about_description_image) : '');
        setVisiMisi(aboutRes.visi_misi || '');
        setCaraKerja(aboutRes.cara_kerja || '');
        setWilayahLayanan(aboutRes.wilayah_layanan || '');
        setKomitmen(aboutRes.komitmen || '');
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Gagal memuat konten Tentang Kami dari server' });
    } finally {
      setLoading(false);
    }
  }

  const handleAboutSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      if (aboutBannerFile) {
        formData.append('about_banner', aboutBannerFile);
      }
      if (aboutDescImageFile) {
        formData.append('about_description_image', aboutDescImageFile);
      }
      formData.append('about_text_banner', aboutTextBanner);
      formData.append('about_description_text', aboutDescriptionText);
      formData.append('visi_misi', visiMisi);
      formData.append('cara_kerja', caraKerja);
      formData.append('wilayah_layanan', wilayahLayanan);
      formData.append('komitmen', komitmen);

      const res = await updateAboutContent(formData);
      setMessage({ type: 'success', text: res.message || 'Konten Tentang Kami berhasil disimpan!' });
      if (res.data?.about_banner) {
        setAboutBannerPreview(resolveImageUrl(res.data.about_banner));
        setAboutBannerFile(null);
      }
      if (res.data?.about_description_image) {
        setAboutDescImagePreview(resolveImageUrl(res.data.about_description_image));
        setAboutDescImageFile(null);
      }
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Gagal menyimpan konten Tentang Kami' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <FaSpinner className="animate-spin text-3xl text-primary" />
        <span className="ml-3 text-slate-600 font-medium">Memuat konten Tentang Kami...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <FaInfoCircle className="text-primary" /> Tentang Kami
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Pengaturan banner, teks deskripsi, gambar ilustrasi, dan visi-misi Halaman Tentang Kami</p>
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

      <form onSubmit={handleAboutSubmit} className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 lg:p-8 shadow-xs space-y-6 sm:space-y-8">
        <h2 className="text-base font-semibold text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-2">
          <FaInfoCircle className="text-primary" /> Form Konten Halaman Tentang Kami
        </h2>


        {/* About Banner Upload */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="form-label">Banner Header Tentang Kami</label>
            <div className="flex flex-col items-start gap-3">
              {aboutBannerPreview ? (
                <div className="w-full h-32 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm">
                  <img src={aboutBannerPreview} alt="About Banner" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-48 h-32 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400">
                  <FaImage size={28} />
                  <span className="text-xs mt-1">Belum ada gambar</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files[0]) {
                    setAboutBannerFile(e.target.files[0]);
                    setAboutBannerPreview(URL.createObjectURL(e.target.files[0]));
                  }
                }}
                className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-light file:text-primary-dark hover:file:bg-primary-light/80 cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Foto Deskripsi About Us</label>
            <div className="flex flex-col items-start gap-3">
              {aboutDescImagePreview ? (
                <div className="w-full h-32 rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm">
                  <img src={aboutDescImagePreview} alt="About Description" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-48 h-32 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400">
                  <FaImage size={28} />
                  <span className="text-xs mt-1">Belum ada foto deskripsi</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files[0]) {
                    setAboutDescImageFile(e.target.files[0]);
                    setAboutDescImagePreview(URL.createObjectURL(e.target.files[0]));
                  }
                }}
                className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-light file:text-primary-dark hover:file:bg-primary-light/80 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Text Fields Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="form-label">Text Banner Header</label>
            <input
              type="text"
              value={aboutTextBanner}
              onChange={(e) => setAboutTextBanner(e.target.value)}
              placeholder="Contoh: Kenali Kami Lebih Dekat"
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">Deskripsi Utama SmartHomeCare</label>
            <textarea
              rows={3}
              value={aboutDescriptionText}
              onChange={(e) => setAboutDescriptionText(e.target.value)}
              placeholder="Tulis deskripsi sejarah/pendirian SmartHomeCare..."
              className="form-input resize-none"
            />
          </div>

          <div>
            <label className="form-label">Visi &amp; Misi Perusahaan</label>
            <textarea
              rows={3}
              value={visiMisi}
              onChange={(e) => setVisiMisi(e.target.value)}
              placeholder="Tulis visi dan misi perusahaan..."
              className="form-input resize-none"
            />
          </div>

          <div>
            <label className="form-label">Cara Kerja Layanan</label>
            <textarea
              rows={3}
              value={caraKerja}
              onChange={(e) => setCaraKerja(e.target.value)}
              placeholder="Contoh: 1. Pesan via Web, 2. Nakes Datang..."
              className="form-input resize-none"
            />
          </div>

          <div>
            <label className="form-label">Komitmen Perusahaan</label>
            <textarea
              rows={3}
              value={komitmen}
              onChange={(e) => setKomitmen(e.target.value)}
              placeholder="Tulis komitmen pelayanan kepada pasien..."
              className="form-input resize-none"
            />
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving}
            className="btn-primary flex items-center justify-center gap-2 px-6 py-2.5"
          >
            {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
            Simpan Konten Tentang Kami
          </button>
        </div>
      </form>
    </div>
  );
}


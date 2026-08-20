import { useEffect, useState } from 'react';
import { getHomeContent, updateHomeContent } from '../data/contentData';
import { FaHome, FaSave, FaImage, FaSpinner, FaPlus, FaTrash } from 'react-icons/fa';

export default function PageKelolaKontenHome() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Home Form Dynamic Slides State (Max 10)
  const [slides, setSlides] = useState([
    { id: 1, file: null, preview: '', text: '', description: '' }
  ]);

  // Promo Section States
  const [promoHeading, setPromoHeading] = useState('');
  const [promoText, setPromoText] = useState('');

  // Artikel Section States
  const [artikelHeading, setArtikelHeading] = useState('');
  const [artikelText, setArtikelText] = useState('');

  // Layanan Section States
  const [layananHeading, setLayananHeading] = useState('');
  const [layananText, setLayananText] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const homeRes = await getHomeContent();
      const h = homeRes?.data || homeRes;

      if (h) {
        setPromoHeading(h.promo_heading || '');
        setPromoText(h.promo_text || '');

        setArtikelHeading(h.artikel_heading || '');
        setArtikelText(h.artikel_text || '');

        setLayananHeading(h.layanan_heading || '');
        setLayananText(h.layanan_text || '');

        // Extract dynamic slides (1 to 10)
        const loadedSlides = [];
        for (let i = 1; i <= 10; i++) {
          const bannerKey = i === 1 ? 'home_banner' : `home_banner_${i}`;
          const textKey = i === 1 ? 'home_text_banner' : `home_text_banner_${i}`;
          const descKey = i === 1 ? 'home_description' : `home_description_${i}`;

          const preview = h[bannerKey] || '';
          const text = h[textKey] || '';
          const description = h[descKey] || '';

          if (preview || text || description || i === 1) {
            loadedSlides.push({
              id: i,
              file: null,
              preview: preview,
              text: text,
              description: description,
            });
          }
        }
        setSlides(loadedSlides.length > 0 ? loadedSlides : [{ id: 1, file: null, preview: '', text: '', description: '' }]);
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Gagal memuat konten Home dari server' });
    } finally {
      setLoading(false);
    }
  }

  const handleAddSlide = () => {
    if (slides.length >= 10) {
      setMessage({ type: 'error', text: 'Maksimal 10 slide banner yang dapat ditambahkan.' });
      return;
    }
    setSlides([
      ...slides,
      { id: Date.now(), file: null, preview: '', text: '', description: '' },
    ]);
  };

  const handleRemoveSlide = (index) => {
    if (slides.length <= 1) {
      setMessage({ type: 'error', text: 'Minimal harus ada 1 slide banner.' });
      return;
    }
    const newSlides = slides.filter((_, i) => i !== index);
    setSlides(newSlides);
  };

  const handleSlideChange = (index, field, value) => {
    setSlides((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleHomeSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();

      // Append slots up to 10
      for (let i = 1; i <= 10; i++) {
        const bannerKey = i === 1 ? 'home_banner' : `home_banner_${i}`;
        const textKey = i === 1 ? 'home_text_banner' : `home_text_banner_${i}`;
        const descKey = i === 1 ? 'home_description' : `home_description_${i}`;

        const slide = slides[i - 1];
        if (slide) {
          if (slide.file) {
            formData.append(bannerKey, slide.file);
          }
          formData.append(textKey, slide.text || '');
          formData.append(descKey, slide.description || '');
        } else {
          // Clear removed/unused slide fields
          formData.append(textKey, '');
          formData.append(descKey, '');
        }
      }

      formData.append('promo_heading', promoHeading);
      formData.append('promo_text', promoText);

      formData.append('artikel_heading', artikelHeading);
      formData.append('artikel_text', artikelText);

      formData.append('layanan_heading', layananHeading);
      formData.append('layanan_text', layananText);

      const res = await updateHomeContent(formData);
      
      // Re-fetch data from server to guarantee sync with backend database
      await fetchData();

      setMessage({ type: 'success', text: res.message || 'Konten Home & Hero berhasil disimpan!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Gagal menyimpan konten Home' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <FaSpinner className="animate-spin text-3xl text-primary" />
        <span className="ml-3 text-slate-600 font-medium">Memuat konten Home...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <FaHome className="text-primary" /> Beranda
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Pengaturan banner hero slider dan teks deskripsi section Halaman Beranda Utama</p>
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

      <form onSubmit={handleHomeSubmit} className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 lg:p-8 shadow-xs space-y-6 sm:space-y-8">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <FaHome className="text-primary" /> Konten Slider Banner Halaman Beranda
          </h2>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
            {slides.length} / 10 Banner
          </span>
        </div>

        {/* DYNAMIC SLIDES LIST */}
        {slides.map((slide, index) => (
          <div key={slide.id || index} className="p-5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <span className="font-semibold text-slate-800 text-sm">
                Banner Slide {index + 1} {index === 0 ? '(Utama)' : ''}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-primary-light text-primary-dark font-semibold px-2.5 py-0.5 rounded-full">
                  Slide #{index + 1}
                </span>
                {slides.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveSlide(index)}
                    className="text-xs text-red-600 hover:text-red-800 p-1.5 rounded-lg hover:bg-red-50 transition-colors flex items-center gap-1 font-medium cursor-pointer"
                    title="Hapus Slide"
                  >
                    <FaTrash size={12} /> Hapus
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="form-label">Gambar Banner {index + 1}</label>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                {slide.preview ? (
                  <div className="relative w-48 h-28 rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                    <img src={slide.preview} alt={`Home Banner ${index + 1}`} className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-48 h-28 rounded-xl border-2 border-dashed border-slate-200 bg-white flex flex-col items-center justify-center text-slate-400">
                    <FaImage size={28} />
                    <span className="text-xs mt-1">Belum ada banner</span>
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files[0]) {
                      const file = e.target.files[0];
                      const preview = URL.createObjectURL(file);
                      setSlides((prev) =>
                        prev.map((item, i) =>
                          i === index ? { ...item, file, preview } : item
                        )
                      );
                    }
                  }}
                  className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-light file:text-primary-dark hover:file:bg-primary-light/80 cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="form-label">Headline Text Slide {index + 1}</label>
              <input
                type="text"
                value={slide.text}
                onChange={(e) => handleSlideChange(index, 'text', e.target.value)}
                placeholder={`Contoh: Headline untuk Slide ${index + 1}`}
                className="form-input bg-white"
              />
            </div>

            <div>
              <label className="form-label">Deskripsi Slide {index + 1}</label>
              <textarea
                rows={3}
                value={slide.description}
                onChange={(e) => handleSlideChange(index, 'description', e.target.value)}
                placeholder={`Tulis deskripsi singkat untuk Slide ${index + 1}...`}
                className="form-input resize-none bg-white"
              />
            </div>
          </div>
        ))}

        {slides.length < 10 && (
          <button
            type="button"
            onClick={handleAddSlide}
            className="w-full py-3 border-2 border-dashed border-primary/40 text-primary hover:bg-primary-light/40 font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <FaPlus size={14} /> Tambah Slide Banner (Maks. 10)
          </button>
        )}

        {/* PROMO SECTION */}
        <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-4">
          <div className="border-b border-slate-200 pb-2.5">
            <span className="font-semibold text-slate-800 text-sm">Pengaturan Konten Promo</span>
          </div>
          <div>
            <label className="form-label">Heading Promo</label>
            <input
              type="text"
              value={promoHeading}
              onChange={(e) => setPromoHeading(e.target.value)}
              placeholder="Contoh: Promo Spesial Kemerdekaan"
              className="form-input bg-white"
            />
          </div>
          <div>
            <label className="form-label">Deskripsi / Teks Promo</label>
            <textarea
              rows={2}
              value={promoText}
              onChange={(e) => setPromoText(e.target.value)}
              placeholder="Diskon spesial hingga 50% untuk layanan tertentu..."
              className="form-input resize-none bg-white"
            />
          </div>
        </div>

        {/* ARTIKEL SECTION */}
        <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-4">
          <div className="border-b border-slate-200 pb-2.5">
            <span className="font-semibold text-slate-800 text-sm">Pengaturan Konten Artikel</span>
          </div>
          <div>
            <label className="form-label">Heading Artikel</label>
            <input
              type="text"
              value={artikelHeading}
              onChange={(e) => setArtikelHeading(e.target.value)}
              placeholder="Contoh: Artikel & Info Medis"
              className="form-input bg-white"
            />
          </div>
          <div>
            <label className="form-label">Deskripsi / Teks Artikel</label>
            <textarea
              rows={2}
              value={artikelText}
              onChange={(e) => setArtikelText(e.target.value)}
              placeholder="Temukan edukasi kesehatan harian yang disusun oleh dokter..."
              className="form-input resize-none bg-white"
            />
          </div>
        </div>

        {/* LAYANAN SECTION */}
        <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-4">
          <div className="border-b border-slate-200 pb-2.5">
            <span className="font-semibold text-slate-800 text-sm">Pengaturan Konten Layanan</span>
          </div>
          <div>
            <label className="form-label">Heading Layanan</label>
            <input
              type="text"
              value={layananHeading}
              onChange={(e) => setLayananHeading(e.target.value)}
              placeholder="Contoh: Layanan Home Care Kami"
              className="form-input bg-white"
            />
          </div>
          <div>
            <label className="form-label">Deskripsi / Teks Layanan</label>
            <textarea
              rows={2}
              value={layananText}
              onChange={(e) => setLayananText(e.target.value)}
              placeholder="Berbagai opsi layanan fisioterapi, okupasi terapi, dan perawatan medis..."
              className="form-input resize-none bg-white"
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
            Simpan Konten Home
          </button>
        </div>
      </form>
    </div>
  );
}



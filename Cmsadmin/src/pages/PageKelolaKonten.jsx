import { useEffect, useState } from 'react';
import { 
  getHomeContent, 
  updateHomeContent, 
  getAboutContent, 
  updateAboutContent,
  getMitraContent,
  updateMitraContent,
  getFooterContent,
  updateFooterContent
} from '../data/contentData';
import { resolveImageUrl } from '../utils/resolveImage';
import { FaHome, FaInfoCircle, FaHandshake, FaGlobe, FaSave, FaImage, FaSpinner, FaPlus, FaTrash } from 'react-icons/fa';

export default function PageKelolaKonten() {
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Home Form Dynamic Slides State (Max 10)
  const [homeSlides, setHomeSlides] = useState([
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

  // Gabung Mitra Form States
  const [mitraTextBanner, setMitraTextBanner] = useState('');
  const [mitraDescription, setMitraDescription] = useState('');
  const [mitraBannerFile, setMitraBannerFile] = useState(null);
  const [mitraBannerPreview, setMitraBannerPreview] = useState('');

  // Footer Form States
  const [footerDescription, setFooterDescription] = useState('');
  const [footerPhone, setFooterPhone] = useState('');
  const [footerEmail, setFooterEmail] = useState('');
  const [footerAddress, setFooterAddress] = useState('');
  const [footerSocials, setFooterSocials] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [homeRes, aboutRes, mitraRes, footerRes] = await Promise.allSettled([
        getHomeContent(),
        getAboutContent(),
        getMitraContent(),
        getFooterContent(),
      ]);

      if (homeRes.status === 'fulfilled' && homeRes.value) {
        const h = homeRes.value?.data || homeRes.value;

        setPromoHeading(h.promo_heading || '');
        setPromoText(h.promo_text || '');

        setArtikelHeading(h.artikel_heading || '');
        setArtikelText(h.artikel_text || '');

        setLayananHeading(h.layanan_heading || '');
        setLayananText(h.layanan_text || '');

        const loadedSlides = [];
        for (let i = 1; i <= 10; i++) {
          const bannerKey = i === 1 ? 'home_banner' : `home_banner_${i}`;
          const textKey = i === 1 ? 'home_text_banner' : `home_text_banner_${i}`;
          const descKey = i === 1 ? 'home_description' : `home_description_${i}`;

          const preview = h[bannerKey] ? resolveImageUrl(h[bannerKey]) : '';
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
        setHomeSlides(loadedSlides.length > 0 ? loadedSlides : [{ id: 1, file: null, preview: '', text: '', description: '' }]);
      }

      if (aboutRes.status === 'fulfilled' && aboutRes.value) {
        const a = aboutRes.value;
        setAboutTextBanner(a.about_text_banner || '');
        setAboutDescriptionText(a.about_description_text || '');
        setAboutBannerPreview(a.about_banner ? resolveImageUrl(a.about_banner) : '');
        setAboutDescImagePreview(a.about_description_image ? resolveImageUrl(a.about_description_image) : '');
        setVisiMisi(a.visi_misi || '');
        setCaraKerja(a.cara_kerja || '');
        setWilayahLayanan(a.wilayah_layanan || '');
        setKomitmen(a.komitmen || '');
      }

      if (mitraRes.status === 'fulfilled' && mitraRes.value) {
        const m = mitraRes.value.data || mitraRes.value;
        setMitraTextBanner(m.mitra_text_banner || '');
        setMitraDescription(m.mitra_description || '');
        setMitraBannerPreview(m.mitra_banner ? resolveImageUrl(m.mitra_banner) : '');
      }

      if (footerRes.status === 'fulfilled' && footerRes.value) {
        const f = footerRes.value.data || footerRes.value;
        setFooterDescription(f.footer_description || '');
        setFooterPhone(f.footer_phone || '');
        setFooterEmail(f.footer_email || '');
        setFooterAddress(f.footer_address || '');
        setFooterSocials(Array.isArray(f.footer_socials) ? f.footer_socials : []);
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Gagal memuat konten dari server' });
    } finally {
      setLoading(false);
    }
  }

  const handleAddHomeSlide = () => {
    if (homeSlides.length >= 10) {
      setMessage({ type: 'error', text: 'Maksimal 10 slide banner yang dapat ditambahkan.' });
      return;
    }
    setHomeSlides([
      ...homeSlides,
      { id: Date.now(), file: null, preview: '', text: '', description: '' },
    ]);
  };

  const handleRemoveHomeSlide = (index) => {
    if (homeSlides.length <= 1) {
      setMessage({ type: 'error', text: 'Minimal harus ada 1 slide banner.' });
      return;
    }
    const newSlides = homeSlides.filter((_, i) => i !== index);
    setHomeSlides(newSlides);
  };

  const handleHomeSlideChange = (index, field, value) => {
    setHomeSlides((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  const handleHomeSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();

      for (let i = 1; i <= 10; i++) {
        const bannerKey = i === 1 ? 'home_banner' : `home_banner_${i}`;
        const textKey = i === 1 ? 'home_text_banner' : `home_text_banner_${i}`;
        const descKey = i === 1 ? 'home_description' : `home_description_${i}`;

        const slide = homeSlides[i - 1];
        if (slide) {
          if (slide.file) {
            formData.append(bannerKey, slide.file);
          }
          formData.append(textKey, slide.text || '');
          formData.append(descKey, slide.description || '');
        } else {
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

      setMessage({ type: 'success', text: res.message || 'Konten Home berhasil disimpan!' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Gagal menyimpan konten Home' });
    } finally {
      setSaving(false);
    }
  };

  const handleAboutSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      if (aboutBannerFile) formData.append('about_banner', aboutBannerFile);
      if (aboutDescImageFile) formData.append('about_description_image', aboutDescImageFile);
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

  const handleFooterSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const payload = {
        footer_description: footerDescription,
        footer_phone: footerPhone,
        footer_email: footerEmail,
        footer_address: footerAddress,
        footer_socials: footerSocials,
      };

      const res = await updateFooterContent(payload);
      setMessage({ type: 'success', text: res.message || 'Konten Footer berhasil diperbarui' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Gagal memperbarui konten Footer' });
    } finally {
      setSaving(false);
    }
  };

  const handleAddSocial = () => {
    setFooterSocials([...footerSocials, { name: '', icon: 'fa-facebook', url: '' }]);
  };

  const handleRemoveSocial = (index) => {
    setFooterSocials(footerSocials.filter((_, i) => i !== index));
  };

  const handleSocialChange = (index, field, value) => {
    const updated = [...footerSocials];
    updated[index] = { ...updated[index], [field]: value };
    setFooterSocials(updated);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <FaSpinner className="animate-spin text-3xl text-primary" />
        <span className="ml-3 text-slate-600 font-medium">Memuat konten...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Manajemen Konten Web</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Kelola konten Halaman Beranda, Tentang Kami, Gabung Mitra, dan Footer</p>
        </div>

        {/* Tab Selector */}
        <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl shadow-inner border border-slate-200 gap-1">
          <button
            onClick={() => { setActiveTab('home'); setMessage({ type: '', text: '' }); }}
            className={`flex items-center px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'home'
                ? 'bg-primary text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FaHome className="mr-2" /> Beranda
          </button>

          <button
            onClick={() => { setActiveTab('about'); setMessage({ type: '', text: '' }); }}
            className={`flex items-center px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'about'
                ? 'bg-primary text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FaInfoCircle className="mr-2" /> Tentang Kami
          </button>
          <button
            onClick={() => { setActiveTab('mitra'); setMessage({ type: '', text: '' }); }}
            className={`flex items-center px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'mitra'
                ? 'bg-primary text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FaHandshake className="mr-2" /> Gabung Mitra
          </button>
          <button
            onClick={() => { setActiveTab('footer'); setMessage({ type: '', text: '' }); }}
            className={`flex items-center px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'footer'
                ? 'bg-primary text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FaGlobe className="mr-2" /> Footer
          </button>
        </div>
      </div>

      {/* Alert Notification */}
      {message.text && (
        <div
          className={`mb-6 p-4 rounded-xl text-sm font-medium border ${
            message.type === 'success'
              ? 'bg-primary-light text-primary-dark border-primary/20'
              : 'bg-danger-bg text-danger border-danger/20'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* TAB KONTEN HOME */}
      {activeTab === 'home' && (
        <form onSubmit={handleHomeSubmit} className="card p-6 space-y-8">
          <div className="flex items-center justify-between border-b border-slate-200 pb-3">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <FaHome className="text-primary" /> Konten Slider Banner Halaman Home
            </h2>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-50 text-blue-600 border border-blue-200">
              {homeSlides.length} / 10 Banner
            </span>
          </div>

          {/* DYNAMIC SLIDES LIST */}
          {homeSlides.map((slide, index) => (
            <div key={slide.id || index} className="p-5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <span className="font-semibold text-slate-800 text-sm">
                  Banner Slide {index + 1} {index === 0 ? '(Utama)' : ''}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-primary-light text-primary-dark font-semibold px-2.5 py-0.5 rounded-full">
                    Slide #{index + 1}
                  </span>
                  {homeSlides.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveHomeSlide(index)}
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
                        setHomeSlides((prev) =>
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
                  onChange={(e) => handleHomeSlideChange(index, 'text', e.target.value)}
                  placeholder={`Contoh: Headline untuk Slide ${index + 1}`}
                  className="form-input bg-white"
                />
              </div>

              <div>
                <label className="form-label">Deskripsi Slide {index + 1}</label>
                <textarea
                  rows={3}
                  value={slide.description}
                  onChange={(e) => handleHomeSlideChange(index, 'description', e.target.value)}
                  placeholder={`Tulis deskripsi singkat untuk Slide ${index + 1}...`}
                  className="form-input resize-none bg-white"
                />
              </div>
            </div>
          ))}

          {homeSlides.length < 10 && (
            <button
              type="button"
              onClick={handleAddHomeSlide}
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
      )}

      {/* TAB KONTEN TENTANG KAMI */}
      {activeTab === 'about' && (
        <form onSubmit={handleAboutSubmit} className="card p-6 space-y-6">
          <h2 className="text-base font-semibold text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-2">
            <FaInfoCircle className="text-primary" /> Konten Halaman Tentang Kami
          </h2>

          {/* About Banner Upload */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="form-label">Banner Header Tentang Kami</label>
              <div className="flex flex-col items-start gap-3">
                {aboutBannerPreview ? (
                  <div className="w-full h-32 rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                    <img src={aboutBannerPreview} alt="About Banner" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-full h-32 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400">
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
                  <div className="w-full h-32 rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                    <img src={aboutDescImagePreview} alt="About Description" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-full h-32 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400">
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
              <label className="form-label">Visi & Misi</label>
              <textarea
                rows={3}
                value={visiMisi}
                onChange={(e) => setVisiMisi(e.target.value)}
                placeholder="Tulis visi dan misi perusahaan..."
                className="form-input resize-none"
              />
            </div>

            <div>
              <label className="form-label">Cara Kerja</label>
              <textarea
                rows={3}
                value={caraKerja}
                onChange={(e) => setCaraKerja(e.target.value)}
                placeholder="Contoh: 1. Pesan via Web, 2. Nakes Datang..."
                className="form-input resize-none"
              />
            </div>

            <div>
              <label className="form-label">Wilayah Layanan</label>
              <textarea
                rows={3}
                value={wilayahLayanan}
                onChange={(e) => setWilayahLayanan(e.target.value)}
                placeholder="Contoh: Jakarta, Bogor, Depok, Tangerang, Bekasi..."
                className="form-input resize-none"
              />
            </div>

            <div>
              <label className="form-label">Komitmen</label>
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
      )}

      {/* TAB KONTEN GABUNG MITRA */}
      {activeTab === 'mitra' && (
        <form onSubmit={handleMitraSubmit} className="card p-6 space-y-6">
          <h2 className="text-base font-semibold text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-2">
            <FaHandshake className="text-primary" /> Konten Halaman Gabung Mitra
          </h2>

          <div>
            <label className="form-label">Banner Gabung Mitra</label>
            <p className="text-xs text-slate-500 mb-2">Format: jpeg, png, jpg, webp (Maksimal 2MB)</p>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {mitraBannerPreview ? (
                <div className="relative w-48 h-28 rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                  <img src={mitraBannerPreview} alt="Mitra Banner" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-48 h-28 rounded-xl border-2 border-dashed border-slate-200 bg-white flex flex-col items-center justify-center text-slate-400">
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
                className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-light file:text-primary-dark hover:file:bg-primary-light/80 cursor-pointer"
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
              className="form-input"
            />
          </div>

          <div>
            <label className="form-label">Deskripsi Gabung Mitra</label>
            <textarea
              rows={4}
              value={mitraDescription}
              onChange={(e) => setMitraDescription(e.target.value)}
              placeholder='Contoh: "Daftar sekarang untuk menjangkau pasien lebih luas."'
              className="form-input resize-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex items-center justify-center gap-2 px-6 py-2.5"
            >
              {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
              Simpan Konten Gabung Mitra
            </button>
          </div>
        </form>
      )}

      {/* TAB KONTEN FOOTER */}
      {activeTab === 'footer' && (
        <form onSubmit={handleFooterSubmit} className="card p-6 space-y-6">
          <h2 className="text-base font-semibold text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-2">
            <FaGlobe className="text-primary" /> Konten Footer Web
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="form-label">Deskripsi Footer</label>
              <textarea
                rows={3}
                value={footerDescription}
                onChange={(e) => setFooterDescription(e.target.value)}
                placeholder="Contoh: Solusi kesehatan keluarga terpercaya langsung di rumah Anda."
                className="form-input resize-none"
              />
            </div>

            <div>
              <label className="form-label">Telepon Kontak</label>
              <input
                type="text"
                value={footerPhone}
                onChange={(e) => setFooterPhone(e.target.value)}
                placeholder="Contoh: 021-99998888 / 08123456789"
                className="form-input"
              />
            </div>

            <div>
              <label className="form-label">Email Kontak</label>
              <input
                type="email"
                value={footerEmail}
                onChange={(e) => setFooterEmail(e.target.value)}
                placeholder="Contoh: info@homecare.com"
                className="form-input"
              />
            </div>

            <div className="md:col-span-2">
              <label className="form-label">Alamat Kantor</label>
              <textarea
                rows={2}
                value={footerAddress}
                onChange={(e) => setFooterAddress(e.target.value)}
                placeholder="Contoh: Ruko Sentra Medika, Blok B No. 9, Jakarta"
                className="form-input resize-none"
              />
            </div>
          </div>

          {/* Social Media Links Editor */}
          <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <div>
                <span className="font-semibold text-slate-800 text-sm">Tautan Media Sosial</span>
                <p className="text-xs text-slate-500">Kelola akun medsos yang ditampilkan di footer</p>
              </div>
              <button
                type="button"
                onClick={handleAddSocial}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-primary text-white hover:bg-primary-dark transition shadow-sm"
              >
                <FaPlus size={12} /> Tambah Medsos
              </button>
            </div>

            {footerSocials.length === 0 ? (
              <p className="text-sm text-slate-400 italic py-2">Belum ada media sosial ditambahkan.</p>
            ) : (
              <div className="space-y-3">
                {footerSocials.map((soc, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row items-center gap-3 p-3 bg-white border border-slate-200 rounded-xl">
                    <div className="w-full sm:w-1/3">
                      <label className="text-[11px] font-semibold text-slate-500 block mb-1">Nama Platform</label>
                      <input
                        type="text"
                        value={soc.name || ''}
                        onChange={(e) => handleSocialChange(idx, 'name', e.target.value)}
                        placeholder="Facebook / Instagram / TikTok"
                        className="form-input text-xs"
                      />
                    </div>
                    <div className="w-full sm:w-1/3">
                      <label className="text-[11px] font-semibold text-slate-500 block mb-1">Icon (FontAwesome/Custom)</label>
                      <input
                        type="text"
                        value={soc.icon || ''}
                        onChange={(e) => handleSocialChange(idx, 'icon', e.target.value)}
                        placeholder="fa-facebook / fa-instagram"
                        className="form-input text-xs"
                      />
                    </div>
                    <div className="w-full sm:w-1/3">
                      <label className="text-[11px] font-semibold text-slate-500 block mb-1">URL Tautan</label>
                      <input
                        type="url"
                        value={soc.url || ''}
                        onChange={(e) => handleSocialChange(idx, 'url', e.target.value)}
                        placeholder="https://facebook.com/..."
                        className="form-input text-xs"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveSocial(idx)}
                      className="mt-4 sm:mt-5 p-2 text-danger hover:bg-danger-bg rounded-lg transition"
                      title="Hapus Media Sosial"
                    >
                      <FaTrash size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex items-center justify-center gap-2 px-6 py-2.5"
            >
              {saving ? <FaSpinner className="animate-spin" /> : <FaSave />}
              Simpan Konten Footer
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

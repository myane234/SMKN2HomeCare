import { useEffect, useState } from 'react';
import { getHomeContent, updateHomeContent } from '../data/contentData';
import { FaHome, FaSave, FaImage, FaSpinner } from 'react-icons/fa';

export default function PageKelolaKontenHome() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Home Form States (Slide 1)
  const [homeTextBanner, setHomeTextBanner] = useState('');
  const [homeDescription, setHomeDescription] = useState('');
  const [homeBannerFile, setHomeBannerFile] = useState(null);
  const [homeBannerPreview, setHomeBannerPreview] = useState('');

  // Promo Section States
  const [promoHeading, setPromoHeading] = useState('');
  const [promoText, setPromoText] = useState('');

  // Artikel Section States
  const [artikelHeading, setArtikelHeading] = useState('');
  const [artikelText, setArtikelText] = useState('');

  // Layanan Section States
  const [layananHeading, setLayananHeading] = useState('');
  const [layananText, setLayananText] = useState('');

  // Home Form States (Slide 2)
  const [homeTextBanner2, setHomeTextBanner2] = useState('');
  const [homeDescription2, setHomeDescription2] = useState('');
  const [homeBanner2File, setHomeBanner2File] = useState(null);
  const [homeBanner2Preview, setHomeBanner2Preview] = useState('');

  // Home Form States (Slide 3)
  const [homeTextBanner3, setHomeTextBanner3] = useState('');
  const [homeDescription3, setHomeDescription3] = useState('');
  const [homeBanner3File, setHomeBanner3File] = useState(null);
  const [homeBanner3Preview, setHomeBanner3Preview] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const homeRes = await getHomeContent();

      if (homeRes) {
        setHomeTextBanner(homeRes.home_text_banner || '');
        setHomeDescription(homeRes.home_description || '');
        setHomeBannerPreview(homeRes.home_banner || '');

        setPromoHeading(homeRes.promo_heading || '');
        setPromoText(homeRes.promo_text || '');

        setArtikelHeading(homeRes.artikel_heading || '');
        setArtikelText(homeRes.artikel_text || '');

        setLayananHeading(homeRes.layanan_heading || '');
        setLayananText(homeRes.layanan_text || '');

        setHomeTextBanner2(homeRes.home_text_banner_2 || '');
        setHomeDescription2(homeRes.home_description_2 || '');
        setHomeBanner2Preview(homeRes.home_banner_2 || '');

        setHomeTextBanner3(homeRes.home_text_banner_3 || '');
        setHomeDescription3(homeRes.home_description_3 || '');
        setHomeBanner3Preview(homeRes.home_banner_3 || '');
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Gagal memuat konten Home dari server' });
    } finally {
      setLoading(false);
    }
  }

  const handleHomeSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      if (homeBannerFile) {
        formData.append('home_banner', homeBannerFile);
      }
      formData.append('home_text_banner', homeTextBanner);
      formData.append('home_description', homeDescription);

      formData.append('promo_heading', promoHeading);
      formData.append('promo_text', promoText);

      formData.append('artikel_heading', artikelHeading);
      formData.append('artikel_text', artikelText);

      formData.append('layanan_heading', layananHeading);
      formData.append('layanan_text', layananText);

      if (homeBanner2File) {
        formData.append('home_banner_2', homeBanner2File);
      }
      formData.append('home_text_banner_2', homeTextBanner2);
      formData.append('home_description_2', homeDescription2);

      if (homeBanner3File) {
        formData.append('home_banner_3', homeBanner3File);
      }
      formData.append('home_text_banner_3', homeTextBanner3);
      formData.append('home_description_3', homeDescription3);

      const res = await updateHomeContent(formData);
      setMessage({ type: 'success', text: res.message || 'Konten Home & Hero berhasil disimpan!' });
      if (res.data) {
        if (res.data.home_banner) setHomeBannerPreview(res.data.home_banner);
        if (res.data.home_banner_2) setHomeBanner2Preview(res.data.home_banner_2);
        if (res.data.home_banner_3) setHomeBanner3Preview(res.data.home_banner_3);
        setHomeBannerFile(null);
        setHomeBanner2File(null);
        setHomeBanner3File(null);
      }
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
        <h2 className="text-base font-semibold text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-2">
          <FaHome className="text-primary" /> Konten Slider Banner Halaman Beranda
        </h2>


        {/* SLIDE 1 */}
        <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <span className="font-semibold text-slate-800 text-sm">Banner Slide 1 (Utama)</span>
            <span className="text-xs bg-primary-light text-primary-dark font-semibold px-2.5 py-0.5 rounded-full">Slide #1</span>
          </div>

          <div>
            <label className="form-label">Gambar Banner 1</label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {homeBannerPreview ? (
                <div className="relative w-48 h-28 rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                  <img src={homeBannerPreview} alt="Home Banner 1" className="w-full h-full object-cover" />
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
                    setHomeBannerFile(e.target.files[0]);
                    setHomeBannerPreview(URL.createObjectURL(e.target.files[0]));
                  }
                }}
                className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-light file:text-primary-dark hover:file:bg-primary-light/80 cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Headline Text Slide 1</label>
            <input
              type="text"
              value={homeTextBanner}
              onChange={(e) => setHomeTextBanner(e.target.value)}
              placeholder="Contoh: Layanan Kesehatan Langsung ke Rumah"
              className="form-input bg-white"
            />
          </div>

          <div>
            <label className="form-label">Deskripsi Slide 1</label>
            <textarea
              rows={3}
              value={homeDescription}
              onChange={(e) => setHomeDescription(e.target.value)}
              placeholder="Tulis deskripsi singkat untuk Slide 1..."
              className="form-input resize-none bg-white"
            />
          </div>
        </div>

        {/* SLIDE 2 */}
        <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <span className="font-semibold text-slate-800 text-sm">Banner Slide 2</span>
            <span className="text-xs bg-primary-light text-primary-dark font-semibold px-2.5 py-0.5 rounded-full">Slide #2</span>
          </div>

          <div>
            <label className="form-label">Gambar Banner 2</label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {homeBanner2Preview ? (
                <div className="relative w-48 h-28 rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                  <img src={homeBanner2Preview} alt="Home Banner 2" className="w-full h-full object-cover" />
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
                    setHomeBanner2File(e.target.files[0]);
                    setHomeBanner2Preview(URL.createObjectURL(e.target.files[0]));
                  }
                }}
                className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-light file:text-primary-dark hover:file:bg-primary-light/80 cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Headline Text Slide 2</label>
            <input
              type="text"
              value={homeTextBanner2}
              onChange={(e) => setHomeTextBanner2(e.target.value)}
              placeholder="Contoh: Tenaga Kesehatan Profesional"
              className="form-input bg-white"
            />
          </div>

          <div>
            <label className="form-label">Deskripsi Slide 2</label>
            <textarea
              rows={3}
              value={homeDescription2}
              onChange={(e) => setHomeDescription2(e.target.value)}
              placeholder="Tulis deskripsi singkat untuk Slide 2..."
              className="form-input resize-none bg-white"
            />
          </div>
        </div>

        {/* SLIDE 3 */}
        <div className="p-5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <span className="font-semibold text-slate-800 text-sm">Banner Slide 3</span>
            <span className="text-xs bg-primary-light text-primary-dark font-semibold px-2.5 py-0.5 rounded-full">Slide #3</span>
          </div>

          <div>
            <label className="form-label">Gambar Banner 3</label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {homeBanner3Preview ? (
                <div className="relative w-48 h-28 rounded-xl overflow-hidden border border-slate-200 bg-white shadow-sm">
                  <img src={homeBanner3Preview} alt="Home Banner 3" className="w-full h-full object-cover" />
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
                    setHomeBanner3File(e.target.files[0]);
                    setHomeBanner3Preview(URL.createObjectURL(e.target.files[0]));
                  }
                }}
                className="text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-light file:text-primary-dark hover:file:bg-primary-light/80 cursor-pointer"
              />
            </div>
          </div>

          <div>
            <label className="form-label">Headline Text Slide 3</label>
            <input
              type="text"
              value={homeTextBanner3}
              onChange={(e) => setHomeTextBanner3(e.target.value)}
              placeholder="Contoh: Booking Mudah Kapan Saja"
              className="form-input bg-white"
            />
          </div>

          <div>
            <label className="form-label">Deskripsi Slide 3</label>
            <textarea
              rows={3}
              value={homeDescription3}
              onChange={(e) => setHomeDescription3(e.target.value)}
              placeholder="Tulis deskripsi singkat untuk Slide 3..."
              className="form-input resize-none bg-white"
            />
          </div>
        </div>

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


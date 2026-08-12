import { useEffect, useState } from 'react';
import { getHomeContent, updateHomeContent, getAboutContent, updateAboutContent } from '../data/contentData';
import { FaHome, FaInfoCircle, FaSave, FaImage, FaSpinner } from 'react-icons/fa';

export default function PageKelolaKonten() {
  const [activeTab, setActiveTab] = useState('home');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Home Form States
  const [homeTextBanner, setHomeTextBanner] = useState('');
  const [homeDescription, setHomeDescription] = useState('');
  const [homeBannerFile, setHomeBannerFile] = useState(null);
  const [homeBannerPreview, setHomeBannerPreview] = useState('');

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
      const [homeRes, aboutRes] = await Promise.all([
        getHomeContent(),
        getAboutContent(),
      ]);

      if (homeRes) {
        setHomeTextBanner(homeRes.home_text_banner || '');
        setHomeDescription(homeRes.home_description || '');
        setHomeBannerPreview(homeRes.home_banner || '');
      }

      if (aboutRes) {
        setAboutTextBanner(aboutRes.about_text_banner || '');
        setAboutDescriptionText(aboutRes.about_description_text || '');
        setAboutBannerPreview(aboutRes.about_banner || '');
        setAboutDescImagePreview(aboutRes.about_description_image || '');
        setVisiMisi(aboutRes.visi_misi || '');
        setCaraKerja(aboutRes.cara_kerja || '');
        setWilayahLayanan(aboutRes.wilayah_layanan || '');
        setKomitmen(aboutRes.komitmen || '');
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Gagal memuat konten dari server' });
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

      const res = await updateHomeContent(formData);
      setMessage({ type: 'success', text: res.message || 'Konten Home berhasil disimpan!' });
      if (res.data?.home_banner) {
        setHomeBannerPreview(res.data.home_banner);
        setHomeBannerFile(null);
      }
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
        setAboutBannerPreview(res.data.about_banner);
        setAboutBannerFile(null);
      }
      if (res.data?.about_description_image) {
        setAboutDescImagePreview(res.data.about_description_image);
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
        <FaSpinner className="animate-spin text-3xl text-blue-600" />
        <span className="ml-3 text-gray-600 font-medium">Memuat konten...</span>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manajemen Konten Web</h1>
          <p className="text-sm text-gray-500">Kelola gambar banner & teks utama Halaman Home dan Tentang Kami</p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-gray-100 p-1 rounded-xl shadow-inner border border-gray-200">
          <button
            onClick={() => { setActiveTab('home'); setMessage({ type: '', text: '' }); }}
            className={`flex items-center px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'home'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FaHome className="mr-2" /> Home Page
          </button>
          <button
            onClick={() => { setActiveTab('about'); setMessage({ type: '', text: '' }); }}
            className={`flex items-center px-4 py-2 text-sm font-semibold rounded-lg transition-all ${
              activeTab === 'about'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <FaInfoCircle className="mr-2" /> Tentang Kami
          </button>
        </div>
      </div>

      {/* Alert Notification */}
      {message.text && (
        <div
          className={`mb-6 p-4 rounded-xl text-sm font-medium border ${
            message.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* TAB KONTEN HOME */}
      {activeTab === 'home' && (
        <form onSubmit={handleHomeSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-6">
          <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-100 pb-3 flex items-center">
            <FaHome className="mr-2 text-blue-600" /> Konten Halaman Home
          </h2>

          {/* Banner Upload */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Banner Home Image</label>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              {homeBannerPreview ? (
                <div className="relative w-48 h-28 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shadow-sm">
                  <img src={homeBannerPreview} alt="Home Banner" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-48 h-28 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-gray-400">
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
                className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
            </div>
          </div>

          {/* Text Banner */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Text Banner (Headline)</label>
            <input
              type="text"
              value={homeTextBanner}
              onChange={(e) => setHomeTextBanner(e.target.value)}
              placeholder="Contoh: Promo Bulan Ini!"
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Deskripsi SmartHomeCare (Home)</label>
            <textarea
              rows={4}
              value={homeDescription}
              onChange={(e) => setHomeDescription(e.target.value)}
              placeholder="Tulis deskripsi singkat SmartHomeCare yang tampil di home..."
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            {saving ? <FaSpinner className="animate-spin mr-2" /> : <FaSave className="mr-2" />}
            Simpan Konten Home
          </button>
        </form>
      )}

      {/* TAB KONTEN TENTANG KAMI */}
      {activeTab === 'about' && (
        <form onSubmit={handleAboutSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-6">
          <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-100 pb-3 flex items-center">
            <FaInfoCircle className="mr-2 text-blue-600" /> Konten Halaman Tentang Kami
          </h2>

          {/* About Banner Upload */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Banner Header Tentang Kami</label>
              <div className="flex flex-col items-start gap-3">
                {aboutBannerPreview ? (
                  <div className="w-full h-32 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shadow-sm">
                    <img src={aboutBannerPreview} alt="About Banner" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-full h-32 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-gray-400">
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
                  className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Foto Deskripsi About Us</label>
              <div className="flex flex-col items-start gap-3">
                {aboutDescImagePreview ? (
                  <div className="w-full h-32 rounded-xl overflow-hidden border border-gray-200 bg-gray-50 shadow-sm">
                    <img src={aboutDescImagePreview} alt="About Description" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-full h-32 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-gray-400">
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
                  className="text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Text Fields Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Text Banner Header</label>
              <input
                type="text"
                value={aboutTextBanner}
                onChange={(e) => setAboutTextBanner(e.target.value)}
                placeholder="Contoh: Kenali Kami Lebih Dekat"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Deskripsi Utama SmartHomeCare</label>
              <textarea
                rows={3}
                value={aboutDescriptionText}
                onChange={(e) => setAboutDescriptionText(e.target.value)}
                placeholder="Tulis deskripsi sejarah/pendirian SmartHomeCare..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Visi & Misi</label>
              <textarea
                rows={3}
                value={visiMisi}
                onChange={(e) => setVisiMisi(e.target.value)}
                placeholder="Tulis visi dan misi perusahaan..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Cara Kerja</label>
              <textarea
                rows={3}
                value={caraKerja}
                onChange={(e) => setCaraKerja(e.target.value)}
                placeholder="Contoh: 1. Pesan via Web, 2. Nakes Datang..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Wilayah Layanan</label>
              <textarea
                rows={3}
                value={wilayahLayanan}
                onChange={(e) => setWilayahLayanan(e.target.value)}
                placeholder="Contoh: Jakarta, Bogor, Depok, Tangerang, Bekasi..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Komitmen</label>
              <textarea
                rows={3}
                value={komitmen}
                onChange={(e) => setKomitmen(e.target.value)}
                placeholder="Tulis komitmen pelayanan kepada pasien..."
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all resize-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="flex items-center justify-center px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            {saving ? <FaSpinner className="animate-spin mr-2" /> : <FaSave className="mr-2" />}
            Simpan Konten Tentang Kami
          </button>
        </form>
      )}
    </div>
  );
}

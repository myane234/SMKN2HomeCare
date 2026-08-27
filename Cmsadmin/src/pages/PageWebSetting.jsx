import React, { useState, useEffect } from 'react';
import { 
  FaCogs, 
  FaImage, 
  FaSave, 
  FaInfoCircle, 
  FaSearch, 
  FaCheckCircle, 
  FaExclamationTriangle, 
  FaTimes, 
  FaPlus, 
  FaTrash, 
  FaGlobe, 
  FaPhone, 
  FaWhatsapp, 
  FaEnvelope, 
  FaMapMarkerAlt, 
  FaShareAlt,
  FaPowerOff
} from 'react-icons/fa';
import { URL } from '../utils/getUrl';
import { getAuthHeaders } from '../utils/auth';
import { resolveImageUrl } from '../utils/resolveImage';

export default function PageWebSetting() {
  const [activeTab, setActiveTab] = useState('global');

  // State Global Config
  const [globalConfig, setGlobalConfig] = useState({
    app_name: '',
    app_logo: '',
    app_favicon: '',
    whatsapp_number: '',
    phone_number: '',
    email: '',
    address: '',
    socials: [],
    maintenance_mode: false
  });

  // State SEO Config
  const [seoConfig, setSeoConfig] = useState({
    meta_title: '',
    meta_description: '',
    meta_keywords: ''
  });

  // Files & Previews
  const [logoFile, setLogoFile] = useState(null);
  const [faviconFile, setFaviconFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [faviconPreview, setFaviconPreview] = useState(null);

  // Loaders
  const [loadingGlobal, setLoadingGlobal] = useState(true);
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [loadingSeo, setLoadingSeo] = useState(true);
  const [savingSeo, setSavingSeo] = useState(false);

  // Toast State
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch Global Config & SEO Config on mount
  useEffect(() => {
    fetchGlobalConfig();
    fetchSeoConfig();
  }, []);

  const fetchGlobalConfig = async () => {
    try {
      setLoadingGlobal(true);
      
      // Fetch web-setting for logo & favicon
      let webSettingLogo = '';
      let webSettingFavicon = '';
      try {
        const wsRes = await fetch(`${URL}/web-setting`);
        const wsBody = await wsRes.json();
        if (wsRes.ok && wsBody.success && wsBody.data) {
          webSettingLogo = wsBody.data.app_logo || '';
          webSettingFavicon = wsBody.data.app_favicon || '';
        }
      } catch (err) {
        console.warn('Gagal memuat /web-setting:', err);
      }

      const res = await fetch(`${URL}/global-config`, {
        headers: getAuthHeaders()
      });
      const body = await res.json();
      if (res.ok && body.success && body.data) {
        setGlobalConfig({
          app_name: body.data.app_name || '',
          app_logo: webSettingLogo || body.data.app_logo || '',
          app_favicon: webSettingFavicon || body.data.app_favicon || '',
          whatsapp_number: body.data.whatsapp_number || '',
          phone_number: body.data.phone_number || '',
          email: body.data.email || '',
          address: body.data.address || '',
          socials: Array.isArray(body.data.socials) ? body.data.socials : [],
          maintenance_mode: Boolean(body.data.maintenance_mode)
        });
      } else if (webSettingLogo || webSettingFavicon) {
        setGlobalConfig(prev => ({
          ...prev,
          app_logo: webSettingLogo || prev.app_logo,
          app_favicon: webSettingFavicon || prev.app_favicon
        }));
      }
    } catch (err) {
      console.error('Gagal memuat global config:', err);
    } finally {
      setLoadingGlobal(false);
    }
  };

  const fetchSeoConfig = async () => {
    try {
      setLoadingSeo(true);
      const res = await fetch(`${URL}/seo-config`, {
        headers: getAuthHeaders()
      });
      const body = await res.json();
      if (res.ok && body.success && body.data) {
        setSeoConfig({
          meta_title: body.data.meta_title || '',
          meta_description: body.data.meta_description || '',
          meta_keywords: body.data.meta_keywords || ''
        });
      }
    } catch (err) {
      console.error('Gagal memuat SEO config:', err);
    } finally {
      setLoadingSeo(false);
    }
  };

  // File Handlers
  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleFaviconChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setFaviconFile(file);
      setFaviconPreview(URL.createObjectURL(file));
    }
  };

  // Social Media Handlers
  const handleAddSocial = () => {
    setGlobalConfig(prev => ({
      ...prev,
      socials: [...prev.socials, { name: '', icon: 'fa-globe', url: '', text: '' }]
    }));
  };

  const handleRemoveSocial = (index) => {
    setGlobalConfig(prev => ({
      ...prev,
      socials: prev.socials.filter((_, idx) => idx !== index)
    }));
  };

  const handleSocialChange = (index, field, value) => {
    setGlobalConfig(prev => {
      const updated = [...prev.socials];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, socials: updated };
    });
  };

  // Save Global Config
  const handleSaveGlobal = async (e) => {
    e.preventDefault();
    try {
      setSavingGlobal(true);

      // Submit web-setting endpoint if logo or favicon files present
      if (logoFile || faviconFile) {
        const wsFormData = new FormData();
        if (logoFile) wsFormData.append('app_logo', logoFile);
        if (faviconFile) wsFormData.append('app_favicon', faviconFile);

        try {
          const wsRes = await fetch(`${URL}/web-setting`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: wsFormData
          });
          const wsBody = await wsRes.json();
          if (wsRes.ok && wsBody.success && wsBody.data) {
            setGlobalConfig(prev => ({
              ...prev,
              app_logo: wsBody.data.app_logo || prev.app_logo,
              app_favicon: wsBody.data.app_favicon || prev.app_favicon
            }));
          }
        } catch (wsErr) {
          console.error('Error saving web-setting:', wsErr);
        }
      }

      const formData = new FormData();
      formData.append('app_name', globalConfig.app_name || '');
      if (logoFile) formData.append('app_logo', logoFile);
      if (faviconFile) formData.append('app_favicon', faviconFile);
      formData.append('whatsapp_number', globalConfig.whatsapp_number || '');
      formData.append('phone_number', globalConfig.phone_number || '');
      formData.append('email', globalConfig.email || '');
      formData.append('address', globalConfig.address || '');
      formData.append('maintenance_mode', globalConfig.maintenance_mode ? '1' : '0');
      formData.append('socials', JSON.stringify(globalConfig.socials || []));

      const res = await fetch(`${URL}/global-config`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: formData
      });

      const body = await res.json();
      if (res.ok && body.success) {
        showToast('success', body.message || 'Konfigurasi global berhasil diperbarui');
        if (body.data) {
          setGlobalConfig(prev => ({
            ...prev,
            app_name: body.data.app_name || prev.app_name,
            app_logo: body.data.app_logo || prev.app_logo,
            app_favicon: body.data.app_favicon || prev.app_favicon,
            whatsapp_number: body.data.whatsapp_number || prev.whatsapp_number,
            phone_number: body.data.phone_number || prev.phone_number,
            email: body.data.email || prev.email,
            address: body.data.address || prev.address,
            socials: Array.isArray(body.data.socials) ? body.data.socials : prev.socials,
            maintenance_mode: Boolean(body.data.maintenance_mode)
          }));
        }
        setLogoFile(null);
        setFaviconFile(null);
        setLogoPreview(null);
        setFaviconPreview(null);
      } else {
        showToast('error', body.message || 'Gagal menyimpan konfigurasi global');
      }
    } catch (err) {
      console.error('Error saving global config:', err);
      showToast('error', 'Terjadi kesalahan saat menyimpan konfigurasi global');
    } finally {
      setSavingGlobal(false);
    }
  };

  // Save SEO Config
  const handleSaveSeo = async (e) => {
    e.preventDefault();
    try {
      setSavingSeo(true);
      const res = await fetch(`${URL}/seo-config`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(seoConfig)
      });

      const body = await res.json();
      if (res.ok && body.success) {
        showToast('success', body.message || 'Konfigurasi SEO berhasil diperbarui');
        if (body.data) {
          setSeoConfig({
            meta_title: body.data.meta_title || '',
            meta_description: body.data.meta_description || '',
            meta_keywords: body.data.meta_keywords || ''
          });
        }
      } else {
        showToast('error', body.message || 'Gagal menyimpan konfigurasi SEO');
      }
    } catch (err) {
      console.error('Error saving SEO config:', err);
      showToast('error', 'Terjadi kesalahan saat menyimpan konfigurasi SEO');
    } finally {
      setSavingSeo(false);
    }
  };

  const logoDisplaySrc = logoPreview || resolveImageUrl(globalConfig.app_logo);
  const faviconDisplaySrc = faviconPreview || resolveImageUrl(globalConfig.app_favicon);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-semibold transition-all animate-bounce ${
          toast.type === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-800'
            : 'bg-emerald-50 border-emerald-200 text-emerald-800'
        }`}>
          {toast.type === 'error' ? <FaExclamationTriangle className="text-rose-500 text-lg shrink-0" /> : <FaCheckCircle className="text-emerald-500 text-lg shrink-0" />}
          <span>{toast.message}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-slate-400 hover:text-slate-600">
            <FaTimes />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <FaCogs className="text-primary" /> Web & SEO Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pengaturan identitas website, informasi kontak global, media sosial, serta optimasi SEO
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('global')}
          className={`px-5 py-3 font-semibold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'global'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FaCogs /> Konfigurasi Global & Identitas
        </button>
        <button
          onClick={() => setActiveTab('seo')}
          className={`px-5 py-3 font-semibold text-xs sm:text-sm border-b-2 transition-all flex items-center gap-2 ${
            activeTab === 'seo'
              ? 'border-primary text-primary font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <FaSearch /> Konfigurasi SEO
        </button>
      </div>

      {/* TAB 1: KONFIGURASI GLOBAL */}
      {activeTab === 'global' && (
        <form onSubmit={handleSaveGlobal} className="space-y-6">
          {/* Card 1: Logo & Favicon */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 lg:p-8 shadow-xs space-y-6">
            <h2 className="text-base font-semibold text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-2">
              <FaImage className="text-primary" /> Identitas Visual (Logo & Favicon)
            </h2>

            {loadingGlobal ? (
              <div className="text-center py-8 text-xs text-slate-400">Memuat data logo & favicon...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Logo Web */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                  <label className="text-sm font-semibold text-slate-800 block">Logo Web Utama</label>
                  <p className="text-xs text-slate-500">Format: PNG, SVG, WEBP (Latar transparan disarankan)</p>

                  <div className="w-full h-36 rounded-xl border-2 border-dashed border-slate-200 bg-white flex flex-col items-center justify-center p-2 relative overflow-hidden">
                    {logoDisplaySrc ? (
                      <img src={logoDisplaySrc} alt="Logo App" className="max-h-full max-w-full object-contain" />
                    ) : (
                      <div className="flex flex-col items-center text-slate-400">
                        <FaImage size={32} />
                        <span className="text-xs mt-2">Belum ada logo diunggah</span>
                      </div>
                    )}
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-light file:text-primary-dark cursor-pointer w-full"
                  />
                </div>

                {/* Favicon Web */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
                  <label className="text-sm font-semibold text-slate-800 block">Icon Web (Favicon)</label>
                  <p className="text-xs text-slate-500">Format: ICO, PNG (Ukuran disarankan: 32x32px)</p>

                  <div className="w-full h-36 rounded-xl border-2 border-dashed border-slate-200 bg-white flex flex-col items-center justify-center p-2 relative overflow-hidden">
                    {faviconDisplaySrc ? (
                      <img src={faviconDisplaySrc} alt="Favicon App" className="h-12 w-12 object-contain" />
                    ) : (
                      <div className="flex flex-col items-center text-slate-400">
                        <FaImage size={32} />
                        <span className="text-xs mt-2">Belum ada favicon diunggah</span>
                      </div>
                    )}
                  </div>

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFaviconChange}
                    className="text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary-light file:text-primary-dark cursor-pointer w-full"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Informasi Kontak & Operasional */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 lg:p-8 shadow-xs space-y-6">
            <h2 className="text-base font-semibold text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-2">
              <FaGlobe className="text-primary" /> Informasi Aplikasi & Kontak Global
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Nama Aplikasi</label>
                <input
                  type="text"
                  value={globalConfig.app_name}
                  onChange={(e) => setGlobalConfig({ ...globalConfig, app_name: e.target.value })}
                  placeholder="Contoh: Smart Home Care"
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label flex items-center gap-1.5">
                  <FaWhatsapp className="text-emerald-600" /> Nomor WhatsApp
                </label>
                <input
                  type="text"
                  value={globalConfig.whatsapp_number}
                  onChange={(e) => setGlobalConfig({ ...globalConfig, whatsapp_number: e.target.value })}
                  placeholder="Contoh: 6281234567890"
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label flex items-center gap-1.5">
                  <FaPhone className="text-blue-600" /> Nomor Telepon Kantor
                </label>
                <input
                  type="text"
                  value={globalConfig.phone_number}
                  onChange={(e) => setGlobalConfig({ ...globalConfig, phone_number: e.target.value })}
                  placeholder="Contoh: 0211234567"
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label flex items-center gap-1.5">
                  <FaEnvelope className="text-rose-600" /> Alamat Email Resmi
                </label>
                <input
                  type="email"
                  value={globalConfig.email}
                  onChange={(e) => setGlobalConfig({ ...globalConfig, email: e.target.value })}
                  placeholder="Contoh: info@smarthomecare.com"
                  className="form-input"
                />
              </div>

              <div className="md:col-span-2">
                <label className="form-label flex items-center gap-1.5">
                  <FaMapMarkerAlt className="text-amber-600" /> Alamat Kantor Fisik
                </label>
                <textarea
                  rows={3}
                  value={globalConfig.address}
                  onChange={(e) => setGlobalConfig({ ...globalConfig, address: e.target.value })}
                  placeholder="Contoh: Jl. Kesehatan No. 123, Jakarta Selatan"
                  className="form-input resize-y"
                />
              </div>

              <div className="md:col-span-2 pt-2">
                <label className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={globalConfig.maintenance_mode}
                    onChange={(e) => setGlobalConfig({ ...globalConfig, maintenance_mode: e.target.checked })}
                    className="w-5 h-5 text-primary rounded border-slate-300 focus:ring-primary"
                  />
                  <div>
                    <span className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <FaPowerOff className={globalConfig.maintenance_mode ? "text-rose-600" : "text-slate-400"} />
                      Mode Perawatan Website (Maintenance Mode)
                    </span>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Aktifkan centang ini jika aplikasi sedang dalam pemeliharaan sistem.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Card 3: Media Sosial Global */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 lg:p-8 shadow-xs space-y-6">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                <FaShareAlt className="text-primary" /> Tautan Media Sosial Global
              </h2>
              <button
                type="button"
                onClick={handleAddSocial}
                className="btn-secondary text-xs flex items-center gap-1.5 px-3 py-1.5"
              >
                <FaPlus /> Tambah Sosial Media
              </button>
            </div>

            {globalConfig.socials.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Belum ada tautan media sosial yang ditambahkan.</p>
            ) : (
              <div className="space-y-3">
                {globalConfig.socials.map((soc, idx) => (
                  <div key={idx} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50">
                    <input
                      type="text"
                      placeholder="Nama Platform (e.g. Facebook)"
                      value={soc.name || ''}
                      onChange={(e) => handleSocialChange(idx, 'name', e.target.value)}
                      className="form-input text-xs flex-1"
                    />
                    <input
                      type="text"
                      placeholder="Icon Class (e.g. fa-facebook)"
                      value={soc.icon || ''}
                      onChange={(e) => handleSocialChange(idx, 'icon', e.target.value)}
                      className="form-input text-xs w-full sm:w-36"
                    />
                    <input
                      type="text"
                      placeholder="URL Tautan (e.g. https://facebook.com/homecare)"
                      value={soc.url || ''}
                      onChange={(e) => handleSocialChange(idx, 'url', e.target.value)}
                      className="form-input text-xs flex-2"
                    />
                    <input
                      type="text"
                      placeholder="Teks Display (e.g. @smarthomecare)"
                      value={soc.text || ''}
                      onChange={(e) => handleSocialChange(idx, 'text', e.target.value)}
                      className="form-input text-xs w-full sm:w-36"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveSocial(idx)}
                      className="p-2.5 text-rose-600 hover:bg-rose-50 rounded-xl transition"
                      title="Hapus"
                    >
                      <FaTrash />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={savingGlobal}
              className="btn-primary flex items-center justify-center gap-2 px-8 py-3 shadow-md active:scale-95 transition"
            >
              <FaSave /> {savingGlobal ? 'Menyimpan...' : 'Simpan Konfigurasi Global'}
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: KONFIGURASI SEO */}
      {activeTab === 'seo' && (
        <form onSubmit={handleSaveSeo} className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 lg:p-8 shadow-xs space-y-6">
            <h2 className="text-base font-semibold text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-2">
              <FaSearch className="text-primary" /> Pengaturan Optimasi Mesin Pencari (SEO)
            </h2>

            {loadingSeo ? (
              <div className="text-center py-8 text-xs text-slate-400">Memuat data SEO...</div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="form-label">Meta Title (Judul Halaman)</label>
                  <input
                    type="text"
                    value={seoConfig.meta_title}
                    onChange={(e) => setSeoConfig({ ...seoConfig, meta_title: e.target.value })}
                    placeholder="Contoh: Smart Home Care - Layanan Kesehatan Home Care Terpercaya"
                    className="form-input"
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Judul yang muncul di hasil pencarian Google & tab browser.</p>
                </div>

                <div>
                  <label className="form-label">Meta Description (Deskripsi Halaman)</label>
                  <textarea
                    rows={4}
                    value={seoConfig.meta_description}
                    onChange={(e) => setSeoConfig({ ...seoConfig, meta_description: e.target.value })}
                    placeholder="Contoh: Kami menyediakan layanan kesehatan home care profesional langsung ke rumah Anda."
                    className="form-input resize-y"
                    required
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Ringkasan singkat isi website untuk mesin pencari (disarankan 150-160 karakter).</p>
                </div>

                <div>
                  <label className="form-label">Meta Keywords (Kata Kunci)</label>
                  <input
                    type="text"
                    value={seoConfig.meta_keywords}
                    onChange={(e) => setSeoConfig({ ...seoConfig, meta_keywords: e.target.value })}
                    placeholder="Contoh: homecare, kesehatan, perawat, dokter, fisioterapi"
                    className="form-input"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Pisahkan kata kunci dengan koma (`,`).</p>
                </div>
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={savingSeo}
                className="btn-primary flex items-center justify-center gap-2 px-8 py-3 shadow-md active:scale-95 transition"
              >
                <FaSave /> {savingSeo ? 'Menyimpan...' : 'Simpan Konfigurasi SEO'}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

import { useEffect, useState } from 'react';
import { getFooterContent, updateFooterContent } from '../data/contentData';
import { FaGlobe, FaSave, FaSpinner, FaPlus, FaTrash } from 'react-icons/fa';

export default function PageKelolaKontenFooter() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Footer Form States
  const [footerDescription, setFooterDescription] = useState('');
  const [footerPhone, setFooterPhone] = useState('');
  const [footerEmail, setFooterEmail] = useState('');
  const [footerAddress, setFooterAddress] = useState('');
  const [footerSocials, setFooterSocials] = useState([]);
  const [footerLinks, setFooterLinks] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const res = await getFooterContent();
      const f = res.data || res;
      if (f) {
        setFooterDescription(f.footer_description || '');
        setFooterPhone(f.footer_phone || '');
        setFooterEmail(f.footer_email || '');
        setFooterAddress(f.footer_address || '');
        setFooterSocials(Array.isArray(f.footer_socials) ? f.footer_socials : []);
        setFooterLinks(Array.isArray(f.footer_links) ? f.footer_links : []);
      }
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Gagal memuat konten Footer' });
    } finally {
      setLoading(false);
    }
  }

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
        footer_links: footerLinks,
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

  const handleAddLinkGroup = () => {
    setFooterLinks([...footerLinks, { title: 'Kelompok Menu Baru', links: [{ label: 'Nama Menu', url: '/' }] }]);
  };

  const handleRemoveLinkGroup = (groupIndex) => {
    setFooterLinks(footerLinks.filter((_, i) => i !== groupIndex));
  };

  const handleGroupTitleChange = (groupIndex, value) => {
    const updated = [...footerLinks];
    updated[groupIndex] = { ...updated[groupIndex], title: value };
    setFooterLinks(updated);
  };

  const handleAddLinkToGroup = (groupIndex) => {
    const updated = [...footerLinks];
    const groupLinks = Array.isArray(updated[groupIndex].links) ? updated[groupIndex].links : [];
    updated[groupIndex] = {
      ...updated[groupIndex],
      links: [...groupLinks, { label: '', url: '' }]
    };
    setFooterLinks(updated);
  };

  const handleRemoveLinkFromGroup = (groupIndex, linkIndex) => {
    const updated = [...footerLinks];
    updated[groupIndex] = {
      ...updated[groupIndex],
      links: updated[groupIndex].links.filter((_, i) => i !== linkIndex)
    };
    setFooterLinks(updated);
  };

  const handleLinkItemChange = (groupIndex, linkIndex, field, value) => {
    const updated = [...footerLinks];
    const groupLinks = [...(updated[groupIndex].links || [])];
    groupLinks[linkIndex] = { ...groupLinks[linkIndex], [field]: value };
    updated[groupIndex] = { ...updated[groupIndex], links: groupLinks };
    setFooterLinks(updated);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <FaSpinner className="animate-spin text-3xl text-primary" />
        <span className="ml-3 text-slate-600 font-medium">Memuat konten Footer...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <FaGlobe className="text-primary" /> Footer
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Pengaturan informasi kontak, alamat kantor, deskripsi singkat, tautan medsos, dan kelompok menu footer</p>
        </div>
      </div>

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

      <form onSubmit={handleFooterSubmit} className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 lg:p-8 shadow-xs space-y-6">
        <h2 className="text-base font-semibold text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-2">
          <FaGlobe className="text-primary" /> Form Konten Footer Web
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

        {/* Dynamic Link Groups Editor */}
        <div className="p-4 sm:p-6 rounded-xl border border-slate-200 bg-slate-50/60 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
            <div>
              <span className="font-semibold text-slate-800 text-sm">Kelompok Tautan Menu Footer (footer_links)</span>
              <p className="text-xs text-slate-500">Kelola kelompok tautan menu kolom footer secara dinamis</p>
            </div>
            <button
              type="button"
              onClick={handleAddLinkGroup}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-700 transition shadow-sm"
            >
              <FaPlus size={12} /> Tambah Kelompok Menu
            </button>
          </div>

          {footerLinks.length === 0 ? (
            <p className="text-sm text-slate-400 italic py-2">Belum ada kelompok menu footer ditambahkan.</p>
          ) : (
            <div className="space-y-4">
              {footerLinks.map((group, groupIdx) => (
                <div key={groupIdx} className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2">
                    <input
                      type="text"
                      value={group.title || ''}
                      onChange={(e) => handleGroupTitleChange(groupIdx, e.target.value)}
                      placeholder="Judul Kelompok Menu (misal: Layanan Kami)"
                      className="form-input font-bold text-xs max-w-sm"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleAddLinkToGroup(groupIdx)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-sky-700 bg-sky-50 rounded-md border border-sky-200 hover:bg-sky-100 transition"
                      >
                        + Sub Link
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveLinkGroup(groupIdx)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition"
                        title="Hapus Kelompok Ini"
                      >
                        <FaTrash size={13} />
                      </button>
                    </div>
                  </div>

                  <div className="pl-3 space-y-2">
                    {(group.links || []).map((linkItem, linkIdx) => (
                      <div key={linkIdx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={linkItem.label || ''}
                          onChange={(e) => handleLinkItemChange(groupIdx, linkIdx, 'label', e.target.value)}
                          placeholder="Label (misal: Perawat Lansia)"
                          className="form-input text-xs flex-1"
                        />
                        <input
                          type="text"
                          value={linkItem.url || ''}
                          onChange={(e) => handleLinkItemChange(groupIdx, linkIdx, 'url', e.target.value)}
                          placeholder="URL (misal: /layanan/perawat-lansia)"
                          className="form-input text-xs flex-1"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveLinkFromGroup(groupIdx, linkIdx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Social Media Links Editor */}
        <div className="p-4 sm:p-6 rounded-xl border border-slate-200 bg-slate-50/60 space-y-4">
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
                    className="mt-2 sm:mt-5 p-2 text-danger hover:bg-danger-bg rounded-lg transition self-end sm:self-center"
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
    </div>
  );
}

import { useState, useEffect } from 'react';
import { URL } from '../utils/getUrl';
import { getAuthHeaders } from '../utils/auth';
import { ALL_CMS_PAGES, DEFAULT_TIER_PERMISSIONS } from '../utils/role';
import { FaShieldAlt, FaPlus, FaEdit, FaTrash, FaCheckSquare, FaSquare, FaSync, FaLock } from 'react-icons/fa';

export default function KelolaTierAdmin() {
  const [tiers, setTiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    nama_tier: '',
    description: '',
    permissions: [],
  });

  useEffect(() => {
    fetchTiers();
  }, []);

  async function fetchTiers() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${URL}/manage-admin/tiers`, {
        method: 'GET',
        headers: getAuthHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' }),
      });
      const json = await res.json();

      let tierData = [];
      if (res.ok && json.data && Array.isArray(json.data) && json.data.length > 0) {
        tierData = json.data;
      } else {
        // Fallback default tiers
        tierData = [
          {
            id: 1,
            nama_tier: 'Super Admin',
            description: 'Akses penuh ke seluruh halaman dan fitur CMS',
            permissions: ['*'],
            is_default: true,
          },
          {
            id: 2,
            nama_tier: 'Admin',
            description: 'Akses khusus pengelolaan Layanan, Promo, Artikel, dan Dashboard',
            permissions: DEFAULT_TIER_PERMISSIONS['Admin'],
            is_default: true,
          },
          {
            id: 3,
            nama_tier: 'Editor',
            description: 'Akses khusus manajemen Layanan, Artikel, dan Kategori Artikel',
            permissions: DEFAULT_TIER_PERMISSIONS['Editor'],
            is_default: true,
          },
        ];
      }

      setTiers(tierData);

      // Save custom tiers map into localStorage for instant client-side role lookup
      try {
        const tiersObj = {};
        tierData.forEach((t) => {
          tiersObj[t.nama_tier] = t.permissions;
        });
        localStorage.setItem('cms_custom_tiers', JSON.stringify(tiersObj));
      } catch {}
    } catch {
      // Graceful fallback to default tiers
      setTiers([
        {
          id: 1,
          nama_tier: 'Super Admin',
          description: 'Akses penuh ke seluruh halaman dan fitur CMS',
          permissions: ['*'],
          is_default: true,
        },
        {
          id: 2,
          nama_tier: 'Admin',
          description: 'Akses manajemen konten dan master data standar',
          permissions: DEFAULT_TIER_PERMISSIONS['Admin'],
          is_default: true,
        },
        {
          id: 3,
          nama_tier: 'Editor',
          description: 'Akses khusus manajemen Layanan, Artikel, dan Kategori Artikel',
          permissions: DEFAULT_TIER_PERMISSIONS['Editor'],
          is_default: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenAddModal() {
    setFormData({
      nama_tier: '',
      description: '',
      permissions: ['/dashboard', '/layanan', '/artikel'],
    });
    setShowAddModal(true);
  }

  function handleOpenEditModal(tier) {
    setSelectedTier(tier);
    setFormData({
      nama_tier: tier.nama_tier || '',
      description: tier.description || '',
      permissions: Array.isArray(tier.permissions) ? tier.permissions : [],
    });
    setShowEditModal(true);
  }

  function togglePermission(pageId) {
    setFormData((prev) => {
      const current = prev.permissions.includes('*')
        ? ALL_CMS_PAGES.map((p) => p.id)
        : [...prev.permissions];

      if (current.includes(pageId)) {
        return { ...prev, permissions: current.filter((id) => id !== pageId) };
      } else {
        return { ...prev, permissions: [...current, pageId] };
      }
    });
  }

  function selectAllPermissions() {
    setFormData((prev) => ({
      ...prev,
      permissions: ALL_CMS_PAGES.map((p) => p.id),
    }));
  }

  function clearAllPermissions() {
    setFormData((prev) => ({
      ...prev,
      permissions: [],
    }));
  }

  async function handleAddTier(e) {
    e.preventDefault();
    if (!formData.nama_tier.trim()) {
      alert('Mohon isi nama tier admin');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${URL}/manage-admin/tiers`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' }),
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (res.ok && (json.success || json.data)) {
        alert('Tier Admin baru berhasil dibuat!');
        setShowAddModal(false);
        fetchTiers();
      } else {
        alert(json.message || 'Gagal membuat tier admin');
      }
    } catch (err) {
      alert('Gagal menghubungi server: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateTier(e) {
    e.preventDefault();
    if (!selectedTier) return;

    setSubmitting(true);
    const id = selectedTier.id || selectedTier.nama_tier;

    try {
      const res = await fetch(`${URL}/manage-admin/tiers/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' }),
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (res.ok && (json.success || json.data)) {
        alert('Tier Admin berhasil diperbarui!');
        setShowEditModal(false);
        setSelectedTier(null);
        fetchTiers();
      } else {
        alert(json.message || 'Gagal memperbarui tier admin');
      }
    } catch (err) {
      alert('Gagal menghubungi server: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteTier(tier) {
    if (tier.is_default || ['Super Admin', 'Admin', 'Editor'].includes(tier.nama_tier)) {
      alert('Tier bawaan sistem tidak dapat dihapus.');
      return;
    }

    if (!window.confirm(`Yakin ingin menghapus tier "${tier.nama_tier}"?`)) return;

    const id = tier.id || tier.nama_tier;
    try {
      const res = await fetch(`${URL}/manage-admin/tiers/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' }),
      });

      const json = await res.json();
      if (res.ok && json.success) {
        fetchTiers();
      } else {
        alert(json.message || 'Gagal menghapus tier admin');
      }
    } catch (err) {
      alert('Gagal menghubungi server: ' + err.message);
    }
  }

  // Group pages by category for clean UI in modal
  const pageCategories = ALL_CMS_PAGES.reduce((acc, page) => {
    acc[page.category] = acc[page.category] || [];
    acc[page.category].push(page);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FaShieldAlt className="text-primary" /> Kelola Tier Admin
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Konfigurasi tingkatan akses admin dan atur hak akses tampilan (view permissions)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchTiers}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium shadow-sm"
          >
            <FaSync className={loading ? 'animate-spin' : ''} /> Refres
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl transition-all text-sm font-semibold shadow-md shadow-primary/20"
          >
            <FaPlus /> Tambah Tier Baru
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Grid of Tier Cards */}
      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-500 shadow-sm border border-slate-200">
          <FaSync className="animate-spin text-2xl text-primary mx-auto mb-2" />
          <p className="text-sm">Memuat data tier admin...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tiers.map((tier) => {
            const isSuper = tier.nama_tier === 'Super Admin';
            const isAll = tier.permissions?.includes('*') || isSuper;
            const allowedCount = isAll ? ALL_CMS_PAGES.length : (tier.permissions?.length || 0);

            return (
              <div
                key={tier.id || tier.nama_tier}
                className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
              >
                {isSuper && (
                  <div className="absolute top-0 right-0 bg-amber-500 text-white text-[10px] uppercase font-extrabold px-3 py-1 rounded-bl-xl tracking-wider">
                    Full Access
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-lg ${
                        isSuper
                          ? 'bg-amber-100 text-amber-700'
                          : tier.nama_tier === 'Editor'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      <FaShieldAlt />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-base">{tier.nama_tier}</h3>
                      <span className="text-xs font-semibold text-slate-400">
                        {allowedCount} / {ALL_CMS_PAGES.length} Halaman Diizinkan
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 mb-4 min-h-[36px] line-clamp-2">
                    {tier.description || 'Tidak ada deskripsi tier.'}
                  </p>

                  <div className="border-t border-slate-100 pt-3">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      Ringkasan Tampilan Halaman:
                    </p>
                    {isAll ? (
                      <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-lg">
                        Semua Halaman (Super Admin)
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                        {ALL_CMS_PAGES.filter((p) => tier.permissions?.includes(p.id)).map((p) => (
                          <span
                            key={p.id}
                            className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[11px] font-medium rounded-md"
                          >
                            {p.label}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  {tier.is_default ? (
                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                      <FaLock className="text-[10px]" /> Tier Bawaan
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-primary">Custom Tier</span>
                  )}

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenEditModal(tier)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-primary/10 hover:text-primary text-slate-700 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                    >
                      <FaEdit /> Atur Views
                    </button>
                    {!tier.is_default && !['Super Admin', 'Admin', 'Editor'].includes(tier.nama_tier) && (
                      <button
                        onClick={() => handleDeleteTier(tier)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus Tier"
                      >
                        <FaTrash className="text-xs" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Tambah Tier */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <FaPlus className="text-primary" /> Tambah Tier Admin Baru
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddTier} className="p-6 overflow-y-auto space-y-5 flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Tier Admin</label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Manager, Content Creator"
                  value={formData.nama_tier}
                  onChange={(e) => setFormData({ ...formData, nama_tier: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Deskripsi</label>
                <textarea
                  rows="2"
                  placeholder="Penjelasan singkat tugas & akses tier admin ini"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Atur Hak Akses Halaman (Permissions):
                  </label>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={selectAllPermissions}
                      className="text-primary hover:underline font-semibold"
                    >
                      Pilih Semua
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={clearAllPermissions}
                      className="text-slate-500 hover:underline font-medium"
                    >
                      Hapus Semua
                    </button>
                  </div>
                </div>

                <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  {Object.entries(pageCategories).map(([category, pages]) => (
                    <div key={category} className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{category}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {pages.map((page) => {
                          const isChecked = formData.permissions.includes('*') || formData.permissions.includes(page.id);
                          return (
                            <div
                              key={page.id}
                              onClick={() => togglePermission(page.id)}
                              className={`flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all border ${
                                isChecked
                                  ? 'bg-white border-primary/40 shadow-sm text-slate-800'
                                  : 'bg-white/60 border-slate-200 text-slate-500 hover:bg-white'
                              }`}
                            >
                              {isChecked ? (
                                <FaCheckSquare className="text-primary text-base shrink-0" />
                              ) : (
                                <FaSquare className="text-slate-300 text-base shrink-0" />
                              )}
                              <span className="text-xs font-medium">{page.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-md shadow-primary/20 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Menyimpan...' : 'Simpan Tier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Tier / Atur Views */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <FaEdit className="text-primary" /> Edit Permissions - {selectedTier?.nama_tier}
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUpdateTier} className="p-6 overflow-y-auto space-y-5 flex-1">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Tier Admin</label>
                <input
                  type="text"
                  required
                  disabled={selectedTier?.is_default}
                  value={formData.nama_tier}
                  onChange={(e) => setFormData({ ...formData, nama_tier: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Deskripsi</label>
                <textarea
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Atur Halaman Yang Diizinkan (Views):
                  </label>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={selectAllPermissions}
                      className="text-primary hover:underline font-semibold"
                    >
                      Pilih Semua
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={clearAllPermissions}
                      className="text-slate-500 hover:underline font-medium"
                    >
                      Hapus Semua
                    </button>
                  </div>
                </div>

                <div className="space-y-4 bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  {Object.entries(pageCategories).map(([category, pages]) => (
                    <div key={category} className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{category}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {pages.map((page) => {
                          const isChecked = formData.permissions.includes('*') || formData.permissions.includes(page.id);
                          return (
                            <div
                              key={page.id}
                              onClick={() => togglePermission(page.id)}
                              className={`flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all border ${
                                isChecked
                                  ? 'bg-white border-primary/40 shadow-sm text-slate-800'
                                  : 'bg-white/60 border-slate-200 text-slate-500 hover:bg-white'
                              }`}
                            >
                              {isChecked ? (
                                <FaCheckSquare className="text-primary text-base shrink-0" />
                              ) : (
                                <FaSquare className="text-slate-300 text-base shrink-0" />
                              )}
                              <span className="text-xs font-medium">{page.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-semibold text-white bg-primary hover:bg-primary-dark rounded-xl shadow-md shadow-primary/20 transition-all disabled:opacity-50"
                >
                  {submitting ? 'Memperbarui...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { URL } from '../utils/getUrl';
import { getAuthHeaders } from '../utils/auth';
import { ALL_CMS_VIEWS, DEFAULT_TIER_PERMISSIONS } from '../utils/role';
import { FaShieldAlt, FaPlus, FaEdit, FaTrash, FaCheckSquare, FaSquare, FaSync, FaLock, FaTag } from 'react-icons/fa';

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
    slug: '',
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
        // Fallback default tiers if backend has no data yet
        tierData = [
          {
            id_admin_tier: 1,
            nama_tier: 'Super Admin',
            slug: 'super-admin',
            deskripsi: 'Akses penuh ke seluruh halaman dan fitur CMS',
            permissions: ['*'],
            is_protected: true,
          },
          {
            id_admin_tier: 2,
            nama_tier: 'Admin',
            slug: 'admin',
            deskripsi: 'Akses pengelolaan Layanan, Promo, Artikel, dan Konten Web',
            permissions: DEFAULT_TIER_PERMISSIONS['Admin'],
            is_protected: true,
          },
          {
            id_admin_tier: 3,
            nama_tier: 'Editor',
            slug: 'editor',
            deskripsi: 'Akses manajemen Layanan, Artikel, dan Kategori',
            permissions: DEFAULT_TIER_PERMISSIONS['Editor'],
            is_protected: false,
          },
        ];
      }

      setTiers(tierData);

      // Save custom tiers map into localStorage for instant client-side role lookup
      try {
        const tiersObj = {};
        tierData.forEach((t) => {
          tiersObj[t.slug || t.nama_tier] = t.permissions;
          tiersObj[t.nama_tier] = t.permissions;
        });
        localStorage.setItem('cms_custom_tiers', JSON.stringify(tiersObj));
      } catch {}
    } catch (err) {
      setError('Gagal memuat data tier dari server. Menggunakan data cadangan.');
      setTiers([
        {
          id_admin_tier: 1,
          nama_tier: 'Super Admin',
          slug: 'super-admin',
          deskripsi: 'Akses penuh ke seluruh halaman dan fitur CMS',
          permissions: ['*'],
          is_protected: true,
        },
        {
          id_admin_tier: 2,
          nama_tier: 'Admin',
          slug: 'admin',
          deskripsi: 'Akses manajemen konten dan master data standar',
          permissions: DEFAULT_TIER_PERMISSIONS['Admin'],
          is_protected: true,
        },
        {
          id_admin_tier: 3,
          nama_tier: 'Editor',
          slug: 'editor',
          deskripsi: 'Akses khusus manajemen Layanan, Artikel, dan Kategori',
          permissions: DEFAULT_TIER_PERMISSIONS['Editor'],
          is_protected: false,
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenAddModal() {
    setFormData({
      nama_tier: '',
      slug: '',
      description: '',
      permissions: ['dashboard', 'layanan', 'artikel'],
    });
    setShowAddModal(true);
  }

  function handleOpenEditModal(tier) {
    setSelectedTier(tier);
    setFormData({
      nama_tier: tier.nama_tier || '',
      slug: tier.slug || '',
      description: tier.deskripsi || tier.description || '',
      permissions: Array.isArray(tier.permissions) ? tier.permissions : [],
    });
    setShowEditModal(true);
  }

  function togglePermission(viewSlug) {
    setFormData((prev) => {
      const current = prev.permissions.includes('*')
        ? ALL_CMS_VIEWS.map((v) => v.slug)
        : [...prev.permissions];

      if (current.includes(viewSlug)) {
        return { ...prev, permissions: current.filter((s) => s !== viewSlug) };
      } else {
        return { ...prev, permissions: [...current, viewSlug] };
      }
    });
  }

  function selectAllPermissions() {
    setFormData((prev) => ({
      ...prev,
      permissions: ALL_CMS_VIEWS.map((v) => v.slug),
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
      const payload = {
        nama_tier: formData.nama_tier,
        slug: formData.slug || undefined,
        deskripsi: formData.description,
        permissions: formData.permissions,
      };

      const res = await fetch(`${URL}/manage-admin/tiers`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' }),
        body: JSON.stringify(payload),
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
    const id = selectedTier.id_admin_tier || selectedTier.id || selectedTier.slug || selectedTier.nama_tier;

    try {
      const payload = {
        nama_tier: formData.nama_tier,
        slug: formData.slug || undefined,
        deskripsi: formData.description,
        permissions: formData.permissions,
      };

      const res = await fetch(`${URL}/manage-admin/tiers/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' }),
        body: JSON.stringify(payload),
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
    if (tier.is_protected || ['super-admin', 'admin'].includes((tier.slug || '').toLowerCase())) {
      alert('Tier bawaan sistem tidak dapat dihapus.');
      return;
    }

    if (!window.confirm(`Yakin ingin menghapus tier "${tier.nama_tier}"?`)) return;

    const id = tier.id_admin_tier || tier.id || tier.slug || tier.nama_tier;
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

  // Group views by category for clean UI in modal
  const viewCategories = ALL_CMS_VIEWS.reduce((acc, view) => {
    acc[view.category] = acc[view.category] || [];
    acc[view.category].push(view);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FaShieldAlt className="text-primary" /> Kelola Tier Admin & Permission Slug
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Atur tingkatan akses admin dan konfigurasi hak akses tampilan (View Permission Slugs)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchTiers}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium shadow-sm"
          >
            <FaSync className={loading ? 'animate-spin' : ''} /> Refresh
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
            const isSuper = tier.nama_tier === 'Super Admin' || tier.slug === 'super-admin';
            const isAll = tier.permissions?.includes('*') || isSuper;
            const allowedCount = isAll ? ALL_CMS_VIEWS.length : (tier.permissions?.length || 0);

            return (
              <div
                key={tier.id_admin_tier || tier.slug || tier.nama_tier}
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
                          : tier.slug === 'editor'
                          ? 'bg-purple-100 text-purple-700'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}
                    >
                      <FaShieldAlt />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                        {tier.nama_tier}
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                          <FaTag className="text-[9px] text-slate-400" /> {tier.slug || 'no-slug'}
                        </span>
                        <span className="text-xs font-semibold text-slate-400">
                          {allowedCount}/{ALL_CMS_VIEWS.length} Views
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 mb-4 min-h-[36px] line-clamp-2">
                    {tier.deskripsi || tier.description || 'Tidak ada deskripsi tier.'}
                  </p>

                  <div className="border-t border-slate-100 pt-3">
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                      View Slugs Permitted:
                    </p>
                    {isAll ? (
                      <span className="inline-block px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-semibold rounded-lg">
                        Semua View Slugs (*)
                      </span>
                    ) : (
                      <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto">
                        {ALL_CMS_VIEWS.filter((v) => tier.permissions?.includes(v.slug)).map((v) => (
                          <span
                            key={v.slug}
                            className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[11px] font-medium rounded-md flex items-center gap-1"
                            title={`Path: ${v.path}`}
                          >
                            <span className="font-mono text-primary text-[10px]">{v.slug}</span>
                            <span className="text-slate-400">({v.label})</span>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                  {tier.is_protected ? (
                    <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                      <FaLock className="text-[10px]" /> Tier Protected
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
                    {!tier.is_protected && !['super-admin', 'admin'].includes((tier.slug || '').toLowerCase()) && (
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Tier Admin</label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Finance Manager"
                    value={formData.nama_tier}
                    onChange={(e) => setFormData({ ...formData, nama_tier: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tier Slug (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Contoh: finance-manager"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono"
                  />
                </div>
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
                    Atur Hak Akses View Slugs (Permissions):
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
                  {Object.entries(viewCategories).map(([category, views]) => (
                    <div key={category} className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{category}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {views.map((view) => {
                          const isChecked = formData.permissions.includes('*') || formData.permissions.includes(view.slug);
                          return (
                            <div
                              key={view.slug}
                              onClick={() => togglePermission(view.slug)}
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
                              <div>
                                <p className="text-xs font-semibold">{view.label}</p>
                                <p className="text-[10px] font-mono text-slate-400">slug: {view.slug}</p>
                              </div>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Tier Admin</label>
                  <input
                    type="text"
                    required
                    disabled={selectedTier?.is_protected}
                    value={formData.nama_tier}
                    onChange={(e) => setFormData({ ...formData, nama_tier: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tier Slug</label>
                  <input
                    type="text"
                    disabled={selectedTier?.is_protected}
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-mono disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>
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
                    Atur View Slugs Yang Diizinkan:
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
                  {Object.entries(viewCategories).map(([category, views]) => (
                    <div key={category} className="space-y-2">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{category}</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {views.map((view) => {
                          const isChecked = formData.permissions.includes('*') || formData.permissions.includes(view.slug);
                          return (
                            <div
                              key={view.slug}
                              onClick={() => togglePermission(view.slug)}
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
                              <div>
                                <p className="text-xs font-semibold">{view.label}</p>
                                <p className="text-[10px] font-mono text-slate-400">slug: {view.slug}</p>
                              </div>
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

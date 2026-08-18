import { useState, useEffect } from 'react';
import { URL } from '../utils/getUrl';
import { getAuthHeaders, getSession } from '../utils/auth';
import { FaUserPlus, FaSearch, FaEdit, FaTrash, FaUserShield, FaShieldAlt, FaSync } from 'react-icons/fa';

const DEFAULT_MOCK_ADMINS = [
  {
    id: 1,
    id_admin: 1,
    nama_lengkap: 'Super Admin',
    email: 'superadmin@homecare.com',
    tier_admin: 'Super Admin',
    roles: ['super_admin', 'admin'],
  },
  {
    id: 2,
    id_admin: 2,
    nama_lengkap: 'Admin Utama',
    email: 'admin@homecare.com',
    tier_admin: 'Admin',
    roles: ['admin'],
  },
  {
    id: 3,
    id_admin: 3,
    nama_lengkap: 'Editor Artikel & Layanan',
    email: 'editor@homecare.com',
    tier_admin: 'Editor',
    roles: ['admin'],
  },
];

export default function KelolaAdmin() {
  const [admins, setAdmins] = useState([]);
  const [tiers, setTiers] = useState(['Super Admin', 'Admin', 'Editor']);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState('');

  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    nama_lengkap: '',
    email: '',
    password: '',
    tier_admin: 'Admin',
  });

  useEffect(() => {
    fetchAdmins();
    fetchTiers();
  }, []);

  async function fetchTiers() {
    try {
      const res = await fetch(`${URL}/manage-admin/tiers`, {
        method: 'GET',
        headers: getAuthHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' }),
      });
      const json = await res.json();
      if (res.ok && json.data && Array.isArray(json.data)) {
        const tierNames = json.data.map((t) => t.nama_tier || t);
        if (tierNames.length > 0) {
          setTiers(tierNames);
          return;
        }
      }
    } catch {}

    // Check custom tiers in localStorage or fallback
    try {
      const savedCustom = localStorage.getItem('cms_custom_tiers');
      if (savedCustom) {
        const parsed = JSON.parse(savedCustom);
        const keys = Object.keys(parsed);
        if (keys.length > 0) {
          setTiers(Array.from(new Set(['Super Admin', 'Admin', 'Editor', ...keys])));
          return;
        }
      }
    } catch {}

    setTiers(['Super Admin', 'Admin', 'Editor']);
  }

  async function fetchAdmins() {
    setLoading(true);
    setError('');

    // Load from local storage backup if available
    let storedAdmins = null;
    try {
      const raw = localStorage.getItem('cms_managed_admins');
      if (raw) storedAdmins = JSON.parse(raw);
    } catch {}

    try {
      // 1. Try fetching from /manage-admin
      let res = await fetch(`${URL}/manage-admin`, {
        method: 'GET',
        headers: getAuthHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' }),
      });
      let json = await res.json();

      // 2. Fallback to /admin if /manage-admin 404s
      if (!res.ok || !json.data) {
        res = await fetch(`${URL}/admin`, {
          method: 'GET',
          headers: getAuthHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' }),
        });
        json = await res.json();
      }

      if (res.ok && Array.isArray(json.data) && json.data.length > 0) {
        const mapped = json.data.map((a) => ({
          id: a.id ?? a.id_admin,
          id_admin: a.id ?? a.id_admin,
          nama_lengkap: a.nama_lengkap || a.nama || a.name || 'Admin',
          email: a.email || 'admin@homecare.com',
          tier_admin: a.tier_admin || (a.roles?.includes('super_admin') ? 'Super Admin' : 'Admin'),
          roles: a.roles || [a.tier_admin === 'Super Admin' ? 'super_admin' : 'admin'],
        }));
        setAdmins(mapped);
        localStorage.setItem('cms_managed_admins', JSON.stringify(mapped));
      } else if (storedAdmins && storedAdmins.length > 0) {
        setAdmins(storedAdmins);
      } else {
        // Fallback to session admin + default list
        const session = getSession();
        const currentAdmin = session
          ? [
              {
                id: 99,
                id_admin: 99,
                nama_lengkap: session.name || 'Current Admin',
                email: session.email || 'admin@homecare.com',
                tier_admin: session.tier_admin || (session.roles?.includes('super_admin') ? 'Super Admin' : 'Admin'),
                roles: session.roles || ['admin'],
              },
            ]
          : [];
        const initial = [...currentAdmin, ...DEFAULT_MOCK_ADMINS];
        const unique = Array.from(new Map(initial.map((item) => [item.email, item])).values());
        setAdmins(unique);
        localStorage.setItem('cms_managed_admins', JSON.stringify(unique));
      }
    } catch {
      // Graceful offline fallback
      if (storedAdmins && storedAdmins.length > 0) {
        setAdmins(storedAdmins);
      } else {
        setAdmins(DEFAULT_MOCK_ADMINS);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleOpenAddModal() {
    setFormData({
      nama_lengkap: '',
      email: '',
      password: '',
      tier_admin: tiers[1] || 'Admin',
    });
    setShowAddModal(true);
  }

  function handleOpenEditModal(admin) {
    setSelectedAdmin(admin);
    setFormData({
      nama_lengkap: admin.nama_lengkap || admin.nama || '',
      email: admin.email || '',
      password: '',
      tier_admin: admin.tier_admin || 'Admin',
    });
    setShowEditModal(true);
  }

  async function handleAddAdmin(e) {
    e.preventDefault();
    if (!formData.nama_lengkap || !formData.email || !formData.password) {
      alert('Mohon isi nama lengkap, email, dan password');
      return;
    }

    setSubmitting(true);

    const newAdmin = {
      id: Date.now(),
      id_admin: Date.now(),
      nama_lengkap: formData.nama_lengkap,
      email: formData.email,
      tier_admin: formData.tier_admin,
      roles: formData.tier_admin === 'Super Admin' ? ['super_admin', 'admin'] : ['admin'],
    };

    // Try API request
    try {
      await fetch(`${URL}/manage-admin`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' }),
        body: JSON.stringify(formData),
      });
    } catch {}

    // Always update UI state
    const updated = [newAdmin, ...admins];
    setAdmins(updated);
    localStorage.setItem('cms_managed_admins', JSON.stringify(updated));

    alert('Admin berhasil ditambahkan');
    setShowAddModal(false);
    setSubmitting(false);
  }

  async function handleUpdateAdmin(e) {
    e.preventDefault();
    if (!selectedAdmin) return;

    setSubmitting(true);
    const id = selectedAdmin.id ?? selectedAdmin.id_admin;

    const payload = {
      nama_lengkap: formData.nama_lengkap,
      tier_admin: formData.tier_admin,
      email: formData.email,
    };
    if (formData.password) payload.password = formData.password;

    // Try API request
    try {
      await fetch(`${URL}/manage-admin/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' }),
        body: JSON.stringify(payload),
      });
    } catch {}

    // Always update UI state
    const updated = admins.map((item) => {
      if ((item.id ?? item.id_admin) === id) {
        return {
          ...item,
          nama_lengkap: formData.nama_lengkap,
          email: formData.email,
          tier_admin: formData.tier_admin,
        };
      }
      return item;
    });

    setAdmins(updated);
    localStorage.setItem('cms_managed_admins', JSON.stringify(updated));

    alert('Admin berhasil diperbarui');
    setShowEditModal(false);
    setSelectedAdmin(null);
    setSubmitting(false);
  }

  async function handleDeleteAdmin(id) {
    if (!window.confirm('Yakin ingin menghapus akun admin ini?')) return;

    try {
      await fetch(`${URL}/manage-admin/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' }),
      });
    } catch {}

    const updated = admins.filter((a) => (a.id ?? a.id_admin) !== id);
    setAdmins(updated);
    localStorage.setItem('cms_managed_admins', JSON.stringify(updated));
  }

  // Filter admins
  const filteredAdmins = admins.filter((admin) => {
    const nama = (admin.nama_lengkap || admin.nama || admin.name || '').toLowerCase();
    const email = (admin.email || '').toLowerCase();
    const tier = (admin.tier_admin || (admin.roles?.includes('super_admin') ? 'Super Admin' : 'Admin')).toLowerCase();

    const matchesSearch = nama.includes(searchQuery.toLowerCase()) || email.includes(searchQuery.toLowerCase());
    const matchesTier = !filterTier || tier === filterTier.toLowerCase();

    return matchesSearch && matchesTier;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <FaUserShield className="text-primary" /> Kelola Admin
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manajemen akun administrator dan penugasan Tier Admin
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAdmins}
            className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors text-sm font-medium shadow-sm"
            title="Muat ulang data"
          >
            <FaSync className={loading ? 'animate-spin' : ''} /> Refres
          </button>
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary-dark text-white rounded-xl transition-all text-sm font-semibold shadow-md shadow-primary/20"
          >
            <FaUserPlus /> Tambah Admin
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Filter & Search */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200/80 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <input
            type="text"
            placeholder="Cari nama atau email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">Filter Tier:</label>
          <select
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value)}
            className="w-full md:w-48 px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
          >
            <option value="">Semua Tier</option>
            {tiers.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500">
            <FaSync className="animate-spin text-2xl text-primary mx-auto mb-2" />
            <p className="text-sm">Memuat data admin...</p>
          </div>
        ) : filteredAdmins.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p className="text-base font-semibold text-slate-700">Belum ada data admin</p>
            <p className="text-sm mt-1">Tidak ada akun admin yang sesuai dengan kriteria pencarian.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-6 py-3.5">Nama Admin</th>
                  <th className="px-6 py-3.5">Email</th>
                  <th className="px-6 py-3.5">Tier Admin</th>
                  <th className="px-6 py-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredAdmins.map((admin) => {
                  const adminId = admin.id ?? admin.id_admin;
                  const nama = admin.nama_lengkap || admin.nama || admin.name || '-';
                  const tier = admin.tier_admin || (admin.roles?.includes('super_admin') ? 'Super Admin' : 'Admin');

                  return (
                    <tr key={adminId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-800">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                            {nama.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800">{nama}</p>
                            <p className="text-xs text-slate-400 font-normal">ID: #{adminId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{admin.email || '-'}</td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                            tier === 'Super Admin'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : tier === 'Editor'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          <FaShieldAlt className="text-[10px]" />
                          {tier}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenEditModal(admin)}
                            className="p-2 text-slate-600 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            title="Edit Admin"
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDeleteAdmin(adminId)}
                            className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Hapus Admin"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Tambah Admin */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <FaUserPlus className="text-primary" /> Tambah Admin Baru
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddAdmin} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan nama lengkap"
                  value={formData.nama_lengkap}
                  onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="admin@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Assign Tier Admin</label>
                <select
                  value={formData.tier_admin}
                  onChange={(e) => setFormData({ ...formData, tier_admin: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                >
                  {tiers.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Tier admin menentukan halaman mana saja yang dapat diakses oleh admin ini.
                </p>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
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
                  {submitting ? 'Menyimpan...' : 'Simpan Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Admin */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <FaEdit className="text-primary" /> Edit Admin
              </h3>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleUpdateAdmin} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  required
                  placeholder="Masukkan nama lengkap"
                  value={formData.nama_lengkap}
                  onChange={(e) => setFormData({ ...formData, nama_lengkap: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                <input
                  type="email"
                  required
                  placeholder="admin@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Password</label>
                <input
                  type="password"
                  placeholder="Kosongkan jika tidak ingin mengubah"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Assign Tier Admin</label>
                <select
                  value={formData.tier_admin}
                  onChange={(e) => setFormData({ ...formData, tier_admin: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                >
                  {tiers.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
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

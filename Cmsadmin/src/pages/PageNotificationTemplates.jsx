import { useEffect, useState } from 'react';
import {
  getNotificationTemplates,
  createNotificationTemplate,
  updateNotificationTemplate,
  deleteNotificationTemplate,
} from '../data/notificationTemplateData';
import { FaBell, FaPlus, FaEdit, FaTrash, FaSpinner, FaSearch, FaTimes, FaCheck } from 'react-icons/fa';

export default function PageNotificationTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState({ type: '', text: '' });

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  // Form Fields
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    title: '',
    body: '',
    channel: 'push,email',
    is_active: true,
  });

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    setLoading(true);
    try {
      const res = await getNotificationTemplates();
      setTemplates(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Gagal memuat template notifikasi' });
    } finally {
      setLoading(false);
    }
  }

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      code: '',
      name: '',
      title: '',
      body: '',
      channel: 'push,email',
      is_active: true,
    });
    setShowModal(true);
  };

  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      code: item.code || '',
      name: item.name || '',
      title: item.title || '',
      body: item.body || '',
      channel: item.channel || 'push,email',
      is_active: item.is_active ?? true,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      if (editingItem) {
        const id = editingItem.id || editingItem.code;
        const res = await updateNotificationTemplate(id, formData);
        setMessage({ type: 'success', text: res.message || 'Template notifikasi berhasil diperbarui' });
      } else {
        const res = await createNotificationTemplate(formData);
        setMessage({ type: 'success', text: res.message || 'Template notifikasi berhasil ditambahkan' });
      }
      setShowModal(false);
      fetchTemplates();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Gagal menyimpan template notifikasi' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    setMessage({ type: '', text: '' });
    try {
      const res = await deleteNotificationTemplate(id);
      setMessage({ type: 'success', text: res.message || 'Template notifikasi berhasil dihapus' });
      setConfirmDeleteId(null);
      fetchTemplates();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Gagal menghapus template notifikasi' });
    } finally {
      setDeletingId(null);
    }
  };

  const filteredTemplates = templates.filter(
    (t) =>
      t.name?.toLowerCase().includes(search.toLowerCase()) ||
      t.code?.toLowerCase().includes(search.toLowerCase()) ||
      t.title?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <FaBell className="text-primary" /> Template Notifikasi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Kelola template notifikasi sistem untuk email, push notification, dan WhatsApp</p>
        </div>
        <button
          onClick={handleOpenAddModal}
          className="btn-primary inline-flex items-center justify-center gap-2 px-4 py-2.5 shrink-0"
        >
          <FaPlus size={14} /> Tambah Template Baru
        </button>
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

      {/* Filter and Search */}
      <div className="card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari berdasarkan kode atau nama..."
            className="form-input pl-10 text-sm"
          />
        </div>
        <span className="text-xs text-slate-500 font-medium">
          Total Template: <strong className="text-slate-800">{filteredTemplates.length}</strong>
        </span>
      </div>

      {/* Table Data */}
      <div className="card overflow-hidden">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <FaSpinner className="animate-spin text-3xl text-primary" />
            <span className="ml-3 text-slate-600 font-medium">Memuat template notifikasi...</span>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <FaBell size={36} className="mx-auto text-slate-300" />
            <p className="text-sm font-medium text-slate-600">Belum ada template notifikasi</p>
            <p className="text-xs text-slate-400">Klik tombol "Tambah Template Baru" di atas untuk menambahkan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider font-semibold border-b border-slate-200">
                  <th className="py-3.5 px-4">Kode</th>
                  <th className="py-3.5 px-4">Nama Template</th>
                  <th className="py-3.5 px-4">Judul Notifikasi</th>
                  <th className="py-3.5 px-4">Channel</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                {filteredTemplates.map((item, idx) => (
                  <tr key={item.id || item.code || idx} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 font-mono text-xs text-primary font-semibold">
                      {item.code}
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {item.name}
                    </td>
                    <td className="py-3.5 px-4 max-w-xs truncate text-slate-600" title={item.title}>
                      {item.title}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {String(item.channel || '')
                          .split(',')
                          .map((ch, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 text-[11px] font-semibold bg-slate-100 text-slate-600 rounded-md capitalize"
                            >
                              {ch.trim()}
                            </span>
                          ))}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-full ${
                          item.is_active
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {item.is_active ? <FaCheck size={10} /> : <FaTimes size={10} />}
                        {item.is_active ? 'Aktif' : 'Non-aktif'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(item)}
                          className="p-2 text-slate-600 hover:text-primary hover:bg-primary-light rounded-lg transition"
                          title="Edit Template"
                        >
                          <FaEdit size={14} />
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(item.id || item.code)}
                          className="p-2 text-slate-600 hover:text-danger hover:bg-danger-bg rounded-lg transition"
                          title="Hapus Template"
                        >
                          <FaTrash size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Form Create/Edit */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <FaBell className="text-primary" />
                {editingItem ? 'Edit Template Notifikasi' : 'Tambah Template Notifikasi Baru'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition"
              >
                <FaTimes size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="form-label">Kode Unique Template</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="Contoh: booking_created"
                  required
                  className="form-input font-mono text-sm"
                />
                <p className="text-[11px] text-slate-400 mt-1">Gunakan huruf kecil dan underscore tanpa spasi.</p>
              </div>

              <div>
                <label className="form-label">Nama Template</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Pemesanan Baru Dibuat"
                  required
                  className="form-input"
                />
              </div>

              <div>
                <label className="form-label">Judul Notifikasi (Title)</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Contoh: Pemesanan Baru #{{booking_id}}"
                  required
                  className="form-input"
                />
                <p className="text-[11px] text-slate-400 mt-1">Dapat menggunakan placeholder seperti {'{{booking_id}}'}</p>
              </div>

              <div>
                <label className="form-label">Isi / Body Notifikasi</label>
                <textarea
                  rows={4}
                  value={formData.body}
                  onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                  placeholder="Halo {{pasien_name}}, pemesanan Anda untuk layanan {{nama_layanan}} telah berhasil dibuat..."
                  required
                  className="form-input resize-none"
                />
              </div>

              <div>
                <label className="form-label">Channel Kirim</label>
                <input
                  type="text"
                  value={formData.channel}
                  onChange={(e) => setFormData({ ...formData, channel: e.target.value })}
                  placeholder="Contoh: push,email,whatsapp"
                  required
                  className="form-input"
                />
                <p className="text-[11px] text-slate-400 mt-1">Pisahkan channel dengan koma: push, email, whatsapp</p>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
                />
                <label htmlFor="is_active" className="text-sm font-semibold text-slate-700 cursor-pointer">
                  Aktifkan Template Notifikasi
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary inline-flex items-center gap-2 px-5 py-2"
                >
                  {saving ? <FaSpinner className="animate-spin" /> : <FaCheck />}
                  {editingItem ? 'Simpan Perubahan' : 'Tambah Template'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Delete Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-danger-bg text-danger flex items-center justify-center mx-auto">
              <FaTrash size={20} />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-bold text-slate-900">Konfirmasi Hapus</h4>
              <p className="text-xs text-slate-500">
                Apakah Anda yakin ingin menghapus template notifikasi ini? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deletingId === confirmDeleteId}
                onClick={() => handleDelete(confirmDeleteId)}
                className="px-4 py-2 text-xs font-semibold text-white bg-danger hover:bg-danger/90 rounded-xl transition inline-flex items-center gap-1.5"
              >
                {deletingId === confirmDeleteId && <FaSpinner className="animate-spin" />}
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

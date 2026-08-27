import React, { useState, useEffect } from 'react';
import { FaFileAlt, FaSave, FaInfoCircle, FaCheckCircle, FaExclamationTriangle, FaTimes } from 'react-icons/fa';
import { URL } from '../utils/getUrl';
import { getAuthHeaders } from '../utils/auth';

export default function PageSyaratKetentuanPasien() {
  const [docId, setDocId] = useState(null);
  const [title, setTitle] = useState('Syarat & Ketentuan Pasien');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const KEY_PASIEN = 'syarat-ketentuan-pasien';

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${URL}/legalitas/detail/${KEY_PASIEN}`);
      const body = await res.json();
      if (res.ok && body.success && body.data) {
        setDocId(body.data.id || null);
        setTitle(body.data.title || 'Syarat & Ketentuan Pasien');
        setContent(body.data.content || '');
      }
    } catch (err) {
      console.error('Gagal memuat syarat & ketentuan pasien:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = {
        key: KEY_PASIEN,
        title,
        content,
        is_active: true
      };

      const isEdit = Boolean(docId);
      const targetUrl = isEdit ? `${URL}/legalitas/${docId}` : `${URL}/legalitas`;
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(targetUrl, {
        method,
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload)
      });

      const body = await res.json();
      if (res.ok && body.success) {
        showToast('success', body.message || 'Syarat & Ketentuan Pasien berhasil disimpan');
        if (body.data?.id) {
          setDocId(body.data.id);
        }
      } else {
        showToast('error', body.message || 'Gagal menyimpan dokumen legalitas');
      }
    } catch (err) {
      console.error('Error saving legalitas:', err);
      showToast('error', 'Terjadi kesalahan saat menyimpan dokumen');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Toast Alert */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl border text-sm font-semibold transition-all ${
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
            <FaFileAlt className="text-primary" /> Syarat &amp; Ketentuan Pasien
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">Pengaturan dokumen legalitas dan aturan penggunaan layanan bagi pasien</p>
        </div>
      </div>

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 lg:p-8 shadow-xs space-y-6">
        <h2 className="text-base font-semibold text-slate-900 border-b border-slate-200 pb-3 flex items-center gap-2">
          <FaFileAlt className="text-primary" /> Dokumen Syarat &amp; Ketentuan Pasien
        </h2>

        {loading ? (
          <div className="text-center py-10 text-slate-400 text-sm">Memuat data dokumen legalitas...</div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="form-label">Judul Dokumen</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Syarat dan Ketentuan Layanan Pasien SmartHomeCare"
                className="form-input"
                required
              />
            </div>

            <div>
              <label className="form-label">Isi Dokumen Legalitas (Teks Lengkap)</label>
              <textarea
                rows={14}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Tuliskan pasal-pasal, hak dan kewajiban pasien, kebijakan pembatalan, serta batasan tanggung jawab..."
                className="form-input resize-y font-mono text-xs leading-relaxed"
                required
              />
            </div>
          </div>
        )}

        <div className="pt-2">
          <button
            type="submit"
            disabled={saving || loading}
            className="btn-primary flex items-center justify-center gap-2 px-6 py-2.5 shadow-md active:scale-95 transition"
          >
            <FaSave /> {saving ? 'Menyimpan...' : 'Simpan Syarat & Ketentuan Pasien'}
          </button>
        </div>
      </form>
    </div>
  );
}

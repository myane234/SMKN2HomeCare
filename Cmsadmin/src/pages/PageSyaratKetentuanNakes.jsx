import React, { useState, useEffect } from 'react';
import { 
  FaUserMd, FaSave, FaSyncAlt, FaCheckCircle, 
  FaExclamationTriangle, FaClock 
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import { getLegalitasDetail, updateLegalitas } from '../data/legalitasData';

export default function PageSyaratKetentuanNakes() {
  const [docId, setDocId] = useState(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [updatedAt, setUpdatedAt] = useState('');
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchDocument = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await getLegalitasDetail('syarat-ketentuan-nakes');
      if (data) {
        setDocId(data.id || 2);
        setTitle(data.title || 'Syarat & Ketentuan Tenaga Medis');
        setContent(data.content || '');
        setIsActive(data.is_active !== undefined ? !!data.is_active : true);
        setUpdatedAt(data.updated_at || data.created_at || '');
      }
    } catch (err) {
      console.error('Gagal mengambil data legalitas nakes:', err);
      setErrorMsg(err.message || 'Gagal memuat dokumen legalitas dari server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocument();
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Judul Wajib Diisi',
        text: 'Silakan masukkan judul dokumen perjanjian mitra nakes.',
      });
      return;
    }

    if (!content.trim()) {
      Swal.fire({
        icon: 'warning',
        title: 'Isi Dokumen Wajib Diisi',
        text: 'Silakan masukkan klausul dan isi dokumen perjanjian kemitraan.',
      });
      return;
    }

    setSaving(true);
    try {
      const payload = {
        key: 'syarat-ketentuan-nakes',
        title: title.trim(),
        content: content.trim(),
        is_active: isActive,
      };

      const res = await updateLegalitas(docId || 2, payload);
      Swal.fire({
        icon: 'success',
        title: 'Berhasil Disimpan',
        text: res?.message || 'Dokumen Syarat & Ketentuan Tenaga Medis berhasil diperbarui ke server.',
        timer: 1800,
        showConfirmButton: false,
      });

      if (res?.data?.updated_at) {
        setUpdatedAt(res.data.updated_at);
      }
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan',
        text: err.message || 'Terjadi kesalahan saat menyimpan dokumen ke server.',
      });
    } finally {
      setSaving(false);
    }
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    try {
      return new Date(dateStr).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <FaUserMd className="text-primary" /> Syarat & Ketentuan Nakes
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Pengaturan dokumen legalitas dan aturan kemitraan bagi tenaga kesehatan
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchDocument}
            disabled={loading || saving}
            className="px-3.5 py-2 text-xs sm:text-sm font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl transition flex items-center gap-2 shadow-2xs"
          >
            <FaSyncAlt className={loading ? 'animate-spin' : ''} /> Muat Ulang
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs sm:text-sm flex items-center gap-2.5">
          <FaExclamationTriangle className="shrink-0 text-base" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 lg:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-4">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <FaUserMd className="text-primary" /> Dokumen Perjanjian Kemitraan Tenaga Medis
          </h2>
          {updatedAt && (
            <span className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
              <FaClock className="text-slate-400" /> Terakhir diperbarui: {formatDateTime(updatedAt)}
            </span>
          )}
        </div>

        <div className="space-y-4">
          <div>
            <label className="form-label font-semibold text-slate-700">Judul Dokumen</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={loading}
              placeholder="Contoh: Syarat dan Ketentuan Kemitraan Tenaga Kesehatan SmartHomeCare"
              className="form-input text-xs sm:text-sm"
              required
            />
          </div>

          <div>
            <label className="form-label font-semibold text-slate-700">
              Isi Dokumen Perjanjian (Mendukung Format Teks / Markdown)
            </label>
            <textarea
              rows={16}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={loading}
              placeholder="Tuliskan syarat kualifikasi STR/SIP, etika pelayanan, pembagian hasil, dan klausul kerja sama kemitraan..."
              className="form-input resize-y font-mono text-xs sm:text-sm leading-relaxed"
              required
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="isActiveNakesCheck"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-primary rounded border-slate-300 focus:ring-primary"
            />
            <label htmlFor="isActiveNakesCheck" className="text-xs sm:text-sm text-slate-700 font-medium cursor-pointer select-none">
              Status Dokumen Aktif (Dapat dilihat oleh pendaftar mitra nakes di website frontend)
            </label>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Kunci API: <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono">syarat-ketentuan-nakes</code>
          </span>
          <button
            type="submit"
            disabled={loading || saving}
            className="btn-primary flex items-center justify-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition shadow-xs disabled:opacity-60"
          >
            {saving ? <FaSyncAlt className="animate-spin" /> : <FaSave />}
            <span>{saving ? 'Menyimpan ke Server...' : 'Simpan Perubahan'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}

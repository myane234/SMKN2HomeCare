import React, { useState, useEffect } from 'react';
import { getPointSettings, updatePointSettings, triggerPointExpire } from '../data/pointEndpoint';

export default function PagePointSettings() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [runnerLoading, setRunnerLoading] = useState(false);

  const [form, setForm] = useState({
    point_rate: '',
    point_expiry_days: '',
    is_active: true,
    max_point_discount_percent: '',
    updated_at: null,
  });

  // State untuk Custom Modal Pop-up (Meniru Gambar 3)
  const [modal, setModal] = useState({
    isOpen: false,
    type: 'success', // 'success' | 'error' | 'confirm'
    title: '',
    message: '',
    onConfirm: null,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const showSuccess = (title, message) => {
    setModal({ isOpen: true, type: 'success', title, message, onConfirm: null });
  };

  const showError = (title, message) => {
    setModal({ isOpen: true, type: 'error', title, message, onConfirm: null });
  };

  const showConfirm = (title, message, onConfirm) => {
    setModal({ isOpen: true, type: 'confirm', title, message, onConfirm });
  };

  const closeModal = () => {
    setModal((prev) => ({ ...prev, isOpen: false }));
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await getPointSettings();
      if (data) {
        setForm({
          point_rate: data.point_rate ?? '',
          point_expiry_days: data.point_expiry_days ?? '',
          is_active: Boolean(data.is_active),
          max_point_discount_percent: data.max_point_discount_percent ?? '',
          updated_at: data.updated_at || null,
        });
      }
    } catch (err) {
      showError('Gagal Memuat Data', err.message || 'Gagal mengambil data konfigurasi.');
    } finally {
      setLoading(false);
    }
  };

  // Mencegah pengetikan karakter minus (-), desimal (.), e, +, dll
  const preventInvalidKeys = (e) => {
    if (['-', '+', 'e', 'E', '.', ','].includes(e.key)) {
      e.preventDefault();
    }
  };

  // Handler input khusus untuk membuang semua karakter selain angka murni (positif)
  const handleNumberInput = (field, value, maxLimit = null) => {
    let sanitized = value.replace(/[^0-9]/g, ''); // Hapus semua selain 0-9
    if (maxLimit !== null && Number(sanitized) > maxLimit) {
      sanitized = String(maxLimit);
    }
    setForm((prev) => ({ ...prev, [field]: sanitized }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const rate = Number(form.point_rate);
    const expiry = Number(form.point_expiry_days);
    const maxDiscount = Number(form.max_point_discount_percent);

    if (!rate || rate <= 0) {
      showError('Input Tidak Valid', 'Point Rate harus berupa angka positif lebih dari 0.');
      return;
    }
    if (!expiry || expiry <= 0) {
      showError('Input Tidak Valid', 'Masa berlaku poin harus berupa angka positif lebih dari 0.');
      return;
    }
    if (form.max_point_discount_percent === '' || maxDiscount < 0 || maxDiscount > 100) {
      showError('Input Tidak Valid', 'Maksimal diskon poin harus di antara 0% hingga 100%.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        point_rate: rate,
        point_expiry_days: expiry,
        is_active: form.is_active,
        max_point_discount_percent: maxDiscount,
      };

      const res = await updatePointSettings(payload);
      showSuccess('Berhasil', 'Konfigurasi poin berhasil disimpan!');
      if (res.data) {
        setForm((prev) => ({ ...prev, updated_at: res.data.updated_at }));
      }
    } catch (err) {
      showError('Gagal Menyimpan', err.message || 'Terjadi kesalahan saat menyimpan data.');
    } finally {
      setSaving(false);
    }
  };

  const handleExpireRunner = () => {
    showConfirm(
      'Konfirmasi Proses',
      'Jalankan proses pengecekan & pembersihan poin kadaluwarsa sekarang?',
      async () => {
        closeModal();
        try {
          setRunnerLoading(true);
          const res = await triggerPointExpire();
          showSuccess('Berhasil', res.message || 'Proses pengecekan poin kadaluwarsa selesai!');
        } catch (err) {
          showError('Gagal Memproses', err.message || 'Gagal menjalankan runner expire poin.');
        } finally {
          setRunnerLoading(false);
        }
      }
    );
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Memuat konfigurasi poin...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto relative">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Konfigurasi Poin Pasien</h1>
        <p className="text-sm text-gray-500">Atur nilai konversi, batas diskon, dan masa berlaku poin.</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* INPUT FORM GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Point Rate (Rp / 1 Poin)
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 text-sm">Rp</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.point_rate}
                  onKeyDown={preventInvalidKeys}
                  onChange={(e) => handleNumberInput('point_rate', e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="10000"
                  required
                />
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Nominal transaksi untuk mendapatkan 1 poin (hanya angka positif).</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Masa Berlaku Poin (Hari)
              </label>
              <div className="relative">
                <input
                  type="text"
                  inputMode="numeric"
                  value={form.point_expiry_days}
                  onKeyDown={preventInvalidKeys}
                  onChange={(e) => handleNumberInput('point_expiry_days', e.target.value)}
                  className="w-full pr-12 pl-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  placeholder="365"
                  required
                />
                <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 text-xs">Hari</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-1">Jumlah hari sebelum poin hangus (hanya angka positif).</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Maksimal Diskon Poin (%)
            </label>
            <div className="relative">
              <input
                type="text"
                inputMode="numeric"
                value={form.max_point_discount_percent}
                onKeyDown={preventInvalidKeys}
                onChange={(e) => handleNumberInput('max_point_discount_percent', e.target.value, 100)}
                className="w-full pr-10 pl-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                placeholder="50"
                required
              />
              <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 text-xs">%</span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">Batas persentase maksimal tagihan (0% - 100%).</p>
          </div>

          {form.updated_at && (
            <p className="text-xs text-gray-400 italic">Terakhir diubah: {form.updated_at}</p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm px-5 py-2.5 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {saving ? 'Menyimpan...' : 'Simpan Konfigurasi'}
            </button>
          </div>
        </form>

        {/* GARIS PEMISAH */}
        <hr className="my-8 border-gray-200" />

        {/* BUTTON EXPIRE RUNNER */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h4 className="font-semibold text-amber-900 text-sm">Runner Poin Kadaluwarsa (Expire)</h4>
            <p className="text-xs text-amber-700 mt-0.5">
              Fitur manual untuk mengecek dan menghanguskan poin pasien yang telah melewati batas masa berlaku.
            </p>
          </div>
          <button
            type="button"
            onClick={handleExpireRunner}
            disabled={runnerLoading}
            className="bg-amber-600 hover:bg-amber-700 text-white font-medium text-xs px-4 py-2.5 rounded-lg transition-colors shadow-sm whitespace-nowrap disabled:opacity-50"
          >
            {runnerLoading ? 'Memproses...' : 'Proses Expire Poin'}
          </button>
        </div>
      </div>

      {/* CUSTOM MODAL NOTIFIKASI (PERSIS SEPERTI GAMBAR 3) */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full text-center transform transition-all scale-100">
            {/* IKON BERDASARKAN TIPE MODAL */}
            <div className="flex justify-center mb-4">
              {modal.type === 'success' && (
                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              {modal.type === 'error' && (
                <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
              {modal.type === 'confirm' && (
                <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center">
                  <svg className="w-7 h-7 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
              )}
            </div>

            <h3 className="text-lg font-bold text-gray-800 mb-2">{modal.title}</h3>
            <p className="text-sm text-gray-500 mb-6">{modal.message}</p>

            {/* TOMBOL AKSI MODAL */}
            {modal.type === 'confirm' ? (
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={modal.onConfirm}
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-sm"
                >
                  Ya, Lanjutkan
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={closeModal}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl transition-colors shadow-sm"
              >
                Oke
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
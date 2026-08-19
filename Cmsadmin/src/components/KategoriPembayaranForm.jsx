import { useState, useEffect } from 'react';

const emptyForm = {
  nama: '',
  is_active: true,
};

export default function KategoriPembayaranForm({ initialData, onSubmit, submitting, mode, onCancel }) {
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialData) {
      setForm({
        nama: initialData.nama || '',
        is_active: initialData.is_active ?? true,
      });
    } else {
      setForm(emptyForm);
    }
  }, [initialData]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setError('');
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!form.nama.trim()) {
      setError('Nama kategori pembayaran wajib diisi');
      return;
    }
    onSubmit(form);
  }

  return (
    <div className="w-full space-y-6 pb-10">
      <form className="w-full rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6" onSubmit={handleSubmit}>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            {mode === 'edit' ? 'Edit Kategori Pembayaran' : 'Tambah Kategori Pembayaran'}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Silakan lengkapi formulir di bawah ini untuk mengelola kategori pembayaran.
          </p>
        </div>

        <div className="space-y-6 pt-2">
          {/* Nama Kategori Pembayaran */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
              Nama Kategori Pembayaran
            </label>
            <input
              type="text"
              name="nama"
              value={form.nama}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              placeholder="Contoh: Bank Transfer, E-Wallet, QRIS"
            />
            {error && <span className="mt-1.5 block text-xs font-medium text-rose-500">{error}</span>}
          </div>

          {/* Status Aktif */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
              Status Aktif
            </label>
            <div className="flex gap-3 max-w-sm">
              <button
                type="button"
                className={
                  'flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ' +
                  (form.is_active === true
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50')
                }
                onClick={() => setForm((prev) => ({ ...prev, is_active: true }))}
              >
                Aktif
              </button>
              <button
                type="button"
                className={
                  'flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ' +
                  (form.is_active === false
                    ? 'border-rose-300 bg-rose-50 text-rose-600 shadow-sm'
                    : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50')
                }
                onClick={() => setForm((prev) => ({ ...prev, is_active: false }))}
              >
                Nonaktif
              </button>
            </div>
          </div>
        </div>

        {/* Tombol Aksi */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200 transition-all cursor-pointer"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {submitting
              ? 'Menyimpan...'
              : mode === 'edit'
              ? 'Simpan Perubahan'
              : 'Tambah Kategori'}
          </button>
        </div>
      </form>
    </div>
  );
}
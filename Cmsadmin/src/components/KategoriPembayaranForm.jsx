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
    <form className="max-w-xl rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" onSubmit={handleSubmit}>
      <h2 className="mb-5 text-lg font-bold text-slate-800">
        {mode === 'edit' ? 'Edit Kategori Pembayaran' : 'Tambah Kategori Pembayaran'}
      </h2>

      <div className="flex flex-col gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Nama Kategori Pembayaran
          </label>
          <input
            type="text"
            name="nama"
            value={form.nama}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            placeholder="Contoh: Bank Transfer, E-Wallet, QRIS"
          />
          {error && <span className="mt-1 block text-xs text-rose-500">{error}</span>}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Status Aktif
          </label>
          <div className="mt-1 flex gap-2.5">
            <button
              type="button"
              className={
                'flex-1 rounded-lg border px-3 py-2.5 text-[13px] font-semibold transition-all ' +
                (form.is_active === true
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                  : 'border-slate-200 bg-white text-slate-500')
              }
              onClick={() => setForm((prev) => ({ ...prev, is_active: true }))}
            >
              Aktif
            </button>
            <button
              type="button"
              className={
                'flex-1 rounded-lg border px-3 py-2.5 text-[13px] font-semibold transition-all ' +
                (form.is_active === false
                  ? 'border-rose-300 bg-rose-50 text-rose-600'
                  : 'border-slate-200 bg-white text-slate-500')
              }
              onClick={() => setForm((prev) => ({ ...prev, is_active: false }))}
            >
              Nonaktif
            </button>
          </div>
        </div>
      </div>

      <div className="mt-7 flex justify-end gap-2.5 border-t border-slate-200 pt-5">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          Batal
        </button>
        <button
          type="submit"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          disabled={submitting}
        >
          {submitting
            ? 'Menyimpan...'
            : mode === 'edit'
            ? 'Simpan Perubahan'
            : 'Tambah Kategori'}
        </button>
      </div>
    </form>
  );
}
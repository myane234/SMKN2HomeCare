import { useState, useEffect } from 'react';
import { getKategoriPembayaranOptions } from '../data/masterMetodePembayaranData.js';

const emptyForm = {
  id: '',
  id_kategori_pembayaran: '',
  nama_metode: '',
  tipe_potongan: 'nominal',
  nilai_potongan: 0,
  is_active: true,
};

export default function MetodePembayaranForm({ initialData, onSubmit, submitting, mode, onCancel }) {
  const [form, setForm] = useState(emptyForm);
  const [kategoriOptions, setKategoriOptions] = useState([]);
  const [loadingKategori, setLoadingKategori] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    async function loadKategori() {
      setLoadingKategori(true);
      try {
        const data = await getKategoriPembayaranOptions();
        setKategoriOptions(data || []);
      } catch (err) {
        console.error('Gagal mengambil opsi kategori:', err);
      } finally {
        setLoadingKategori(false);
      }
    }

    loadKategori();
  }, []);

  useEffect(() => {
    if (initialData) {
      setForm({
        id: initialData.id || initialData.id_metode || '',
        id_kategori_pembayaran: initialData.id_kategori_pembayaran || '',
        nama_metode: initialData.nama_metode || initialData.nama || '',
        tipe_potongan: initialData.tipe_potongan || 'nominal',
        nilai_potongan: initialData.nilai_potongan ?? 0,
        is_active: initialData.is_active ?? true,
      });
    }
  }, [initialData]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  function validate() {
    const newErrors = {};
    if (!form.id_kategori_pembayaran) {
      newErrors.id_kategori_pembayaran = 'Kategori pembayaran wajib dipilih';
    }
    if (!form.nama_metode.trim()) {
      newErrors.nama_metode = 'Nama metode pembayaran wajib diisi';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(form);
  }

  return (
    <div className="w-full space-y-6 pb-10">
      <form className="w-full rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6" onSubmit={handleSubmit}>
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            {mode === 'edit' ? 'Edit Metode Pembayaran' : 'Tambah Metode Pembayaran'}
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Silakan lengkapi formulir di bawah ini untuk mengelola metode pembayaran.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          {/* Kategori Pembayaran */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
              Kategori Pembayaran
            </label>
            <select
              name="id_kategori_pembayaran"
              value={form.id_kategori_pembayaran}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              disabled={loadingKategori}
            >
              <option value="">
                {loadingKategori ? 'Memuat kategori...' : '-- Pilih Kategori Pembayaran --'}
              </option>
              {kategoriOptions.map((kat) => (
                <option key={kat.id} value={kat.id}>
                  {kat.nama}
                </option>
              ))}
            </select>
            {errors.id_kategori_pembayaran && (
              <span className="mt-1.5 block text-xs font-medium text-rose-500">{errors.id_kategori_pembayaran}</span>
            )}
          </div>

          {/* Nama Metode Pembayaran */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
              Nama Metode Pembayaran
            </label>
            <input
              type="text"
              name="nama_metode"
              value={form.nama_metode}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              placeholder="Contoh: BCA Transfer, QRIS"
            />
            {errors.nama_metode && <span className="mt-1.5 block text-xs font-medium text-rose-500">{errors.nama_metode}</span>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Tipe Potongan */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
              Tipe Potongan
            </label>
            <select
              name="tipe_potongan"
              value={form.tipe_potongan}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
            >
              <option value="nominal">Nominal (Rp)</option>
              <option value="persen">Persen (%)</option>
            </select>
          </div>

          {/* Nilai Potongan */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
              Nilai Potongan
            </label>
            <input
              type="number"
              name="nilai_potongan"
              value={form.nilai_potongan}
              onChange={handleChange}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
              min="0"
              placeholder="0"
            />
          </div>
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
              : 'Tambah Metode'}
          </button>
        </div>
      </form>
    </div>
  );
}
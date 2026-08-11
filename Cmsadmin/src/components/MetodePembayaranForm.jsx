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
    <form className="max-w-xl rounded-xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7" onSubmit={handleSubmit}>
      <h2 className="mb-5 text-lg font-bold text-slate-800">
        {mode === 'edit' ? 'Edit Metode Pembayaran' : 'Tambah Metode Pembayaran'}
      </h2>

      <div className="flex flex-col gap-4">
        {/* Kategori Pembayaran */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Kategori Pembayaran
          </label>
          <select
            name="id_kategori_pembayaran"
            value={form.id_kategori_pembayaran}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
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
            <span className="mt-1 block text-xs text-rose-500">{errors.id_kategori_pembayaran}</span>
          )}
        </div>

        {/* Nama Metode Pembayaran */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Nama Metode Pembayaran
          </label>
          <input
            type="text"
            name="nama_metode"
            value={form.nama_metode}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            placeholder="Contoh: BCA Transfer, QRIS"
          />
          {errors.nama_metode && <span className="mt-1 block text-xs text-rose-500">{errors.nama_metode}</span>}
        </div>

        {/* Tipe Potongan */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Tipe Potongan
          </label>
          <select
            name="tipe_potongan"
            value={form.tipe_potongan}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          >
            <option value="nominal">Nominal (Rp)</option>
            <option value="persen">Persen (%)</option>
          </select>
        </div>

        {/* Nilai Potongan */}
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Nilai Potongan
          </label>
          <input
            type="number"
            name="nilai_potongan"
            value={form.nilai_potongan}
            onChange={handleChange}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            min="0"
            placeholder="0"
          />
        </div>

        {/* Status Aktif */}
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
            : 'Tambah Metode'}
        </button>
      </div>
    </form>
  );
}
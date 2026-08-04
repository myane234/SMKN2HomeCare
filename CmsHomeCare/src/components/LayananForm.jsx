import { useState, useEffect } from 'react';
import { getKategoriLayanan } from '../data/layananData.js';

const emptyForm = {
  nama: '',
  kategori: '',
  deskripsi: '',
  harga: '',
  tipe_layanan: 'tindakan',
  durasi: '',
  transport: false,
  gambar: null,
};

export default function LayananForm({ initialData, onSubmit, submitting, mode }) {
  const [form, setForm] = useState(emptyForm);
  const [kategoriOptions, setKategoriOptions] = useState([]); // FIX: Menggunakan k kecil sesuai standar camelCase
  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState('');

  useEffect(() => {
    async function fetchKategori() {
      try {
        const data = await getKategoriLayanan();
        setKategoriOptions(data);
        
        // Jika sedang tambah data baru (bukan edit), otomatis pasang opsi pertama sebagai default
        if (!initialData && data.length > 0) {
          setForm((prev) => ({ ...prev, kategori: data[0].id_kategori_layanan }));
        }
      } catch (err) {
        console.error('Gagal memuat kategori layanan:', err);
      }
    }
    
    fetchKategori();
  }, [initialData]);

  useEffect(() => {
    if (initialData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({ ...emptyForm, ...initialData, gambar: null });
      setPreview(initialData.gambar || '');
    }
  }, [initialData]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    // Simpan File object ke state, bukan base64
    setForm((prev) => ({ ...prev, gambar: file }));
    // Preview tetap pakai dataURL hanya untuk tampilan
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  }

  function validate() {
    const newErrors = {};
    if (!form.nama.trim()) newErrors.nama = 'Nama layanan wajib diisi';
    if (!form.deskripsi.trim()) newErrors.deskripsi = 'Deskripsi wajib diisi';
    if (!form.harga || Number(form.harga) <= 0) newErrors.harga = 'Harga harus lebih dari 0';
    if (form.tipe_layanan === 'durasi' && (!form.durasi || Number(form.durasi) <= 0)) newErrors.durasi = 'Durasi harus lebih dari 0';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      ...form,
      harga: Number(form.harga),
      durasi: form.tipe_layanan === 'durasi' ? Number(form.durasi) : '',
    });
  }

  return (
    <form className="card max-w-3xl p-5 sm:p-7" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col">
          <label className="form-label">Nama Layanan</label>
          <input
            type="text"
            name="nama"
            value={form.nama}
            onChange={handleChange}
            className="form-input"
            placeholder="Contoh: Fisioterapi Ortopedi"
          />
          {errors.nama && <span className="field-error">{errors.nama}</span>}

          <label className="form-label">Kategori</label>
          <select
            name="kategori"
            value={form.kategori}
            onChange={handleChange}
            className="form-input"
          >
            {/* FIX: Lakukan mapping dari state kategoriOptions dan beri fallback saat loading */}
            {kategoriOptions.length === 0 ? (
              <option value="">Memuat kategori...</option>
            ) : (
              kategoriOptions.map((opt) => (
                <option key={opt.id_kategori_layanan} value={opt.id_kategori_layanan}>
                  {opt.nama_kategori}
                </option>
              ))
            )}
          </select>

          <label className="form-label">Tipe Layanan</label>
          <select
            name="tipe_layanan"
            value={form.tipe_layanan}
            onChange={handleChange}
            className="form-input"
          >
            <option value="tindakan">Tindakan</option>
            <option value="durasi">Berdasarkan Durasi</option>
          </select>

          <label className="form-label">Deskripsi</label>
          <textarea
            name="deskripsi"
            value={form.deskripsi}
            onChange={handleChange}
            className="form-input resize-y"
            placeholder="Jelaskan tentang layanan ini..."
            rows={5}
          />
          {errors.deskripsi && <span className="field-error">{errors.deskripsi}</span>}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="form-label">Harga (Rp)</label>
              <input
                type="number"
                name="harga"
                value={form.harga}
                onChange={handleChange}
                className="form-input"
                placeholder="250000"
                min="0"
              />
              {errors.harga && <span className="field-error">{errors.harga}</span>}
            </div>
            {form.tipe_layanan === 'durasi' && (
              <div>
                <label className="form-label">Durasi (menit)</label>
                <input
                  type="number"
                  name="durasi"
                  value={form.durasi}
                  onChange={handleChange}
                  className="form-input"
                  placeholder="60"
                  min="0"
                />
                {errors.durasi && <span className="field-error">{errors.durasi}</span>}
              </div>
            )}
          </div>

          <label className="form-label">Include Transport</label>
          <div className="mt-1 flex gap-2.5">
            <button
              type="button"
              className={
                'flex-1 rounded-lg border px-3 py-2.5 text-[13px] font-semibold ' +
                (form.transport === true
                  ? 'border-primary bg-primary-light text-primary-dark'
                  : 'border-slate-200 bg-white text-slate-500')
              }
              onClick={() => setForm((prev) => ({ ...prev, transport: true }))}
            >
              Iya
            </button>
            <button
              type="button"
              className={
                'flex-1 rounded-lg border px-3 py-2.5 text-[13px] font-semibold ' +
                (form.transport === false
                  ? 'border-danger bg-danger-bg text-danger'
                  : 'border-slate-200 bg-white text-slate-500')
              }
              onClick={() => setForm((prev) => ({ ...prev, transport: false }))}
            >
              Tidak
            </button>
          </div>
        </div>

        <div className="flex flex-col">
          <label className="form-label">Gambar Layanan</label>
          <div className="flex flex-col items-center gap-3.5 rounded-card border border-dashed border-slate-200 bg-slate-50 p-5">
            {preview ? (
              <img
                src={preview}
                alt="Preview"
                className="aspect-square w-full max-w-[220px] rounded-lg object-cover"
              />
            ) : (
              <div className="flex aspect-square w-full max-w-[220px] items-center justify-center rounded-lg border border-slate-200 bg-white p-2.5 text-center text-[13px] text-slate-500">
                Belum ada gambar
              </div>
            )}
            <label className="btn-outline block w-full max-w-[220px] cursor-pointer text-center">
              Pilih Gambar
              <input type="file" accept="image/*" onChange={handleImageChange} hidden />
            </label>
          </div>
        </div>
      </div>

      <div className="mt-7 flex flex-col-reverse justify-between gap-4 border-t border-slate-200 pt-5 sm:flex-row sm:items-center">
        <div>
          {mode === 'edit' && initialData?.updated_at && (
            <span className="text-xs text-slate-400">
              Terakhir diperbarui:{' '}
              {new Date(initialData.updated_at).toLocaleString('id-ID', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }).replace(/\./g, ':')}
            </span>
          )}
        </div>
        <div className="flex flex-col-reverse gap-2.5 sm:flex-row">
          <a href="/layanan" className="btn-outline text-center">
            Batal
          </a>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting
              ? 'Menyimpan...'
              : mode === 'edit'
              ? 'Simpan Perubahan'
              : 'Tambah Layanan'}
          </button>
        </div>
      </div>
    </form>
  );
}
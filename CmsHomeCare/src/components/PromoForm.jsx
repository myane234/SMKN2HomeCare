import { useEffect, useState } from 'react';
import { getAllLayanan } from '../data/layananData';

const emptyForm = {
  nama_paket: '',
  deskripsi: '',
  diskon_persen: '',
  tanggal_mulai: '',
  tanggal_berakhir: '',
  status_promo: 'Tidak Aktif',
  layanan_ids: [],
  gambar_promo: null,
};

function parseCustomDate(tanggal) {
  if (!tanggal) return '';
  if (typeof tanggal === 'string' && tanggal.includes(':')) {
    const [yy, mm, dd] = tanggal.split(':');
    return `20${yy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
  }
  // Ambil hanya format YYYY-MM-DD jika formatnya ISO String (e.g., 2026-07-21T00:00:00)
  if (typeof tanggal === 'string' && tanggal.includes('T')) {
    return tanggal.split('T')[0];
  }
  return tanggal;
}

function normalizeSelectedIds(initialData) {
  if (!initialData) return [];

  if (Array.isArray(initialData.layanan_ids)) {
    return initialData.layanan_ids.map(String);
  }

  if (Array.isArray(initialData.layanans)) {
    return initialData.layanans.map((item) => String(item.id_layanan ?? item.id ?? item.value ?? ''));
  }

  return [];
}

export default function PromoForm({ initialData, onSubmit, submitting, mode }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [layananOptions, setLayananOptions] = useState([]);
  const [image, setImage] = useState(null);
  const [loadingLayanan, setLoadingLayanan] = useState(true);
  const [serviceSearch, setServiceSearch] = useState('');
  const [serviceOpen, setServiceOpen] = useState(false);

  useEffect(() => {
    async function loadLayanan() {
      try {
        const data = await getAllLayanan();
        setLayananOptions(data || []);
      } catch (error) {
        console.error(error);
        setLayananOptions([]);
      } finally {
        setLoadingLayanan(false);
      }
    }

    loadLayanan();
  }, []);

  useEffect(() => {
    if (initialData) {
      const tglMulai = parseCustomDate(
        initialData.tanggal_mulai ?? initialData.tanggalMulai ?? ''
      );
      const tglBerakhir = parseCustomDate(
        initialData.tanggal_berakhir ?? initialData.tanggalBerakhir ?? ''
      );

      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        ...emptyForm,
        nama_paket: initialData.nama_paket ?? initialData.nama ?? initialData.kode_promo ?? '',
        deskripsi: initialData.deskripsi ?? initialData.deskripsi_layanan ?? initialData.deskripsiLayanan ?? '',
        diskon_persen: initialData.diskon_persen ?? initialData.potongan_harga ?? initialData.potonganHarga ?? '',
        tanggal_mulai: tglMulai,
        tanggal_berakhir: tglBerakhir,
        status_promo: initialData.status_promo ?? initialData.status ?? 'Tidak Aktif',
        layanan_ids: normalizeSelectedIds(initialData),
      });
      return;
    }

    setForm({ ...emptyForm });
  }, [initialData]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  function handleFileChange(e) {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  }

  function toggleService(id) {
    const value = String(id);
    setForm((prev) => ({
      ...prev,
      layanan_ids: prev.layanan_ids.includes(value)
        ? prev.layanan_ids.filter((item) => item !== value)
        : [...prev.layanan_ids, value],
    }));
    setErrors((prev) => ({ ...prev, layanan_ids: '' }));
  }

  function validate() {
    const newErrors = {};
    if (!String(form.nama_paket).trim()) newErrors.nama_paket = 'Nama paket wajib diisi';
    if (!String(form.deskripsi).trim()) newErrors.deskripsi = 'Deskripsi wajib diisi';

    const diskon = Number(form.diskon_persen);
    if (!form.diskon_persen || Number.isNaN(diskon) || diskon < 0 || diskon > 100) {
      newErrors.diskon_persen = 'Diskon harus di antara 0 sampai 100';
    }

    if (!String(form.tanggal_mulai).trim()) {
      newErrors.tanggal_mulai = 'Tanggal mulai wajib diisi';
    }

    if (!String(form.tanggal_berakhir).trim()) {
      newErrors.tanggal_berakhir = 'Tanggal berakhir wajib diisi';
    }

    // Validasi perbandingan tanggal
    if (form.tanggal_mulai && form.tanggal_berakhir) {
      if (new Date(form.tanggal_mulai) > new Date(form.tanggal_berakhir)) {
        newErrors.tanggal_berakhir = 'Tanggal berakhir harus setelah atau sama dengan tanggal mulai';
      }
    }

    if (!Array.isArray(form.layanan_ids) || form.layanan_ids.length === 0) {
      newErrors.layanan_ids = 'Pilih minimal 1 layanan';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  const filteredLayanan = layananOptions.filter((item) =>
    String(item.nama ?? '').toLowerCase().includes(serviceSearch.toLowerCase())
  );

  const selectedServices = layananOptions.filter((item) =>
    form.layanan_ids.includes(String(item.id ?? item.id_layanan ?? ''))
  );

  return (
    <form
      className="card max-w-3xl p-5 sm:p-7"
      onSubmit={(e) => {
        e.preventDefault();
        if (validate()) {
          onSubmit({
            ...form,
            diskon_persen: Number(form.diskon_persen),
            layanan_ids: form.layanan_ids,
            gambar_promo: image,
          });
        }
      }}
    >
      <div className="grid gap-6">
        <div>
          <label className="form-label">Nama Paket</label>
          <input
            type="text"
            name="nama_paket"
            value={form.nama_paket}
            onChange={handleChange}
            className="form-input"
            placeholder="Contoh: Paket HomeCare Premium"
          />
          {errors.nama_paket && <span className="field-error">{errors.nama_paket}</span>}
        </div>

        {/* Grid Diskon, Tanggal Mulai, dan Tanggal Berakhir */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="form-label">Diskon (%)</label>
            <input
              type="number"
              name="diskon_persen"
              value={form.diskon_persen}
              onChange={handleChange}
              className="form-input"
              min="0"
              max="100"
              placeholder="10"
            />
            {errors.diskon_persen && <span className="field-error">{errors.diskon_persen}</span>}
          </div>
          <div>
            <label className="form-label">Tanggal Mulai</label>
            <input
              type="date"
              name="tanggal_mulai"
              value={form.tanggal_mulai}
              onChange={handleChange}
              className="form-input"
            />
            {errors.tanggal_mulai && <span className="field-error">{errors.tanggal_mulai}</span>}
          </div>
          <div>
            <label className="form-label">Tanggal Berakhir</label>
            <input
              type="date"
              name="tanggal_berakhir"
              value={form.tanggal_berakhir}
              onChange={handleChange}
              className="form-input"
            />
            {errors.tanggal_berakhir && <span className="field-error">{errors.tanggal_berakhir}</span>}
          </div>
        </div>

        <div>
          <label className="form-label">Deskripsi</label>
          <textarea
            name="deskripsi"
            value={form.deskripsi}
            onChange={handleChange}
            className="form-input resize-y"
            rows={4}
            placeholder="Jelaskan isi paket promo..."
          />
          {errors.deskripsi && <span className="field-error">{errors.deskripsi}</span>}
        </div>

        <div>
          <label className="form-label">Gambar Promo</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="form-input"
          />
          {mode === 'edit' && initialData?.gambar_promo && !image && (
            <p className="mt-2 text-sm text-slate-500">
              Gambar saat ini:{' '}
              <a href={initialData.gambar_promo} target="_blank" rel="noreferrer" className="text-blue-500 underline">
                Lihat Gambar
              </a>
            </p>
          )}
        </div>

        <div>
          <label className="form-label">Pilih Layanan</label>
          <div className="rounded-card border border-slate-200 bg-slate-50 p-4">
            <button
              type="button"
              onClick={() => setServiceOpen((prev) => !prev)}
              className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-left text-sm font-medium text-slate-700"
            >
              <span>
                {selectedServices.length > 0
                  ? `${selectedServices.length} layanan dipilih`
                  : 'Pilih layanan yang masuk paket'}
              </span>
              <span className="text-xs text-slate-500">{serviceOpen ? 'Tutup' : 'Buka'}</span>
            </button>

            {serviceOpen && (
              <div className="mt-3 rounded-lg border border-slate-200 bg-white p-3">
                <input
                  type="text"
                  value={serviceSearch}
                  onChange={(e) => setServiceSearch(e.target.value)}
                  placeholder="Cari layanan..."
                  className="form-input"
                />

                <div className="mt-3 max-h-48 space-y-2 overflow-auto pr-1">
                  {loadingLayanan ? (
                    <p className="text-sm text-slate-500">Memuat layanan...</p>
                  ) : filteredLayanan.length === 0 ? (
                    <p className="text-sm text-slate-500">Tidak ada layanan yang cocok.</p>
                  ) : (
                    filteredLayanan.map((item) => {
                      const value = String(item.id ?? item.id_layanan ?? '');
                      const checked = form.layanan_ids.includes(value);
                      return (
                        <label
                          key={value}
                          className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition ${
                            checked
                              ? 'border-primary bg-primary-light text-primary-dark'
                              : 'border-slate-200 bg-white text-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => toggleService(value)}
                            className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                          />
                          <span>{item.nama}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {selectedServices.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {selectedServices.map((item) => (
                  <span
                    key={item.id ?? item.id_layanan}
                    className="rounded-full bg-primary-light px-3 py-1 text-xs font-medium text-primary-dark"
                  >
                    {item.nama}
                  </span>
                ))}
              </div>
            )}
          </div>
          {errors.layanan_ids && <span className="field-error">{errors.layanan_ids}</span>}
        </div>

        <div>
          <label className="form-label">Status</label>
          <div className="mt-1 flex gap-2.5">
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, status_promo: 'Aktif' }))}
              className={
                'flex-1 rounded-lg border px-3 py-2.5 text-[13px] font-semibold ' +
                (form.status_promo === 'Aktif'
                  ? 'border-primary bg-primary-light text-primary-dark'
                  : 'border-slate-200 bg-white text-slate-500')
              }
            >
              Aktif
            </button>
            <button
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, status_promo: 'Tidak Aktif' }))}
              className={
                'flex-1 rounded-lg border px-3 py-2.5 text-[13px] font-semibold ' +
                (form.status_promo === 'Tidak Aktif'
                  ? 'border-danger bg-danger-bg text-danger'
                  : 'border-slate-200 bg-white text-slate-500')
              }
            >
              Tidak Aktif
            </button>
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
          <a href="/promo" className="btn-outline text-center">
            Batal
          </a>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting ? 'Menyimpan...' : mode === 'edit' ? 'Simpan Perubahan' : 'Tambah Promo'}
          </button>
        </div>
      </div>
    </form>
  );
}
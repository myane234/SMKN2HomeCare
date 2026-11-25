import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';
import { getAllLayanan } from '../data/layananData';
import { getImageUrl } from '../data/imageHelper.js';

const emptyForm = {
  deskripsi: '',
  diskon_persen: '',
  tanggal_mulai: '',
  tanggal_berakhir: '',
  status_promo: 'Tidak Aktif',
  id_layanan: '',
};

function formatDateInput(value) {
  if (!value) return '';

  const dateString = String(value);
  const match = dateString.match(/^(\d{4}-\d{2}-\d{2})/);

  return match ? match[1] : '';
}

function getServiceId(item) {
  const id = item?.id_layanan ?? item?.id;
  return id === null || id === undefined ? '' : String(id);
}

function getServiceName(item) {
  return item?.nama_layanan ?? item?.nama ?? '';
}

function normalizeInitialData(data) {
  if (!data) return { ...emptyForm };

  return {
    deskripsi: data.deskripsi ?? '',
    diskon_persen: data.nilai_diskon ?? '',
    tanggal_mulai: formatDateInput(data.tanggal_mulai),
    tanggal_berakhir: formatDateInput(data.tanggal_berakhir),
    status_promo: data.status_promo ?? 'Tidak Aktif',
    id_layanan: String(
      data.id_layanan ??
      data.layanan?.id_layanan ??
      ''
    ),
  };
}

export default function PromoForm({
  initialData = null,
  onSubmit,
  submitting = false,
  mode = 'create',
}) {
  const [form, setForm] = useState(() =>
    normalizeInitialData(initialData)
  );

  const [errors, setErrors] = useState({});
  const [layananOptions, setLayananOptions] = useState([]);
  const [loadingLayanan, setLoadingLayanan] = useState(true);
  const [layananError, setLayananError] = useState('');
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [submittingForm, setSubmittingForm] = useState(false);

  // State dropdown layanan
  const [serviceDropdownOpen, setServiceDropdownOpen] = useState(false);
  const [serviceSearch, setServiceSearch] = useState('');
  const serviceDropdownRef = useRef(null);

  const formDisabled = submitting || submittingForm;

  const serviceDropdownDisabled =
    loadingLayanan || Boolean(layananError) || formDisabled;

  // Isi ulang form ketika data promo selesai diambil dari API.
  useEffect(() => {
    setForm(normalizeInitialData(initialData));
    setImage(null);
    setErrors({});
    setServiceDropdownOpen(false);
    setServiceSearch('');
  }, [initialData]);

  // Ambil daftar layanan langsung dari API.
  useEffect(() => {
    let active = true;

    async function loadLayanan() {
      setLoadingLayanan(true);
      setLayananError('');

      try {
        const response = await getAllLayanan();

        const data = Array.isArray(response)
          ? response
          : Array.isArray(response?.data)
            ? response.data
            : [];

        if (active) {
          setLayananOptions(data);
        }
      } catch (error) {
        console.error('Gagal mengambil data layanan:', error);

        if (active) {
          setLayananError(
            error.message || 'Gagal memuat data layanan.'
          );
        }
      } finally {
        if (active) {
          setLoadingLayanan(false);
        }
      }
    }

    loadLayanan();

    return () => {
      active = false;
    };
  }, []);

  // Tutup dropdown ketika klik di luar area atau tekan Escape.
  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        serviceDropdownRef.current &&
        !serviceDropdownRef.current.contains(event.target)
      ) {
        setServiceDropdownOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === 'Escape') {
        setServiceDropdownOpen(false);
      }
    }

    document.addEventListener('pointerdown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('pointerdown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  // Preview gambar baru atau gambar yang sudah tersimpan di server.
  useEffect(() => {
    if (image instanceof File) {
      const objectUrl = URL.createObjectURL(image);

      setImagePreview(objectUrl);

      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    }

    const existingImage =
      initialData?.gambar_promo_url ??
      initialData?.gambar_promo;

    setImagePreview(
      existingImage ? getImageUrl(existingImage) : ''
    );
  }, [
    image,
    initialData?.gambar_promo,
    initialData?.gambar_promo_url,
  ]);

  // Cari layanan yang sedang dipilih.
  const selectedService = useMemo(() => {
    return layananOptions.find(
      (item) => getServiceId(item) === form.id_layanan
    );
  }, [layananOptions, form.id_layanan]);

  const selectedServiceName =
    getServiceName(selectedService) ||
    initialData?.layanan?.nama_layanan ||
    initialData?.nama_layanan ||
    '';

  // Filter daftar layanan berdasarkan pencarian.
  const filteredLayanan = useMemo(() => {
    const query = serviceSearch.trim().toLocaleLowerCase('id-ID');

    if (!query) return layananOptions;

    return layananOptions.filter((item) =>
      String(getServiceName(item))
        .toLocaleLowerCase('id-ID')
        .includes(query)
    );
  }, [layananOptions, serviceSearch]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: '',
    }));
  }

  // Pilih satu layanan.
  function handleServiceSelect(item) {
    setForm((prev) => ({
      ...prev,
      id_layanan: getServiceId(item),
    }));

    setErrors((prev) => ({
      ...prev,
      id_layanan: '',
    }));

    setServiceDropdownOpen(false);
    setServiceSearch('');
  }

  function handleFileChange(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors((prev) => ({
        ...prev,
        gambar_promo: 'File harus berupa gambar.',
      }));

      event.target.value = '';
      return;
    }

    setImage(file);

    setErrors((prev) => ({
      ...prev,
      gambar_promo: '',
    }));
  }

  function validate() {
    const newErrors = {};

    if (!String(form.deskripsi).trim()) {
      newErrors.deskripsi = 'Deskripsi promo wajib diisi.';
    }

    const diskon = Number(form.diskon_persen);

    if (
      form.diskon_persen === '' ||
      !Number.isFinite(diskon) ||
      diskon < 0 ||
      diskon > 100
    ) {
      newErrors.diskon_persen =
        'Diskon harus berada di antara 0 sampai 100.';
    }

    if (!form.tanggal_mulai) {
      newErrors.tanggal_mulai = 'Tanggal mulai wajib diisi.';
    }

    if (!form.tanggal_berakhir) {
      newErrors.tanggal_berakhir = 'Tanggal berakhir wajib diisi.';
    }

    if (
      form.tanggal_mulai &&
      form.tanggal_berakhir &&
      form.tanggal_berakhir < form.tanggal_mulai
    ) {
      newErrors.tanggal_berakhir =
        'Tanggal berakhir tidak boleh sebelum tanggal mulai.';
    }

    if (!form.id_layanan) {
      newErrors.id_layanan = 'Pilih layanan promo.';
    }

    if (loadingLayanan || layananError) {
      newErrors.id_layanan =
        layananError || 'Tunggu sampai data layanan selesai dimuat.';
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (submitting || submittingForm || !validate()) return;

    const payload = {
      id_layanan: Number(form.id_layanan),
      deskripsi: form.deskripsi.trim(),
      tipe_diskon: 'persen',
      nilai_diskon: Number(form.diskon_persen),
      tanggal_mulai: form.tanggal_mulai,
      tanggal_berakhir: form.tanggal_berakhir,
      status_promo: form.status_promo,
      gambar_promo: image,
    };

    setSubmittingForm(true);

    try {
      await onSubmit(payload);
    } finally {
      setSubmittingForm(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-screen-2xl space-y-6 pb-10">
      <Link
        to="/promo"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-slate-800"
      >
        <FaArrowLeft />
        <span>Kembali ke Promo</span>
      </Link>

      <form
        onSubmit={handleSubmit}
        className="w-full overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:p-10"
      >
        <div className="grid gap-6">

          {/* Deskripsi */}
          <div>
            <label className="form-label">
              Deskripsi Promo
            </label>

            <textarea
              name="deskripsi"
              value={form.deskripsi}
              onChange={handleChange}
              className="form-input resize-y"
              rows={4}
              placeholder="Jelaskan informasi promo..."
              disabled={formDisabled}
            />

            {errors.deskripsi && (
              <span className="field-error">
                {errors.deskripsi}
              </span>
            )}
          </div>

          {/* Diskon dan tanggal */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="form-label">
                Diskon (%)
              </label>

              <input
                type="number"
                name="diskon_persen"
                value={form.diskon_persen}
                onChange={handleChange}
                className="form-input"
                min="0"
                max="100"
                step="0.01"
                placeholder="25"
                disabled={formDisabled}
              />

              {errors.diskon_persen && (
                <span className="field-error">
                  {errors.diskon_persen}
                </span>
              )}
            </div>

            <div>
              <label className="form-label">
                Tanggal Mulai
              </label>

              <input
                type="date"
                name="tanggal_mulai"
                value={form.tanggal_mulai}
                onChange={handleChange}
                className="form-input"
                disabled={formDisabled}
              />

              {errors.tanggal_mulai && (
                <span className="field-error">
                  {errors.tanggal_mulai}
                </span>
              )}
            </div>

            <div>
              <label className="form-label">
                Tanggal Berakhir
              </label>

              <input
                type="date"
                name="tanggal_berakhir"
                value={form.tanggal_berakhir}
                onChange={handleChange}
                className="form-input"
                disabled={formDisabled}
              />

              {errors.tanggal_berakhir && (
                <span className="field-error">
                  {errors.tanggal_berakhir}
                </span>
              )}
            </div>
          </div>

          {/* Gambar */}
          <div>
            <label className="form-label">
              Gambar Promo
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="form-input"
              disabled={formDisabled}
            />

            {imagePreview && (
              <img
                src={imagePreview}
                alt="Preview gambar promo"
                className="mt-3 h-40 w-full rounded-xl border border-slate-200 object-cover"
              />
            )}

            {mode === 'edit' && initialData?.gambar_promo && !image && (
              <p className="mt-2 text-sm text-slate-500">
                Gambar lama akan tetap digunakan jika tidak memilih gambar baru.
              </p>
            )}

            {errors.gambar_promo && (
              <span className="field-error">
                {errors.gambar_promo}
              </span>
            )}
          </div>

          {/* Layanan tunggal sesuai API saat ini */}
          <div>
            <label className="form-label">
              Layanan Promo
            </label>

            <div
              className="relative"
              ref={serviceDropdownRef}
            >
              {/* Tombol dropdown */}
              <button
                type="button"
                aria-haspopup="listbox"
                aria-expanded={serviceDropdownOpen}
                aria-controls="promo-service-options"
                disabled={serviceDropdownDisabled}
                onClick={() => {
                  setServiceDropdownOpen((prev) => !prev);
                  setServiceSearch('');
                }}
                className={`flex w-full items-center justify-between gap-4 rounded-xl border bg-white px-4 py-3.5 text-left transition-all duration-200 focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 ${
                  errors.id_layanan
                    ? 'border-rose-300 focus:border-rose-400 focus:ring-rose-100'
                    : serviceDropdownOpen
                      ? 'border-sky-400 shadow-sm ring-4 ring-sky-100'
                      : 'border-slate-200 hover:border-sky-300 hover:shadow-sm focus:border-sky-400 focus:ring-sky-100'
                }`}
              >
                <span className="min-w-0 flex-1">
                  <span
                    className={`block truncate text-sm font-semibold ${
                      selectedServiceName
                        ? 'text-slate-800'
                        : 'text-slate-400'
                    }`}
                  >
                    {loadingLayanan
                      ? 'Memuat daftar layanan...'
                      : layananError
                        ? 'Layanan tidak dapat dimuat'
                        : selectedServiceName || 'Pilih layanan promo'}
                  </span>

                  <span className="mt-1 block text-xs font-normal text-slate-500">
                    {selectedServiceName
                      ? 'Layanan ini akan mendapatkan diskon promo.'
                      : 'Pilih satu layanan yang mendapatkan diskon.'}
                  </span>
                </span>

                <span
                  aria-hidden="true"
                  className={`h-2.5 w-2.5 shrink-0 border-b-2 border-r-2 border-slate-500 transition-transform duration-200 ${
                    serviceDropdownOpen
                      ? 'translate-y-1 rotate-[225deg]'
                      : '-translate-y-0.5 rotate-45'
                  }`}
                />
              </button>

              {/* Panel dropdown */}
              {serviceDropdownOpen && !serviceDropdownDisabled && (
                <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10">

                  {/* Header dan pencarian */}
                  <div className="border-b border-slate-100 bg-slate-50/80 p-3">
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Pilih satu layanan
                      </span>

                      <span className="text-xs text-slate-400">
                        {filteredLayanan.length} layanan
                      </span>
                    </div>

                    <input
                      type="search"
                      value={serviceSearch}
                      onChange={(event) =>
                        setServiceSearch(event.target.value)
                      }
                      onKeyDown={(event) => {
                        if (event.key === 'Escape') {
                          setServiceDropdownOpen(false);
                        }
                      }}
                      placeholder="Cari nama layanan..."
                      autoComplete="off"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:ring-4 focus:ring-sky-100"
                    />
                  </div>

                  {/* Daftar layanan */}
                  <div
                    id="promo-service-options"
                    role="listbox"
                    aria-label="Daftar layanan promo"
                    className="max-h-64 overflow-y-auto p-2"
                  >
                    {filteredLayanan.length === 0 ? (
                      <div className="px-3 py-8 text-center">
                        <p className="text-sm font-medium text-slate-600">
                          Layanan tidak ditemukan
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          Coba gunakan kata kunci lain.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {filteredLayanan.map((item) => {
                          const id = getServiceId(item);
                          const isSelected = id === form.id_layanan;

                          return (
                            <button
                              key={id}
                              type="button"
                              role="option"
                              aria-selected={isSelected}
                              onClick={() => handleServiceSelect(item)}
                              className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-3 text-left transition-colors ${
                                isSelected
                                  ? 'border-sky-200 bg-sky-50 text-sky-800'
                                  : 'border-transparent text-slate-700 hover:border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium">
                                  {getServiceName(item)}
                                </span>

                                <span
                                  className={`mt-0.5 block text-xs ${
                                    isSelected
                                      ? 'text-sky-600'
                                      : 'text-slate-400'
                                  }`}
                                >
                                  {isSelected
                                    ? 'Layanan terpilih'
                                    : 'Pilih layanan ini'}
                                </span>
                              </span>

                              {isSelected && (
                                <span className="shrink-0 rounded-full bg-sky-100 px-2.5 py-1 text-[11px] font-semibold text-sky-700">
                                  Dipilih
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {errors.id_layanan && (
              <span className="field-error">
                {errors.id_layanan}
              </span>
            )}

            {layananError && (
              <span className="field-error">
                {layananError}
              </span>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="form-label">
              Status Promo
            </label>

            <div className="mt-2 flex gap-3">
              {['Aktif', 'Tidak Aktif'].map((status) => (
                <button
                  key={status}
                  type="button"
                  disabled={formDisabled}
                  onClick={() => {
                    setForm((prev) => ({
                      ...prev,
                      status_promo: status,
                    }));
                  }}
                  className={`flex-1 rounded-lg border px-4 py-3 text-sm font-semibold transition ${
                    form.status_promo === status
                      ? status === 'Aktif'
                        ? 'border-primary bg-primary-light text-primary-dark'
                        : 'border-danger bg-danger-bg text-danger'
                      : 'border-slate-200 bg-white text-slate-500'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Informasi update */}
        {mode === 'edit' && initialData?.updated_at && (
          <p className="mt-6 text-xs text-slate-400">
            Terakhir diperbarui:{' '}
            {new Date(initialData.updated_at).toLocaleString('id-ID')}
          </p>
        )}

        {/* Tombol aksi */}
        <div className="mt-7 flex flex-col-reverse justify-end gap-3 border-t border-slate-200 pt-5 sm:flex-row">
          <Link
            to="/promo"
            className="btn-outline text-center"
          >
            Batal
          </Link>

          <button
            type="submit"
            className="btn-primary"
            disabled={
              submitting ||
              submittingForm ||
              loadingLayanan ||
              Boolean(layananError)
            }
          >
            {submitting || submittingForm
              ? 'Menyimpan...'
              : mode === 'edit'
                ? 'Simpan Perubahan'
                : 'Tambah Promo'}
          </button>
        </div>
      </form>
    </div>
  );
}
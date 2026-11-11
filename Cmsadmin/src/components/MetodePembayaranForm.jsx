import { useState, useEffect } from "react";
import { getKategoriPembayaranOptions } from "../data/masterMetodePembayaranData.js";

const emptyForm = {
  id: "",
  id_kategori_pembayaran: "",
  nama_metode: "",
  payment_type: "",
  tipe_potongan: "nominal",
  nilai_potongan: 0,
  is_active: true,
  logo: null,
};

const resolveLogoUrl = (value) => {
  const logo = String(value ?? "").trim();

  if (!logo) return "";
  if (/^https?:\/\//i.test(logo)) return logo;
  if (logo.startsWith("/")) return logo;

  return `/storage/${logo.replace(/^storage\/+/, "")}`;
};

export default function MetodePembayaranForm({
  initialData,
  onSubmit,
  submitting,
  mode,
  onCancel,
}) {
  const [form, setForm] = useState(emptyForm);
  const [kategoriOptions, setKategoriOptions] = useState([]);
  const [loadingKategori, setLoadingKategori] = useState(true);
  const [errors, setErrors] = useState({});
  const [currentLogo, setCurrentLogo] = useState("");
  const [logoPreview, setLogoPreview] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadKategori() {
      setLoadingKategori(true);

      try {
        const data = await getKategoriPembayaranOptions();

        if (!cancelled) {
          setKategoriOptions(data || []);
        }
      } catch (error) {
        console.error("Gagal mengambil opsi kategori:", error);
      } finally {
        if (!cancelled) setLoadingKategori(false);
      }
    }

    loadKategori();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    setErrors({});
    setLogoPreview("");

    if (initialData) {
      setForm({
        id: initialData.id ?? initialData.id_metode ?? "",
        id_kategori_pembayaran:
          initialData.id_kategori_pembayaran ?? "",
        nama_metode:
          initialData.nama_metode ?? initialData.nama ?? "",
        payment_type: initialData.payment_type ?? "",
        tipe_potongan: initialData.tipe_potongan ?? "nominal",
        nilai_potongan: initialData.nilai_potongan ?? 0,
        is_active: initialData.is_active ?? true,
        logo: null,
      });

      setCurrentLogo(initialData.logo ?? "");
    } else {
      setForm({ ...emptyForm });
      setCurrentLogo("");
    }
  }, [initialData]);

  useEffect(() => {
    if (!form.logo) {
      setLogoPreview("");
      return undefined;
    }

    const objectUrl = URL.createObjectURL(form.logo);
    setLogoPreview(objectUrl);

    return () => URL.revokeObjectURL(objectUrl);
  }, [form.logo]);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  }

  function handleLogoChange(event) {
    const file = event.target.files?.[0] ?? null;

    if (file && !file.type.startsWith("image/")) {
      setErrors((prev) => ({
        ...prev,
        logo: "File harus berupa gambar.",
      }));

      event.target.value = "";
      return;
    }

    setForm((prev) => ({
      ...prev,
      logo: file,
    }));

    setErrors((prev) => ({
      ...prev,
      logo: "",
    }));
  }

  function validate() {
    const newErrors = {};

    if (!form.id_kategori_pembayaran) {
      newErrors.id_kategori_pembayaran =
        "Kategori pembayaran wajib dipilih";
    }

    if (!form.nama_metode.trim()) {
      newErrors.nama_metode =
        "Nama metode pembayaran wajib diisi";
    }

    if (!form.payment_type.trim()) {
      newErrors.payment_type =
        "Kode payment_type wajib diisi";
    }

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!validate()) return;

    onSubmit({
      ...form,
      nama_metode: form.nama_metode.trim(),
      payment_type: form.payment_type.trim(),
    });
  }

  const displayedLogo =
    logoPreview || resolveLogoUrl(currentLogo);

  return (
    <div className="w-full space-y-6 pb-10">
      <form
        onSubmit={handleSubmit}
        className="w-full space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
      >
        <div>
          <h2 className="text-base font-bold text-slate-900 sm:text-lg">
            {mode === "edit"
              ? "Edit Metode Pembayaran"
              : "Tambah Metode Pembayaran"}
          </h2>

          <p className="mt-0.5 text-sm text-slate-500">
            Kelola informasi dan logo metode pembayaran.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 pt-2 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Kategori Pembayaran
            </label>

            <select
              name="id_kategori_pembayaran"
              value={form.id_kategori_pembayaran}
              onChange={handleChange}
              disabled={loadingKategori || submitting}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="">
                {loadingKategori
                  ? "Memuat kategori..."
                  : "-- Pilih Kategori Pembayaran --"}
              </option>

              {kategoriOptions.map((kategori) => (
                <option key={kategori.id} value={kategori.id}>
                  {kategori.nama}
                </option>
              ))}
            </select>

            {errors.id_kategori_pembayaran && (
              <p className="mt-1.5 text-xs text-rose-500">
                {errors.id_kategori_pembayaran}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Nama Metode Pembayaran
            </label>

            <input
              type="text"
              name="nama_metode"
              value={form.nama_metode}
              onChange={handleChange}
              disabled={submitting}
              placeholder="Nama metode pembayaran"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />

            {errors.nama_metode && (
              <p className="mt-1.5 text-xs text-rose-500">
                {errors.nama_metode}
              </p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Kode Metode (payment_type)
            </label>

            <input
              type="text"
              name="payment_type"
              value={form.payment_type}
              onChange={handleChange}
              disabled={submitting}
              placeholder="Kode dari API pembayaran"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />

            {errors.payment_type && (
              <p className="mt-1.5 text-xs text-rose-500">
                {errors.payment_type}
              </p>
            )}

            <p className="mt-1.5 text-xs text-slate-500">
              Saat edit, gunakan kode asli yang dikembalikan API.
            </p>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Logo Metode Pembayaran
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={handleLogoChange}
              disabled={submitting}
              className="block w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-100 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-slate-700"
            />

            <p className="mt-1.5 text-xs text-slate-500">
              Pilih gambar logo. Jika tidak memilih file baru,
              logo lama tetap digunakan.
            </p>

            {errors.logo && (
              <p className="mt-1.5 text-xs text-rose-500">
                {errors.logo}
              </p>
            )}

            {displayedLogo && (
              <div className="mt-3 flex items-center gap-3 rounded-xl border border-slate-200 p-3">
                <img
                  src={displayedLogo}
                  alt="Logo metode pembayaran"
                  className="h-12 w-20 object-contain"
                  onError={(event) => {
                    event.currentTarget.style.display = "none";
                  }}
                />

                <span className="text-xs text-slate-500">
                  {logoPreview
                    ? "Preview logo baru"
                    : "Logo tersimpan"}
                </span>
              </div>
            )}
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Tipe Potongan
            </label>

            <select
              name="tipe_potongan"
              value={form.tipe_potongan}
              onChange={handleChange}
              disabled={submitting}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            >
              <option value="nominal">Nominal (Rp)</option>
              <option value="persen">Persen (%)</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-600">
              Admin
            </label>

            <input
              type="number"
              name="nilai_potongan"
              value={form.nilai_potongan}
              onChange={handleChange}
              disabled={submitting}
              min="0"
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              placeholder="0"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-600">
            Status Aktif
          </label>

          <div className="flex max-w-sm gap-3">
            <button
              type="button"
              disabled={submitting}
              onClick={() =>
                setForm((prev) => ({ ...prev, is_active: true }))
              }
              className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                form.is_active
                  ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                  : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
              }`}
            >
              Aktif
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={() =>
                setForm((prev) => ({ ...prev, is_active: false }))
              }
              className={`flex-1 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                !form.is_active
                  ? "border-rose-300 bg-rose-50 text-rose-600"
                  : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
              }`}
            >
              Nonaktif
            </button>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-6">
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Batal
          </button>

          <button
            type="submit"
            disabled={submitting || loadingKategori}
            className="rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {submitting
              ? "Menyimpan..."
              : mode === "edit"
                ? "Simpan Perubahan"
                : "Tambah Metode"}
          </button>
        </div>
      </form>
    </div>
  );
}
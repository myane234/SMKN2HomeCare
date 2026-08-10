import { useState, useEffect } from 'react';
import { KATEGORI_ARTIKEL_OPTIONS } from '../data/artikelData';
import RichTextEditor from './RichTextEditor';

const emptyForm = {
  judul_artikel: '',
  kategori_artikel: KATEGORI_ARTIKEL_OPTIONS[0],
  isi_artikel: '',
  gambar_artikel: null, // File object when a new image is chosen
};

export default function ArtikelForm({ initialData, onSubmit, submitting, mode, serverError }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState('');

  useEffect(() => {
    if (initialData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        judul_artikel: initialData.judul_artikel || '',
        kategori_artikel: initialData.kategori_artikel || KATEGORI_ARTIKEL_OPTIONS[0],
        isi_artikel: initialData.isi_artikel || '',
        gambar_artikel: null,
      });
      setPreview(initialData.gambar_artikel || '');
    }
  }, [initialData]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  }

  function handleRichTextChange(html) {
    setForm((prev) => ({ ...prev, isi_artikel: html }));
    setErrors((prev) => ({ ...prev, isi_artikel: '' }));
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm((prev) => ({ ...prev, gambar_artikel: file }));
    setErrors((prev) => ({ ...prev, gambar_artikel: '' }));

    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result);
    reader.readAsDataURL(file);
  }

  function validate() {
    const newErrors = {};
    if (!form.judul_artikel.trim()) newErrors.judul_artikel = 'Judul artikel wajib diisi';
    if (!form.isi_artikel || form.isi_artikel.trim() === '') {
      newErrors.isi_artikel = 'Isi artikel wajib diisi';
    }
    if (mode === 'tambah' && !form.gambar_artikel) {
      newErrors.gambar_artikel = 'Gambar artikel wajib diunggah';
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
    <form className="card max-w-3xl p-5 sm:p-7" onSubmit={handleSubmit}>
      {serverError && (
        <div className="mb-5 rounded-lg bg-danger-bg px-3.5 py-3 text-sm text-danger">
          {serverError}
        </div>
      )}

      <div className="flex flex-col gap-8">
        {/* Row: Judul + Kategori + Gambar */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="flex flex-col">
            <label className="form-label">Judul Artikel</label>
            <input
              type="text"
              name="judul_artikel"
              value={form.judul_artikel}
              onChange={handleChange}
              className="form-input"
              placeholder="Contoh: Cara Menjaga Kesehatan di Rumah"
            />
            {errors.judul_artikel && <span className="field-error">{errors.judul_artikel}</span>}

            <label className="form-label">Kategori</label>
            <select
              name="kategori_artikel"
              value={form.kategori_artikel}
              onChange={handleChange}
              className="form-input"
            >
              {KATEGORI_ARTIKEL_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col">
            <label className="form-label">Gambar Artikel</label>
            <div className="flex flex-col items-center gap-3.5 rounded-card border border-dashed border-slate-200 bg-slate-50 p-5">
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="aspect-video w-full rounded-lg object-cover"
                />
              ) : (
                <div className="flex aspect-video w-full items-center justify-center rounded-lg border border-slate-200 bg-white p-2.5 text-center text-[13px] text-slate-500">
                  Belum ada gambar
                </div>
              )}
              <label className="btn-outline block w-full cursor-pointer text-center">
                Pilih Gambar
                <input type="file" accept="image/*" onChange={handleImageChange} hidden />
              </label>
              {errors.gambar_artikel && <span className="field-error">{errors.gambar_artikel}</span>}
              <p className="text-center text-xs text-slate-400">Maks. 2MB, format gambar</p>
            </div>
          </div>
        </div>

        {/* Isi Artikel – Rich Text Editor */}
        <div className="flex flex-col">
          <label className="form-label mt-0">Isi Artikel</label>
          <RichTextEditor
            key={initialData?.id ? `editor-${initialData.id}` : 'editor-new'}
            value={form.isi_artikel}
            onChange={handleRichTextChange}
            placeholder="Tulis isi artikel di sini..."
            error={!!errors.isi_artikel}
          />
          {errors.isi_artikel && <span className="field-error">{errors.isi_artikel}</span>}
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
          <a href="/artikel" className="btn-outline text-center">
            Batal
          </a>
          <button type="submit" className="btn-primary" disabled={submitting}>
            {submitting
              ? 'Menyimpan...'
              : mode === 'edit'
              ? 'Simpan Perubahan'
              : 'Tambah Artikel'}
          </button>
        </div>
      </div>
    </form>
  );
}

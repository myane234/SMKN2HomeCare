import React, { useState, useRef } from 'react';
import {
  FaFileExcel,
  FaDownload,
  FaUpload,
  FaSpinner,
  FaTimes,
  FaInfoCircle,
} from 'react-icons/fa';
import Swal from 'sweetalert2';
import {
  MASTER_DATA_CONFIG,
  downloadMasterDataTemplate,
  importMasterData,
} from '../data/masterDataImportExport';

/**
 * Komponen Aksi Download Template & Import Excel Master Data
 *
 * @param {Object} props
 * @param {'bank' | 'universitas' | 'agama' | 'pendidikan' | 'bhp' | 'tarif-transport'} props.type - Tipe master data
 * @param {Function} [props.onSuccess] - Callback setelah import berhasil (untuk reload tabel)
 * @param {string} [props.className] - Class tambahan untuk container tombol
 */
export default function MasterDataExcelAction({ type, onSuccess, className = '' }) {
  const config = MASTER_DATA_CONFIG[type] || {
    title: type,
    description: 'Impor master data dari file Excel (.xlsx atau .csv)',
    columns: [],
  };

  const [isDownloading, setIsDownloading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  // ── 1. Handler Download Template ──────────────────────────
  const handleDownloadTemplate = async () => {
    setIsDownloading(true);
    try {
      const filename = await downloadMasterDataTemplate(type);
      Swal.fire({
        icon: 'success',
        title: 'Template Terunduh',
        text: `File "${filename}" berhasil diunduh.`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Download template error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Mengunduh Template',
        text: error?.message || 'Terjadi kesalahan saat mengunduh template.',
        confirmButtonColor: '#e11d48',
      });
    } finally {
      setIsDownloading(false);
    }
  };

  // ── 2. Modal Handlers ─────────────────────────────────────
  const openModal = () => {
    setSelectedFile(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setSelectedFile(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file) => {
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const lowerName = file.name.toLowerCase();
    const isValid = validExtensions.some((ext) => lowerName.endsWith(ext));

    if (!isValid) {
      Swal.fire({
        icon: 'warning',
        title: 'Format Tidak Sesuai',
        text: 'File harus berformat Excel (.xlsx, .xls) atau .csv.',
        confirmButtonColor: '#10b981',
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      Swal.fire({
        icon: 'warning',
        title: 'Ukuran Terlalu Besar',
        text: 'Ukuran file maksimal adalah 5MB.',
        confirmButtonColor: '#10b981',
      });
      return;
    }

    setSelectedFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  // ── 3. Handler Submit Import ──────────────────────────────
  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      Swal.fire({
        icon: 'info',
        title: 'Pilih File',
        text: 'Silakan pilih file Excel terlebih dahulu.',
        confirmButtonColor: '#10b981',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await importMasterData(type, selectedFile);
      setIsModalOpen(false);
      setSelectedFile(null);

      // Render summary feedback
      const summary = result?.summary || {};
      const errors = Array.isArray(result?.errors) ? result.errors : [];
      const hasErrors = errors.length > 0;

      const summaryHtml = `
        <div style="text-align: left; font-size: 14px; color: #475569; margin-top: 10px;">
          <p style="margin-bottom: 12px; font-weight: 600; color: #1e293b;">
            ${result?.message || 'Proses impor data selesai.'}
          </p>
          <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; margin-bottom: 14px;">
            <div style="background: #f1f5f9; padding: 8px 12px; border-radius: 8px;">
              <span style="font-size: 11px; text-transform: uppercase; color: #64748b; font-weight: bold;">Total Data</span>
              <div style="font-size: 18px; font-weight: bold; color: #0f172a;">${summary.total ?? '-'}</div>
            </div>
            <div style="background: #ecfdf5; padding: 8px 12px; border-radius: 8px;">
              <span style="font-size: 11px; text-transform: uppercase; color: #059669; font-weight: bold;">Berhasil</span>
              <div style="font-size: 18px; font-weight: bold; color: #059669;">${summary.berhasil ?? '-'}</div>
            </div>
            <div style="background: #eff6ff; padding: 8px 12px; border-radius: 8px;">
              <span style="font-size: 11px; text-transform: uppercase; color: #2563eb; font-weight: bold;">Ditambah</span>
              <div style="font-size: 16px; font-weight: bold; color: #2563eb;">${summary.ditambah ?? '-'}</div>
            </div>
            <div style="background: #fefce8; padding: 8px 12px; border-radius: 8px;">
              <span style="font-size: 11px; text-transform: uppercase; color: #ca8a04; font-weight: bold;">Diperbarui</span>
              <div style="font-size: 16px; font-weight: bold; color: #ca8a04;">${summary.diperbarui ?? '-'}</div>
            </div>
          </div>
          ${
            summary.gagal > 0
              ? `<div style="background: #fff1f2; color: #e11d48; padding: 8px 12px; border-radius: 8px; font-size: 13px; font-weight: 600; margin-bottom: 10px;">
                  ⚠️ Gagal: ${summary.gagal} data
                </div>`
              : ''
          }
          ${
            hasErrors
              ? `<div style="margin-top: 10px; max-height: 140px; overflow-y: auto; background: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px; padding: 10px; font-size: 12px; color: #be123c;">
                  <strong>Detail Kesalahan:</strong>
                  <ul style="margin: 6px 0 0 16px; padding: 0; list-style: disc;">
                    ${errors.map((err) => `<li>${typeof err === 'object' ? JSON.stringify(err) : err}</li>`).join('')}
                  </ul>
                </div>`
              : ''
          }
        </div>
      `;

      await Swal.fire({
        icon: hasErrors || summary.gagal > 0 ? 'warning' : 'success',
        title: hasErrors || summary.gagal > 0 ? 'Impor Selesai dengan Catatan' : 'Impor Berhasil!',
        html: summaryHtml,
        confirmButtonColor: '#10b981',
        confirmButtonText: 'Selesai',
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Import error:', error);
      Swal.fire({
        icon: 'error',
        title: 'Gagal Mengimpor File',
        text: error?.message || 'Terjadi kesalahan saat memproses file Excel.',
        confirmButtonColor: '#e11d48',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      {/* Tombol Unduh Template */}
      <button
        type="button"
        onClick={handleDownloadTemplate}
        disabled={isDownloading}
        title={`Download Template Excel ${config.title}`}
        className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600 bg-white px-3 py-2 text-xs sm:text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isDownloading ? (
          <FaSpinner className="animate-spin text-emerald-600" />
        ) : (
          <FaDownload className="text-emerald-600" />
        )}
        <span>Template</span>
      </button>

      {/* Tombol Import Excel */}
      <button
        type="button"
        onClick={openModal}
        title={`Import File Excel ${config.title}`}
        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
      >
        <FaUpload />
        <span>Import Excel</span>
      </button>

      {/* Modal Import Excel */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                  <FaFileExcel className="text-lg" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800">
                    Import Excel Master {config.title}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Format: .xlsx atau .csv (maksimal 5MB)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={isSubmitting}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <FaTimes />
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-4">
              {/* Petunjuk / Informasi Import */}
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3.5 text-xs text-emerald-900 space-y-2">
                <div className="flex items-start gap-2">
                  <FaInfoCircle className="mt-0.5 shrink-0 text-emerald-700" />
                  <p className="leading-relaxed">{config.description}</p>
                </div>

                {config.columns && config.columns.length > 0 && (
                  <div className="mt-2 border-t border-emerald-200/60 pt-2">
                    <span className="font-semibold text-emerald-800 block mb-1">
                      Kolom yang dibutuhkan:
                    </span>
                    <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                      {config.columns.map((col) => (
                        <li key={col.name}>
                          <span className="font-mono font-semibold text-emerald-900">
                            {col.name}
                          </span>
                          {col.required && (
                            <span className="text-rose-600 font-bold ml-1 text-[10px] uppercase">
                              (wajib)
                            </span>
                          )}
                          {col.desc && (
                            <span className="text-slate-600 ml-1.5">— {col.desc}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 text-slate-600 border-t border-emerald-200/40">
                  <span>Belum memiliki file template?</span>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    disabled={isDownloading}
                    className="font-semibold text-emerald-700 hover:underline inline-flex items-center gap-1"
                  >
                    <FaDownload className="text-[10px]" />
                    {isDownloading ? 'Mengunduh...' : 'Unduh di sini'}
                  </button>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-6 text-center cursor-pointer transition ${
                  isDragging
                    ? 'border-emerald-500 bg-emerald-50/50'
                    : selectedFile
                      ? 'border-emerald-400 bg-emerald-50/20'
                      : 'border-slate-200 hover:border-emerald-400 hover:bg-slate-50/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {selectedFile ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                      <FaFileExcel className="text-2xl" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800 break-all">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                    <span className="inline-block mt-1 text-xs text-emerald-700 font-semibold hover:underline">
                      Klik untuk ganti file
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
                      <FaUpload className="text-xl" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-700">
                        Klik untuk memilih file atau drag & drop
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        Format .xlsx, .xls, .csv (Maksimal 5MB)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 border-t border-slate-100 px-6 py-4 bg-slate-50/50">
              <button
                type="button"
                onClick={closeModal}
                disabled={isSubmitting}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleImportSubmit}
                disabled={!selectedFile || isSubmitting}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    <span>Mengimpor...</span>
                  </>
                ) : (
                  <>
                    <FaUpload />
                    <span>Upload & Import</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

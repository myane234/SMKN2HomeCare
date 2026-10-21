'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FiArrowLeft,
  FiUpload,
  FiCheckCircle,
  FiDownload,
  FiX,
  FiUser,
  FiCreditCard,
  FiFileText,
  FiAlertCircle,
  FiLoader
} from 'react-icons/fi';
import { getBankList, submitNakesCompletion, downloadPaktaIntegritas } from '@/services/nakesCompletionService';
import { fetchAndStoreProfile } from '@/services/profileService';

export default function NakesCompleteDataPage() {
  const router = useRouter();

  // State Bank
  const [bankList, setBankList] = useState([]);
  const [bankSearch, setBankSearch] = useState('');
  const [selectedBank, setSelectedBank] = useState(null);
  const [isBankDropdownOpen, setIsBankDropdownOpen] = useState(false);
  const bankDropdownRef = useRef(null);

  // State Form Fields
  const [noNpwp, setNoNpwp] = useState('');
  const [namaPemilikRekening, setNamaPemilikRekening] = useState('');
  const [noRekening, setNoRekening] = useState('');

  // State File Uploads
  const [pasFoto, setPasFoto] = useState(null);
  const [pasFotoPreview, setPasFotoPreview] = useState(null);
  const [fotoNpwp, setFotoNpwp] = useState(null);
  const [filePaktaIntegritas, setFilePaktaIntegritas] = useState(null);

  // State UI
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDownloadingPakta, setIsDownloadingPakta] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    getBankList().then(setBankList);

    // Close dropdown on outside click
    const handleClickOutside = (e) => {
      if (bankDropdownRef.current && !bankDropdownRef.current.contains(e.target)) {
        setIsBankDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredBanks = bankList.filter(b =>
    b.nama_bank.toLowerCase().includes(bankSearch.toLowerCase()) ||
    (b.kode_bank || '').toLowerCase().includes(bankSearch.toLowerCase())
  );

  const handlePasFotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setPasFoto(file);
    setPasFotoPreview(URL.createObjectURL(file));
  };

  const handleDownloadPakta = async () => {
    setIsDownloadingPakta(true);
    const result = await downloadPaktaIntegritas();
    if (!result.success) {
      setError(result.message);
    }
    setIsDownloadingPakta(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validasi manual
    if (!pasFoto) { setError('Pas foto wajib diunggah.'); return; }
    if (!noNpwp.trim()) { setError('Nomor NPWP wajib diisi.'); return; }
    if (!fotoNpwp) { setError('Foto/scan NPWP wajib diunggah.'); return; }
    if (!selectedBank) { setError('Nama bank wajib dipilih.'); return; }
    if (!namaPemilikRekening.trim()) { setError('Nama pemilik rekening wajib diisi.'); return; }
    if (!noRekening.trim()) { setError('Nomor rekening wajib diisi.'); return; }
    if (!filePaktaIntegritas) { setError('File pakta integritas wajib diunggah.'); return; }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('pas_foto', pasFoto);
    formData.append('no_npwp', noNpwp);
    formData.append('foto_npwp', fotoNpwp);
    formData.append('id_bank', selectedBank.id_bank);
    formData.append('nama_pemilik_rekening', namaPemilikRekening);
    formData.append('no_rekening', noRekening);
    formData.append('file_pakta_integritas', filePaktaIntegritas);

    const result = await submitNakesCompletion(formData);

    if (result.success) {
      setSuccess(true);
      // Refresh profile di cookie agar is_data_complete terupdate
      await fetchAndStoreProfile();
      setTimeout(() => {
        router.push('/nakes/dashboard');
      }, 2000);
    } else {
      setError(result.message || 'Gagal menyimpan data.');
    }

    setIsSubmitting(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-3xl p-8 shadow-sm text-center max-w-sm w-full">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCheckCircle size={32} className="text-emerald-600" />
          </div>
          <h2 className="font-bold text-lg text-gray-900 mb-2">Data Berhasil Disimpan!</h2>
          <p className="text-sm text-gray-500">Mengalihkan ke dashboard Nakes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans antialiased pb-24">

      {/* HEADER */}
      <div className="bg-blue-600 w-full pt-8 pb-20 px-5 text-white">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <Link href="/profile" className="p-2 -ml-2 rounded-full hover:bg-white/10 transition shrink-0">
            <FiArrowLeft size={22} />
          </Link>
          <div>
            <h1 className="font-bold text-xl leading-tight">Lengkapi Data Mitra</h1>
            <p className="text-xs text-blue-100 mt-1">Diperlukan sebelum akses dashboard</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-2 relative z-10 space-y-4">

        {/* Error Banner */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3">
            <FiAlertCircle className="text-rose-500 shrink-0 mt-0.5" size={18} />
            <p className="text-sm text-rose-700">{error}</p>
            <button onClick={() => setError('')} className="ml-auto text-rose-400 hover:text-rose-600">
              <FiX size={16} />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* ===== SECTION 1: PAS FOTO ===== */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">

            {/* Header Section */}
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2.5 bg-blue-50 rounded-2xl text-blue-600 shrink-0">
                <FiUser size={18} />
              </div>
              <div className="min-w-0">
                <h2 className="font-bold text-sm text-gray-900 leading-tight">Pas Foto Terbaru</h2>
                <p className="text-xs text-gray-500 mt-0.5 leading-normal">Foto formal ukuran 4x6 atau 3x4, format JPG/PNG</p>
              </div>
            </div>

            {/* Upload Area */}
            <label className="block cursor-pointer">
              <input
                type="file"
                accept="image/jpeg,image/png,image/jpg,image/webp"
                onChange={handlePasFotoChange}
                className="hidden"
              />
              {pasFotoPreview ? (
                <div className="relative w-28 h-36 mx-auto rounded-2xl overflow-hidden border-2 border-blue-200 shadow-sm group">
                  <img src={pasFotoPreview} alt="Pas Foto Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition duration-200">
                    <p className="text-white text-xs font-semibold">Ganti Foto</p>
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-200 rounded-2xl py-5 px-4 text-center hover:border-blue-300 hover:bg-blue-50/40 transition">
                  <FiUpload size={22} className="mx-auto text-gray-400 mb-1.5" />
                  <p className="text-sm font-semibold text-gray-700">Klik untuk upload pas foto</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">JPG, PNG, WEBP · Maks 3MB</p>
                </div>
              )}
            </label>
          </div>
          {/* ===== SECTION 2: NPWP ===== */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
                <FiCreditCard size={18} />
              </div>
              <div>
                <h2 className="font-bold text-sm text-gray-900">Data NPWP</h2>
                <p className="text-xs text-gray-500">Nomor dan foto/scan kartu NPWP Anda</p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Nomor NPWP */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nomor NPWP</label>
                <input
                  type="text"
                  value={noNpwp}
                  onChange={(e) => setNoNpwp(e.target.value)}
                  placeholder="Contoh: 12.345.678.9-012.000"
                  maxLength={20}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Upload Foto NPWP */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Foto/Scan NPWP</label>
                <label className="block cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,image/jpeg,image/png,image/jpg"
                    onChange={(e) => setFotoNpwp(e.target.files[0])}
                    className="hidden"
                  />
                  <div className={`border-2 border-dashed rounded-xl p-4 text-center transition hover:border-amber-300 hover:bg-amber-50/50 ${fotoNpwp ? 'border-amber-300 bg-amber-50/50' : 'border-gray-200'}`}>
                    {fotoNpwp ? (
                      <div className="flex items-center justify-center gap-2">
                        <FiCheckCircle size={16} className="text-amber-500" />
                        <span className="text-sm font-medium text-amber-700 truncate max-w-[200px]">{fotoNpwp.name}</span>
                      </div>
                    ) : (
                      <>
                        <FiUpload size={18} className="mx-auto text-gray-400 mb-1" />
                        <p className="text-xs text-gray-500">Klik untuk upload · PDF/JPG/PNG · Maks 3MB</p>
                      </>
                    )}
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* ===== SECTION 3: DATA BANK ===== */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-emerald-50 rounded-xl text-emerald-600">
                <FiCreditCard size={18} />
              </div>
              <div>
                <h2 className="font-bold text-sm text-gray-900">Data Rekening Bank</h2>
                <p className="text-xs text-gray-500">Untuk pencairan honorarium layanan</p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Pilih Bank dengan Logo */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nama Bank</label>
                <div className="relative" ref={bankDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsBankDropdownOpen(!isBankDropdownOpen)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-blue-300 transition"
                  >
                    {selectedBank ? (
                      <div className="flex items-center gap-2.5">
                        {selectedBank.logo_bank ? (
                          <img src={selectedBank.logo_bank} alt={selectedBank.nama_bank} className="h-5 w-8 object-contain" />
                        ) : (
                          <div className="w-8 h-5 bg-blue-100 rounded text-blue-600 text-[10px] font-bold flex items-center justify-center">
                            {selectedBank.kode_bank || selectedBank.nama_bank.substring(0, 3)}
                          </div>
                        )}
                        <span className="font-medium text-gray-800">{selectedBank.nama_bank}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">Pilih bank...</span>
                    )}
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${isBankDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isBankDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-2xl shadow-lg max-h-60 overflow-hidden">
                      <div className="p-2 border-b border-gray-100">
                        <input
                          type="text"
                          value={bankSearch}
                          onChange={(e) => setBankSearch(e.target.value)}
                          placeholder="Cari bank..."
                          autoFocus
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div className="overflow-y-auto max-h-44">
                        {filteredBanks.length === 0 ? (
                          <p className="text-xs text-gray-400 text-center py-4">Bank tidak ditemukan</p>
                        ) : filteredBanks.map(bank => (
                          <button
                            key={bank.id_bank}
                            type="button"
                            onClick={() => { setSelectedBank(bank); setIsBankDropdownOpen(false); setBankSearch(''); }}
                            className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-blue-50 transition text-left"
                          >
                            {bank.logo_bank ? (
                              <img src={bank.logo_bank} alt={bank.nama_bank} className="h-5 w-10 object-contain shrink-0" />
                            ) : (
                              <div className="w-10 h-5 bg-blue-100 rounded text-blue-700 text-[9px] font-bold flex items-center justify-center shrink-0">
                                {bank.kode_bank || bank.nama_bank.substring(0, 3)}
                              </div>
                            )}
                            <span className="text-sm text-gray-800">{bank.nama_bank}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Nama Pemilik Rekening */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nama Pemilik Rekening</label>
                <input
                  type="text"
                  value={namaPemilikRekening}
                  onChange={(e) => setNamaPemilikRekening(e.target.value)}
                  placeholder="Sesuai nama di buku rekening"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Nomor Rekening */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nomor Rekening</label>
                <input
                  type="text"
                  value={noRekening}
                  onChange={(e) => setNoRekening(e.target.value.replace(/\D/g, ''))}
                  placeholder="Nomer rekening anda"
                  maxLength={30}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                />
              </div>
            </div>
          </div>

          {/* ===== SECTION 4: PAKTA INTEGRITAS ===== */}
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
                <FiFileText size={18} />
              </div>
              <div>
                <h2 className="font-bold text-sm text-gray-900">Pakta Integritas</h2>
                <p className="text-xs text-gray-500">Download, tandatangani, lalu upload kembali</p>
              </div>
            </div>

            <div className="space-y-3">
              {/* Step 1: Download Template */}
              <div className="bg-indigo-50 rounded-2xl p-4">
                <p className="text-xs font-semibold text-indigo-800 mb-1">Langkah 1: Download Template</p>
                <p className="text-xs text-indigo-600 mb-3">Unduh file pakta integritas, baca dan tandatangani di atas materai.</p>
                <button
                  type="button"
                  onClick={handleDownloadPakta}
                  disabled={isDownloadingPakta}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition active:scale-95 disabled:opacity-60"
                >
                  {isDownloadingPakta ? (
                    <FiLoader size={14} className="animate-spin" />
                  ) : (
                    <FiDownload size={14} />
                  )}
                  <span>Download Pakta Integritas</span>
                </button>
              </div>

              {/* Step 2: Upload Signed Document */}
              <div>
                <p className="text-xs font-semibold text-gray-600 mb-1.5">Langkah 2: Upload Dokumen yang Sudah Ditandatangani</p>
                <label className="block cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,image/jpeg,image/png,image/jpg"
                    onChange={(e) => setFilePaktaIntegritas(e.target.files[0])}
                    className="hidden"
                  />
                  <div className={`border-2 border-dashed rounded-xl p-4 text-center transition hover:border-indigo-300 hover:bg-indigo-50/50 ${filePaktaIntegritas ? 'border-indigo-300 bg-indigo-50/50' : 'border-gray-200'}`}>
                    {filePaktaIntegritas ? (
                      <div className="flex items-center justify-center gap-2">
                        <FiCheckCircle size={16} className="text-indigo-500" />
                        <span className="text-sm font-medium text-indigo-700 truncate max-w-[220px]">{filePaktaIntegritas.name}</span>
                      </div>
                    ) : (
                      <>
                        <FiUpload size={18} className="mx-auto text-gray-400 mb-1" />
                        <p className="text-xs text-gray-500">Klik untuk upload · PDF/JPG/PNG · Maks 5MB</p>
                      </>
                    )}
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition active:scale-[0.98] disabled:opacity-60 shadow-sm"
          >
            {isSubmitting ? (
              <>
                <FiLoader size={18} className="animate-spin" />
                <span>Menyimpan Data...</span>
              </>
            ) : (
              <>
                <FiCheckCircle size={18} />
                <span>Simpan & Aktifkan Akun</span>
              </>
            )}
          </button>

        </form>
      </div>
    </div>
  );
}

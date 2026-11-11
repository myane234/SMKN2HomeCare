import { URL } from '../utils/getUrl.js';
import { getAuthHeaders } from '../utils/auth.js';

export const MASTER_DATA_CONFIG = {
  bank: {
    title: 'Bank',
    type: 'bank',
    templateEndpoint: '/master-data/template/bank',
    importEndpoint: '/master-data/import/bank',
    description: 'Mengimpor data master bank dari file Excel. Data yang sudah ada (berdasarkan kode_bank) akan di-update, data baru akan di-insert.',
    columns: [
      { name: 'kode_bank', required: false, desc: 'Kode bank (contoh: 008, 002)' },
      { name: 'nama_bank', required: true, desc: 'Nama bank (contoh: Bank Mandiri)' },
      { name: 'is_active', required: false, desc: 'Status aktif (1/0, default 1)' },
    ],
  },
  universitas: {
    title: 'Universitas',
    type: 'universitas',
    templateEndpoint: '/master-data/template/universitas',
    importEndpoint: '/master-data/import/universitas',
    description: 'Mengimpor data master universitas dari file Excel. Data yang sudah ada (berdasarkan nama_universitas) akan di-update.',
    columns: [
      { name: 'nama_universitas', required: true, desc: 'Nama universitas / perguruan tinggi' },
      { name: 'is_active', required: false, desc: 'Status aktif (1/0, default 1)' },
    ],
  },
  agama: {
    title: 'Agama',
    type: 'agama',
    templateEndpoint: '/master-data/template/agama',
    importEndpoint: '/master-data/import/agama',
    description: 'Mengimpor data master agama dari file Excel. Data yang sudah ada (berdasarkan nama_agama) dilewati.',
    columns: [
      { name: 'nama_agama', required: true, desc: 'Nama agama (contoh: Islam, Kristen, dll.)' },
    ],
  },
  pendidikan: {
    title: 'Pendidikan',
    type: 'pendidikan',
    templateEndpoint: '/master-data/template/pendidikan',
    importEndpoint: '/master-data/import/pendidikan',
    description: 'Mengimpor data master pendidikan dari file Excel. Data yang sudah ada (berdasarkan nama_pendidikan) dilewati.',
    columns: [
      { name: 'nama_pendidikan', required: true, desc: 'Jenjang pendidikan (contoh: D3 Keperawatan, S1 Profesi Ners)' },
    ],
  },
  bhp: {
    title: 'BHP Items',
    type: 'bhp',
    templateEndpoint: '/master-data/template/bhp',
    importEndpoint: '/master-data/import/bhp',
    description: 'Mengimpor data master BHP dari file Excel. Data yang sudah ada (berdasarkan nama_bhp) akan di-update. Harga jual dihitung otomatis dari harga_modal + margin.',
    columns: [
      { name: 'nama_bhp', required: true, desc: 'Nama barang / bahan habis pakai' },
      { name: 'harga_modal', required: true, desc: 'Harga modal barang (angka murni)' },
      { name: 'tipe_margin', required: true, desc: 'persen atau nominal' },
      { name: 'nilai_margin', required: true, desc: 'Nilai margin (contoh: 20 jika persen, 5000 jika nominal)' },
      { name: 'is_active', required: false, desc: 'Status aktif (1/0, default 1)' },
    ],
  },
  'tarif-transport': {
    title: 'Tarif Transport',
    type: 'tarif-transport',
    templateEndpoint: '/master-data/template/tarif-transport',
    importEndpoint: '/master-data/import/tarif-transport',
    description: 'Mengimpor data master tarif transport dari file Excel. Setiap baris adalah satu entri tarif. Data yang sudah ada dengan nilai sama dilewati.',
    columns: [
      { name: 'tarif_per_10_km', required: true, desc: 'Nominal Rupiah per 10 km (contoh: 20000)' },
    ],
  },
};

/**
 * Mengunduh template Excel master data.
 * @param {string} type - 'bank' | 'universitas' | 'agama' | 'pendidikan' | 'bhp' | 'tarif-transport'
 */
export async function downloadMasterDataTemplate(type) {
  const endpoint = `${URL}/master-data/template/${type}`;
  const response = await fetch(endpoint, {
    method: 'GET',
    headers: getAuthHeaders({
      Accept: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/octet-stream, application/json',
    }),
  });

  if (!response.ok) {
    let errorMsg = `Gagal mengunduh template (${response.status})`;
    try {
      const errorJson = await response.json();
      if (errorJson?.message) errorMsg = errorJson.message;
    } catch {
      // response is not JSON
    }
    throw new Error(errorMsg);
  }

  // Cek filename dari Content-Disposition header
  let filename = `template_${type}.xlsx`;
  const disposition = response.headers.get('content-disposition');
  if (disposition && disposition.includes('filename=')) {
    const match = disposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
    if (match && match[1]) {
      filename = match[1].replace(/['"]/g, '').trim();
    }
  }

  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);

  return filename;
}

/**
 * Mengimpor file Excel master data (.xlsx atau .csv).
 * @param {string} type - 'bank' | 'universitas' | 'agama' | 'pendidikan' | 'bhp' | 'tarif-transport'
 * @param {File} file - File Excel/CSV (Maksimal 5MB)
 */
export async function importMasterData(type, file) {
  if (!file) {
    throw new Error('Pilih file Excel (.xlsx atau .csv) terlebih dahulu.');
  }

  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    throw new Error('Ukuran file terlalu besar. Maksimal 5MB.');
  }

  const formData = new FormData();
  formData.append('file', file);

  const endpoint = `${URL}/master-data/import/${type}`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: getAuthHeaders({
      Accept: 'application/json',
    }),
    body: formData,
  });

  let result = null;
  try {
    result = await response.json();
  } catch {
    // response is not JSON
  }

  if (!response.ok || (result && result.success === false)) {
    const errorMsg =
      result?.message ||
      (result?.errors && Array.isArray(result.errors) ? result.errors.join(', ') : null) ||
      `Gagal mengimpor file (${response.status})`;
    const err = new Error(errorMsg);
    err.details = result;
    throw err;
  }

  return result;
}

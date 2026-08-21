import { URL } from '../utils/getUrl.js';
import { getAuthHeaders } from '../utils/auth.js';
import { getImageUrl } from './imageHelper.js';

const BASE_URL = `${URL}/banks`;

// Helper untuk parse response JSON & penanganan error sesuai format API
async function parseJsonResponse(response) {
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = body?.message || `Error HTTP: ${response.status}`;
    throw new Error(message);
  }
  return body;
}

// Mapper data dari API response ke Frontend
export function mapBankItem(item) {
  if (!item) return null;
  return {
    id: item.id_bank ?? item.id ?? '',
    nama_bank: item.nama_bank ?? '',
    kode_bank: item.kode_bank ?? '',
    // Memproses "/storage/uploads/..." menjadi URL gambar lengkap
    gambar: getImageUrl(item.gambar ?? ''),
    is_active: Boolean(item.is_active),
    created_by: item.created_by ?? null,
  };
}

// Helper untuk mengubah data form/state frontend menjadi FormData
function toBankFormData(payload) {
  const fd = new FormData();
  
  if (payload.nama_bank !== undefined) fd.append('nama_bank', payload.nama_bank ?? '');
  if (payload.kode_bank !== undefined) fd.append('kode_bank', payload.kode_bank ?? '');
  if (payload.is_active !== undefined) fd.append('is_active', payload.is_active ? '1' : '0');
  
  // Hanya append file jika user mengunggah file baru (objek File)
  if (payload.gambar instanceof File) {
    fd.append('gambar', payload.gambar);
  }

  return fd;
}

// 1. GET ALL BANKS (List Semua Bank - Admin)
export async function getAllBanks() {
  const res = await fetch(`${BASE_URL}`, {
    method: 'GET',
    headers: getAuthHeaders({
      'Content-Type': 'application/json',
    }),
  });

  const json = await parseJsonResponse(res);
  const list = Array.isArray(json.data) ? json.data : (Array.isArray(json) ? json : []);
  return list.map(mapBankItem).filter(Boolean);
}

// 2. CREATE BANK (Tambah Bank Baru - Admin)
export async function createBank(payload) {
  // Jika payload sudah FormData gunakan langsung, jika berupa object biasa konversi pakai helper
  const bodyData = payload instanceof FormData ? payload : toBankFormData(payload);

  const res = await fetch(`${BASE_URL}`, {
    method: 'POST',
    headers: getAuthHeaders(), // Jangan sertakan Content-Type agar boundary FormData diatur otomatis oleh browser
    body: bodyData,
  });

  const json = await parseJsonResponse(res);
  return mapBankItem(json.data || json);
}

// 3. UPDATE BANK (Update Data Bank - Admin)
export async function updateBank(id, payload) {
  const bodyData = payload instanceof FormData ? payload : toBankFormData(payload);
  
  // Trik Laravel: tambahkan _method PUT jika mengirim FormData via POST
  if (!bodyData.has('_method')) {
    bodyData.append('_method', 'PUT');
  }

  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: bodyData,
  });

  const json = await parseJsonResponse(res);
  return mapBankItem(json.data || json);
}

// 4. TOGGLE STATUS BANK (Toggle Status Aktif Bank - Admin)
export async function toggleStatusBank(id) {
  const res = await fetch(`${BASE_URL}/${id}/toggle-status`, {
    method: 'PATCH',
    headers: getAuthHeaders({
      'Content-Type': 'application/json',
    }),
  });

  return parseJsonResponse(res);
}

// 5. DELETE BANK (Hapus Bank - Admin)
export async function deleteBank(id) {
  const res = await fetch(`${BASE_URL}/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders({
      'Content-Type': 'application/json',
    }),
  });

  return parseJsonResponse(res);
}
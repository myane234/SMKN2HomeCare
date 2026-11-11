import { URL } from '../utils/getUrl.js';
import { getAuthHeaders } from '../utils/auth.js';

// --- HELPER FUNCTIONS ---
async function parseJsonResponse(response) {
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    if (body?.errors && typeof body.errors === 'object') {
      const firstErrorKey = Object.keys(body.errors)[0];
      const firstErrorMessage = body.errors[firstErrorKey][0] || body.errors[firstErrorKey];
      throw new Error(firstErrorMessage);
    }
    const message = body?.message ?? `Error ${response.status}: Terjadi kesalahan pada server`;
    throw new Error(message);
  }
  return body;
}

function extractData(body) {
  if (body && typeof body === 'object' && body.data !== undefined) {
    return body.data;
  }
  return body;
}

// --- API FUNCTIONS ---

// 0. GET TIPE KOMPONEN & JENIS NILAI
export async function getTipeKomponenOptions() {
  const res = await fetch(`${URL}/komponen-tarif/kategori`, {
    method: 'GET',
    headers: getAuthHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }),
  });

  const json = await parseJsonResponse(res);
  if (json && json.data) {
    return json.data;
  }
  return { tipe_komponen: [], jenis_nilai: [] };
}

// 1. GET ALL KOMPONEN BIAYA (DENGAN SUPPORT DUA-ARAH UNTUK SEARCH, KATEGORI, DAN STATUS)
export async function getAllKomponenTarif(params = {}) {
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.append('page', params.page);
  if (params.limit) queryParams.append('limit', params.limit);
  if (params.search) queryParams.append('search', params.search);
  
  if (params.kategori || params.tipe_komponen) {
    queryParams.append('kategori', params.kategori || params.tipe_komponen);
  }

  if (params.status !== undefined && params.status !== '') {
    queryParams.append('is_active', params.status);
    queryParams.append('status', params.status);
  }

  const queryString = queryParams.toString() ? `?${queryParams.toString()}` : '';

  const res = await fetch(`${URL}/komponen-biaya${queryString}`, {
    method: 'GET',
    headers: getAuthHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }),
  });

  const json = await parseJsonResponse(res);
  
  if (json && json.data && Array.isArray(json.data)) {
    return json; 
  }
  
  const data = extractData(json);
  return Array.isArray(data) ? { data } : (data ? { data: [data] } : { data: [] });
}

// 2. CREATE NEW KOMPONEN BIAYA
export async function createKomponenTarif(payload) {
  const res = await fetch(`${URL}/komponen-biaya`, {
    method: 'POST',
    headers: getAuthHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }),
    body: JSON.stringify(payload),
  });

  const json = await parseJsonResponse(res);
  return extractData(json);
}

// 3. UPDATE KOMPONEN BIAYA
export async function updateKomponenTarif(id, payload) {
  const res = await fetch(`${URL}/komponen-biaya/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: getAuthHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }),
    body: JSON.stringify(payload),
  });

  const json = await parseJsonResponse(res);
  return extractData(json);
}

// 4. DELETE KOMPONEN BIAYA
export async function deleteKomponenTarif(id) {
  const res = await fetch(`${URL}/komponen-biaya/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: getAuthHeaders({
      'Accept': 'application/json',
    }),
  });

  return await parseJsonResponse(res);
}
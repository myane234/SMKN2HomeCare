import { URL } from '../utils/getUrl.js';
import { getAuthHeaders } from '../utils/auth.js';

/**
 * Helper untuk parsing response JSON dan menangani error HTTP/Laravel
 */
async function parseJsonResponse(response) {
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg =
      body?.message ||
      (body?.errors ? Object.values(body.errors).flat().join(', ') : null) ||
      `Error ${response.status}: Terjadi kesalahan pada server`;

    throw new Error(errorMsg);
  }

  return body;
}

/**
 * Helper untuk mengekstrak data dari wrapper { success, message, data }
 */
function extractData(body) {
  if (body && typeof body === 'object' && body.data !== undefined) {
    return body.data;
  }
  return body;
}

/* ==========================================================
 *                   MASTER PROVINSI / WILAYAH LAYANAN
 * ========================================================== */

/**
 * Ambil semua data wilayah layanan (Provinsi)
 */
export async function getAllWilayahLayanan() {
  const res = await fetch(`${URL}/wilayah-layanan`, {
    method: 'GET',
    headers: getAuthHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }),
  });

  const json = await parseJsonResponse(res);
  const data = extractData(json);
  return Array.isArray(data) ? data : data ? [data] : [];
}

/**
 * Tambah wilayah layanan baru (Provinsi)
 */
export async function createWilayahLayanan(data) {
  const res = await fetch(`${URL}/wilayah-layanan`, {
    method: 'POST',
    headers: getAuthHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }),
    body: JSON.stringify(data),
  });

  const json = await parseJsonResponse(res);
  return extractData(json);
}

/**
 * Update wilayah layanan berdasarkan ID Provinsi
 */
export async function updateWilayahLayanan(idProvinsi, data) {
  const res = await fetch(
    `${URL}/wilayah-layanan/${encodeURIComponent(idProvinsi)}`,
    {
      method: 'PUT',
      headers: getAuthHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }),
      body: JSON.stringify(data),
    }
  );

  const json = await parseJsonResponse(res);
  return extractData(json);
}

/**
 * Hapus wilayah layanan (Provinsi)
 */
export async function deleteWilayahLayanan(idProvinsi) {
  const res = await fetch(
    `${URL}/wilayah-layanan/${encodeURIComponent(idProvinsi)}`,
    {
      method: 'DELETE',
      headers: getAuthHeaders({
        'Accept': 'application/json',
      }),
    }
  );

  return await parseJsonResponse(res);
}

/**
 * Toggle status aktif/non-aktif wilayah layanan (Provinsi)
 */
export async function toggleWilayahLayananStatus(idProvinsi) {
  const res = await fetch(
    `${URL}/wilayah-layanan/${encodeURIComponent(idProvinsi)}/toggle-status`,
    {
      method: 'PATCH',
      headers: getAuthHeaders({
        'Accept': 'application/json',
      }),
    }
  );

  const json = await parseJsonResponse(res);
  return extractData(json);
}

/* ==========================================================
 *                   MASTER KOTA / KABUPATEN
 * ========================================================== */

/**
 * Ambil semua data Kota / Kabupaten
 */
export async function getAllKotaKabupaten() {
  const res = await fetch(`${URL}/kota-kabupaten`, {
    method: 'GET',
    headers: getAuthHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }),
  });

  const json = await parseJsonResponse(res);
  const data = extractData(json);
  return Array.isArray(data) ? data : data ? [data] : [];
}

/**
 * Ambil data Kota / Kabupaten berdasarkan ID
 */
export async function getKotaKabupatenById(idKota) {
  const res = await fetch(
    `${URL}/kota-kabupaten/${encodeURIComponent(idKota)}`,
    {
      method: 'GET',
      headers: getAuthHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }),
    }
  );

  const json = await parseJsonResponse(res);
  return extractData(json);
}

/**
 * Ambil data Kota / Kabupaten berdasarkan ID Provinsi
 */
export async function getKotaKabupatenByProvinsi(idProvinsi) {
  const res = await fetch(
    `${URL}/kota-kabupaten/provinsi/${encodeURIComponent(idProvinsi)}`,
    {
      method: 'GET',
      headers: getAuthHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }),
    }
  );

  const json = await parseJsonResponse(res);
  const data = extractData(json);
  return Array.isArray(data) ? data : data ? [data] : [];
}

/**
 * Tambah Kota / Kabupaten baru
 * Payload: { id_provinsi: number, nama_kota: string }
 */
export async function createKotaKabupaten(data) {
  const res = await fetch(`${URL}/kota-kabupaten`, {
    method: 'POST',
    headers: getAuthHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }),
    body: JSON.stringify(data),
  });

  const json = await parseJsonResponse(res);
  return extractData(json);
}

/**
 * Update Kota / Kabupaten berdasarkan ID Kota
 * Payload: { id_provinsi: number, nama_kota: string }
 */
export async function updateKotaKabupaten(idKota, data) {
  const res = await fetch(
    `${URL}/kota-kabupaten/${encodeURIComponent(idKota)}`,
    {
      method: 'PUT',
      headers: getAuthHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }),
      body: JSON.stringify(data),
    }
  );

  const json = await parseJsonResponse(res);
  return extractData(json);
}

/**
 * Hapus Kota / Kabupaten berdasarkan ID Kota
 */
export async function deleteKotaKabupaten(idKota) {
  const res = await fetch(
    `${URL}/kota-kabupaten/${encodeURIComponent(idKota)}`,
    {
      method: 'DELETE',
      headers: getAuthHeaders({
        'Accept': 'application/json',
      }),
    }
  );

  return await parseJsonResponse(res);
}

/* ==========================================================
 *                   MASTER KELURAHAN
 * ========================================================== */

/**
 * Ambil semua data Kelurahan
 */
export async function getAllKelurahan() {
  const res = await fetch(`${URL}/kelurahan`, {
    method: 'GET',
    headers: getAuthHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }),
  });

  const json = await parseJsonResponse(res);
  const data = extractData(json); // Mengambil isi dari json.data
  return Array.isArray(data) ? data : data ? [data] : [];
}

/**
 * Tambah Kelurahan baru
 * Payload: { id_kelurahan, id_kecamatan, nama_kelurahan }
 */
export async function createKelurahan(data) {
  const res = await fetch(`${URL}/kelurahan`, {
    method: 'POST',
    headers: getAuthHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }),
    body: JSON.stringify(data),
  });

  const json = await parseJsonResponse(res);
  return extractData(json);
}

/**
 * Update Kelurahan
 * Payload: { id_kecamatan, nama_kelurahan }
 */
export async function updateKelurahan(idKelurahan, data) {
  const res = await fetch(
    `${URL}/kelurahan/${encodeURIComponent(idKelurahan)}`,
    {
      method: 'PUT',
      headers: getAuthHeaders({
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      }),
      body: JSON.stringify(data),
    }
  );

  const json = await parseJsonResponse(res);
  return extractData(json);
}

/**
 * Hapus Kelurahan
 */
export async function deleteKelurahan(idKelurahan) {
  const res = await fetch(
    `${URL}/kelurahan/${encodeURIComponent(idKelurahan)}`,
    {
      method: 'DELETE',
      headers: getAuthHeaders({
        'Accept': 'application/json',
      }),
    }
  );

  return await parseJsonResponse(res);
}
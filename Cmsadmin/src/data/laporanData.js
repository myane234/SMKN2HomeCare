import { URL } from '../utils/getUrl.js';
import { getAuthHeaders, handleUnauthorized } from '../utils/auth.js';

async function parseJsonResponse(response) {
  if (response.status === 401) {
    handleUnauthorized();
    throw new Error('Sesi anda telah berakhir');
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.message || `Error ${response.status}: Gagal memuat data laporan`);
  }
  return body;
}

function buildQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '' && val !== 'all') {
      query.append(key, val);
    }
  });
  return query.toString() ? `?${query.toString()}` : '';
}

// --- GET LAPORAN (JSON) ---

export async function getLaporanTransaksi(params = {}) {
  const qs = buildQuery(params);
  const res = await fetch(`${URL}/admin/laporan/transaksi${qs}`, {
    method: 'GET',
    headers: getAuthHeaders({
      Accept: 'application/json',
    }),
  });
  return await parseJsonResponse(res);
}

export async function getLaporanBooking(params = {}) {
  const qs = buildQuery(params);
  const res = await fetch(`${URL}/admin/laporan/booking${qs}`, {
    method: 'GET',
    headers: getAuthHeaders({
      Accept: 'application/json',
    }),
  });
  return await parseJsonResponse(res);
}

export async function getLaporanNakes(params = {}) {
  const qs = buildQuery(params);
  const res = await fetch(`${URL}/admin/laporan/nakes${qs}`, {
    method: 'GET',
    headers: getAuthHeaders({
      Accept: 'application/json',
    }),
  });
  return await parseJsonResponse(res);
}

// --- EXPORT LAPORAN (BLOB / FILE) ---

async function handleExportResponse(res) {
  if (res.status === 401) {
    handleUnauthorized();
    throw new Error('Sesi anda telah berakhir');
  }

  const contentType = res.headers.get('content-type');
  // Jika backend mengembalikan JSON (misalnya pesan error), tangkap sebagai teks/json
  if (contentType && contentType.includes('application/json')) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message || 'Gagal mengunduh file export');
  }

  if (!res.ok) {
    throw new Error(`Error ${res.status}: Gagal mengunduh file export dari server`);
  }

  return await res.blob();
}

export async function exportLaporanBooking(params = {}, format = 'csv') {
  const queryParams = { ...params, format };
  const qs = buildQuery(queryParams);
  const res = await fetch(`${URL}/admin/laporan/booking/export${qs}`, {
    method: 'GET',
    headers: getAuthHeaders({
      Accept: 'application/octet-stream, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/json',
    }),
  });
  return await handleExportResponse(res);
}

export async function exportLaporanTransaksi(params = {}, format = 'csv') {
  const queryParams = { ...params, format };
  const qs = buildQuery(queryParams);
  const res = await fetch(`${URL}/admin/laporan/transaksi/export${qs}`, {
    method: 'GET',
    headers: getAuthHeaders({
      Accept: 'application/octet-stream, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/json',
    }),
  });
  return await handleExportResponse(res);
}

export async function exportLaporanNakes(params = {}, format = 'csv') {
  const queryParams = { ...params, format };
  const qs = buildQuery(queryParams);
  const res = await fetch(`${URL}/admin/laporan/nakes/export${qs}`, {
    method: 'GET',
    headers: getAuthHeaders({
      Accept: 'application/octet-stream, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/json',
    }),
  });
  return await handleExportResponse(res);
}
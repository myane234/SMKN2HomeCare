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

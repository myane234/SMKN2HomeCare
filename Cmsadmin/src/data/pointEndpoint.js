import { URL } from '../utils/getUrl.js';
import { getAuthHeaders, handleUnauthorized } from '../utils/auth.js';

async function parseJsonResponse(response) {
  const body = await response.json().catch(() => null);

  if (response.status === 401) {
    handleUnauthorized();
    throw new Error('Sesi berakhir. Silakan login kembali.');
  }

  if (!response.ok) {
    const message = body?.message ?? 'Terjadi kesalahan pada server';
    throw new Error(message);
  }

  return body;
}

export const POINT_ENDPOINTS = {
  SETTINGS: '/admin/point-settings',
  EXPIRE: '/admin/points/expire',
  HISTORY: '/admin/points/history',
};

// GET Konfigurasi
export async function getPointSettings() {
  const res = await fetch(`${URL}${POINT_ENDPOINTS.SETTINGS}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...getAuthHeaders(),
    },
  });
  const json = await parseJsonResponse(res);
  return json.data || json;
}

// UPDATE Konfigurasi
export async function updatePointSettings(payload) {
  const res = await fetch(`${URL}${POINT_ENDPOINTS.SETTINGS}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(payload),
  });
  return await parseJsonResponse(res);
}

// RUNNER Manual Expire Poin
export async function triggerPointExpire() {
  const res = await fetch(`${URL}${POINT_ENDPOINTS.EXPIRE}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...getAuthHeaders(),
    },
  });
  return await parseJsonResponse(res);
}

// GET Riwayat Poin
export async function getPointHistory(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const endpoint = queryString ? `${POINT_ENDPOINTS.HISTORY}?${queryString}` : POINT_ENDPOINTS.HISTORY;

  const res = await fetch(`${URL}${endpoint}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...getAuthHeaders(),
    },
  });
  return await parseJsonResponse(res);
}
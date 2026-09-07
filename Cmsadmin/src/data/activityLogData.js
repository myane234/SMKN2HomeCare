import { URL } from '../utils/getUrl.js';
import { getAuthHeaders, handleUnauthorized } from '../utils/auth.js';

async function parseJsonResponse(response) {
  if (response.status === 401) {
    handleUnauthorized();
    throw new Error('Sesi anda telah berakhir');
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.message || `Error ${response.status}: Gagal memproses permintaan`);
  }
  return body;
}

export async function getActivityLogs(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, val]) => {
    if (val !== undefined && val !== null && val !== '' && val !== 'all') {
      query.append(key, val);
    }
  });

  const queryString = query.toString() ? `?${query.toString()}` : '';
  const res = await fetch(`${URL}/admin/activity-logs${queryString}`, {
    method: 'GET',
    headers: getAuthHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }),
  });

  return await parseJsonResponse(res);
}

export async function getActivityLogById(id) {
  const res = await fetch(`${URL}/admin/activity-logs/${id}`, {
    method: 'GET',
    headers: getAuthHeaders({
      Accept: 'application/json',
    }),
  });

  return await parseJsonResponse(res);
}

export async function createActivityLog(payload) {
  const res = await fetch(`${URL}/admin/activity-logs`, {
    method: 'POST',
    headers: getAuthHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }),
    body: JSON.stringify(payload),
  });

  return await parseJsonResponse(res);
}

export async function deleteActivityLog(id) {
  const res = await fetch(`${URL}/admin/activity-logs/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders({
      Accept: 'application/json',
    }),
  });

  return await parseJsonResponse(res);
}

export async function clearOldActivityLogs(days = 30) {
  const res = await fetch(`${URL}/admin/activity-logs/clear`, {
    method: 'POST',
    headers: getAuthHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }),
    body: JSON.stringify({ days: Number(days) }),
  });

  return await parseJsonResponse(res);
}

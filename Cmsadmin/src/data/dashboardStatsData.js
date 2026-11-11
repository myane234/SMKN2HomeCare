import { URL } from '../utils/getUrl.js';
import { getAuthHeaders, handleUnauthorized } from '../utils/auth.js';

async function parseJsonResponse(response) {
  if (response.status === 401) {
    handleUnauthorized();
    throw new Error('Sesi anda telah berakhir');
  }

  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.message || `Error ${response.status}: Gagal memuat data statistik dashboard`);
  }
  return body;
}

export async function getDashboardStats() {
  const res = await fetch(`${URL}/admin/dashboard-stats`, {
    method: 'GET',
    headers: getAuthHeaders({
      Accept: 'application/json',
    }),
  });

  const json = await parseJsonResponse(res);
  return json?.data || json;
}

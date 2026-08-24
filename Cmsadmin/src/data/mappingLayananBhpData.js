import { URL } from '../utils/getUrl.js';
import { getAuthHeaders } from '../utils/auth.js';

async function parseJsonResponse(response) {
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(body?.message ?? `Error ${response.status}: Terjadi kesalahan pada server`);
  }
  return body;
}

function extractData(body) {
  return body?.data !== undefined ? body.data : body;
}

export async function getAllBhpItems() {
  const response = await fetch(`${URL}/bhp`, {
    headers: getAuthHeaders({ Accept: 'application/json' }),
  });
  const data = extractData(await parseJsonResponse(response));
  return Array.isArray(data) ? data : data ? [data] : [];
}

export async function getMappingLayananBhp() {
  const response = await fetch(`${URL}/mapping-layanan-bhp`, {
    headers: getAuthHeaders({ Accept: 'application/json' }),
  });
  const data = extractData(await parseJsonResponse(response));
  return Array.isArray(data) ? data : data ? [data] : [];
}

export async function syncMappingLayananBhp(idLayanan, bhpItems) {
  const response = await fetch(`${URL}/mapping-layanan-bhp/${encodeURIComponent(idLayanan)}/sync`, {
    method: 'POST',
    headers: getAuthHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }),
    body: JSON.stringify({ bhp_items: bhpItems }),
  });
  return extractData(await parseJsonResponse(response));
}

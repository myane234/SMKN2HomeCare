import { URL } from '../utils/getUrl.js';
import { getAuthHeaders } from '../utils/auth.js';

async function parseResponse(response) {
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || `Error ${response.status}`);
  return body;
}

function dataFrom(body) {
  return body?.data !== undefined ? body.data : body;
}

export async function getKategoriTarif() {
  const body = await parseResponse(await fetch(`${URL}/master-kategori-tarif`, {
    headers: getAuthHeaders({ Accept: 'application/json' }),
  }));
  const data = dataFrom(body);
  return Array.isArray(data) ? data : data ? [data] : [];
}

async function saveKategoriTarif(method, id, payload) {
  const response = await fetch(`${URL}/master-kategori-tarif${id ? `/${encodeURIComponent(id)}` : ''}`, {
    method,
    headers: getAuthHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }),
    body: JSON.stringify(payload),
  });
  return dataFrom(await parseResponse(response));
}

export const createKategoriTarif = (payload) => saveKategoriTarif('POST', null, payload);
export const updateKategoriTarif = (id, payload) => saveKategoriTarif('PUT', id, payload);

export async function deleteKategoriTarif(id) {
  await parseResponse(await fetch(`${URL}/master-kategori-tarif/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: getAuthHeaders({ Accept: 'application/json' }),
  }));
}

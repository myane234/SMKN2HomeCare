import { URL } from '../utils/getUrl.js';
import { getAuthHeaders } from '../utils/auth.js';

async function parseJsonResponse(response) {
  const body = await response.json().catch(() => null);
  if (!response.ok) {
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

export async function getAllActiveNakes() {
  const res = await fetch(`${URL}/super-admin/nakes`, {
    method: 'GET',
    headers: getAuthHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }),
  });

  const json = await parseJsonResponse(res);
  const data = extractData(json);
  return Array.isArray(data) ? data : (data ? [data] : []);
}

export async function getKategoriLayanan() {
  const res = await fetch(`${URL}/layanan/kategori`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
  });

  const json = await parseJsonResponse(res);
  const data = extractData(json);
  return Array.isArray(data) ? data : (data ? [data] : []);
}

export async function updateNakesData(id, formData) {
  // Use FormData because we might upload a file
  const res = await fetch(`${URL}/super-admin/nakes/${id}`, {
    method: 'POST', // POST with _method=PUT to handle multipart/form-data
    headers: getAuthHeaders({
        'Accept': 'application/json',
    }),
    body: formData,
  });

  return await parseJsonResponse(res);
}

export async function deleteNakesData(id) {
  const res = await fetch(`${URL}/super-admin/nakes/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders({
        'Accept': 'application/json',
    }),
  });

  return await parseJsonResponse(res);
}

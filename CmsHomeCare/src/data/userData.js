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

export async function getAllUsers() {
  const res = await fetch(`${URL}/admin/pasien`, {
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

export async function updateUserData(idPasien, data) {
  const res = await fetch(`${URL}/admin/pasien/${encodeURIComponent(idPasien)}`, {
    method: 'PUT',
    headers: getAuthHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }),
    body: JSON.stringify(data),
  });

  const json = await parseJsonResponse(res);
  return extractData(json);
}

export async function deleteUserData(idPasien) {
  const res = await fetch(`${URL}/admin/pasien/${encodeURIComponent(idPasien)}`, {
    method: 'DELETE',
    headers: getAuthHeaders({
      'Accept': 'application/json',
    }),
  });

  return await parseJsonResponse(res);
}

export async function toggleUserStatus(idPasien) {
  const res = await fetch(`${URL}/admin/pasien/${encodeURIComponent(idPasien)}`, {
    method: 'PATCH',
    headers: getAuthHeaders({
      'Accept': 'application/json',
    }),
  });

  const json = await parseJsonResponse(res);
  return extractData(json);
}
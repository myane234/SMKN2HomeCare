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

export async function getAllTarif() {
  const res = await fetch(`${URL}/master-tarif`, {
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

export async function createTarifData(data) {
  const res = await fetch(`${URL}/master-tarif`, {
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

export async function updateTarifData(idMasterTarif, data) {
  const res = await fetch(`${URL}/master-tarif/${encodeURIComponent(idMasterTarif)}`, {
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

export async function deleteTarifData(idMasterTarif) {
  const res = await fetch(`${URL}/master-tarif/${encodeURIComponent(idMasterTarif)}`, {
    method: 'DELETE',
    headers: getAuthHeaders({
      'Accept': 'application/json',
    }),
  });

  return await parseJsonResponse(res);
}
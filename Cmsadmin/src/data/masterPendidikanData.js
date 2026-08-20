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

// ── Master Pendidikan ──────────────────────────────────────────────────────

export async function getAllPendidikan() {
  const res = await fetch(`${URL}/master-pendidikan`, {
    method: 'GET',
    headers: getAuthHeaders({ 'Accept': 'application/json' }),
  });
  const json = await parseJsonResponse(res);
  const data = extractData(json);
  return Array.isArray(data) ? data : (data ? [data] : []);
}

export async function getPendidikanById(id) {
  const res = await fetch(`${URL}/master-pendidikan/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: getAuthHeaders({ 'Accept': 'application/json' }),
  });
  const json = await parseJsonResponse(res);
  return extractData(json);
}

export async function createPendidikan(data) {
  const res = await fetch(`${URL}/master-pendidikan`, {
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

export async function updatePendidikan(id, data) {
  const res = await fetch(`${URL}/master-pendidikan/${encodeURIComponent(id)}`, {
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

export async function deletePendidikan(id) {
  const res = await fetch(`${URL}/master-pendidikan/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: getAuthHeaders({ 'Accept': 'application/json' }),
  });
  return await parseJsonResponse(res);
}
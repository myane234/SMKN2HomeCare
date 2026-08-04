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

export async function getAllNakesRequests() {
  const res = await fetch(`${URL}/admin/nakes/requests`, {
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

export async function getNakesRequestById(id) {
  const res = await fetch(`${URL}/admin/nakes/requests/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: getAuthHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }),
  });

  const json = await parseJsonResponse(res);
  return extractData(json);
}

export async function approveNakesRequest(id) {
  const res = await fetch(`${URL}/admin/nakes/requests/${encodeURIComponent(id)}/approve`, {
    method: 'POST',
    headers: getAuthHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }),
  });

  const json = await parseJsonResponse(res);
  return extractData(json);
}

// 🟢 Tambahkan fungsi untuk status Pelatihan
export async function pelatihanNakesRequest(id, adminNotes = '') {
  const res = await fetch(`${URL}/admin/nakes/requests/${encodeURIComponent(id)}/pelatihan`, {
    method: 'POST',
    headers: getAuthHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }),
    body: JSON.stringify({ admin_notes: adminNotes }),
  });

  const json = await parseJsonResponse(res);
  return extractData(json);
}

export async function rejectNakesRequest(id, adminNotes = '') {
  const res = await fetch(`${URL}/admin/nakes/requests/${encodeURIComponent(id)}/reject`, {
    method: 'POST',
    headers: getAuthHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }),
    body: JSON.stringify({ admin_notes: adminNotes }),
  });

  const json = await parseJsonResponse(res);
  return extractData(json);
}
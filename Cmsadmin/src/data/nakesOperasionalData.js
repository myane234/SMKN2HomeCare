import { URL } from '../utils/getUrl.js';
import { getAuthHeaders } from '../utils/auth.js';

async function parseJsonResponse(response) {
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    const message = body?.message ?? `Error ${response.status}: Terjadi kesalahan server`;
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

// GET api/admin/operasional-nakes
export async function getAllOperasionalNakes() {
  const res = await fetch(`${URL}/admin/operasional-nakes`, {
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

// GET api/admin/operasional-nakes/{id}
export async function getOperasionalNakesById(id) {
  const res = await fetch(`${URL}/admin/operasional-nakes/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: getAuthHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }),
  });

  const json = await parseJsonResponse(res);
  return extractData(json);
}

// POST api/admin/operasional-nakes/{id}/approve
export async function approveOperasionalNakes(id) {
  const res = await fetch(`${URL}/admin/operasional-nakes/${encodeURIComponent(id)}/approve`, {
    method: 'POST',
    headers: getAuthHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }),
  });

  const json = await parseJsonResponse(res);
  return extractData(json);
}

// POST api/admin/operasional-nakes/{id}/reject
export async function rejectOperasionalNakes(id, adminNotes = '') {
  const res = await fetch(`${URL}/admin/operasional-nakes/${encodeURIComponent(id)}/reject`, {
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
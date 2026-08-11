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

// Response API selalu flat: { success, message, data: [...] }
function extractData(body) {
  if (body && typeof body === 'object' && body.data !== undefined) {
    return body.data;
  }
  return body;
}

// Field ID dari dokumentasi API sudah pasti: id_tarif_transport
// Fallback lain tetap dijaga untuk keamanan
export function getTarifId(item) {
  if (!item || typeof item !== 'object') return null;
  const id =
    item.id_transport ??
    item.id ??
    item.id_tarif ??
    item.id_master ??
    null;
  return id !== null && id !== undefined ? id : null;
}

// 1. GET ALL
export async function getAllTarifTransport() {
  const res = await fetch(`${URL}/tarif-transport`, {
    method: 'GET',
    headers: getAuthHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }),
  });

  const json = await parseJsonResponse(res);
  const data = extractData(json);
  const list = Array.isArray(data) ? data : (data ? [data] : []);

  console.log('TARIF LIST:', list);
  if (list.length > 0) {
    console.log('CONTOH ID ITEM PERTAMA:', getTarifId(list[0]));
  }

  return list;
}

// 2. GET BY ID (opsional, kalau butuh nanti)
export async function getTarifTransportById(id) {
  if (id === null || id === undefined) {
    throw new Error('ID tarif transport tidak valid.');
  }

  const res = await fetch(`${URL}/tarif-transport/${id}`, {
    method: 'GET',
    headers: getAuthHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }),
  });

  const json = await parseJsonResponse(res);
  return extractData(json);
}

// 3. CREATE
export async function createTarifTransport(payload) {
  console.log('CREATE PAYLOAD:', payload);

  const res = await fetch(`${URL}/tarif-transport`, {
    method: 'POST',
    headers: getAuthHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }),
    body: JSON.stringify(payload),
  });

  const json = await parseJsonResponse(res);
  return extractData(json);
}

// 4. UPDATE
export async function updateTarifTransport(id, payload) {
  if (id === null || id === undefined) {
    throw new Error('ID tarif transport tidak valid, tidak bisa update.');
  }

  console.log('UPDATE ID:', id);
  console.log('UPDATE PAYLOAD:', payload);

  const res = await fetch(`${URL}/tarif-transport/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }),
    body: JSON.stringify(payload),
  });

  const json = await parseJsonResponse(res);
  return extractData(json);
}

// 5. DELETE
export async function deleteTarifTransport(id) {
  if (id === null || id === undefined) {
    throw new Error('ID tarif transport tidak valid, tidak bisa hapus.');
  }

  console.log('DELETE ID:', id);

  const res = await fetch(`${URL}/tarif-transport/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders({
      'Accept': 'application/json',
    }),
  });

  return await parseJsonResponse(res);
}
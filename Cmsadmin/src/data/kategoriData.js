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

// ── Kategori Layanan ──────────────────────────────────────────────────────────

export async function getAllKategoriLayanan() {
  const res = await fetch(`${URL}/layanan/kategori`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });
  const json = await parseJsonResponse(res);
  const data = extractData(json);
  return Array.isArray(data) ? data : (data ? [data] : []);
}

export async function getKategoriLayananById(id) {
  const res = await fetch(`${URL}/layanan/kategori/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: getAuthHeaders({ 'Accept': 'application/json' }),
  });
  const json = await parseJsonResponse(res);
  return extractData(json);
}

export async function createKategoriLayanan(data) {
  const res = await fetch(`${URL}/layanan/kategori`, {
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

export async function updateKategoriLayanan(id, data) {
  const res = await fetch(`${URL}/layanan/kategori/${encodeURIComponent(id)}`, {
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

export async function deleteKategoriLayanan(id) {
  const res = await fetch(`${URL}/layanan/kategori/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: getAuthHeaders({ 'Accept': 'application/json' }),
  });
  return await parseJsonResponse(res);
}

// ── Kategori Artikel ──────────────────────────────────────────────────────────

export async function getAllKategoriArtikel() {
  const res = await fetch(`${URL}/resource/content/artikel/kategori`, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });
  const json = await parseJsonResponse(res);
  const data = extractData(json);
  return Array.isArray(data) ? data : (data ? [data] : []);
}

export async function getKategoriArtikelById(id) {
  const res = await fetch(`${URL}/resource/content/artikel/kategori/${encodeURIComponent(id)}`, {
    method: 'GET',
    headers: getAuthHeaders({ 'Accept': 'application/json' }),
  });
  const json = await parseJsonResponse(res);
  return extractData(json);
}

export async function createKategoriArtikel(data) {
  const res = await fetch(`${URL}/resource/content/artikel/kategori`, {
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

export async function updateKategoriArtikel(id, data) {
  const res = await fetch(`${URL}/resource/content/artikel/kategori/${encodeURIComponent(id)}`, {
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

export async function deleteKategoriArtikel(id) {
  const res = await fetch(`${URL}/resource/content/artikel/kategori/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: getAuthHeaders({ 'Accept': 'application/json' }),
  });
  return await parseJsonResponse(res);
}

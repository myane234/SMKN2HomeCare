
import { URL } from '../utils/getUrl.js';
import { getAuthHeaders } from '../utils/auth.js';

function buildHeaders() {
  return getAuthHeaders({
    Accept: 'application/json',
  });
}

async function parseJsonResponse(response) {
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      body?.message ||
      body?.errors
        ? body?.message || 'Data yang dikirim tidak valid.'
        : `Error ${response.status}: Terjadi kesalahan.`;

    throw new Error(message);
  }

  return body;
}

function extractData(body) {
  return body?.data !== undefined ? body.data : body;
}

function normalizePromo(raw) {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const layanan = raw.layanan ?? null;

  return {
    ...raw,

    id: raw.id ?? raw.id_promo,
    id_promo: raw.id_promo ?? raw.id,

    id_layanan:
      raw.id_layanan ??
      layanan?.id_layanan ??
      null,

    deskripsi: raw.deskripsi ?? '',

    tipe_diskon: raw.tipe_diskon ?? 'persen',
    nilai_diskon: raw.nilai_diskon ?? '',

    tanggal_mulai: raw.tanggal_mulai ?? '',
    tanggal_berakhir: raw.tanggal_berakhir ?? '',

    status_promo: raw.status_promo ?? 'Tidak Aktif',
    status_aktual: raw.status_aktual ?? raw.status_promo ?? null,

    layanan,

    gambar_promo:
      raw.gambar_promo ??
      raw.gambar_promo_url ??
      null,

    gambar_promo_url:
      raw.gambar_promo_url ?? null,

    created_at: raw.created_at ?? null,
    updated_at: raw.updated_at ?? null,
  };
}

function createPromoFormData(payload) {
  const formData = new FormData();

  Object.entries(payload).forEach(([key, value]) => {
    if (value === null || value === undefined || value === '') {
      return;
    }

    if (value instanceof File) {
      formData.append(key, value);
      return;
    }

    formData.append(key, String(value));
  });

  return formData;
}

export async function getAllPromo() {
  const response = await fetch(`${URL}/promo`, {
    method: 'GET',
    headers: buildHeaders(),
  });

  const body = await parseJsonResponse(response);
  const data = extractData(body);

  if (!Array.isArray(data)) {
    throw new Error('Format response daftar promo tidak valid.');
  }

  return data.map(normalizePromo).filter(Boolean);
}

export async function getPromoById(id_promo) {
  const response = await fetch(
    `${URL}/promo/${encodeURIComponent(id_promo)}`,
    {
      method: 'GET',
      headers: buildHeaders(),
    }
  );

  const body = await parseJsonResponse(response);
  const data = normalizePromo(extractData(body));

  if (!data) {
    throw new Error('Data promo tidak ditemukan.');
  }

  return data;
}

export async function createPromo(payload) {
  const formData = createPromoFormData(payload);

  const response = await fetch(`${URL}/promo`, {
    method: 'POST',
    headers: buildHeaders(),
    body: formData,
  });

  const body = await parseJsonResponse(response);

  return normalizePromo(extractData(body));
}

export async function updatePromo(id_promo, payload) {
  const formData = createPromoFormData(payload);

  // Laravel menerima multipart update melalui method spoofing.
  formData.append('_method', 'PUT');

  const response = await fetch(
    `${URL}/promo/${encodeURIComponent(id_promo)}`,
    {
      method: 'POST',
      headers: buildHeaders(),
      body: formData,
    }
  );

  const body = await parseJsonResponse(response);

  return normalizePromo(extractData(body));
}

export async function deletePromo(id_promo) {
  const response = await fetch(
    `${URL}/promo/${encodeURIComponent(id_promo)}`,
    {
      method: 'DELETE',
      headers: buildHeaders(),
    }
  );

  await parseJsonResponse(response);

  return true;
}

import { URL } from '../utils/getUrl.js';
import { getAuthHeaders } from '../utils/auth.js';
import { resolveImageUrl } from '../utils/resolveImage.js';

const BASE_URL = `${URL}/banks`;

async function parseJsonResponse(response) {
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      body?.message || `Error HTTP: ${response.status}`;

    throw new Error(message);
  }

  return body;
}

export function mapBankItem(item) {
  if (!item) return null;

  return {
    id: item.id_bank ?? item.id ?? '',
    nama_bank: item.nama_bank ?? '',
    kode_bank: item.kode_bank ?? '',
    gambar: resolveImageUrl(item.gambar ?? ''),
    is_active: Boolean(item.is_active),
    created_by: item.created_by ?? null,
    created_at: item.created_at ?? null,
    updated_at: item.updated_at ?? null,
  };
}

export async function getAllBanks() {
  const response = await fetch(BASE_URL, {
    method: 'GET',
    headers: getAuthHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }),
  });

  const json = await parseJsonResponse(response);

  const list = Array.isArray(json.data)
    ? json.data
    : Array.isArray(json)
      ? json
      : [];

  return list
    .map(mapBankItem)
    .filter(Boolean);
}

export async function createBank(payload) {
  const formData =
    payload instanceof FormData
      ? payload
      : new FormData();

  if (!(payload instanceof FormData)) {
    formData.append(
      'nama_bank',
      payload.nama_bank ?? ''
    );

    formData.append(
      'kode_bank',
      payload.kode_bank ?? ''
    );

    formData.append(
      'is_active',
      payload.is_active ? '1' : '0'
    );

    if (payload.gambar instanceof File) {
      formData.append('gambar', payload.gambar);
    }
  }

  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });

  const json = await parseJsonResponse(response);

  return mapBankItem(json.data || json);
}

export async function updateBank(id, payload) {
  const formData =
    payload instanceof FormData
      ? payload
      : new FormData();

  if (!(payload instanceof FormData)) {
    formData.append(
      'nama_bank',
      payload.nama_bank ?? ''
    );

    formData.append(
      'kode_bank',
      payload.kode_bank ?? ''
    );

    formData.append(
      'is_active',
      payload.is_active ? '1' : '0'
    );

    if (payload.gambar instanceof File) {
      formData.append('gambar', payload.gambar);
    }
  }

  const response = await fetch(
    `${BASE_URL}/${id}`,
    {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: formData,
    }
  );

  const json = await parseJsonResponse(response);

  return mapBankItem(json.data || json);
}

export async function toggleStatusBank(id) {
  const response = await fetch(
    `${BASE_URL}/${id}/toggle-status`,
    {
      method: 'PATCH',
      headers: getAuthHeaders({
        'Content-Type': 'application/json',
        Accept: 'application/json',
      }),
    }
  );

  return parseJsonResponse(response);
}

export async function deleteBank(id) {
  const response = await fetch(
    `${BASE_URL}/${id}`,
    {
      method: 'DELETE',
      headers: getAuthHeaders({
        'Content-Type': 'application/json',
        Accept: 'application/json',
      }),
    }
  );

  return parseJsonResponse(response);
}
import { URL } from '../utils/getUrl.js';
import { getAuthHeaders } from '../utils/auth.js';

const BASE_URL = `${URL}/konfigurasi-env`;

async function parseJsonResponse(response) {
  const body = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(
      body?.message || `Error HTTP: ${response.status}`
    );
  }

  return body;
}

export async function getKonfigurasiEnv() {
  const response = await fetch(BASE_URL, {
    method: 'GET',
    headers: getAuthHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }),
  });

  return parseJsonResponse(response);
}

export async function updateKonfigurasiEnv(payload) {
  const response = await fetch(BASE_URL, {
    method: 'POST',
    headers: getAuthHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    }),
    body: JSON.stringify(payload),
  });

  return parseJsonResponse(response);
}
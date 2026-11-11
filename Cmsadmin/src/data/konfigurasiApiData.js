import { URL } from '../utils/getUrl.js';
import { getAuthHeaders } from '../utils/auth.js';

const BASE_URL = `${URL}/konfigurasi-env`;

async function parseJsonResponse(response) {
  const text = await response.text();
  let body = null;
  
  try {
    body = text ? JSON.parse(text) : null;
  } catch (e) {
    body = null;
  }

  if (!response.ok) {
    throw new Error(
      body?.message || `Terjadi kesalahan pada server (HTTP ${response.status})`
    );
  }

  return body;
}

export async function getKonfigurasiEnv() {
  try {
    const response = await fetch(BASE_URL, {
      method: 'GET',
      headers: getAuthHeaders({
        'Content-Type': 'application/json',
        Accept: 'application/json',
      }),
    });

    return await parseJsonResponse(response);
  } catch (err) {
    console.error('Error saat mengambil konfigurasi env:', err);
    throw err;
  }
}

export async function updateKonfigurasiEnv(payload) {
  try {
    const response = await fetch(BASE_URL, {
      method: 'POST', // Kembali ke POST
      headers: getAuthHeaders({
        'Content-Type': 'application/json',
        Accept: 'application/json',
      }),
      body: JSON.stringify(payload),
    });

    return await parseJsonResponse(response);
  } catch (err) {
    console.error('Error saat memperbarui konfigurasi env:', err);
    throw err;
  }
}
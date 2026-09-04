import { getAuthHeaders } from './auth';

export const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

async function handleResponse(res) {
  const isJson = res.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message =
      body?.message ||
      (body?.errors && Object.values(body.errors).flat().join(', ')) ||
      `Request gagal (${res.status})`;
    throw new Error(message);
  }
  return body;
}

export async function apiGet(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: getAuthHeaders({ Accept: 'application/json' }),
  });
  return handleResponse(res);
}

export async function apiPostJson(path, data) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' }),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function apiPutJson(path, data) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    headers: getAuthHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' }),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function apiPatch(path, data = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PATCH',
    headers: getAuthHeaders({ 'Content-Type': 'application/json', Accept: 'application/json' }),
    body: JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function apiPostForm(path, formData) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });
  return handleResponse(res);
}

export async function apiPutForm(path, formData) {
  formData.append('_method', 'PUT');
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });
  return handleResponse(res);
}

export async function apiDelete(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'DELETE',
    headers: getAuthHeaders({ Accept: 'application/json' }),
  });
  return handleResponse(res);
}

export const api = {
  get: apiGet,
  post: apiPostJson,
  postForm: apiPostForm,
  put: apiPutJson,
  putForm: apiPutForm,
  patch: apiPatch,
  delete: apiDelete,
};

export default api;

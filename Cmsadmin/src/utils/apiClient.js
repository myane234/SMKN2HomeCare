// Generic fetch wrapper for the Laravel API.
import { URL as BASE_URL } from "./getUrl.js";
import { getAuthHeaders, handleUnauthorized } from "./auth.js";

export { BASE_URL };

async function handleResponse(res) {
  if (res.status === 401) {
    handleUnauthorized();
    throw new Error('Sesi anda telah berakhir');
  }
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
  const fullUrl = path.startsWith("http") ? path : `${BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  const res = await fetch(fullUrl, { headers: getAuthHeaders() });
  return handleResponse(res);
}

export async function apiPost(path, data) {
  const fullUrl = path.startsWith("http") ? path : `${BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  const isFormData = typeof FormData !== "undefined" && data instanceof FormData;
  const res = await fetch(fullUrl, {
    method: 'POST',
    headers: getAuthHeaders(isFormData ? {} : { 'Content-Type': 'application/json' }),
    body: isFormData ? data : JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function apiPut(path, data) {
  const fullUrl = path.startsWith("http") ? path : `${BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  const isFormData = typeof FormData !== "undefined" && data instanceof FormData;
  const res = await fetch(fullUrl, {
    method: 'PUT',
    headers: getAuthHeaders(isFormData ? {} : { 'Content-Type': 'application/json' }),
    body: isFormData ? data : JSON.stringify(data),
  });
  return handleResponse(res);
}

export async function apiDelete(path) {
  const fullUrl = path.startsWith("http") ? path : `${BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  const res = await fetch(fullUrl, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  return handleResponse(res);
}

const api = {
  get: (path) => apiGet(path),
  post: (path, data) => apiPost(path, data),
  put: (path, data) => apiPut(path, data),
  delete: (path) => apiDelete(path),
};

export default api;

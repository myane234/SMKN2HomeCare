// Generic fetch wrapper for the Laravel API.
// Change VITE_API_BASE_URL in your .env file to match your backend
// (e.g. http://localhost:8000/api or https://citra.faaruq.com/api).

const rawBase = import.meta.env.VITE_API_BASE_URL || 'https://citra.faaruq.com/api';
export const BASE_URL = rawBase.endsWith('/api') ? rawBase : `${rawBase.replace(/\/+$/, '')}/api`;

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
  const url = path.startsWith('/api') ? `${BASE_URL.replace(/\/api$/, '')}${path}` : `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  const res = await fetch(url);
  return handleResponse(res);
}

export async function apiPostForm(path, formData) {
  const url = path.startsWith('/api') ? `${BASE_URL.replace(/\/api$/, '')}${path}` : `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  const res = await fetch(url, {
    method: 'POST',
    body: formData,
  });
  return handleResponse(res);
}

export async function apiPutForm(path, formData) {
  formData.append('_method', 'PUT');
  const url = path.startsWith('/api') ? `${BASE_URL.replace(/\/api$/, '')}${path}` : `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  const res = await fetch(url, {
    method: 'POST',
    body: formData,
  });
  return handleResponse(res);
}

export async function apiDelete(path) {
  const url = path.startsWith('/api') ? `${BASE_URL.replace(/\/api$/, '')}${path}` : `${BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
  const res = await fetch(url, { method: 'DELETE' });
  return handleResponse(res);
}

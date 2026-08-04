// Generic fetch wrapper for the Laravel API.
// Change VITE_API_BASE_URL in your .env file to match your backend
// (e.g. http://localhost:8000 for `php artisan serve`, or http://localhost
// if you're using Laravel Herd/Valet on port 80).

export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://citra.faaruq.com';

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
  const res = await fetch(`${BASE_URL}${path}`);
  return handleResponse(res);
}

export async function apiPostForm(path, formData) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse(res);
}

export async function apiPutForm(path, formData) {
  // Laravel workaround: multipart PUT/PATCH requests don't populate $_FILES
  // properly in PHP, so we POST with a `_method` override field instead.
  formData.append('_method', 'PUT');
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    body: formData,
  });
  return handleResponse(res);
}

export async function apiDelete(path) {
  const res = await fetch(`${BASE_URL}${path}`, { method: 'DELETE' });
  return handleResponse(res);
}

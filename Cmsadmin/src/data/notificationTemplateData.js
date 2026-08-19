import { URL } from '../utils/getUrl.js';
import { getAuthHeaders, handleUnauthorized } from '../utils/auth.js';

export async function getNotificationTemplates() {
  const res = await fetch(`${URL}/notification-templates`, {
    headers: getAuthHeaders(),
  });
  if (res.status === 401) {
    handleUnauthorized();
    throw new Error('Sesi anda telah berakhir');
  }
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Gagal mengambil daftar template notifikasi');
  }
  return data;
}

export async function getNotificationTemplate(id) {
  const res = await fetch(`${URL}/notification-templates/${encodeURIComponent(id)}`, {
    headers: getAuthHeaders(),
  });
  if (res.status === 401) {
    handleUnauthorized();
    throw new Error('Sesi anda telah berakhir');
  }
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Gagal mengambil rincian template notifikasi');
  }
  return data;
}

export async function createNotificationTemplate(payload) {
  const res = await fetch(`${URL}/notification-templates`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  if (res.status === 401) {
    handleUnauthorized();
    throw new Error('Sesi anda telah berakhir');
  }
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Gagal menambahkan template notifikasi');
  }
  return data;
}

export async function updateNotificationTemplate(id, payload) {
  const res = await fetch(`${URL}/notification-templates/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  if (res.status === 401) {
    handleUnauthorized();
    throw new Error('Sesi anda telah berakhir');
  }
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Gagal memperbarui template notifikasi');
  }
  return data;
}

export async function deleteNotificationTemplate(id) {
  const res = await fetch(`${URL}/notification-templates/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (res.status === 401) {
    handleUnauthorized();
    throw new Error('Sesi anda telah berakhir');
  }
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Gagal menghapus template notifikasi');
  }
  return data;
}

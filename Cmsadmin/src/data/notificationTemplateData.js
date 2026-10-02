import { URL } from '../utils/getUrl.js';
import { getAuthHeaders, handleUnauthorized } from '../utils/auth.js';

// Pastikan sesuaikan apakah di URL utils sudah termasuk /api atau belum. 
// Berdasarkan endpoint Swagger temanmu, diawali dengan /admin/notification-templates
const BASE_URL = `${URL}/admin/notification-templates`;

export async function getNotificationTemplates(params = {}) {
  const queryString = new URLSearchParams(params).toString();
  const endpoint = queryString ? `${BASE_URL}?${queryString}` : BASE_URL;

  const res = await fetch(endpoint, {
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
  const res = await fetch(`${BASE_URL}/${encodeURIComponent(id)}`, {
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
  const res = await fetch(BASE_URL, {
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
  const res = await fetch(`${BASE_URL}/${encodeURIComponent(id)}`, {
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
  const res = await fetch(`${BASE_URL}/${encodeURIComponent(id)}`, {
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

// --- TAMBAHAN FITUR BARU DARI BACKEND TEMANMU ---

export async function broadcastNotification(id, payload) {
  const res = await fetch(`${BASE_URL}/${encodeURIComponent(id)}/broadcast`, {
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
    throw new Error(data.message || 'Gagal mengirim broadcast notifikasi');
  }
  return data;
}

export async function getNotificationStats(id) {
  const res = await fetch(`${BASE_URL}/${encodeURIComponent(id)}/stats`, {
    headers: getAuthHeaders(),
  });
  if (res.status === 401) {
    handleUnauthorized();
    throw new Error('Sesi anda telah berakhir');
  }
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Gagal mengambil statistik template');
  }
  return data;
}

export async function addNotificationSchedule(id, scheduleData) {
  const res = await fetch(`${BASE_URL}/${encodeURIComponent(id)}/schedules`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(scheduleData),
  });
  if (res.status === 401) {
    handleUnauthorized();
    throw new Error('Sesi anda telah berakhir');
  }
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Gagal menambah jadwal notifikasi');
  }
  return data;
}

export async function deleteNotificationSchedule(id, scheduleId) {
  const res = await fetch(`${BASE_URL}/${encodeURIComponent(id)}/schedules/${encodeURIComponent(scheduleId)}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });
  if (res.status === 401) {
    handleUnauthorized();
    throw new Error('Sesi anda telah berakhir');
  }
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Gagal menghapus jadwal notifikasi');
  }
  return data;
}
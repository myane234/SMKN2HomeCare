import { URL } from '../utils/getUrl.js';
import { getAuthHeaders, handleUnauthorized } from '../utils/auth.js';

export async function getHomeContent() {
  const res = await fetch(`${URL}/resource/content/home`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error('Gagal mengambil konten Home');
  return res.json();
}

export async function updateHomeContent(formData) {
  const res = await fetch(`${URL}/resource/content/home`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });

  if (res.status === 401) {
    handleUnauthorized();
    throw new Error('Sesi anda telah berakhir');
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Gagal memperbarui konten Home');
  }
  return data;
}

export async function getAboutContent() {
  const res = await fetch(`${URL}/resource/content/about`, {
    headers: { Accept: 'application/json' },
  });
  if (!res.ok) throw new Error('Gagal mengambil konten Tentang Kami');
  return res.json();
}

export async function updateAboutContent(formData) {
  const res = await fetch(`${URL}/resource/content/about`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: formData,
  });

  if (res.status === 401) {
    handleUnauthorized();
    throw new Error('Sesi anda telah berakhir');
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Gagal memperbarui konten Tentang Kami');
  }
  return data;
}

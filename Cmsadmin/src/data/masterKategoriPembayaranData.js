const BASE_URL = "/api/pembayaran/kategori";

async function fetchApi(url, options = {}) {
  let token = '';
  
  try {
    const rawAuth = localStorage.getItem('cmsHomeCare_auth');
    
    
    if (rawAuth) {
      try {
        const parsed = JSON.parse(rawAuth);
        // Menelusuri semua kemungkinan struktur penyimpanan token login
        token = parsed.token || parsed.access_token || parsed.data?.token || parsed.data?.access_token || parsed.user?.token || '';
      } catch (jsonErr) {
        // Jika gagal diparse sebagai JSON, anggap nilainya adalah string token itu sendiri
        token = rawAuth;
      }
    }
    
    // Cek cadangan key lain jika masih kosong
    if (!token) {
      token = localStorage.getItem('token') || localStorage.getItem('access_token') || '';
    }
  } catch (e) {
    console.error('[DEBUG] Error saat membaca token:', e);
    token = '';
  }

  console.log('[DEBUG] Token akhir yang dikirim:', token ? token.substring(0, 15) + '...' : 'KOSONG / TIDAK ADA!');

  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP Error: ${response.status}`);
  }

  return response.json();
}

export function mapKategoriItem(item) {
  if (!item) return null;
  return {
    id: item.id_kategori_pembayaran || item.id || '',
    nama: item.nama_kategori || item.nama || '',
    is_active: Boolean(item.is_active ?? true),
  };
}

// GET: Ambil daftar kategori pembayaran
export async function getKategoriPembayaran() {
  const result = await fetchApi(BASE_URL);
  
  let list = [];
  if (Array.isArray(result)) {
    list = result;
  } else if (Array.isArray(result?.data)) {
    list = result.data;
  } else if (Array.isArray(result?.data?.data)) {
    list = result.data.data;
  }

  return list.map(mapKategoriItem).filter(Boolean);
}

// GET: Detail kategori berdasarkan id/slug
export async function getKategoriPembayaranById(id) {
  const result = await fetchApi(`${BASE_URL}/${id}`);
  const data = result?.data || result;
  return mapKategoriItem(data);
}

// POST: Tambah kategori baru
export async function createKategoriPembayaran(payload) {
  const bodyData = {
    nama_kategori: payload.nama || payload.nama_kategori,
    is_active: Boolean(payload.is_active ?? true),
  };

  const result = await fetchApi(BASE_URL, {
    method: 'POST',
    body: JSON.stringify(bodyData),
  });

  return mapKategoriItem(result?.data || result);
}

// PUT: Edit kategori
export async function updateKategoriPembayaran(id, payload) {
  const bodyData = {
    nama_kategori: payload.nama || payload.nama_kategori,
    is_active: Boolean(payload.is_active ?? true),
  };

  const result = await fetchApi(`${BASE_URL}/${id}`, {
    method: 'PUT',
    body: JSON.stringify(bodyData),
  });

  return mapKategoriItem(result?.data || result);
}

// DELETE: Hapus kategori
export async function deleteKategoriPembayaran(id) {
  return fetchApi(`${BASE_URL}/${id}`, {
    method: 'DELETE',
  });
}
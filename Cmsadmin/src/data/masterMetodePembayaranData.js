import { getKategoriPembayaran } from './masterKategoriPembayaranData.js';

const BASE_URL = "/api/pembayaran/metode";

async function fetchApi(url, options = {}) {
  let token = '';
  try {
    const rawAuth = localStorage.getItem('cmsHomeCare_auth');
    if (rawAuth) {
      const parsed = JSON.parse(rawAuth);
      token = parsed.token || parsed.access_token || parsed.data?.token || parsed.data?.access_token || '';
    }
    
    if (!token) {
      token = localStorage.getItem('token') || localStorage.getItem('access_token') || '';
    }
  } catch (e) {
    token = '';
  }

  // Jika body berupa FormData, browser akan otomatis menangani Content-Type & boundary-nya
  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
    'Accept': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP Error ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`[API Error] Request ke ${url} gagal:`, error.message);
    throw error;
  }
}

// Helper untuk membuat string payment_type yang unik dan sesuai standar Midtrans
function generatePaymentType(payload) {
  if (payload.payment_type) return payload.payment_type;
  
  // Ambil nama metode (misal: "BRI Transfer" -> "bri_transfer")
  if (payload.nama_metode) {
    return payload.nama_metode.toLowerCase().trim().replace(/\s+/g, '_');
  }
  
  return String(payload.id_kategori_pembayaran || '');
}

export function mapMetodeItem(item) {
  if (!item) return null;
  return {
    id: item.id_metode || item.id || '',
    id_kategori_pembayaran: item.id_kategori_pembayaran || item.payment_type || '',
    nama_kategori: item.nama_kategori || item.kategori?.nama || item.kategori?.nama_kategori || '',
    nama_metode: item.nama_metode || '',
    tipe_potongan: item.tipe_potongan || 'nominal',
    nilai_potongan: Number(item.nilai_potongan) || 0,
    logo: item.logo || '',
    is_active: Boolean(item.is_active ?? true),
  };
}

export async function getKategoriPembayaranOptions() {
  try {
    const list = await getKategoriPembayaran();
    return Array.isArray(list) ? list : [];
  } catch (err) {
    console.warn('Gagal memuat kategori untuk dropdown:', err.message);
    return [];
  }
}

export async function getMetodePembayaran() {
  try {
    const result = await fetchApi(BASE_URL);
    let list = [];
    if (Array.isArray(result)) {
      list = result;
    } else if (Array.isArray(result?.data)) {
      list = result.data;
    } else if (Array.isArray(result?.data?.data)) {
      list = result.data.data;
    }

    return list.map(mapMetodeItem).filter(Boolean);
  } catch (err) {
    console.error('getMetodePembayaran error:', err);
    return [];
  }
}

export async function createMetodePembayaran(payload) {
  const formData = new FormData();
  
  // Buat payment_type spesifik agar unik (misal: "bri_transfer")
  const paymentType = generatePaymentType(payload);

  formData.append('payment_type', paymentType);
  formData.append('id_kategori_pembayaran', payload.id_kategori_pembayaran || '');
  formData.append('nama_metode', payload.nama_metode || '');
  formData.append('tipe_potongan', payload.tipe_potongan || 'nominal');
  formData.append('nilai_potongan', Number(payload.nilai_potongan) || 0);
  formData.append('is_active', payload.is_active ? '1' : '0');
  
  if (payload.logo) {
    formData.append('logo', payload.logo);
  }

  const result = await fetchApi(BASE_URL, {
    method: 'POST',
    body: formData,
  });

  return mapMetodeItem(result?.data || result);
}

export async function updateMetodePembayaran(id, payload) {
  const realId = id || payload?.id;
  if (!realId) {
    throw new Error("ID Metode Pembayaran tidak ditemukan!");
  }

  const formData = new FormData();
  const paymentType = generatePaymentType(payload);

  formData.append('payment_type', paymentType);
  formData.append('id_kategori_pembayaran', payload.id_kategori_pembayaran || '');
  formData.append('nama_metode', payload.nama_metode || '');
  formData.append('tipe_potongan', payload.tipe_potongan || 'nominal');
  formData.append('nilai_potongan', Number(payload.nilai_potongan) || 0);
  formData.append('is_active', payload.is_active ? '1' : '0');

  if (payload.logo) {
    formData.append('logo', payload.logo);
  }

  const result = await fetchApi(`${BASE_URL}/${realId}`, {
    method: 'POST',
    body: formData,
  });

  return mapMetodeItem(result?.data || result);
}

export async function deleteMetodePembayaran(id) {
  return fetchApi(`${BASE_URL}/${id}`, {
    method: 'DELETE',
  });
}
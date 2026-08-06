const API_BASE_URL = 'https://api.example.com/api'; // Ganti dengan base URL API Anda

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// ==================== WILAYAH LAYANAN / PROVINSI ====================

export async function getAllWilayahLayanan() {
  try {
    const response = await fetch(`${API_BASE_URL}/provinsi`, {
      method: 'GET',
      headers: getHeaders(),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Gagal memuat data provinsi');
    return result.data || result;
  } catch (error) {
    console.error('Error getAllWilayahLayanan:', error);
    throw error;
  }
}

export async function createWilayahLayanan(payload) {
  try {
    const response = await fetch(`${API_BASE_URL}/provinsi`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Gagal menambah provinsi');
    return result.data || result;
  } catch (error) {
    console.error('Error createWilayahLayanan:', error);
    throw error;
  }
}

export async function updateWilayahLayanan(id, payload) {
  try {
    const response = await fetch(`${API_BASE_URL}/provinsi/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Gagal memperbarui provinsi');
    return result.data || result;
  } catch (error) {
    console.error('Error updateWilayahLayanan:', error);
    throw error;
  }
}

export async function deleteWilayahLayanan(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/provinsi/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Gagal menghapus provinsi');
    return result.data || result;
  } catch (error) {
    console.error('Error deleteWilayahLayanan:', error);
    throw error;
  }
}

// ==================== KOTA / KABUPATEN ====================

export async function getAllKotaKabupaten() {
  try {
    const response = await fetch(`${API_BASE_URL}/kabupaten`, {
      method: 'GET',
      headers: getHeaders(),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Gagal memuat data kota/kabupaten');
    return result.data || result;
  } catch (error) {
    console.error('Error getAllKotaKabupaten:', error);
    throw error;
  }
}

export async function createKotaKabupaten(payload) {
  try {
    const response = await fetch(`${API_BASE_URL}/kabupaten`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Gagal menambah kota/kabupaten');
    return result.data || result;
  } catch (error) {
    console.error('Error createKotaKabupaten:', error);
    throw error;
  }
}

export async function updateKotaKabupaten(id, payload) {
  try {
    const response = await fetch(`${API_BASE_URL}/kabupaten/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Gagal memperbarui kota/kabupaten');
    return result.data || result;
  } catch (error) {
    console.error('Error updateKotaKabupaten:', error);
    throw error;
  }
}

export async function deleteKotaKabupaten(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/kabupaten/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.message || 'Gagal menghapus kota/kabupaten');
    return result.data || result;
  } catch (error) {
    console.error('Error deleteKotaKabupaten:', error);
    throw error;
  }
}
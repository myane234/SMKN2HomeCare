import api from './api';

export const DAFTAR_UNIVERSITAS = [
  "Institut Teknologi Bandung",
  "Universitas Indonesia",
  "Universitas Gadjah Mada",
  "Universitas Airlangga",
  "Universitas Padjadjaran",
  "Universitas Diponegoro",
  "Universitas Brawijaya",
  "Universitas Hasanuddin",
  "Universitas Sebelas Maret",
  "Universitas Sumatera Utara",
  "Universitas Udayana",
  "Universitas Andalas",
  "Universitas Negeri Yogyakarta",
  "Universitas Negeri Jakarta",
  "Universitas Negeri Malang",
  "Universitas Negeri Surabaya",
  "Universitas Telkom",
  "Binus University"
];

function extractArray(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.data?.data)) return payload.data.data;
  return [];
}

export const getUniversitas = async (search = '') => {
  try {
    const params = search ? { search } : {};
    const res = await api.get('/api/universitas', { params, validateStatus: s => s < 500 });
    if (res.status === 200 && res.data) {
      const items = extractArray(res.data);
      if (items.length > 0) {
        return items.map(item => typeof item === 'string' ? item : (item.nama_universitas || item.nama || item));
      }
    }
    return filterDefaultList(search);
  } catch (error) {
    console.warn('Gagal memuat API universitas, menggunakan data default:', error);
    return filterDefaultList(search);
  }
};

function filterDefaultList(search) {
  if (!search) return DAFTAR_UNIVERSITAS;
  const q = search.toLowerCase();
  return DAFTAR_UNIVERSITAS.filter(u => u.toLowerCase().includes(q));
}

export default DAFTAR_UNIVERSITAS;
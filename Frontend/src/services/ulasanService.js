import api from './api';

const getBaseUrl = () => process.env.NEXT_PUBLIC_API_URL || 'https://citra.faaruq.com';

export const DEFAULT_ULASAN = [
  {
    id: 1,
    nama_pasien: "Siti Rahmawati",
    foto_pasien: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    rating: 5,
    nama_layanan: "Home Care Perawat Lansia",
    komentar: "Pelayanan perawat sangat ramah, sabar, dan sangat profesional dalam merawat ibu saya di rumah. Sangat terbantu!",
    tanggal: "2026-08-20T10:30:00Z",
    is_active: true
  },
  {
    id: 2,
    nama_pasien: "Budi Santoso",
    foto_pasien: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    rating: 5,
    nama_layanan: "Fisioterapi Pasca Stroke",
    komentar: "Fisioterapisnya menguasai teknik dengan baik. Setelah 4 kali terapi, pergerakan tangan ayah saya mulai menunjukkan kemajuan pesat.",
    tanggal: "2026-08-18T14:15:00Z",
    is_active: true
  },
  {
    id: 3,
    nama_pasien: "Dewi Lestari",
    foto_pasien: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
    rating: 4,
    nama_layanan: "Perawatan Ibu & Bayi Baru Lahir",
    komentar: "Bidan sangat telaten memandikan bayi dan mengajari pijat laktasi. Sangat merekomendasikan layanan SmartHomeCare!",
    tanggal: "2026-08-15T09:00:00Z",
    is_active: true
  },
  {
    id: 4,
    nama_pasien: "Ahmad Hidayat",
    foto_pasien: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    rating: 5,
    nama_layanan: "Medical Checkup Rumah",
    komentar: "Pemeriksaan darah dan EKG dilakukan tepat waktu di rumah. Hasil keluar cepat dan penjelasannya dokter sangat detail.",
    tanggal: "2026-08-10T16:45:00Z",
    is_active: true
  }
];

function extractArray(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.data?.data)) return payload.data.data;
  return [];
}

export const getUlasan = async (params = {}) => {
  try {
    const res = await api.get('/api/ulasan', { params, validateStatus: s => s < 500 });
    if (res.status === 200 && res.data) {
      const items = extractArray(res.data);
      return items.length > 0 ? items : DEFAULT_ULASAN;
    }
    return DEFAULT_ULASAN;
  } catch (error) {
    console.warn('Gagal memuat API ulasan, menggunakan data default:', error);
    return DEFAULT_ULASAN;
  }
};

export async function getUlasanSSR(params = {}) {
  try {
    const url = new URL(`${getBaseUrl()}/api/ulasan`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    
    const res = await fetch(url.toString(), { cache: 'no-store' });
    if (!res.ok) return DEFAULT_ULASAN;
    const json = await res.json();
    const items = extractArray(json);
    return items.length > 0 ? items : DEFAULT_ULASAN;
  } catch (error) {
    console.warn('Gagal memuat API ulasan (SSR), menggunakan data default:', error);
    return DEFAULT_ULASAN;
  }
}

export const submitUlasan = async (payload) => {
  try {
    const res = await api.post('/api/ulasan', payload);
    return res.data;
  } catch (error) {
    console.error('Error submitting ulasan:', error);
    throw error;
  }
};

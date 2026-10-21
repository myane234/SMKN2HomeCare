import api from './api';

export const DEFAULT_LAYANAN = [
  {
    id_layanan: 1,
    id: 1,
    nama_layanan: "Layanan Perawatan Ibu & Anak",
    kategori_layanan: "Home Care",
    deskripsi_layanan: "Perawatan komprehensif untuk pasca melahirkan, perawatan tali pusar, pijat laktasi, dan perawatan bayi baru lahir.",
    harga: 250000,
    durasi_menit: 60,
    transport: 1,
    foto_layanan: "/images/layanan/pijat-bayi.png"
  },
  {
    id_layanan: 2,
    id: 2,
    nama_layanan: "Fisioterapi & Stroke Rehabilitation",
    kategori_layanan: "Fisioterapi",
    deskripsi_layanan: "Terapi latihan fisik dan pemulihan fungsi gerak tubuh langsung di rumah oleh terapis berpengalaman.",
    harga: 300000,
    durasi_menit: 90,
    transport: 1,
    foto_layanan: "/images/about/Stroke rehabilitation.jpg"
  },
  {
    id_layanan: 3,
    id: 3,
    nama_layanan: "Perawatan Luka Steril & Diabetes",
    kategori_layanan: "Perawatan Luka",
    deskripsi_layanan: "Pembersihan luka, ganti balutan steril, dan penanganan luka dekubitus atau luka operasi.",
    harga: 200000,
    durasi_menit: 45,
    transport: 1,
    foto_layanan: "/images/layanan/luka/luka-diabetes.png"
  },
  {
    id_layanan: 4,
    id: 4,
    nama_layanan: "Medical Checkup & Tanda Vital",
    kategori_layanan: "Kesehatan",
    deskripsi_layanan: "Pemeriksaan gula darah, asam urat, kolesterol, dan tekanan darah di rumah.",
    harga: 150000,
    durasi_menit: 30,
    transport: 1,
    foto_layanan: "/images/icons/mcu.png"
  }
];

export const DEFAULT_KATEGORI_LAYANAN = [
  { id: 1, id_kategori: 1, nama_kategori: "Ibu & Anak", icon: "/images/icons/ibu-anak.png", slug: "ibu-anak" },
  { id: 2, id_kategori: 2, nama_kategori: "Perawatan Luka", icon: "/images/icons/luka.png", slug: "perawatan-luka" },
  { id: 3, id_kategori: 3, nama_kategori: "Medical Checkup", icon: "/images/icons/mcu.png", slug: "medical-checkup" },
  { id: 4, id_kategori: 4, nama_kategori: "Fisioterapi", icon: "/images/icons/fisio.png", slug: "fisioterapi" },
  { id: 5, id_kategori: 5, nama_kategori: "Pemasangan Alat Medis", icon: "/images/icons/alat-medis.png", slug: "pemasangan-alat-medis" }
];

function extractArray(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.data?.data)) return payload.data.data;
  return [];
}

export const getLayanan = async (params = {}) => {
  try {
    const res = await api.get('/api/layanan', { params });
    const items = extractArray(res.data);
    return items.length > 0 ? items : DEFAULT_LAYANAN;
  } catch (error) {
    console.warn('Gagal memuat API layanan, menggunakan data default fallback:', error);
    return DEFAULT_LAYANAN;
  }
};

export const getKategoriLayanan = async () => {
  try {
    const res = await api.get('/api/layanan/kategori');
    const items = extractArray(res.data);
    return items.length > 0 ? items : DEFAULT_KATEGORI_LAYANAN;
  } catch (error) {
    console.warn('Gagal memuat API kategori layanan, menggunakan data default fallback:', error);
    return DEFAULT_KATEGORI_LAYANAN;
  }
};

// ── SSR-compatible fetch (untuk Server Components / Server Actions) ──────────
const getBaseUrl = () => process.env.NEXT_PUBLIC_API_URL || 'https://citra.faaruq.com';

export async function getLayananSSR(params = {}) {
  try {
    const url = new URL(`${getBaseUrl()}/api/layanan`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString(), { cache: 'no-store' });
    if (!res.ok) return DEFAULT_LAYANAN;
    const json = await res.json();
    const items = extractArray(json);
    return items.length > 0 ? items : DEFAULT_LAYANAN;
  } catch (error) {
    console.warn('Gagal memuat API layanan (SSR), menggunakan data default fallback:', error);
    return DEFAULT_LAYANAN;
  }
}

export async function getKategoriLayananSSR() {
  try {
    const res = await fetch(`${getBaseUrl()}/api/layanan/kategori`, { cache: 'no-store' });
    if (!res.ok) return DEFAULT_KATEGORI_LAYANAN;
    const json = await res.json();
    const items = extractArray(json);
    return items.length > 0 ? items : DEFAULT_KATEGORI_LAYANAN;
  } catch (error) {
    console.warn('Gagal memuat API kategori layanan (SSR), menggunakan data default fallback:', error);
    return DEFAULT_KATEGORI_LAYANAN;
  }
}

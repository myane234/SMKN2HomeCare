import api from './api';

const getBaseUrl = () => process.env.NEXT_PUBLIC_API_URL || 'https://citra.faaruq.com';

export const DEFAULT_PROMOS = [
  {
    id_promo: 1,
    id: 1,
    nama_paket: "Promo Paket Sehat Lansia",
    deskripsi: "Diskon 20% untuk pendampingan perawatan lansia homecare selama 7 hari berturut-turut.",
    diskon_persen: 20,
    tanggal_berakhir: "2026-12-31",
    gambar_promo: "/images/hero/hero-1.jpg"
  },
  {
    id_promo: 2,
    id: 2,
    nama_paket: "Paket Perawatan Ibu & Bayi Baru Lahir",
    deskripsi: "Hemat hingga 15% untuk layanan pijat laktasi, perawatan tali pusar, dan senam nifas di rumah.",
    diskon_persen: 15,
    tanggal_berakhir: "2026-12-31",
    gambar_promo: "/images/layanan/pijat-bayi.png"
  },
  {
    id_promo: 3,
    id: 3,
    nama_paket: "Voucher Medical Checkup Rumah",
    deskripsi: "Pemeriksaan darah dan tanda-tanda vital lengkap keluarga dengan potongan langsung Rp 50.000.",
    diskon_persen: 10,
    tanggal_berakhir: "2026-12-31",
    gambar_promo: "/images/icons/mcu.png"
  }
];

// Helper untuk membaca property dengan safe fallbacks
export function getTextValue(item, keys) {
  for (const key of keys) {
    const value = item?.[key];
    if (value !== undefined && value !== null && value !== "") {
      return String(value);
    }
  }
  return "";
}

export function generatePromoSlug(name) {
  if (!name) return '';
  return String(name)
    .toLowerCase()
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function extractArray(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.data?.data)) return payload.data.data;
  return [];
}

// ── SSR Fetch untuk Server Components ──────────────────────────────────────────
export async function getActivePromosSSR(params = {}) {
  try {
    const url = new URL(`${getBaseUrl()}/api/promo`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    
    const res = await fetch(url.toString(), { cache: 'no-store' });
    if (!res.ok) return DEFAULT_PROMOS;
    const json = await res.json();
    const items = extractArray(json);
    return items.length > 0 ? items : DEFAULT_PROMOS;
  } catch (error) {
    console.warn('Gagal memuat API promo (SSR), menggunakan data default fallback:', error);
    return DEFAULT_PROMOS;
  }
}

export async function getPromoBySlugSSR(slug) {
  try {
    const promos = await getActivePromosSSR();
    const promo = promos.find((item) => {
      const name = getTextValue(item, ["nama_paket", "nama", "title", "judul"]);
      const id = getTextValue(item, ["id_promo", "id"]);
      return generatePromoSlug(name) === slug || id === String(slug);
    });
    return promo || DEFAULT_PROMOS[0];
  } catch (error) {
    console.warn(`Gagal memuat API promo ${slug} (SSR), menggunakan data default fallback:`, error);
    return DEFAULT_PROMOS[0];
  }
}

// ── Client Side Fetch (Axios) ──────────────────────────────────────────────────
export const getActivePromos = async (params = {}) => {
  try {
    const response = await api.get('/api/promo', { params });
    const items = extractArray(response.data);
    return items.length > 0 ? items : DEFAULT_PROMOS;
  } catch (error) {
    console.warn('Gagal memuat API promo, menggunakan data default fallback:', error);
    return DEFAULT_PROMOS;
  }
};

export const getPromoBySlug = async (slug) => {
  try {
    const promos = await getActivePromos();
    return promos.find((item) => {
      const name = getTextValue(item, ["nama_paket", "nama", "title", "judul"]);
      const id = getTextValue(item, ["id_promo", "id"]);
      return generatePromoSlug(name) === slug || id === String(slug);
    }) || DEFAULT_PROMOS[0];
  } catch (error) {
    console.warn('Gagal memuat API promo by slug, menggunakan data default fallback:', error);
    return DEFAULT_PROMOS[0];
  }
};
import api from './api';

export const DEFAULT_ARTIKEL = [
  {
    id_artikel: 1,
    id: 1,
    judul_artikel: "Tips Merawat Lansia di Rumah dengan Nyaman dan Aman",
    kategori_artikel: "Tips Kesehatan",
    ringkasan: "Panduan lengkap perawatan lansia di rumah untuk menjaga kesehatan fisik dan mental mereka.",
    isi_artikel: "Merawat lansia di rumah memerlukan kesabaran, pemahaman medis dasar, dan lingkungan yang aman. Pastikan pencahayaan cukup, hindari lantai licin, dan rutin konsultasikan kondisi kesehatan dengan perawat homecare.",
    gambar_artikel: "/images/about/Stroke rehabilitation.jpg",
    slug: "tips-merawat-lansia-di-rumah-dengan-nyaman-dan-aman"
  },
  {
    id_artikel: 2,
    id: 2,
    judul_artikel: "Pentingnya Fisioterapi Pasca Stroke untuk Pemulihan Motorik",
    kategori_artikel: "Tips Kesehatan",
    ringkasan: "Fisioterapi rutin membantu mengembalikan fungsi gerak tubuh dan kualitas hidup penderita stroke.",
    isi_artikel: "Latihan pemulihan fisik secara konsisten sangat krusial bagi pasien pasca stroke. Fisioterapis profesional homecare dapat mendampingi latihan mobilitas langsung di rumah.",
    gambar_artikel: "/images/hero/hero-2.jpg",
    slug: "pentingnya-fisioterapi-pasca-stroke-untuk-pemulihan-motorik"
  },
  {
    id_artikel: 3,
    id: 3,
    judul_artikel: "Panduan Perawatan Luka Diabetes untuk Mencegah Infeksi",
    kategori_artikel: "Tips Kesehatan",
    ringkasan: "Langkah-langkah perawatan luka diabetes mandiri dan bantuan perawat medis profesional.",
    isi_artikel: "Luka pada penderita diabetes memerlukan penanganan higienis dan steril agar tidak menyebabkan komplikasi serius. Penggantian perban rutin dan pembersihan antiseptik sangat penting.",
    gambar_artikel: "/images/layanan/luka/luka-diabetes.png",
    slug: "panduan-perawatan-luka-diabetes-untuk-mencegah-infeksi"
  }
];

function extractArray(payload) {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload.data)) return payload.data;
  if (Array.isArray(payload.data?.data)) return payload.data.data;
  return [];
}

export const getArtikel = async (params = {}) => {
  try {
    const res = await api.get('/api/artikel', { params });
    const items = extractArray(res.data);
    return items.length > 0 ? items : DEFAULT_ARTIKEL;
  } catch (error) {
    console.warn('Gagal memuat API artikel, menggunakan data default fallback:', error);
    return DEFAULT_ARTIKEL;
  }
};

export const getArtikelBySlug = async (slug) => {
  try {
    const res = await api.get(`/api/artikel/${slug}`);
    const data = res.data?.data || res.data;
    if (data && (data.judul_artikel || data.title || data.judul)) return data;
    return DEFAULT_ARTIKEL.find(a => a.slug === slug || String(a.id) === String(slug)) || DEFAULT_ARTIKEL[0];
  } catch (error) {
    console.warn(`Gagal memuat API artikel ${slug}, menggunakan data default fallback:`, error);
    return DEFAULT_ARTIKEL.find(a => a.slug === slug || String(a.id) === String(slug)) || DEFAULT_ARTIKEL[0];
  }
};

// ── SSR-compatible fetch (untuk Server Components) ───────────────────────────
const getBaseUrl = () => process.env.NEXT_PUBLIC_API_URL || 'https://citra.faaruq.com';

export async function getArtikelSSR(params = {}) {
  try {
    const url = new URL(`${getBaseUrl()}/api/artikel`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString(), { cache: 'no-store' });
    if (!res.ok) return DEFAULT_ARTIKEL;
    const json = await res.json();
    const items = extractArray(json);
    return items.length > 0 ? items : DEFAULT_ARTIKEL;
  } catch (error) {
    console.warn('Gagal memuat API artikel (SSR), menggunakan data default fallback:', error);
    return DEFAULT_ARTIKEL;
  }
}

export async function getArtikelBySlugSSR(slug) {
  try {
    const res = await fetch(`${getBaseUrl()}/api/artikel/${slug}`, { cache: 'no-store' });
    if (!res.ok) {
      return DEFAULT_ARTIKEL.find(a => a.slug === slug || String(a.id) === String(slug)) || DEFAULT_ARTIKEL[0];
    }
    const json = await res.json();
    const data = json.data ?? json;
    return data && (data.judul_artikel || data.title || data.judul)
      ? data
      : (DEFAULT_ARTIKEL.find(a => a.slug === slug || String(a.id) === String(slug)) || DEFAULT_ARTIKEL[0]);
  } catch (error) {
    console.warn(`Gagal memuat API artikel ${slug} (SSR), menggunakan data default fallback:`, error);
    return DEFAULT_ARTIKEL.find(a => a.slug === slug || String(a.id) === String(slug)) || DEFAULT_ARTIKEL[0];
  }
}

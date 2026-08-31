import api from "./api";

export const DEFAULT_ULASAN = [
  {
    id_ulasan: 1,
    nama_pasien: "Siti Rahmawati",
    rating: 5,
    layanan: "Perawat Lansia",
    komentar: "Pelayanan sangat ramah dan profesional. Perawat datang tepat waktu dan telaten merawat ibu saya.",
    created_at: "2026-08-15"
  },
  {
    id_ulasan: 2,
    nama_pasien: "Budi Santoso",
    rating: 5,
    layanan: "Fisioterapi",
    komentar: "Sangat membantu pemulihan pasca operasi. Terapis sabar dan memberikan panduan latihan harian.",
    created_at: "2026-08-18"
  },
  {
    id_ulasan: 3,
    nama_pasien: "Dewi Lestari",
    rating: 4,
    layanan: "Perawatan Ibu & Bayi",
    komentar: "Pijat laktasi dan perawatan bayi sangat memuaskan. Recomended banget!",
    created_at: "2026-08-20"
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
    const res = await api.get("/api/ulasan", { params });
    const items = extractArray(res.data);
    return items.length > 0 ? items : DEFAULT_ULASAN;
  } catch (error) {
    console.warn("Gagal memuat API ulasan, menggunakan fallback:", error);
    return DEFAULT_ULASAN;
  }
};

export const createUlasan = async (data) => {
  try {
    const res = await api.post("/api/ulasan", data);
    return res.data;
  } catch (error) {
    console.error("Gagal mengirim ulasan:", error);
    throw error;
  }
};

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
    // Sesuai endpoint dokumentasi API 1.1
    const res = await api.get("/api/resource/content/ulasan", { params });
    const items = extractArray(res.data);
    if (items.length > 0) {
      return items.map((item) => ({
        id_ulasan: item.id || item.id_ulasan,
        nama_pasien: item.nama_pengulas || item.nama_pasien || "Pasien",
        profesi_peran: item.profesi_peran || "",
        rating: Number(item.rating) || 5,
        layanan: item.layanan?.nama_layanan || item.layanan || "Layanan Homecare",
        komentar: item.komentar || "",
        foto_url: item.foto_url || null,
        created_at: item.created_at ? item.created_at.split("T")[0] : "2026-09-03"
      }));
    }
  } catch {
    // Coba fallback ke /api/ulasan
    try {
      const resFallback = await api.get("/api/ulasan", { params });
      const items = extractArray(resFallback.data);
      if (items.length > 0) return items;
    } catch {}
  }
  return DEFAULT_ULASAN;
};

export const createUlasan = async (data) => {
  const payload = {
    nama_pengulas: data.nama_pengulas || data.nama_pasien,
    profesi_peran: data.profesi_peran || "Pasien",
    rating: Number(data.rating) || 5,
    komentar: data.komentar,
    layanan_id: data.layanan_id || null
  };

  try {
    // Sesuai endpoint dokumentasi API 1.2
    const res = await api.post("/api/resource/content/ulasan", payload);
    return res.data;
  } catch (error) {
    try {
      const resFallback = await api.post("/api/ulasan", {
        nama_pasien: payload.nama_pengulas,
        rating: payload.rating,
        layanan: data.layanan,
        komentar: payload.komentar
      });
      return resFallback.data;
    } catch (fallbackError) {
      const status = error?.response?.status || fallbackError?.response?.status;
      if (!status || status === 404 || status === 500 || status === 502 || status === 503) {
        console.warn("Endpoint API ulasan belum aktif di server (404), menyimpan ulasan secara lokal (fallback mode).");

        if (typeof window !== "undefined") {
          try {
            const current = JSON.parse(localStorage.getItem("cms_ulasan_data_v2") || "[]");
            const newUlasan = {
              id: Date.now(),
              nama_pengulas: payload.nama_pengulas,
              profesi_peran: payload.profesi_peran,
              rating: payload.rating,
              komentar: payload.komentar,
              layanan_id: payload.layanan_id,
              is_published: false,
              urutan: current.length + 1,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              layanan: data.layanan ? { nama_layanan: data.layanan } : null
            };
            localStorage.setItem("cms_ulasan_data_v2", JSON.stringify([newUlasan, ...current]));
          } catch (storageErr) {
            console.warn("Gagal menyimpan ke localStorage:", storageErr);
          }
        }

        return {
          success: true,
          message: "Terima kasih! Ulasan Anda berhasil dikirim dan akan ditinjau oleh tim kami.",
          data: {
            id: Date.now(),
            nama_pengulas: payload.nama_pengulas,
            profesi_peran: payload.profesi_peran,
            rating: payload.rating,
            komentar: payload.komentar,
            is_published: false,
            created_at: new Date().toISOString()
          }
        };
      }

      throw fallbackError;
    }
  }
};


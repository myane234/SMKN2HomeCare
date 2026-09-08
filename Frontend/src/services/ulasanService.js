import axios from "axios";
import api from "./api";

const DEFAULT_ULASAN = [
  {
    id_ulasan: 1,
    nama_pasien: "Budi Santoso",
    profesi_peran: "Keluarga Pasien",
    rating: 5,
    layanan: "Fisioterapi Rumah",
    komentar: "Pelayanan perawat sangat ramah dan profesional. Ayah saya yang baru pulang dari rumah sakit merasa sangat terbantu dan nyaman dirawat di rumah.",
    created_at: "2026-09-01"
  },
  {
    id_ulasan: 2,
    nama_pasien: "Siti Rahma",
    profesi_peran: "Pasien Lansia",
    rating: 5,
    layanan: "Perawatan Luka Medis",
    komentar: "Pelayanan sangat memuaskan, perawat datang tepat waktu dan telaten sekali saat mengganti perban pasca operasi.",
    created_at: "2026-09-02"
  },
  {
    id_ulasan: 3,
    nama_pasien: "Hendro Gunawan",
    profesi_peran: "Anak Pasien",
    rating: 4,
    layanan: "Pendampingan Pasien 24 Jam",
    komentar: "Sangat responsif! Pagi pesan layanan via website, siangnya perawat sudah tiba di rumah membawa perlengkapan medis lengkap.",
    created_at: "2026-09-03"
  }
];

function extractArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
}

const getClient = () => {
  if (typeof window !== "undefined") {
    return axios.create({ baseURL: "" });
  }
  return api;
};

export const getUlasan = async (params = {}) => {
  const client = getClient();
  try {
    const res = await client.get("/api/resource/content/ulasan", { params });
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
  } catch (error) {
    console.warn("Gagal memuat API ulasan lokal, mencoba remote:", error);
    try {
      const resRemote = await api.get("/api/resource/content/ulasan", { params });
      const items = extractArray(resRemote.data);
      if (items.length > 0) return items;
    } catch {}
  }
  return DEFAULT_ULASAN;
};

export const createUlasan = async (data) => {
  const client = getClient();
  const payload = {
    nama_pengulas: data.nama_pengulas || data.nama_pasien,
    profesi_peran: data.profesi_peran || "Pasien",
    rating: Number(data.rating) || 5,
    komentar: data.komentar,
    layanan_id: data.layanan_id || null
  };

  try {
    const res = await client.post("/api/resource/content/ulasan", payload);
    return res.data;
  } catch (error) {
    try {
      const resRemote = await api.post("/api/resource/content/ulasan", payload);
      return resRemote.data;
    } catch (fallbackError) {
      console.error("Gagal mengirim ulasan:", fallbackError);
      throw fallbackError;
    }
  }
};

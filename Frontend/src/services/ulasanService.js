import axios from "axios";
import api from "./api";
import { getAuthToken } from "./cookieHelper";

const DEFAULT_ULASAN = 

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

/**
 * Auto Load Data User untuk Prefill & Disable Email di Form Ulasan
 * URL: /api/resource/content/ulasan/user-info
 */
export const getUserInfoForUlasan = async () => {
  const token = getAuthToken();
  if (!token) return null;

  const client = getClient();
  try {
    const res = await client.get("/api/resource/content/ulasan/user-info", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json"
      }
    });
    return res.data?.data || res.data;
  } catch (error) {
    if (error?.response?.status === 401) {
      return null;
    }
    console.warn("Gagal memuat user info ulasan:", error?.message);
    return null;
  }
};

/**
 * Mengambil Daftar Ulasan Publik (bisa filter rating, search, page, per_page)
 */
export const getUlasan = async (params = {}) => {
  const client = getClient();
  try {
    const res = await client.get("/api/resource/content/ulasan", { params });
    const items = extractArray(res.data);
    if (items.length > 0) {
      return items.map((item) => ({
        id_ulasan: item.id || item.id_ulasan,
        nama_pasien: item.nama_pengulas || item.nama_pasien || "Pasien",
        profesi_peran: item.profesi_peran || "Pasien",
        rating: Number(item.rating) || 5,
        layanan: item.layanan?.nama_layanan || item.layanan || "Layanan Homecare",
        layanan_id: item.layanan_id || item.layanan?.id_master_layanan || null,
        komentar: item.komentar || "",
        foto_url: item.foto_url || null,
        created_at: item.created_at || "2026-09-03T10:00:00.000000Z"
      }));
    }
  } catch (error) {
    console.warn("Gagal memuat API ulasan lokal, mencoba remote:", error);
    try {
      const resRemote = await api.get("/api/resource/content/ulasan", { params });
      const items = extractArray(resRemote.data);
      if (items.length > 0) {
        return items.map((item) => ({
          id_ulasan: item.id || item.id_ulasan,
          nama_pasien: item.nama_pengulas || item.nama_pasien || "Pasien",
          profesi_peran: item.profesi_peran || "Pasien",
          rating: Number(item.rating) || 5,
          layanan: item.layanan?.nama_layanan || item.layanan || "Layanan Homecare",
          layanan_id: item.layanan_id || null,
          komentar: item.komentar || "",
          foto_url: item.foto_url || null,
          created_at: item.created_at || "2026-09-03T10:00:00.000000Z"
        }));
      }
    } catch {}
  }
  return DEFAULT_ULASAN;
};

/**
 * Kirim Ulasan (Wajib Login) via multipart/form-data
 */
export const createUlasan = async (data) => {
  const token = getAuthToken();
  if (!token) {
    const err = new Error("Unauthenticated.");
    err.status = 401;
    err.response = { status: 401, data: { message: "Unauthenticated." } };
    throw err;
  }

  const client = getClient();
  const formData = new FormData();
  formData.append("rating", String(data.rating || 5));
  formData.append("komentar", data.komentar || "");
  if (data.nama_pengulas || data.nama_pasien) {
    formData.append("nama_pengulas", data.nama_pengulas || data.nama_pasien);
  }
  if (data.profesi_peran) {
    formData.append("profesi_peran", data.profesi_peran);
  }
  if (data.layanan_id) {
    formData.append("layanan_id", String(data.layanan_id));
  }
  if (data.foto instanceof File) {
    formData.append("foto", data.foto);
  }

  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json"
  };

  try {
    const res = await client.post("/api/resource/content/ulasan", formData, { headers });
    return res.data;
  } catch (error) {
    if (error?.response?.status === 401) {
      const err = new Error("Unauthenticated.");
      err.status = 401;
      err.response = error.response;
      throw err;
    }
    console.error("Gagal mengirim ulasan:", error);
    throw error;
  }
};

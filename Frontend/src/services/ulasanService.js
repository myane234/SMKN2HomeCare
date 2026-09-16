import axios from "axios";
import api from "./api";
import { getAuthToken, getCookie } from "./cookieHelper";

const getClient = () => {
  if (typeof window !== "undefined") {
    return axios.create({ baseURL: "" });
  }
  return api;
};

function extractPaginated(payload) {
  const envelope = payload?.data ? payload.data : payload;
  const paginationBlock = envelope?.data ? envelope.data : null;
  const rawItems =
    (Array.isArray(paginationBlock?.data) && paginationBlock.data) ||
    (Array.isArray(envelope?.data) && envelope.data) ||
    (Array.isArray(payload?.data) && payload.data) ||
    (Array.isArray(payload) && payload) ||
    [];
  const list = rawItems.map((item) => ({
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
  const current_page = Number(paginationBlock?.current_page || envelope?.current_page || 1);
  const per_page = Number(paginationBlock?.per_page || envelope?.per_page || 10);
  const total = Number(paginationBlock?.total || envelope?.total || list.length);
  const last_page = Number(paginationBlock?.last_page || envelope?.last_page || Math.max(1, Math.ceil(total / per_page)));
  return {
    list,
    pagination: {
      current_page,
      per_page,
      total,
      last_page
    },
    heading: envelope?.ulasan_heading || "",
    subheading: envelope?.ulasan_subheading || ""
  };
}

/**
 * Auto Load Data User untuk Prefill & Disable Email di Form Ulasan
 * URL: /api/resource/content/ulasan/user-info
 */
export const getUserInfoForUlasan = async () => {
  const token = getAuthToken();

  const client = getClient();
  try {
    if (token) {
      const res = await client.get("/api/resource/content/ulasan/user-info", {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json"
        }
      });
      const data = res.data?.data || res.data;
      if (data && (data.email || data.nama_pengulas)) {
        return data;
      }
    }
  } catch (error) {
    if (error?.response?.status === 401) {
      return null;
    }
    console.warn("Gagal memuat user info ulasan via endpoint:", error?.message);
  }

  // Fallback baca langsung dari cookies / localStorage jika endpoint backend terkendala
  if (typeof window !== "undefined") {
    const email = getCookie("profile_email") || getCookie("user_email");
    const nama = getCookie("profile_nama") || getCookie("user_nama");
    let storedProfile = null;
    try {
      const raw = localStorage.getItem("user_profile");
      if (raw) storedProfile = JSON.parse(raw);
    } catch {}

    const resolvedEmail = email || storedProfile?.user?.email || storedProfile?.email || "";
    const resolvedNama =
      nama ||
      storedProfile?.pasien?.nama_lengkap ||
      storedProfile?.nama_lengkap ||
      storedProfile?.user?.nama ||
      storedProfile?.nama ||
      "";

    if (token || resolvedEmail || resolvedNama) {
      return {
        email: resolvedEmail,
        nama_pengulas: resolvedNama,
        profesi_peran: "Keluarga Pasien"
      };
    }
  }

  return null;
};

/**
 * Mengambil Daftar Ulasan Publik (bisa filter rating, search, page, per_page)
 * Return { list, pagination, heading, subheading }
 */
export const getUlasan = async (params = {}) => {
  const client = getClient();
  const res = await client.get("/api/resource/content/ulasan", { params });
  return extractPaginated(res.data);
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
  if (data.transaksi_id) {
    formData.append("transaksi_id", String(data.transaksi_id));
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

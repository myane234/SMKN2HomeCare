import axios from 'axios';
import api from "./api";
import { getProfileMe } from "./profileService";
import { getAuthToken } from "./cookieHelper";

// Di browser client, gunakan relative URL agar memanggil Next.js API route (/api/resource/content/ulasan)
const getClient = () => {
  if (typeof window !== "undefined") {
    return axios.create({
      baseURL: "",
      withCredentials: true,
      headers: {
        Accept: "application/json"
      }
    });
  }
  return api;
};

export const DEFAULT_ULASAN = [
  {
    id_ulasan: 1,
    nama_pasien: "Siti Rahmawati",
    profesi_peran: "Keluarga Pasien",
    rating: 5,
    layanan: "Perawat Lansia",
    layanan_id: 1,
    komentar: "Pelayanan perawat sangat telaten dan ramah.",
    foto_url: null,
    created_at: "2026-09-10T04:29:51.000000Z"
  }
];

/**
 * Auto Load Data User untuk Prefill & Disable Email di Form Ulasan
 */
export const getUserInfoForUlasan = async () => {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const profileRes = await getProfileMe();
    const profile = profileRes?.data || profileRes;
    if (profile && (profile.email || profile.nama_lengkap || profile.nama)) {
      return {
        email: profile.email || "",
        nama_pengulas: profile.nama_lengkap || profile.nama || "",
        profesi_peran: profile.peran || profile.role || "Pasien"
      };
    }
  } catch (error) {
    console.warn("Gagal memuat profil user untuk form ulasan:", error?.message);
  }
  return null;
};

/**
 * Mengambil Daftar Ulasan Publik dari Database API
 * Endpoint: GET /api/resource/content/ulasan
 * Query Parameters:
 *   - page: Nomor halaman (default: 1)
 *   - per_page: Jumlah data per halaman (default: 10 atau 6)
 *   - rating: Filter rating bintang (contoh: 5)
 *   - search / q: Kata kunci pencarian
 */
export const getUlasan = async (params = {}) => {
  const client = getClient();
  try {
    const res = await client.get("/api/resource/content/ulasan", {
      params,
      headers: { Accept: "application/json" }
    });
    const payload = res.data;
    const paginationData = payload?.data || {};
    const rawList = Array.isArray(paginationData?.data)
      ? paginationData.data
      : Array.isArray(paginationData)
      ? paginationData
      : [];

    const items = rawList.map((item) => ({
      id_ulasan: item.id || item.id_ulasan,
      nama_pasien: item.nama_pengulas || item.nama_pasien || "Pasien",
      profesi_peran: item.profesi_peran || "Pasien",
      rating: Number(item.rating) || 5,
      layanan: item.layanan?.nama_layanan || item.layanan || "Layanan Homecare",
      layanan_id: item.layanan_id || item.layanan?.id_master_layanan || null,
      komentar: item.komentar || "",
      foto_url: item.foto_url || item.foto || null,
      created_at: item.created_at || new Date().toISOString(),
      is_published: Boolean(item.is_published)
    }));

    return {
      success: true,
      message: payload?.message || "Berhasil mengambil daftar ulasan",
      ulasan_heading: payload?.ulasan_heading || "Apa Kata Mereka tentang Kami",
      ulasan_subheading:
        payload?.ulasan_subheading ||
        "Ulasan jujur dari pasien dan keluarga yang telah menggunakan layanan Home Care kami.",
      items,
      pagination: {
        current_page: Number(paginationData?.current_page) || 1,
        last_page: Number(paginationData?.last_page) || 1,
        per_page: Number(paginationData?.per_page) || items.length,
        total: Number(paginationData?.total) || items.length,
        next_page_url: paginationData?.next_page_url || null
      }
    };
  } catch (error) {
    console.error("Gagal memuat API ulasan database:", error);
    return {
      success: false,
      message: error?.response?.data?.message || error.message || "Gagal memuat ulasan",
      ulasan_heading: "Apa Kata Mereka tentang Kami",
      ulasan_subheading:
        "Ulasan jujur dari pasien dan keluarga yang telah menggunakan layanan Home Care kami.",
      items: DEFAULT_ULASAN,
      pagination: {
        current_page: 1,
        last_page: 1,
        per_page: DEFAULT_ULASAN.length,
        total: DEFAULT_ULASAN.length,
        next_page_url: null
      }
    };
  }
};

/**
 * Submit Ulasan Baru ke Database API
 * Endpoint: POST /api/resource/content/ulasan
 */
export const createUlasan = async (data) => {
  const client = getClient();
  const token = getAuthToken();
  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json"
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const payload = {
    rating: Number(data.rating || 5),
    komentar: data.komentar || "",
    nama_pengulas: data.nama_pengulas || data.nama_pasien || "Pasien",
    profesi_peran: data.profesi_peran || "Keluarga Pasien",
    layanan_id: data.layanan_id ? Number(data.layanan_id) : null
  };

  try {
    const res = await client.post("/api/resource/content/ulasan", payload, { headers });
    return res.data;
  } catch (error) {
    console.error("Gagal mengirim ulasan ke database:", error);
    throw error;
  }
};

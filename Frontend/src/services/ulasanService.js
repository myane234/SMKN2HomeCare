import axios from "axios";
import api from "./api";
import { getAuthToken, getCookie } from "./cookieHelper";

const getClient = () => {
  return api;
};

function extractPaginated(payload) {
  const root = payload || {};
  const paginationObj =
    root.data && typeof root.data === "object" && !Array.isArray(root.data)
      ? root.data
      : root;

  const rawItems = Array.isArray(paginationObj.data)
    ? paginationObj.data
    : Array.isArray(root.data)
    ? root.data
    : Array.isArray(root)
    ? root
    : [];

  const list = rawItems.map((item) => {
    let komentar = item.komentar || "";
    let layanan = item.layanan?.nama_layanan || item.layanan || null;
    let nakes_nama = item.nakes_nama || null;
    let quick_tags = Array.isArray(item.quick_tags) ? item.quick_tags : [];

    // Parse metadata [Layanan: ... | Nakes: ... | Tags: ...] jika ada di komentar
    const match = komentar.match(/^\[(.*?)\]\s*(.*)$/s);
    if (match) {
      komentar = match[2];
      const parts = match[1].split('|').map((s) => s.trim());
      for (const part of parts) {
        if (part.startsWith('Layanan:')) {
          if (!layanan) layanan = part.replace('Layanan:', '').trim();
        } else if (part.startsWith('Nakes:')) {
          if (!nakes_nama) nakes_nama = part.replace('Nakes:', '').trim();
        } else if (part.startsWith('Tags:')) {
          if (quick_tags.length === 0) {
            quick_tags = part.replace('Tags:', '').split(',').map((s) => s.trim()).filter(Boolean);
          }
        }
      }
    }

    return {
      id_ulasan: item.id || item.id_ulasan,
      id: item.id || item.id_ulasan,
      nama_pasien: item.nama_pengulas || item.nama_pasien || "Pasien",
      nama_pengulas: item.nama_pengulas || item.nama_pasien || "Pasien",
      profesi_peran: item.profesi_peran || "Pasien",
      rating: Number(item.rating) || 5,
      layanan: layanan || "Layanan Homecare",
      layanan_id: item.layanan_id || item.layanan?.id_master_layanan || null,
      komentar: komentar || "",
      quick_tags,
      nakes_nama: nakes_nama || null,
      foto_url: item.foto_url || null,
      created_at: item.created_at || new Date().toISOString()
    };
  });

  const heading =
    root.ulasan_heading ||
    paginationObj.ulasan_heading ||
    "Apa Kata Mereka tentang Kami";
  const subheading =
    root.ulasan_subheading ||
    paginationObj.ulasan_subheading ||
    "Ulasan jujur dari pasien dan keluarga yang telah menggunakan layanan Home Care kami.";

  const current_page = Number(paginationObj.current_page || 1);
  const per_page = Number(paginationObj.per_page || 10);
  const total = Number(
    paginationObj.total !== undefined ? paginationObj.total : list.length
  );
  const last_page = Number(
    paginationObj.last_page || Math.max(1, Math.ceil(total / per_page))
  );

  return {
    list,
    pagination: {
      current_page,
      per_page,
      total,
      last_page
    },
    heading,
    subheading
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
  
  let komentarText = (data.komentar || "").trim();
  const metaParts = [];
  const layananName = data.nama_layanan || data.layanan;
  if (layananName) metaParts.push(`Layanan: ${layananName}`);
  if (data.nakes_nama) metaParts.push(`Nakes: ${data.nakes_nama}`);
  if (Array.isArray(data.quick_tags) && data.quick_tags.length > 0) {
    metaParts.push(`Tags: ${data.quick_tags.join(", ")}`);
  }
  if (metaParts.length > 0 && !komentarText.startsWith("[")) {
    komentarText = `[${metaParts.join(" | ")}] ${komentarText}`;
  }
  formData.append("komentar", komentarText);

  if (data.nama_pengulas || data.nama_pasien) {
    formData.append("nama_pengulas", data.nama_pengulas || data.nama_pasien);
  }
  if (data.profesi_peran) {
    formData.append("profesi_peran", data.profesi_peran);
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

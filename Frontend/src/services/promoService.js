
import api from "./api";

const isUnauthorized = (error) => error?.response?.status === 401;

const handleError = (error, message, fallback) => {
  if (isUnauthorized(error)) {
    return fallback;
  }

  console.error(message, error);
  throw error;
};

/**
 * Mengambil daftar seluruh promo dari API.
 */
export const getAllPromos = async (params = {}) => {
  try {
    const response = await api.get("/api/promo", { params });
    return response.data;
  } catch (error) {
    return handleError(error, "Error fetching promos:", {
      success: true,
      message: "",
      data: [],
    });
  }
};

/**
 * Mengubah response API menjadi array promo.
 */
export const extractArray = (response) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.data)) return response.data;
  if (Array.isArray(response?.data?.data)) return response.data.data;
  if (Array.isArray(response?.items)) return response.items;

  return [];
};

/**
 * Mengambil tanggal hari ini berdasarkan zona waktu Jakarta.
 */
const getJakartaToday = () => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = {};

  parts.forEach((part) => {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  });

  return `${values.year}-${values.month}-${values.day}`;
};

/**
 * Mengambil tanggal YYYY-MM-DD dari response API.
 * Menghindari pergeseran tanggal akibat timezone.
 */
const getDateOnly = (value) => {
  if (!value) return null;

  const match = String(value).match(/^(\d{4}-\d{2}-\d{2})/);

  return match ? match[1] : null;
};

/**
 * Mengecek apakah promo masih aktif dan berada dalam periode berlaku.
 */
export const isPromoActive = (promo) => {
  if (!promo) return false;

  const statusPromo = String(promo.status_promo ?? "")
    .trim()
    .toLowerCase();

  const statusAktual = String(promo.status_aktual ?? "")
    .trim()
    .toLowerCase();

  // Status manual dari admin harus aktif.
  if (statusPromo && statusPromo !== "aktif") {
    return false;
  }

  // Status aktual dari backend harus aktif jika tersedia.
  if (statusAktual && statusAktual !== "aktif") {
    return false;
  }

  // Promo tanpa informasi status tidak ditampilkan.
  if (!statusPromo && !statusAktual) {
    return false;
  }

  const today = getJakartaToday();
  const tanggalMulai = getDateOnly(promo.tanggal_mulai);
  const tanggalBerakhir = getDateOnly(promo.tanggal_berakhir);

  if (tanggalMulai && today < tanggalMulai) {
    return false;
  }

  if (tanggalBerakhir && today > tanggalBerakhir) {
    return false;
  }

  return true;
};

/**
 * Mengambil daftar promo aktif.
 */
export const getActivePromos = async (params = {}) => {
  const response = await getAllPromos(params);

  return extractArray(response).filter(isPromoActive);
};

/**
 * Alias untuk kebutuhan Server Component.
 * Menggunakan endpoint dan filter yang sama.
 */
export const getActivePromosSSR = async (params = {}) => {
  return getActivePromos(params);
};

/**
 * Membuat slug dari nama layanan.
 * Dipertahankan untuk kompatibilitas URL lama.
 */
export const generatePromoSlug = (value) => {
  return String(value ?? "")
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
};

/**
 * Mengambil detail promo berdasarkan ID atau slug lama.
 */
export const getPromoBySlug = async (slug) => {
  const promos = await getActivePromos();
  const target = String(slug);

  const promoById = promos.find(
    (item) => String(item.id_promo) === target
  );

  if (promoById) return promoById;

  return promos.find(
    (item) =>
      generatePromoSlug(item.layanan?.nama_layanan) === target
  ) || null;
};

export const getPromoBySlugSSR = async (slug) => {
  return getPromoBySlug(slug);
};

/**
 * Mengambil nama layanan dari relasi promo.
 */
export const getPromoServiceName = (promo) => {
  return promo?.layanan?.nama_layanan || "Layanan HomeCare";
};

/**
 * Mengambil URL gambar promo.
 */
export const getPromoImagePath = (promo) => {
  return promo?.gambar_promo_url || promo?.gambar_promo || "";
};

/**
 * Format nilai diskon berdasarkan tipe diskon.
 */
export const formatPromoDiscount = (promo) => {
  if (promo?.nilai_diskon == null) return "";

  const value = Number(promo.nilai_diskon);

  if (!Number.isFinite(value)) return "";

  if (String(promo.tipe_diskon).toLowerCase() === "persen") {
    return `${value.toLocaleString("id-ID", {
      maximumFractionDigits: 2,
    })}%`;
  }

  return `Rp ${value.toLocaleString("id-ID")}`;
};

/**
 * Format tanggal promo.
 */
export const formatPromoDate = (value) => {
  const dateString = getDateOnly(value);

  if (!dateString) return "-";

  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};

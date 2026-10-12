import { getKategoriPembayaran } from "./masterKategoriPembayaranData.js";

const BASE_URL = "/api/pembayaran/metode";

async function fetchApi(url, options = {}) {
  let token = "";

  try {
    const rawAuth = localStorage.getItem("cmsHomeCare_auth");

    if (rawAuth) {
      const parsed = JSON.parse(rawAuth);

      token =
        parsed.token ||
        parsed.access_token ||
        parsed.data?.token ||
        parsed.data?.access_token ||
        "";
    }

    if (!token) {
      token =
        localStorage.getItem("token") ||
        localStorage.getItem("access_token") ||
        "";
    }
  } catch {
    token = "";
  }

  const isFormData =
    typeof FormData !== "undefined" &&
    options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      throw new Error(
        errorData.message || `HTTP Error ${response.status}`
      );
    }

    return await response.json();
  } catch (error) {
    console.error(
      `[API Error] Request ke ${url} gagal:`,
      error.message
    );

    throw error;
  }
}

function requirePaymentType(payload) {
  const paymentType = String(payload?.payment_type ?? "").trim();

  if (!paymentType) {
    throw new Error("Kode payment_type wajib diisi.");
  }

  return paymentType;
}

function appendMetodeFields(formData, payload) {
  formData.append("payment_type", requirePaymentType(payload));
  formData.append(
    "id_kategori_pembayaran",
    String(payload.id_kategori_pembayaran ?? "")
  );
  formData.append("nama_metode", String(payload.nama_metode ?? "").trim());
  formData.append(
    "tipe_potongan",
    payload.tipe_potongan || "nominal"
  );
  formData.append(
    "nilai_potongan",
    String(Number(payload.nilai_potongan) || 0)
  );
  formData.append("is_active", payload.is_active ? "1" : "0");

  // File logo hanya dikirim jika admin memilih file baru.
  if (
    typeof File !== "undefined" &&
    payload.logo instanceof File
  ) {
    formData.append("logo", payload.logo);
  }
}

export function mapMetodeItem(item) {
  if (!item) return null;

  return {
    id: item.id_metode ?? item.id ?? "",
    id_metode: item.id_metode ?? item.id ?? "",
    id_kategori_pembayaran: item.id_kategori_pembayaran ?? "",
    payment_type: item.payment_type ?? "",
    nama_kategori:
      item.nama_kategori ??
      item.kategori?.nama ??
      item.kategori?.nama_kategori ??
      "",
    nama_metode: item.nama_metode ?? "",
    tipe_potongan: item.tipe_potongan ?? "nominal",
    nilai_potongan: Number(item.nilai_potongan) || 0,
    keterangan: item.keterangan ?? "",
    logo: item.logo ?? "",
    is_active:
      item.is_active === false ||
      item.is_active === 0 ||
      item.is_active === "0"
        ? false
        : true,
    created_at: item.created_at ?? "",
    created_by: item.created_by ?? "",
    updated_at: item.updated_at ?? "",
    updated_by: item.updated_by ?? "",
    deleted_at: item.deleted_at ?? "",
    deleted_by: item.deleted_by ?? "",
  };
}

export async function getKategoriPembayaranOptions() {
  try {
    const list = await getKategoriPembayaran();
    return Array.isArray(list) ? list : [];
  } catch (error) {
    console.warn(
      "Gagal memuat kategori untuk dropdown:",
      error.message
    );

    return [];
  }
}

export async function getMetodePembayaran() {
  const result = await fetchApi(BASE_URL);

  const candidates = [
    result?.data?.data,
    result?.data,
    result?.metode,
    result,
  ];

  const list = candidates.find(Array.isArray);

  if (!list) {
    throw new Error(
      "Format response API metode pembayaran tidak sesuai."
    );
  }

  return list.map(mapMetodeItem).filter(Boolean);
}

export async function createMetodePembayaran(payload) {
  const formData = new FormData();
  appendMetodeFields(formData, payload);

  const result = await fetchApi(BASE_URL, {
    method: "POST",
    body: formData,
  });

  return mapMetodeItem(
    result?.data?.data ?? result?.data ?? result
  );
}

export async function updateMetodePembayaran(id, payload) {
  const realId = id || payload?.id;

  if (!realId) {
    throw new Error("ID Metode Pembayaran tidak ditemukan.");
  }

  const formData = new FormData();
  appendMetodeFields(formData, payload);

  const result = await fetchApi(
    `${BASE_URL}/${encodeURIComponent(String(realId))}`,
    {
      method: "POST",
      body: formData,
    }
  );

  return mapMetodeItem(
    result?.data?.data ?? result?.data ?? result
  );
}

export async function deleteMetodePembayaran(id) {
  if (!id) {
    throw new Error("ID Metode Pembayaran tidak ditemukan.");
  }

  return fetchApi(
    `${BASE_URL}/${encodeURIComponent(String(id))}`,
    {
      method: "DELETE",
    }
  );
}
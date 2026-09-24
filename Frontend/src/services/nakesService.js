import api from "./api";

/* =========================================================
 * PROFILE & REGISTRASI
 * =======================================================*/
export const getProfileMe = async () => {
  try {
    const response = await api.get("/api/profile/me");
    return response.data;
  } catch (error) {
    console.error("Gagal mengambil profile nakes:", error);
    throw error;
  }
};

export const registerNakes = async (formData) => {
  try {
    const response = await api.post("/api/nakes/register", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (error) {
    console.error("Gagal mendaftarkan nakes:", error);
    throw error;
  }
};

export const getProvinsi = async () => {
  try {
    const response = await api.get("/api/provinsi");
    return response.data;
  } catch (error) {
    console.error("Gagal mengambil provinsi:", error);
    throw error;
  }
};

export const getKategoriLayanan = async () => {
  try {
    const response = await api.get("/api/layanan?ambil_kategori=true");
    return response.data;
  } catch (error) {
    console.error("Gagal mengambil kategori layanan:", error);
    throw error;
  }
};

export const updateDataOperasional = async (payload) => {
  try {
    const response = await api.post("/api/nakes/data-operasional", payload);
    return response.data;
  } catch (error) {
    console.error("Gagal memperbarui data operasional:", error);
    throw error;
  }
};

export const getDataOperasional = async () => {
  try {
    const response = await api.get("/api/nakes/data-operasional");
    return response.data;
  } catch (error) {
    console.error("Gagal mengambil data operasional:", error);
    throw error;
  }
};

/* =========================================================
 * BOOKING
 * =======================================================*/
export const getNakesOrders = async () => {
  const response = await api.get("/api/nakes/orders");
  return response.data;
};

export const getNakesBookings = async () => {
  const response = await api.get("/api/nakes/booking");
  return response.data;
};

export const getNakesOrderDetail = async (bookingId) => {
  try {
    const response = await api.get(
      `/api/nakes/order/${encodeURIComponent(bookingId)}`
    );
    return response.data;
  } catch (error) {
    const fallbackResponse = await api.get(
      `/api/nakes/booking/${encodeURIComponent(bookingId)}`
    );
    return fallbackResponse.data;
  }
};

export const acceptNakesBooking = async (bookingId, payload = {}) => {
  try {
    const response = await api.post(
      `/api/nakes/booking/${encodeURIComponent(bookingId)}/terima`,
      payload
    );
    return response.data;
  } catch (error) {
    if (error?.response?.status === 404 || error?.response?.status === 405) {
      const response = await api.post(
        `/api/booking/${encodeURIComponent(bookingId)}/terima`,
        payload
      );
      return response.data;
    }
    throw error;
  }
};

export const rejectNakesBooking = async (bookingId) => {
  try {
    const response = await api.post(
      `/api/nakes/booking/${encodeURIComponent(bookingId)}/tolak`
    );
    return response.data;
  } catch (error) {
    if (error?.response?.status === 404 || error?.response?.status === 405) {
      const response = await api.post(
        `/api/booking/${encodeURIComponent(bookingId)}/tolak`
      );
      return response.data;
    }
    throw error;
  }
};

export const startTindakanBooking = async (bookingId) => {
  try {
    const response = await api.post(
      `/api/nakes/booking/${encodeURIComponent(bookingId)}/tindakan`
    );
    return response.data;
  } catch (error) {
    if (error?.response?.status === 404 || error?.response?.status === 405) {
      const response = await api.post(
        `/api/booking/${encodeURIComponent(bookingId)}/tindakan`
      );
      return response.data;
    }
    throw error;
  }
};

/* =========================================================
 * BHP / BIAYA TAMBAHAN
 * =======================================================*/

/**
 * GET BHP list untuk 1 booking.
 * Endpoint: GET /api/nakes/booking/{booking_code}/bhp
 */
export const getBhpBooking = async (bookingId) => {
  try {
    const response = await api.get(
      `/api/nakes/booking/${encodeURIComponent(bookingId)}/bhp`
    );
    return response.data;
  } catch (error) {
    console.warn("Gagal fetch BHP booking:", error);
    // Kembalikan struktur kosong (bukan dummy) agar UI handle dgn aman.
    return {
      success: false,
      data: [],
      meta: { total_tambahan: 0, status_pembayaran_bhp: "Lunas" },
    };
  }
};

/**
 * Helper untuk polling status BHP ringan.
 */
export const getBhpBookingStatus = async (bookingCode) => {
  try {
    const res = await api.get(
      `/api/nakes/booking/${encodeURIComponent(bookingCode)}/bhp`
    );
    const data = res.data?.data ?? res.data ?? {};
    return {
      items: Array.isArray(data?.items) ? data.items : [],
      total_tambahan:
        Number(data?.total_tambahan ?? res.data?.meta?.total_tambahan ?? 0) || 0,
      status_transaksi:
        data?.status_transaksi ??
        res.data?.meta?.status_pembayaran_bhp ??
        null,
    };
  } catch (error) {
    console.warn("getBhpBookingStatus gagal:", error);
    return { items: [], total_tambahan: 0, status_transaksi: null };
  }
};

/**
 * POST / Simpan BHP booking.
 * Endpoint: POST /api/nakes/booking/{booking_code}/bhp
 *
 * WAJIB kirim SEMUA item (semua layanan). Backend akan replace seluruh list BHP booking.
 */
export const addBhpBooking = async (bookingId, payload = {}) => {
  const rawItems = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.items)
    ? payload.items
    : [];

  let totalTambahan = 0;
  const processedItems = rawItems.map((item) => {
    const qDefault = Math.max(0, Number(item.qty_default) || 0);
    const qReal = Math.max(
      qDefault,
      Number(
        item.qty_real ?? item.qty ?? item.jumlah_real ?? item.jumlah ?? 0
      ) || 0
    );
    const qTambahan = Math.max(0, qReal - qDefault);
    const hargaSatuan =
      Number(item.harga_satuan ?? item.harga_jual ?? item.harga ?? 0) || 0;
    const subtotalTambahan = qTambahan * hargaSatuan;
    totalTambahan += subtotalTambahan;

    return {
      id_booking_bhp: item.id_booking_bhp ?? null,
      id_layanan: item.id_layanan ?? null,
      id_bhp: item.id_bhp ?? null,
      nama_bhp: item.nama_bhp ?? null,
      nama_layanan: item.nama_layanan ?? null,
      qty_default: qDefault,
      qty_real: qReal,
      qty_tambahan: qTambahan,
      qty: qReal,
      jumlah: qReal,
      jumlah_real: qReal,
      jumlah_tambahan: qTambahan,
      harga_satuan: hargaSatuan,
      harga_jual: hargaSatuan,
      subtotal_tambahan: subtotalTambahan,
    };
  });

  const postBody = {
    items: processedItems,
    total_tambahan: totalTambahan,
  };

  const updatedBy = payload?.updated_by ?? payload?.updatedBy ?? null;
  if (updatedBy !== undefined && updatedBy !== null && updatedBy !== "") {
    postBody.updated_by = Number(updatedBy) || updatedBy;
  }

  const response = await api.post(
    `/api/nakes/booking/${encodeURIComponent(bookingId)}/bhp`,
    postBody
  );
  return response.data;
};

/** Alias legacy */
export const updateBhpBooking = addBhpBooking;

/**
 * Finish Kunjungan / Booking (Nakes)
 */
export const finishBooking = async (bookingId) => {
  try {
    const response = await api.post(
      `/api/nakes/booking/${encodeURIComponent(bookingId)}/selesai`
    );
    return response.data;
  } catch (error) {
    console.error("Gagal menyelesaikan booking:", error);
    throw error;
  }
};

export const completeBooking = finishBooking;

/* =========================================================
 * LIVE TRACKING
 * =======================================================*/
export const updateNakesLocation = async ({
  latitude,
  longitude,
  booking_id,
}) => {
  try {
    const response = await api.post("/api/nakes/update-lokasi", {
      latitude,
      longitude,
      booking_id,
    });
    return response.data;
  } catch (error) {
    console.error("Gagal memperbarui lokasi nakes:", error);
    throw error;
  }
};

/* =========================================================
 * CHAT
 * =======================================================*/
export const getBookingChatMessages = async (bookingId) => {
  try {
    const response = await api.get(
      `/api/booking/${encodeURIComponent(bookingId)}/chat`
    );
    return response.data;
  } catch (error) {
    console.error("Gagal mengambil pesan chat:", error);
    throw error;
  }
};

export const sendBookingChatMessage = async (bookingId, content) => {
  try {
    const response = await api.post(
      `/api/booking/${encodeURIComponent(bookingId)}/chat`,
      { content }
    );
    return response.data;
  } catch (error) {
    console.error("Gagal mengirim pesan chat:", error);
    throw error;
  }
};

export const deleteBookingChatRoom = async (bookingId) => {
  try {
    const response = await api.delete(
      `/api/booking/${encodeURIComponent(bookingId)}/chat-room`
    );
    return response.data;
  } catch (error) {
    console.warn("Gagal menghapus room chat:", error);
    return null;
  }
};

/* =========================================================
 * RIWAYAT
 * =======================================================*/
export const getHistoryNakes = async (params = {}) => {
  try {
    const response = await api.get("/api/v1/history/nakes", { params });
    return response.data;
  } catch (error) {
    const response = await api.get("/api/nakes/riwayat-kunjungan", { params });
    return response.data;
  }
};

export const getRiwayatKunjungan = getHistoryNakes;

export const getDetailRiwayatKunjungan = async (id) => {
  try {
    const response = await api.get(
      `/api/v1/history/nakes/${encodeURIComponent(id)}`
    );
    return response.data;
  } catch (error) {
    const response = await api.get(
      `/api/nakes/riwayat-kunjungan/${encodeURIComponent(id)}`
    );
    return response.data;
  }
};
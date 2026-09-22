import api from "./api";

/**
 * Get current authenticated user's profile.
 */
export const getProfileMe = async () => {
  try {
    const response = await api.get("/api/profile/me");
    return response.data;
  } catch (error) {
    console.error("Gagal mengambil profile nakes:", error);
    throw error;
  }
};

/**
 * Register Nakes (Tenaga Kesehatan) - Gabung Mitra
 * @param {FormData} formData - Data pendaftaran dalam bentuk FormData
 * @returns {Promise} Response dari API
 */
export const registerNakes = async (formData) => {
  try {
    const response = await api.post("/api/nakes/register", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Gagal mendaftarkan nakes:", error);
    throw error;
  }
};

/**
 * Get list of available provinces for wilayah layanan
 */
export const getProvinsi = async () => {
  try {
    const response = await api.get("/api/provinsi");
    return response.data;
  } catch (error) {
    console.error("Gagal mengambil provinsi:", error);
    throw error;
  }
};

/**
 * Get list of medical service categories
 */
export const getKategoriLayanan = async () => {
  try {
    const response = await api.get("/api/layanan?ambil_kategori=true");
    return response.data;
  } catch (error) {
    console.error("Gagal mengambil kategori layanan:", error);
    throw error;
  }
};

/**
 * Update Data Operasional Nakes
 */
export const updateDataOperasional = async (payload) => {
  try {
    const response = await api.post("/api/nakes/data-operasional", payload);
    return response.data;
  } catch (error) {
    console.error("Gagal memperbarui data operasional:", error);
    throw error;
  }
};

/**
 * Get Data Operasional Nakes
 */
export const getDataOperasional = async () => {
  try {
    const response = await api.get("/api/nakes/data-operasional");
    return response.data;
  } catch (error) {
    console.error("Gagal mengambil data operasional:", error);
    throw error;
  }
};

/** Get bookings assigned to the authenticated nakes. */
export const getNakesOrders = async () => {
  const response = await api.get("/api/nakes/orders");
  return response.data;
};

/** Get bookings already accepted or completed by the authenticated nakes. */
export const getNakesBookings = async () => {
  const response = await api.get("/api/nakes/booking");
  return response.data;
};

/** Get one booking detail. */
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

/** Accept one booking. */
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

/** Reject one booking. */
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

/** Start Tindakan / Kunjungan for a booking. */
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

/** Get BHP list for a booking. */
export const getBhpBooking = async (bookingId) => {
  try {
    const response = await api.get(
      `/api/nakes/booking/${encodeURIComponent(bookingId)}/bhp`
    );
    return response.data;
  } catch (error) {
    if (error?.response?.status === 404) {
      const response = await api.get(
        `/api/booking/${encodeURIComponent(bookingId)}/bhp`
      );
      return response.data;
    }
    throw error;
  }
};

/** Update BHP list for a booking. */
export const updateBhpBooking = async (bookingId, bhpItems) => {
  try {
    const response = await api.post(
      `/api/nakes/booking/${encodeURIComponent(bookingId)}/bhp`,
      { items: bhpItems }
    );
    return response.data;
  } catch (error) {
    if (error?.response?.status === 404 || error?.response?.status === 405) {
      const response = await api.post(
        `/api/booking/${encodeURIComponent(bookingId)}/bhp`,
        { items: bhpItems }
      );
      return response.data;
    }
    throw error;
  }
};

/** Finish Kunjungan / Booking. */
export const finishBooking = async (bookingId) => {
  try {
    const response = await api.post(
      `/api/nakes/booking/${encodeURIComponent(bookingId)}/selesai`
    );
    return response.data;
  } catch (error) {
    if (error?.response?.status === 404 || error?.response?.status === 405) {
      const response = await api.post(
        `/api/booking/${encodeURIComponent(bookingId)}/selesai`
      );
      return response.data;
    }
    throw error;
  }
};

/** Live Tracking: Update location coordinates of Nakes. */
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

/** In-App Chat: Fetch chat messages for a booking. */
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

/** In-App Chat: Send chat message for a booking. */
export const sendBookingChatMessage = async (bookingId, content) => {
  try {
    const response = await api.post(
      `/api/booking/${encodeURIComponent(bookingId)}/chat`,
      {
        content,
      }
    );

    return response.data;
  } catch (error) {
    console.error("Gagal mengirim pesan chat:", error);
    throw error;
  }
};

/** Delete chat room when booking finishes. */
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

/** Get Riwayat Kunjungan Nakes */
export const getRiwayatKunjungan = async (params = {}) => {
  try {
    const response = await api.get("/api/nakes/riwayat-kunjungan", {
      params: {
        ...(params.status && { status: params.status }),
        ...(params.per_page && { per_page: params.per_page }),
        ...(params.page && { page: params.page }),
      },
    });
    return response.data;
  } catch (error) {
    console.error("Gagal mengambil riwayat kunjungan:", error);
    throw error;
  }
};

/** Get Detail Single Riwayat Kunjungan */
export const getDetailRiwayatKunjungan = async (id) => {
  try {
    const response = await api.get(
      `/api/nakes/riwayat-kunjungan/${encodeURIComponent(id)}`
    );
    return response.data;
  } catch (error) {
    console.error("Gagal mengambil detail riwayat kunjungan:", error);
    throw error;
  }
};
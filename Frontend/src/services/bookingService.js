import api from "./api";

/* =========================================================
 * BOOKING CRUD
 * =======================================================*/
export const createBooking = async (bookingData) => {
  try {
    const res = await api.post("/api/booking", bookingData);
    return res.data;
  } catch (error) {
    console.error("Error creating booking:", error);

    if (error.response) {
      console.error("Booking error status:", error.response.status);
      console.error("Booking error response:", error.response.data);
      console.error("Booking error request:", error.config?.data);
    } else if (error.request) {
      console.error("Booking error request:", error.request);
    } else {
      console.error("Booking error message:", error.message);
    }

    throw error;
  }
};

/* =========================================================
 * PEMBAYARAN
 * =======================================================*/
export const confirmPayment = async ({ id_booking, order_id }) => {
  try {
    const res = await api.post("/api/transaksi/confirm", {
      id_booking,
      order_id,
    });
    return res.data;
  } catch (error) {
    console.error("Error confirming payment:", error);

    if (error.response) {
      console.error("Payment error status:", error.response.status);
      console.error("Payment error response:", error.response.data);
    } else if (error.request) {
      console.error("Payment error request:", error.request);
    } else {
      console.error("Payment error message:", error.message);
    }

    throw error;
  }
};

/* =========================================================
 * STATUS AKTIF
 * =======================================================*/
export const ACTIVE_BOOKING_STATUSES = [
  "Pending",
  "Dikonfirmasi",
  "DiPerjalanan",
  "Tindakan",
];

const LOCAL_ACTIVE_STORAGE_KEY = "smarthomecare_active_bookings";

/* =========================================================
 * LOCAL ACTIVE BOOKING (fallback)
 * =======================================================*/
export const getLocalActiveBookings = () => {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(LOCAL_ACTIVE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveLocalActiveBooking = (bookingData) => {
  if (typeof window === "undefined" || !bookingData) return;

  try {
    const current = getLocalActiveBookings();
    const bId = bookingData.id_booking || bookingData.id;

    if (!bId) return;

    const filtered = current.filter(
      (item) => String(item.id_booking || item.id) !== String(bId)
    );
    filtered.unshift(bookingData);

    localStorage.setItem(
      LOCAL_ACTIVE_STORAGE_KEY,
      JSON.stringify(filtered.slice(0, 10))
    );
  } catch (e) {
    console.warn("Gagal menyimpan local active booking", e);
  }
};

export const removeLocalActiveBooking = (bookingId) => {
  if (typeof window === "undefined" || !bookingId) return;

  try {
    const current = getLocalActiveBookings();
    const filtered = current.filter(
      (item) => String(item.id_booking || item.id) !== String(bookingId)
    );
    localStorage.setItem(LOCAL_ACTIVE_STORAGE_KEY, JSON.stringify(filtered));
  } catch {}
};

/* =========================================================
 * HELPER: Tracking "sudah dibayar" BHP pasien
 * ---------------------------------------------------------
 * Logika:
 * - Setiap kali API balikin status_transaksi = "Lunas" + kode_booking_tambahan,
 *   kita catat { kode, nominal } ke localStorage.
 * - Kalau nakes nambah BHP lagi, kode_booking_tambahan ATAU nominal akan berubah.
 * - Pasien page compare: kalau kode/nominal sekarang != yang tercatat,
 *   berarti ada tagihan baru → tombol "Bayar BHP Tambahan" muncul lagi.
 * =======================================================*/
const BHP_PAID_KEY_PREFIX = "shc_bhp_paid_";
const BHP_PENDING_KEY_PREFIX = "shc_bhp_pending_";

/**
 * Ambil info pembayaran BHP yang sudah tercatat untuk 1 booking code.
 */
export const getBhpPaidInfo = (bookingCode) => {
  if (typeof window === "undefined" || !bookingCode) return null;
  try {
    const raw = localStorage.getItem(BHP_PAID_KEY_PREFIX + bookingCode);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/**
 * Tandai booking code sebagai "sudah dibayar" untuk BHP.
 * Bisa dipanggil dari halaman payment-confirmation/success,
 * atau otomatis dari booking aktif page ketika API bilang Lunas.
 */
export const markBhpAsPaid = (
  bookingCode,
  { kode_booking_tambahan, nominal, paidAt } = {}
) => {
  if (typeof window === "undefined" || !bookingCode) return;
  try {
    localStorage.setItem(
      BHP_PAID_KEY_PREFIX + bookingCode,
      JSON.stringify({
        kode: kode_booking_tambahan || null,
        nominal: Number(nominal) || 0,
        paidAt: paidAt || new Date().toISOString(),
      })
    );
  } catch (e) {
    console.warn("Gagal menyimpan status bayar BHP:", e);
  }
};

/**
 * Hapus penanda "sudah dibayar" untuk BHP (mis. saat booking selesai/dibatalkan).
 */
export const clearBhpPaidInfo = (bookingCode) => {
  if (typeof window === "undefined" || !bookingCode) return;
  try {
    localStorage.removeItem(BHP_PAID_KEY_PREFIX + bookingCode);
    localStorage.removeItem(BHP_PENDING_KEY_PREFIX + bookingCode);
  } catch {}
};

/**
 * Ambil info pembayaran BHP yang SEDANG berjalan (pending).
 */
export const getBhpPendingInfo = (bookingCode) => {
  if (typeof window === "undefined" || !bookingCode) return null;
  try {
    const raw = localStorage.getItem(BHP_PENDING_KEY_PREFIX + bookingCode);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

/**
 * Simpan info pembayaran BHP yang sedang berjalan (pending),
 * dipanggil tepat sebelum redirect ke halaman pembayaran.
 */
export const setBhpPendingInfo = (
  bookingCode,
  { kode_booking_tambahan, nominal } = {}
) => {
  if (typeof window === "undefined" || !bookingCode) return;
  try {
    localStorage.setItem(
      BHP_PENDING_KEY_PREFIX + bookingCode,
      JSON.stringify({
        kode: kode_booking_tambahan || null,
        nominal: Number(nominal) || 0,
        at: new Date().toISOString(),
      })
    );
  } catch {}
};

export const clearBhpPendingInfo = (bookingCode) => {
  if (typeof window === "undefined" || !bookingCode) return;
  try {
    localStorage.removeItem(BHP_PENDING_KEY_PREFIX + bookingCode);
  } catch {}
};

/* =========================================================
 * GET BOOKING AKTIF
 * =======================================================*/
export const getBookingAktif = async () => {
  try {
    const res = await api.get("/api/booking/terkini");
    return res.data;
  } catch (error) {
    if (error.response?.status === 404) return null;
    throw error;
  }
};

/* =========================================================
 * GET TAGIHAN BHP TAMBAHAN
 * =======================================================*/
export const getBiayaTambahanBooking = async (bookingCode) => {
  if (!bookingCode) throw new Error("Booking code tidak tersedia.");

  try {
    const res = await api.get(
      `/api/booking/${encodeURIComponent(bookingCode)}/biaya-tambahan`
    );
    return res.data;
  } catch (error) {
    console.error("Error mengambil biaya tambahan:", error);
    throw error;
  }
};

/* =========================================================
 * POST CHARGE PEMBAYARAN BHP TAMBAHAN
 * =======================================================*/
export const chargeBiayaTambahan = async ({
  id_booking,
  payment_type,
  callback_url,
}) => {
  try {
    if (!id_booking) throw new Error("Booking ID tidak tersedia.");
    if (!payment_type) throw new Error("Metode pembayaran tidak tersedia.");
    if (!callback_url) throw new Error("Callback URL tidak tersedia.");

    const payload = {
      id_booking,
      payment_type,
      callback_url,
    };

    if (payment_type === "shopeepay") {
      payload.shopeepay = { callback_url };
    }

    if (payment_type === "gopay") {
      payload.gopay = {
        enable_callback: true,
        callback_url,
      };
    }

    const res = await api.post(
      "/api/booking/charge-biaya-tambahan",
      payload
    );

    return res.data;
  } catch (error) {
    console.error("Error charge biaya tambahan:", error);

    if (error.response) {
      console.error("Charge error status:", error.response.status);
      console.error("Charge error response:", error.response.data);
    }

    throw error;
  }
};

/* =========================================================
 * GET SEMUA BOOKING AKTIF
 * =======================================================*/
export const getSemuaBookingAktif = async () => {
  try {
    let terkiniData = null;

    try {
      terkiniData = await getBookingAktif();
    } catch {}

    let transaksiItems = [];

    try {
      const res = await api.get("/api/transaksi", { params: { per_page: 20 } });
      const rawData = res.data?.data || res.data;

      if (Array.isArray(rawData)) {
        transaksiItems = rawData;
      }
    } catch {}

    const map = new Map();

    if (terkiniData?.data?.booking) {
      const b = terkiniData.data.booking;
      const bId = b.id_booking || b.id;

      if (bId && ACTIVE_BOOKING_STATUSES.includes(b.status_booking)) {
        map.set(String(bId), {
          booking: {
            ...b,
            booking_code:
              b.booking_code ||
              b.kode_booking ||
              (bId
                ? String(bId).startsWith("B-")
                  ? bId
                  : `B-${bId}`
                : ""),
            layanan:
              b.layanan_items ||
              (Array.isArray(b.layanan)
                ? b.layanan
                : b.layanan
                ? [b.layanan]
                : []),
          },
          tenaga_medis_tracking:
            terkiniData.data.tenaga_medis_tracking ?? null,
          tracking_info: terkiniData.data.tracking_info ?? null,
        });
      }
    }

    transaksiItems.forEach((t) => {
      const bId = String(t.id_booking || t.id || "");
      if (!bId) return;

      const status = t.status_booking || t.status?.value || t.status;

      if (ACTIVE_BOOKING_STATUSES.includes(status)) {
        if (!map.has(bId)) {
          map.set(bId, {
            booking: {
              ...t,
              status_booking: status,
              layanan:
                t.layanan_items ||
                (Array.isArray(t.layanan)
                  ? t.layanan
                  : t.layanan
                  ? [t.layanan]
                  : []),
              booking_code:
                t.booking_code ||
                t.kode_booking ||
                t.booking?.booking_code ||
                (bId.startsWith("B-") ? bId : `B-${bId}`),
            },
            tenaga_medis_tracking: t.tenaga_medis || null,
            tracking_info: null,
          });
        }
      } else if (status === "Selesai" || status === "Dibatalkan") {
        // Bersihkan penanda pembayaran BHP untuk booking yang sudah selesai
        try {
          const code =
            t.booking_code || t.kode_booking || t.booking?.booking_code || "";
          if (code) clearBhpPaidInfo(code);
        } catch {}
        removeLocalActiveBooking(bId);
      }
    });

    const localBookings = getLocalActiveBookings();

    localBookings.forEach((local) => {
      const bId = String(local.id_booking || local.id || "");
      if (!bId || map.has(bId)) return;

      const status = local.status_booking || "Pending";

      if (ACTIVE_BOOKING_STATUSES.includes(status)) {
        map.set(bId, {
          booking: {
            ...local,
            booking_code:
              local.booking_code ||
              local.kode_booking ||
              (bId.startsWith("B-") ? bId : `B-${bId}`),
          },
          tenaga_medis_tracking: null,
          tracking_info: null,
        });
      }
    });

    return Array.from(map.values());
  } catch (error) {
    console.warn("Gagal memuat semua booking aktif:", error);
    return [];
  }
};

/* =========================================================
 * GET DETAIL BOOKING
 * =======================================================*/
export const getDetailBookingById = async (bookingId) => {
  if (!bookingId) return null;

  try {
    const terkini = await getBookingAktif();
    const tId =
      terkini?.data?.booking?.id_booking || terkini?.data?.booking?.id;

    if (String(tId) === String(bookingId)) {
      const b = terkini.data.booking;

      return {
        ...terkini.data,
        booking: {
          ...b,
          booking_code:
            b.booking_code ||
            b.kode_booking ||
            (tId
              ? String(tId).startsWith("B-")
                ? tId
                : `B-${tId}`
              : ""),
          layanan:
            b.layanan_items ||
            (Array.isArray(b.layanan)
              ? b.layanan
              : b.layanan
              ? [b.layanan]
              : []),
        },
      };
    }
  } catch {}

  try {
    const res = await api.get(`/api/transaksi/${bookingId}`);
    const data = res.data?.data || res.data;

    if (data) {
      const b = data.booking || data;
      const bId = b.id_booking || b.id || bookingId;

      return {
        booking: {
          ...b,
          booking_code:
            b.booking_code ||
            b.kode_booking ||
            data.booking_code ||
            data.kode_booking ||
            (bId
              ? String(bId).startsWith("B-")
                ? bId
                : `B-${bId}`
              : `B-${bookingId}`),
          layanan:
            b.layanan_items ||
            data.layanan_items ||
            (Array.isArray(b.layanan)
              ? b.layanan
              : b.layanan
              ? [b.layanan]
              : Array.isArray(data.layanan)
              ? data.layanan
              : data.layanan
              ? [data.layanan]
              : []),
          transaksi: data.transaksi || b.transaksi || null,
        },
        tenaga_medis_tracking:
          data.tenaga_medis || b.tenaga_medis || null,
        tracking_info: data.tracking_info || null,
      };
    }
  } catch {}

  return null;
};

/* =========================================================
 * CHAT
 * =======================================================*/
export const sendBookingChat = async (bookingId, content) => {
  const res = await api.post(`/api/booking/${bookingId}/chat`, { content });
  return res.data;
};

export const getWebSocketConfig = async () => {
  try {
    const res = await api.get("/api/websocket/config");
    return res.data;
  } catch (error) {
    console.warn("Gagal memuat konfigurasi websocket:", error);
    return null;
  }
};

export const getBookingChatHistory = async (bookingId) => {
  try {
    const res = await api.get(`/api/booking/${bookingId}/chat`);
    return res.data;
  } catch {
    try {
      const fallback = await api.get(
        `/api/manage-admin/chat-rooms/${bookingId}`
      );
      return fallback.data;
    } catch {
      return null;
    }
  }
};
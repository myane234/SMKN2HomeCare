import api from './api';

export const createBooking = async (bookingData) => {
  try {
    const res = await api.post('/api/booking', bookingData);

    return res.data;
  } catch (error) {
    console.error('Error creating booking:', error);

    // Tampilkan detail error dari backend jika tersedia
    if (error.response) {
      console.error('Booking error status:', error.response.status);
      console.error('Booking error response:', error.response.data);
      console.error('Booking error request:', error.config?.data);
    } else if (error.request) {
      console.error('Booking error request:', error.request);
    } else {
      console.error('Booking error message:', error.message);
    }

    throw error;
  }
};

export const confirmPayment = async ({ id_booking, order_id }) => {
  try {
    const res = await api.post('/api/transaksi/confirm', {
      id_booking,
      order_id,
    });

    return res.data;
  } catch (error) {
    console.error('Error confirming payment:', error);

    // Tampilkan detail error dari backend jika tersedia
    if (error.response) {
      console.error('Payment error status:', error.response.status);
      console.error('Payment error response:', error.response.data);
    } else if (error.request) {
      console.error('Payment error request:', error.request);
    } else {
      console.error('Payment error message:', error.message);
    }

    throw error;
  }
};

export const ACTIVE_BOOKING_STATUSES = ["Pending", "Dikonfirmasi", "DiPerjalanan", "Tindakan"];

const LOCAL_ACTIVE_STORAGE_KEY = 'smarthomecare_active_bookings';

export const getLocalActiveBookings = () => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(LOCAL_ACTIVE_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const saveLocalActiveBooking = (bookingData) => {
  if (typeof window === 'undefined' || !bookingData) return;
  try {
    const current = getLocalActiveBookings();
    const bId = bookingData.id_booking || bookingData.id;
    if (!bId) return;
    const filtered = current.filter(item => String(item.id_booking || item.id) !== String(bId));
    filtered.unshift(bookingData);
    localStorage.setItem(LOCAL_ACTIVE_STORAGE_KEY, JSON.stringify(filtered.slice(0, 10)));
  } catch (e) {
    console.warn('Gagal menyimpan local active booking', e);
  }
};

export const removeLocalActiveBooking = (bookingId) => {
  if (typeof window === 'undefined' || !bookingId) return;
  try {
    const current = getLocalActiveBookings();
    const filtered = current.filter(item => String(item.id_booking || item.id) !== String(bookingId));
    localStorage.setItem(LOCAL_ACTIVE_STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {}
};

export const getBookingAktif = async () => {
  try {
    const res = await api.get('/api/booking/terkini');
    return res.data;
  } catch (error) {
    if (error.response?.status === 404) return null;
    throw error;
  }
};

export const getSemuaBookingAktif = async () => {
  try {
    // 1. Ambil booking terkini (yang punya data live tracking / GPS nakes)
    let terkiniData = null;
    try {
      terkiniData = await getBookingAktif();
    } catch {}

    // 2. Ambil transaksi aktif dari /api/transaksi
    let transaksiItems = [];
    try {
      const res = await api.get('/api/transaksi', { params: { per_page: 20 } });
      const rawData = res.data?.data || res.data;
      if (Array.isArray(rawData)) {
        transaksiItems = rawData;
      }
    } catch {}

    // 3. Gabungkan dan filter status aktif
    const map = new Map();

    // Masukkan data dari terkini jika aktif
    if (terkiniData?.data?.booking) {
      const b = terkiniData.data.booking;
      const bId = b.id_booking || b.id;
      if (bId && ACTIVE_BOOKING_STATUSES.includes(b.status_booking)) {
        map.set(String(bId), {
          booking: b,
          tenaga_medis_tracking: terkiniData.data.tenaga_medis_tracking ?? null,
          tracking_info: terkiniData.data.tracking_info ?? null,
        });
      }
    }

    // Masukkan data transaksi aktif
    transaksiItems.forEach((t) => {
      const bId = String(t.id_booking || t.id || '');
      if (!bId) return;
      const status = t.status_booking || t.status?.value || t.status;
      if (ACTIVE_BOOKING_STATUSES.includes(status)) {
        if (!map.has(bId)) {
          map.set(bId, {
            booking: {
              ...t,
              status_booking: status,
              layanan: t.layanan_items || (t.layanan ? [t.layanan] : []),
              booking_code: t.booking_code || `#${bId}`,
            },
            tenaga_medis_tracking: t.tenaga_medis || null,
            tracking_info: null,
          });
        }
      } else if (status === 'Selesai' || status === 'Dibatalkan') {
        removeLocalActiveBooking(bId);
      }
    });

    // Masukkan dari cache local jika ada yang baru dibuat
    const localBookings = getLocalActiveBookings();
    localBookings.forEach((local) => {
      const bId = String(local.id_booking || local.id || '');
      if (bId && !map.has(bId)) {
        const status = local.status_booking || 'Pending';
        if (ACTIVE_BOOKING_STATUSES.includes(status)) {
          map.set(bId, {
            booking: local,
            tenaga_medis_tracking: null,
            tracking_info: null,
          });
        }
      }
    });

    return Array.from(map.values());
  } catch (error) {
    console.warn('Gagal memuat semua booking aktif:', error);
    return [];
  }
};

export const getDetailBookingById = async (bookingId) => {
  if (!bookingId) return null;
  // Cek apakah bookingId sama dengan booking terkini
  try {
    const terkini = await getBookingAktif();
    const tId = terkini?.data?.booking?.id_booking || terkini?.data?.booking?.id;
    if (String(tId) === String(bookingId)) {
      return terkini.data;
    }
  } catch {}

  // Ambil dari detail transaksi
  try {
    const res = await api.get(`/api/transaksi/${bookingId}`);
    const data = res.data?.data || res.data;
    if (data) {
      const b = data.booking || data;
      return {
        booking: {
          ...b,
          layanan: data.layanan_items || (b.layanan ? [b.layanan] : []),
          transaksi: data.transaksi || b.transaksi || null,
        },
        tenaga_medis_tracking: data.tenaga_medis || b.tenaga_medis || null,
        tracking_info: data.tracking_info || null,
      };
    }
  } catch {}

  return null;
};

export const sendBookingChat = async (bookingId, content) => {
  const res = await api.post(`/api/booking/${bookingId}/chat`, { content });
  return res.data;
};

export const getWebSocketConfig = async () => {
  try {
    const res = await api.get('/api/websocket/config');
    return res.data;
  } catch (error) {
    console.warn('Gagal memuat konfigurasi websocket:', error);
    return null;
  }
};

export const getBookingChatHistory = async (bookingId) => {
  try {
    const res = await api.get(`/api/booking/${bookingId}/chat`);
    return res.data;
  } catch (error) {
    // Coba fallback ke endpoint alternatif jika ada
    try {
      const fallback = await api.get(`/api/manage-admin/chat-rooms/${bookingId}`);
      return fallback.data;
    } catch {
      return null;
    }
  }
};
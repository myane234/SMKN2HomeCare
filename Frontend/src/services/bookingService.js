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

export const getBookingAktif = async () => {
  try {
    const res = await api.get('/api/booking/terkini');
    return res.data;
  } catch (error) {
    if (error.response?.status === 404) return null;
    throw error;
  }
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
import { URL } from '../utils/getUrl.js';
import { getAuthHeaders, handleUnauthorized } from '../utils/auth.js';

export const emailData = {
  // Mengirim email manual / tunggal
  sendEmail: async (payload) => {
    try {
      const response = await fetch(`${URL}/admin/emails/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        handleUnauthorized();
        throw new Error('Unauthorized');
      }

      const data = await response.json();
      if (!response.ok) throw data;
      return data;
    } catch (error) {
      throw error.message ? error : { message: error.message || 'Terjadi kesalahan' };
    }
  },

  // Broadcast email massal (pasien / nakes / all)
  broadcastEmail: async (payload) => {
    try {
      const response = await fetch(`${URL}/admin/emails/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        handleUnauthorized();
        throw new Error('Unauthorized');
      }

      const data = await response.json();
      if (!response.ok) throw data;
      return data;
    } catch (error) {
      throw error.message ? error : { message: error.message || 'Terjadi kesalahan' };
    }
  },

  // Kirim ulang invoice booking
  sendInvoice: async (idBooking) => {
    try {
      const response = await fetch(`${URL}/admin/emails/send-invoice/${idBooking}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });

      if (response.status === 401) {
        handleUnauthorized();
        throw new Error('Unauthorized');
      }

      const data = await response.json();
      if (!response.ok) throw data;
      return data;
    } catch (error) {
      throw error.message ? error : { message: error.message || 'Terjadi kesalahan' };
    }
  },

  // Mengambil log riwayat pengiriman email
  getLogs: async (params = {}) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const endpoint = `${URL}/admin/emails/logs${queryString ? `?${queryString}` : ''}`;

      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });

      if (response.status === 401) {
        handleUnauthorized();
        throw new Error('Unauthorized');
      }

      const data = await response.json();
      if (!response.ok) throw data;
      return data;
    } catch (error) {
      throw error.message ? error : { message: error.message || 'Terjadi kesalahan' };
    }
  },
};
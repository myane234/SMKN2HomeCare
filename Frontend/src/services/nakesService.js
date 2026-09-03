// src/services/nakesService.js
import api from './api';

/**
 * Register Nakes (Tenaga Kesehatan) - Gabung Mitra
 * @param {FormData} formData - Data pendaftaran dalam bentuk FormData
 * @returns {Promise} Response dari API
 */
export const registerNakes = async (formData) => {
  try {
    const response = await api.post('/api/nakes/register', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (error) {
    console.error('Gagal mendaftarkan nakes:', error);
    throw error;
  }
};

/**
 * Get list of available provinces for wilayah layanan
 */
export const getProvinsi = async () => {
  try {
    const response = await api.get('/api/provinsi');
    return response.data;
  } catch (error) {
    console.error('Gagal mengambil provinsi:', error);
    throw error;
  }
};

/**
 * Get list of medical service categories
 */
export const getKategoriLayanan = async () => {
  try {
    const response = await api.get('/api/layanan?ambil_kategori=true');
    return response.data;
  } catch (error) {
    console.error('Gagal mengambil kategori layanan:', error);
    throw error;
  }
};

/**
 * Update Data Operasional Nakes
 */
export const updateDataOperasional = async (payload) => {
  try {
    const response = await api.post('/api/nakes/data-operasional', payload);
    return response.data;
  } catch (error) {
    console.error('Gagal memperbarui data operasional:', error);
    throw error;
  }
};

/**
 * Get Data Operasional Nakes
 */
export const getDataOperasional = async () => {
  try {
    const response = await api.get('/api/nakes/data-operasional');
    return response.data;
  } catch (error) {
    console.error('Gagal mengambil data operasional:', error);
    throw error;
  }
};

/** Get bookings assigned to the authenticated nakes. */
export const getNakesOrders = async () => {
  const response = await api.get('/api/nakes/orders');
  return response.data;
};

/** Get bookings already accepted or completed by the authenticated nakes. */
export const getNakesBookings = async () => {
  const response = await api.get('/api/nakes/booking');
  return response.data;
};

// src/services/nakesService.js

/** Get one booking detail. */
export const getNakesOrderDetail = async (bookingId) => {
  const response = await api.get(`/api/nakes/order/${encodeURIComponent(bookingId)}`);
  return response.data;
};

/** Accept one booking. */
/** Accept one booking with optional payload (GPS coordinates). */
export const acceptNakesBooking = async (bookingId, payload = {}) => {
  const response = await api.post(`/api/nakes/booking/${encodeURIComponent(bookingId)}/terima`, payload);
  return response.data;
};

/** Reject one booking. */
export const rejectNakesBooking = async (bookingId) => {
  const response = await api.post(`/api/nakes/booking/${encodeURIComponent(bookingId)}/tolak`);
  return response.data;
};
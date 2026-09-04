import api from './api';

export const getTransaksiPasien = async (params = {}) => {
  try {
    // Parameter yang bisa dikirim: page, per_page, status_booking, tanggal_dari, sort_by, sort_order
    const response = await api.get('/api/transaksi', { params });

    // Sesuaikan kembalian (return) dengan struktur response API backend kamu
    // Biasanya di Laravel ada response.data.data untuk list dan response.data.meta untuk pagination
    return response.data;
  } catch (error) {
    console.error('Error fetching transaksi:', error);
    throw error;
  }
};

export const getDetailTransaksi = async (idBooking) => {
  try {
    const response = await api.get(`/api/transaksi/${idBooking}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching detail transaksi:', error);
    throw error;
  }
};
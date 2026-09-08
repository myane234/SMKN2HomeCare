import api from './api';

export const pembayaranService = {
  // Ambil semua kategori pembayaran dari CMS
  getKategori: async () => {
    try {
      const response = await api.get('/api/pembayaran/kategori');
      return response.data;
    } catch (error) {
      try {
        const responseFallback = await api.get('/api/kategori');
        return responseFallback.data;
      } catch (err) {
        console.warn('Gagal mengambil kategori pembayaran dari API CMS:', err?.message || err);
        return { success: false, data: [] };
      }
    }
  },

  // Ambil semua metode pembayaran dari CMS
  getMetode: async () => {
    try {
      const response = await api.get('/api/pembayaran/metode');
      return response.data;
    } catch (error) {
      try {
        const responseFallback = await api.get('/api/metode');
        return responseFallback.data;
      } catch (err) {
        console.warn('Gagal mengambil metode pembayaran dari API CMS:', err?.message || err);
        return { success: false, data: [] };
      }
    }
  },
};
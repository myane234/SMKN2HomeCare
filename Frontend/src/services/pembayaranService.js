import api from "./api";

export const pembayaranService = {
  getKategori: async () => {
    try {
      const response = await api.get("/api/pembayaran/kategori");
      return response.data;
    } catch (error) {
      try {
        const responseFallback = await api.get("/api/kategori");
        return responseFallback.data;
      } catch (fallbackError) {
        console.warn(
          "Gagal mengambil kategori pembayaran dari API:",
          fallbackError?.message || fallbackError
        );

        return { success: false, data: [] };
      }
    }
  },

  getMetode: async () => {
    try {
      const response = await api.get("/api/pembayaran/metode");
      return response.data;
    } catch (error) {
      console.error(
        "Gagal mengambil metode pembayaran dari API:",
        error?.message || error
      );

      throw error;
    }
  },
};
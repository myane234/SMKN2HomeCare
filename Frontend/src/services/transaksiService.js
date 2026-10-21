import api from "./api";

export const getTransaksiPasien = async (params = {}) => {
  try {
    const response = await api.get("/api/transaksi", { params });
    return response.data;
  } catch (error) {
    console.error("Error fetching transaksi:", error);
    throw error;
  }
};

export const getDetailTransaksi = async (idBooking) => {
  try {
    const response = await api.get(
      `/api/transaksi/${encodeURIComponent(idBooking)}`
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching detail transaksi:", error);
    throw error;
  }
};

export const getBiayaTambahanTransaksi = async (bookingCode) => {
  if (!bookingCode) {
    return {
      success: false,
      data: {
        items: [],
        nominal: 0,
        status_transaksi: null,
      },
    };
  }

  try {
    const response = await api.get(
      `/api/booking/${encodeURIComponent(
        String(bookingCode).trim()
      )}/biaya-tambahan`
    );

    return response.data;
  } catch (error) {
    console.error(
      "Error fetching biaya tambahan transaksi:",
      error
    );
    throw error;
  }
};
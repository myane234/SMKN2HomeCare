import api from './api';

export const createBooking = async (bookingData) => {
  try {
    const res = await api.post('/api/booking', bookingData);
    return res.data;
  } catch (error) {
    console.error('Error creating booking:', error);
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
    throw error;
  }
};

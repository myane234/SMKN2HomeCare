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
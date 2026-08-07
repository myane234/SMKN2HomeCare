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
export const getWilayahLayanan = async () => {
  try {
    const response = await api.get('/api/wilayah-layanan');
    return response.data;
  } catch (error) {
    console.error('Gagal mengambil wilayah layanan:', error);
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

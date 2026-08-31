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
import api from './api';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

/**
 * Ambil daftar bank aktif (public)
 */
export async function getBankList() {
  try {
    const response = await api.get('/api/banks');
    return response.data?.data || [];
  } catch (error) {
    console.error('[NakesCompletion] Gagal ambil daftar bank:', error?.response?.data?.message || error.message);
    return [];
  }
}

/**
 * Submit kelengkapan data nakes (pas foto, NPWP, bank, pakta integritas)
 * @param {FormData} formData
 */
export async function submitNakesCompletion(formData) {
  try {
    const response = await api.post('/api/nakes/complete-data', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return { success: true, data: response.data };
  } catch (error) {
    const errData = error?.response?.data;
    if (errData?.errors) {
      const firstError = Object.values(errData.errors)[0];
      const msg = Array.isArray(firstError) ? firstError[0] : firstError;
      return { success: false, message: msg || 'Validasi gagal' };
    }
    return {
      success: false,
      message: errData?.message || 'Gagal menyimpan data. Periksa koneksi Anda.'
    };
  }
}

/**
 * Download template pakta integritas
 */
export async function downloadPaktaIntegritas() {
  try {
    const response = await api.get('/api/nakes/pakta-integritas/download', {
      responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Pakta_Integritas_SmartHomeCare.pdf');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    return { success: true };
  } catch (error) {
    console.error('[NakesCompletion] Gagal download pakta integritas:', error?.response?.data?.message || error.message);
    return { success: false, message: 'File belum tersedia. Silakan hubungi admin.' };
  }
}

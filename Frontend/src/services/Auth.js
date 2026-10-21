import axios from 'axios';
import api from '@/services/api';
import { clearAllAuthCookies } from './cookieHelper';

/**
 * Login dengan Google OAuth2 access_token.
 * Dipanggil setelah mendapat access_token dari useGoogleLogin (flow: 'implicit').
 * Backend: POST /api/googleAuth  { access_token }
 */
export const loginWithGoogleAPI = async (accessToken) => {
  try {
    const res = await api.post('/api/googleAuth', { access_token: accessToken });

    // Response Google login FLAT (tidak nested di data):
    // { success, message, token, user, roles, is_profile_complete }
    const token = res.data?.token || res.data?.access_token || res.data?.data?.token;

    if (token) {
      document.cookie = `auth_token=${token}; path=/; max-age=604800; SameSite=Lax`;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth:state-change'));
      }
    }

    return res.data;
  } catch (err) {
    console.error('Google login error:', err);
    if (axios.isAxiosError(err)) {
      const status = err.response?.status;
      const data = err.response?.data;
      console.error('[GoogleLogin] Status:', status, 'Response:', data);
      throw new Error(data?.error || data?.message || data?.exception || `Login Google gagal (${status || 'network error'})`);
    }
    throw err;
  }
};

/**
 * Login manual dengan email & password.
 * Backend: POST /api/login  { email, password }
 * Response: { success, message, data: { token, roles, nama, is_profile_complete } }
 */
export async function loginForm(email, password) {
  try {
    const res = await api.post('/api/login', { email, password });

    const token = res.data?.token || res.data?.access_token || res.data?.data?.token;
    if (token) {
      document.cookie = `auth_token=${token}; path=/; max-age=604800; SameSite=Lax`;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('auth:state-change'));
      }
    }

    return res.data;
  } catch (err) {
    console.error('Login error:', err);
    if (axios.isAxiosError(err) && err.response?.data) {
      const errorObj = new Error(err.response.data.error || err.response.data.message || 'Login gagal');
      errorObj.status = err.response.status;
      errorObj.data = err.response.data;
      throw errorObj;
    }
    throw err;
  }
}

/**
 * Register pasien baru.
 * Backend: POST /api/register
 * Fields: email, password, nama_lengkap, nik (16 digit), golongan_darah, jenis_kelamin, alamat_utama
 */
export async function registerUser({
  email,
  password,
  nama_lengkap,
  no_hp,
  nik,
  golongan_darah,
  jenis_kelamin,
  alamat_utama,
  latitude,
  longitude,
}) {
  try {
    const payload = {
      email,
      password,
      nama_lengkap,
      no_hp,
      nik,
      golongan_darah,
      jenis_kelamin,
      alamat_utama,
    };

    if (latitude !== undefined && latitude !== null && !isNaN(latitude)) {
      payload.latitude = Number(latitude);
    } else {
      payload.latitude = -6.2088;
    }

    if (longitude !== undefined && longitude !== null && !isNaN(longitude)) {
      payload.longitude = Number(longitude);
    } else {
      payload.longitude = 106.8456;
    }

    const res = await api.post('/api/register', payload);

    return res.data;
  } catch (err) {
    console.error('Register error:', err);
    if (axios.isAxiosError(err) && err.response?.data) {
      const validationErrors = err.response.data.errors;
      if (validationErrors) {
        const firstError = Object.values(validationErrors)[0];
        const errorObj = new Error(Array.isArray(firstError) ? firstError[0] : firstError);
        errorObj.fieldErrors = validationErrors;
        throw errorObj;
      }
      throw new Error(err.response.data.message || 'Registrasi gagal');
    }
    throw err;
  }
}

/**
 * Logout user: hapus token Sanctum di backend dan bersihkan cookie lokal.
 */
export async function logoutUser() {
  try {
    const res = await api.post('/api/logout');
    return res.data;
  } catch (err) {
    console.warn('Backend logout warning (sesi mungkin sudah berakhir):', err?.response?.data?.message || err.message);
    return { success: false, message: err?.response?.data?.message || err.message };
  } finally {
    clearAllAuthCookies();
  }
}

export async function resendVerificationEmail(email) {
  try {
    const res = await api.post('/api/email/resend', { email });
    return res.data;
  } catch (err) {
    console.error('Resend email error:', err);
    if (axios.isAxiosError(err) && err.response?.data) {
      const data = err.response.data;
      const error = new Error(data.message || 'Gagal mengirim ulang email verifikasi.');
      if (err.response.status === 429) {
        error.retryAfter = data.retry_after || 60;
        error.isRateLimited = true;
      }
      throw error;
    }
    throw err;
  }
}

export async function changeUnverifiedEmail({ old_email, new_email }) {
  try {
    const res = await api.post('/api/change-unverified-email', {
      old_email,
      new_email,
    });
    return res.data;
  } catch (err) {
    console.error('Change email error:', err);
    if (axios.isAxiosError(err) && err.response?.data) {
      const validationErrors = err.response.data.errors;
      if (validationErrors) {
        const firstError = Object.values(validationErrors)[0];
        throw new Error(Array.isArray(firstError) ? firstError[0] : firstError);
      }
      throw new Error(err.response.data.message || 'Gagal mengubah email.');
    }
    throw err;
  }
}

/**
 * Cek apakah email sudah terdaftar di backend atau belum
 * @param {string} email
 * @returns {Promise<{ registered: boolean | null }>}
 */
export async function checkEmailRegistered(email) {
  if (!email) return { registered: null };
  const trimmedEmail = email.trim().toLowerCase();

  try {
    // 1. Coba endpoint check-email jika backend menyediakannya
    const res = await api.post('/api/check-email', { email: trimmedEmail });
    if (res.data?.registered !== undefined) {
      return { registered: Boolean(res.data.registered) };
    }
    if (res.data?.exists !== undefined) {
      return { registered: Boolean(res.data.exists) };
    }
  } catch (err) {
    // Jika endpoint /api/check-email tidak tersedia (404/405), gunakan teknik validasi via /api/register
    if (err.response?.status === 404 || err.response?.status === 405) {
      try {
        await api.post('/api/register', { email: trimmedEmail });
        return { registered: false };
      } catch (regErr) {
        if (regErr.response?.data?.errors?.email) {
          const emailErrStr = regErr.response.data.errors.email.join(' ').toLowerCase();
          if (
            emailErrStr.includes('taken') ||
            emailErrStr.includes('already') ||
            emailErrStr.includes('terdaftar') ||
            emailErrStr.includes('used')
          ) {
            return { registered: true };
          }
        }
        // Jika tidak ada pesan error di kolom email (hanya error kolom lain), berarti email belum terdaftar
        if (regErr.response?.data?.errors && !regErr.response.data.errors.email) {
          return { registered: false };
        }
      }
    }
  }
  return { registered: null };
}
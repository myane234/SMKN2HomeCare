import axios from 'axios';
import { getAuthToken, clearAllAuthCookies } from './cookieHelper';

const api = axios.create({
  baseURL: 'https://citra.faaruq.com',
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

// Interceptor: attach token dari cookie yang benar ('auth_token' atau 'smarthomecare-session')
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Jika 401 Unauthorized / Unauthenticated, sesi sudah tidak valid di backend
    if (error?.response?.status === 401 && typeof window !== 'undefined') {
      clearAllAuthCookies();
    }
    return Promise.reject(error);
  }
);

export default api;
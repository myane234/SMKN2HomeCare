import axios from 'axios';

const api = axios.create({
  baseURL: 'https://citra.faaruq.com',
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

// Interceptor: attach token dari cookie yang benar ('smarthomecare-session' atau 'auth_token')
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const cookies = document.cookie.split('; ');
    const targetCookie = cookies.find((row) => row.startsWith('smarthomecare-session=') || row.startsWith('auth_token='));
    
    if (targetCookie) {
      const eqIndex = targetCookie.indexOf('=');
      let token = targetCookie.substring(eqIndex + 1);
      try {
        token = decodeURIComponent(token);
      } catch (e) {
        // Fallback ke token mentah jika decode gagal
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
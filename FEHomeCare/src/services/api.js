import axios from 'axios';

// Gunakan relative URL agar request melewati Next.js rewrite proxy.
// next.config.mjs sudah mengatur: /api/:path* → backend/api/:path*
const api = axios.create({
  baseURL: typeof window !== 'undefined' ? window.location.origin : '',
  withCredentials: true,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

// Interceptor: attach Bearer token from cookie if available
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const authCookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith('auth_token='));
    if (authCookie) {
      // Extract value after 'auth_token=' prefix (handles tokens with '=' in them, e.g. JWT Base64 padding).
      // Server-side cookies from next/headers may URL-encode values, so decodeURIComponent is needed.
      // Try-catch ensures we fall back to raw value if decoding fails.
      let token = authCookie.substring('auth_token='.length);
      try {
        token = decodeURIComponent(token);
      } catch (e) {
        // Use raw token if decode fails
      }
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Interceptor: handle 401 by clearing session
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      // Clear cookies on unauthorized
      if (typeof window !== 'undefined') {
        document.cookie = 'auth_token=; path=/; max-age=0';
        document.cookie = 'is_logged_in=; path=/; max-age=0';
        document.cookie = 'user_roles=; path=/; max-age=0';
        document.cookie = 'user_nama=; path=/; max-age=0';
      }
    }
    return Promise.reject(error);
  }
);

export default api;

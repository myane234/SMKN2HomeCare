# Frontend Authentication Setup Guide

## 🔧 Best Practices untuk Frontend (Next.js / React)

### 1. Axios Configuration (RECOMMENDED)

```javascript
// lib/api.js atau services/api.js
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // ✅ PENTING: Send cookies dengan setiap request
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor untuk menambahkan token jika ada
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
});

// Interceptor untuk handle 401 errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Token expired atau invalid
      localStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_token');
      // Redirect to login
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 2. Initialize CSRF Token on App Load

```javascript
// pages/_app.js atau app/layout.js
import api from '@/lib/api';

export default function App({ Component, pageProps }) {
  useEffect(() => {
    // Get CSRF token dari Sanctum (optional if using stateful guard)
    api.get('/sanctum/csrf-cookie').catch(() => {
      // Not critical if it fails
      console.log('CSRF cookie initialized');
    });
  }, []);

  return <Component {...pageProps} />;
}
```

### 3. Login Flow

```javascript
// pages/auth/login.js atau app/auth/login/page.js
import api from '@/lib/api';
import { useRouter } from 'next/router'; // or 'next/navigation'

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (email, password) => {
    try {
      setLoading(true);
      
      // POST ke API login
      const response = await api.post('/api/login', {
        email,
        password,
      });

      // Simpan token (jika API return token)
      if (response.data.token) {
        localStorage.setItem('auth_token', response.data.token);
      }

      // Simpan user data
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Redirect ke dashboard
      router.push('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login gagal');
    } finally {
      setLoading(false);
    }
  };

  return (
    // Form JSX
  );
}
```

### 4. Protected Route Component

```javascript
// components/ProtectedRoute.js atau middleware/auth.js (Next.js 13+)
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import api from '@/lib/api';

export function ProtectedRoute({ children, requiredRole = null }) {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Verify user is authenticated
        const response = await api.get('/api/user');
        
        if (requiredRole) {
          // Check if user has required role
          if (!response.data.roles?.includes(requiredRole)) {
            router.push('/unauthorized');
            return;
          }
        }
        
        setIsAuthorized(true);
      } catch (error) {
        // Not authenticated
        router.push('/auth/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!isAuthorized) return null;

  return children;
}
```

### 5. Complete Profile Request

```javascript
// pages/complete-profile.js
import api from '@/lib/api';
import { useRouter } from 'next/router';

export default function CompleteProfilePage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nama_lengkap: '',
    tanggal_lahir: '',
    jenis_kelamin: '',
    alamat: '',
    nomor_telepon: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Request ini REQUIRES authentication (role:pasien)
      const response = await api.post('/api/pasien/complete-profile', formData);
      
      console.log('Profile updated:', response.data);
      router.push('/dashboard');
    } catch (error) {
      if (error.response?.status === 401) {
        alert('Silakan login terlebih dahulu');
        router.push('/auth/login');
      } else if (error.response?.status === 403) {
        alert('Anda tidak memiliki akses untuk menyelesaikan profil ini');
      } else {
        alert(error.response?.data?.message || 'Error updating profile');
      }
    }
  };

  return (
    // Form JSX
  );
}
```

## 📋 Environment Variables

Buat file `.env.local`:

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_NAME=SmartHomeCare
```

## 🚀 Important Notes

1. **Credentials Header**
   - Fetch: `credentials: 'include'`
   - Axios: `withCredentials: true`
   - WAJIB untuk cookie-based authentication

2. **Token Management**
   - Jika API return JWT token, simpan di localStorage atau sessionStorage
   - Jangan simpan token di cookie dari frontend (biarkan backend set via Set-Cookie header)
   - Refresh token jika expired

3. **CORS Headers**
   - Backend sudah dikonfigure untuk accept requests dari:
     - `http://localhost:3000`
     - `http://localhost:5173`
   - Jika ganti port, update di `.env` backend (`SANCTUM_STATEFUL_DOMAINS`)

4. **Error Handling**
   - 401 Unauthorized: User tidak login atau token expired → Redirect ke login
   - 403 Forbidden: User tidak punya role yang dibutuhkan → Show error message
   - 422 Unprocessable Entity: Validation error → Show field errors

5. **Testing dengan Postman/Insomnia**
   ```
   POST http://localhost:8000/api/login
   Content-Type: application/json
   
   {
     "email": "user@example.com",
     "password": "password123"
   }
   ```
   Pastikan Postman settings: Cookies ✅ enabled, Authorization type = Bearer token

## 🔍 Debugging

Buka Browser DevTools (F12):
- Network tab: Lihat request headers & response headers
- Application tab: Lihat cookies (harus ada XSRF-TOKEN, LARAVEL_SESSION)
- Console: Check untuk CORS errors

Jika masih error CORS:
1. Verify backend .env: `SANCTUM_STATEFUL_DOMAINS` includes frontend URL
2. Verify requests include `withCredentials: true`
3. Restart Laravel server: `php artisan serve`


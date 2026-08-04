import { URL } from './getUrl.js';

const AUTH_KEY = 'cmsHomeCare_auth';

export async function login(email, password, isSuperAdminPath = false) {
  try {
    const endpoint = isSuperAdminPath ? '/super-admin/login' : '/admin/login';
    const res = await fetch(`${URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const body = await res.json();

    if (res.ok && body.success) {
      // Debug: lihat response dari backend di console browser (F12)
      console.log('🔐 Login response body:', JSON.stringify(body.data, null, 2));
      console.log('🔐 Roles from backend:', body.data.roles);


      let roles = body.data.roles ?? body.data.role ?? [];
      if (typeof roles === 'string') {
        roles = [roles];
      } else if (!Array.isArray(roles)) {
        roles = []; 
      }

      if (body.data.tier_admin === 'Super Admin' && !roles.includes('super_admin')) {
        roles.push('super_admin');
      }

      const session = {
        token: body.data.token,
        email,
        name: body.data.nama || 'Admin',
        roles: roles,
        loggedInAt: new Date().toISOString(),
      };
      localStorage.setItem(AUTH_KEY, JSON.stringify(session));
      console.log(' Session saved:', JSON.stringify(session, null, 2));
      console.log(' Is Super Admin?', roles.includes('super_admin'));
      return { success: true, roles: session.roles };
    }
    
    return { success: false, message: body.message || 'Email atau password salah' };
  } catch {
    return { success: false, message: 'Gagal menghubungi server' };
  }
}

export async function logout() {
  const session = getSession();
  if (session?.token) {
    try {
      await fetch(`${URL}/admin/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.token}`
        },
      });
    } catch {
      // Ignore error on logout
    }
  }
  localStorage.removeItem(AUTH_KEY);
}

export function getSession() {
  const raw = localStorage.getItem(AUTH_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function isAuthenticated() {
  return !!getSession();
}

export function getAuthHeaders(additionalHeaders = {}) {
  const session = getSession();
  const headers = { ...additionalHeaders };
  if (session?.token) {
    headers['Authorization'] = `Bearer ${session.token}`;
  }
  return headers;
}

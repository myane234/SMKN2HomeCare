// Helper for managing authentication tokens and cookies cleanly

export function getCookie(name) {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^|;\\s*)' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[2]) : null;
}

export function getAuthToken() {
  if (typeof document === 'undefined') return null;
  const token = getCookie('auth_token') || getCookie('smarthomecare-session');
  if (!token) return null;
  const cleaned = token.trim();
  if (!cleaned || cleaned === 'null' || cleaned === 'undefined') {
    return null;
  }
  return cleaned;
}

export function isAuthenticated() {
  return Boolean(getAuthToken());
}

export const ALL_AUTH_COOKIES = [
  'auth_token',
  'smarthomecare-session',
  'is_logged_in',
  'user_roles',
  'user_nama',
  'active_role',
  'role',
  'user_profile',
  'profile_avatar',
  'profile_email',
  'profile_id_user',
  'profile_roles',
  'is_profile_complete',
  'profile_nama',
  'profile_nik',
  'profile_golongan_darah',
  'profile_jenis_kelamin',
  'profile_alamat',
  'tenaga_medis',
];

export function clearAllAuthCookies() {
  if (typeof document === 'undefined') return;

  ALL_AUTH_COOKIES.forEach((name) => {
    document.cookie = name + '=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  });

  try {
    localStorage.removeItem('token');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_profile');
  } catch (e) {
    // Abaikan jika localStorage tidak dapat diakses
  }

  // Beritahu seluruh komponen bahwa sesi auth telah berakhir
  try {
    window.dispatchEvent(new Event('auth:logout'));
    window.dispatchEvent(new Event('auth:state-change'));
  } catch (e) {
    // Abaikan pada non-browser environment
  }
}

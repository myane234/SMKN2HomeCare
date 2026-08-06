import api from './api'; // PERBAIKAN 1: Path import diperbaiki

/**
 * Fetch profile data directly from API
 */
export const getProfileMe = async () => {
  try {
    const response = await api.get('/api/profile/me'); // PERBAIKAN 2: Ditambahkan /api
    return response.data;
  } catch (error) {
    console.error("Gagal mengambil profil:", error);
    throw error;
  }
};

/**
 * Fetch profile data from /api/profile/me and store in cookies.
 */
export async function fetchAndStoreProfile() {
  try {
    const response = await api.get('/api/profile/me');
    const data = response.data;

    if (data?.success && data?.data) {
      const profile = data.data;

      document.cookie = `user_profile=${encodeURIComponent(JSON.stringify(profile))}; path=/; max-age=604800; SameSite=Lax`;

      if (profile.user?.email) {
        document.cookie = `profile_email=${encodeURIComponent(profile.user.email)}; path=/; max-age=604800; SameSite=Lax`;
      }

      if (profile.user?.id_user) {
        document.cookie = `profile_id_user=${profile.user.id_user}; path=/; max-age=604800; SameSite=Lax`;
      }

      if (profile.roles) {
        document.cookie = `profile_roles=${encodeURIComponent(JSON.stringify(profile.roles))}; path=/; max-age=604800; SameSite=Lax`;
      }

      if (profile.is_profile_complete !== undefined) {
        document.cookie = `is_profile_complete=${profile.is_profile_complete}; path=/; max-age=604800; SameSite=Lax`;
      }

      if (profile.pasien) {
        if (profile.pasien.nama_lengkap) {
          document.cookie = `profile_nama=${encodeURIComponent(profile.pasien.nama_lengkap)}; path=/; max-age=604800; SameSite=Lax`;
          document.cookie = `user_nama=${encodeURIComponent(profile.pasien.nama_lengkap)}; path=/; max-age=604800; SameSite=Lax`;
        }
        if (profile.pasien.nik) {
          document.cookie = `profile_nik=${profile.pasien.nik}; path=/; max-age=604800; SameSite=Lax`;
        }
        if (profile.pasien.golongan_darah) {
          document.cookie = `profile_golongan_darah=${profile.pasien.golongan_darah}; path=/; max-age=604800; SameSite=Lax`;
        }
        if (profile.pasien.jenis_kelamin) {
          document.cookie = `profile_jenis_kelamin=${profile.pasien.jenis_kelamin}; path=/; max-age=604800; SameSite=Lax`;
        }
        if (profile.pasien.alamat_utama) {
          document.cookie = `profile_alamat=${encodeURIComponent(profile.pasien.alamat_utama)}; path=/; max-age=604800; SameSite=Lax`;
        }
      }

      if (profile.tenaga_medis) {
        document.cookie = `tenaga_medis=${encodeURIComponent(JSON.stringify(profile.tenaga_medis))}; path=/; max-age=604800; SameSite=Lax`;
      }

      console.log('[Profile] Data profile berhasil disimpan ke cookies');
      return profile;
    }

    return null;
  } catch (error) {
    console.error('[Profile] Gagal mengambil data profile:', error?.response?.data?.message || error.message);
    return null;
  }
}

/**
 * Get profile data from cookies (client-side).
 */
export function getProfileFromCookies() {
  const getCookie = (name) => {
    const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
    return match ? decodeURIComponent(match[2]) : null;
  };

  const profileStr = getCookie('user_profile');
  if (!profileStr) return null;

  try {
    return JSON.parse(profileStr);
  } catch {
    return null;
  }
}

/**
 * Update pasien profile via PUT /api/pasien
 */
export async function updatePasienProfile(payload) {
  try {
    const response = await api.put('/api/pasien', payload);
    const data = response.data;

    if (data?.success) {
      await fetchAndStoreProfile();
      return { success: true, message: data.message || 'Profil berhasil diperbarui' };
    }

    return { success: false, message: data?.message || 'Gagal memperbarui profil' };
  } catch (error) {
    console.error('[Profile] Gagal update profil:', error?.response?.data?.message || error.message);
    
    const errData = error?.response?.data;
    if (errData?.errors) {
      const firstError = Object.values(errData.errors)[0];
      const msg = Array.isArray(firstError) ? firstError[0] : firstError;
      return { success: false, message: msg || 'Validasi gagal' };
    }
    
    return { 
      success: false, 
      message: errData?.message || 'Gagal memperbarui profil. Periksa koneksi Anda.' 
    };
  }
}

/**
 * Clear all profile cookies.
 */
export function clearProfileCookies() {
  const profileCookies = [
    'user_profile',
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

  profileCookies.forEach((name) => {
    document.cookie = `${name}=; path=/; max-age=0`;
  });
}
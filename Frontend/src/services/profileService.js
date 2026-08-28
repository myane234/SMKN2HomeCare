import api from './api';

export const getProfileMe = async () => {
  try {
    const response = await api.get('/api/profile/me');
    return response.data;
  } catch (error) {
    console.error("Gagal mengambil profil:", error);
    throw error;
  }
};

// PENGAMANAN EKSTRIM: Paksa ubah path apa pun menjadi URL absolut yang benar
const formatAvatarUrl = (avatar) => {
  if (!avatar) return null;
  if (avatar.includes('googleusercontent.com')) return null;
  if (avatar.startsWith('http://') || avatar.startsWith('https://')) return avatar;

  // Ambil nama file atau path terakhirnya saja, abaikan direktori sampah dari backend jika ada
  const cleaned = avatar.replace(/\\/g, '/').replace(/^\/+/, '');
  const filename = cleaned.split('/').pop(); // Ambil nama file terakhir (misal: "abc.jpg")
  
  if (!filename) return null;

  // Tembak langsung ke struktur path standar Laravel storage
  return `https://citra.faaruq.com/storage/avatars/${filename}`;
};

export async function fetchAndStoreProfile() {
  try {
    const response = await api.get('/api/profile/me');
    const data = response.data;

    if (data?.success && data?.data) {
      const profile = data.data;

      if (profile.pasien?.avatar) {
        profile.pasien.avatar = formatAvatarUrl(profile.pasien.avatar);
      }

      document.cookie = `user_profile=${encodeURIComponent(JSON.stringify(profile))}; path=/; max-age=604800; SameSite=Lax`;

      if (profile.user?.email) {
        document.cookie = `profile_email=${encodeURIComponent(profile.user.email)}; path=/; max-age=604800; SameSite=Lax`;
      }

      if (profile.pasien?.avatar) {
        document.cookie = `profile_avatar=${encodeURIComponent(profile.pasien.avatar)}; path=/; max-age=604800; SameSite=Lax`;
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

      return profile;
    }

    return null;
  } catch (error) {
    console.error('[Profile] Gagal mengambil data profile:', error?.response?.data?.message || error.message);
    return null;
  }
}

export function getProfileFromCookies() {
  const getCookie = (name) => {
    const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
    return match ? decodeURIComponent(match[2]) : null;
  };

  const profileStr = getCookie('user_profile');
  if (!profileStr) return null;

  try {
    const profileData = JSON.parse(profileStr);

    if (profileData && profileData.pasien && profileData.pasien.avatar) {
      profileData.pasien.avatar = formatAvatarUrl(profileData.pasien.avatar);
    }

    return profileData;
  } catch {
    return null;
  }
}

export async function updatePasienProfile(payload) {
  try {
    const formData = new FormData();
    
    Object.keys(payload).forEach((key) => {
      if (key !== 'avatar' && payload[key] !== null && payload[key] !== undefined) {
        formData.append(key, payload[key]);
      }
    });

    if (payload.avatar instanceof File) {
      formData.append('avatar', payload.avatar);
    } else if (payload.avatar === 'DELETE') {
      formData.append('avatar', '');
    }

    formData.append('_method', 'PUT');

    const response = await api.post('/api/pasien', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    const data = response.data;

    if (data?.success) {
      await fetchAndStoreProfile();
      return { success: true, message: data.message || 'Profil berhasil diperbarui' };
    }

    return { success: false, message: data?.message || 'Gagal memperbarui profil' };
  } catch (error) {
    console.error('[Profile] Gagal update profil:', error?.response?.data || error.message);
    
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

export function clearProfileCookies() {
  const profileCookies = [
    'user_profile', 'profile_avatar', 'profile_email', 'profile_id_user', 
    'profile_roles', 'is_profile_complete', 'profile_nama', 'profile_nik', 
    'profile_golongan_darah', 'profile_jenis_kelamin', 'profile_alamat', 'tenaga_medis',
  ];

  profileCookies.forEach((name) => {
    document.cookie = `${name}=; path=/; max-age=0`;
  });
}
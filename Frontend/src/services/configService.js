import api from './api';

const getBaseUrl = () => process.env.NEXT_PUBLIC_API_URL || 'https://citra.faaruq.com';

export const DEFAULT_GLOBAL_CONFIG = {
  app_name: 'SmartHomeCare',
  app_logo: '/images/logo/logo.png',
  app_favicon: '/favicon.ico',
  whatsapp_number: '6281234567890',
  phone_number: '(021) 1234 5678',
  email: 'info@smarthomecare.id',
  address: 'Jakarta, Indonesia',
  socials: [
    { name: 'Instagram', icon: 'fa-instagram', url: '#', text: '@smarthomecare' },
    { name: 'Facebook', icon: 'fa-facebook', url: '#', text: 'SmartHomeCare' }
  ],
  maintenance_mode: false
};

export const DEFAULT_SEO_CONFIG = {
  meta_title: 'SmartHomeCare - Layanan Kesehatan Home Care Terpercaya',
  meta_description: 'Kami menyediakan layanan kesehatan home care profesional langsung ke rumah Anda.',
  meta_keywords: 'homecare, kesehatan, perawat, dokter, fisioterapi'
};

// ── Client Fetch (Axios) ───────────────────────────────────────────────────────
export const getGlobalConfig = async () => {
  try {
    const res = await api.get('/api/global-config', { validateStatus: s => s < 500 });
    if (res.status === 200 && res.data?.success && res.data?.data) {
      return { ...DEFAULT_GLOBAL_CONFIG, ...res.data.data };
    }
    return DEFAULT_GLOBAL_CONFIG;
  } catch (error) {
    console.warn('Gagal memuat global config, menggunakan default fallback:', error);
    return DEFAULT_GLOBAL_CONFIG;
  }
};

export const getSeoConfig = async () => {
  try {
    const res = await api.get('/api/seo-config', { validateStatus: s => s < 500 });
    if (res.status === 200 && res.data?.success && res.data?.data) {
      return { ...DEFAULT_SEO_CONFIG, ...res.data.data };
    }
    return DEFAULT_SEO_CONFIG;
  } catch (error) {
    console.warn('Gagal memuat SEO config, menggunakan default fallback:', error);
    return DEFAULT_SEO_CONFIG;
  }
};

// ── SSR Fetch (Server Components / Metadata) ───────────────────────────────────
export async function getGlobalConfigSSR() {
  try {
    const res = await fetch(`${getBaseUrl()}/api/global-config`, { cache: 'no-store' });
    if (!res.ok) return DEFAULT_GLOBAL_CONFIG;
    const json = await res.json();
    if (json?.success && json?.data) {
      return { ...DEFAULT_GLOBAL_CONFIG, ...json.data };
    }
    return DEFAULT_GLOBAL_CONFIG;
  } catch (error) {
    console.warn('Gagal memuat global config (SSR), menggunakan default fallback:', error);
    return DEFAULT_GLOBAL_CONFIG;
  }
}

export async function getSeoConfigSSR() {
  try {
    const res = await fetch(`${getBaseUrl()}/api/seo-config`, { cache: 'no-store' });
    if (!res.ok) return DEFAULT_SEO_CONFIG;
    const json = await res.json();
    if (json?.success && json?.data) {
      return { ...DEFAULT_SEO_CONFIG, ...json.data };
    }
    return DEFAULT_SEO_CONFIG;
  } catch (error) {
    console.warn('Gagal memuat SEO config (SSR), menggunakan default fallback:', error);
    return DEFAULT_SEO_CONFIG;
  }
}

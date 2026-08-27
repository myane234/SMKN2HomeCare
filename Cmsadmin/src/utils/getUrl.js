const urlProd = import.meta.env.VITE_API_BASE_URL;
const mode = import.meta.env.MODE;

const normalizeUrl = (value) => {
  if (typeof value !== 'string' || !value.trim()) return 'https://citra.faaruq.com/api';
  const clean = value.replace(/\/+$/, '');
  return clean.endsWith('/api') ? clean : `${clean}/api`;
};

export const URL = mode === 'production' ? normalizeUrl(urlProd) : '/api';

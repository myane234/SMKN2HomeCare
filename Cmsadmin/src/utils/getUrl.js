const urlProd = import.meta.env.VITE_API_BASE_URL
const mode = import.meta.env.MODE

const normalizeUrl = (value) => (typeof value === 'string' ? value.replace(/\/+$/, '') : '')

export const URL = mode === 'production' ? normalizeUrl(urlProd) : '/api' // use relative /api so Vite dev proxy works without CORS

import { URL } from './getUrl.js';

export function resolveImageUrl(value) {
  if (!value || typeof value !== 'string') return '';

  let trimmed = value.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return '';

  if (trimmed.startsWith('data:image/') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // Strip host prefix (e.g. http://localhost:8000 or http://127.0.0.1:8000) if present in DB
  trimmed = trimmed.replace(/^https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?/i, '');

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  const apiBase = URL === '/api' ? (import.meta.env.VITE_URLDEV || 'https://citra.faaruq.com/api') : URL;
  const baseUrl = apiBase.replace(/\/api\/?$/, '');
  const fallbackOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const origin = baseUrl || fallbackOrigin;

  let cleanPath = trimmed.replace(/^\/+/, '');
  if (!cleanPath.startsWith('storage/')) {
    cleanPath = `storage/${cleanPath}`;
  }

  return origin ? `${origin}/${cleanPath}` : `/${cleanPath}`;
}


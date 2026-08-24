import { URL } from './getUrl.js';

export function resolveImageUrl(value) {
  if (!value || typeof value !== 'string') return '';

  let cleanImage = value.trim();
  if (!cleanImage || cleanImage === 'null' || cleanImage === 'undefined') return '';

  if (cleanImage.startsWith('data:image/') || cleanImage.startsWith('blob:')) {
    return cleanImage;
  }

  if (cleanImage.startsWith('//')) {
    cleanImage = `https:${cleanImage}`;
  }

  const apiBase = URL === '/api' ? (import.meta.env.VITE_URLDEV || 'https://citra.faaruq.com/api') : URL;
  const baseUrl = apiBase.replace(/\/api\/?$/, '').replace(/\/+$/, '');
  const fallbackOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  const origin = baseUrl || fallbackOrigin;

  if (cleanImage.includes('http://') || cleanImage.includes('https://')) {
    const lastHttpIndex = cleanImage.lastIndexOf('http://');
    const lastHttpsIndex = cleanImage.lastIndexOf('https://');
    const lastUrlIndex = Math.max(lastHttpIndex, lastHttpsIndex);
    const targetUrl = cleanImage.substring(lastUrlIndex);

    const urlMatch = targetUrl.match(/^https?:\/\/([^/]+)(\/.*)?$/i);
    if (urlMatch) {
      const host = urlMatch[1].toLowerCase();
      let path = urlMatch[2] || '';

      const isLocalHost = /^(localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?$/i.test(host);
      const isBaseHost = origin ? origin.toLowerCase().includes(host.split(':')[0]) : false;
      const hasStorage = path.toLowerCase().includes('/storage/');
      const isNested = lastUrlIndex > 0;

      if (isLocalHost || isBaseHost || hasStorage || isNested) {
        cleanImage = path;
      } else {
        return targetUrl;
      }
    }
  }

  cleanImage = cleanImage.replace(/https?:\/\/[^/]+/gi, '');
  cleanImage = cleanImage.replace(/^(?:\/?storage\/+|\/+)+/gi, '');

  const canonicalPath = `storage/${cleanImage}`;
  return origin ? `${origin}/${canonicalPath}` : `/${canonicalPath}`;
}


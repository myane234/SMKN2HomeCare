export function resolveImageUrl(image, updatedAt = null) {
  const placeholder = "https://placehold.co/900x600?text=SmartHomeCare";

  if (!image) return placeholder;

  let cleanImage = String(image).trim();
  if (!cleanImage || cleanImage === "null" || cleanImage === "undefined") return placeholder;

  // 1. Data/Blob URLs
  if (cleanImage.startsWith("data:image/") || cleanImage.startsWith("blob:")) {
    return cleanImage;
  }

  // 2. Protocol-relative URLs
  if (cleanImage.startsWith("//")) {
    cleanImage = `https:${cleanImage}`;
  }

  // 3. Local public static assets in Next.js public directory (/images/, /icons/, /logo/, etc.)
  const normalizedPath = cleanImage.startsWith("/") ? cleanImage : `/${cleanImage}`;
  if (
    normalizedPath.startsWith("/images/") ||
    normalizedPath.startsWith("/icons/") ||
    normalizedPath.startsWith("/logo/") ||
    normalizedPath.startsWith("/file.svg") ||
    normalizedPath.startsWith("/globe.svg")
  ) {
    return normalizedPath;
  }

  // 4. Clean up nested malformed URLs (e.g. "https://citra.faaruq.com/storage/http://localhost/storage/layanan/abc.jpg")
  const lastHttp = cleanImage.lastIndexOf("http://");
  const lastHttps = cleanImage.lastIndexOf("https://");
  const lastUrlIndex = Math.max(lastHttp, lastHttps);
  if (lastUrlIndex > 0) {
    cleanImage = cleanImage.substring(lastUrlIndex);
  }

  const apiEnv = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

  // 5. Handle HTTP / HTTPS URLs
  if (cleanImage.startsWith("http://") || cleanImage.startsWith("https://")) {
    const isLocalHost = cleanImage.includes("localhost") || cleanImage.includes("127.0.0.1");
    const isApiHost = apiEnv ? cleanImage.includes(apiEnv) : false;

    if (cleanImage.includes("/storage/")) {
      const storageIdx = cleanImage.indexOf("/storage/");
      const storagePath = cleanImage.substring(storageIdx); // e.g. "/storage/layanan/xxx.png"

      if (storagePath.startsWith("/storage/images/")) {
        return storagePath.replace("/storage/images/", "/images/");
      }

      if (apiEnv) {
        return `${apiEnv}${storagePath}`;
      }

      // Relative /storage/... uses Next.js rewrite proxy in next.config.mjs to proxy backend images
      return storagePath;
    }

    // Third-party external image URL (e.g. Unsplash, placehold.co, etc.)
    if (!isLocalHost && !isApiHost) {
      return cleanImage;
    }
  }

  // 6. Relative backend paths (e.g. "layanan/123.jpg" or "storage/layanan/123.jpg")
  let storagePath = cleanImage
    .replace(/^https?:\/\/[^/]+/gi, "")
    .replace(/^(?:\/?storage\/+|\/+)+/gi, "");

  if (storagePath.startsWith("images/") || storagePath.startsWith("icons/") || storagePath.startsWith("logo/")) {
    return `/${storagePath}`;
  }

  if (apiEnv) {
    return `${apiEnv}/storage/${storagePath}`;
  }

  return `/storage/${storagePath}`;
}
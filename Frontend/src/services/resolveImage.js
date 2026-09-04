export function resolveImageUrl(image, updatedAt = null) {
  const placeholder = "https://placehold.co/900x600?text=SmartHomeCare";

  if (!image) return placeholder;

  let cleanImage = String(image).trim();
  if (!cleanImage || cleanImage === "null" || cleanImage === "undefined") return placeholder;

  // 1. Data/Blob URLs
  if (cleanImage.startsWith("data:image/") || cleanImage.startsWith("blob:")) {
    return cleanImage;
  }

  // 2. Bersihkan domain lokal / localhost di awal agar tidak error SSL
  cleanImage = cleanImage.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/gi, "");

  // 3. Protocol-relative URLs
  if (cleanImage.startsWith("//")) {
    cleanImage = `https:${cleanImage}`;
  }

  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "https://citra.faaruq.com").replace(/\/+$/, "");
  const apiEnv = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

  // 4. Local public static assets
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

  // 5. Clean up nested malformed URLs
  const lastHttp = cleanImage.lastIndexOf("http://");
  const lastHttps = cleanImage.lastIndexOf("https://");
  const lastUrlIndex = Math.max(lastHttp, lastHttps);
  if (lastUrlIndex > 0) {
    cleanImage = cleanImage.substring(lastUrlIndex);
  }

  // 6. Handle HTTP / HTTPS URLs
  if (cleanImage.startsWith("http://") || cleanImage.startsWith("https://")) {
    const isLocalHost = cleanImage.includes("localhost") || cleanImage.includes("127.0.0.1");
    const isApiHost = apiEnv ? cleanImage.includes(apiEnv) : false;
    const isBaseUrl = cleanImage.includes(baseUrl);

    if (cleanImage.includes("/storage/")) {
      const storageIdx = cleanImage.indexOf("/storage/");
      const storagePath = cleanImage.substring(storageIdx);

      if (storagePath.startsWith("/storage/images/")) {
        return storagePath.replace("/storage/images/", "/images/");
      }

      if (apiEnv) {
        return `${apiEnv}${storagePath}`;
      }

      return storagePath;
    }

    if (!isLocalHost && !isApiHost && !isBaseUrl) {
      return cleanImage;
    }
  }

  // 7. Backend uploaded files in storage
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
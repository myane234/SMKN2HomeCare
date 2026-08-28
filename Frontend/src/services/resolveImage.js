export function resolveImageUrl(image, updatedAt = null) {
  const placeholder = "https://placehold.co/900x600?text=SmartHomeCare";

  if (!image) return placeholder;

  let cleanImage = String(image).trim();
  if (!cleanImage || cleanImage === "null" || cleanImage === "undefined") return placeholder;

  // 1. Data/Blob URLs
  if (cleanImage.startsWith("data:image/") || cleanImage.startsWith("blob:")) {
    return cleanImage;
  }

  // 2. [PERBAIKAN UTAMA] Bersihkan domain lokal / localhost:3000 di awal agar tidak error SSL
  cleanImage = cleanImage.replace(/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/gi, "");

  // 3. Protocol-relative URLs
  if (cleanImage.startsWith("//")) {
    cleanImage = `https:${cleanImage}`;
  }

  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "https://citra.faaruq.com").replace(/\/+$/, "");

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

  // 5. Handle full URLs (HTTP / HTTPS eksternal yang valid)
  if (cleanImage.startsWith("http://") || cleanImage.startsWith("https://")) {
    const isBaseUrl = cleanImage.includes(baseUrl);

    if (cleanImage.includes("/storage/")) {
      const storageIdx = cleanImage.indexOf("/storage/");
      const pathAfterStorage = cleanImage.substring(storageIdx + "/storage/".length);

      if (pathAfterStorage.startsWith("images/") || pathAfterStorage.startsWith("/images/")) {
        return pathAfterStorage.startsWith("/") ? pathAfterStorage : `/${pathAfterStorage}`;
      }

      return `${baseUrl}/storage/${pathAfterStorage.replace(/^\/+/, "")}`;
    }

    if (!isBaseUrl) {
      return cleanImage;
    }
  }

  // 6. Backend uploaded files in storage (e.g. avatars/xxx.png atau /storage/avatars/xxx.png)
  let storagePath = cleanImage
    .replace(/^https?:\/\/[^/]+/gi, "") // strip domain jika masih ada
    .replace(/^(?:\/?storage\/+|\/+)+/gi, ""); // strip /storage/ atau slash berlebih

  if (storagePath.startsWith("images/") || storagePath.startsWith("icons/") || storagePath.startsWith("logo/")) {
    return `/${storagePath}`;
  }

  return `${baseUrl}/storage/${storagePath}`;
}
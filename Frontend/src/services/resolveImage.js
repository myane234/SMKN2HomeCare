export function resolveImageUrl(image, updatedAt = null) {
  const placeholder = "/images/layanan/pijat-bayi.png";

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

  // 3. Local public static assets
  const normalizedPath = cleanImage.startsWith("/") ? cleanImage : `/${cleanImage}`;
  if (
    normalizedPath.startsWith("/images/") ||
    normalizedPath.startsWith("/icons/") ||
    normalizedPath.startsWith("/logo/") ||
    normalizedPath.startsWith("/layanan/") ||
    normalizedPath.startsWith("/about/") ||
    normalizedPath.startsWith("/hero/") ||
    normalizedPath.startsWith("/file.svg") ||
    normalizedPath.startsWith("/globe.svg")
  ) {
    return normalizedPath;
  }

  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "https://citra.faaruq.com").replace(/\/+$/, "");

  // 4. Handle HTTP / HTTPS URLs
  if (cleanImage.startsWith("http://") || cleanImage.startsWith("https://")) {
    const isLocalHost = cleanImage.includes("localhost") || cleanImage.includes("127.0.0.1");
    const isBaseUrl = cleanImage.includes(baseUrl);

    if (cleanImage.includes("/storage/")) {
      const storageIdx = cleanImage.indexOf("/storage/");
      const pathAfterStorage = cleanImage.substring(storageIdx + "/storage/".length);

      if (
        pathAfterStorage.startsWith("images/") ||
        pathAfterStorage.startsWith("layanan/") ||
        pathAfterStorage.startsWith("icons/") ||
        pathAfterStorage.startsWith("about/") ||
        pathAfterStorage.startsWith("hero/")
      ) {
        const cleanLocalPath = pathAfterStorage.replace(/^images\//, "");
        return `/images/${cleanLocalPath.replace(/^\/+/, "")}`;
      }

      return `${baseUrl}/storage/${pathAfterStorage.replace(/^\/+/, "")}`;
    }

    if (!isLocalHost && !isBaseUrl) {
      return cleanImage;
    }
  }

  // 5. Backend uploaded files in storage
  let storagePath = cleanImage
    .replace(/^https?:\/\/[^/]+/gi, "")
    .replace(/^(?:\/?storage\/+|\/+)+/gi, "");

  if (
    storagePath.startsWith("images/") ||
    storagePath.startsWith("layanan/") ||
    storagePath.startsWith("icons/") ||
    storagePath.startsWith("about/") ||
    storagePath.startsWith("hero/") ||
    storagePath.startsWith("logo/")
  ) {
    if (storagePath.startsWith("images/")) {
      return `/${storagePath}`;
    }
    return `/images/${storagePath}`;
  }

  return `${baseUrl}/storage/${storagePath}`;
}
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

  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "https://citra.faaruq.com").replace(/\/+$/, "");

  // 4. Handle full URLs (HTTP / HTTPS)
  if (cleanImage.startsWith("http://") || cleanImage.startsWith("https://")) {
    // Check if URL points to local storage or backend base URL
    const isLocalHost = cleanImage.includes("localhost") || cleanImage.includes("127.0.0.1");
    const isBaseUrl = cleanImage.includes(baseUrl);

    if (cleanImage.includes("/storage/")) {
      const storageIdx = cleanImage.indexOf("/storage/");
      const pathAfterStorage = cleanImage.substring(storageIdx + "/storage/".length);

      // If the path after storage is actually a local asset
      if (pathAfterStorage.startsWith("images/") || pathAfterStorage.startsWith("/images/")) {
        return pathAfterStorage.startsWith("/") ? pathAfterStorage : `/${pathAfterStorage}`;
      }

      return `${baseUrl}/storage/${pathAfterStorage.replace(/^\/+/, "")}`;
    }

    // Third-party external image URL (e.g. iStockphoto, Unsplash, etc.)
    if (!isLocalHost && !isBaseUrl) {
      return cleanImage;
    }
  }

  // 5. Backend uploaded files in storage (e.g. artikel/123.jpg, layanan/abc.png)
  let storagePath = cleanImage
    .replace(/^https?:\/\/[^/]+/gi, "") // strip domain
    .replace(/^(?:\/?storage\/+|\/+)+/gi, ""); // strip /storage/

  // If path actually points to local public images
  if (storagePath.startsWith("images/") || storagePath.startsWith("icons/") || storagePath.startsWith("logo/")) {
    return `/${storagePath}`;
  }

  return `${baseUrl}/storage/${storagePath}`;
}
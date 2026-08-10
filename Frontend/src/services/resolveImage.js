export function resolveImageUrl(image, updatedAt = null) {
  const placeholder = "https://placehold.co/900x600?text=Detail+Layanan";

  if (!image) return placeholder;

  let cleanImage = String(image).trim();
  if (!cleanImage || cleanImage === "null" || cleanImage === "undefined") return placeholder;

  // Keep already valid data/blob URLs as-is.
  if (cleanImage.startsWith("data:image/") || cleanImage.startsWith("blob:")) {
    return cleanImage;
  }

  const getBuster = () => {
    if (updatedAt) {
      const ts = new Date(updatedAt).getTime();
      if (!isNaN(ts)) return `v=${ts}`;
    }
    return `t=${Date.now()}`;
  };

  // External absolute URLs are already valid.
  if (cleanImage.startsWith("http://") || cleanImage.startsWith("https://")) {
    if (/^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?\//i.test(cleanImage)) {
      cleanImage = cleanImage.replace(/^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?/i, "");
    } else {
      const buster = getBuster();
      if (buster && !cleanImage.includes("v=") && !cleanImage.includes("t=")) {
        return `${cleanImage}${cleanImage.includes("?") ? "&" : "?"}${buster}`;
      }
      return cleanImage;
    }
  }

  // Handle protocol-relative URLs.
  if (cleanImage.startsWith("//")) {
    return `https:${cleanImage}`;
  }

  // Remove any host prefix that may have been saved in the DB.
  cleanImage = cleanImage.replace(/^https?:\/\/(?:localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?/i, "");

  // Ensure we work with a clean path value.
  cleanImage = cleanImage.replace(/^\/+/, "");

  // Already a storage path, keep it as one canonical form.
  if (cleanImage.includes("/storage/")) {
    cleanImage = `/${cleanImage.replace(/^\/+/, "")}`;
  } else if (cleanImage.startsWith("storage/")) {
    cleanImage = `/${cleanImage}`;
  } else {
    cleanImage = `/storage/${cleanImage.replace(/^storage\//, "")}`;
  }

  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "https://citra.faaruq.com").replace(/\/+$/, "");
  let fullUrl = `${baseUrl}${cleanImage}`;

  const buster = getBuster();
  if (buster && !fullUrl.includes("v=") && !fullUrl.includes("t=")) {
    fullUrl += `${fullUrl.includes("?") ? "&" : "?"}${buster}`;
  }

  return fullUrl;
}
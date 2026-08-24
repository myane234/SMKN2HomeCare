export function resolveImageUrl(image, updatedAt = null) {
  const placeholder = "https://placehold.co/900x600?text=Detail+Layanan";

  if (!image) return placeholder;

  let cleanImage = String(image).trim();
  if (!cleanImage || cleanImage === "null" || cleanImage === "undefined") return placeholder;

  // Keep already valid data/blob URLs as-is.
  if (cleanImage.startsWith("data:image/") || cleanImage.startsWith("blob:")) {
    return cleanImage;
  }

  // Handle protocol-relative URLs.
  if (cleanImage.startsWith("//")) {
    cleanImage = `https:${cleanImage}`;
  }

  const getBuster = () => {
    if (updatedAt) {
      const ts = new Date(updatedAt).getTime();
      if (!isNaN(ts)) return `v=${ts}`;
    }
    return `t=${Date.now()}`;
  };

  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "https://citra.faaruq.com").replace(/\/+$/, "");

  // If the image string contains nested/multiple URLs or local/storage paths (e.g. ".../storage/http://localhost/storage/...")
  if (cleanImage.includes("http://") || cleanImage.includes("https://")) {
    const lastHttpIndex = cleanImage.lastIndexOf("http://");
    const lastHttpsIndex = cleanImage.lastIndexOf("https://");
    const lastUrlIndex = Math.max(lastHttpIndex, lastHttpsIndex);
    const targetUrl = cleanImage.substring(lastUrlIndex);

    const urlMatch = targetUrl.match(/^https?:\/\/([^/]+)(\/.*)?$/i);
    if (urlMatch) {
      const host = urlMatch[1].toLowerCase();
      let path = urlMatch[2] || "";

      const isLocalHost = /^(localhost|127\.0\.0\.1|0\.0\.0\.0)(?::\d+)?$/i.test(host);
      const isBaseHost = baseUrl.toLowerCase().includes(host.split(":")[0]);
      const hasStorage = path.toLowerCase().includes("/storage/");
      const isNested = lastUrlIndex > 0;

      if (isLocalHost || isBaseHost || hasStorage || isNested) {
        cleanImage = path;
      } else {
        const buster = getBuster();
        if (buster && !targetUrl.includes("v=") && !targetUrl.includes("t=")) {
          return `${targetUrl}${targetUrl.includes("?") ? "&" : "?"}${buster}`;
        }
        return targetUrl;
      }
    }
  }

  // Strip any remaining http(s)://... domain prefixes or embedded occurrences
  cleanImage = cleanImage.replace(/https?:\/\/[^/]+/gi, "");

  // Strip all leading slashes and any repeated /storage/ or storage/ prefixes
  cleanImage = cleanImage.replace(/^(?:\/?storage\/+|\/+)+/gi, "");

  const canonicalPath = `/storage/${cleanImage}`;
  let fullUrl = `${baseUrl}${canonicalPath}`;

  const buster = getBuster();
  if (buster && !fullUrl.includes("v=") && !fullUrl.includes("t=")) {
    fullUrl += `${fullUrl.includes("?") ? "&" : "?"}${buster}`;
  }

  return fullUrl;
}
export function resolveImageUrl(image) {
  if (!image) return "https://placehold.co/900x600?text=Detail+Layanan";

  let cleanImage = String(image).trim();

  // 1. Bersihkan hostname localhost jika terbawa dari DB
  if (cleanImage.includes("localhost:3000")) {
    cleanImage = cleanImage.replace(/^https?:\/\/localhost:3000/, "");
  }

  // 2. Jika sudah URL lengkap (http/https), langsung return
  if (cleanImage.startsWith("http://") || cleanImage.startsWith("https://")) {
    return cleanImage;
  }

  // 3. Ambil Base URL (Domain)
  const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "https://citra.faaruq.com").replace(/\/+$/, "");

  // 4. Pastikan path memiliki awalan slash `/`
  let formattedPath = cleanImage.startsWith("/") ? cleanImage : `/${cleanImage}`;

  // 🎯 FIX UTAMA: Jika path belum mengandung '/storage/', sisipkan '/storage' di depan path
  if (!formattedPath.startsWith("/storage/")) {
    // Menangani jika string diawali 'uploads/' atau langsung 'layanan/'
    formattedPath = `/storage${formattedPath}`;
  }

  return `${baseUrl}${formattedPath}`;
}
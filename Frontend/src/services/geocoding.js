// Layanan pencarian & reverse-geocoding alamat menggunakan Nominatim (OpenStreetMap).
//
// Dipakai bersama komponen peta (MapPicker):
//  - geser pin di peta            -> reverseGeocode(lat, lng)   -> isi textbox alamat
//  - ketik nama tempat di search  -> searchAddress(query)       -> tampilkan daftar saran
//
// Catatan: Nominatim gratis, tapi dibatasi ~1 request/detik dan tidak disarankan
// untuk trafik tinggi/produksi skala besar. Kalau nanti trafiknya udah ramai,
// pertimbangkan self-hosted Nominatim atau provider berbayar (Google Geocoding, Mapbox, dll).

const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";

/**
 * Reverse geocoding: ubah koordinat (lat, lng) jadi alamat lengkap (display_name).
 *
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<string|null>} alamat lengkap, atau null kalau gagal/tidak ketemu
 */
export async function reverseGeocode(lat, lng) {
  try {
    const response = await fetch(
      `${NOMINATIM_BASE_URL}/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
    );

    if (!response.ok) return null;

    const data = await response.json();
    return data?.display_name || null;
  } catch (error) {
    console.error("Gagal mengambil alamat (reverseGeocode):", error);
    return null;
  }
}

/**
 * Cari lokasi berdasarkan kata kunci teks. Dibatasi ke wilayah Indonesia (countrycodes=id).
 *
 * @param {string} query
 * @param {number} limit
 * @returns {Promise<Array<{ place_id: number, lat: string, lon: string, display_name: string }>>}
 */
export async function searchAddress(query, limit = 5) {
  if (!query || !query.trim()) return [];

  try {
    const response = await fetch(
      `${NOMINATIM_BASE_URL}/search?format=jsonv2&q=${encodeURIComponent(
        query
      )}&limit=${limit}&countrycodes=id`
    );

    if (!response.ok) return [];

    const data = await response.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Gagal mencari lokasi (searchAddress):", error);
    return [];
  }
}
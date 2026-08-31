import api from "./api";

export const DAFTAR_UNIVERSITAS = [
  "Akademi Farmasi Mitra Sehat Mandiri Sidoarjo",
  "Akademi Farmasi Yarsis Pekanbaru",
  "Binus University",
  "Bogor Agricultural University",
  "Duta Bangsa University",
  "Institut Sains & Teknologi Akprind",
  "Institut Sains dan Teknologi Al Kamal",
  "Institut Teknologi Adhi Tama Surabaya",
  "Institut Teknologi Bandung",
  "Institut Teknologi Sepuluh Nopember",
  "Politeknik Negeri Bandung",
  "Politeknik Negeri Jakarta",
  "Politeknik Negeri Malang",
  "STIKES RS Anwar Medika",
  "Universitas Airlangga",
  "Universitas Andalas",
  "Universitas Brawijaya",
  "Universitas Diponegoro",
  "Universitas Gadjah Mada",
  "Universitas Hasanuddin",
  "Universitas Indonesia",
  "Universitas Islam Indonesia",
  "Universitas Jenderal Soedirman",
  "Universitas Muhammadiyah Jakarta",
  "Universitas Muhammadiyah Malang",
  "Universitas Muhammadiyah Surakarta",
  "Universitas Muhammadiyah Yogyakarta",
  "Universitas Negeri Jakarta",
  "Universitas Negeri Malang",
  "Universitas Negeri Medan",
  "Universitas Negeri Semarang",
  "Universitas Negeri Surabaya",
  "Universitas Negeri Yogyakarta",
  "Universitas Padjadjaran",
  "Universitas Sebelas Maret",
  "Universitas Sriwijaya",
  "Universitas Sumatera Utara",
  "Universitas Syiah Kuala",
  "Universitas Udayana"
];

export async function getUniversitas(search = "") {
  try {
    const res = await api.get("/api/universitas", { params: { search } });
    const payload = res.data?.data || res.data;
    if (Array.isArray(payload) && payload.length > 0) {
      return payload.map((u) => (typeof u === "string" ? u : u.nama_universitas || u.nama));
    }
  } catch {
    // Fallback static
  }
  if (!search) return DAFTAR_UNIVERSITAS;
  return DAFTAR_UNIVERSITAS.filter((u) => u.toLowerCase().includes(search.toLowerCase()));
}

export default DAFTAR_UNIVERSITAS;
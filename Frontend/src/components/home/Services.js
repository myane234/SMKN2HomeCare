import Image from "next/image";
import Link from "next/link";
import { getKategoriLayananSSR } from "@/services/layananService";

// Fallback statis jika API tidak mengembalikan data
const FALLBACK_SERVICES = [
  { id: 1, nama_kategori: "Ibu & Anak", icon: "/images/icons/ibu-anak.png" },
  { id: 2, nama_kategori: "Perawatan Luka", icon: "/images/icons/luka.png" },
  { id: 3, nama_kategori: "Medical Checkup", icon: "/images/icons/mcu.png" },
  { id: 4, nama_kategori: "Fisioterapi", icon: "/images/icons/fisio.png" },
  { id: 5, nama_kategori: "Pemasangan Alat Medis", icon: "/images/icons/alat-medis.png" },
];

// Map nama kategori ke icon lokal (fallback jika API tidak menyediakan icon)
const ICON_MAP = {
  "ibu": "/images/icons/ibu-anak.png",
  "anak": "/images/icons/ibu-anak.png",
  "luka": "/images/icons/luka.png",
  "checkup": "/images/icons/mcu.png",
  "mcu": "/images/icons/mcu.png",
  "fisio": "/images/icons/fisio.png",
  "alat": "/images/icons/alat-medis.png",
  "medis": "/images/icons/alat-medis.png",
};

function getIconFromName(nama = "") {
  const lower = nama.toLowerCase();
  for (const [key, icon] of Object.entries(ICON_MAP)) {
    if (lower.includes(key)) return icon;
  }
  return "/images/icons/mcu.png"; // default
}

function toSlug(nama = "") {
  return nama
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default async function Services() {
  const apiKategori = await getKategoriLayananSSR();

  // Gunakan data API jika tersedia, fallback ke data statis
  const services =
    apiKategori && apiKategori.length > 0
      ? apiKategori.map((k) => ({
          id: k.id_kategori ?? k.id ?? Math.random(),
          nama_kategori: k.nama_kategori ?? k.nama ?? "Layanan",
          icon: k.icon ? `/storage/${k.icon}` : getIconFromName(k.nama_kategori ?? k.nama ?? ""),
          slug: k.slug ?? toSlug(k.nama_kategori ?? k.nama ?? ""),
        }))
      : FALLBACK_SERVICES.map((s) => ({ ...s, slug: toSlug(s.nama_kategori) }));

  return (
    <section className="relative py-16 sm:py-24 overflow-hidden bg-gradient-to-b from-blue-50/80 via-blue-50/40 to-blue-50/80">
      <div className="relative mx-auto max-w-7xl px-6">
        {/* Heading */}
        <div className="mb-12 sm:mb-16 text-center">
          <span className="text-2xl font-semibold uppercase tracking-[0.2em] text-blue-600">
              Kategori Layanan
            </span>
          <p className="mt-3 max-w-2xl mx-auto text-gray-600">
            Temukan layanan homecare yang sesuai dengan kebutuhan kesehatan Anda
          </p>
        </div>

        {/* Grid Utama - 5 kategori dalam satu container */}
        <div className="max-w-7xl mx-auto">
          {/* Desktop: 5 kolom, Mobile: 2 kolom */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-6 md:gap-8 max-w-[280px] sm:max-w-[280px] lg:max-w-none mx-auto">
            {services.map((service, index) => {
              // Pada mobile, kategori ke-5 (index 4) akan berada di tengah
              const isLastOnMobile = index === 4;
              return (
                <Link
                  key={service.id}
                  href={`/layanan?kategori=${encodeURIComponent(service.nama_kategori)}`}
                    className={`group flex justify-center ${
                  isLastOnMobile
                    ? "col-span-2 lg:col-span-1"
                    : ""
                }`}
              >
                  <div className="inline-flex flex-col items-center">
                    {/* Icon Container dengan efek hover */}
                    <div className="relative">
                      {/* Background lingkaran soft blue saat hover */}
                      <div className="absolute inset-0 -z-10 bg-blue-50/0 rounded-full scale-100 group-hover:bg-blue-50 group-hover:scale-125 transition-all duration-300"></div>
                      <div className="absolute inset-0 -z-10 bg-blue-50 rounded-full scale-110 group-hover:scale-125 transition-transform duration-300"></div>
                      {/* Icon Container */}
                      <div className="relative w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 bg-white rounded-[36px] sm:rounded-[40px] shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:-translate-y-1 group-hover:scale-105 flex items-center justify-center">
                        <div className="relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16">
                          <Image
                            src={service.icon}
                            alt={service.nama_kategori}
                            fill
                            className="object-contain transition duration-300"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Judul Kategori */}
                    <h3 className="mt-2.5 text-sm sm:text-base font-semibold text-gray-800 text-center group-hover:text-blue-600 transition-colors duration-300 max-w-[170px] leading-tight">
                      {service.nama_kategori}
                    </h3>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
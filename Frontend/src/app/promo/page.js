import Image from "next/image";
import Link from "next/link";
import { getActivePromosSSR, generatePromoSlug, getTextValue } from "@/services/promoService";
import { resolveImageUrl } from "@/services/resolveImage";

function formatDate(dateString) {
  try {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    return dateString;
  }
}

export default async function PromoPage() {
  const promos = await getActivePromosSSR();

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 py-8">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* Header Section */}
        <div className="mb-12 text-center">
          <span className="inline-flex rounded-full bg-sky-100 px-5 py-2 text-xs font-bold tracking-[0.2em] text-sky-700">
            PENAWARAN SPESIAL
          </span>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight text-sky-800 sm:text-4xl">
            Promo &amp; Penawaran Menarik
          </h1>
          <p className="mt-3 mx-auto max-w-3xl text-base leading-7 text-slate-600">
            Dapatkan layanan kesehatan terbaik dengan harga spesial. Penawaran terbatas, jangan lewatkan!
          </p>
        </div>

        {promos && promos.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {promos.map((promo, idx) => {
              const name = getTextValue(promo, ["nama_paket", "nama", "title", "judul"]);
              const slug = generatePromoSlug(name);
              const endDate = formatDate(getTextValue(promo, ["tanggal_berakhir", "expired_at", "end_date"]));
              
              // Mengambil URL Gambar seperti di artikel
              const rawImage = getTextValue(promo, ["gambar_promo", "gambar", "image", "foto"]);
              const image = resolveImageUrl(rawImage);

              return (
                <div
                  key={getTextValue(promo, ["id_promo", "id"]) || idx}
                  className="group relative h-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-all duration-500 hover:shadow-lg hover:shadow-blue-400/20"
                >
                  <div
                    className="absolute inset-0 rounded-xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    style={{
                      background: 'radial-gradient(circle at center, rgba(59, 130, 246, 0.08) 0%, transparent 70%)',
                      pointerEvents: 'none'
                    }}
                  />

                  <Link href={`/promo/${slug || idx}`}>
                    <div className="relative overflow-hidden h-40 w-full bg-slate-200">
                      <img
                        src={image}
                        alt={name || "Promo"}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                      
                      {promo.diskon_persen && (
                        <div className="absolute left-3 top-3 rounded-lg bg-blue-600 px-2 py-0.5 text-xs font-bold text-white shadow-lg">
                          Diskon {Number(promo.diskon_persen)}%
                        </div>
                      )}
                    </div>
                  </Link>

                  <div className="relative flex flex-col p-4">
                    <Link href={`/promo/${slug || idx}`}>
                      <h2 className="text-base font-bold leading-snug text-slate-950 transition-colors duration-300 hover:text-blue-600 line-clamp-2">
                        {name || "Nama Paket Promo"}
                      </h2>
                    </Link>

                    <p className="mt-2 text-xs leading-relaxed text-slate-600 line-clamp-2">
                      {promo.deskripsi || "Dapatkan penawaran spesial untuk paket ini"}
                    </p>

                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <p className="text-xs font-medium text-slate-700">
                        Berakhir: <span className="text-blue-600 font-semibold">{endDate || "-"}</span>
                      </p>
                    </div>

                    <div className="mt-3">
                      <Link
                        href={`/promo/${slug || idx}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 transition-all duration-300 hover:text-blue-700 hover:gap-2"
                      >
                        Lihat Detail
                        <span className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-slate-300 bg-gradient-to-br from-slate-50 to-blue-50 p-8 text-center">
            <h3 className="text-base font-bold text-slate-900">Belum ada promo aktif</h3>
            <p className="mt-1 text-sm text-slate-500">
              Cek kembali nanti untuk melihat promo dan penawaran spesial terbaru kami.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
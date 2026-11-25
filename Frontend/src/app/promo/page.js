
import Link from "next/link";
import LoadMore from "@/components/LoadMore";

import {
  getActivePromosSSR,
  getPromoServiceName,
  getPromoImagePath,
  formatPromoDiscount,
  formatPromoDate,
} from "@/services/promoService";

import { resolveImageUrl } from "@/services/resolveImage";

export default async function PromoPage() {
  const response = await getActivePromosSSR();

  const promos = response.filter(
    (item) =>
      item?.id_promo !== null &&
      item?.id_promo !== undefined
  );

  return (
    <main className="mx-auto min-h-screen max-w-7xl px-4 py-10 sm:px-6 sm:py-14">

      {/* Header Center */}
      <section className="mb-10 text-center">
        <span className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-600">
          Penawaran SmartHomeCare
        </span>

        <h1 className="mt-3 text-3xl font-bold text-slate-950 sm:text-4xl">
          Promo dan Penawaran
        </h1>

        <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-slate-500 sm:text-base">
          Temukan berbagai penawaran menarik untuk layanan HomeCare.
          Pilih layanan yang sesuai dengan kebutuhan Anda.
        </p>
      </section>

      {/* Promo List */}
      {promos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-16 text-center">
          <h2 className="text-lg font-semibold text-slate-800">
            Belum ada promo aktif
          </h2>

          <p className="mt-2 text-sm text-slate-500">
            Silakan kunjungi kembali halaman ini untuk melihat penawaran terbaru.
          </p>
        </div>
      ) : (
        <LoadMore
          initialCount={9}
          increment={9}
          buttonLabel="Muat Promo Lainnya"
          itemLabel="promo aktif"
          containerClassName="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {promos.map((promo) => {
            const promoId = promo.id_promo;
            const promoName = getPromoServiceName(promo);

            const rawImage = getPromoImagePath(promo);
            const image = rawImage
              ? resolveImageUrl(rawImage)
              : "";

            const discount = formatPromoDiscount(promo);

            return (
              <Link
                key={promoId}
                href={`/promo/${promoId}`}
                className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                {/* Image */}
                <div className="relative h-48 w-full flex-shrink-0 overflow-hidden bg-slate-100">
                  {image ? (
                    <img
                      src={image}
                      alt={promoName}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
                      Gambar promo tidak tersedia
                    </div>
                  )}

                  {/* Gradasi biru hanya di area gambar */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-blue-800/75 via-blue-700/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                  {discount && (
                    <span className="absolute left-3 top-3 z-10 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm">
                      Hemat {discount}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-grow flex-col justify-between p-4">
                  <div>
                    <h2 className="line-clamp-2 text-base font-bold leading-snug text-slate-950 transition-colors group-hover:text-blue-600">
                      {promoName}
                    </h2>

                    <p className="mt-2 line-clamp-2 min-h-[40px] text-sm leading-5 text-slate-500">
                      {promo.deskripsi || "-"}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="mt-5 flex items-end justify-between gap-2 border-t border-slate-100 pt-4">
                    <div>
                      <p className="text-[11px] text-slate-400">
                        Berlaku sampai
                      </p>

                      <p className="mt-1 text-xs font-semibold text-slate-700">
                        {formatPromoDate(promo.tanggal_berakhir)}
                      </p>
                    </div>

                    <span className="shrink-0 text-xs font-semibold text-blue-600 transition-colors group-hover:text-blue-700">
                      Lihat Detail
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </LoadMore>
      )}
    </main>
  );
}

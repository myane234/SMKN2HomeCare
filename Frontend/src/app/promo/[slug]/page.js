
import Link from "next/link";
import { cookies } from "next/headers";

import {
  HiOutlineHome,
  HiOutlineCalendarDays,
  HiOutlineShieldCheck,
} from "react-icons/hi2";

import { FiCheckCircle } from "react-icons/fi";

import {
  getActivePromosSSR,
  generatePromoSlug,
  getPromoServiceName,
  getPromoImagePath,
  formatPromoDiscount,
  formatPromoDate,
} from "@/services/promoService";

import { resolveImageUrl } from "@/services/resolveImage";
import LoginRequiredModal from "@/components/LoginRequiredModal";

export default async function PromoDetail({ params, searchParams }) {
  const { slug } = await params;
  const queryParams = await searchParams;

  const showLoginModal =
    queryParams?.showLoginModal === "true";

  const promos = await getActivePromosSSR();

  const cookieStore = await cookies();

  const isLoggedIn =
    cookieStore.get("is_logged_in")?.value === "true";

  // Cari berdasarkan ID promo.
  let promo = promos.find(
    (item) => String(item.id_promo) === String(slug)
  );

  // Kompatibilitas URL lama yang menggunakan slug.
  if (!promo) {
    promo = promos.find(
      (item) =>
        generatePromoSlug(getPromoServiceName(item)) ===
        String(slug)
    );
  }

  if (!promo) {
    return (
      <main className="mx-auto flex min-h-[60vh] max-w-7xl flex-col items-center justify-center px-6 py-20 text-center">
        <h1 className="text-3xl font-bold text-slate-900">
          Promo Tidak Ditemukan
        </h1>

        <p className="mt-3 max-w-md text-sm leading-7 text-slate-500">
          Promo yang Anda cari mungkin sudah tidak berlaku,
          belum dimulai, atau telah dihapus.
        </p>

        <Link
          href="/promo"
          className="mt-7 inline-flex rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          Kembali ke Promo
        </Link>
      </main>
    );
  }

  const promoId = promo.id_promo;

  const layananId =
    promo.id_layanan ?? promo.layanan?.id_layanan;

  const promoName = getPromoServiceName(promo);

  const rawImage = getPromoImagePath(promo);
  const image = rawImage ? resolveImageUrl(rawImage) : "";

  const discount = formatPromoDiscount(promo);
  const expiredDate = formatPromoDate(
    promo.tanggal_berakhir
  );

  const bookingUrl =
    `/booking?id_promo=${encodeURIComponent(promoId)}` +
    `&id_layanan=${encodeURIComponent(layananId ?? "")}`;

  const loginUrl =
    `/promo/${promoId}?showLoginModal=true`;

  const relatedPromos = promos
    .filter(
      (item) =>
        String(item.id_promo) !== String(promoId)
    )
    .slice(0, 3);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">

      {/* Tombol Kembali - bentuk pill */}
      <Link
        href="/promo"
        className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 transition-all duration-200 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
      >
        <span aria-hidden="true">‹</span>
        Semua Promo
      </Link>

      {/* Header */}
      <section className="mt-7">
        <span className="inline-flex rounded-full bg-blue-50 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-blue-700">
          Promo SmartHomeCare
        </span>

        <h1 className="mt-5 text-3xl font-bold leading-tight text-slate-950 sm:text-4xl md:text-5xl">
          {promoName}
        </h1>

        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-500">
          {promo.deskripsi}
        </p>
      </section>

      {/* Detail Promo */}
      <section className="mt-8 grid items-start gap-7 lg:mt-10 lg:grid-cols-2 lg:gap-8">

        {/* Foto: tinggi tetap, tidak mengikuti panel kanan */}
        <div className="h-[250px] w-full max-w-[560px] overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm sm:h-[300px] lg:h-[340px]">
          {image ? (
            <img
              src={image}
              alt={promoName}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              Gambar promo tidak tersedia
            </div>
          )}
        </div>

        {/* Informasi Promo */}
        <div className="self-start rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          {discount && (
            <span className="inline-flex w-fit rounded-full bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700">
              Hemat {discount}
            </span>
          )}

          <div className="mt-7">
            <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl">
              Layanan Termasuk
            </h2>

            <div className="mt-5 flex items-center gap-3">
              <FiCheckCircle className="shrink-0 text-xl text-emerald-500" />

              <span className="font-medium text-slate-700">
                {promoName}
              </span>
            </div>
          </div>

          <div className="my-7 h-px bg-slate-200" />

          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                <HiOutlineHome className="text-2xl text-blue-600" />
              </div>

              <div>
                <h3 className="font-semibold text-slate-800">
                  Home Visit
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Layanan dilakukan langsung di rumah pasien.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                <HiOutlineCalendarDays className="text-2xl text-blue-600" />
              </div>

              <div>
                <h3 className="font-semibold text-slate-800">
                  Berlaku Sampai
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {expiredDate}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-50">
                <HiOutlineShieldCheck className="text-2xl text-blue-600" />
              </div>

              <div>
                <h3 className="font-semibold text-slate-800">
                  Terjamin Aman
                </h3>

                <p className="mt-1 text-sm leading-6 text-slate-500">
                  Ditangani oleh tenaga kesehatan profesional
                  sesuai standar pelayanan.
                </p>
              </div>
            </div>
          </div>

          {/* Booking */}
          <Link
            href={isLoggedIn ? bookingUrl : loginUrl}
            className="mt-8 flex w-full items-center justify-center rounded-xl bg-blue-600 px-6 py-3.5 text-base font-semibold text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg"
          >
            Pesan Sekarang
          </Link>
        </div>
      </section>

      {/* Promo Lainnya */}
      {relatedPromos.length > 0 && (
        <section className="mb-10 mt-14 sm:mt-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-blue-600">
                Promo Lainnya
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-950 sm:text-3xl">
                Mungkin Anda Juga Tertarik
              </h2>
            </div>

            <Link
              href="/promo"
              className="text-sm font-semibold text-blue-600 transition-colors hover:text-blue-700"
            >
              Lihat Semua
            </Link>
          </div>

          <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {relatedPromos.map((item) => {
              const itemId = item.id_promo;
              const itemName = getPromoServiceName(item);

              const itemRawImage = getPromoImagePath(item);
              const itemImage = itemRawImage
                ? resolveImageUrl(itemRawImage)
                : "";

              const itemDiscount =
                formatPromoDiscount(item);

              return (
                <Link
                  key={itemId}
                  href={`/promo/${itemId}`}
                  className="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative h-44 w-full flex-shrink-0 overflow-hidden bg-slate-100">
                    {itemImage ? (
                      <img
                        src={itemImage}
                        alt={itemName}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-slate-400">
                        Gambar tidak tersedia
                      </div>
                    )}

                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-blue-800/75 via-blue-700/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                    {itemDiscount && (
                      <span className="absolute left-3 top-3 z-10 rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white">
                        Hemat {itemDiscount}
                      </span>
                    )}
                  </div>

                  <div className="flex flex-grow flex-col p-5">
                    <h3 className="text-base font-bold text-slate-950 transition-colors group-hover:text-blue-600">
                      {itemName}
                    </h3>

                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-500">
                      {item.deskripsi}
                    </p>

                    <span className="mt-5 text-sm font-semibold text-blue-600 transition-colors group-hover:text-blue-700">
                      Lihat Detail
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Modal Login */}
      <LoginRequiredModal
        isOpen={showLoginModal}
        message="Anda perlu login untuk melakukan booking layanan HomeCare."
      />
    </main>
  );
}

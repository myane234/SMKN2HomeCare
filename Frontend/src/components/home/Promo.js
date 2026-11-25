
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

import {
  getActivePromos,
  getPromoServiceName,
  getPromoImagePath,
  formatPromoDiscount,
  formatPromoDate,
} from "@/services/promoService";

import { resolveImageUrl } from "@/services/resolveImage";

export default function Promo() {
  const [promos, setPromos] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);
  const [loading, setLoading] = useState(true);

  const scrollContainerRef = useRef(null);
  const activeIndexRef = useRef(0);

  // Ambil maksimal 3 promo aktif dari backend.
  useEffect(() => {
    let isMounted = true;

    async function loadPromos() {
      try {
        const data = await getActivePromos();

        if (!isMounted) return;

        const validPromos = data
          .filter(
            (item) =>
              item?.id_promo !== null &&
              item?.id_promo !== undefined
          )
          .slice(0, 3);

        setPromos(validPromos);
        setActiveIndex(0);
        activeIndexRef.current = 0;
      } catch (error) {
        console.error("Gagal memuat promo homepage:", error);

        if (isMounted) {
          setPromos([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadPromos();

    return () => {
      isMounted = false;
    };
  }, []);

  // Deteksi desktop mulai dari lebar 1024px.
  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");

    function handleResize() {
      setIsDesktop(mediaQuery.matches);
    }

    handleResize();
    mediaQuery.addEventListener("change", handleResize);

    return () => {
      mediaQuery.removeEventListener("change", handleResize);
    };
  }, []);

  // Perbarui dot aktif berdasarkan posisi kartu yang terlihat.
  useEffect(() => {
    const container = scrollContainerRef.current;

    if (!container || promos.length === 0 || isDesktop) return;

    function handleScroll() {
      const cards = Array.from(
        container.querySelectorAll("[data-promo-card]")
      );

      if (cards.length === 0) return;

      const containerRect = container.getBoundingClientRect();
      const containerCenter =
        containerRect.left + container.clientWidth / 2;

      let closestIndex = 0;
      let closestDistance = Infinity;

      cards.forEach((card, index) => {
        const cardRect = card.getBoundingClientRect();
        const cardCenter = cardRect.left + cardRect.width / 2;

        const distance = Math.abs(
          containerCenter - cardCenter
        );

        if (distance < closestDistance) {
          closestDistance = distance;
          closestIndex = index;
        }
      });

      activeIndexRef.current = closestIndex;
      setActiveIndex(closestIndex);
    }

    container.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [promos.length, isDesktop]);

  // Geser ke kartu berdasarkan dot yang diklik.
  function scrollToCard(index) {
    const container = scrollContainerRef.current;

    if (!container) return;

    const cards = container.querySelectorAll("[data-promo-card]");
    const targetCard = cards[index];

    if (!targetCard) return;

    const containerRect = container.getBoundingClientRect();
    const cardRect = targetCard.getBoundingClientRect();

    const targetPosition =
      container.scrollLeft +
      cardRect.left -
      containerRect.left;

    container.scrollTo({
      left: targetPosition,
      behavior: "smooth",
    });

    activeIndexRef.current = index;
    setActiveIndex(index);
  }

  // Auto-slide hanya untuk mobile setiap 5 detik.
  useEffect(() => {
    const container = scrollContainerRef.current;

    if (!container || isDesktop || promos.length <= 1) {
      return;
    }

    const interval = setInterval(() => {
      const nextIndex =
        (activeIndexRef.current + 1) % promos.length;

      const cards = container.querySelectorAll(
        "[data-promo-card]"
      );

      const targetCard = cards[nextIndex];

      if (!targetCard) return;

      const containerRect = container.getBoundingClientRect();
      const cardRect = targetCard.getBoundingClientRect();

      const targetPosition =
        container.scrollLeft +
        cardRect.left -
        containerRect.left;

      container.scrollTo({
        left: targetPosition,
        behavior: "smooth",
      });

      activeIndexRef.current = nextIndex;
      setActiveIndex(nextIndex);
    }, 5000);

    return () => clearInterval(interval);
  }, [promos.length, isDesktop]);

  if (loading) {
    return (
      <section className="relative bg-white py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 h-8 w-40 animate-pulse rounded-lg bg-slate-100" />

          <div className="grid gap-4 lg:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div
                key={item}
                className="h-[360px] animate-pulse rounded-2xl bg-slate-100"
              />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (promos.length === 0) {
    return null;
  }

  return (
    <section className="relative bg-white py-12 sm:py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Header - mengikuti layout Artikel */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <span className="text-2xl font-semibold uppercase tracking-[0.2em] text-blue-600">
            Promo
          </span>

          <Link
            href="/promo"
            className="text-sm font-semibold text-blue-600 transition-colors duration-300 hover:text-blue-700"
          >
            Lihat Semua
          </Link>
        </div>

        {/* Slider / Grid */}
        <div
          ref={scrollContainerRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4 lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0"
          style={{
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
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
                data-promo-card
                className="group relative flex w-[85%] flex-shrink-0 snap-start flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl lg:w-auto"
              >
                {/* Image - ukuran lebih besar dan konsisten */}
                <div className="relative h-56 w-full flex-shrink-0 overflow-hidden bg-slate-200 sm:h-60">
                  {image ? (
                    <img
                      src={image}
                      alt={promoName}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
                      Gambar promo tidak tersedia
                    </div>
                  )}

                  {/* Gradasi biru hanya pada gambar:
                      tebal di bawah, memudar ke atas.
                      Muncul ketika kartu di-hover. */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-blue-800/75 via-blue-700/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                  {discount && (
                    <span className="absolute left-4 top-4 z-10 inline-flex rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm">
                      Hemat {discount}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex flex-grow flex-col justify-between p-4 sm:p-5">
                  <div>
                    <h3 className="line-clamp-2 text-base font-bold leading-tight text-slate-950 transition-colors duration-300 group-hover:text-blue-600 sm:text-lg">
                      {promoName}
                    </h3>

                    <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-slate-600 sm:text-sm">
                      {promo.deskripsi ||
                        "Nikmati penawaran khusus untuk layanan HomeCare."}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="mt-4 border-t border-slate-100 pt-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] text-slate-400">
                          Berlaku sampai
                        </p>

                        <p className="mt-1 text-xs font-semibold text-slate-700 sm:text-sm">
                          {formatPromoDate(promo.tanggal_berakhir)}
                        </p>
                      </div>

                      <span className="text-xs font-semibold text-blue-600 transition-colors duration-300 group-hover:text-blue-700">
                        Lihat Detail
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Dot navigation hanya mobile */}
        {promos.length > 1 && (
          <div className="mt-4 flex justify-center gap-2 lg:hidden">
            {promos.map((promo, index) => (
              <button
                key={promo.id_promo}
                type="button"
                onClick={() => scrollToCard(index)}
                aria-label={`Tampilkan promo ${index + 1}`}
                aria-current={activeIndex === index}
                className={`h-2 rounded-full transition-all duration-300 ${
                  activeIndex === index
                    ? "w-7 bg-blue-600"
                    : "w-2 bg-blue-200 hover:bg-blue-400"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

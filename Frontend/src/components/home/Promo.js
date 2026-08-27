"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getActivePromos, generatePromoSlug, getTextValue } from "@/services/promoService";
import { resolveImageUrl } from "@/services/resolveImage";

export default function Promo() {
  const [promos, setPromos] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoScrolling, setIsAutoScrolling] = useState(true);
  const scrollContainerRef = useRef(null);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    async function loadPromos() {
      const data = await getActivePromos();
      setPromos(data.slice(0, 6));
    }
    loadPromos();
  }, []);

  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || promos.length === 0 || isDesktop) return;

    const handleScroll = () => {
      const { scrollLeft, clientWidth } = container;
      const cardWidth = clientWidth + 16;
      const index = Math.round(scrollLeft / cardWidth);
      if (index !== activeIndex && index < promos.length) {
        setActiveIndex(index);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [promos.length, activeIndex, isDesktop]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || promos.length === 0 || isDesktop || !isAutoScrolling) return;

    const interval = setInterval(() => {
      const { scrollLeft, scrollWidth, clientWidth } = container;
      const maxScroll = scrollWidth - clientWidth;
      const cardWidth = clientWidth + 16;

      if (scrollLeft >= maxScroll - 10) {
        container.scrollTo({ left: 0, behavior: "smooth" });
        setActiveIndex(0);
      } else {
        const nextScroll = scrollLeft + cardWidth;
        container.scrollTo({ left: nextScroll, behavior: "smooth" });
        const nextIndex = Math.round(nextScroll / cardWidth);
        if (nextIndex < promos.length) {
          setActiveIndex(nextIndex);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [promos.length, isDesktop, isAutoScrolling]);

  const handleMouseEnter = () => setIsAutoScrolling(false);
  const handleMouseLeave = () => setIsAutoScrolling(true);

  const scrollToCard = (index) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const cardWidth = container.clientWidth + 16;
    container.scrollTo({ left: index * cardWidth, behavior: "smooth" });
    setActiveIndex(index);
  };

  if (!promos || promos.length === 0) {
    return null;
  }

  return (
    <section className="relative py-16 sm:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <span className="text-2xl font-semibold uppercase tracking-[0.2em] text-blue-600">
              Promo
            </span>
          </div>

          <Link
            href="/promo"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
          >
            Lihat Semua →
          </Link>
        </div>

        <div 
          ref={scrollContainerRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="flex overflow-x-auto gap-4 pb-4 lg:grid lg:grid-cols-3 snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {promos.map((promo, idx) => {
            const name = getTextValue(promo, ["nama_paket", "nama", "title", "judul"]);
            const slug = generatePromoSlug(name);
            const image = resolveImageUrl(getTextValue(promo, ["gambar_promo", "gambar", "image", "foto"]));
            
            return (
              <div
                key={getTextValue(promo, ["id_promo", "id"]) || idx}
                className="group flex-shrink-0 w-full lg:w-auto bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl snap-start"
              >
                <Link href={`/promo/${slug || idx}`}>
                  <div className="relative h-58 w-full overflow-hidden">
                    <img
                      src={image}
                      alt={name || "Promo"}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    {promo.diskon_persen && (
                      <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase shadow-lg">
                         Diskon {Number(promo.diskon_persen)}%
                      </div>
                    )}
                  </div>
                </Link>

                <div className="p-6">
                  <Link href={`/promo/${slug || idx}`}>
                    <h3 className="text-lg font-bold text-gray-800 transition hover:text-blue-600 line-clamp-1">
                      {name}
                    </h3>
                  </Link>

                  <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                    {promo.deskripsi}
                  </p>

                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="flex items-center gap-2 text-xs text-gray-500">
                      Berakhir:{" "}
                      <span className="font-medium text-gray-700">
                        {new Date(
                          getTextValue(promo, ["tanggal_berakhir", "expired_at", "end_date"])
                        ).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {!isDesktop && promos.length > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {promos.map((_, index) => (
              <button
                key={index}
                onClick={() => scrollToCard(index)}
                className={`h-2 rounded-full transition-all duration-500 cursor-pointer ${
                  activeIndex === index
                    ? "w-8 bg-blue-600"
                    : "w-2 bg-blue-200 hover:bg-blue-300"
                }`}
                aria-label={`Go to promo ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
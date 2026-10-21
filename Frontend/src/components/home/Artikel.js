"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { getArtikel, DEFAULT_ARTIKEL } from "@/services/artikelService";
import { resolveImageUrl } from "@/services/resolveImage";

function getTextValue(item, keys) {
  for (const key of keys) {
    const value = item?.[key];
    if (value !== undefined && value !== null && value !== "") {
      return String(value);
    }
  }
  return "";
}

function createSlug(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getArticleSlug(item) {
  return createSlug(getTextValue(item, ["slug", "slug_artikel", "url_slug", "judul_artikel", "judul", "title"]));
}

function extractArticles(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
}



export default function Artikel() {
  const [articles, setArticles] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDesktop, setIsDesktop] = useState(false);
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    async function loadArticles() {
      try {
        const items = await getArtikel();
        setArticles(items.length > 0 ? items.slice(0, 3) : DEFAULT_ARTIKEL.slice(0, 3));
      } catch (error) {
        console.error("Gagal memuat artikel dashboard", error);
        setArticles(DEFAULT_ARTIKEL.slice(0, 3));
      }
    }

    loadArticles();
  }, []);

  // Check desktop
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);

  // Update active index on scroll
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || articles.length === 0 || isDesktop) return;

    const handleScroll = () => {
      const { scrollLeft, clientWidth } = container;
      const cardWidth = clientWidth + 16;
      const index = Math.round(scrollLeft / cardWidth);
      if (index !== activeIndex && index < articles.length) {
        setActiveIndex(index);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [articles.length, activeIndex, isDesktop]);

  // Auto scroll effect
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || articles.length === 0 || isDesktop) return;

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
        if (nextIndex < articles.length) {
          setActiveIndex(nextIndex);
        }
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [articles.length, isDesktop]);

  // Scroll ke card tertentu
  const scrollToCard = (index) => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const cardWidth = container.clientWidth + 16;
    container.scrollTo({ left: index * cardWidth, behavior: "smooth" });
    setActiveIndex(index);
  };

  return (
    <section className="relative py-16 sm:py-24 bg-white">
      <div className="mx-auto max-w-7xl px-6">
        {/* Header - IDENTIK dengan Promo */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <span className="text-2xl font-semibold uppercase tracking-[0.2em] text-blue-600">
              Artikel
            </span>
          </div>

          <Link
            href="/artikel"
            className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
          >
            Lihat Semua →
          </Link>
        </div>

        {/* Slider Container */}
        <div
          ref={scrollContainerRef}
          className="flex overflow-x-auto gap-4 pb-4 lg:grid lg:grid-cols-3 snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {articles.map((item, index) => {
            const title = getTextValue(item, ["judul_artikel", "judul", "title"]);
            const summary = getTextValue(item, ["ringkasan", "excerpt", "deskripsi", "isi_artikel", "konten", "content"]);
            const category = getTextValue(item, ["kategori_artikel", "kategori", "category"]);
            const image = resolveImageUrl(getTextValue(item, ["gambar_artikel", "gambar", "image", "foto"]));
            const slug = getArticleSlug(item);

            return (
              <div
                key={`${slug || title || index}`}
                className="group flex-shrink-0 w-[85%] lg:w-auto relative overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-2 hover:shadow-xl snap-start"
              >
                {/* Glow effect */}
                <div
                  className="absolute inset-0 rounded-lg opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                  style={{
                    background: 'radial-gradient(circle at center, rgba(59, 130, 246, 0.06) 0%, transparent 70%)',
                    pointerEvents: 'none'
                  }}
                />

                <div className="relative flex h-full flex-col">
                  {/* Image Container dengan Zoom Effect */}
                  <div className="relative h-28 w-full overflow-hidden bg-slate-200">
                    <img
                      src={image}
                      alt={title || "Artikel"}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    {/* Overlay gradient on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  </div>

                  {/* Content Container */}
                  <div className="flex flex-grow flex-col justify-between p-3">
                    <div>
                      {category && (
                        <span className="inline-flex rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-blue-700 transition-colors duration-300 group-hover:bg-blue-100">
                          {category}
                        </span>
                      )}

                      <Link href={`/artikel/${slug || index}`}>
                        <h3 className="mt-1.5 text-xs font-bold leading-tight text-slate-950 transition-colors duration-300 hover:text-blue-600 line-clamp-2">
                          {title || "Judul artikel"}
                        </h3>
                      </Link>

                      <p className="mt-1 text-xs leading-relaxed text-slate-600 line-clamp-1 transition-colors duration-300">
                        {summary || "Baca artikel lengkap untuk informasi lebih lanjut."}
                      </p>
                    </div>

                    {/* CTA Button */}
                    <div className="pt-1.5 mt-2 border-t border-slate-100">
                      <Link
                        href={`/artikel/${slug || index}`}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 transition-all duration-300 hover:text-blue-700 hover:gap-2"
                      >
                        Baca Selengkapnya
                        <span className="transition-transform duration-300 group-hover:translate-x-0.5">→</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
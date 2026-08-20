"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import api from "@/services/api";

const defaultSlides = [
  {
    id: 1,
    image: "/images/hero/hero-1.jpg",
    title: "Layanan Kesehatan Langsung ke Rumah",
    description:
      "Pesan layanan homecare profesional dengan mudah, aman, dan nyaman langsung dari rumah Anda.",
  },
  {
    id: 2,
    image: "/images/hero/hero-2.jpg",
    title: "Tenaga Kesehatan Profesional",
    description:
      "Seluruh mitra telah melalui proses verifikasi dan pelatihan sebelum melayani pasien.",
  },
  {
    id: 3,
    image: "/images/hero/hero-3.jpg",
    title: "Booking Mudah Kapan Saja",
    description:
      "Pilih layanan, tentukan jadwal, dan sistem akan mencarikan tenaga kesehatan yang sesuai.",
  },
];

export default function Hero() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [homeData, setHomeData] = useState(null);

  useEffect(() => {
    async function fetchHomeContent() {
      try {
        const res = await api.get("/api/resource/content/home", {
          validateStatus: (status) => status < 500,
        });
        if (res.status === 200 && res.data) {
          setHomeData(res.data);
        }
      } catch (err) {
        // Fallback ke default content jika request gagal
      }
    }
    fetchHomeContent();
  }, []);

  // Build slides dynamically from homeData (up to max 10)
  const getSlides = () => {
    if (!homeData) return defaultSlides;

    const dataObj = homeData?.data || homeData;

    const dynamicSlides = [];

    // Check slots 1 to 10
    for (let i = 1; i <= 10; i++) {
      const bannerKey = i === 1 ? 'home_banner' : `home_banner_${i}`;
      const titleKey = i === 1 ? 'home_text_banner' : `home_text_banner_${i}`;
      const descKey = i === 1 ? 'home_description' : `home_description_${i}`;

      const image = dataObj[bannerKey];
      if (image && typeof image === 'string' && image.trim() !== '') {
        dynamicSlides.push({
          id: i,
          image: image,
          title: dataObj[titleKey] || defaultSlides[0].title,
          description: dataObj[descKey] || defaultSlides[0].description,
        });
      }
    }

    // If no dynamic banners were uploaded, return defaultSlides
    if (dynamicSlides.length === 0) {
      return defaultSlides;
    }

    return dynamicSlides;
  };

  const slides = getSlides();

  useEffect(() => {
    if (slides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentSlide((prev) =>
        prev >= slides.length - 1 ? 0 : prev + 1
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [slides.length]);

  const activeIndex = currentSlide < slides.length ? currentSlide : 0;

  const nextSlide = () => {
    setCurrentSlide((prev) =>
      prev >= slides.length - 1 ? 0 : prev + 1
    );
  };

  const prevSlide = () => {
    setCurrentSlide((prev) =>
      prev === 0 ? slides.length - 1 : prev - 1
    );
  };

  const activeSlide = slides[activeIndex];

  return (
    <section className="relative h-[480px] sm:h-[560px] lg:h-[700px] w-full overflow-hidden">
      {/* Background Image */}
      <Image
        src={activeSlide.image}
        alt={activeSlide.title || "Hero Banner"}
        fill
        priority
        className="object-cover"
      />

      {/* Overlay putih transparan dari kiri ke tengah */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/25 via-white/5 to-transparent"></div>

      {/* Gradient putih di bagian bawah untuk transisi menyatu */}
      <div className="absolute bottom-0 left-0 right-0 h-28 sm:h-36 lg:h-48 bg-gradient-to-t from-white via-white/60 to-transparent"></div>

      {/* Content - Posisi tengah dengan padding */}
      <div className="absolute inset-0 flex items-center -translate-y-8 md:-translate-y-12">
        <div className="mx-auto w-full max-w-7xl px-6 md:px-8">
          <div className="max-w-2xl">
            {/* Tagline kecil */}
            <p className="mb-3 text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">
              SmartHomeCare
            </p>

            <h1 className="mb-4 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
              {activeSlide.title}
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-gray-800 leading-relaxed max-w-xl">
              {activeSlide.description}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Buttons - Render only if more than 1 slide */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-3 text-blue-600 backdrop-blur-sm hover:bg-white transition-all hover:scale-110 shadow-lg border border-gray-200/50 cursor-pointer"
            aria-label="Previous slide"
          >
            <FiChevronLeft size={24} />
          </button>

          <button
            onClick={nextSlide}
            className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-3 text-blue-600 backdrop-blur-sm hover:bg-white transition-all hover:scale-110 shadow-lg border border-gray-200/50 cursor-pointer"
            aria-label="Next slide"
          >
            <FiChevronRight size={24} />
          </button>

          {/* Dots Indicator - Capsule style */}
          <div className="absolute bottom-12 sm:bottom-16 lg:bottom-20 left-1/2 flex -translate-x-1/2 gap-2 z-10">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`h-2 rounded-full transition-all duration-500 cursor-pointer ${
                  activeIndex === index
                    ? "w-8 bg-blue-600" // Active - biru utama
                    : "w-2 bg-blue-200 hover:bg-blue-300" // Inactive - biru muda
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}
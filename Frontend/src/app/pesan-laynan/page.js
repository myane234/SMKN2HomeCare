"use client";

import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { getLayanan } from "@/services/layananService";
import { getArtikel } from "@/services/artikelService";
import { useRouter, useSearchParams } from "next/navigation";
import LoginRequiredModal from "@/components/LoginRequiredModal";
import { showToast } from "@/components/Toast";
import Link from "next/link";
import { resolveImageUrl } from "@/services/resolveImage";
import api from "@/services/api";

const CART_STORAGE_KEY = "smarthomecare_cart";
const FONT_STACK = '"Poppins", "Inter", "Segoe UI", sans-serif';

/**
 * ===================== HERO BANNER CONFIG =====================
 */
const HERO_SLIDES = [
  {
    id: "hero-homecare",
    eyebrow: "SMARTHOMECARE",
    title: "Perawat Home Care Siap Membantu di Rumah Anda",
    description: "Pesan layanan perawat profesional dengan mudah, aman, dan nyaman langsung dari rumah Anda.",
    ctaLabel: "Pesan Sekarang",
    ctaHref: "/pesan-laynan",
    image: "https://perawatlansia.id/wp-content/uploads/2024/01/resize_nurse-or-doctor-who-work-as-homecare-staff-help-to-2023-11-27-04-56-33-utc-768x512.jpg",
  },
];

/**
 * ===================== DESKRIPSI KATEGORI =====================
 */
const CATEGORY_META = {
  "fisioterapi": "Latihan & terapi gerak oleh fisioterapis profesional.",
  "home care": "Pendampingan dan perawatan harian di rumah Anda.",
  "perawatan luka": "Penanganan luka steril oleh perawat berpengalaman.",
  "kesehatan": "Pemeriksaan dan konsultasi kesehatan umum.",
  "ibu dan anak": "Layanan khusus untuk ibu menyusui, bayi, dan anak.",
  "medical checkup": "Pemeriksaan kesehatan lengkap langsung di rumah.",
  "pemasangan alat medis": "Pemasangan & penggantian alat medis oleh tenaga ahli.",
  "pemasangan dan penggantian alat medis": "Pemasangan & penggantian alat medis oleh tenaga ahli.",
  "default": "Layanan homecare profesional siap membantu Anda.",
};

function getCategoryMeta(category) {
  return CATEGORY_META[(category || "").toLowerCase()] || CATEGORY_META.default;
}

const CATEGORY_IMAGE = {
  "fisioterapi": "",
  "home care": "",
  "perawatan luka": "",
  "kesehatan": "",
  "ibu dan anak": "",
  "medical checkup": "",
  "pemasangan alat medis": "",
  "pemasangan dan penggantian alat medis": "",
};

function getCategoryImage(category) {
  return CATEGORY_IMAGE[(category || "").toLowerCase()] || "";
}

function CategoryIcon({ name, className = "h-5 w-5" }) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.75,
    strokeLinecap: "round",
    strokeLinejoin: "round",
  };

  switch ((name || "").toLowerCase()) {
    case "fisioterapi":
      return (
        <svg {...common}>
          <path d="M6 20c1.5-3 2-6 2-9V6a2 2 0 1 1 4 0v3.5" />
          <path d="M12 9.5V17a2 2 0 0 0 2 2h1" />
          <circle cx="17" cy="6" r="1.5" />
        </svg>
      );
    case "home care":
      return (
        <svg {...common}>
          <path d="M4 11.5 12 4l8 7.5" />
          <path d="M6 10v9a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-9" />
          <path d="M10 20v-5h4v5" />
        </svg>
      );
    case "perawatan luka":
      return (
        <svg {...common}>
          <rect x="3.5" y="8.5" width="17" height="7" rx="2" transform="rotate(-15 12 12)" />
          <path d="M9.5 9.8v4.4M14.5 8.4v4.4" />
        </svg>
      );
    case "kesehatan":
      return (
        <svg {...common}>
          <path d="M12 20s-7-4.4-9.5-9C1 7.5 2.8 4.5 6 4.5c2 0 3.3 1.1 6 3.6 2.7-2.5 4-3.6 6-3.6 3.2 0 5 3 4.5 6.5-2.5 4.6-9.5 9-9.5 9Z" />
        </svg>
      );
    case "ibu dan anak":
      return (
        <svg {...common}>
          <circle cx="9" cy="7" r="2.5" />
          <path d="M4.5 19c0-2.8 2-4.5 4.5-4.5s4.5 1.7 4.5 4.5" />
          <circle cx="17.5" cy="10.5" r="1.75" />
          <path d="M14.5 19c.1-1.9 1.4-3.2 3-3.2s2.9 1.3 3 3.2" />
        </svg>
      );
    case "medical checkup":
      return (
        <svg {...common}>
          <rect x="5.5" y="4" width="13" height="17" rx="2" />
          <path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1" />
          <path d="M8.5 11.5l2 2 4-4.2" />
        </svg>
      );
    case "pemasangan alat medis":
    case "pemasangan dan penggantian alat medis":
      return (
        <svg {...common}>
          <path d="M12 3c3 3.6 5 6.6 5 9.5a5 5 0 0 1-10 0C7 9.6 9 6.6 12 3Z" />
        </svg>
      );
    default:
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9 12.5l2 2 4-4.5" />
        </svg>
      );
  }
}

function SearchOffIcon({ className = "h-7 w-7" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m20 20-4.35-4.35" />
    </svg>
  );
}

function TagIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12.5 3.5H6a1.5 1.5 0 0 0-1.5 1.5v6.5a1.5 1.5 0 0 0 .44 1.06l8.5 8.5a1.5 1.5 0 0 0 2.12 0l5.44-5.44a1.5 1.5 0 0 0 0-2.12l-8.5-8.5A1.5 1.5 0 0 0 12.5 3.5Z" />
      <circle cx="8.75" cy="8.75" r="1.25" />
    </svg>
  );
}

function ClockIcon({ className = "h-3.5 w-3.5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

function TruckIcon({ className = "h-3.5 w-3.5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2.5" y="7" width="11" height="9" rx="1" />
      <path d="M13.5 10h3.2L19.5 13v3h-6" />
      <circle cx="6" cy="17.5" r="1.5" />
      <circle cx="16.5" cy="17.5" r="1.5" />
    </svg>
  );
}

function ChevronRightIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}

function ChevronLeftIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m15 6-6 6 6 6" />
    </svg>
  );
}

function CartIcon({ className = "h-7 w-7" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}

function PlusIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function CheckIcon({ className = "h-4 w-4" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="m5 12 5 5 9-10" />
    </svg>
  );
}

function ArrowUpRightIcon({ className = "h-3.5 w-3.5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M7 17 17 7M9 7h8v8" />
    </svg>
  );
}

function getTextValue(item, keys) {
  if (!item) return "";
  for (const key of keys) {
    const value = item?.[key];
    if (value !== undefined && value !== null && value !== "") {
      if (typeof value === "object") {
        return value.nama_kategori || value.nama || value.title || value.kategori || String(value);
      }
      return String(value);
    }
  }
  return "";
}

function formatCurrency(value) {
  const numericValue = Number(value);

  if (Number.isNaN(numericValue)) {
    return "Harga belum tersedia";
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(numericValue);
}

function formatDuration(value) {
  if (!value) {
    return "Durasi belum tersedia";
  }

  return `${value} menit`;
}

function isTransportIncluded(service) {
  const value = service?.include_transport ?? service?.transport;
  return value === true || value === 1 || value === "1" || value === "true";
}

function extractServices(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
}

function getServiceId(service) {
  return getTextValue(service, ["id_layanan", "id", "uuid"]) || getTextValue(service, ["nama_layanan", "nama", "title"]);
}

function loadCartFromStorage() {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Gagal membaca keranjang", error);
    return [];
  }
}

function saveCartToStorage(cart) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  } catch (error) {
    console.error("Gagal menyimpan keranjang", error);
  }
}

function LayananPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [allServices, setAllServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [cart, setCart] = useState([]);
  const [addedServiceId, setAddedServiceId] = useState(null);
  const [heroSlide, setHeroSlide] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);
  const [heroSlides, setHeroSlides] = useState(HERO_SLIDES);
  const [isScrolled, setIsScrolled] = useState(false);
  const [cartBump, setCartBump] = useState(false);
  const [pressedServiceId, setPressedServiceId] = useState(null);
  const [promos, setPromos] = useState([]);
  const [loadingPromos, setLoadingPromos] = useState(true);
  const [articles, setArticles] = useState([]);
  const [loadingArticles, setLoadingArticles] = useState(true);

  useEffect(() => {
    setIsLoggedIn(document.cookie.includes("is_logged_in=true"));
    setCart(loadCartFromStorage());
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function loadHomeBanner() {
      try {
        const res = await api.get("/api/resource/content/home");
        const data = res.data?.data || res.data;
        if (!isMounted || !data) return;

        const loadedSlides = [];
        for (let i = 1; i <= 10; i++) {
          const bannerKey = i === 1 ? "home_banner" : `home_banner_${i}`;
          const textKey = i === 1 ? "home_text_banner" : `home_text_banner_${i}`;
          const descKey = i === 1 ? "home_description" : `home_description_${i}`;

          const image = data[bannerKey] ? resolveImageUrl(data[bannerKey]) : "";
          const title = data[textKey] || "";
          const description = data[descKey] || "";

          if (image || title || description) {
            loadedSlides.push({
              id: `hero-cms-${i}`,
              eyebrow: "SMARTHOMECARE",
              title: title || "Perawat Home Care Siap Membantu di Rumah Anda",
              description: description || "Pesan layanan perawat profesional dengan mudah, aman, dan nyaman langsung dari rumah Anda.",
              ctaLabel: "Pesan Sekarang",
              ctaHref: "/pesan-laynan",
              image: image || HERO_SLIDES[0].image,
            });
          }
        }

        if (loadedSlides.length > 0) {
          setHeroSlides(loadedSlides);
        }
      } catch (err) {
        // Silently retain default slides
      }
    }

    loadHomeBanner();

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch Promo aktif dari API /api/promo/active
  useEffect(() => {
    let isMounted = true;

    async function loadPromos() {
      try {
        setLoadingPromos(true);
        const res = await api.get("/api/promo/active");
        const data = res.data?.data || res.data;
        if (!isMounted) return;
        setPromos(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Gagal memuat data promo", error);
      } finally {
        if (isMounted) setLoadingPromos(false);
      }
    }

    loadPromos();

    return () => {
      isMounted = false;
    };
  }, []);

  // Fetch Artikel dari API
  useEffect(() => {
    let isMounted = true;

    async function loadArticles() {
      try {
        setLoadingArticles(true);
        const data = await getArtikel();
        if (!isMounted) return;
        setArticles(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Gagal memuat data artikel", error);
      } finally {
        if (isMounted) setLoadingArticles(false);
      }
    }

    loadArticles();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (heroSlides.length <= 1 || heroPaused) return;
    const timer = window.setInterval(() => {
      setHeroSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [heroPaused, heroSlides.length]);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 8);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const goToPrevSlide = () => {
    setHeroSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  };

  const goToNextSlide = () => {
    setHeroSlide((prev) => (prev + 1) % heroSlides.length);
  };

  const currentCategory = searchParams.get("kategori") || "";

  // Fetch Layanan & Kategori dari API backend (/api/layanan/kategori dan /api/layanan)
  useEffect(() => {
    let isMounted = true;

    async function loadServices() {
      try {
        setLoading(true);
        const [servicesRes, categoriesRes] = await Promise.allSettled([
          getLayanan(currentCategory ? { kategori: currentCategory } : undefined),
          api.get("/api/layanan/kategori"),
        ]);

        if (!isMounted) return;

        const items = servicesRes.status === "fulfilled" ? extractServices(servicesRes.value) : [];
        if (currentCategory) {
          setFilteredServices(items);
        } else {
          setAllServices(items);
          setFilteredServices(items);
        }

        let catList = [];
        if (categoriesRes.status === "fulfilled") {
          const catResponseData = categoriesRes.value.data?.data || categoriesRes.value.data;
          if (Array.isArray(catResponseData)) {
            catList = catResponseData
              .map((c) => (typeof c === "string" ? c : getTextValue(c, ["nama_kategori", "nama", "kategori", "category"])))
              .filter(Boolean);
          }
        }

        const uniqueFromItems = Array.from(
          new Set(
            items
              .map((item) => getTextValue(item, ["kategori_layanan", "kategori", "category", "nama_kategori"]))
              .filter(Boolean)
          )
        );

        const mergedCategories = Array.from(new Set([...catList, ...uniqueFromItems]))
          .filter((c) => c && c.toLowerCase() !== "home care" && c.toLowerCase() !== "homecare");
        setCategories(mergedCategories);
      } catch (error) {
        console.error("Gagal memuat data layanan", error);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadServices();

    return () => {
      isMounted = false;
    };
  }, [currentCategory]);

  useEffect(() => {
    if (selectedService) {
      const raf = requestAnimationFrame(() => setModalVisible(true));
      return () => cancelAnimationFrame(raf);
    }
    setModalVisible(false);
  }, [selectedService]);

  const categoryOptions = categories.filter((c) => c && c.toLowerCase() !== "home care" && c.toLowerCase() !== "homecare");

  const categoryCounts = useMemo(() => {
    const counts = {};
    allServices.forEach((service) => {
      const cat = getTextValue(service, ["kategori_layanan", "kategori", "category", "nama_kategori"]);
      if (!cat) return;
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [allServices]);

  const handleCategorySelect = (value) => {
    if (value) {
      router.push(`/pesan-laynan?kategori=${encodeURIComponent(value)}`);
    } else {
      router.push("/pesan-laynan");
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    window.setTimeout(() => setSelectedService(null), 180);
  };

  const handleAddToCart = (event, service) => {
    event.stopPropagation();

    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    const serviceId = getServiceId(service);

    setCart((prevCart) => {
      const existing = prevCart.find((item) => getServiceId(item.service) === serviceId);
      let nextCart;

      if (existing) {
        nextCart = prevCart.map((item) =>
          getServiceId(item.service) === serviceId ? { ...item, qty: item.qty + 1 } : item
        );
      } else {
        nextCart = [...prevCart, { service, qty: 1 }];
      }

      saveCartToStorage(nextCart);
      return nextCart;
    });

    setAddedServiceId(serviceId);
    window.setTimeout(() => setAddedServiceId(null), 1200);

    setCartBump(true);
    window.setTimeout(() => setCartBump(false), 500);

    const title = getTextValue(service, ["nama_layanan", "nama", "title"]);
    showToast(`${title} berhasil ditambahkan ke keranjang`, "success");
  };

  const cartItemCount = cart.reduce((total, item) => total + item.qty, 0);

  const handleGoToCart = () => {
    router.push("/keranjang");
  };

  return (
    <>
      <main className="min-h-screen bg-slate-50 pb-24" style={{ fontFamily: FONT_STACK }}>
        {heroSlides.length > 0 ? (
          <section
            className="relative h-[300px] w-full overflow-hidden sm:h-[380px] md:h-[440px]"
            onMouseEnter={() => setHeroPaused(true)}
            onMouseLeave={() => setHeroPaused(false)}
          >
            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[15] h-24 bg-gradient-to-t from-slate-50 via-slate-50/40 to-transparent sm:h-32" />

            {heroSlides.map((slide, index) => (
              <div
                key={slide.id || index}
                className={`absolute inset-0 transition-opacity duration-700 ${
                  index === heroSlide ? "opacity-100" : "pointer-events-none opacity-0"
                }`}
              >
                <img
                  src={slide.image}
                  alt={slide.title}
                  loading={index === 0 ? "eager" : "lazy"}
                  className="h-full w-full object-cover object-[center_25%]"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950/70 via-slate-950/35 to-transparent" />

                <div className="relative z-10 flex h-full items-center px-5 sm:px-10 md:px-16">
                  <div className="max-w-md sm:max-w-lg">
                    <p className="text-xs font-bold tracking-[0.25em] text-blue-400 sm:text-sm">{slide.eyebrow}</p>
                    <h2 className="mt-2 text-2xl font-bold leading-tight text-white sm:text-3xl md:text-4xl">
                      {slide.title}
                    </h2>
                    <p className="mt-3 text-sm leading-relaxed text-white/85 sm:text-base">{slide.description}</p>
                    {slide.ctaLabel ? (
                      <Link
                        href={slide.ctaHref || "#"}
                        className="mt-5 inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-600/30 active:translate-y-0"
                      >
                        {slide.ctaLabel}
                      </Link>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}

            {heroSlides.length > 1 ? (
              <>
                <button
                  type="button"
                  onClick={goToPrevSlide}
                  aria-label="Slide sebelumnya"
                  className="absolute left-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm transition-all duration-200 hover:scale-110 hover:bg-white active:scale-95 sm:left-5 sm:h-10 sm:w-10"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={goToNextSlide}
                  aria-label="Slide berikutnya"
                  className="absolute right-3 top-1/2 z-20 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-slate-700 shadow-sm transition-all duration-200 hover:scale-110 hover:bg-white active:scale-95 sm:right-5 sm:h-10 sm:w-10"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>

                <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5">
                  {heroSlides.map((slide, index) => (
                    <button
                      key={slide.id || index}
                      type="button"
                      onClick={() => setHeroSlide(index)}
                      aria-label={`Ke slide ${index + 1}`}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        index === heroSlide ? "w-6 bg-blue-500" : "w-1.5 bg-white/60 hover:bg-white/80"
                      }`}
                    />
                  ))}
                </div>
              </>
            ) : null}
          </section>
        ) : null}

        <div
          className={`sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur transition-shadow duration-300 ${
            isScrolled ? "shadow-sm" : ""
          }`}
        >
          <div className="mx-auto max-w-[1600px] px-4 pt-6 md:px-6 md:pt-8">
            <p className="text-[11px] font-bold tracking-[0.25em] text-blue-600">
              {currentCategory ? "KATALOG LAYANAN · LAYANAN" : "KATALOG LAYANAN"}
            </p>
            <h1 className="mt-1 text-lg font-bold text-slate-900 sm:text-xl">
              {currentCategory || "Layanan Homecare"}
            </h1>
          </div>

          {currentCategory ? (
            <div className="mx-auto max-w-[1600px] px-4 pb-3 md:px-6">
              <button
                type="button"
                onClick={() => handleCategorySelect("")}
                className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-600 transition-all duration-200 hover:border-blue-300 hover:text-blue-600 active:scale-95 sm:text-sm"
              >
                <ChevronLeftIcon className="h-4 w-4" />
                Semua Kategori
              </button>
            </div>
          ) : (
            <div className="h-3" />
          )}
        </div>

        <div className="mx-auto max-w-[1600px] px-4 pt-5 md:px-6">
          {currentCategory ? (
            <>
              <p className="mb-3 text-sm text-slate-500">
                <span className="font-semibold text-slate-900">{filteredServices.length}</span> layanan tersedia
                {" "}
                untuk <span className="font-semibold text-blue-600">{currentCategory}</span>
              </p>

              {loading ? (
                <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex animate-pulse gap-4 p-4">
                      <div className="h-20 w-20 shrink-0 rounded-lg bg-slate-100 sm:h-24 sm:w-24" />
                      <div className="flex-1 space-y-2 py-1">
                        <div className="h-4 w-2/3 rounded bg-slate-100" />
                        <div className="h-3 w-full rounded bg-slate-50" />
                        <div className="h-3 w-1/3 rounded bg-slate-50" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredServices.length === 0 ? (
                <div className="rounded-xl border border-slate-200 bg-white p-10 text-center text-slate-500">
                  <SearchOffIcon className="mx-auto h-8 w-8 text-slate-300" />
                  <p className="mt-3 font-medium">Tidak ada layanan dengan kategori "{currentCategory}"</p>
                  <button
                    type="button"
                    onClick={() => handleCategorySelect("")}
                    className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-600 hover:underline"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                    Kembali ke kategori
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
                  {filteredServices.map((service, index) => {
                    const title = getTextValue(service, ["nama_layanan", "nama", "title"]);
                    const description = getTextValue(service, ["deskripsi_layanan", "deskripsi", "keterangan", "description"]);
                    const imageUrl = resolveImageUrl(getTextValue(service, ["foto_layanan", "foto", "image"]));
                    const category = getTextValue(service, ["kategori_layanan", "kategori", "category", "nama_kategori"]);
                    const price = getTextValue(service, ["harga", "price"]);
                    const duration = getTextValue(service, ["durasi_menit", "durasi", "duration"]);
                    const serviceId = getServiceId(service);
                    const justAdded = addedServiceId === serviceId;
                    const isPressed = pressedServiceId === serviceId;
                    const transportIncluded = isTransportIncluded(service);

                    return (
                      <article
                        key={`${title}-${index}`}
                        role="article"
                        tabIndex={0}
                        onClick={() => setSelectedService(service)}
                        onKeyDown={(event) => {
                          if (event.key === "Enter" || event.key === " ") {
                            event.preventDefault();
                            setSelectedService(service);
                          }
                        }}
                        onPointerDown={() => setPressedServiceId(serviceId)}
                        onPointerUp={() => setPressedServiceId(null)}
                        onPointerLeave={() => setPressedServiceId(null)}
                        className={`group flex cursor-pointer gap-3 p-3 transition-all duration-150 hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none sm:gap-4 sm:p-4 ${
                          isPressed ? "scale-[0.99] bg-slate-50" : ""
                        }`}
                      >
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100 sm:h-24 sm:w-24">
                          <img
                            src={imageUrl}
                            alt={title || "Layanan"}
                            loading="lazy"
                            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                        </div>

                        <div className="flex min-w-0 flex-1 flex-col justify-center">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 text-[11px] font-medium text-blue-600">
                                <CategoryIcon name={category} className="h-3.5 w-3.5" />
                                <span className="truncate">{category || "Layanan"}</span>
                              </div>
                              <h2 className="mt-0.5 truncate text-sm font-semibold text-slate-900 sm:text-base">
                                {title || "Layanan"}
                              </h2>
                            </div>
                            <ChevronRightIcon className="mt-1 hidden h-4 w-4 shrink-0 text-slate-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-blue-400 sm:block" />
                          </div>

                          {description ? (
                            <p className="mt-1 line-clamp-1 text-xs text-slate-500 sm:text-sm">{description}</p>
                          ) : null}

                          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 sm:text-xs">
                            {duration ? (
                              <span className="flex items-center gap-1">
                                <ClockIcon className="h-3.5 w-3.5" />
                                {formatDuration(duration)}
                              </span>
                            ) : null}
                            <span className="flex items-center gap-1">
                              <TruckIcon className="h-3.5 w-3.5" />
                              {transportIncluded ? "Transport termasuk" : "Transport terpisah"}
                            </span>
                          </div>

                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-sm font-bold text-slate-900 sm:text-base">{formatCurrency(price)}</span>
                            <button
                              type="button"
                              onClick={(event) => handleAddToCart(event, service)}
                              aria-label="Tambah ke keranjang"
                              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white transition-all duration-200 active:scale-90 sm:h-9 sm:w-9 ${
                                justAdded ? "scale-110 bg-emerald-600" : "bg-blue-600 hover:scale-105 hover:bg-blue-700"
                              }`}
                            >
                              {justAdded ? <CheckIcon className="h-4 w-4" /> : <PlusIcon className="h-4 w-4" />}
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          ) : (
            <>
              {loading ? (
                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-slate-200 bg-white">
                      <div className="aspect-[4/3] w-full bg-slate-100" />
                      <div className="p-4 sm:p-5">
                        <div className="h-4 w-2/3 rounded bg-slate-100 sm:h-5" />
                        <div className="mt-2 h-3 w-full rounded bg-slate-50 sm:h-3.5" />
                        <div className="mt-1 h-3 w-4/5 rounded bg-slate-50 sm:h-3.5" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
                  {categoryOptions.map((category) => {
                    const photo = getCategoryImage(category);
                    return (
                      <button
                        key={category}
                        type="button"
                        onClick={() => handleCategorySelect(category)}
                        className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-lg active:scale-[0.99]"
                      >
                        <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100">
                          {photo ? (
                            <img
                              src={photo}
                              alt={category}
                              loading="lazy"
                              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                            />
                          ) : null}
                        </div>

                        <div className="flex flex-1 flex-col p-4 sm:p-5">
                          <h3 className="text-sm font-semibold text-slate-900 sm:text-base md:text-lg">{category}</h3>
                          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-slate-500 sm:mt-2 sm:text-sm sm:line-clamp-none">
                            {getCategoryMeta(category)}
                          </p>
                          <div className="mt-3 flex w-full items-center justify-between border-t border-slate-100 pt-3 sm:mt-4">
                            <span className="text-xs font-medium text-slate-400 sm:text-sm">
                              {categoryCounts[category] || 0} layanan
                            </span>
                            <span className="flex items-center gap-1 text-xs font-semibold text-blue-600 sm:text-sm">
                              Lihat
                              <ChevronRightIcon className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 sm:h-4 sm:w-4" />
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Promo Berlangsung (Diambil dari API /api/promo/active) */}
              {!loadingPromos && promos.length > 0 ? (
                <div className="mb-6 mt-8">
                  <div className="mb-2 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-900">Promo Berlangsung</h2>
                    <Link href="/promo" className="group flex items-center gap-0.5 text-xs font-semibold text-blue-600 hover:underline">
                      Lihat semua
                      <ChevronRightIcon className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </Link>
                  </div>

                  <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0 md:grid md:grid-cols-3 md:overflow-visible [&::-webkit-scrollbar]:hidden">
                    {promos.map((promo, index) => {
                      const promoId = promo.id_promo || promo.id || index;
                      const title = getTextValue(promo, ["nama_paket", "nama", "title"]);
                      const desc = getTextValue(promo, ["deskripsi", "description"]);
                      const disc = promo.diskon_persen;

                      return (
                        <div
                          key={promoId}
                          className="flex min-w-[70vw] max-w-[70vw] shrink-0 snap-start flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md sm:min-w-[240px] sm:max-w-[240px] md:min-w-0 md:max-w-none md:w-full"
                        >
                          <div>
                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
                              <TagIcon className="h-3 w-3" />
                              {disc ? `Diskon ${disc}%` : "Promo"}
                            </span>
                            <h3 className="mt-2 text-sm font-semibold leading-snug text-slate-900">{title}</h3>
                            <p className="mt-1 text-xs leading-relaxed text-slate-500">{desc}</p>
                          </div>
                          <Link
                            href="/promo"
                            className="group mt-3 inline-flex items-center text-xs font-semibold text-blue-600 hover:underline"
                          >
                            Lihat Paket
                            <span className="ml-1 transition-transform duration-200 group-hover:translate-x-0.5">→</span>
                          </Link>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {loadingArticles ? (
                <div className="mb-2">
                  <div className="mb-2 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-900">Artikel &amp; Tips Kesehatan</h2>
                  </div>
                  <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0 md:grid md:grid-cols-3 [&::-webkit-scrollbar]:hidden">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-44 w-full animate-pulse rounded-xl border border-slate-200 bg-white p-4" />
                    ))}
                  </div>
                </div>
              ) : articles.length > 0 ? (
                <div className="mb-2">
                  <div className="mb-2 flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-slate-900">Artikel &amp; Tips Kesehatan</h2>
                    <Link href="/artikel" className="group flex items-center gap-0.5 text-xs font-semibold text-blue-600 hover:underline">
                      Lihat semua
                      <ChevronRightIcon className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </Link>
                  </div>

                  <div className="-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0 md:grid md:grid-cols-3 md:overflow-visible [&::-webkit-scrollbar]:hidden">
                    {articles.map((article, index) => {
                      const title = getTextValue(article, ["judul_artikel", "judul", "title"]);
                      const excerpt = getTextValue(article, ["ringkasan", "excerpt", "deskripsi", "isi_artikel", "konten"]);
                      const tag = getTextValue(article, ["kategori_artikel", "kategori", "category"]) || "Kesehatan";
                      const rawImage = getTextValue(article, ["gambar_artikel", "gambar", "image", "foto"]);
                      const image = resolveImageUrl(rawImage);
                      const slug = article?.slug || article?.slug_artikel || article?.id_artikel || article?.id || index;

                      return (
                        <Link
                          href={`/artikel/${slug}`}
                          key={article?.id_artikel || article?.id || index}
                          className="group flex min-w-[75vw] max-w-[75vw] shrink-0 snap-start flex-col overflow-hidden rounded-xl border border-slate-200 bg-white transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md sm:min-w-[260px] sm:max-w-[260px] md:min-w-0 md:max-w-none md:w-full"
                        >
                          <div className="h-32 w-full overflow-hidden bg-slate-100">
                            <img
                              src={image}
                              alt={title || "Artikel"}
                              loading="lazy"
                              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                            />
                          </div>
                          <div className="flex flex-1 flex-col p-3.5">
                            <span className="inline-flex w-fit items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                              {tag}
                            </span>
                            <h3 className="mt-2 line-clamp-2 text-sm font-semibold leading-snug text-slate-900">
                              {title}
                            </h3>
                            <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{excerpt}</p>
                            <span className="mt-auto flex items-center gap-1 pt-3 text-xs font-semibold text-blue-600">
                              Baca selengkapnya
                              <ArrowUpRightIcon className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                            </span>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </main>

      {currentCategory ? (
        <button
          type="button"
          onClick={handleGoToCart}
          aria-label="Buka keranjang"
          className={`fixed bottom-24 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg transition-all duration-200 hover:scale-105 hover:bg-emerald-600 active:scale-95 sm:bottom-8 sm:right-6 sm:h-16 sm:w-16 ${
            cartBump ? "scale-110" : ""
          }`}
        >
          <CartIcon className="h-6 w-6 sm:h-7 sm:w-7" />
          {cartItemCount > 0 ? (
            <span
              className={`absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose-500 px-1 text-[11px] font-bold text-white ring-2 ring-white transition-transform duration-200 ${
                cartBump ? "scale-125" : "scale-100"
              }`}
            >
              {cartItemCount}
            </span>
          ) : null}
        </button>
      ) : null}

      {selectedService ? (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 transition-opacity duration-200 ${
            modalVisible ? "opacity-100" : "opacity-0"
          }`}
          onClick={closeModal}
        >
          <div
            className={`relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl transition-all duration-200 ${
              modalVisible ? "translate-y-0 scale-100 opacity-100" : "translate-y-3 scale-95 opacity-0"
            }`}
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={closeModal}
              className="absolute right-4 top-4 z-10 rounded-full bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-colors duration-150 hover:bg-slate-100 cursor-pointer"
            >
              Tutup
            </button>

            <div className="relative h-56 w-full sm:h-64">
              <img
                src={resolveImageUrl(getTextValue(selectedService, ["foto_layanan", "foto", "image"]))}
                alt={getTextValue(selectedService, ["nama_layanan", "nama", "title"]) || "Layanan"}
                className="h-full w-full object-cover"
              />
            </div>

            <div className="p-5 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-blue-600">
                  {getTextValue(selectedService, ["kategori_layanan", "kategori", "category", "nama_kategori"]) || "Layanan"}
                </span>
              </div>

              <h2 className="mt-4 text-xl font-bold text-slate-900 sm:text-2xl">
                {getTextValue(selectedService, ["nama_layanan", "nama", "title"]) || "Layanan"}
              </h2>

              <p className="mt-4 leading-7 text-slate-600">
                {getTextValue(selectedService, ["deskripsi_layanan", "deskripsi", "keterangan", "description"]) || "Deskripsi layanan belum tersedia."}
              </p>

              <div className="mt-6 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700">Harga</span>
                  <span className="font-semibold text-blue-600">{formatCurrency(getTextValue(selectedService, ["harga", "price"]))}</span>
                </div>
                {getTextValue(selectedService, ["tipe_layanan"]) === "durasi" ? (
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-700">Durasi</span>
                    <span>{formatDuration(getTextValue(selectedService, ["durasi_menit", "durasi", "duration"]))}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-slate-700">Tipe Layanan</span>
                    <span className="font-semibold text-emerald-600">Per Tindakan</span>
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700">Transport</span>
                  <span className={isTransportIncluded(selectedService) ? "font-semibold text-emerald-600" : "text-slate-500"}>
                    {isTransportIncluded(selectedService) ? "Include" : "Tidak termasuk"}
                  </span>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/booking"
                  className="inline-flex items-center justify-center rounded-full bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md active:translate-y-0"
                >
                  Booking Sekarang
                </Link>
                <button
                  type="button"
                  onClick={(event) => handleAddToCart(event, selectedService)}
                  className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-600 hover:shadow-md active:translate-y-0 cursor-pointer"
                >
                  Tambah ke Keranjang
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors duration-150 hover:bg-slate-100 cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <LoginRequiredModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        message="Anda perlu login untuk melakukan booking layanan HomeCare."
      />
    </>
  );
}

export default function LayananPage() {
  return (
    <Suspense fallback={null}>
      <LayananPageContent />
    </Suspense>
  );
}
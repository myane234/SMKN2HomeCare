"use client";

import { useEffect, useState, Suspense } from "react";
import { getLayanan } from "@/services/layananService";
import { useRouter, useSearchParams } from "next/navigation";
import LoginRequiredModal from "@/components/LoginRequiredModal";
import { showToast } from "@/components/Toast";
import Link from "next/link";
import { resolveImageUrl } from "@/services/resolveImage";

export const KATEGORI_LAYANAN_OPTIONS = ["Fisioterapi", "Home Care", "Perawatan Luka", "Kesehatan"];

const CART_STORAGE_KEY = "smarthomecare_cart";

function getTextValue(item, keys) {
  for (const key of keys) {
    const value = item?.[key];
    if (value !== undefined && value !== null && value !== "") {
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

function slugify(text) {
  return text?.toLowerCase().replace(/&/g, "dan").replace(/\s+/g, "-").replace(/(^-|-$)/g, "") || "";
}

function isTransportIncluded(service) {
  const value = service?.transport;
  return value === true || value === 1 || value === "1" || value === "true";
}

function extractServices(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  return [];
}

function filterServicesByCategory(services, category) {
  if (!category) return services;

  return services.filter((service) => {
    const serviceCategory = getTextValue(service, ["kategori_layanan", "kategori", "category", "nama_kategori"]);
    return serviceCategory.toLowerCase() === category.toLowerCase();
  });
}

function getServiceId(service) {
  return getTextValue(service, ["id", "id_layanan", "uuid"]) || getTextValue(service, ["nama_layanan", "nama", "title"]);
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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [cart, setCart] = useState([]);
  const [addedServiceId, setAddedServiceId] = useState(null);

  useEffect(() => {
    setIsLoggedIn(document.cookie.includes("is_logged_in=true"));
    setCart(loadCartFromStorage());
  }, []);

  const currentCategory = searchParams.get("kategori") || "";

  useEffect(() => {
    let isMounted = true;

    async function loadServices() {
      try {
        setLoading(true);
        const response = await getLayanan();
        if (!isMounted) return;

        const items = extractServices(response);
        setAllServices(items);

        const uniqueCategories = Array.from(
          new Set(
            items
              .map((item) => getTextValue(item, ["kategori_layanan", "kategori", "category", "nama_kategori"]))
              .filter(Boolean)
          )
        );

        setCategories(uniqueCategories);
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
  }, []);

  useEffect(() => {
    const filtered = filterServicesByCategory(allServices, currentCategory);
    setFilteredServices(filtered);
  }, [allServices, currentCategory]);

  const categoryOptions = categories.length > 0 ? categories : KATEGORI_LAYANAN_OPTIONS;

  const handleCategorySelect = (value) => {
    if (value) {
      router.push(`/layanan?kategori=${encodeURIComponent(value)}`);
    } else {
      router.push("/layanan");
    }
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

    const title = getTextValue(service, ["nama_layanan", "nama", "title"]);
    showToast(`${title} berhasil ditambahkan ke keranjang`, "success");
  };

  const cartItemCount = cart.reduce((total, item) => total + item.qty, 0);

  const handleGoToCart = () => {
    router.push("/keranjang");
  };

  return (
    <>
      <main
        className="mx-auto max-w-7xl px-4 py-8 sm:py-14 md:px-6 overflow-hidden"
        style={{ fontFamily: '"Poppins", "Inter", "Segoe UI", sans-serif' }}
      >
        <div className="mb-12 text-center">
          <span className="inline-flex rounded-full bg-sky-100 px-5 py-2 text-xs font-bold tracking-[0.2em] text-sky-700">
            KATALOG LAYANAN
          </span>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-sky-800 sm:text-5xl" style={{ fontFamily: '"Poppins", "Inter", "Segoe UI", sans-serif' }}>
            Layanan SmartHomeCare
          </h1>
          <p className="mt-3 mx-auto max-w-3xl text-base leading-7 text-slate-600" style={{ fontFamily: '"Poppins", "Inter", "Segoe UI", sans-serif' }}>
            Temukan layanan kesehatan yang sesuai dengan kebutuhan Anda, dengan pendekatan yang lebih personal dan profesional.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/pesan-laynan"
              className="inline-flex items-center justify-center rounded-full bg-sky-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-sky-700 transition"
            >
              Pesan Layanan Langsung →
            </Link>
          </div>
        </div>

        {/* Filter Kategori */}
        <div className="mb-8 rounded-[32px] border border-slate-200 bg-slate-50/80 p-4 shadow-sm sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">Filter Kategori</p>
              <h2 className="mt-2 text-xl font-semibold text-slate-900">Temukan layanan sesuai kebutuhan</h2>
            </div>
            <div className="text-sm text-slate-600">
              {filteredServices.length} layanan tersedia
            </div>
          </div>

          <div className="mt-4 flex w-full flex-wrap items-center gap-2">
            <select
              value={currentCategory}
              onChange={(e) => handleCategorySelect(e.target.value)}
              className="w-full sm:w-auto rounded-xl border-2 border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition-all duration-300 hover:border-sky-400 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
            >
              <option value="">Semua Kategori</option>
              {categoryOptions.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm" style={{ fontFamily: '"Poppins", "Inter", "Segoe UI", sans-serif' }}>
            Memuat data layanan...
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center text-slate-500 shadow-sm" style={{ fontFamily: '"Poppins", "Inter", "Segoe UI", sans-serif' }}>
            {currentCategory
              ? `Tidak ada layanan dengan kategori "${currentCategory}"`
              : "Belum ada data layanan yang tersedia."}
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {filteredServices.map((service, index) => {
              const title = getTextValue(service, ["nama_layanan", "nama", "title"]);
              const description = getTextValue(service, ["deskripsi_layanan", "deskripsi", "keterangan", "description"]);
              const imageUrl = resolveImageUrl(getTextValue(service, ["foto_layanan", "foto", "image"]));
              const category = getTextValue(service, ["kategori_layanan", "kategori", "category", "nama_kategori"]);
              const price = getTextValue(service, ["harga", "price"]);
              const duration = getTextValue(service, ["durasi_menit", "durasi", "duration"]);
              const serviceId = getServiceId(service);
              const justAdded = addedServiceId === serviceId;

              return (
                <article
                  key={`${title}-${index}`}
                  role="article"
                  tabIndex={0}
                  onClick={() => setSelectedService(service)}
                  className="group flex flex-row cursor-pointer gap-4 overflow-hidden rounded-[28px] border border-sky-100 bg-white/90 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                >
                  {/* KONTAINER GAMBAR DI SEBELAH KIRI (DENGAN shrink-0) */}
                  <div className="relative shrink-0 overflow-hidden rounded-2xl bg-slate-100 w-36 sm:w-44 md:w-48 h-auto min-h-[160px]">
                    <img
                      src={imageUrl}
                      alt={title || "Layanan"}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                    
                    {/* Badge Kategori */}
                    <div className="absolute left-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-sky-700 shadow-sm">
                      {category || "Layanan"}
                    </div>

                    {/* Badge Harga */}
                    <div className="absolute bottom-2 left-2 rounded-full bg-sky-600/95 px-2.5 py-0.5 text-[11px] sm:text-xs font-semibold text-white shadow-sm">
                      {formatCurrency(price)}
                    </div>
                  </div>

                  {/* DETAIL TEKS DI SEBELAH KANAN */}
                  <div className="flex min-w-0 grow flex-col justify-between py-1">
                    <div>
                      <h2 className="text-base sm:text-lg font-semibold tracking-tight text-sky-800 line-clamp-2" style={{ fontFamily: '"Poppins", "Inter", "Segoe UI", sans-serif' }}>
                        {title || "Layanan"}
                      </h2>
                      {description ? (
                        <p className="mt-1.5 line-clamp-2 text-xs sm:text-sm leading-relaxed text-slate-600" style={{ fontFamily: '"Poppins", "Inter", "Segoe UI", sans-serif' }}>
                          {description}
                        </p>
                      ) : null}
                    </div>

                    <div className="mt-3 flex flex-col gap-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-medium text-sky-700">
                          {isTransportIncluded(service) ? "Transport Termasuk" : "Transport Tidak Termasuk"}
                        </span>
                        {duration ? (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">
                            {formatDuration(duration)}
                          </span>
                        ) : null}
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            const kategoriSlug = slugify(service.kategori_layanan || service.kategori || service.category || "");
                            const layananSlug = slugify(service.nama_layanan || service.nama || service.title || "");
                            router.push(`/layanan/${kategoriSlug}/${layananSlug}`);
                          }}
                          className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline whitespace-nowrap"
                        >
                          Lihat Detail →
                        </button>
                        <button
                          type="button"
                          onClick={(event) => handleAddToCart(event, service)}
                          aria-label="Tambah ke keranjang"
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-base font-bold text-white shadow-sm transition ${
                            justAdded ? "bg-emerald-600" : "bg-sky-600 hover:bg-sky-700"
                          }`}
                        >
                          {justAdded ? "✓" : "+"}
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>

      {/* Floating cart button */}
      <button
        type="button"
        onClick={handleGoToCart}
        aria-label="Buka keranjang"
        className="fixed bottom-24 right-4 sm:right-6 z-40 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xl transition hover:bg-emerald-600 hover:scale-105"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-7 w-7"
        >
          <circle cx="9" cy="21" r="1" />
          <circle cx="20" cy="21" r="1" />
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
        </svg>
        {cartItemCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full bg-rose-500 px-1 text-xs font-bold text-white">
            {cartItemCount}
          </span>
        ) : null}
      </button>

      {/* Modal Detail Layanan */}
      {selectedService ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6"
          onClick={() => setSelectedService(null)}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedService(null)}
              className="absolute right-4 top-4 z-10 rounded-full bg-white/90 px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm cursor-pointer hover:bg-slate-100"
            >
              Tutup
            </button>

            <div className="relative h-64 w-full">
              <img
                src={resolveImageUrl(getTextValue(selectedService, ["foto_layanan", "foto", "image"]))}
                alt={getTextValue(selectedService, ["nama_layanan", "nama", "title"]) || "Layanan"}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/30 via-emerald-300/10 to-transparent" />
            </div>

            <div className="p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-sky-700" style={{ fontFamily: '"Poppins", "Inter", "Segoe UI", sans-serif' }}>
                  {getTextValue(selectedService, ["kategori_layanan", "kategori", "category", "nama_kategori"]) || "Layanan"}
                </span>
              </div>

              <h2 className="mt-4 text-2xl font-bold text-slate-900" style={{ fontFamily: '"Poppins", "Inter", "Segoe UI", sans-serif' }}>
                {getTextValue(selectedService, ["nama_layanan", "nama", "title"]) || "Layanan"}
              </h2>

              <p className="mt-4 leading-7 text-slate-600" style={{ fontFamily: '"Poppins", "Inter", "Segoe UI", sans-serif' }}>
                {getTextValue(selectedService, ["deskripsi_layanan", "deskripsi", "keterangan", "description"]) || "Deskripsi layanan belum tersedia."}
              </p>

              <div className="mt-6 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-slate-700">Harga</span>
                  <span className="font-semibold text-sky-700">{formatCurrency(getTextValue(selectedService, ["harga", "price"]))}</span>
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
                  className="inline-flex items-center justify-center rounded-full bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700"
                  style={{ fontFamily: '"Poppins", "Inter", "Segoe UI", sans-serif' }}
                >
                  Booking Sekarang
                </Link>
                <button
                  type="button"
                  onClick={(event) => handleAddToCart(event, selectedService)}
                  className="inline-flex items-center justify-center rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-600 cursor-pointer"
                  style={{ fontFamily: '"Poppins", "Inter", "Segoe UI", sans-serif' }}
                >
                  Tambah ke Keranjang
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedService(null)}
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 cursor-pointer"
                  style={{ fontFamily: '"Poppins", "Inter", "Segoe UI", sans-serif' }}
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
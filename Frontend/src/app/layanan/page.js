"use client";

import { useEffect, useState, Suspense } from "react";
import { getLayanan } from "@/services/layananService";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { resolveImageUrl } from "@/services/resolveImage";
import { FiCheckCircle, FiClock, FiTag, FiArrowRight, FiInfo } from "react-icons/fi";

export const KATEGORI_LAYANAN_OPTIONS = ["Fisioterapi", "Home Care", "Perawatan Luka", "Kesehatan"];

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
  if (Number.isNaN(numericValue) || numericValue === 0) {
    return "Hubungi Kami";
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(numericValue);
}

function formatDuration(value) {
  if (!value) return null;
  return `${value} menit`;
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

function LayananPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [allServices, setAllServices] = useState([]);
  const [filteredServices, setFilteredServices] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);

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
    return () => { isMounted = false; };
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

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="inline-flex rounded-full bg-sky-100 px-4 py-1.5 text-xs font-bold tracking-widest text-sky-700 uppercase">
            KATALOG LAYANAN MEDIS
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
            Informasi Layanan SmartHomeCare
          </h1>
          <p className="text-sm sm:text-base text-slate-500 leading-relaxed">
            Daftar lengkap paket layanan kesehatan profesional langsung di rumah Anda. Pilih layanan dan klik untuk pesan sekarang.
          </p>
          <div className="pt-2 flex justify-center">
            <Link
              href="/pesan-laynan"
              className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-sky-700 transition active:scale-95 cursor-pointer"
            >
              Pesan Layanan Sekarang <FiArrowRight />
            </Link>
          </div>
        </div>

        {/* Filter Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="kategori-select" className="text-xs font-semibold text-slate-500">
              Filter Kategori:
            </label>
            <select
              id="kategori-select"
              value={currentCategory}
              onChange={(e) => handleCategorySelect(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-700 focus:border-sky-500 focus:outline-none cursor-pointer"
            >
              <option value="">Semua Kategori</option>
              {categoryOptions.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <span className="text-xs text-slate-500 font-medium">
            Menampilkan <strong className="text-slate-800">{filteredServices.length}</strong> pilihan layanan
          </span>
        </div>

        {/* Services List Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map(n => (
              <div key={n} className="h-64 rounded-2xl bg-slate-200 animate-pulse" />
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-500 space-y-2">
            <FiInfo className="mx-auto text-4xl text-slate-300" />
            <h3 className="text-base font-bold text-slate-800">Layanan Tidak Ditemukan</h3>
            <p className="text-xs text-slate-500">
              {currentCategory ? `Belum ada layanan untuk kategori "${currentCategory}".` : "Belum ada data layanan."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service, index) => {
              const title = getTextValue(service, ["nama_layanan", "nama", "title"]);
              const description = getTextValue(service, ["deskripsi_layanan", "deskripsi", "keterangan", "description"]);
              const imageUrl = resolveImageUrl(getTextValue(service, ["foto_layanan", "gambar", "foto", "image", "foto_layanan_url", "gambar_url", "foto_url", "image_url"]));
              const category = getTextValue(service, ["kategori_layanan", "kategori", "category", "nama_kategori"]);
              const price = getTextValue(service, ["harga", "price"]);
              const duration = getTextValue(service, ["durasi_menit", "durasi", "duration"]);

              return (
                <article
                  key={`${title}-${index}`}
                  className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between"
                >
                  <div>
                    {/* Thumbnail Image */}
                    <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                      <img
                        src={imageUrl}
                        alt={title || "Layanan"}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "/images/layanan/pijat-bayi.png";
                        }}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-md text-[11px] font-bold text-sky-700 uppercase tracking-wider shadow-2xs">
                        {category || "Layanan Medis"}
                      </span>
                      <div className="absolute bottom-3 right-3 bg-sky-600 text-white px-3 py-1 rounded-lg text-xs font-bold shadow-md">
                        {formatCurrency(price)}
                      </div>
                    </div>

                    {/* Details Body */}
                    <div className="p-5 space-y-3">
                      <h2 className="text-base font-bold text-slate-900 group-hover:text-sky-600 transition line-clamp-1">
                        {title || "Layanan HomeCare"}
                      </h2>

                      {description && (
                        <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                          {description}
                        </p>
                      )}

                      {/* Specs Badges */}
                      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                        {duration && (
                          <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium">
                            <FiClock size={12} /> {formatDuration(duration)}
                          </span>
                        )}
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium ${
                          isTransportIncluded(service) ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"
                        }`}>
                          <FiCheckCircle size={12} /> {isTransportIncluded(service) ? "Transport Termasuk" : "Transport Terpisah"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Actions: Full Info & Redirect to /pesan-laynan */}
                  <div className="p-5 pt-0 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 mt-3">
                    <button
                      type="button"
                      onClick={() => setSelectedService(service)}
                      className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline cursor-pointer"
                    >
                      Detail Info
                    </button>

                    <Link
                      href="/pesan-laynan"
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-xs transition active:scale-95"
                    >
                      Pesan Layanan <FiArrowRight size={13} />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Modal Detail Info Layanan */}
        {selectedService && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4"
            onClick={() => setSelectedService(null)}
          >
            <div
              className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-2.5 py-1 rounded-md">
                  {getTextValue(selectedService, ["kategori_layanan", "kategori", "category", "nama_kategori"]) || "Layanan"}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedService(null)}
                  className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <div className="h-52 w-full rounded-2xl overflow-hidden bg-slate-100">
                <img
                  src={resolveImageUrl(getTextValue(selectedService, ["foto_layanan", "foto", "image"]))}
                  alt={getTextValue(selectedService, ["nama_layanan", "nama", "title"]) || "Layanan"}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "/images/layanan/pijat-bayi.png";
                  }}
                  className="h-full w-full object-cover"
                />
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {getTextValue(selectedService, ["nama_layanan", "nama", "title"]) || "Layanan"}
                </h2>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed">
                  {getTextValue(selectedService, ["deskripsi_layanan", "deskripsi", "keterangan", "description"]) || "Deskripsi lengkap layanan kesehatan."}
                </p>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Estimasi Biaya:</span>
                  <span className="font-bold text-sky-700 text-sm">
                    {formatCurrency(getTextValue(selectedService, ["harga", "price"]))}
                  </span>
                </div>
                {getTextValue(selectedService, ["durasi_menit", "durasi", "duration"]) && (
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Durasi Pelayanan:</span>
                    <span className="font-semibold text-slate-700">
                      {formatDuration(getTextValue(selectedService, ["durasi_menit", "durasi", "duration"]))}
                    </span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Biaya Transportasi Nakes:</span>
                  <span className={isTransportIncluded(selectedService) ? "font-bold text-emerald-600" : "text-slate-600"}>
                    {isTransportIncluded(selectedService) ? "Sudah Termasuk" : "Tidak Termasuk"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedService(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 border border-slate-200 hover:bg-slate-50 cursor-pointer"
                >
                  Tutup
                </button>
                <Link
                  href="/pesan-laynan"
                  className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-md transition active:scale-95"
                >
                  Pesan Layanan Ini <FiArrowRight />
                </Link>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default function LayananPage() {
  return (
    <Suspense fallback={null}>
      <LayananPageContent />
    </Suspense>
  );
}
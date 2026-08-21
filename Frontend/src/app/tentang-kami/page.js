"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import api from "@/services/api";
import { resolveImageUrl } from "@/services/resolveImage";

// Koordinat titik referensi (lat, lng) tiap provinsi — key = nama_provinsi uppercase.
const PROVINCE_COORDS = {
  ACEH: [4.695135, 96.749397],
  "SUMATERA UTARA": [2.1153547, 99.5450974],
  "SUMATERA BARAT": [-0.7399397, 100.8000051],
  RIAU: [0.2933469, 101.7068294],
  JAMBI: [-1.6101946, 103.6131203],
  "SUMATERA SELATAN": [-3.3194374, 103.914399],
  BENGKULU: [-3.5778471, 102.3463875],
  LAMPUNG: [-4.5585849, 105.4068079],
  "KEPULAUAN BANGKA BELITUNG": [-2.7410513, 106.4405872],
  "KEPULAUAN RIAU": [3.9456514, 108.1428669],
  "DKI JAKARTA": [-6.211544, 106.845172],
  "JAWA BARAT": [-6.914744, 107.60981],
  "JAWA TENGAH": [-7.150975, 110.1402594],
  "DI YOGYAKARTA": [-7.79558, 110.36949],
  "JAWA TIMUR": [-7.5360639, 112.2384017],
  BANTEN: [-6.4058172, 106.0640179],
  BALI: [-8.4095178, 115.188916],
  "NUSA TENGGARA BARAT": [-8.652933, 117.3616476],
  "NUSA TENGGARA TIMUR": [-8.657382, 121.0793705],
  "KALIMANTAN BARAT": [0.0, 111.0],
  "KALIMANTAN TENGAH": [-1.6814878, 113.3823545],
  "KALIMANTAN SELATAN": [-3.0926415, 115.2837585],
  "KALIMANTAN TIMUR": [0.5386924, 116.419389],
  "KALIMANTAN UTARA": [3.0730987, 116.0413889],
  "SULAWESI UTARA": [0.6246932, 123.9750018],
  "SULAWESI TENGAH": [-1.4300254, 121.4456589],
  "SULAWESI SELATAN": [-3.6687994, 119.9740534],
  "SULAWESI TENGGARA": [-4.14491, 122.174605],
  GORONTALO: [0.6999372, 122.4467238],
  "SULAWESI BARAT": [-2.8441371, 119.2320784],
  MALUKU: [-3.2384616, 130.1452734],
  "MALUKU UTARA": [1.5709993, 127.8087693],
  "PAPUA BARAT": [-1.3361154, 133.1747162],
  PAPUA: [-4.269928, 138.0803529],
};

export default function TentangKami() {
  const [content, setContent] = useState(null);

  useEffect(() => {
    async function fetchAbout() {
      try {
        const res = await api.get("/api/resource/content/about", {
          validateStatus: (status) => status < 500,
        });
        if (res.status === 200 && res.data) {
          setContent(res.data);
        }
      } catch (err) {
        // Fallback ke default content jika request gagal
      }
    }
    fetchAbout();
  }, []);

  const heroImage = content?.about_banner ? resolveImageUrl(content.about_banner) : "/images/tentang-kami/HeroTentangKami.jpeg";
  const heroTextBanner = content?.about_text_banner || "SmartHomeCare";
  const descText = content?.about_description_text || "SmartHomeCare menghadirkan layanan kesehatan profesional langsung ke rumah dengan proses pemesanan yang mudah, aman, dan terpercaya sehingga pasien dapat memperoleh pelayanan terbaik tanpa harus meninggalkan kenyamanan rumah.";
  const descImage = content?.about_description_image ? resolveImageUrl(content.about_description_image) : "/images/tentang-kami/kenapaSmartHomeCare.jpeg";

  return (
    <>
      {/* Hero */}
      <section className="relative h-[280px] sm:h-[400px] lg:h-[500px] overflow-hidden">
        <Image
          src={heroImage}
          alt="Tentang SmartHomeCare"
          fill
          priority
          className="object-cover"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/45" />

        {/* Content */}
        <div className="relative flex h-full items-center justify-center px-4 sm:px-6">
          <div className="max-w-4xl text-center text-white">
            <p className="mb-2 text-xs sm:text-sm font-semibold uppercase tracking-[0.3em] text-sky-200">
              Tentang Kami
            </p>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold leading-tight">
              {heroTextBanner}
            </h1>

            <p className="mx-auto mt-4 sm:mt-6 max-w-3xl text-xs sm:text-base lg:text-lg leading-6 sm:leading-8 text-gray-100">
              {descText}
            </p>
          </div>
        </div>
      </section>

      {/* Cerita */}
      <section className="bg-white py-14 sm:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-8 lg:gap-16 px-6 lg:grid-cols-2">
          <div>
            <p className="font-semibold uppercase tracking-[0.2em] text-sky-600 text-xs sm:text-sm">
              Tentang SmartHomeCare
            </p>

            <h2 className="mt-2 sm:mt-4 text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 leading-tight">
              Membawa Pelayanan Kesehatan Lebih Dekat
            </h2>

            <p className="mt-4 sm:mt-8 text-sm sm:text-base leading-7 sm:leading-8 text-gray-600">
              {descText}
            </p>
          </div>

          <div className="w-full h-auto">
            <Image
              src={descImage}
              alt="Pelayanan SmartHomeCare"
              width={600}
              height={500}
              className="rounded-3xl object-cover shadow-lg w-full h-auto"
            />
          </div>
        </div>
      </section>

      {/* Visi & Misi */}
      <section className="border-y bg-white border-gray-200 py-14 sm:py-20">
        <div className="mx-auto max-w-5xl px-6">
          <p className="text-xl sm:text-2xl font-bold text-center uppercase tracking-[0.2em] text-sky-600">
            Visi & Misi
          </p>

          <div className="mt-8 sm:mt-10 space-y-8 sm:space-y-10">
            {content?.visi_misi ? (
              <div>
                <p className="mt-2 sm:mt-4 text-sm sm:text-base leading-7 sm:leading-8 text-gray-600 whitespace-pre-line">
                  {content.visi_misi}
                </p>
              </div>
            ) : (
              <>
                <div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800">Visi</h3>

                  <p className="mt-2 sm:mt-4 text-sm sm:text-base leading-7 sm:leading-8 text-gray-600">
                    Menjadi platform layanan homecare terpercaya di Indonesia
                    yang menghadirkan pelayanan kesehatan profesional secara
                    mudah, aman, dan berorientasi pada kebutuhan setiap pasien.
                  </p>
                </div>

                <div className="border-t border-gray-200 pt-8 sm:pt-10">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-800">Misi</h3>

                  <p className="mt-2 sm:mt-4 text-sm sm:text-base leading-7 sm:leading-8 text-gray-600">
                    Kami berkomitmen menghadirkan layanan kesehatan yang mudah
                    diakses melalui tenaga kesehatan profesional yang telah
                    terverifikasi, memanfaatkan teknologi untuk mempermudah
                    proses pelayanan, serta terus menjaga kualitas layanan agar
                    setiap pasien memperoleh pengalaman yang aman, nyaman,
                    dan terpercaya.
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Cara Kerja */}
      <section className="bg-slate-50 py-16 sm:py-28">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-10 sm:mb-16 text-center">
            <h2 className="text-xl sm:text-2xl font-bold uppercase tracking-[0.2em]  text-sky-700">
              Cara Kerja
            </h2>

            <p className="mx-auto mt-3 sm:mt-5 max-w-2xl text-sm sm:text-base lg:text-lg leading-7 sm:leading-8 text-gray-600 whitespace-pre-line">
              {content?.cara_kerja || "Hanya dengan beberapa langkah sederhana, layanan kesehatan dapat hadir langsung ke rumah Anda."}
            </p>
          </div>

          <div className="grid gap-8 sm:gap-12 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                no: "01",
                title: "Pilih Layanan",
                desc: "Pilih layanan homecare sesuai kebutuhan pasien.",
              },
              {
                no: "02",
                title: "Isi Data",
                desc: "Masukkan alamat serta jadwal kunjungan.",
              },
              {
                no: "03",
                title: "Proses Pencarian",
                desc: "Sistem akan mencarikan tenaga kesehatan yang tersedia.",
              },
              {
                no: "04",
                title: "Pelayanan",
                desc: "Tenaga kesehatan datang ke lokasi sesuai jadwal.",
              },
            ].map((step) => (
              <div key={step.no} className="flex flex-col items-center text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-sky-600 text-2xl font-bold text-white shadow-md">
                  {step.no}
                </div>

                <h3 className="mt-6 text-xl font-semibold text-gray-800">{step.title}</h3>

                <p className="mt-3 max-w-[220px] leading-7 text-gray-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mengapa Memilih */}
      <section className="bg-white py-14 sm:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-8 lg:gap-15 px-6 lg:grid-cols-2">
          <div className="w-full h-auto">
            <Image
              src={descImage}
              alt="Mengapa Memilih SmartHomeCare"
              width={600}
              height={600}
              className="rounded-3xl object-cover w-full h-auto shadow-lg"
            />
          </div>

          <div>
            <h2 className="mt-5 text-xl sm:text-2xl font-bold uppercase tracking-[0.2em] text-sky-700 leading-tight">
              Mengapa Memilih SmartHomeCare
            </h2>

            <div className="mt-6 sm:mt-10 space-y-6 sm:space-y-8">
              <div>
                <h3 className="font-bold text-lg sm:text-xl text-gray-800">
                  Tenaga Kesehatan Profesional
                </h3>

                <p className="mt-2 text-sm sm:text-base leading-6 sm:leading-7 text-gray-600">
                  Seluruh layanan dilakukan oleh tenaga kesehatan yang telah melalui proses verifikasi.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-lg sm:text-xl text-gray-800">Mudah &amp; Praktis</h3>

                <p className="mt-2 text-sm sm:text-base leading-6 sm:leading-7 text-gray-600">
                  Pemesanan layanan dapat dilakukan secara online dengan proses yang sederhana.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-lg sm:text-xl text-gray-800">Aman &amp; Terpercaya</h3>

                <p className="mt-2 text-sm sm:text-base leading-6 sm:leading-7 text-gray-600">
                  Kami mengutamakan keamanan, kenyamanan, dan kualitas pelayanan bagi setiap pasien.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Wilayah Layanan Map — sekarang inline di file yang sama */}
      <WilayahLayananMapSection />

      {/* Komitmen */}
      <section className="bg-[#F4FAFF] py-14 sm:py-24">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <p className="text-xl sm:text-2xl font-bold uppercase tracking-[0.2em] text-sky-600">
            Komitmen Kami
          </p>

          <h2 className="mt-4 sm:mt-6 text-lg sm:text-xl font-semibold text-gray-700 leading-tight">
            Memberikan Pelayanan Terbaik untuk Setiap Pasien
          </h2>

          <p className="mx-auto mt-6 sm:mt-8 max-w-3xl text-sm sm:text-base leading-7 sm:leading-8 text-gray-600 whitespace-pre-line">
            {content?.komitmen || "SmartHomeCare berkomitmen menghadirkan pelayanan kesehatan yang profesional, aman, dan berorientasi pada kebutuhan pasien. Melalui tenaga kesehatan yang telah terverifikasi serta sistem pelayanan yang mudah digunakan, kami terus berupaya memberikan pengalaman layanan homecare yang berkualitas bagi setiap keluarga."}
          </p>
        </div>
      </section>
    </>
  );
}

// ─── Wilayah Layanan Map (inline, client-only lewat dynamic import() di useEffect) ──
function WilayahLayananMapSection() {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});

  const ALL_PROVINCES = Object.keys(PROVINCE_COORDS);
  const [activeProvinces, setActiveProvinces] = useState(ALL_PROVINCES);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredProvince, setHoveredProvince] = useState(null);
  const [mapReady, setMapReady] = useState(false);

  // ── Ambil data wilayah layanan yang aktif ───────────────────────────────────
  useEffect(() => {
    fetch("/api/wilayah-layanan", {
      headers: { Accept: "application/json" },
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.success && Array.isArray(json.data) && json.data.length > 0) {
          const activeNames = json.data
            .filter((p) => p.is_active)
            .map((p) => p.nama_provinsi.toUpperCase());
          if (activeNames.length > 0) {
            setActiveProvinces(activeNames);
          }
        }
      })
      .catch(() => {
        // Fallback default back to ALL_PROVINCES if API is unavailable
      })
      .finally(() => setLoading(false));
  }, []);

  // ── Inisialisasi peta Leaflet — jamin mapContainerRef selalu ada di DOM ─────
  useEffect(() => {
    let cancelled = false;

    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;

      const [{ default: L }] = await Promise.all([import("leaflet")]);

      if (cancelled || mapInstanceRef.current) return;

      // Hapus kelas leaflet internal jika sebelumnya re-render
      const container = mapContainerRef.current;
      if (container._leaflet_id) {
        container._leaflet_id = null;
      }

      const map = L.map(container, {
        center: [-2.5, 118.0],
        zoom: 5,
        minZoom: 4,
        maxZoom: 10,
        scrollWheelZoom: false,
        zoomControl: true,
      });

      // Carto Voyager Tiles - tampilan pulau & laut jernih seperti inspirasi SS
      const voyagerUrl =
        "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";
      const osmUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

      const tileLayer = L.tileLayer(voyagerUrl, {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/">CARTO</a>',
        maxZoom: 19,
        subdomains: "abcd",
      }).addTo(map);

      // Fallback ke OSM jika Carto gagal
      tileLayer.on("tileerror", () => {
        tileLayer.setUrl(osmUrl);
      });

      mapInstanceRef.current = map;
      setMapReady(true);

      // Paksa map menghitung ukuran kontainer secara presisi agar tidak terjadi area putih
      const resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(container);

      const timers = [
        setTimeout(() => map.invalidateSize(), 100),
        setTimeout(() => map.invalidateSize(), 500),
        setTimeout(() => map.invalidateSize(), 1000),
      ];

      return () => {
        resizeObserver.disconnect();
        timers.forEach(clearTimeout);
        map.remove();
        mapInstanceRef.current = null;
      };
    }

    initMap();

    return () => {
      cancelled = true;
    };
  }, []);

  // ── Render marker tiap kali data / hover state berubah ──────────────────────
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;

    let cancelled = false;

    async function renderMarkers() {
      const { default: L } = await import("leaflet");
      if (cancelled || !mapInstanceRef.current) return;

      const map = mapInstanceRef.current;

      // Clear existing markers
      Object.values(markersRef.current).forEach((m) => m.remove());
      markersRef.current = {};

      activeProvinces.forEach((name) => {
        const coord = PROVINCE_COORDS[name];
        if (!coord) return;

        const isHovered = hoveredProvince === name;
        const formattedName =
          name.charAt(0) + name.slice(1).toLowerCase();

        // High quality glowing circle marker
        const marker = L.circleMarker(coord, {
          radius: isHovered ? 10 : 7,
          weight: isHovered ? 3 : 2,
          color: isHovered ? "#0284c7" : "#0ea5e9",
          fillColor: isHovered ? "#38bdf8" : "#0284c7",
          fillOpacity: isHovered ? 1 : 0.85,
        })
          .addTo(map)
          .bindTooltip(
            `<div class="font-sans text-center">
              <span class="font-bold text-xs block text-slate-800">${formattedName}</span>
              <span class="text-[10px] text-sky-600 font-semibold">● Layanan Aktif</span>
             </div>`,
            {
              direction: "top",
              offset: [0, -10],
              className: "wilayah-tooltip-custom",
              opacity: 1,
            }
          )
          .on("mouseover", () => setHoveredProvince(name))
          .on("mouseout", () => setHoveredProvince(null))
          .on("click", () => {
            map.flyTo(coord, 7, { duration: 1 });
          });

        markersRef.current[name] = marker;
      });
    }

    renderMarkers();

    return () => {
      cancelled = true;
    };
  }, [activeProvinces, hoveredProvince, mapReady]);

  const filteredActive = activeProvinces.filter((p) =>
    p.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const flyToProvince = (name) => {
    const coord = PROVINCE_COORDS[name];
    if (coord && mapInstanceRef.current) {
      setHoveredProvince(name);
      mapInstanceRef.current.flyTo(coord, 7, { duration: 1 });
    }
  };

  const resetMapView = () => {
    if (mapInstanceRef.current) {
      setHoveredProvince(null);
      mapInstanceRef.current.flyTo([-2.5, 118.0], 5, { duration: 1 });
    }
  };

  return (
    <section className="bg-slate-50 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        {/* Section Header */}
        <div className="mb-10 sm:mb-14 text-center">
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">
            Jangkauan Kami
          </p>
          <h2 className="mt-2 sm:mt-4 text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-800 leading-tight">
            Wilayah Layanan SmartHomeCare
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm sm:text-base leading-7 text-gray-600">
            Kami hadir di{" "}
            <span className="font-bold text-sky-600">{activeProvinces.length} provinsi</span>{" "}
            di seluruh Indonesia. Klik atau arahkan kursor ke titik pada peta untuk
            mengetahui lokasi layanan.
          </p>
        </div>

        <div className="flex flex-col xl:flex-row gap-8 items-start">
          {/* ── Map Box ── */}
          <div className="relative w-full xl:flex-1 min-h-[420px]">
            <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-3 shadow-lg">
              {/* Map Canvas (Selalu dirender di DOM agar Leaflet tidak null) */}
              <div
                ref={mapContainerRef}
                className="h-[420px] w-full rounded-2xl sm:h-[480px] z-0 bg-sky-50/50"
              />

              {/* Top Controls Overlay */}
              <div className="absolute top-6 right-6 z-[400] flex gap-2">
                <button
                  type="button"
                  onClick={resetMapView}
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 shadow-md hover:bg-slate-50 transition-all"
                  title="Kembali ke tampilan awal Indonesia"
                >
                  <svg
                    className="h-3.5 w-3.5 text-sky-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                  Reset Peta
                </button>
              </div>

              {/* Loading indicator overlay jika data API masih loading */}
              {loading && (
                <div className="absolute inset-3 z-[400] flex items-center justify-center rounded-2xl bg-white/70 backdrop-blur-xs">
                  <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-2.5 shadow-md border border-gray-100">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
                    <span className="text-xs font-medium text-gray-600">
                      Memuat wilayah peta...
                    </span>
                  </div>
                </div>
              )}

              {/* Legend Footer */}
              <div className="mt-3 flex items-center justify-between px-3 py-1 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-sky-500"></span>
                  </span>
                  <span className="font-medium text-gray-700">Wilayah Aktif</span>
                </div>
                <span className="text-[11px] text-gray-400 hidden sm:inline">
                  Gunakan scroll / tombol + - untuk perbesar peta
                </span>
              </div>
            </div>
          </div>

          {/* ── Province List Panel ── */}
          <div className="w-full xl:w-80 shrink-0">
            <div className="rounded-3xl border border-gray-200 bg-white p-5 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-widest text-sky-600">
                  Daftar Provinsi Aktif
                </p>
                <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-semibold text-sky-700">
                  {activeProvinces.length} Provinsi
                </span>
              </div>

              {/* Search */}
              <div className="mb-4 flex items-center gap-2 rounded-xl border border-gray-200 bg-slate-50 px-3 py-2 focus-within:border-sky-500 focus-within:ring-1 focus-within:ring-sky-500 transition-all">
                <svg
                  className="h-4 w-4 shrink-0 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Cari provinsi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs text-gray-700 outline-none placeholder:text-gray-400"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="text-gray-400 hover:text-gray-600 text-xs font-bold"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Province List */}
              <div className="max-h-[380px] space-y-1 overflow-y-auto pr-1">
                {filteredActive.length === 0 ? (
                  <p className="py-6 text-center text-xs text-gray-400">
                    Provinsi &quot;{searchQuery}&quot; tidak ditemukan.
                  </p>
                ) : (
                  filteredActive.map((name, i) => (
                    <button
                      key={name}
                      type="button"
                      onMouseEnter={() => setHoveredProvince(name)}
                      onMouseLeave={() => setHoveredProvince(null)}
                      onClick={() => flyToProvince(name)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-xs transition-all duration-150 ${
                        hoveredProvince === name
                          ? "bg-sky-500 text-white font-medium shadow-sm translate-x-1"
                          : "text-gray-700 hover:bg-slate-100 hover:text-gray-900"
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold ${
                          hoveredProvince === name
                            ? "bg-white text-sky-600"
                            : "bg-sky-100 text-sky-700"
                        }`}
                      >
                        {i + 1}
                      </span>
                      <span className="truncate leading-tight flex-1">
                        {name.charAt(0) + name.slice(1).toLowerCase()}
                      </span>
                      <svg
                        className={`h-3.5 w-3.5 transition-transform ${
                          hoveredProvince === name
                            ? "text-white translate-x-0.5"
                            : "text-gray-300"
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  ))
                )}
              </div>

              <div className="mt-4 border-t border-gray-100 pt-3 text-center">
                <p className="text-[11px] text-gray-400">
                  Menampilkan{" "}
                  <span className="font-semibold text-sky-600">
                    {filteredActive.length}
                  </span>{" "}
                  dari{" "}
                  <span className="font-semibold text-sky-600">
                    {activeProvinces.length}
                  </span>{" "}
                  provinsi aktif
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:flex md:justify-center md:gap-12">
          {[
            { label: "Provinsi Aktif", value: activeProvinces.length },
            { label: "Pulau Besar", value: "5+" },
            { label: "Cakupan Layanan", value: "Seluruh Indonesia" },
          ].map((stat) => (
            <div key={stat.label} className="text-center bg-white border border-gray-100 rounded-2xl p-4 shadow-xs min-w-[150px]">
              <p className="text-2xl sm:text-3xl font-extrabold text-sky-600">{stat.value}</p>
              <p className="mt-1 text-xs font-medium text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <style jsx global>{`
        .wilayah-tooltip-custom {
          background: #ffffff !important;
          color: #1e293b !important;
          border: 1px solid #e2e8f0 !important;
          padding: 6px 12px !important;
          border-radius: 10px !important;
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1) !important;
        }
        .wilayah-tooltip-custom::before {
          border-top-color: #ffffff !important;
        }
        .leaflet-container {
          font-family: inherit;
          border-radius: 1rem;
        }
      `}</style>
    </section>
  );
}
"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

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
  return (
    <>
      {/* Hero */}
      <section className="relative h-[280px] sm:h-[400px] lg:h-[500px] overflow-hidden">
        <Image
          src="/images/tentang-kami/HeroTentangKami.jpeg"
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
              SmartHomeCare
            </h1>

            <p className="mx-auto mt-4 sm:mt-6 max-w-3xl text-xs sm:text-base lg:text-lg leading-6 sm:leading-8 text-gray-100">
              SmartHomeCare menghadirkan layanan kesehatan profesional
              langsung ke rumah dengan proses pemesanan yang mudah,
              aman, dan terpercaya sehingga pasien dapat memperoleh
              pelayanan terbaik tanpa harus meninggalkan kenyamanan rumah.
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
              SmartHomeCare hadir untuk membantu masyarakat memperoleh
              layanan kesehatan profesional tanpa harus datang ke rumah
              sakit atau klinik. Kami memahami bahwa setiap pasien memiliki
              kondisi dan kebutuhan yang berbeda, sehingga pelayanan yang
              nyaman di rumah menjadi solusi yang lebih efektif bagi banyak orang.
            </p>

            <p className="mt-4 sm:mt-5 text-sm sm:text-base leading-7 sm:leading-8 text-gray-600">
              Melalui tenaga kesehatan yang telah terverifikasi, SmartHomeCare
              berkomitmen memberikan pelayanan yang aman, profesional, dan
              berkualitas agar setiap pasien dapat memperoleh perawatan yang
              sesuai dengan kebutuhannya.
            </p>
          </div>

          <div className="w-full h-auto">
            <Image
              src="/images/tentang-kami/kenapaSmartHomeCare.jpeg"
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

            <p className="mx-auto mt-3 sm:mt-5 max-w-2xl text-sm sm:text-base lg:text-lg leading-7 sm:leading-8 text-gray-600">
              Hanya dengan beberapa langkah sederhana, layanan kesehatan
              dapat hadir langsung ke rumah Anda.
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
              src="/images/tentang-kami/TentangHomeCare.jpeg"
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

          <p className="mx-auto mt-6 sm:mt-8 max-w-3xl text-sm sm:text-base leading-7 sm:leading-8 text-gray-600">
            SmartHomeCare berkomitmen menghadirkan pelayanan kesehatan yang
            profesional, aman, dan berorientasi pada kebutuhan pasien.
            Melalui tenaga kesehatan yang telah terverifikasi serta sistem
            pelayanan yang mudah digunakan, kami terus berupaya memberikan
            pengalaman layanan homecare yang berkualitas bagi setiap keluarga.
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
  const markersRef = useRef([]);

  const [activeProvinces, setActiveProvinces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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
        if (json.success && Array.isArray(json.data)) {
          setActiveProvinces(
            json.data
              .filter((p) => p.is_active)
              .map((p) => p.nama_provinsi.toUpperCase())
          );
        } else {
          setError("Gagal memuat data wilayah layanan.");
        }
      })
      .catch(() => setError("Gagal memuat data wilayah layanan."))
      .finally(() => setLoading(false));
  }, []);

  // ── Inisialisasi peta Leaflet — pakai import() dinamis, dijamin client-only
  //    karena useEffect tidak pernah jalan di server (jadi aman dari SSR).
  useEffect(() => {
    let cancelled = false;
    let mapCleanup = null;

    async function initMap() {
      if (!mapContainerRef.current) return;

      const [{ default: L }] = await Promise.all([
        import("leaflet"),
        import("leaflet/dist/leaflet.css"),
      ]);

      if (cancelled || mapInstanceRef.current) return;

      const map = L.map(mapContainerRef.current, {
        center: [-2.3, 118],
        zoom: 4.5,
        minZoom: 4,
        maxZoom: 8,
        scrollWheelZoom: false,
        zoomControl: true,
      });

      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        {
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          maxZoom: 19,
        }
      ).addTo(map);

      mapInstanceRef.current = map;
      setMapReady(true);

      const invalidateTimer = setTimeout(() => {
        map.invalidateSize();
      }, 150);

      mapCleanup = () => {
        clearTimeout(invalidateTimer);
        map.remove();
        mapInstanceRef.current = null;
      };
    }

    initMap();

    return () => {
      cancelled = true;
      if (mapCleanup) mapCleanup();
    };
  }, []);

  // ── Render marker tiap kali data / hover state berubah ──────────────────────
  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;

    let cancelled = false;

    async function renderMarkers() {
      const { default: L } = await import("leaflet");
      if (cancelled) return;

      const map = mapInstanceRef.current;
      if (!map) return;

      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];

      activeProvinces.forEach((name) => {
        const coord = PROVINCE_COORDS[name];
        if (!coord) return;

        const isHovered = hoveredProvince === name;
        const label = name.charAt(0) + name.slice(1).toLowerCase();

        const marker = L.circleMarker(coord, {
          radius: isHovered ? 9 : 6,
          weight: 2,
          color: "#0284c7",
          fillColor: isHovered ? "#38bdf8" : "#0ea5e9",
          fillOpacity: 0.9,
        })
          .addTo(map)
          .bindTooltip(label, {
            direction: "top",
            offset: [0, -8],
            className: "wilayah-tooltip",
          })
          .on("mouseover", () => setHoveredProvince(name))
          .on("mouseout", () => setHoveredProvince(null));

        markersRef.current.push(marker);
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
      mapInstanceRef.current.flyTo(coord, 6.5, { duration: 0.8 });
    }
  };

  return (
    <section className="bg-slate-50 py-16 sm:py-28">
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
            di seluruh Indonesia. Arahkan kursor ke titik pada peta untuk
            mengetahui lebih lanjut.
          </p>
        </div>

        <div className="flex flex-col xl:flex-row gap-8 items-start">
          {/* ── Map ── */}
          <div className="relative w-full xl:flex-1 min-h-[300px]">
            {loading ? (
              <div className="flex h-72 items-center justify-center rounded-3xl border border-gray-200 bg-white shadow-lg">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-sky-500 border-t-transparent" />
              </div>
            ) : error ? (
              <div className="flex h-72 items-center justify-center rounded-3xl border border-gray-200 bg-white text-sm text-red-500 shadow-lg">
                {error}
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white p-3 shadow-lg">
                <div
                  ref={mapContainerRef}
                  className="h-[420px] w-full rounded-2xl sm:h-[480px]"
                />

                {/* Legend */}
                <div className="mt-3 flex items-center justify-center gap-6 py-1 text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-sky-500" />
                    <span>Wilayah Aktif</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Province List Panel ── */}
          <div className="w-full xl:w-72 shrink-0">
            <div className="h-full rounded-3xl border border-gray-200 bg-white p-5 shadow-lg">
              <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-sky-600">
                Daftar Provinsi Aktif
              </p>

              {/* Search */}
              <div className="mb-4 flex items-center gap-2 rounded-lg border border-gray-200 bg-slate-50 px-3 py-2">
                <svg
                  className="h-3.5 w-3.5 shrink-0 text-gray-400"
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
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-500 border-t-transparent" />
                </div>
              ) : (
                <div className="max-h-[380px] space-y-1 overflow-y-auto pr-1">
                  {filteredActive.length === 0 ? (
                    <p className="py-4 text-center text-xs text-gray-400">
                      Provinsi tidak ditemukan.
                    </p>
                  ) : (
                    filteredActive.map((name, i) => (
                      <button
                        key={name}
                        type="button"
                        onMouseEnter={() => setHoveredProvince(name)}
                        onMouseLeave={() => setHoveredProvince(null)}
                        onClick={() => flyToProvince(name)}
                        className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-xs transition-all duration-150 ${
                          hoveredProvince === name
                            ? "bg-sky-50 text-sky-700"
                            : "text-gray-600 hover:bg-slate-50 hover:text-gray-900"
                        }`}
                      >
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-sky-100 text-[10px] font-bold text-sky-600">
                          {i + 1}
                        </span>
                        <span className="truncate leading-tight">
                          {name.charAt(0) + name.slice(1).toLowerCase()}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}

              {!loading && !error && (
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
              )}
            </div>
          </div>
        </div>

        {/* Stats bar */}
        {!loading && !error && (
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:flex md:justify-center md:gap-8">
            {[
              { label: "Provinsi Aktif", value: activeProvinces.length },
              { label: "Pulau Besar", value: "5+" },
              { label: "Cakupan", value: "Seluruh Indonesia" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl sm:text-3xl font-bold text-sky-600">{stat.value}</p>
                <p className="mt-1 text-xs text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <style jsx global>{`
        .wilayah-tooltip {
          background: #0ea5e9 !important;
          color: white !important;
          border: none !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          padding: 4px 8px !important;
          border-radius: 6px !important;
          box-shadow: 0 2px 8px rgba(14, 165, 233, 0.35) !important;
        }
        .wilayah-tooltip::before {
          border-top-color: #0ea5e9 !important;
        }
        .leaflet-container {
          font-family: inherit;
        }
      `}</style>
    </section>
  );
}
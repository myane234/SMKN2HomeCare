"use client";

import Image from "next/image";
import Link from "next/link";
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

const REGIONS = [
  { id: "ALL", label: "Semua Wilayah", center: [-2.5, 118.0], zoom: 5 },
  {
    id: "JAWA",
    label: "Pulau Jawa",
    center: [-6.9, 109.5],
    zoom: 7,
    provinces: ["JAWA BARAT", "JAWA TENGAH", "JAWA TIMUR", "DKI JAKARTA", "DI YOGYAKARTA", "BANTEN"],
  },
  {
    id: "SUMATERA",
    label: "Sumatera",
    center: [0.5, 101.5],
    zoom: 6,
    provinces: [
      "ACEH",
      "SUMATERA UTARA",
      "SUMATERA BARAT",
      "RIAU",
      "JAMBI",
      "SUMATERA SELATAN",
      "BENGKULU",
      "LAMPUNG",
      "KEPULAUAN BANGKA BELITUNG",
      "KEPULAUAN RIAU",
    ],
  },
  {
    id: "KALIMANTAN",
    label: "Kalimantan",
    center: [-1.0, 114.0],
    zoom: 6,
    provinces: ["KALIMANTAN BARAT", "KALIMANTAN TENGAH", "KALIMANTAN SELATAN", "KALIMANTAN TIMUR", "KALIMANTAN UTARA"],
  },
  {
    id: "SULAWESI",
    label: "Sulawesi",
    center: [-2.0, 121.0],
    zoom: 6,
    provinces: ["SULAWESI UTARA", "SULAWESI TENGAH", "SULAWESI SELATAN", "SULAWESI TENGGARA", "GORONTALO", "SULAWESI BARAT"],
  },
  {
    id: "BALI_NUSA",
    label: "Bali & Nusa Tenggara",
    center: [-8.5, 118.0],
    zoom: 7,
    provinces: ["BALI", "NUSA TENGGARA BARAT", "NUSA TENGGARA TIMUR"],
  },
  {
    id: "MALUKU_PAPUA",
    label: "Maluku & Papua",
    center: [-3.5, 133.0],
    zoom: 6,
    provinces: ["MALUKU", "MALUKU UTARA", "PAPUA BARAT", "PAPUA"],
  },
];

function normalizeProvinceName(rawName) {
  if (!rawName) return "";
  let clean = String(rawName)
    .toUpperCase()
    .replace(/^PROVINSI\s+/gi, "")
    .replace(/^PROV\.\s*/gi, "")
    .replace(/^DAERAH KHUSUS IBUKOTA\s+/gi, "")
    .replace(/^DAERAH ISTIMEWA\s+/gi, "")
    .replace(/^D\.I\.\s*/gi, "")
    .replace(/^DI\s+/gi, "")
    .replace(/[\.\,\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (clean === "JAKARTA") return "DKI JAKARTA";
  if (clean === "YOGYAKARTA") return "DI YOGYAKARTA";
  return clean;
}

function WilayahLayananMapSection() {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef({});

  const ALL_PROVINCES = Object.keys(PROVINCE_COORDS);
  const [activeProvinces, setActiveProvinces] = useState([]);
  const [provinceDisplayNames, setProvinceDisplayNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("ALL");
  const [hoveredProvince, setHoveredProvince] = useState(null);
  const [selectedProvince, setSelectedProvince] = useState(null);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchMasterWilayahData() {
      try {
        let rawData = [];
        try {
          const res = await fetch("/api/wilayah-layanan");
          const json = await res.json();
          if (json?.success && Array.isArray(json.data)) rawData = json.data;
        } catch {
          rawData = [];
        }

        if (isMounted && Array.isArray(rawData) && rawData.length > 0) {
          const activeItems = rawData.filter((item) => Boolean(item.is_active));
          const activeKeys = [];
          const nameMap = {};

          activeItems.forEach((item) => {
            const rawName = item.nama_provinsi || "";
            const normKey = normalizeProvinceName(rawName);
            let matchedKey = PROVINCE_COORDS[normKey] ? normKey : Object.keys(PROVINCE_COORDS).find((k) => k.includes(normKey) || normKey.includes(k));

            if (matchedKey) {
              if (!activeKeys.includes(matchedKey)) activeKeys.push(matchedKey);
              nameMap[matchedKey] = rawName.trim();
            }
          });

          if (activeKeys.length > 0) {
            setActiveProvinces(activeKeys);
            setProvinceDisplayNames(nameMap);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error("Gagal memuat master data wilayah layanan:", err);
      }
      if (isMounted) {
        setActiveProvinces(ALL_PROVINCES);
        setLoading(false);
      }
    }

    fetchMasterWilayahData();
    return () => { isMounted = false; };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function initMap() {
      if (!mapContainerRef.current || mapInstanceRef.current) return;
      const [{ default: L }] = await Promise.all([import("leaflet")]);
      if (cancelled || mapInstanceRef.current) return;

      const container = mapContainerRef.current;
      if (container._leaflet_id) container._leaflet_id = null;

      const map = L.map(container, {
        center: [-2.5, 118.0],
        zoom: 5,
        minZoom: 4,
        maxZoom: 10,
        scrollWheelZoom: false,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      mapInstanceRef.current = map;
      setMapReady(true);
      const resizeObserver = new ResizeObserver(() => map.invalidateSize());
      resizeObserver.observe(container);
      return () => { resizeObserver.disconnect(); map.remove(); };
    }
    initMap();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapInstanceRef.current) return;
    let cancelled = false;

    async function renderMarkers() {
      const { default: L } = await import("leaflet");
      if (cancelled || !mapInstanceRef.current) return;

      const map = mapInstanceRef.current;
      Object.values(markersRef.current).forEach((m) => m.remove());
      markersRef.current = {};

      activeProvinces.forEach((name) => {
        const coord = PROVINCE_COORDS[name];
        if (!coord) return;

        const isHovered = hoveredProvince === name;
        const isSelected = selectedProvince === name;
        const formattedName = provinceDisplayNames[name] || (name.charAt(0) + name.slice(1).toLowerCase());

        const customIcon = L.divIcon({
          className: "custom-leaflet-beacon-marker",
          html: `
            <div class="relative flex items-center justify-center w-8 h-8 group">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full ${isSelected ? 'bg-amber-400 opacity-90' : isHovered ? 'bg-sky-400 opacity-80' : 'bg-sky-400 opacity-40'}"></span>
              <span class="relative inline-flex items-center justify-center rounded-full h-5 w-5 ${isSelected ? 'bg-amber-500 ring-4 ring-amber-200 text-white font-extrabold text-[10px]' : isHovered ? 'bg-sky-600 ring-4 ring-sky-200 text-white font-bold text-[10px]' : 'bg-sky-500 ring-2 ring-white/90 text-white text-[9px]'} shadow-lg transition-transform duration-200 group-hover:scale-110">✓</span>
            </div>
          `,
          iconSize: [32, 32],
          iconAnchor: [16, 16],
        });

        const marker = L.marker(coord, { icon: customIcon })
          .addTo(map)
          .bindTooltip(`<div class="font-sans text-center px-1"><span class="font-extrabold text-xs block text-slate-800">${formattedName}</span><span class="text-[10px] text-emerald-600 font-bold flex items-center justify-center gap-1 mt-0.5">● Layanan Aktif</span></div>`, {
            direction: "top", offset: [0, -12], className: "wilayah-tooltip-custom", opacity: 1,
          })
          .on("mouseover", () => setHoveredProvince(name))
          .on("mouseout", () => setHoveredProvince(null))
          .on("click", () => { setSelectedProvince(name); map.flyTo(coord, 7, { duration: 1 }); });

        markersRef.current[name] = marker;
      });
    }

    renderMarkers();
    return () => { cancelled = true; };
  }, [activeProvinces, hoveredProvince, selectedProvince, mapReady]);

  const filteredActive = activeProvinces.filter((p) => {
    const displayName = provinceDisplayNames[p] || p;
    const matchesSearch = p.toLowerCase().includes(searchQuery.toLowerCase()) || displayName.toLowerCase().includes(searchQuery.toLowerCase());
    if (selectedRegion === "ALL") return matchesSearch;
    const reg = REGIONS.find((r) => r.id === selectedRegion);
    return matchesSearch && reg && reg.provinces?.includes(p);
  });

  const handleRegionSelect = (reg) => {
    setSelectedRegion(reg.id);
    setSelectedProvince(null);
    if (mapInstanceRef.current && reg.center) mapInstanceRef.current.flyTo(reg.center, reg.zoom, { duration: 1.2 });
  };

  const flyToProvince = (name) => {
    const coord = PROVINCE_COORDS[name];
    if (coord && mapInstanceRef.current) {
      setHoveredProvince(name);
      setSelectedProvince(name);
      mapInstanceRef.current.flyTo(coord, 7, { duration: 1 });
    }
  };

  const resetMapView = () => {
    setSelectedRegion("ALL");
    setSelectedProvince(null);
    setHoveredProvince(null);
    setSearchQuery("");
    if (mapInstanceRef.current) mapInstanceRef.current.flyTo([-2.5, 118.0], 5, { duration: 1 });
  };

  return (
    <section className="relative bg-gradient-to-b from-slate-50 via-sky-50/40 to-slate-50 py-20 sm:py-28 overflow-hidden">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-sky-200/40 blur-[120px] rounded-full pointer-events-none" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 sm:mb-14 text-center max-w-3xl mx-auto">
          <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-sky-700 bg-sky-100/80 border border-sky-200 shadow-xs mb-3">
            <span className="h-2 w-2 rounded-full bg-sky-500 animate-ping" /> Jangkauan Layanan Nasional
          </span>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-800 tracking-tight leading-tight">
            Wilayah Layanan <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-600 to-blue-600">SmartHomeCare</span>
          </h2>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 mb-8">
          {REGIONS.map((reg) => (
            <button key={reg.id} type="button" onClick={() => handleRegionSelect(reg)} className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${selectedRegion === reg.id ? "bg-gradient-to-r from-sky-600 to-blue-600 text-white shadow-lg scale-105" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"}`}>
              {reg.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col xl:flex-row gap-8 items-start">
          <div className="relative w-full xl:flex-1">
            <div className="relative overflow-hidden rounded-3xl border border-sky-100 bg-white p-3 shadow-2xl">
              <div ref={mapContainerRef} className="h-[460px] sm:h-[540px] w-full rounded-2xl z-0 bg-sky-50/50" />
              {selectedProvince && (
                <div className="absolute top-6 left-6 z-[450] max-w-xs sm:max-w-sm rounded-2xl bg-white/95 backdrop-blur-md p-5 shadow-2xl border border-sky-100">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-lg sm:text-xl font-extrabold text-slate-800">{provinceDisplayNames[selectedProvince] || selectedProvince}</h4>
                    </div>
                    <button type="button" onClick={() => setSelectedProvince(null)} className="text-slate-400 hover:text-slate-600">✕</button>
                  </div>
                </div>
              )}
              <button type="button" onClick={resetMapView} className="absolute top-6 right-6 z-[400] bg-white/90 px-3.5 py-2 rounded-xl text-xs font-bold text-slate-700 shadow-lg">Reset Peta</button>
              {loading && <div className="absolute inset-0 z-[400] flex items-center justify-center bg-white/80 backdrop-blur-sm">Memuat...</div>}
            </div>
          </div>

          {/* ── Province List Sidebar Column ── */}
          <div className="w-full xl:w-88 shrink-0">
            <div className="rounded-3xl border border-sky-100/80 bg-white/90 backdrop-blur-md p-6 shadow-xl shadow-sky-900/5 hover:border-sky-200 transition-all duration-300">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-sky-500 animate-pulse" />
                    Daftar Provinsi
                  </h3>
                  <p className="text-xs font-medium text-slate-500 mt-0.5">Area Kunjungan Home Care</p>
                </div>
                <span className="rounded-full bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200/80 px-3 py-1 text-xs font-black text-sky-700 shadow-xs">
                  {filteredActive.length} Wilayah
                </span>
              </div>

              {/* Search Box */}
              <div className="mb-4 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-100 focus-within:bg-white transition-all">
                <svg className="h-4 w-4 shrink-0 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Cari nama provinsi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs sm:text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery("")} className="text-slate-400 hover:text-slate-600 text-xs font-bold p-1 cursor-pointer">
                    ✕
                  </button>
                )}
              </div>

              {/* Province List Items */}
              <div className="max-h-[420px] space-y-1.5 overflow-y-auto pr-1">
                {filteredActive.length === 0 ? (
                  <div className="py-10 text-center">
                    <p className="text-xs font-semibold text-slate-500">Provinsi &quot;{searchQuery}&quot; tidak ditemukan.</p>
                    <button type="button" onClick={resetMapView} className="mt-2 text-xs font-bold text-sky-600 hover:underline">
                      Reset Pencarian
                    </button>
                  </div>
                ) : (
                  filteredActive.map((name) => {
                    const isHovered = hoveredProvince === name;
                    const isSelected = selectedProvince === name;
                    const displayName = provinceDisplayNames[name] || (name.charAt(0) + name.slice(1).toLowerCase());

                    return (
                      <button
                        key={name}
                        type="button"
                        onMouseEnter={() => setHoveredProvince(name)}
                        onMouseLeave={() => setHoveredProvince(null)}
                        onClick={() => flyToProvince(name)}
                        className={`flex w-full items-center justify-between gap-3 rounded-2xl px-3.5 py-2.5 text-left text-xs transition-all duration-200 cursor-pointer ${
                          isSelected
                            ? "bg-gradient-to-r from-sky-600 to-blue-600 text-white font-bold shadow-lg shadow-sky-600/30 scale-[1.02]"
                            : isHovered
                            ? "bg-sky-50 text-sky-900 font-semibold translate-x-1 border border-sky-100"
                            : "text-slate-700 hover:bg-slate-50 border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <span
                            className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-xl text-[11px] ${
                              isSelected ? "bg-white text-sky-700" : isHovered ? "bg-sky-200 text-sky-800" : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            📍
                          </span>
                          <span className="truncate leading-tight font-medium">{displayName}</span>
                        </div>

                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            isSelected ? "bg-white/20 text-white" : isHovered ? "bg-sky-100 text-sky-700" : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          Aktif
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      <style jsx global>{`
        .custom-leaflet-beacon-marker { background: transparent !important; }
        .wilayah-tooltip-custom { background: #ffffff !important; border: 1px solid #e2e8f0 !important; border-radius: 12px !important; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1) !important; }
      `}</style>
    </section>
  );
}
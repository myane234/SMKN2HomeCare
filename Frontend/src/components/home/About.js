"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FiTarget, FiHeart, FiStar, FiArrowRight } from "react-icons/fi";
import api from "@/services/api";
import { resolveImageUrl } from "@/services/resolveImage";

export default function About() {
  const [aboutData, setAboutData] = useState(null);

  useEffect(() => {
    async function fetchAboutContent() {
      try {
        const res = await api.get("/api/resource/content/about", {
          validateStatus: (status) => status < 500,
        });
        if (res.status === 200 && res.data) {
          setAboutData(res.data);
        }
      } catch (err) {
        // Fallback ke default content jika request gagal
      }
    }
    fetchAboutContent();
  }, []);

  const description = aboutData?.about_description_text || "Platform layanan kesehatan berbasis homecare yang menghadirkan tenaga kesehatan profesional langsung ke rumah Anda. Kami berkomitmen memberikan pelayanan yang aman, mudah, dan terpercaya.";
  const imageSrc = aboutData?.about_description_image ? resolveImageUrl(aboutData.about_description_image) : "/images/tentang-kami/TentangHomeCare.png";

  return (
    <section className="relative py-16 sm:py-24 lg:py-32 overflow-hidden bg-white">
      {/* Background gradient halus */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-white to-blue-50/20"></div>
      
      {/* Decorative blobs */}
      <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-100/20 blur-3xl"></div>
      <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-blue-100/20 blur-3xl"></div>

      <div className="relative mx-auto max-w-7xl px-6">
        {/* Desktop: Grid 2 kolom */}
        <div className="lg:grid lg:grid-cols-2 lg:gap-16">
          
          {/* Left - Content (Desktop) */}
          <div className="hidden lg:block">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full mb-6">
            </div>

            {/* Title */}
            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-[1.1]">
              Tentang
              <br />
              <span className="text-blue-600">SmartHomeCare</span>
            </h2>

            {/* Description */}
            <p className="mt-6 text-base sm:text-lg text-gray-600 leading-relaxed max-w-lg">
              {description}
            </p>

            {/* Desktop: Tombol di bawah teks */}
            <div className="mt-8">
              <Link
                href="/tentang-kami"
                className="group inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white font-semibold rounded-2xl shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30 hover:-translate-y-0.5"
              >
                Lihat Selengkapnya
                <FiArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

          {/* Right - Image with Floating Cards (Desktop) */}
          <div className="hidden lg:block relative flex items-center justify-center">
            <div className="relative w-full max-w-md lg:max-w-full">
              {/* Card Utama */}
              <div className="relative rounded-[32px] overflow-hidden shadow-2xl shadow-transparent/50">
                <div className="relative aspect-[4/5] w-full bg-gradient-to-br from-transparent to-transparent/30">
                  <Image
                    src={imageSrc}
                    alt="Tenaga kesehatan SmartHomeCare profesional"
                    fill
                    className="object-cover object-center"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent/5 to-transparent"></div>
                </div>
              </div>

              {/* Floating Card 1 - Kanan Atas (Visi) */}
              <div className="absolute top-80 right-3">
                <div className="group bg-white/90 backdrop-blur-sm p-4 sm:p-5 rounded-2xl shadow-lg shadow-blue-100/50 hover:shadow-xl hover:shadow-blue-200/50 transition-all duration-300 hover:-translate-y-1 min-w-[100px] sm:min-w-[120px]">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-50 group-hover:bg-blue-100 transition-colors">
                      <FiTarget className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-700">Visi</p>
                      <p className="text-[10px] text-gray-500">Kesehatan untuk semua</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Card 2 - Kiri Tengah (Misi) */}
              <div className="absolute -left-4 top-45 -translate-y-1/2 sm:-left-6 lg:-left-8">
                <div className="group bg-white/90 backdrop-blur-sm p-4 sm:p-5 rounded-2xl shadow-lg shadow-blue-100/50 hover:shadow-xl hover:shadow-blue-200/50 transition-all duration-300 hover:-translate-y-1 min-w-[100px] sm:min-w-[120px]">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-50 group-hover:bg-blue-100 transition-colors">
                      <FiHeart className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-700">Misi</p>
                      <p className="text-[10px] text-gray-500">Pelayanan terbaik</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Card 3 - Bawah Tengah (Keunggulan) */}
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 sm:-bottom-6 lg:-bottom-8">
                <div className="group bg-white/90 backdrop-blur-sm p-4 sm:p-5 rounded-2xl shadow-lg shadow-blue-100/50 hover:shadow-xl hover:shadow-blue-200/50 transition-all duration-300 hover:-translate-y-1 min-w-[100px] sm:min-w-[120px]">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-blue-50 group-hover:bg-blue-100 transition-colors">
                      <FiStar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-700">Keunggulan</p>
                      <p className="text-[10px] text-gray-500">Terpercaya & aman</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile: Flex Column - Urutan yang benar */}
          <div className="lg:hidden flex flex-col items-center text-center">

            {/* 2. Judul */}
            <h2 className="text-4xl font-bold text-gray-900 leading-[1.1]">
              Tentang
              <br />
              <span className="text-blue-600">SmartHomeCare</span>
            </h2>

            {/* 3. Deskripsi */}
            <p className="mt-4 text-base text-gray-600 leading-relaxed max-w-lg">
              {description}
            </p>

            {/* 4. Gambar Perawat dengan Floating Cards */}
            <div className="relative w-full max-w-sm mx-auto mt-8">
              {/* Card Utama */}
              <div className="relative rounded-[32px] overflow-hidden shadow-2xl shadow-blue-100/50">
                <div className="relative aspect-[4/5] w-full bg-gradient-to-br from-transparent to-transparent/30">
                  <Image
                    src={imageSrc}
                    alt="Tenaga kesehatan SmartHomeCare profesional"
                    fill
                    className="object-cover object-center"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-transparent/5 to-transparent"></div>
                </div>
              </div>

              {/* 5. Floating Cards - Tetap di sekitar gambar */}
              {/* Floating Card 1 - Kanan Atas (Visi) */}
              <div className="absolute top-50 right-3">
                <div className="group bg-white/90 backdrop-blur-sm p-3 rounded-2xl shadow-lg shadow-blue-100/50 hover:shadow-xl hover:shadow-blue-200/50 transition-all duration-300 hover:-translate-y-1 min-w-[90px]">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-xl bg-blue-50 group-hover:bg-blue-100 transition-colors">
                      <FiTarget className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-700">Visi</p>
                      <p className="text-[10px] text-gray-500">Kesehatan untuk semua</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Card 2 - Kiri Tengah (Misi) */}
              <div className="absolute -left-3 top-27 -translate-y-1/2">
                <div className="group bg-white/90 backdrop-blur-sm p-3 rounded-2xl shadow-lg shadow-blue-100/50 hover:shadow-xl hover:shadow-blue-200/50 transition-all duration-300 hover:-translate-y-1 min-w-[90px]">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-xl bg-blue-50 group-hover:bg-blue-100 transition-colors">
                      <FiHeart className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-700">Misi</p>
                      <p className="text-[10px] text-gray-500">Pelayanan terbaik</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Card 3 - Bawah Tengah (Keunggulan) */}
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2">
                <div className="group bg-white/90 backdrop-blur-sm p-3 rounded-2xl shadow-lg shadow-blue-100/50 hover:shadow-xl hover:shadow-blue-200/50 transition-all duration-300 hover:-translate-y-1 min-w-[90px]">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-xl bg-blue-50 group-hover:bg-blue-100 transition-colors">
                      <FiStar className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-gray-700">Keunggulan</p>
                      <p className="text-[10px] text-gray-500">Terpercaya & aman</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 6. Tombol Lihat Selengkapnya - Paling Bawah */}
            <div className="mt-8">
              <Link
                href="/tentang-kami"
                className="group inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white font-semibold rounded-2xl shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/30 hover:-translate-y-0.5"
              >
                Lihat Selengkapnya
                <FiArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
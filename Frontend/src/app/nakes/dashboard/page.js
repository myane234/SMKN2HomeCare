"use client";

import { useState, useRef, useEffect } from "react";
import { Clock, MapPin, Edit3, CheckCircle2, Bell, ChevronUp, ChevronDown, X } from "lucide-react";
import api from "@/services/api";

export default function DashboardPage() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAccordionOpen, setIsAccordionOpen] = useState(true);
  const [sheetPosition, setSheetPosition] = useState(0); // 0: collapsed, 1: expanded
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [currentY, setCurrentY] = useState(0);
  const sheetRef = useRef(null);

  const [nakesProfile, setNakesProfile] = useState({
    name: "Loading...",
    service: "Perawat Home Care",
    location: "Loading...",
    hours: "Senin - Sabtu, 08:00 - 16:00",
    photo: "/images/nyobanakes/nurse.png",
  });

  useEffect(() => {
    const fetchNakesData = async () => {
      try {
        const res = await api.get('/api/profile/me');
        if (res.data?.success && res.data?.data?.tenaga_medis) {
          const tm = res.data.data.tenaga_medis;
          setNakesProfile({
            name: tm.nama_lengkap || "Nama tidak diatur",
            service: tm.jenis_tenaga_medis || "Tenaga Medis",
            location: tm.alamat_lengkap || "Lokasi tidak diatur",
            hours: "Senin - Sabtu, 08:00 - 16:00",
            photo: tm.foto_profile || "/images/nyobanakes/nurse.png",
          });
        }
      } catch (err) {
        console.error("Gagal mengambil data profil nakes:", err);
      }
    };
    fetchNakesData();
  }, []);

  // Touch handlers for bottom sheet
  const handleTouchStart = (e) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    setCurrentY(e.touches[0].clientY);
  };

  const handleTouchMove = (e) => {
    if (!isDragging) return;
    const deltaY = startY - e.touches[0].clientY;
    const newPosition = Math.max(0, Math.min(1, sheetPosition + deltaY / 300));
    setCurrentY(e.touches[0].clientY);
    
    if (sheetRef.current) {
      const sheet = sheetRef.current;
      const height = sheet.scrollHeight;
      const translateY = (1 - newPosition) * (height * 0.4);
      sheet.style.transform = `translateY(${translateY}px)`;
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    const deltaY = startY - currentY;
    
    if (deltaY > 50) {
      setSheetPosition(1);
      if (sheetRef.current) {
        sheetRef.current.style.transform = 'translateY(0)';
      }
    } else if (deltaY < -50) {
      setSheetPosition(0);
      if (sheetRef.current) {
        const sheet = sheetRef.current;
        const height = sheet.scrollHeight;
        sheet.style.transform = `translateY(${height * 0.4}px)`;
      }
    } else {
      const snapTo = sheetPosition > 0.5 ? 1 : 0;
      setSheetPosition(snapTo);
      if (sheetRef.current) {
        const sheet = sheetRef.current;
        const height = sheet.scrollHeight;
        const translateY = snapTo === 0 ? height * 0.4 : 0;
        sheet.style.transform = `translateY(${translateY}px)`;
      }
    }
  };

  // Initialize sheet position on mount
  useEffect(() => {
    if (sheetRef.current && window.innerWidth < 768) {
      const sheet = sheetRef.current;
      const height = sheet.scrollHeight;
      sheet.style.transform = `translateY(${height * 0.4}px)`;
      sheet.style.transition = 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)';
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/30 to-gray-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
              Dashboard
            </h1>
            <p className="text-sm text-gray-500">
              Menunggu Pesanan
            </p>
          </div>
          <button className="relative p-2 rounded-xl bg-white shadow-md hover:shadow-lg transition-all">
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
              0
            </span>
          </button>
        </div>

        {/* Hero Card */}
        <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-white via-[#F7FBFF] to-[#DCEBFF] p-6 md:p-8 shadow-lg border border-blue-100 mb-6">

          {/* Background Decoration */}
          <div className="absolute -right-10 -bottom-10 h-64 w-64 rounded-full bg-blue-200/20 blur-3xl"></div>
          <div className="absolute right-32 top-10 h-32 w-32 rounded-full bg-blue-100/30 blur-2xl"></div>

          <div className="relative flex flex-col-reverse items-center justify-between gap-6 md:flex-row">

            {/* Left Content */}
            <div className="flex-1">

              {/* Icon */}
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-md">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>

              <h2 className="text-3xl font-bold text-slate-900">
                Menunggu Pesanan
              </h2>

              <p className="mt-4 max-w-md text-gray-600 leading-7">
                Anda sedang{" "}
                <span className="font-semibold text-green-600">
                  online
                </span>
                .
                <br />
                Pesanan akan muncul di halaman ini jika ada pasien yang membutuhkan
                layanan.
              </p>
            </div>

            {/* Right Illustration */}
            <div className="relative">


              <img
                src="/images/dashboard/nurse-hero.png"
                alt="Nurse Illustration"
                className="w-60 md:w-72"
              />
            </div>

          </div>
        </div>

        {/* Desktop Profile Card with Accordion */}
        <div className="hidden md:block rounded-3xl bg-white shadow-lg shadow-gray-200/50 border border-gray-100/50 overflow-hidden">
          <div className="p-6 sm:p-8">
            {/* Accordion Header */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900">Profil Tenaga Medis</h3>
                <p className="text-sm text-gray-500">Informasi profil dan jadwal layanan</p>
              </div>
              <button
                onClick={() => setIsAccordionOpen(!isAccordionOpen)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100 transition-all"
              >
                <span>{isAccordionOpen ? "Sembunyikan" : "Lihat Detail"}</span>
                {isAccordionOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
            </div>

            {/* Accordion Content */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isAccordionOpen ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="flex flex-col lg:flex-row items-start lg:items-center gap-6 pt-4 border-t border-gray-100">
                {/* Profile Photo */}
                <div className="relative flex-shrink-0">
                  <div className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 ring-4 ring-white shadow-md">
                    <img
                      src={nakesProfile.photo}
                      alt="Foto Nakes"
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="absolute -bottom-1 -right-1 rounded-full p-1 ring-2 ring-white bg-green-500">
                    <CheckCircle2 className="h-4 w-4 text-white" fill="white" />
                  </div>
                </div>

                {/* Profile Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h3 className="text-xl sm:text-2xl font-bold text-gray-900">
                        {nakesProfile.name}
                      </h3>
                      <p className="text-sm text-blue-600 font-medium">
                        {nakesProfile.service}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/80">
                      <div className="flex-shrink-0 p-2 rounded-lg bg-blue-50">
                        <MapPin className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                          Lokasi Melayani
                        </p>
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {nakesProfile.location}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/80 cursor-pointer hover:bg-gray-100 transition-all group">
                      <div className="flex-shrink-0 p-2 rounded-lg bg-blue-50">
                        <Clock className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                            Jam Layanan
                          </p>
                          <button
                            onClick={() => setIsEditModalOpen(true)}
                            className="text-xs font-medium text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Edit
                          </button>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">
                          {nakesProfile.hours}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Sheet - Like Grab Driver */}
      <div className="md:hidden">
        {/* Overlay */}
        <div 
          className={`fixed inset-0 z-40 transition-opacity duration-300 ${
            sheetPosition === 1 ? 'bg-black/40 backdrop-blur-sm' : 'bg-transparent pointer-events-none'
          }`}
          onClick={() => {
            if (sheetPosition === 1) {
              setSheetPosition(0);
              if (sheetRef.current) {
                const sheet = sheetRef.current;
                const height = sheet.scrollHeight;
                sheet.style.transform = `translateY(${height * 0.4}px)`;
              }
            }
          }}
        />

        {/* Bottom Sheet */}
        <div
          ref={sheetRef}
          className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl touch-none"
          style={{
            transition: isDragging ? 'none' : 'transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
            maxHeight: '90vh',
          }}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Drag Handle */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="h-1.5 w-12 rounded-full bg-gray-300" />
          </div>

          {/* Sheet Content */}
          <div 
            className="px-5 pb-6 overflow-y-auto"
            style={{ maxHeight: 'calc(90vh - 20px)' }}
          >
            {/* Collapsed View - Important Info */}
            <div className="flex items-center gap-4">
              <div className="relative flex-shrink-0">
                <div className="h-16 w-16 rounded-2xl overflow-hidden bg-gradient-to-br from-blue-50 to-blue-100 ring-4 ring-white shadow-md">
                  <img
                    src={nakesProfile.photo}
                    alt="Foto Nakes"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 rounded-full p-1 ring-2 ring-white bg-green-500">
                  <CheckCircle2 className="h-3.5 w-3.5 text-white" fill="white" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-lg font-bold text-gray-900">{nakesProfile.name}</h4>
                <p className="text-sm text-blue-600 font-medium">{nakesProfile.service}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                  <p className="text-xs text-gray-500 truncate">{nakesProfile.hours}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(true)}
                className="flex-shrink-0 p-2 rounded-xl bg-blue-50 text-blue-600"
              >
                <Edit3 className="h-4 w-4" />
              </button>
            </div>

            {/* Expanded View - Full Details */}
            <div className={`mt-4 space-y-4 transition-opacity duration-300 ${
              sheetPosition === 1 ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}>
              {/* Location */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/80">
                <div className="flex-shrink-0 p-2 rounded-lg bg-blue-50">
                  <MapPin className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    Lokasi Melayani
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {nakesProfile.location}
                  </p>
                </div>
              </div>

              {/* Hours */}
              <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50/80">
                <div className="flex-shrink-0 p-2 rounded-lg bg-blue-50">
                  <Clock className="h-4 w-4 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-500">
                    Jam Layanan
                  </p>
                  <p className="text-sm font-semibold text-gray-900">
                    {nakesProfile.hours}
                  </p>
                </div>
              </div>

              {/* Edit Button */}
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="w-full rounded-2xl bg-blue-600 py-3.5 text-sm font-semibold text-white shadow-lg shadow-blue-600/25 transition-all hover:bg-blue-700 active:scale-[0.98]"
              >
                Ajukan Perubahan Jam Layanan
              </button>

              {/* Swipe indicator */}
              <div className="text-center text-xs text-gray-400 mt-2">
                Geser ke bawah untuk menutup
              </div>
            </div>

            {/* Hint text when collapsed */}
            <div className={`text-center text-xs text-gray-400 mt-3 transition-opacity duration-300 ${
              sheetPosition === 0 ? 'opacity-100' : 'opacity-0'
            }`}>
              Geser ke atas untuk detail lengkap
            </div>
          </div>
        </div>
      </div>

      {/* Edit Jam Layanan Modal */}
      {isEditModalOpen && (
        <>
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50" onClick={() => setIsEditModalOpen(false)} />
          <div className="fixed inset-x-4 bottom-4 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:max-w-lg z-50">
            <div className="bg-white rounded-3xl shadow-2xl p-6 animate-slide-up">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Ajukan Perubahan Jam Layanan</h3>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Hari</label>
                  <input
                    type="text"
                    defaultValue="Senin - Sabtu"
                    className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Jam Mulai</label>
                    <input
                      type="time"
                      defaultValue="08:00"
                      className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Jam Selesai</label>
                    <input
                      type="time"
                      defaultValue="16:00"
                      className="mt-1 w-full rounded-xl border border-gray-200 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="rounded-xl bg-blue-50 p-4 border border-blue-100">
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 p-1 rounded-full bg-blue-100">
                      <Clock className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-blue-900">Perubahan Akan Diproses</p>
                      <p className="text-xs text-blue-700 mt-0.5">
                        Perubahan jam layanan Anda akan dikirim ke admin untuk persetujuan. Proses ini membutuhkan waktu maksimal 1x24 jam.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setIsEditModalOpen(false)}
                    className="flex-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 font-medium hover:bg-gray-50 transition-all"
                  >
                    Batal
                  </button>
                  <button
                    onClick={() => {
                      setIsEditModalOpen(false);
                    }}
                    className="flex-1 px-4 py-3 rounded-xl bg-blue-600 text-white font-medium hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
                  >
                    Kirim Perubahan
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
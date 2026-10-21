"use client";

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import LoginRequiredModal from '@/components/LoginRequiredModal';
import { 
  FiFileText, 
  FiCheckSquare, 
  FiUsers, 
  FiAward,
  FiClock,
  FiDollarSign,
  FiShield,
  FiAlertCircle,
  FiArrowRight
} from 'react-icons/fi';
import { getSession } from '@/services/session';
import api from '@/services/api';
import { resolveImageUrl } from '@/services/resolveImage';

export default function GabungMitraPage() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = React.useState(false);
  const [showLoginModal, setShowLoginModal] = React.useState(false);
  
  // 🔹 1. DEKLARASIKAN STATE isNakes DI SINI
  const [isNakes, setIsNakes] = React.useState(false);
  const [mitraContent, setMitraContent] = React.useState({
    mitra_banner: null,
    mitra_text_banner: null,
    mitra_description: null,
  });

  React.useEffect(() => {
    setIsLoggedIn(document.cookie.includes("is_logged_in=true"));
    
    // 🔹 2. SET STATUS NAKES (Misal dari Cookie/Session/LocalStorage)
    // Sesuaikan logika penentuan Nakes dengan yang ada di aplikasi kamu
    const isUserNakes = document.cookie.includes("role=nakes"); 
    setIsNakes(isUserNakes);

    // 🔹 Fetch Konten Gabung Mitra (Public)
    api.get('/api/resource/content/mitra')
      .then((res) => {
        const data = res.data?.data || res.data;
        if (data) {
          setMitraContent(data);
        }
      })
      .catch((err) => {
        console.error('Gagal memuat konten mitra:', err);
      });
  }, []);
  
  // 🔹 Data Benefit Mitra
  const benefits = [
    {
      title: 'Jam Kerja Fleksibel',
      desc: 'Atur sendiri jadwal dan ketersediaan waktu pelayanan Anda.',
      icon: <FiClock className="w-6 h-6 text-sky-600 mb-2" />
    },
    {
      title: 'Penghasilan Transparan',
      desc: 'Sistem bagi hasil yang jelas tanpa potongan tersembunyi.',
      icon: <FiDollarSign className="w-6 h-6 text-sky-600 mb-2" />
    },
    {
      title: 'Dukungan Support',
      desc: 'Tim support SmartCare siap membantu kendala Anda di lapangan.',
      icon: <FiShield className="w-6 h-6 text-sky-600 mb-2" />
    }
  ];

  // 🔹 Data Alur Proses Pendaftaran
  const processSteps = [
    {
      title: 'Registrasi Online',
      desc: 'Isi formulir data diri, kualifikasi medis, serta unggah kelengkapan berkas STR.',
      icon: <FiFileText className="w-6 h-6 text-sky-600" />
    },
    {
      title: 'Verifikasi Berkas',
      desc: 'Tim verifikator kami memeriksa keabsahan dokumen dan sertifikasi kompetensi Anda.',
      icon: <FiCheckSquare className="w-6 h-6 text-sky-600" />
    },
    {
      title: 'Wawancara & Kualifikasi',
      desc: 'Sesi wawancara singkat untuk mengenal kesiapan dan etika pelayanan Anda.',
      icon: <FiUsers className="w-6 h-6 text-sky-600" />
    },
    {
      title: 'Onboarding & Pelatihan',
      desc: 'Orientasi singkat penggunaan aplikasi SmartCare dan aktivasi akun mitra Anda.',
      icon: <FiAward className="w-6 h-6 text-sky-600" />
    }
  ];

  const defaultBanner = "https://media.istockphoto.com/id/2157133393/id/foto/wanita-senior-di-kursi-roda-dan-pekerja-perawatan-kesehatan-wanita.jpg?s=612x612&w=0&k=20&c=yNf-oa7ruic5BBzVeW14LJ46SaQFkfWBUDYJ0SdOt_8=";
  const bannerSrc = mitraContent.mitra_banner ? resolveImageUrl(mitraContent.mitra_banner) : defaultBanner;
  const textBanner = mitraContent.mitra_text_banner || "Bergabung Menjadi Mitra";
  const descriptionText = mitraContent.mitra_description || "Perluas jangkauan layanan kesehatan Anda dan berikan perawatan medis berkualitas langsung di rumah pasien.";

  return (
    <div className="min-h-screen bg-white font-sans text-gray-800 pb-32">
      
      {/* 🔹 1. HERO BANNER */}
      <div className="w-full h-80 sm:h-[420px] relative bg-slate-900 overflow-hidden">
        <img 
          src={bannerSrc}
          alt="Gabung Mitra SmartCare" 
          className="w-full h-full object-cover opacity-35 scale-105" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/50 to-transparent" />
        
        {/* Teks Hero — Max Width 7xl */}
        <div className="absolute inset-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-end pb-12 items-start text-left z-10">
          <span className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider text-sky-400 bg-sky-950/80 border border-sky-800/60 mb-3 shadow-lg">
            <span className="h-2 w-2 rounded-full bg-sky-400 animate-ping" />
            Peluang Karir Tenaga Kesehatan
          </span>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight max-w-3xl">
            {textBanner}
          </h1>
          <p className="text-sm sm:text-base text-slate-300 mt-3 font-normal leading-relaxed max-w-2xl">
            {descriptionText}
          </p>
        </div>
      </div>

      {/* 🔹 MAIN CONTENT CONTAINER — Max Width 7xl */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 sm:pt-16 space-y-16 sm:space-y-24">

        {/* ⚠️ ALERT BANNER UNTUK NAKES TERDAFTAR */}
        {isNakes && (
          <div className="bg-amber-50 border border-amber-300/80 rounded-3xl p-6 sm:p-8 shadow-md text-amber-900">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-amber-100 rounded-2xl text-amber-600 shrink-0">
                  <FiAlertCircle className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-extrabold text-lg text-amber-900">
                    Anda Sudah Terdaftar sebagai Nakes
                  </h3>
                  <p className="text-xs sm:text-sm text-amber-800 leading-relaxed max-w-2xl">
                    Akun Anda saat ini telah aktif sebagai <span className="font-bold">Mitra Tenaga Kesehatan</span>. Anda dapat langsung membuka dashboard nakes tanpa pendaftaran ulang.
                  </p>
                </div>
              </div>
              <Link 
                href="/nakes/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm rounded-2xl transition shadow-lg shadow-amber-600/20 shrink-0 active:scale-95"
              >
                Buka Dashboard Nakes
                <FiArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
        
        {/* 🔹 2. BENEFIT SECTION */}
        <div>
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-14">
            <span className="text-xs font-extrabold uppercase tracking-widest text-sky-600 bg-sky-50 px-3 py-1 rounded-full border border-sky-100">
              Keuntungan Mitra
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-800 tracking-tight mt-3">
              Mengapa Bergabung Dengan SmartCare?
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Nikmati keleluasaan profesi medis dengan dukungan sistem digital terdepan.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {benefits.map((b, idx) => (
              <div 
                key={idx} 
                className="flex flex-col items-center text-center bg-slate-50/80 border border-slate-200/80 rounded-3xl p-6 sm:p-8 hover:bg-white hover:border-sky-300 hover:shadow-xl hover:shadow-sky-900/5 transition-all duration-300 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-white border border-sky-100 shadow-sm flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-sky-500 group-hover:text-white transition-all duration-300">
                  {React.cloneElement(b.icon, { className: "w-7 h-7 text-sky-600 group-hover:text-white transition-colors" })}
                </div>
                <h3 className="text-lg font-extrabold text-slate-800 mb-2">{b.title}</h3>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 🔹 3. PROSES PENDAFTARAN */}
        <div className="bg-gradient-to-br from-sky-50/60 via-slate-50 to-blue-50/40 rounded-3xl border border-sky-100/80 p-6 sm:p-10 lg:p-14 shadow-lg shadow-sky-900/5">
          <div className="text-center max-w-2xl mx-auto mb-10 sm:mb-12">
            <span className="text-xs font-extrabold uppercase tracking-widest text-sky-600 bg-white px-3 py-1 rounded-full border border-sky-200 shadow-xs">
              Langkah Pendaftaran
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-800 tracking-tight mt-3">
              Alur Pendaftaran Mitra
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 mt-2">
              Proses pendaftaran cepat dan terstruktur dalam 4 langkah mudah.
            </p>
          </div>

          {/* Grid Cards Alur */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {processSteps.map((step, index) => (
              <div key={index} className="flex flex-col justify-between bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-sky-300 transition-all">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center shadow-xs">
                      {step.icon}
                    </div>
                    <span className="text-xs font-black text-slate-300 bg-slate-100 px-2.5 py-1 rounded-lg">
                      0{index + 1}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-800 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <button 
              onClick={(e) => {
                if (!isLoggedIn) {
                  e.preventDefault();
                  setShowLoginModal(true);
                } else {
                  router.push("/gabung-mitra/nakes");
                }
              }}
              className="inline-flex items-center justify-center px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-sm sm:text-base rounded-2xl transition-all shadow-xl shadow-emerald-600/20 active:scale-95 cursor-pointer gap-2"
            >
              Mulai Pendaftaran Nakes Sekarang
              <FiArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>

      </div>

      <div className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-md border-t border-gray-200 p-4 z-40 sm:hidden">
        <button 
          onClick={(e) => {
            if (!isLoggedIn) {
              e.preventDefault();
              setShowLoginModal(true);
            } else {
              router.push("/gabung-mitra/nakes");
            }
          }}
          className="w-full inline-flex items-center justify-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition active:scale-95 cursor-pointer"
        >
          Mulai Pendaftaran Nakes
        </button>
      </div>

      <LoginRequiredModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
        message="Anda perlu login untuk melanjutkan pendaftaran sebagai mitra."
      />
    </div>
  );
}
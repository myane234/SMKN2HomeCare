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
      <div className="w-full h-80 sm:h-[380px] relative bg-gray-600 overflow-hidden">
        <img 
          src={bannerSrc}
          alt="Gabung Mitra SmartCare" 
          className="w-full h-full object-cover opacity-40 scale-105" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
        
        {/* Teks Hero */}
        <div className="absolute inset-0 max-w-2xl mx-auto px-6 flex flex-col justify-end pb-8 items-start text-left z-10">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
            {textBanner}
          </h1>
          <p className="text-xs sm:text-sm text-gray-300 mt-2 font-light leading-relaxed">
            {descriptionText}
          </p>
        </div>
      </div>


      <div className="max-w-xl mx-auto px-6 pt-10 space-y-16">

        {/* ⚠️ ALERT BANNER UNTUK NAKES TERDAFTAR */}
        {isNakes && (
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 shadow-sm text-amber-900">
            <div className="flex items-start gap-3.5">
              <FiAlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1.5 flex-1">
                <h3 className="font-bold text-base text-amber-900">
                  Anda Sudah Terdaftar sebagai Nakes
                </h3>
                <p className="text-xs sm:text-sm text-amber-800 leading-relaxed">
                  Akun Anda saat ini sudah aktif sebagai <span className="font-bold">Mitra Tenaga Kesehatan</span>. Anda tidak perlu melakukan pendaftaran ulang.
                </p>
                <div className="pt-2">
                  <Link 
                    href="/nakes/dashboard"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs sm:text-sm rounded-xl transition shadow-md active:scale-95"
                  >
                    Buka Dashboard Nakes
                    <FiArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* 🔹 2. BENEFIT SECTION */}
        <div>
          <h2 className="text-base sm:text-lg font-bold text-gray-500 uppercase tracking-wider mb-8 text-center">
            Mengapa Bergabung Dengan SmartCare?
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {benefits.map((b, idx) => (
              <div key={idx} className="flex flex-col items-center text-center">
                {b.icon}
                <h3 className="text-base font-bold text-gray-800 mb-1">{b.title}</h3>
                <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 🔹 3. PROSES PENDAFTARAN */}
        <div>
          <div className="text-left mb-8">
            <h2 className="text-xl sm:text-2xl font-extrabold text-sky-600">
              Alur Pendaftaran
            </h2>
            <p className="text-sm sm:text-base text-gray-500 mt-1">Langkah mudah untuk mulai melayani pasien</p>
          </div>

          {/* List Item Alur */}
          <div className="space-y-6">
            {processSteps.map((step, index) => (
              <div key={index} className="flex items-start gap-4">
                
                {/* BULATAN ICON */}
                <div className="w-12 h-12 rounded-full bg-sky-50 border border-sky-200 flex items-center justify-center shadow-sm shrink-0">
                  {step.icon}
                </div>

                {/* KONTEN TEKS ALUR */}
                <div className="pt-1">
                  <h3 className="text-base sm:text-lg font-bold text-sky-600 mb-1">
                    {step.title}
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                    {step.desc}
                  </p>
                </div>

              </div>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <button 
            onClick={(e) => {
              if (!isLoggedIn) {
                e.preventDefault();
                setShowLoginModal(true);
              } else {
                router.push("/gabung-mitra/nakes");
              }
            }}
            className="w-full inline-flex items-center justify-center px-6 py-3.5 bg-green-600 hover:bg-green-700 text-white font-bold text-sm rounded-xl transition-all shadow-md shadow-sky-500/20 active:scale-[0.98] cursor-pointer"
          >
            Mulai Pendaftaran Nakes
          </button>
        </div>

      </div>

      <div className="fixed bottom-0 inset-x-0 bg-white/80 backdrop-blur-md border-t border-gray-100 p-4 z-40 sm:hidden">
        <button 
          onClick={(e) => {
            if (!isLoggedIn) {
              e.preventDefault();
              setShowLoginModal(true);
            } else {
              router.push("/gabung-mitra/nakes");
            }
          }}
          className="w-full inline-flex items-center justify-center px-6 py-3 bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs rounded-xl shadow-md transition active:scale-95 cursor-pointer"
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
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  FileText,
  Search,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  HelpCircle,
  AlertCircle,
  ArrowLeft,
  BookOpen,
  Eye,
  RotateCcw
} from 'lucide-react';
import api from '@/services/api';

const LOREM = `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.`;

const TOS_DATA = [
  {
    id: 'pasal-1',
    number: 1,
    roman: 'I',
    title: 'Ketentuan Umum & Penerimaan Layanan',
    category: 'umum',
    categoryName: 'Akun & Layanan',
    icon: ShieldCheck,
    summary: 'Persetujuan hukum penggunaan aplikasi SmartHomeCare dan kepatuhan terhadap seluruh aturan yang berlaku.',
    content: LOREM
  },
  {
    id: 'pasal-2',
    number: 2,
    roman: 'II',
    title: 'Definisi & Istilah',
    category: 'umum',
    categoryName: 'Akun & Layanan',
    icon: BookOpen,
    summary: 'Penjelasan istilah-istilah resmi yang digunakan dalam dokumen Ketentuan Layanan SmartHomeCare.',
    content: LOREM
  },
  {
    id: 'pasal-3',
    number: 3,
    roman: 'III',
    title: 'Persyaratan Akun & Keamanan Pengguna',
    category: 'pengguna',
    categoryName: 'Akun & Layanan',
    icon: ShieldCheck,
    summary: 'Kriteria pendaftaran akun, kebenaran data identitas, dan kerahasiaan kredensial akun Pengguna.',
    content: LOREM
  },
  {
    id: 'pasal-4',
    number: 4,
    roman: 'IV',
    title: 'Prosedur Pemesanan & Pelaksanaan Pelayanan HomeCare',
    category: 'medis',
    categoryName: 'Nakes & Medis',
    icon: ShieldCheck,
    summary: 'Aturan pemesanan jadwal, ketersediaan Nakes, standar keselamatan lingkungan, dan penanganan kondisi darurat.',
    content: LOREM
  },
  {
    id: 'pasal-5',
    number: 5,
    roman: 'V',
    title: 'Kualifikasi & Hak Kemitraan Tenaga Kesehatan (Nakes)',
    category: 'medis',
    categoryName: 'Nakes & Medis',
    icon: ShieldCheck,
    summary: 'Standar verifikasi STR, SIP, latar belakang Nakes, dan batasan tanggung jawab operasional medis.',
    content: LOREM
  },
  {
    id: 'pasal-6',
    number: 6,
    roman: 'VI',
    title: 'Biaya, Pembayaran & Kebijakan Pembatalan / Refund',
    category: 'pembayaran',
    categoryName: 'Pembayaran & Refund',
    icon: ShieldCheck,
    summary: 'Struktur tarif, saluran pembayaran resmi, syarat pengembalian dana, serta denda pembatalan mendadak.',
    content: LOREM
  },
  {
    id: 'pasal-7',
    number: 7,
    roman: 'VII',
    title: 'Privasi Data Kesehatan & Rekam Medis Elektronik',
    category: 'privasi',
    categoryName: 'Privasi & Hukum',
    icon: ShieldCheck,
    summary: 'Perlindungan data pribadi Pengguna, kerahasiaan rekam medis elektronik sesuai UU PDP No. 27/2022.',
    content: LOREM
  },
  {
    id: 'pasal-8',
    number: 8,
    roman: 'VIII',
    title: 'Pembatasan Tanggung Jawab & Force Majeure',
    category: 'privasi',
    categoryName: 'Privasi & Hukum',
    icon: ShieldCheck,
    summary: 'Pengecualian kewajiban atas insiden di luar kendali wajar.',
    content: LOREM
  },
  {
    id: 'pasal-9',
    number: 9,
    roman: 'IX',
    title: 'Hak Kekayaan Intelektual',
    category: 'privasi',
    categoryName: 'Privasi & Hukum',
    icon: ShieldCheck,
    summary: 'Kepemilikan hak cipta atas logo, merek dagang, desain antarmuka, dan sistem perangkat lunak SmartHomeCare.',
    content: LOREM
  },
  {
    id: 'pasal-10',
    number: 10,
    roman: 'X',
    title: 'Perubahan Ketentuan & Penyelesaian Perselisihan',
    category: 'privasi',
    categoryName: 'Privasi & Hukum',
    icon: ShieldCheck,
    summary: 'Prosedur pembaruan syarat layanan dan tata cara musyawarah hukum jika terjadi sengketa.',
    content: LOREM
  }
];

const CATEGORIES = [
  { id: 'semua', label: 'Semua Pasal' },
  { id: 'umum', label: 'Akun & Layanan' },
  { id: 'pengguna', label: 'Hak & Kewajiban' },
  { id: 'medis', label: 'Nakes & Medis' },
  { id: 'pembayaran', label: 'Pembayaran & Refund' },
  { id: 'privasi', label: 'Privasi & Hukum' }
];

export default function TermsDashboard() {
  const [tosData, setTosData] = useState(TOS_DATA);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('semua');
  const [expandedSections, setExpandedSections] = useState({});
  const [activeSection, setActiveSection] = useState('pasal-1');
  const [isAccepted, setIsAccepted] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function loadTermsContent() {
      try {
        const endpoints = [
          '/api/legalitas/detail/syarat-ketentuan-pasien',
          '/api/resource/content/terms',
          '/api/syarat-ketentuan',
          '/api/terms-of-service'
        ];
        let apiData = null;
        for (const ep of endpoints) {
          try {
            const res = await api.get(ep, { validateStatus: (s) => s < 500 });
            if (res.status === 200 && res.data) {
              const contentObj = res.data?.data || res.data;
              if (contentObj && (Array.isArray(contentObj) || Array.isArray(contentObj?.sections) || contentObj?.content)) {
                apiData = contentObj;
                break;
              }
            }
          } catch (e) {
            // Ignore
          }
        }
        if (isMounted) {
          if (apiData) {
            if (Array.isArray(apiData)) {
              setTosData(apiData);
            } else if (Array.isArray(apiData?.sections)) {
              setTosData(apiData.sections);
            } else if (apiData?.content) {
              // Jika endpoint /api/legalitas/detail/{key} mengembalikan single document { title, content }
              setTosData([{
                id: 'pasal-1',
                number: 1,
                roman: 'I',
                title: apiData.title || 'Syarat & Ketentuan Pasien',
                category: 'umum',
                categoryName: 'Legalitas Resmi',
                icon: ShieldCheck,
                summary: 'Dokumen Syarat & Ketentuan Layanan resmi dari sistem.',
                content: apiData.content
              }]);
            }
          } else {
            setTosData(TOS_DATA);
          }
        }
      } catch (err) {
        if (isMounted) setTosData(TOS_DATA);
      }
    }
    loadTermsContent();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    try {
      const savedAcc = localStorage.getItem('smarthomecare_tos_accepted');
      if (savedAcc === 'true') {
        setIsAccepted(true);
      }
      const initExpanded = {};
      tosData.forEach((s) => {
        initExpanded[s.id] = true;
      });
      setExpandedSections(initExpanded);
    } catch {
      // Ignore
    }
  }, [tosData]);

  const filteredSections = useMemo(() => {
    return tosData.filter((item) => {
      const matchesCategory =
        selectedCategory === 'semua' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (item.title && item.title.toLowerCase().includes(q)) ||
        (item.summary && item.summary.toLowerCase().includes(q)) ||
        (item.content && item.content.toLowerCase().includes(q)) ||
        `pasal ${item.number || ''}`.includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [tosData, searchQuery, selectedCategory]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;
      for (const section of tosData) {
        const el = document.getElementById(section.id);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section.id);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [tosData]);

  const toggleSection = (id) => {
    setExpandedSections((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const expandAll = () => {
    const all = {};
    tosData.forEach((s) => (all[s.id] = true));
    setExpandedSections(all);
  };

  const collapseAll = () => {
    setExpandedSections({});
  };

  const handleToggleAccept = () => {
    const nextVal = !isAccepted;
    setIsAccepted(nextVal);
    try {
      localStorage.setItem('smarthomecare_tos_accepted', String(nextVal));
    } catch {
      // Ignore
    }
  };

  const scrollToSection = (id) => {
    setActiveSection(id);
    setExpandedSections((prev) => ({ ...prev, [id]: true }));
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -90;
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-emerald-50/30 font-sans text-slate-800 antialiased pb-20">
      {/* Hero Banner Header */}
      <header className="relative overflow-hidden bg-gradient-to-br from-emerald-500 via-teal-600 to-emerald-700 text-white pt-12 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

        <div className="relative mx-auto max-w-7xl">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-emerald-200 hover:text-white transition-colors mb-6 group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Kembali ke Beranda
          </Link>

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/20 text-emerald-100 text-xs font-semibold uppercase tracking-wider mb-4">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                Legal & Governance
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                Terms of Service <span className="text-emerald-300 font-normal">| Syarat & Ketentuan</span>
              </h1>
              <p className="mt-3 text-emerald-100 text-sm sm:text-base leading-relaxed">
                Panduan resmi hak, kewajiban, tata cara pemesanan, dan jaminan keamanan layanan kesehatan medis di rumah bersama SmartHomeCare.
              </p>

              <div className="mt-5 flex flex-wrap items-center gap-4 text-xs text-emerald-200">
                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                  <FileText className="w-3.5 h-3.5" />
                  10 Pasal Utama
                </span>
                <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg border border-white/10">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Sesuai UU PDP No. 27/2022
                </span>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-8 relative max-w-3xl">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kata kunci... (contoh: refund, cancel, pembatalan, denda)"
                className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-white text-slate-900 text-sm sm:text-base font-medium placeholder-slate-400 shadow-xl border-0 focus:ring-2 focus:ring-emerald-400 outline-none transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full bg-slate-100 text-xs"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Category Filter Chips */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 mb-2">
        <div className="bg-white rounded-2xl p-5 shadow-md border border-emerald-100 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20 ring-2 ring-emerald-200'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 hover:shadow-sm'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs font-semibold text-emerald-600 bg-emerald-50/50 px-3 py-2 rounded-xl">
            <button onClick={expandAll} className="hover:text-emerald-800 transition-colors inline-flex items-center gap-1.5">
              <Eye className="w-3.5 h-3.5" /> Buka Semua
            </button>
            <span className="text-emerald-300">|</span>
            <button onClick={collapseAll} className="hover:text-emerald-800 transition-colors inline-flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5" /> Tutup Semua
            </button>
          </div>
        </div>
      </div>

      {/* Main Dashboard Layout */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8 items-start">
          {/* Sticky Sidebar */}
          <aside className="hidden lg:block sticky top-6 bg-white rounded-2xl border border-emerald-100 shadow-sm p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-emerald-100 pb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Daftar Pasal
              </h3>
              <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">
                {filteredSections.length} / {tosData.length}
              </span>
            </div>

            <nav className="space-y-1 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
              {tosData.map((section) => {
                const isActive = activeSection === section.id;
                const isFilteredOut = !filteredSections.some((s) => s.id === section.id);
                return (
                  <button
                    key={section.id}
                    onClick={() => scrollToSection(section.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-left text-xs font-medium transition-all ${
                      isFilteredOut ? 'opacity-40 hover:opacity-80' : ''
                    } ${
                      isActive
                        ? 'bg-emerald-50 text-emerald-700 font-bold border-l-4 border-emerald-600 shadow-sm'
                        : 'text-slate-600 hover:bg-emerald-50/50 hover:text-emerald-700'
                    }`}
                  >
                    <span className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isActive ? 'bg-emerald-600 text-white' : 'bg-emerald-100 text-emerald-600'
                    }`}>
                      {section.number}
                    </span>
                    <span className="truncate flex-1">{section.title}</span>
                  </button>
                );
              })}
            </nav>

            {/* Status Box */}
            <div className="pt-3 border-t border-emerald-100">
              <div className={`p-3 rounded-xl border text-xs leading-tight transition-all ${
                isAccepted
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-emerald-50/50 border-emerald-100 text-slate-600'
              }`}>
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  {isAccepted ? (
                    <><CheckCircle2 className="w-4 h-4 text-emerald-600" /> Status: Menyetujui</>
                  ) : (
                    <><HelpCircle className="w-4 h-4 text-slate-400" /> Status: Belum Disetujui</>
                  )}
                </div>
                <p className="text-[11px] opacity-90">
                  {isAccepted
                    ? 'Anda telah menandai bahwa Anda menerima Terms of Service ini.'
                    : 'Klik tombol di bagian bawah untuk menandai persetujuan.'}
                </p>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="space-y-6 min-w-0">
            {searchQuery && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-2xl text-sm flex items-center justify-between">
                <span>
                  Menampilkan hasil untuk: <strong>"{searchQuery}"</strong> ({filteredSections.length} pasal)
                </span>
                <button onClick={() => setSearchQuery('')} className="text-xs text-emerald-700 underline hover:text-emerald-900 font-semibold">
                  Reset
                </button>
              </div>
            )}

            {filteredSections.length === 0 ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-emerald-100 shadow-sm">
                <AlertCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-800">Tidak ada pasal yang cocok</h3>
                <p className="text-sm text-slate-500 mt-1">Coba gunakan kata kunci lain atau pilih kategori "Semua Pasal".</p>
                <button
                  onClick={() => { setSearchQuery(''); setSelectedCategory('semua'); }}
                  className="mt-4 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-500 transition-all"
                >
                  Lihat Semua Ketentuan
                </button>
              </div>
            ) : (
              filteredSections.map((section) => {
                const IconComponent = section.icon || ShieldCheck;
                const isExpanded = !!expandedSections[section.id];
                return (
                  <article
                    key={section.id}
                    id={section.id}
                    className={`bg-white rounded-3xl border transition-all duration-200 overflow-hidden ${
                      activeSection === section.id
                        ? 'border-emerald-500 shadow-md ring-1 ring-emerald-200'
                        : 'border-emerald-100/80 shadow-sm hover:border-emerald-200'
                    }`}
                  >
                    {/* Accordion Header */}
                    <div
                      onClick={() => toggleSection(section.id)}
                      className="p-6 cursor-pointer select-none flex items-start justify-between gap-4 hover:bg-emerald-50/30 transition-colors"
                    >
                      <div className="flex items-start gap-4">
                        <div className="flex-shrink-0 w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold text-sm">
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-100">
                              Pasal {section.number}
                            </span>
                            <span className="text-xs text-slate-400 font-medium">• {section.categoryName}</span>
                          </div>
                          <h2 className="text-lg sm:text-xl font-bold text-slate-900">{section.title}</h2>
                          <p className="mt-1 text-xs sm:text-sm text-slate-500 leading-relaxed">{section.summary}</p>
                        </div>
                      </div>
                      <div className="p-2 text-emerald-400 flex-shrink-0">
                        {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                      </div>
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="px-6 pb-6 pt-2 border-t border-emerald-100 bg-emerald-50/20">
                        <div className="prose prose-slate max-w-none text-sm leading-relaxed text-slate-600 whitespace-pre-line font-normal">
                          {section.content.trim()}
                        </div>
                      </div>
                    )}
                  </article>
                );
              })
            )}

            {/* Acceptance Box */}
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-500/50 mt-12 flex flex-col sm:flex-row items-center justify-between gap-6">
              <div className="space-y-2 text-center sm:text-left">
                <div className="inline-flex items-center gap-2 text-emerald-200 text-xs font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  Konfirmasi Pengguna
                </div>
                <h3 className="text-xl font-bold text-white">Apakah Anda menyetujui Ketentuan Layanan ini?</h3>
                <p className="text-xs sm:text-sm text-emerald-100 max-w-xl">
                  Dengan menandai persetujuan, Anda menyatakan memahami seluruh aturan operasional dan kerahasiaan layanan kesehatan SmartHomeCare.
                </p>
              </div>
              <button
                onClick={handleToggleAccept}
                className={`flex-shrink-0 px-6 py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg ${
                  isAccepted
                    ? 'bg-white text-emerald-700 hover:bg-emerald-50'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-white'
                }`}
              >
                {isAccepted ? (
                  <><CheckCircle2 className="w-5 h-5" /> Telah Disetujui</>
                ) : (
                  <><CheckCircle2 className="w-5 h-5" /> Saya Setuju & Paham</>
                )}
              </button>
            </div>

            {/* Help Card */}
            <div className="bg-white rounded-3xl border border-emerald-100 p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">Punya pertanyaan seputar Ketentuan Layanan?</h4>
                  <p className="text-xs sm:text-sm text-slate-500">Tim Bantuan Hukum & Layanan Pelanggan kami siap membantu Anda 24/7.</p>
                </div>
              </div>
              <a href="mailto:info@smarthomecare.id" className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-all flex-shrink-0">
                Hubungi Support
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
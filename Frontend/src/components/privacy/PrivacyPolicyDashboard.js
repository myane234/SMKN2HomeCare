'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Lock, FileText, PhoneCall, Mail } from 'lucide-react';
import api from '@/services/api';

const SIMPLE_DEFAULT_PRIVACY = [
  {
    title: '1. Pengumpulan Data',
    content: 'Kami mengumpulkan data dasar seperti nama, nomor telepon, alamat rumah, serta informasi kesehatan yang Anda berikan saat mendaftar atau memesan layanan homecare.'
  },
  {
    title: '2. Penggunaan Data',
    content: 'Data Anda digunakan khusus untuk memproses pemesanan layanan kesehatan, menghubungkan Anda dengan Tenaga Kesehatan (Nakes) yang bertugas, dan memberikan notifikasi status pesanan.'
  },
  {
    title: '3. Kerahasiaan & Keamanan Data',
    content: 'Kerahasiaan rekam medis dan data pribadi Anda adalah prioritas utama kami. Seluruh data disimpan dengan sistem enkripsi yang aman dan hanya dapat diakses oleh Nakes yang menangani Anda.'
  },
  {
    title: '4. Pembagian Informasi',
    content: 'Kami tidak akan pernah menjual atau membagikan data pribadi Anda kepada pihak ketiga untuk kepentingan komersial. Data hanya diberikan kepada Nakes bertugas atau jika diwajibkan oleh ketentuan hukum.'
  },
  {
    title: '5. Hak & Pengaturan Profil',
    content: 'Anda berhak memperbarui data pribadi Anda kapan saja melalui menu Profil di aplikasi atau meminta bantuan penutupan akun kepada tim layanan pelanggan kami.'
  }
];

export default function PrivacyPolicyDashboard() {
  const [sections, setSections] = useState(SIMPLE_DEFAULT_PRIVACY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadPrivacy() {
      try {
        setLoading(true);
        const endpoints = [
          '/api/legalitas/detail/kebijakan-privasi',
          '/api/resource/content/kebijakan-privasi',
          '/api/kebijakan-privasi',
          '/api/privacy-policy'
        ];

        let apiData = null;
        for (const ep of endpoints) {
          try {
            const res = await api.get(ep, { validateStatus: (s) => s < 500 });
            if (res.status === 200 && res.data) {
              const contentObj = res.data?.data || res.data;
              if (contentObj && (Array.isArray(contentObj) || contentObj?.content || Array.isArray(contentObj?.sections))) {
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
              setSections(apiData.map((item, idx) => ({
                title: item.title || item.judul || `Pasal ${idx + 1}`,
                content: item.content || item.isi || item.summary || ''
              })));
            } else if (Array.isArray(apiData?.sections)) {
              setSections(apiData.sections.map((item, idx) => ({
                title: item.title || item.judul || `Pasal ${idx + 1}`,
                content: item.content || item.isi || item.summary || ''
              })));
            } else if (apiData?.content || apiData?.text) {
              setSections([
                {
                  title: apiData.title || 'Kebijakan Privasi SmartHomeCare',
                  content: apiData.content || apiData.text
                }
              ]);
            }
          } else {
            setSections(SIMPLE_DEFAULT_PRIVACY);
          }
        }
      } catch (err) {
        if (isMounted) setSections(SIMPLE_DEFAULT_PRIVACY);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadPrivacy();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Tombol Kembali */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Beranda
        </Link>

        {/* Card Utama */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-md p-6 sm:p-10 space-y-8">
          {/* Header */}
          <div className="border-b border-slate-100 pb-6 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold uppercase tracking-wider mb-3">
              <ShieldCheck className="w-4 h-4" />
              Perlindungan Data
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Kebijakan Privasi
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-2">
              Ringkasan singkat dan jelas tentang cara kami menjaga privasi serta data kesehatan Anda di SmartHomeCare.
            </p>
          </div>

          {/* List Konten */}
          {loading ? (
            <div className="text-center py-8 text-xs text-slate-400">
              Memuat Kebijakan Privasi...
            </div>
          ) : (
            <div className="space-y-6">
              {sections.map((sec, idx) => (
                <div key={idx} className="bg-slate-50/70 border border-slate-100 rounded-2xl p-5 transition-all hover:bg-slate-50">
                  <h3 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    {sec.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pl-4">
                    {sec.content}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Footer Card / Kontak Bantuan */}
          <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Data Anda terlindungi aman bersama SmartHomeCare.</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="mailto:privacy@smarthomecare.id" className="hover:text-emerald-600 flex items-center gap-1 font-semibold">
                <Mail className="w-3.5 h-3.5" /> privacy@smarthomecare.id
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

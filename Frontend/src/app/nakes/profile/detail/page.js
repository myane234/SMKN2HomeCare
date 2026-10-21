"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getProfileMe } from "@/services/profileService";
import { getBankList } from "@/services/nakesCompletionService";
import { resolveImageUrl } from "@/services/resolveImage";
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  CreditCard,
  MapPin,
  Building2,
  Users,
  Loader2,
} from "lucide-react";

export default function NakesProfileDetailPage() {
  const [profile, setProfile] = useState(null);
  const [bankList, setBankList] = useState([]);
  const [loading, setLoading] = useState(true);

  const unwrapData = (value) => {
    let current = value;
    for (let i = 0; i < 6; i += 1) {
      if (
        current &&
        typeof current === "object" &&
        !Array.isArray(current) &&
        Object.prototype.hasOwnProperty.call(current, "data")
      ) {
        current = current.data;
      } else {
        break;
      }
    }
    return current;
  };

  useEffect(() => {
    Promise.allSettled([getProfileMe(), getBankList()])
      .then(([resProfile, resBanks]) => {
        if (resProfile.status === "fulfilled") {
          setProfile(unwrapData(resProfile.value));
        }
        if (resBanks.status === "fulfilled") {
          setBankList(resBanks.value || []);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const tm = profile?.tenaga_medis || profile?.nakes || profile || null;
  const user = profile?.user || null;
  const pasien = profile?.pasien || null;

  const nama =
    tm?.nama_lengkap ||
    tm?.nama ||
    user?.name ||
    pasien?.nama_lengkap ||
    "Tenaga Medis";
  const noHp =
    tm?.no_hp || tm?.no_telp || user?.phone || user?.no_hp || "-";
  const email = user?.email || profile?.email || tm?.email || "-";
  const alamat =
    tm?.alamat_lengkap ||
    tm?.alamat ||
    user?.alamat ||
    pasien?.alamat_utama ||
    "-";
  const nik = tm?.nik || pasien?.nik || user?.nik || "-";
  
  // Jenis Kelamin
  const jenisKelamin =
    tm?.jenis_kelamin ||
    user?.jenis_kelamin ||
    pasien?.jenis_kelamin ||
    profile?.jenis_kelamin ||
    "-";

  const foto =
    tm?.pas_foto ||
    tm?.foto ||
    profile?.avatar ||
    user?.avatar ||
    pasien?.avatar ||
    null;

  // Data Bank & Rekening
  let namaBank =
    tm?.nama_bank ||
    tm?.bank?.nama_bank ||
    tm?.bank?.nama ||
    tm?.bank_name ||
    tm?.rekening_bank?.nama_bank ||
    null;

  if (!namaBank && tm?.id_bank) {
    const matchedBank = bankList.find(
      (b) => String(b?.id || b?.id_bank) === String(tm.id_bank)
    );
    if (matchedBank) {
      namaBank = matchedBank?.nama_bank || matchedBank?.nama || matchedBank?.bank_name;
    }
  }

  if (!namaBank) {
    namaBank = tm?.id_bank ? `Bank (ID: ${tm.id_bank})` : "-";
  }

  const noRekening =
    tm?.no_rekening || tm?.rekening_bank?.no_rekening || "-";

  const atasNamaBank =
    tm?.nama_pemilik_rekening ||
    tm?.atas_nama_rekening ||
    tm?.rekening_bank?.atas_nama ||
    nama;

  const getInitial = (name) => {
    if (!name) return "N";
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className="min-h-screen bg-slate-100/80 pb-16">
      {/* Header Banner */}
      <div className="bg-blue-600 pt-6 pb-20 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto flex items-center gap-3 text-white">
          <Link
            href="/nakes/profile"
            className="p-1.5 -ml-1.5 rounded-xl hover:bg-white/10 transition"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-xl font-bold tracking-tight">Profile Nakes</h1>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-2xl mx-auto px-4 -mt-12 space-y-6">
        {/* Card Data Diri */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/60 space-y-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <User className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-slate-900 text-base">Data Diri</h2>
          </div>

          {/* Foto Profil */}
          <div className="space-y-2">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              FOTO PROFIL
            </p>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-blue-600 text-white flex items-center justify-center font-bold text-xl shrink-0 border-2 border-white shadow-xs">
                {foto ? (
                  <img
                    src={resolveImageUrl(foto)}
                    alt={nama}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  getInitial(nama)
                )}
              </div>
              <div>
                <p className="font-bold text-slate-900 text-base">{nama}</p>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            {/* EMAIL */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400" /> EMAIL
              </label>
              <input
                type="text"
                readOnly
                value={email}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-slate-800 text-sm font-medium focus:outline-none cursor-not-allowed"
              />
            </div>

            {/* NAMA LENGKAP */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" /> NAMA LENGKAP
              </label>
              <input
                type="text"
                readOnly
                value={nama}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-slate-800 text-sm font-medium focus:outline-none cursor-not-allowed"
              />
            </div>

            {/* NO. HANDPHONE */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <Phone className="w-3.5 h-3.5 text-slate-400" /> NO. HANDPHONE
              </label>
              <input
                type="text"
                readOnly
                value={noHp}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-slate-800 text-sm font-medium focus:outline-none cursor-not-allowed"
              />
            </div>

            {/* NIK */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" /> NIK (KTP)
              </label>
              <input
                type="text"
                readOnly
                value={nik}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-slate-800 text-sm font-medium focus:outline-none cursor-not-allowed"
              />
            </div>

            {/* JENIS KELAMIN */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <Users className="w-3.5 h-3.5 text-slate-400" /> JENIS KELAMIN
              </label>
              <input
                type="text"
                readOnly
                value={jenisKelamin}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-slate-800 text-sm font-medium focus:outline-none cursor-not-allowed"
              />
            </div>

            {/* ALAMAT UTAMA */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> ALAMAT UTAMA
              </label>
              <textarea
                readOnly
                rows={2}
                value={alamat}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-slate-800 text-sm font-medium focus:outline-none cursor-not-allowed resize-none"
              />
            </div>
          </div>
        </div>

        {/* Card Rekening Bank */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/60 space-y-6">
          <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
            <div className="w-7 h-7 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
            <h2 className="font-bold text-slate-900 text-base">Rekening Bank (Payout)</h2>
          </div>

          <div className="space-y-4">
            {/* NAMA BANK */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <Building2 className="w-3.5 h-3.5 text-slate-400" /> NAMA BANK
              </label>
              <input
                type="text"
                readOnly
                value={namaBank}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-slate-800 text-sm font-medium focus:outline-none cursor-not-allowed"
              />
            </div>

            {/* NOMOR REKENING */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <CreditCard className="w-3.5 h-3.5 text-slate-400" /> NOMOR REKENING
              </label>
              <input
                type="text"
                readOnly
                value={noRekening}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-slate-800 text-sm font-medium focus:outline-none cursor-not-allowed"
              />
            </div>

            {/* ATAS NAMA REKENING */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
                <User className="w-3.5 h-3.5 text-slate-400" /> ATAS NAMA REKENING
              </label>
              <input
                type="text"
                readOnly
                value={atasNamaBank}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl text-slate-800 text-sm font-medium focus:outline-none cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
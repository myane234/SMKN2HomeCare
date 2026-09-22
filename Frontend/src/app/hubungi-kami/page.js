"use client";

import { useState, useEffect } from "react";
import { createHubungiKami, getHubungiKamiInfo } from "@/services/hubungiKamiService";
import { getUserInfoForUlasan } from "@/services/ulasanService";
import { getGlobalConfig } from "@/services/configService";
import { FiMail, FiPhone, FiMapPin, FiSend, FiMessageSquare, FiCheckCircle, FiAlertCircle, FiLock, FiClock } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

function verifyIndonesianPhone(rawPhone) {
  if (!rawPhone || typeof rawPhone !== "string") {
    return { valid: false, message: "Nomor WhatsApp wajib diisi." };
  }

  let clean = rawPhone.replace(/\D/g, "");

  if (clean.startsWith("628")) {
    clean = "08" + clean.slice(3);
  } else if (clean.startsWith("6208")) {
    clean = "08" + clean.slice(4);
  } else if (clean.startsWith("8")) {
    clean = "0" + clean;
  }

  if (!clean.startsWith("08")) {
    return {
      valid: false,
      message: "Nomor WhatsApp harus diawali dengan 08 (contoh: 081234567890)."
    };
  }

  if (clean.length < 10 || clean.length > 15) {
    return {
      valid: false,
      message: `Panjang nomor WhatsApp minimal 10 sampai 15 digit (saat ini ${clean.length} digit).`
    };
  }

  return {
    valid: true,
    normalized: clean
  };
}

function formatWaNumber(phoneStr) {
  if (!phoneStr) return "";
  let clean = phoneStr.replace(/\D/g, "");
  if (clean.startsWith("6208")) {
    clean = "62" + clean.slice(4);
  } else if (clean.startsWith("08")) {
    clean = "62" + clean.slice(1);
  } else if (clean.startsWith("8")) {
    clean = "62" + clean;
  }
  return clean;
}

export default function HubungiKamiPage() {
  const [config, setConfig] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Auth User Status
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState(null);

  // Cooldown Submit State (Proteksi spam klik)
  const [cooldown, setCooldown] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = sessionStorage.getItem("hubungi_cooldown_until");
        if (saved) {
          const remaining = Math.ceil((Number(saved) - Date.now()) / 1000);
          if (remaining > 0) return remaining;
          sessionStorage.removeItem("hubungi_cooldown_until");
        }
      } catch {}
    }
    return 0;
  });

  // Live validation states
  const [phoneFeedback, setPhoneFeedback] = useState(null);

  const [form, setForm] = useState({
    nama: "",
    email: "",
    no_hp: "",
    subjek: "",
    pesan: "",
    website_hp: "" // Honeypot field (anti-bot)
  });

  // Interval hitung mundur cooldown submit
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          sessionStorage.removeItem("hubungi_cooldown_until");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // 1. Load User Profile jika sudah login
  useEffect(() => {
    async function checkAuth() {
      try {
        const uInfo = await getUserInfoForUlasan();
        if (uInfo && (uInfo.email || uInfo.nama_pengulas)) {
          setIsLoggedIn(true);
          setUserInfo(uInfo);
          setForm((prev) => ({
            ...prev,
            nama: uInfo.nama_pengulas || prev.nama,
            email: uInfo.email || prev.email
          }));
        } else {
          setIsLoggedIn(false);
        }
      } catch {
        setIsLoggedIn(false);
      }
    }
    checkAuth();
  }, []);

  // 2. Load Config Halaman
  useEffect(() => {
    async function loadConfig() {
      try {
        const hubungiData = await getHubungiKamiInfo();
        if (hubungiData) {
          setConfig({
            telepon: hubungiData.hubungi_phone,
            email: hubungiData.hubungi_email,
            whatsapp: hubungiData.hubungi_whatsapp,
            alamat: hubungiData.hubungi_address,
            jam_operasional: hubungiData.hubungi_jam_operasional,
            heading: hubungiData.hubungi_heading,
            description: hubungiData.hubungi_description,
          });
        } else {
          const data = await getGlobalConfig();
          setConfig(data || {});
        }
      } catch (err) {
        console.error("Gagal memuat konfigurasi kontak:", err);
      }
    }
    loadConfig();
  }, []);

  // Live Phone Validation Handler - Khusus Angka
  const handlePhoneChange = (val) => {
    const numericVal = val.replace(/\D/g, "");
    setForm((prev) => ({ ...prev, no_hp: numericVal }));
    if (!numericVal.trim()) {
      setPhoneFeedback(null);
      return;
    }
    const check = verifyIndonesianPhone(numericVal);
    setPhoneFeedback(check);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    // 1. Proteksi Honeypot (Anti-Bot)
    if (form.website_hp) {
      setSuccessMsg("Pesan Anda berhasil terkirim! Tim medis kami akan segera menghubungi Anda.");
      setForm((prev) => ({
        ...prev,
        subjek: "",
        pesan: "",
        website_hp: ""
      }));
      return;
    }

    // 2. Cek Cooldown Submit
    if (cooldown > 0) {
      setErrorMsg(`Mohon tunggu ${cooldown} detik sebelum mengirim pesan kembali.`);
      return;
    }

    if (!form.nama.trim() || !form.email.trim() || !form.pesan.trim()) {
      setErrorMsg("Mohon lengkapi nama, email, dan pesan Anda.");
      return;
    }

    // 3. Batasan Karakter Pesan (Minimal 50 Karakter)
    if (form.pesan.trim().length < 50) {
      setErrorMsg(`Isi pesan minimal 50 karakter agar tim kami dapat memahami kebutuhan Anda dengan jelas (saat ini ${form.pesan.trim().length}/50 karakter).`);
      return;
    }

    // 4. Verifikasi Nomor Telepon / WhatsApp
    if (form.no_hp.trim()) {
      const phoneCheck = verifyIndonesianPhone(form.no_hp.trim());
      if (!phoneCheck.valid) {
        setErrorMsg(phoneCheck.message);
        return;
      }
    } else {
      setErrorMsg("Mohon isi nomor WhatsApp Anda agar tim kami dapat menghubungi.");
      return;
    }

    try {
      setSubmitting(true);
      await createHubungiKami(form);
      setSuccessMsg("Pesan Anda berhasil terkirim! Tim medis kami akan segera menghubungi Anda.");
      
      // Aktifkan cooldown 60 detik setelah pesan berhasil terkirim
      const cooldownSec = 60;
      setCooldown(cooldownSec);
      if (typeof window !== "undefined") {
        sessionStorage.setItem("hubungi_cooldown_until", String(Date.now() + cooldownSec * 1000));
      }

      setForm((prev) => ({
        nama: isLoggedIn && userInfo?.nama_pengulas ? userInfo.nama_pengulas : "",
        email: isLoggedIn && userInfo?.email ? userInfo.email : "",
        no_hp: "",
        subjek: "",
        pesan: "",
        website_hp: ""
      }));
      setPhoneFeedback(null);
    } catch {
      setErrorMsg("Gagal mengirim pesan. Silakan coba lagi atau hubungi langsung via WhatsApp.");
    } finally {
      setSubmitting(false);
    }
  };

  const phone = config.telepon || config.hubungi_phone || config.phone || "0812-3456-7890";
  const email = config.email || config.hubungi_email || "kontak@smarthomecare.id";
  const address = config.alamat || config.hubungi_address || "Jl. Kesehatan Medis No. 123, Jakarta";
  const whatsapp = config.whatsapp || config.hubungi_whatsapp || "0812-3456-7890";

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 py-6 sm:py-10 px-3.5 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
        
        {/* Header */}
        <div className="text-center space-y-2 max-w-xl mx-auto">
          <span className="inline-flex rounded-full bg-sky-100 px-3.5 py-1 text-xs font-bold tracking-wider text-sky-700 uppercase">
            HUBUNGI KAMI
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {config.heading || "Layanan Informasi & Bantuan"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            {config.description || "Punya pertanyaan mengenai layanan homecare? Hubungi tim medis SmartHomeCare melalui form atau kontak resmi kami."}
          </p>
        </div>

        {/* 2-Column Content Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          
          {/* Column 1: Contact Cards */}
          <div>
            <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold shrink-0">
                  <FiPhone size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-slate-800">Telepon Official</h3>
                  <a
                    href={`tel:${phone.startsWith('0') ? '+62' + phone.replace(/\D/g, '').slice(1) : phone.replace(/[^0-9+]/g, '')}`}
                    className="text-xs text-slate-600 hover:text-sky-600 font-medium hover:underline mt-0.5 inline-block truncate"
                    title="Klik untuk menelepon"
                  >
                    {phone}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3 border-t border-slate-100 pt-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                  <FaWhatsapp size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-slate-800">WhatsApp Fast Response</h3>
                  <a
                    href={`https://wa.me/${formatWaNumber(whatsapp)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-slate-600 hover:text-emerald-600 font-medium hover:underline mt-0.5 inline-block truncate"
                    title="Klik untuk menghubungi via WhatsApp"
                  >
                    {whatsapp}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3 border-t border-slate-100 pt-3">
                <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
                  <FiMail size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-slate-800">Email Resmi</h3>
                  <a
                    href={`mailto:${email}`}
                    className="text-xs text-slate-600 hover:text-blue-600 font-medium hover:underline mt-0.5 inline-block truncate"
                    title="Klik untuk kirim email"
                  >
                    {email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3 border-t border-slate-100 pt-3">
                <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold shrink-0">
                  <FiMapPin size={18} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-slate-800">Alamat Kantor</h3>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{address}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2 & 3: Form Kirim Pesan */}
          <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-6 shadow-2xs space-y-4">
            <h2 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
              <FiMessageSquare className="text-sky-600" /> Kirim Pesan Langsung
            </h2>

            {successMsg && (
              <div className="p-3 text-xs bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 font-medium">
                {successMsg}
              </div>
            )}

            {errorMsg && (
              <div className="p-3 text-xs bg-rose-50 text-rose-700 rounded-xl border border-rose-200 font-medium">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nama Lengkap */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Nama Lengkap *</span>
                    {isLoggedIn && (
                      <span className="text-[10px] text-sky-600 font-medium bg-sky-50 px-2 py-0.5 rounded-md">
                        Auto dari Akun
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    placeholder="Nama Lengkap Anda"
                    value={form.nama}
                    onChange={(e) => setForm({ ...form, nama: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none transition"
                    required
                  />
                </div>

                {/* Alamat Email */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                    <span>Alamat Email *</span>
                    {isLoggedIn && (
                      <span className="text-[10px] text-slate-400 font-normal flex items-center gap-1">
                        <FiLock className="text-[9px]" /> Terkunci Akun
                      </span>
                    )}
                  </label>
                  <input
                    type="email"
                    placeholder="nama@domain.com"
                    value={form.email}
                    disabled={isLoggedIn}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-xs transition ${
                      isLoggedIn
                        ? "border-slate-200 bg-slate-100/80 text-slate-500 font-medium cursor-not-allowed"
                        : "border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-sky-500 focus:outline-none"
                    } focus:outline-none`}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Nomor WhatsApp / HP */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nomor WhatsApp *
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Contoh: 081234567890"
                    value={form.no_hp}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (
                        ["Backspace", "Delete", "Tab", "ArrowLeft", "ArrowRight", "Home", "End", "Enter"].includes(
                          e.key
                        ) ||
                        (e.ctrlKey || e.metaKey)
                      ) {
                        return;
                      }
                      if (!/^[0-9]$/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    className={`w-full rounded-xl border px-3.5 py-2.5 text-xs transition ${
                      phoneFeedback && !phoneFeedback.valid
                        ? "border-rose-400 bg-rose-50/30 text-rose-900 focus:border-rose-500"
                        : phoneFeedback && phoneFeedback.valid
                        ? "border-emerald-400 bg-emerald-50/30 text-emerald-900 focus:border-emerald-500"
                        : "border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-sky-500"
                    } focus:outline-none`}
                    required
                  />
                  {phoneFeedback && !phoneFeedback.valid && (
                    <p className="mt-1 text-[11px] text-rose-600 flex items-center gap-1">
                      <FiAlertCircle className="shrink-0 text-xs" /> {phoneFeedback.message}
                    </p>
                  )}
                  {phoneFeedback && phoneFeedback.valid && (
                    <p className="mt-1 text-[11px] text-emerald-600 flex items-center gap-1">
                      <FiCheckCircle className="shrink-0 text-xs" /> Nomor WhatsApp valid
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Subjek Pesan</label>
                  <input
                    type="text"
                    placeholder="Pertanyaan seputar layanan..."
                    value={form.subjek}
                    onChange={(e) => setForm({ ...form, subjek: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Isi Pesan *</label>
                <textarea
                  rows={4}
                  placeholder="Tuliskan pertanyaan atau kebutuhan perawatan Anda..."
                  value={form.pesan}
                  onChange={(e) => setForm({ ...form, pesan: e.target.value })}
                  className={`w-full rounded-xl border p-3 text-xs focus:outline-none transition ${
                    form.pesan.trim().length > 0 && form.pesan.trim().length < 50
                      ? "border-amber-300 focus:border-amber-500 bg-amber-50/20"
                      : "border-slate-200 focus:border-sky-500"
                  }`}
                  required
                />
                {/* Batasan Karakter Pesan (Minimal 50 Karakter) */}
                <div className="flex items-center justify-between mt-1.5 text-[11px]">
                  <span className={form.pesan.trim().length >= 50 ? "text-emerald-600 font-medium" : "text-slate-400"}>
                    {form.pesan.trim().length >= 50 ? "✓ Panjang pesan memenuhi syarat (min. 50)" : "Minimal 50 karakter"}
                  </span>
                  <span
                    className={`font-mono text-[11px] ${
                      form.pesan.trim().length === 0
                        ? "text-slate-400"
                        : form.pesan.trim().length < 50
                        ? "text-amber-600 font-semibold"
                        : "text-emerald-600 font-medium"
                    }`}
                  >
                    {form.pesan.trim().length} / 50 karakter
                  </span>
                </div>
              </div>

              {/* Honeypot Field: Tersembunyi dari manusia untuk menjebak bot spam */}
              <div className="hidden" aria-hidden="true" style={{ display: "none" }}>
                <label htmlFor="website_hp">Jangan isi input ini jika Anda manusia</label>
                <input
                  type="text"
                  id="website_hp"
                  name="website_hp"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.website_hp || ""}
                  onChange={(e) => setForm({ ...form, website_hp: e.target.value })}
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={submitting || cooldown > 0 || form.pesan.trim().length < 50}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-6 py-3 sm:py-2.5 text-xs font-bold text-white shadow-xs hover:bg-sky-700 transition active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FiSend />{" "}
                  {submitting
                    ? "Mengirim..."
                    : cooldown > 0
                    ? `Tunggu (${cooldown}s)`
                    : "Kirim Pesan"}
                </button>

                {cooldown > 0 && (
                  <span className="text-[11px] text-amber-700 font-medium flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
                    <FiClock className="shrink-0" /> Mohon tunggu {cooldown} detik sebelum mengirim pesan kembali.
                  </span>
                )}
              </div>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}

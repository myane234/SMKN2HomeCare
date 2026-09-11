"use client";

import { useState, useEffect } from "react";
import { createHubungiKami, getHubungiKamiInfo } from "@/services/hubungiKamiService";
import { getGlobalConfig } from "@/services/configService";
import { getProfileFromCookies, fetchAndStoreProfile } from "@/services/profileService";
import { getAuthToken } from "@/services/cookieHelper";
import { FiMail, FiPhone, FiMapPin, FiSend, FiMessageSquare, FiAlertCircle, FiCheckCircle, FiUser, FiLock } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

export default function HubungiKamiPage() {
  const [config, setConfig] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Auth State untuk auto-pull data profile
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [originalEmail, setOriginalEmail] = useState("");
  const [emailMismatchWarning, setEmailMismatchWarning] = useState("");

  const [form, setForm] = useState({
    nama: "",
    email: "",
    no_hp: "",
    subjek: "",
    pesan: ""
  });

  const [emailValidationError, setEmailValidationError] = useState("");

  // Helper: validasi kualitas email agar bukan email asal-asalan / dummy
  const validateEmailQuality = (emailVal) => {
    if (!emailVal || !emailVal.trim()) return { valid: false, msg: "Alamat email wajib diisi." };
    const trimmed = emailVal.trim().toLowerCase();

    // Standard RFC pattern
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(trimmed)) {
      return { valid: false, msg: "Format email tidak valid (contoh: nama@domain.com)." };
    }

    const [userPart, domainPart] = trimmed.split("@");

    if (!userPart || userPart.length < 2) {
      return { valid: false, msg: "Nama pengguna email terlalu pendek (minimal 2 karakter sebelum @)." };
    }

    if (domainPart.includes("..") || domainPart.startsWith(".") || domainPart.endsWith(".")) {
      return { valid: false, msg: "Domain email tidak valid." };
    }

    const ext = domainPart.split(".").pop();
    if (!ext || ext.length < 2 || !/^[a-zA-Z]+$/.test(ext)) {
      return { valid: false, msg: "Ekstensi domain email tidak valid (contoh: .com, .id, .org)." };
    }

    // Deteksi domain dummy / palsu
    const dummyDomains = ["test.com", "example.com", "sample.com", "fake.com", "dummy.com", "mailinator.com", "tempmail.com", "123.com", "abc.com", "asdf.com", "xyz.com"];
    if (dummyDomains.includes(domainPart)) {
      return { valid: false, msg: "Domain email ini terdeteksi sebagai email dummy. Mohon gunakan email aktif Anda." };
    }

    // Deteksi keyboard smash / nama acak (misal: asdasd@, qwerqwer@, 11111@)
    if (/^(asdf|qwer|zxcv|1234|dummy|test)/i.test(userPart) && userPart.length <= 6) {
      return { valid: false, msg: "Alamat email terdeteksi acak/tidak aktif. Harap masukkan email yang sebenarnya." };
    }

    return { valid: true, msg: "" };
  };

  // Helper: validasi & auto-format nomor WhatsApp Indonesia (hanya angka)
  const formatAndValidateWaNumber = (value) => {
    let cleaned = String(value || "").replace(/[^0-9]/g, "");
    if (cleaned.startsWith("62")) cleaned = "0" + cleaned.slice(2);
    if (cleaned.startsWith("8")) cleaned = "0" + cleaned;
    return cleaned;
  };

  const validateWaNumber = (value) => {
    if (!value) return { valid: true, msg: "" };
    const digits = value.replace(/[^0-9]/g, "");
    if (digits.length < 10) return { valid: false, msg: "Nomor WhatsApp terlalu pendek (min 10 digit)." };
    if (digits.length > 15) return { valid: false, msg: "Nomor WhatsApp terlalu panjang (maks 15 digit)." };
    if (!/^(08|628)/.test(digits)) return { valid: false, msg: "Nomor WhatsApp harus diawali dengan 08 atau 628 (nomor Indonesia)." };
    return { valid: true, msg: "" };
  };

  // Auto-pull data nama & email dari profile ketika user sudah login
  useEffect(() => {
    async function loadUserData() {
      const hasToken = Boolean(getAuthToken());
      const getCookie = (name) => {
        if (typeof document === "undefined") return null;
        const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
        return match ? decodeURIComponent(match[2]) : null;
      };
      const directEmail = getCookie("profile_email") || getCookie("user_email") || "";
      const directNama = getCookie("profile_nama") || getCookie("user_nama") || "";

      if (!hasToken && !directEmail && !directNama) {
        setIsLoggedIn(false);
        return;
      }
      setIsLoggedIn(true);

      // Isi dari cookies instan terlebih dahulu
      if (directNama) setForm((prev) => ({ ...prev, nama: directNama }));
      if (directEmail) {
        setForm((prev) => ({ ...prev, email: directEmail }));
        setOriginalEmail(directEmail);
      }

      try {
        const cookieProfile = getProfileFromCookies();
        if (cookieProfile) {
          const user = cookieProfile.user || {};
          const pasien = cookieProfile.pasien || {};
          const nama = pasien.nama_lengkap || user.nama || user.name || directNama || "";
          const email = user.email || directEmail || "";
          const noHp = pasien.no_hp || pasien.no_telepon || pasien.no_whatsapp || user.no_hp || "";
          if (nama) setForm((prev) => ({ ...prev, nama }));
          if (email) {
            setForm((prev) => ({ ...prev, email }));
            setOriginalEmail(email);
          }
          if (noHp) setForm((prev) => ({ ...prev, no_hp: formatAndValidateWaNumber(noHp) }));
        }

        try {
          await fetchAndStoreProfile();
          const refreshed = getProfileFromCookies();
          if (refreshed) {
            const user = refreshed.user || {};
            const pasien = refreshed.pasien || {};
            const nama = pasien.nama_lengkap || user.nama || user.name || directNama || "";
            const email = user.email || directEmail || "";
            const noHp = pasien.no_hp || pasien.no_telepon || pasien.no_whatsapp || user.no_hp || "";
            if (nama) setForm((prev) => ({ ...prev, nama }));
            if (email) {
              setForm((prev) => ({ ...prev, email }));
              setOriginalEmail(email);
            }
            if (noHp) setForm((prev) => ({ ...prev, no_hp: formatAndValidateWaNumber(noHp) }));
          }
        } catch {}
      } catch (err) {
        console.warn("Gagal memuat data profil pengguna:", err);
      }
    }
    loadUserData();
  }, []);

  // Validasi realtime email (apakah email asal atau beda dari profile asli)
  useEffect(() => {
    if (!form.email) {
      setEmailValidationError("");
      setEmailMismatchWarning("");
      return;
    }

    const check = validateEmailQuality(form.email);
    if (!check.valid) {
      setEmailValidationError(check.msg);
    } else {
      setEmailValidationError("");
    }

    if (isLoggedIn && originalEmail && form.email && form.email.trim().toLowerCase() !== originalEmail.trim().toLowerCase()) {
      setEmailMismatchWarning(
        `Perhatian: Email yang Anda masukkan (${form.email}) berbeda dengan email akun terdaftar (${originalEmail}). Pastikan email ini aktif agar kami dapat menghubungi Anda.`
      );
    } else {
      setEmailMismatchWarning("");
    }
  }, [form.email, originalEmail, isLoggedIn]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg("");
    setErrorMsg("");

    if (!form.nama.trim() || !form.email.trim() || !form.pesan.trim()) {
      setErrorMsg("Mohon lengkapi nama, email, dan pesan Anda.");
      return;
    }

    const emailCheck = validateEmailQuality(form.email);
    if (!emailCheck.valid) {
      setErrorMsg(emailCheck.msg);
      return;
    }

    const waCheck = validateWaNumber(form.no_hp);
    if (!waCheck.valid) {
      setErrorMsg(waCheck.msg);
      return;
    }

    try {
      setSubmitting(true);
      await createHubungiKami({
        ...form,
        no_hp: formatAndValidateWaNumber(form.no_hp)
      });
      setSuccessMsg("Pesan Anda berhasil terkirim! Tim kami akan menghubungi Anda sesegera mungkin.");
      setForm({ nama: "", email: "", no_hp: "", subjek: "", pesan: "" });
      setOriginalEmail("");
      setEmailMismatchWarning("");
    } catch (err) {
      setErrorMsg(err?.message || "Gagal mengirim pesan. Silakan coba lagi atau hubungi via WhatsApp.");
    } finally {
      setSubmitting(false);
    }
  };

  const phone = config.telepon || config.hubungi_phone || config.phone || "0812-3456-7890";
  const email = config.email || config.hubungi_email || "kontak@smarthomecare.id";
  const address = config.alamat || config.hubungi_address || "Jl. Kesehatan Medis No. 123, Jakarta";
  const whatsapp = config.whatsapp || config.hubungi_whatsapp || "0812-3456-7890";

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Column 1: Contact Cards */}
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                  <FiPhone size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Telepon Official</h3>
                  <p className="text-xs text-slate-600 mt-0.5">{phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 border-t border-slate-100 pt-3">
                <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <FaWhatsapp size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">WhatsApp Fast Response</h3>
                  <a
                    href={`https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-slate-600 hover:text-emerald-600 font-medium hover:underline mt-0.5 inline-block"
                    title="Klik untuk menghubungi via WhatsApp"
                  >
                    {whatsapp}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3 border-t border-slate-100 pt-3">
                <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <FiMail size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Email Resmi</h3>
                  <p className="text-xs text-slate-600 mt-0.5">{email}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 border-t border-slate-100 pt-3">
                <div className="h-9 w-9 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center font-bold shrink-0">
                  <FiMapPin size={18} />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Alamat Kantor</h3>
                  <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{address}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Column 2 & 3: Form Kirim Pesan */}
          <div className="md:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <h2 className="text-sm sm:text-base font-bold text-slate-800 flex items-center gap-2">
                <FiMessageSquare className="text-sky-600" /> Kirim Pesan Langsung
              </h2>

              {isLoggedIn ? (
                <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full font-semibold border border-emerald-100 w-fit">
                  <FiCheckCircle className="text-emerald-500 shrink-0" />
                  <FiUser className="text-emerald-500 shrink-0 text-[10px]" />
                  <span className="truncate max-w-[200px]">Data profile</span>
                </span>
              ) : null}
            </div>

            {successMsg && (
              <div className="flex items-center gap-2 p-3 text-xs bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200 font-medium">
                <FiCheckCircle className="text-emerald-600 shrink-0 text-sm" />
                <span>{successMsg}</span>
              </div>
            )}

            {errorMsg && (
              <div className="flex items-center gap-2 p-3 text-xs bg-rose-50 text-rose-700 rounded-xl border border-rose-200 font-medium">
                <FiAlertCircle className="text-rose-600 shrink-0 text-sm" />
                <span>{errorMsg}</span>
              </div>
            )}

            {emailMismatchWarning && (
              <div className="flex items-start gap-2 p-3 text-xs bg-amber-50 text-amber-800 rounded-xl border border-amber-200/70 font-medium">
                <FiAlertCircle className="text-amber-600 shrink-0 text-sm mt-0.5" />
                <span className="leading-relaxed">{emailMismatchWarning}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center justify-between">
                    <span>Nama Lengkap *</span>
                    {isLoggedIn && form.nama && (
                      <span className="text-[10px] text-slate-400 font-normal flex items-center gap-0.5 lowercase">
                        <FiLock className="text-[9px]" /> dari profil
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    placeholder="Nama Anda"
                    value={form.nama}
                    onChange={(e) => setForm({ ...form, nama: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-sky-500 focus:outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 flex items-center justify-between">
                    <span>Alamat Email *</span>
                    {isLoggedIn && form.email && (
                      <span className="text-[10px] text-slate-400 font-normal flex items-center gap-0.5 lowercase">
                        <FiLock className="text-[9px]" /> dari profil
                      </span>
                    )}
                  </label>
                  <input
                    type="email"
                    placeholder="email@domain.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={`w-full rounded-xl border px-3.5 py-2 text-xs focus:outline-none transition ${
                      emailValidationError
                        ? "border-rose-400 bg-rose-50/30 focus:border-rose-500"
                        : emailMismatchWarning
                        ? "border-amber-300 bg-amber-50/40 focus:border-amber-500"
                        : "border-slate-200 focus:border-sky-500"
                    }`}
                    required
                  />
                  {emailValidationError && (
                    <p className="mt-1 text-[10px] text-rose-600 font-medium flex items-start gap-1">
                      <FiAlertCircle className="text-[9px] mt-0.5 shrink-0" />
                      {emailValidationError}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Nomor WhatsApp <span className="text-slate-400 font-normal"></span>
                  </label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="081234567890"
                    value={form.no_hp}
                    onChange={(e) => {
                      const cleaned = e.target.value.replace(/[^0-9]/g, "");
                      setForm({ ...form, no_hp: cleaned });
                    }}
                    onBlur={(e) => {
                      const formatted = formatAndValidateWaNumber(e.target.value);
                      if (formatted !== e.target.value) {
                        setForm({ ...form, no_hp: formatted });
                      }
                    }}
                    maxLength={15}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-sky-500 focus:outline-none font-mono tracking-wide"
                  />
                  {form.no_hp && !validateWaNumber(form.no_hp).valid && (
                    <p className="mt-1 text-[10px] text-rose-600 font-medium flex items-start gap-1">
                      <FiAlertCircle className="text-[9px] mt-0.5 shrink-0" />
                      {validateWaNumber(form.no_hp).msg}
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
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs focus:border-sky-500 focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-6 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-sky-700 transition active:scale-95 cursor-pointer disabled:opacity-50"
              >
                <FiSend /> {submitting ? "Sending..." : "Kirim Pesan"}
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}

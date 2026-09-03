"use client";

import { useState, useEffect } from "react";
import { createHubungiKami, getHubungiKamiInfo } from "@/services/hubungiKamiService";
import { getGlobalConfig } from "@/services/configService";
import { FiMail, FiPhone, FiMapPin, FiSend, FiMessageSquare } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";

export default function HubungiKamiPage() {
  const [config, setConfig] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const [form, setForm] = useState({
    nama: "",
    email: "",
    no_hp: "",
    subjek: "",
    pesan: ""
  });

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

    try {
      setSubmitting(true);
      await createHubungiKami(form);
      setSuccessMsg("Pesan Anda berhasil terkirim! Tim kami akan menghubungi Anda sesegera mungkin.");
      setForm({ nama: "", email: "", no_hp: "", subjek: "", pesan: "" });
    } catch {
      setErrorMsg("Gagal mengirim pesan. Silakan coba lagi atau hubungi via WhatsApp.");
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
            Layanan Informasi &amp; Bantuan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Punya pertanyaan mengenai layanan homecare? Hubungi tim medis SmartHomeCare melalui form atau kontak resmi kami.
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
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Lengkap *</label>
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
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Alamat Email *</label>
                  <input
                    type="email"
                    placeholder="email@domain.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-sky-500 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nomor WhatsApp / HP</label>
                  <input
                    type="tel"
                    placeholder="0812xxx"
                    value={form.no_hp}
                    onChange={(e) => setForm({ ...form, no_hp: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs focus:border-sky-500 focus:outline-none"
                  />
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

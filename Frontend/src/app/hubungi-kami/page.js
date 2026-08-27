"use client";

import { useEffect, useState } from "react";
import { FiPhone, FiMail, FiMapPin, FiSend, FiCheckCircle } from "react-icons/fi";
import { FaWhatsapp } from "react-icons/fa";
import { getGlobalConfig } from "@/services/configService";
import { submitContactMessage } from "@/services/contactService";
import { showToast } from "@/components/Toast";

export default function HubungiKamiPage() {
  const [config, setConfig] = useState({
    phone_number: "(021) 1234 5678",
    whatsapp_number: "6281234567890",
    email: "info@smarthomecare.id",
    address: "Jakarta, Indonesia"
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    nama: "",
    email: "",
    whatsapp: "",
    subjek: "",
    pesan: ""
  });

  useEffect(() => {
    async function loadConfig() {
      try {
        const cfg = await getGlobalConfig();
        if (cfg) {
          setConfig({
            phone_number: cfg.phone_number || "(021) 1234 5678",
            whatsapp_number: cfg.whatsapp_number || "6281234567890",
            email: cfg.email || "info@smarthomecare.id",
            address: cfg.address || "Jakarta, Indonesia"
          });
        }
      } catch (err) {
        console.error("Gagal memuat kontak config:", err);
      }
    }
    loadConfig();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.nama.trim() || !formData.pesan.trim()) {
      showToast("Lengkapi nama dan pesan Anda", "error");
      return;
    }

    try {
      setSubmitting(true);
      await submitContactMessage(formData);
      showToast("Pesan berhasil terkirim!", "success");
      setSubmitted(true);
      setFormData({ nama: "", email: "", whatsapp: "", subjek: "", pesan: "" });
    } catch (err) {
      showToast("Gagal mengirim pesan", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const waUrl = `https://wa.me/${config.whatsapp_number.replace(/[^0-9]/g, "")}`;

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 font-sans text-slate-800">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Simple */}
        <div className="border-b border-slate-200 pb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Hubungi Kami</h1>
          <p className="text-sm text-slate-500 mt-1">Layanan bantuan dan informasi seputar perawatan kesehatan homecare</p>
        </div>

        {/* Two-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Simple Info Cards */}
          <div className="md:col-span-5 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4 shadow-2xs">
              <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-2">Kontak Resmi</h3>
              
              <a href={waUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-slate-700 hover:text-emerald-600 transition">
                <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-base shrink-0">
                  <FaWhatsapp />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold">WhatsApp</p>
                  <p className="font-semibold text-xs">+{config.whatsapp_number}</p>
                </div>
              </a>

              <a href={`tel:${config.phone_number}`} className="flex items-center gap-3 text-sm text-slate-700 hover:text-blue-600 transition">
                <div className="h-9 w-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-base shrink-0">
                  <FiPhone />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold">Telepon</p>
                  <p className="font-semibold text-xs">{config.phone_number}</p>
                </div>
              </a>

              <a href={`mailto:${config.email}`} className="flex items-center gap-3 text-sm text-slate-700 hover:text-rose-600 transition">
                <div className="h-9 w-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-base shrink-0">
                  <FiMail />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold">Email</p>
                  <p className="font-semibold text-xs truncate">{config.email}</p>
                </div>
              </a>

              <div className="flex items-start gap-3 text-sm text-slate-700 pt-2 border-t border-slate-100">
                <div className="h-9 w-9 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-base shrink-0">
                  <FiMapPin />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-semibold">Alamat Kantor</p>
                  <p className="text-xs leading-relaxed mt-0.5">{config.address}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Simple Form */}
          <div className="md:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
            <h3 className="font-bold text-slate-900 text-base border-b border-slate-100 pb-2 mb-4">Kirim Pesan</h3>

            {submitted ? (
              <div className="py-8 text-center space-y-2">
                <FiCheckCircle className="mx-auto text-3xl text-emerald-500" />
                <h4 className="font-bold text-slate-900 text-sm">Pesan Berhasil Terkirim</h4>
                <p className="text-xs text-slate-500">Tim kami akan membalas pesan Anda sesegera mungkin.</p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="mt-3 text-xs font-semibold text-sky-600 underline"
                >
                  Kirim Pesan Lainnya
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Nama Lengkap</label>
                  <input
                    type="text"
                    value={formData.nama}
                    onChange={e => setFormData({ ...formData, nama: e.target.value })}
                    placeholder="Nama Anda"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-sky-500 focus:outline-none"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">WhatsApp</label>
                    <input
                      type="text"
                      value={formData.whatsapp}
                      onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                      placeholder="08123456789"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-sky-500 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      placeholder="email@contoh.com"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-sky-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Subjek</label>
                  <input
                    type="text"
                    value={formData.subjek}
                    onChange={e => setFormData({ ...formData, subjek: e.target.value })}
                    placeholder="Subjek pertanyaan"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Isi Pesan</label>
                  <textarea
                    rows={4}
                    value={formData.pesan}
                    onChange={e => setFormData({ ...formData, pesan: e.target.value })}
                    placeholder="Tuliskan pertanyaan Anda..."
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-sky-500 focus:outline-none resize-y"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg bg-sky-600 py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-sky-700 transition cursor-pointer"
                >
                  <FiSend /> {submitting ? "Mengirim..." : "Kirim Pesan"}
                </button>
              </form>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}

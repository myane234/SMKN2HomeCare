"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getProfileMe } from "@/services/profileService";
import { submitNakesCompletion } from "@/services/nakesCompletionService";
import { resolveImageUrl } from "@/services/resolveImage";
import {
  ArrowLeft,
  FileText,
  FileCheck,
  ExternalLink,
  Loader2,
  Upload,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";

export default function NakesBerkasPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingField, setUploadingField] = useState(null);
  const [toast, setToast] = useState(null);

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

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await getProfileMe();
      setProfile(unwrapData(res));
    } catch (err) {
      console.error("Gagal memuat berkas profile:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const root = profile || {};
  const tm = profile?.tenaga_medis || profile?.nakes || profile || {};
  const pasien = profile?.pasien || {};
  const user = profile?.user || {};

  const strNumber = tm?.no_str || tm?.nomor_str || tm?.str || "-";
  const sipNumber = tm?.no_sip || tm?.nomor_sip || tm?.sip || "-";
  const nik = tm?.nik || pasien?.nik || user?.nik || "-";

  // Extractor file dinamis & aman
  const extractFile = (...keys) => {
    for (const key of keys) {
      if (tm?.[key]) return tm[key];
      if (root?.[key]) return root[key];
    }
    return null;
  };

  const strFile = extractFile("file_str", "berkas_str", "str");
  const sipFile = extractFile("file_sip", "berkas_sip", "sip");
  const ktpFile = extractFile("file_ktp", "berkas_ktp", "ktp", "foto_ktp");
  const skckFile = extractFile("file_skck", "berkas_skck", "skck");
  const npwpFile = extractFile("file_npwp", "foto_npwp", "berkas_npwp", "npwp");
  const ijazahFile = extractFile("file_ijazah", "ijazah", "berkas_ijazah", "file_ijazah_medis", "berkas_ijazah_medis");
  const paktaFile = extractFile("file_pakta_integritas", "berkas_pakta_integritas", "pakta_integritas");

  const handleFileUpload = async (fieldKey, file) => {
    if (!file) return;

    setUploadingField(fieldKey);
    try {
      const formData = new FormData();

      // 1. Lampirkan HANYA data teks murni eksisting (bukan string URL berkas) agar tidak memicu error validasi image di Laravel
      const noNpwp = tm?.no_npwp || root?.no_npwp || tm?.npwp || "";
      const idBank = tm?.id_bank || root?.id_bank || "";
      const noRekening = tm?.no_rekening || root?.no_rekening || tm?.rekening_bank?.no_rekening || "";
      const namaPemilik = tm?.nama_pemilik_rekening || tm?.atas_nama_rekening || root?.nama_pemilik_rekening || "";

      if (noNpwp) formData.append("no_npwp", noNpwp);
      if (idBank) formData.append("id_bank", idBank);
      if (noRekening) formData.append("no_rekening", noRekening);
      if (namaPemilik) formData.append("nama_pemilik_rekening", namaPemilik);

      // 2. Masukkan file binary baru yang sedang diunggah
      formData.append(fieldKey, file);

      const res = await submitNakesCompletion(formData);
      if (res.success || res.status === "success") {
        setToast({
          type: "success",
          text: "Berkas berhasil diunggah.",
        });
        await fetchProfile();
      } else {
        setToast({
          type: "error",
          text: res.message || "Gagal mengunggah berkas.",
        });
      }
    } catch (error) {
      console.error("Gagal upload berkas:", error);
      setToast({
        type: "error",
        text: error?.response?.data?.message || "Gagal mengunggah berkas.",
      });
    } finally {
      setUploadingField(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const docs = [
    {
      key: "file_str",
      title: "STR (Surat Tanda Registrasi)",
      number: strNumber,
      file: strFile,
    },
    {
      key: "file_sip",
      title: "SIP (Surat Izin Praktik)",
      number: sipNumber,
      file: sipFile,
    },
    {
      key: "file_ktp",
      title: "KTP (Kartu Tanda Penduduk)",
      number: nik,
      file: ktpFile,
    },
    {
      key: "file_skck",
      title: "SKCK",
      number: "Legitimasi Kepolisian",
      file: skckFile,
    },
    {
      key: "foto_npwp",
      title: "NPWP",
      number: "Identitas Perpajakan",
      file: npwpFile,
    },
    {
      key: "file_ijazah",
      title: "Ijazah Medis",
      number: "Pendidikan Medis",
      file: ijazahFile,
    },
    {
      key: "file_pakta_integritas",
      title: "Pakta Integritas",
      number: "Surat Pernyataan Layanan",
      file: paktaFile,
    },
  ];

  return (
    <div className="min-h-screen bg-slate-100 pb-16 relative">
      {toast && (
        <div
          className={`fixed top-5 right-5 z-[200] max-w-sm px-4 py-3 rounded-2xl shadow-xl text-white flex items-start gap-3 ${
            toast.type === "error" ? "bg-rose-600" : "bg-emerald-600"
          }`}
        >
          {toast.type === "error" ? (
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          )}
          <p className="text-xs font-medium leading-relaxed">{toast.text}</p>
          <button
            type="button"
            onClick={() => setToast(null)}
            className="ml-auto shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Biru */}
      <div className="bg-blue-600 pt-6 pb-20 px-4 text-white">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link
            href="/nakes/profile"
            className="p-1.5 hover:bg-white/20 rounded-xl transition text-white"
          >
            <ArrowLeft className="w-6 h-6" />
          </Link>
          <h1 className="text-lg font-bold">Riwayat Berkas & Dokumen</h1>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 -mt-12 relative z-10 space-y-4">
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-md space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="font-bold text-base text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" /> Dokumen Terlampir
            </h2>
            <span className="text-xs text-slate-400 font-medium hidden sm:inline">
              Lengkapi berkas jika belum diunggah
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {docs.map((doc) => {
              const isUploading = uploadingField === doc.key;
              const hasFile = Boolean(doc.file);

              return (
                <div
                  key={doc.key}
                  className="p-4 rounded-2xl border border-slate-200/60 bg-slate-50 flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2">
                      <p className="font-bold text-slate-900 text-xs sm:text-sm">
                        {doc.title}
                      </p>
                      {hasFile ? (
                        <FileCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 text-[10px] font-bold shrink-0">
                          Belum Lengkap
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 truncate">
                      {doc.number}
                    </p>
                  </div>

                  {hasFile ? (
                    <a
                      href={resolveImageUrl(doc.file)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline pt-1"
                    >
                      Lihat Berkas <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <div className="pt-1">
                      <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer transition shadow-xs">
                        {isUploading ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Upload className="w-3.5 h-3.5" />
                        )}
                        <span>{isUploading ? "Mengunggah..." : "Unggah Berkas"}</span>
                        <input
                          type="file"
                          accept="image/*,application/pdf"
                          className="hidden"
                          disabled={isUploading}
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              handleFileUpload(doc.key, file);
                            }
                          }}
                        />
                      </label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
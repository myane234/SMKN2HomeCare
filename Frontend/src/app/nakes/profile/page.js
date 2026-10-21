"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  User,
  Loader2,
  ChevronRight,
  MapPin,
  Edit3,
  X,
  CheckCircle2,
  AlertCircle,
  Users,
  Clock,
} from "lucide-react";

import { getProfileMe } from "@/services/profileService";
import {
  getDataOperasional,
  getKategoriLayanan,
  getProvinsi,
  updateDataOperasional,
} from "@/services/nakesService";
import { resolveImageUrl } from "@/services/resolveImage";

export default function NakesProfilePage() {
  const [profile, setProfile] = useState(null);
  const [operationalData, setOperationalData] = useState(null);

  const [masterCategories, setMasterCategories] = useState([]);
  const [masterWilayah, setMasterWilayah] = useState([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [isEditOpen, setIsEditOpen] = useState(false);

  const [toast, setToast] = useState(null);

  // Jadwal operasional dibuat kosong tanpa default
  const [formData, setFormData] = useState({
    id_wilayah_layanan: "",
    kategori_layanan: [],
    hari_mulai: "",
    hari_selesai: "",
    jam_mulai: "",
    jam_selesai: "",
  });

  /* UNWRAP API RESPONSE */
  const unwrapData = (value) => {
    let current = value;
    for (let i = 0; i < 8; i += 1) {
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

  /* NORMALIZE ARRAY */
  const normalizeArray = (value) => {
    const data = unwrapData(value);
    if (Array.isArray(data)) return data;
    if (data && typeof data === "object" && Array.isArray(data.data)) {
      return data.data;
    }
    return [];
  };

  /* GET APPROVED OPERATIONAL */
  const getApprovedOperational = (value) => {
    const data = unwrapData(value);
    if (!data) return null;

    if (Array.isArray(data)) {
      const approvedList = data
        .filter(
          (item) =>
            String(item?.status ?? "").toLowerCase() === "approved"
        )
        .sort((a, b) => {
          const dateA = new Date(a?.updated_at || a?.created_at || 0).getTime();
          const dateB = new Date(b?.updated_at || b?.created_at || 0).getTime();
          return dateB - dateA;
        });

      return approvedList[0] || null;
    }

    if (data?.data_aktif && typeof data.data_aktif === "object") return data.data_aktif;
    if (data?.operasional_aktif && typeof data.operasional_aktif === "object") return data.operasional_aktif;
    if (data?.operasional && typeof data.operasional === "object") {
      if (String(data.operasional?.status ?? "").toLowerCase() === "approved") {
        return data.operasional;
      }
    }
    if (String(data?.status ?? "").toLowerCase() === "approved") return data;

    return null;
  };

  /* GET LATEST OPERATIONAL RECORD */
  const getLatestOperationalRecord = (value) => {
    const data = unwrapData(value);
    if (!data) return null;

    if (Array.isArray(data)) {
      const sorted = [...data].sort((a, b) => {
        const dateA = new Date(a?.updated_at || a?.created_at || 0).getTime();
        const dateB = new Date(b?.updated_at || b?.created_at || 0).getTime();
        return dateB - dateA;
      });
      return sorted[0] || null;
    }

    if (data?.data_aktif && typeof data.data_aktif === "object") return data.data_aktif;
    if (data?.operasional_aktif && typeof data.operasional_aktif === "object") return data.operasional_aktif;
    if (data?.operasional && typeof data.operasional === "object") return data.operasional;

    return data;
  };

  /* HELPER: ABAIKAN ARRAY KOSONG [] */
  const getValidCategorySource = (...sources) => {
    for (const src of sources) {
      if (src !== null && src !== undefined) {
        if (Array.isArray(src) && src.length > 0) return src;
        if (typeof src === "string" && src.trim() !== "") return src;
      }
    }
    return [];
  };

  /* CATEGORY PARSER */
  const parseCategoryItems = (value) => {
    if (value === null || value === undefined) return [];
    let items = value;
    if (typeof items === "string") {
      items = items.split(",").map((item) => item.trim()).filter(Boolean);
    }
    if (!Array.isArray(items)) items = [items];
    return items.filter((item) => item !== null && item !== undefined && item !== "");
  };

  /* RESOLVE CATEGORY IDS DENGAN PENCOCOKAN PERSISI DAN LOWERCASE */
  const resolveCategoryIds = (rawCategories, categories) => {
    const items = parseCategoryItems(rawCategories);
    const ids = [];

    items.forEach((item) => {
      if (typeof item === "object" && item !== null) {
        const catId = Number(item?.id ?? item?.id_kategori_layanan ?? item?.id_kategori);
        if (Number.isFinite(catId) && catId > 0) ids.push(catId);
        return;
      }

      const numVal = Number(item);
      if (Number.isFinite(numVal) && numVal > 0) {
        ids.push(numVal);
        return;
      }

      // Cari berdasarkan nama string
      const strVal = String(item).trim().toLowerCase();
      const matched = categories.find((category) => {
        const categoryName =
          category?.nama_kategori ||
          category?.nama_layanan ||
          category?.nama_kategori_layanan ||
          category?.nama ||
          category?.label ||
          "";
        return String(categoryName).trim().toLowerCase() === strVal;
      });

      if (matched) {
        const foundId = Number(matched?.id ?? matched?.id_kategori_layanan ?? matched?.id_kategori);
        if (Number.isFinite(foundId) && foundId > 0) ids.push(foundId);
      }
    });

    return Array.from(new Set(ids));
  };

  /* RESOLVE CATEGORY NAMES */
  const resolveCategoryNames = (rawCategories, categories) => {
    const items = parseCategoryItems(rawCategories);
    const names = items
      .map((item) => {
        if (typeof item === "object" && item !== null) {
          return (
            item?.nama_kategori ||
            item?.nama_layanan ||
            item?.nama_kategori_layanan ||
            item?.nama ||
            item?.label ||
            ""
          );
        }
        const matched = categories.find(
          (category) =>
            String(category?.id ?? category?.id_kategori_layanan ?? category?.id_kategori) === String(item)
        );
        if (matched) {
          return (
            matched?.nama_kategori ||
            matched?.nama_layanan ||
            matched?.nama_kategori_layanan ||
            matched?.nama ||
            matched?.label ||
            ""
          );
        }
        return String(item);
      })
      .filter(Boolean);

    return Array.from(new Set(names));
  };

  /* RESOLVE WILAYAH */
  const resolveWilayahName = (wilayahId, wilayahObject, wilayahList) => {
    if (wilayahObject && typeof wilayahObject === "object") {
      const objectName = wilayahObject?.nama_provinsi || wilayahObject?.nama_wilayah || wilayahObject?.nama;
      if (objectName) return objectName;
    }

    const matched = wilayahList.find(
      (item) => String(item?.id_provinsi ?? item?.id_wilayah_layanan ?? item?.id) === String(wilayahId)
    );

    return matched?.nama_provinsi || matched?.nama_wilayah || matched?.nama || "-";
  };

  /* EXTRACT PERSON FROM PROFILE API */
  const getProfilePerson = (response) => {
    const root = unwrapData(response);
    const tenagaMedis = root?.tenaga_medis || root?.nakes || null;
    const user = root?.user || null;
    const pasien = root?.pasien || null;

    return { root, tenagaMedis, user, pasien };
  };

  /* LOAD ALL PROFILE DATA */
  const loadData = async () => {
    try {
      setLoading(true);

      const [profileResult, operationalResult, categoryResult, wilayahResult] = await Promise.allSettled([
        getProfileMe(),
        getDataOperasional(),
        getKategoriLayanan(),
        getProvinsi(),
      ]);

      let profileResponse = null;
      let rawOperational = null;
      let categories = [];
      let wilayahList = [];

      if (profileResult.status === "fulfilled") {
        profileResponse = profileResult.value;
        setProfile(profileResponse);
      }

      if (operationalResult.status === "fulfilled") {
        rawOperational = unwrapData(operationalResult.value);
        setOperationalData(rawOperational);
      } else {
        setOperationalData(null);
      }

      if (categoryResult.status === "fulfilled") {
        categories = normalizeArray(categoryResult.value);
        setMasterCategories(categories);
      }

      if (wilayahResult.status === "fulfilled") {
        wilayahList = normalizeArray(wilayahResult.value);
        setMasterWilayah(wilayahList);
      }

      const { root, tenagaMedis } = getProfilePerson(profileResponse);
      const approved = getApprovedOperational(rawOperational);
      const latestOperational = getLatestOperationalRecord(rawOperational);

      // Cari source kategori yang valid
      const categorySource = getValidCategorySource(
        approved?.kategori_layanan,
        approved?.kategori,
        latestOperational?.kategori_layanan,
        latestOperational?.kategori,
        tenagaMedis?.kategori_layanan,
        tenagaMedis?.jenis_tenaga_medis,
        tenagaMedis?.kategori,
        tenagaMedis?.jenis_layanan,
        root?.kategori_layanan
      );

      const wilayahSource =
        approved?.id_wilayah_layanan ??
        approved?.wilayah_layanan?.id_provinsi ??
        latestOperational?.id_wilayah_layanan ??
        latestOperational?.wilayah_layanan?.id_provinsi ??
        tenagaMedis?.id_wilayah_layanan ??
        tenagaMedis?.wilayah_layanan?.id_provinsi ??
        "";

      let hariMulai = "";
      let hariSelesai = "";
      let jamMulai = "";
      let jamSelesai = "";

      const opWaktu = approved?.waktu_layanan ?? latestOperational?.waktu_layanan;
      if (opWaktu) {
        let parsedWaktu = opWaktu;
        if (typeof parsedWaktu === "string") {
          try { parsedWaktu = JSON.parse(parsedWaktu); } catch {}
        }
        if (Array.isArray(parsedWaktu) && parsedWaktu.length > 0) {
          const first = parsedWaktu[0];
          const last = parsedWaktu[parsedWaktu.length - 1];
          if (first?.hari) hariMulai = first.hari;
          if (last?.hari) hariSelesai = last.hari;
          if (first?.jam_mulai) jamMulai = first.jam_mulai;
          if (first?.jam_selesai) jamSelesai = first.jam_selesai;
        }
      }

      const resolvedCategoryIds = resolveCategoryIds(categorySource, categories);

      setFormData({
        id_wilayah_layanan: wilayahSource ? String(wilayahSource) : "",
        kategori_layanan: resolvedCategoryIds,
        hari_mulai: hariMulai,
        hari_selesai: hariSelesai,
        jam_mulai: jamMulai,
        jam_selesai: jamSelesai,
      });
    } catch (error) {
      console.error("Gagal memuat profile nakes:", error);
      setToast({
        type: "error",
        text: error?.response?.data?.message || "Gagal memuat data profile nakes.",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCategoryToggle = (categoryId) => {
    const id = Number(categoryId);
    setFormData((previous) => {
      const current = previous.kategori_layanan || [];
      if (current.includes(id)) {
        return { ...previous, kategori_layanan: current.filter((item) => item !== id) };
      }
      return { ...previous, kategori_layanan: [...current, id] };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.id_wilayah_layanan) {
      setToast({ type: "error", text: "Pilih wilayah layanan terlebih dahulu." });
      return;
    }
    if (!formData.kategori_layanan?.length) {
      setToast({ type: "error", text: "Pilih minimal satu kategori layanan." });
      return;
    }
    if (!formData.hari_mulai || !formData.hari_selesai) {
      setToast({ type: "error", text: "Pilih hari mulai dan hari selesai operasional." });
      return;
    }
    if (!formData.jam_mulai || !formData.jam_selesai) {
      setToast({ type: "error", text: "Pilih jam mulai dan jam selesai operasional." });
      return;
    }

    setSubmitting(true);

    try {
      const hariListAll = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
      const startIndex = Math.max(0, hariListAll.indexOf(formData.hari_mulai));
      const endIndex = Math.max(startIndex, hariListAll.indexOf(formData.hari_selesai));
      const selectedDays = hariListAll.slice(startIndex, endIndex + 1);

      const formattedWaktuLayanan = selectedDays.map((hari) => ({
        hari,
        hari_mulai: formData.hari_mulai,
        hari_selesai: formData.hari_selesai,
        jam_mulai: formData.jam_mulai,
        jam_selesai: formData.jam_selesai,
      }));

      const payload = {
        id_wilayah_layanan: Number(formData.id_wilayah_layanan),
        kategori_layanan: formData.kategori_layanan.map(Number),
        waktu_layanan: formattedWaktuLayanan,
      };

      await updateDataOperasional(payload);
      setIsEditOpen(false);
      setToast({ type: "success", text: "Pengajuan operasional berhasil dikirim ke Admin." });
      await loadData();
    } catch (error) {
      console.error("Gagal memperbarui operasional:", error);
      const validationErrors = error?.response?.data?.errors;
      let message = error?.response?.data?.message || "Gagal mengirim pengajuan operasional.";
      if (validationErrors && typeof validationErrors === "object") {
        message = Object.values(validationErrors).flat().join(" | ");
      }
      setToast({ type: "error", text: message });
    } finally {
      setSubmitting(false);
      window.setTimeout(() => setToast(null), 5000);
    }
  };

  const { root, tenagaMedis, user, pasien } = getProfilePerson(profile);

  const nama =
    tenagaMedis?.nama_lengkap ||
    tenagaMedis?.nama ||
    root?.nama_lengkap ||
    user?.name ||
    pasien?.nama_lengkap ||
    "Tenaga Medis";

  const foto =
    tenagaMedis?.foto_profile ||
    tenagaMedis?.pas_foto ||
    tenagaMedis?.foto ||
    root?.avatar ||
    user?.avatar ||
    pasien?.avatar ||
    null;

  const approved = getApprovedOperational(operationalData);
  const latestOperational = getLatestOperationalRecord(operationalData);

  /* Ambil sumber data kategori */
  const displayCategorySource = getValidCategorySource(
    approved?.kategori_layanan,
    approved?.kategori,
    latestOperational?.kategori_layanan,
    latestOperational?.kategori,
    tenagaMedis?.kategori_layanan,
    tenagaMedis?.jenis_tenaga_medis,
    tenagaMedis?.kategori,
    tenagaMedis?.jenis_layanan,
    root?.kategori_layanan
  );

  const categoryNames = resolveCategoryNames(displayCategorySource, masterCategories);

  const displayWilayahId =
    approved?.id_wilayah_layanan ??
    approved?.wilayah_layanan?.id_provinsi ??
    latestOperational?.id_wilayah_layanan ??
    latestOperational?.wilayah_layanan?.id_provinsi ??
    tenagaMedis?.id_wilayah_layanan ??
    tenagaMedis?.wilayah_layanan?.id_provinsi ??
    null;

  const wilayahName = resolveWilayahName(
    displayWilayahId,
    approved?.wilayah_layanan || latestOperational?.wilayah_layanan || tenagaMedis?.wilayah_layanan || null,
    masterWilayah
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="h-28 sm:h-32 bg-blue-600" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-14 sm:-mt-16 pb-10">
        <div className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* PROFILE UTAMA */}
            <section className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
              <div className="p-6 sm:p-7">
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900 mt-1">
                      Profile Saya
                    </h2>
                  </div>

                  <Link
                    href="/profile"
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-xs font-semibold text-slate-700 transition"
                  >
                    <Users className="w-3.5 h-3.5" />
                    Mode Pasien
                  </Link>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-slate-200 overflow-hidden shrink-0 flex items-center justify-center border-2 border-slate-100">
                    {foto ? (
                      <img
                        src={resolveImageUrl(foto)}
                        alt={nama}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-10 h-10 sm:w-12 sm:h-12 text-slate-400" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-base sm:text-lg font-extrabold uppercase leading-tight text-slate-900 break-words">
                      {nama}
                    </h3>
                    <p className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
                      Tenaga Medis
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* PROFIL OPERASIONAL */}
            <section className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
              <div className="p-6 sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-blue-600">
                      Operasional
                    </p>
                    <h2 className="text-lg font-bold text-slate-900 mt-1">
                      Profil Operasional
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      Wilayah dan kategori layanan
                    </p>
                  </div>

                  {(() => {
                    const statusStr = String(
                      latestOperational?.status ??
                      approved?.status ??
                      tenagaMedis?.status_operasional ??
                      ""
                    ).toLowerCase();

                    if (approved || statusStr === "approved") {
                      return (
                        <button
                          type="button"
                          onClick={() => setIsEditOpen(true)}
                          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-semibold transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Edit Operasional
                        </button>
                      );
                    }

                    if (statusStr === "pending" || statusStr === "menunggu") {
                      return (
                        <button
                          type="button"
                          disabled
                          className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 text-amber-600 text-xs font-semibold cursor-not-allowed opacity-80"
                        >
                          Menunggu Persetujuan
                        </button>
                      );
                    }

                    return (
                      <button
                        type="button"
                        onClick={() => setIsEditOpen(true)}
                        className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition shadow-xs"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Ajukan Operasional
                      </button>
                    );
                  })()}
                </div>

                <div className="mt-6 space-y-5">
                  {/* KATEGORI LAYANAN */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2.5">
                      Kategori Layanan
                    </p>
                    {categoryNames.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {categoryNames.map((category, index) => (
                          <span
                            key={`${category}-${index}`}
                            className="px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 text-[11px] sm:text-xs font-semibold"
                          >
                            {category}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm font-bold text-slate-400">-</p>
                    )}
                  </div>

                  {/* WILAYAH LAYANAN */}
                  <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                        <MapPin className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Wilayah Layanan
                        </p>
                        <p className={`mt-1 text-sm font-bold ${wilayahName && wilayahName !== "-" ? "text-slate-800" : "text-slate-400"}`}>
                          {wilayahName}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* JADWAL OPERASIONAL */}
                  <div className="rounded-2xl bg-slate-50 border border-slate-100 p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                        <Clock className="w-4 h-4 text-blue-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Jadwal Operasional
                        </p>

                        {(() => {
                          if (!approved) {
                            return <p className="mt-1 text-sm font-bold text-slate-400">-</p>;
                          }

                          const opWaktu = approved?.waktu_layanan ?? latestOperational?.waktu_layanan;
                          let parsedWaktu = opWaktu;

                          if (typeof parsedWaktu === "string") {
                            try {
                              parsedWaktu = JSON.parse(parsedWaktu);
                            } catch {
                              parsedWaktu = null;
                            }
                          }

                          if (Array.isArray(parsedWaktu) && parsedWaktu.length > 0) {
                            const first = parsedWaktu[0];
                            const last = parsedWaktu[parsedWaktu.length - 1];
                            const hMulai = first?.hari || "";
                            const hSelesai = last?.hari || "";
                            const jMulai = first?.jam_mulai || "";
                            const jSelesai = first?.jam_selesai || "";

                            if (!hMulai || !jMulai) return <p className="mt-1 text-sm font-bold text-slate-400">-</p>;

                            const displayHari = hMulai === hSelesai ? hMulai : `${hMulai} - ${hSelesai}`;

                            return (
                              <p className="mt-1 text-sm font-bold text-slate-800 break-words">
                                {displayHari}, {jMulai} - {jSelesai} WIB
                              </p>
                            );
                          }

                          return <p className="mt-1 text-sm font-bold text-slate-400">-</p>;
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* PROFILE NAKES & RIWAYAT BERKAS */}
          <section className="bg-white rounded-3xl border border-slate-200 shadow-lg overflow-hidden">
            <Link
              href="/nakes/profile/detail"
              className="flex items-center justify-between gap-4 px-5 sm:px-7 py-5 hover:bg-slate-50 transition"
            >
              <div>
                <p className="text-sm font-bold text-slate-900">
                  Profile Nakes
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Data diri, kontak, dan rekening
                </p>
              </div>

              <ChevronRight className="w-5 h-5 text-slate-500 shrink-0" />
            </Link>

            <div className="border-t border-slate-100" />

            <Link
              href="/nakes/profile/berkas"
              className="flex items-center justify-between gap-4 px-5 sm:px-7 py-5 hover:bg-slate-50 transition"
            >
              <div>
                <p className="text-sm font-bold text-slate-900">
                  Riwayat Berkas
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Dokumen dan masa berlaku berkas
                </p>
              </div>

              <ChevronRight className="w-5 h-5 text-slate-500 shrink-0" />
            </Link>
          </section>
        </div>
      </main>

      {/* TOAST NOTIFICATION */}
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

      {/* MODAL EDIT OPERATIONAL */}
      {isEditOpen && (
        <div className="fixed inset-0 z-[150] flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-0 sm:p-4">
          <div className="w-full sm:max-w-lg max-h-[90vh] overflow-hidden bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col">
            {/* HEADER */}
            <div className="px-5 py-4 sm:px-6 border-b border-slate-100 flex items-center justify-between gap-4 shrink-0">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  {approved ? "Edit Operasional" : "Ajukan Operasional"}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Ubah wilayah dan kategori layanan
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsEditOpen(false)}
                disabled={submitting}
                className="p-2 rounded-xl hover:bg-slate-100 text-slate-500 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* FORM */}
            <form
              onSubmit={handleSubmit}
              className="p-5 sm:p-6 overflow-y-auto space-y-5"
            >
              {/* WILAYAH */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Wilayah Layanan
                </label>

                <select
                  value={formData.id_wilayah_layanan}
                  onChange={(event) =>
                    setFormData((previous) => ({
                      ...previous,
                      id_wilayah_layanan: event.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 outline-none focus:border-blue-500"
                  required
                >
                  <option value="">Pilih Wilayah</option>

                  {masterWilayah.map((wilayah) => {
                    const id =
                      wilayah?.id_provinsi ??
                      wilayah?.id_wilayah_layanan ??
                      wilayah?.id;

                    const name =
                      wilayah?.nama_provinsi ||
                      wilayah?.nama_wilayah ||
                      wilayah?.nama;

                    if (!id || !name) return null;

                    return (
                      <option key={id} value={id}>
                        {name}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* KATEGORI */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Kategori Layanan
                </label>

                <div className="border border-slate-200 rounded-2xl p-3 space-y-2 max-h-64 overflow-y-auto">
                  {masterCategories.length > 0 ? (
                    masterCategories.map((category) => {
                      const id = Number(
                        category?.id ??
                          category?.id_kategori_layanan ??
                          category?.id_kategori
                      );

                      const name =
                        category?.nama_kategori ||
                        category?.nama_layanan ||
                        category?.nama_kategori_layanan ||
                        category?.nama ||
                        category?.label ||
                        "";

                      if (!Number.isFinite(id) || !name) return null;

                      const checked = formData.kategori_layanan.includes(id);

                      return (
                        <label
                          key={id}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                            checked
                              ? "bg-blue-50 border-blue-200"
                              : "bg-white border-slate-100 hover:bg-slate-50"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleCategoryToggle(id)}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600"
                          />

                          <span className="text-xs font-medium text-slate-700">
                            {name}
                          </span>
                        </label>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-400 py-2">
                      Data kategori layanan belum tersedia.
                    </p>
                  )}
                </div>
              </div>

              {/* JADWAL OPERASIONAL / JAM KERJA */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Jadwal Operasional / Jam Kerja
                </label>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Hari Mulai
                      </label>
                      <select
                        value={formData.hari_mulai}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            hari_mulai: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                        required
                      >
                        <option value="">Pilih Hari</option>
                        {[
                          "Senin",
                          "Selasa",
                          "Rabu",
                          "Kamis",
                          "Jumat",
                          "Sabtu",
                          "Minggu",
                        ].map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Hari Selesai
                      </label>
                      <select
                        value={formData.hari_selesai}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            hari_selesai: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                        required
                      >
                        <option value="">Pilih Hari</option>
                        {[
                          "Senin",
                          "Selasa",
                          "Rabu",
                          "Kamis",
                          "Jumat",
                          "Sabtu",
                          "Minggu",
                        ].map((h) => (
                          <option key={h} value={h}>
                            {h}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Jam Mulai
                      </label>
                      <input
                        type="time"
                        value={formData.jam_mulai}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            jam_mulai: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Jam Selesai
                      </label>
                      <input
                        type="time"
                        value={formData.jam_selesai}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            jam_selesai: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3">
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Perubahan operasional akan diajukan ke Admin dan menunggu persetujuan.
                </p>
              </div>

              {/* BUTTON ACTION */}
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting ? "Mengirim..." : "Kirim Pengajuan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Clock,
  MapPin,
  Edit3,
  CheckCircle2,
  Bell,
  X,
  Stethoscope,
  AlertCircle,
  Loader2,
  Hourglass,
} from "lucide-react";

import api from "@/services/api";
import { resolveImageUrl } from "@/services/resolveImage";
import {
  getDataOperasional,
  updateDataOperasional,
  getKategoriLayanan,
  getProvinsi,
} from "@/services/nakesService";

const LIST_HARI = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
  "Minggu",
];

export default function DashboardPage() {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] =
    useState(false);

  const [toastMessage, setToastMessage] =
    useState(null);

  const [listWilayah, setListWilayah] =
    useState([]);

  const [listCategories, setListCategories] =
    useState([]);

  // =========================================================
  // PROFILE NAKES
  // =========================================================

  const [nakesProfile, setNakesProfile] =
    useState({
      name: "-",
      phone: "-",
      address: "-",
      photo: null,

      // data dari pendaftaran
      registeredCategories: [],
      registeredCategoryNames: [],

      registeredWilayahId: null,
      registeredWilayahName: "-",
    });

  // =========================================================
  // OPERASIONAL
  // =========================================================

  const [activeOperational, setActiveOperational] =
    useState(null);

  const [activeSchedule, setActiveSchedule] =
    useState(null);

  const [pendingRequest, setPendingRequest] =
    useState(null);

  const [adminNotes, setAdminNotes] =
    useState("");

  // =========================================================
  // APPROVAL POPUP
  // =========================================================

  const previousStatusRef =
    useRef(null);

  const [approvalPopup, setApprovalPopup] =
    useState(null);

  // =========================================================
  // FORM EDIT
  // =========================================================

  const [formData, setFormData] =
    useState({
      hari_mulai: "",
      hari_selesai: "",
      jam_mulai: "",
      jam_selesai: "",
      id_wilayah_layanan: "",
      kategori_layanan: [],
    });

  // =========================================================
  // RESPONSE HELPER
  // =========================================================

  const unwrapData = (value) => {
    let current = value;

    for (let i = 0; i < 6; i += 1) {
      if (
        current &&
        typeof current === "object" &&
        !Array.isArray(current) &&
        Object.prototype.hasOwnProperty.call(
          current,
          "data"
        )
      ) {
        current = current.data;
      } else {
        break;
      }
    }

    return current;
  };

  // =========================================================
  // CATEGORY NAME
  // =========================================================

  const resolveCategoryNames = (
    rawCategories,
    masterCategories = listCategories
  ) => {
    if (
      rawCategories === null ||
      rawCategories === undefined
    ) {
      return [];
    }

    let categories = rawCategories;

    if (
      typeof categories === "string"
    ) {
      categories = categories
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }

    if (!Array.isArray(categories)) {
      categories = [categories];
    }

    return categories
      .map((item) => {
        if (
          typeof item === "object" &&
          item !== null
        ) {
          return (
            item.nama_kategori ||
            item.nama_layanan ||
            item.nama ||
            item.label ||
            ""
          );
        }

        const found =
          masterCategories.find(
            (category) =>
              String(
                category?.id ??
                  category?.id_kategori_layanan ??
                  category?.id_kategori
              ) === String(item)
          );

        if (found) {
          return (
            found.nama_kategori ||
            found.nama_layanan ||
            found.nama ||
            found.label ||
            ""
          );
        }

        // Kalau backend sudah mengirim nama
        return String(item);
      })
      .filter(Boolean);
  };

  // =========================================================
  // NORMALIZE WAKTU
  // =========================================================

  const normalizeWaktuLayanan = (
    value
  ) => {
    if (!value) return [];

    let waktu = value;

    if (typeof waktu === "string") {
      try {
        waktu = JSON.parse(waktu);
      } catch {
        return [];
      }
    }

    if (!Array.isArray(waktu)) {
      return [];
    }

    return waktu.filter(
      (item) =>
        item &&
        typeof item === "object" &&
        item.hari &&
        item.jam_mulai &&
        item.jam_selesai
    );
  };

  const getWaktuLayananFromObject = (
    obj
  ) => {
    if (
      !obj ||
      typeof obj !== "object"
    ) {
      return [];
    }

    const candidates = [
      obj.waktu_layanan,
      obj.operasional?.waktu_layanan,
      obj.data_aktif?.waktu_layanan,
      obj.operasional_aktif
        ?.waktu_layanan,
    ];

    for (const candidate of candidates) {
      const result =
        normalizeWaktuLayanan(
          candidate
        );

      if (result.length > 0) {
        return result;
      }
    }

    return [];
  };

  // =========================================================
  // FIND ACTIVE OPERATIONAL
  // =========================================================

  const getApprovedOperationalData = (
    rawData
  ) => {
    const source = unwrapData(
      rawData
    );

    if (!source) return null;

    if (Array.isArray(source)) {
      const approved =
        source
          .filter(
            (item) =>
              String(
                item?.status || ""
              ).toLowerCase() ===
              "approved"
          )
          .sort((a, b) => {
            const dateA =
              new Date(
                a?.updated_at ||
                  a?.created_at ||
                  0
              ).getTime();

            const dateB =
              new Date(
                b?.updated_at ||
                  b?.created_at ||
                  0
              ).getTime();

            return dateB - dateA;
          });

      return approved[0] || null;
    }

    if (
      source.data_aktif &&
      typeof source.data_aktif ===
        "object"
    ) {
      return source.data_aktif;
    }

    if (
      source.operasional_aktif &&
      typeof source.operasional_aktif ===
        "object"
    ) {
      return source.operasional_aktif;
    }

    if (
      source.operasional &&
      typeof source.operasional ===
        "object" &&
      String(
        source.operasional.status || ""
      ).toLowerCase() === "approved"
    ) {
      return source.operasional;
    }

    if (
      String(
        source.status || ""
      ).toLowerCase() === "approved"
    ) {
      return source;
    }

    return null;
  };

  // =========================================================
  // BUILD DISPLAY DATA
  // =========================================================

  const buildOperationalDisplay = (
    operationalData
  ) => {
    if (
      !operationalData ||
      typeof operationalData !==
        "object"
    ) {
      return null;
    }

    const waktu =
      getWaktuLayananFromObject(
        operationalData
      );

    let hours = "-";

    if (waktu.length > 0) {
      const first = waktu[0];
      const last =
        waktu[waktu.length - 1];

      const jamMulai = String(
        first.jam_mulai || ""
      ).slice(0, 5);

      const jamSelesai = String(
        first.jam_selesai || ""
      ).slice(0, 5);

      hours =
        first.hari === last.hari
          ? `${first.hari}, ${jamMulai} - ${jamSelesai}`
          : `${first.hari} - ${last.hari}, ${jamMulai} - ${jamSelesai}`;
    }

    return {
      hours,
      waktu_layanan: waktu,
    };
  };

  // =========================================================
  // FORMAT WILAYAH
  // =========================================================

  const resolveWilayahName = (
    wilayahId,
    wilayahObject = null,
    masterWilayah = listWilayah
  ) => {
    if (
      wilayahObject &&
      typeof wilayahObject ===
        "object"
    ) {
      const name =
        wilayahObject.nama_provinsi ||
        wilayahObject.nama_wilayah ||
        wilayahObject.nama;

      if (name) return name;
    }

    const found =
      masterWilayah.find(
        (item) =>
          String(
            item?.id_provinsi ??
              item?.id_wilayah_layanan ??
              item?.id
          ) === String(wilayahId)
      );

    return (
      found?.nama_provinsi ||
      found?.nama_wilayah ||
      found?.nama ||
      "-"
    );
  };

  // =========================================================
  // LOAD DATA
  // =========================================================

  const fetchData = async () => {
    try {
      setLoading(true);

      // -----------------------------------------------------
      // MASTER
      // -----------------------------------------------------

      const [
        wilayahRes,
        kategoriRes,
      ] = await Promise.all([
        getProvinsi().catch(
          () => ({})
        ),
        getKategoriLayanan().catch(
          () => ({})
        ),
      ]);

      const wilayahData = unwrapData(
        wilayahRes
      );

      const kategoriData = unwrapData(
        kategoriRes
      );

      const wilayahList =
        Array.isArray(wilayahData)
          ? wilayahData
          : [];

      const kategoriList =
        Array.isArray(kategoriData)
          ? kategoriData
          : [];

      setListWilayah(wilayahList);
      setListCategories(kategoriList);

      // -----------------------------------------------------
      // PROFILE NAKES
      // -----------------------------------------------------

      const profileRes =
        await api.get(
          "/api/profile/me"
        );

      const profileRoot =
        profileRes?.data;

      const profileData =
        unwrapData(profileRoot);

      const tm =
        profileData?.tenaga_medis ||
        profileData?.nakes ||
        null;

      const user =
        profileData?.user || null;

      if (tm) {
        // -----------------------------------------------
        // IDENTITAS
        // -----------------------------------------------

        const nama =
          tm.nama_lengkap ||
          tm.nama ||
          profileData?.nama_lengkap ||
          user?.name ||
          "-";

        const noHp =
          tm.no_hp ||
          tm.no_telp ||
          tm.nomor_hp ||
          tm.nomor_telepon ||
          tm.phone ||
          profileData?.no_hp ||
          profileData?.no_telp ||
          profileData?.nomor_hp ||
          user?.no_hp ||
          user?.no_telp ||
          user?.phone ||
          "-";

        const alamat =
          tm.alamat_lengkap ||
          tm.alamat_utama ||
          tm.alamat ||
          tm.alamat_domisili ||
          profileData?.alamat_lengkap ||
          profileData?.alamat_utama ||
          profileData?.alamat ||
          "-";

        // -----------------------------------------------
        // FOTO
        // -----------------------------------------------

        const foto =
          tm.pas_foto ||
          tm.pasFoto ||
          tm.foto_profile ||
          tm.foto_profil ||
          tm.foto ||
          tm.avatar ||
          profileData?.pas_foto ||
          profileData?.foto_profile ||
          profileData?.foto_profil ||
          profileData?.avatar ||
          user?.avatar ||
          null;

        // -----------------------------------------------
        // KATEGORI DARI PENDAFTARAN
        // -----------------------------------------------

const categoryCandidates = [
  tm?.kategori_layanan,
  tm?.jenis_tenaga_medis,
  tm?.jenis_layanan,
  profileData?.kategori_layanan,
  profileData?.jenis_tenaga_medis,
];

let rawCategories = [];

for (const candidate of categoryCandidates) {
  if (
    Array.isArray(candidate) &&
    candidate.length > 0
  ) {
    rawCategories = candidate;
    break;
  }

  if (
    typeof candidate === "string" &&
    candidate.trim().length > 0
  ) {
    rawCategories = candidate;
    break;
  }
}

const categoryNames =
  resolveCategoryNames(
    rawCategories,
    kategoriList
  );

        // -----------------------------------------------
        // WILAYAH DARI PENDAFTARAN
        // -----------------------------------------------

        const wilayahId =
          tm.id_wilayah_layanan ??
          tm.wilayah_layanan
            ?.id_provinsi ??
          tm.wilayah_layanan
            ?.id_wilayah_layanan ??
          profileData?.id_wilayah_layanan ??
          null;

        const wilayahName =
          resolveWilayahName(
            wilayahId,
            tm.wilayah_layanan,
            wilayahList
          );

        setNakesProfile({
          name: nama,
          phone: noHp,
          address: alamat,
          photo: foto
            ? resolveImageUrl(
                foto
              )
            : null,

          registeredCategories:
            Array.isArray(
              rawCategories
            )
              ? rawCategories
              : [rawCategories],

          registeredCategoryNames:
            categoryNames,

          registeredWilayahId:
            wilayahId,

          registeredWilayahName:
            wilayahName,
        });
      }

      // -----------------------------------------------------
      // DATA OPERASIONAL
      // -----------------------------------------------------

      const opRes =
        await getDataOperasional().catch(
          () => null
        );

      const opData =
        unwrapData(
          unwrapData(opRes)
        );

      // -----------------------------------------------
      // DATA AKTIF
      // -----------------------------------------------

      const activeData =
        getApprovedOperationalData(
          opData
        );

      setActiveOperational(
        activeData
      );

      if (activeData) {
        const display =
          buildOperationalDisplay(
            activeData
          );

        setActiveSchedule(
          display
        );
      } else {
        setActiveSchedule(null);
      }

      // -----------------------------------------------
      // STATUS PENGAJUAN
      // -----------------------------------------------

      const currentStatus =
        !Array.isArray(opData)
          ? String(
              opData?.status || ""
            ).toLowerCase()
          : "";

      if (
        currentStatus === "pending"
      ) {
        const proposed =
          buildOperationalDisplay(
            opData
          );

        setPendingRequest({
          ...proposed,

          location:
            resolveWilayahName(
              opData?.id_wilayah_layanan,
              opData?.wilayah_layanan,
              wilayahList
            ),

          kategoriNames:
            resolveCategoryNames(
              opData?.kategori_layanan ??
                [],
              kategoriList
            ),
        });

        setAdminNotes(
          opData?.admin_notes || ""
        );
      } else {
        setPendingRequest(null);
      }

      // -----------------------------------------------
      // APPROVAL POPUP
      // -----------------------------------------------

      if (
        currentStatus ===
          "approved" &&
        previousStatusRef.current ===
          "pending"
      ) {
        setApprovalPopup({
          type: "approved",
          title:
            "Pengajuan Disetujui",
          message:
            "Perubahan operasional Anda telah disetujui oleh admin.",
          notes: "",
        });
      }

      if (
        currentStatus ===
          "rejected" &&
        previousStatusRef.current ===
          "pending"
      ) {
        setApprovalPopup({
          type: "rejected",
          title:
            "Pengajuan Ditolak",
          message:
            "Perubahan operasional Anda ditolak oleh admin.",
          notes:
            opData?.admin_notes ||
            "",
        });
      }

      if (currentStatus) {
        previousStatusRef.current =
          currentStatus;
      }

      // -----------------------------------------------------
      // FORM DEFAULT
      // -----------------------------------------------------

      const wilayahDefault =
        activeData?.id_wilayah_layanan ??
        tm?.id_wilayah_layanan ??
        profileData?.id_wilayah_layanan ??
        null;

const categoryCandidates = [
  activeData?.kategori_layanan,
  activeData?.kategori,
  activeData?.layanan,
  tm?.kategori_layanan,
  tm?.jenis_tenaga_medis,
  tm?.jenis_layanan,
];

let currentRawCategories = [];

for (const candidate of categoryCandidates) {
  if (
    Array.isArray(candidate) &&
    candidate.length > 0
  ) {
    currentRawCategories = candidate;
    break;
  }

  if (
    typeof candidate === "string" &&
    candidate.trim().length > 0
  ) {
    currentRawCategories = candidate;
    break;
  }
}

      let categoryIds = [];

      if (
        Array.isArray(
          currentRawCategories
        )
      ) {
        categoryIds =
          currentRawCategories
            .map((item) => {
              if (
                typeof item ===
                  "object" &&
                item !== null
              ) {
                return Number(
                  item.id ??
                    item.id_kategori_layanan ??
                    item.id_kategori
                );
              }

              return Number(item);
            })
            .filter(
              (id) =>
                Number.isFinite(id) &&
                id > 0
            );
      } else if (
        typeof currentRawCategories ===
        "string"
      ) {
        const names =
          currentRawCategories
            .split(",")
            .map((item) =>
              item.trim()
            )
            .filter(Boolean);

        categoryIds =
          kategoriList
            .filter((category) => {
              const categoryName =
                category.nama_kategori ||
                category.nama_layanan ||
                category.nama ||
                category.label;

              return names.some(
                (name) =>
                  String(
                    categoryName || ""
                  )
                    .trim()
                    .toLowerCase() ===
                  String(name)
                    .trim()
                    .toLowerCase()
              );
            })
            .map((category) =>
              Number(
                category.id ??
                  category.id_kategori_layanan ??
                  category.id_kategori
              )
            )
            .filter(
              (id) =>
                Number.isFinite(id) &&
                id > 0
            );
      }

      const waktu =
        getWaktuLayananFromObject(
          activeData
        );

      const first =
        waktu[0] || {};

      const last =
        waktu[waktu.length - 1] ||
        {};

      setFormData({
        hari_mulai:
          first.hari || "",

        hari_selesai:
          last.hari || "",

        jam_mulai:
          first.jam_mulai
            ? String(
                first.jam_mulai
              ).slice(0, 5)
            : "",

        jam_selesai:
          first.jam_selesai
            ? String(
                first.jam_selesai
              ).slice(0, 5)
            : "",

        id_wilayah_layanan:
          wilayahDefault ?? "",

        kategori_layanan:
          categoryIds,
      });
    } catch (error) {
      console.error(
        "Gagal mengambil data dashboard Nakes:",
        error
      );

      setToastMessage({
        type: "error",
        text:
          error?.response?.data
            ?.message ||
          "Gagal mengambil data Nakes.",
      });
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // INITIAL LOAD + FOCUS
  // =========================================================

  useEffect(() => {
    fetchData();

    const handleFocus = () => {
      fetchData();
    };

    const handleVisibility = () => {
      if (
        document.visibilityState ===
        "visible"
      ) {
        fetchData();
      }
    };

    window.addEventListener(
      "focus",
      handleFocus
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibility
    );

    return () => {
      window.removeEventListener(
        "focus",
        handleFocus
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );
    };
  }, []);

  // =========================================================
  // KATEGORI TOGGLE
  // =========================================================

  const handleCategoryToggle = (
    categoryId
  ) => {
    const id = Number(
      categoryId
    );

    setFormData((prev) => {
      const current =
        prev.kategori_layanan;

      if (current.includes(id)) {
        return {
          ...prev,
          kategori_layanan:
            current.filter(
              (item) =>
                item !== id
            ),
        };
      }

      return {
        ...prev,
        kategori_layanan: [
          ...current,
          id,
        ],
      };
    });
  };

  // =========================================================
  // DAY RANGE
  // =========================================================

  const generateHariList = (
    startDay,
    endDay
  ) => {
    const startIndex =
      LIST_HARI.indexOf(startDay);

    const endIndex =
      LIST_HARI.indexOf(endDay);

    if (
      startIndex === -1 ||
      endIndex === -1 ||
      startIndex > endIndex
    ) {
      return startDay
        ? [startDay]
        : [];
    }

    return LIST_HARI.slice(
      startIndex,
      endIndex + 1
    );
  };

  // =========================================================
  // SUBMIT EDIT
  // =========================================================

  const handleSubmitOperasional =
    async (e) => {
      e.preventDefault();

      if (
        !formData.id_wilayah_layanan
      ) {
        setToastMessage({
          type: "error",
          text:
            "Pilih wilayah layanan terlebih dahulu.",
        });

        return;
      }

      if (
        formData.kategori_layanan
          .length === 0
      ) {
        setToastMessage({
          type: "error",
          text:
            "Pilih minimal satu kategori layanan.",
        });

        return;
      }

      if (
        !formData.hari_mulai ||
        !formData.hari_selesai ||
        !formData.jam_mulai ||
        !formData.jam_selesai
      ) {
        setToastMessage({
          type: "error",
          text:
            "Lengkapi hari dan jam operasional.",
        });

        return;
      }

      // Backend mewajibkan jam selesai
      // lebih besar dari jam mulai.
      if (
        formData.jam_selesai <=
        formData.jam_mulai
      ) {
        setToastMessage({
          type: "error",
          text:
            "Jam selesai harus lebih besar dari jam mulai.",
        });

        return;
      }

      const daftarHari =
        generateHariList(
          formData.hari_mulai,
          formData.hari_selesai
        );

      if (
        daftarHari.length === 0
      ) {
        setToastMessage({
          type: "error",
          text:
            "Rentang hari operasional tidak valid.",
        });

        return;
      }

      setSubmitting(true);

      try {
        const waktuLayanan =
          daftarHari.map(
            (hari) => ({
              hari,
              jam_mulai:
                formData.jam_mulai.slice(
                  0,
                  5
                ),
              jam_selesai:
                formData.jam_selesai.slice(
                  0,
                  5
                ),
            })
          );

        const payload = {
          id_wilayah_layanan:
            Number(
              formData.id_wilayah_layanan
            ),

          kategori_layanan:
            formData.kategori_layanan.map(
              Number
            ),

          waktu_layanan:
            waktuLayanan,
        };

        await updateDataOperasional(
          payload
        );

        setToastMessage({
          type: "success",
          text:
            "Pengajuan berhasil dikirim ke Admin.",
        });

        setIsEditModalOpen(
          false
        );

        await fetchData();
      } catch (error) {
        const validationErrors =
          error?.response?.data
            ?.errors;

        let message =
          "Gagal mengirim pengajuan.";

        if (validationErrors) {
          message =
            Object.values(
              validationErrors
            )
              .flat()
              .join(" | ");
        } else if (
          error?.response?.data
            ?.message
        ) {
          message =
            error.response.data.message;
        }

        setToastMessage({
          type: "error",
          text: message,
        });
      } finally {
        setSubmitting(false);

        setTimeout(() => {
          setToastMessage(null);
        }, 5000);
      }
    };

  // =========================================================
  // DISPLAY DATA
  // =========================================================
const activeCategoryCandidates = [
  activeOperational?.kategori_layanan,
  activeOperational?.kategori,
  activeOperational?.layanan,
];

let activeCategoryRaw = [];

for (
  const candidate of activeCategoryCandidates
) {
  if (
    Array.isArray(candidate) &&
    candidate.length > 0
  ) {
    activeCategoryRaw = candidate;
    break;
  }

  if (
    typeof candidate === "string" &&
    candidate.trim().length > 0
  ) {
    activeCategoryRaw = candidate;
    break;
  }
}

  const activeCategoryNames =
    resolveCategoryNames(
      activeCategoryRaw,
      listCategories
    );

  // Kalau belum punya operasional approved,
  // gunakan kategori dari pendaftaran.
  const categoryDisplay =
    activeCategoryNames.length > 0
      ? Array.from(
          new Set(
            activeCategoryNames
          )
        )
      : nakesProfile
            .registeredCategoryNames
            ?.length > 0
        ? Array.from(
            new Set(
              nakesProfile.registeredCategoryNames
            )
          )
        : ["-"];

  const wilayahDisplay =
    activeOperational
      ? resolveWilayahName(
          activeOperational?.id_wilayah_layanan,
          activeOperational?.wilayah_layanan,
          listWilayah
        )
      : nakesProfile.registeredWilayahName ||
        "-";

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <>
      {/* =====================================================
          APPROVAL RESULT POPUP
          ===================================================== */}

      {approvalPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-white shadow-2xl p-6 text-center border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div
              className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-inner ${
                approvalPopup.type === "approved"
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
                  : "bg-rose-50 text-rose-600 border border-rose-100"
              }`}
            >
              {approvalPopup.type === "approved" ? (
                <CheckCircle2 className="w-7 h-7" />
              ) : (
                <AlertCircle className="w-7 h-7" />
              )}
            </div>

            <h3 className="text-lg font-bold text-slate-900 mb-1">
              {approvalPopup.title}
            </h3>

            <p className="text-xs text-slate-500 leading-relaxed">
              {approvalPopup.message}
            </p>

            {approvalPopup.notes && (
              <div className="mt-4 text-left rounded-2xl bg-rose-50/80 border border-rose-100 p-3.5">
                <p className="text-[11px] font-semibold text-rose-700 mb-1">
                  Catatan Admin
                </p>
                <p className="text-xs text-rose-800 whitespace-pre-wrap">
                  {approvalPopup.notes}
                </p>
              </div>
            )}

            <div className="flex justify-end mt-5">
              <button
                onClick={() =>
                  setApprovalPopup(
                    null
                  )
                }
                className={`px-4 py-2 text-xs font-semibold text-white rounded-xl ${
                  approvalPopup.type ===
                  "approved"
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "bg-rose-600 hover:bg-rose-700"
                }`}
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-slate-50/50 px-4 py-6 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto space-y-6">

          {/* TOAST HASIL SUBMIT */}
          {toastMessage && (
            <div
              className={`fixed top-5 right-5 z-50 max-w-md ${
                toastMessage.type ===
                "error"
                  ? "bg-rose-600"
                  : "bg-emerald-600"
              } text-white p-4 rounded-2xl shadow-xl flex items-center gap-3`}
            >
              {toastMessage.type ===
              "error" ? (
                <AlertCircle className="h-5 w-5" />
              ) : (
                <CheckCircle2 className="h-5 w-5" />
              )}

          <p className="text-xs font-medium pr-2">{toastMessage.text}</p>

              <button
                onClick={() =>
                  setToastMessage(
                    null
                  )
                }
                className="ml-auto"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* HEADER */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Dashboard
              </h1>

              <p className="text-sm text-slate-500">
                Menunggu Pesanan Pasien
              </p>
            </div>

            <button className="relative p-2.5 rounded-2xl bg-white shadow-sm border border-slate-200/60">
              <Bell className="h-5 w-5 text-slate-600" />

              {pendingRequest && (
                <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
              )}
            </button>
          </div>

          {/* PENDING */}
          {pendingRequest && (
            <div className="p-5 rounded-3xl border shadow-xs bg-amber-50/60 border-amber-200 text-amber-800">
              <div className="flex items-start gap-3">

                <Hourglass className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />

                <div>
                  <h4 className="font-bold text-sm">
                    Pengajuan Operasional Menunggu Persetujuan
                  </h3>

                  <p className="text-xs mt-1 text-slate-600">
                    Perubahan operasional sedang diproses admin. Data aktif tetap digunakan.
                  </p>

                  <div className="mt-2 p-2.5 bg-white/70 rounded-xl text-xs space-y-1">

                    <div>
                      <span className="font-semibold">
                        Wilayah Diajukan:
                      </span>{" "}
                      {
                        pendingRequest.location
                      }
                    </div>
                    <div>
                      <span className="font-semibold">
                        Jadwal Diajukan:
                      </span>{" "}
                      {
                        pendingRequest.hours
                      }
                    </div>

                    {pendingRequest
                      .kategoriNames
                      ?.length >
                      0 && (
                      <div>
                        <span className="font-semibold">
                          Kategori Diajukan:
                        </span>{" "}
                        {
                          pendingRequest.kategoriNames.join(
                            ", "
                          )
                        }
                      </div>
                    )}

                  </div>

                </div>
              </div>
            </div>
          )}

          {/* REJECTED */}
          {previousStatusRef.current ===
            "rejected" &&
            adminNotes && (
              <div className="p-5 rounded-3xl border bg-rose-50/60 border-rose-200 text-rose-800">

                <div className="flex items-start gap-3">

                  <AlertCircle className="h-6 w-6 text-rose-600 flex-shrink-0" />

                  <div>

                    <h4 className="font-bold text-sm">
                      Pengajuan Ditolak
                    </h4>

                    <p className="text-xs mt-1 text-slate-600">
                      Data operasional aktif sebelumnya tetap berlaku.
                    </p>

                    <div className="mt-2 p-2 bg-white/60 rounded-xl text-xs">

                      <span className="font-semibold">
                        Catatan Admin:
                      </span>{" "}

                      {adminNotes}

                    </div>

                  </div>

                </div>

              </div>
            )}

          {/* HERO + PROFILE */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

            {/* HERO */}
            <div className="lg:col-span-7 relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 p-6 sm:p-8 text-white shadow-xl">

              <div className="relative flex flex-col-reverse sm:flex-row items-center justify-between gap-6">

                <div className="flex-1 text-center sm:text-left">

                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 text-xs font-semibold backdrop-blur-md mb-4 border border-white/20">

                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />

                    Siap Menerima Pesanan
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-extrabold">
                    Menunggu Pesanan
                  </h2>

                  <p className="mt-2 text-sm text-blue-100 leading-relaxed max-w-sm">
                    Pesanan akan otomatis muncul di halaman ini saat pasien terdekat membutuhkan layanan Anda.
                  </p>

                </div>

                <div className="relative flex-shrink-0">

                  <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden bg-white/10 border border-white/20 p-2 backdrop-blur-sm">

                    <img
                      src="/images/dashboard/nurse-hero.png"
                      alt="Nurse"
                      className="w-full h-full object-contain"
                    />

                  </div>

                </div>
              </div>
            </div>

            {/* PROFIL OPERASIONAL */}
            <div className="lg:col-span-5 rounded-3xl bg-white shadow-sm border border-slate-200/80 p-6">

              <div className="flex items-center justify-between pb-4 border-b border-slate-100">

                <div className="flex items-center gap-2">

                  <Stethoscope className="h-5 w-5 text-blue-600" />

                  <h3 className="font-bold text-slate-900">
                    Profil Operasional
                  </h3>

                </div>

                <button
                  onClick={() =>
                    setIsEditModalOpen(
                      true
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  Edit
                </button>

              </div>

              {loading ? (
                <div className="py-8 flex justify-center items-center gap-2 text-slate-400 text-xs">

                  <Loader2 className="h-5 w-5 animate-spin" />

                  Memuat data...

                </div>
              ) : (
                <>

                  <div className="mt-5 flex items-center gap-4">

                    <div className="relative flex-shrink-0">

                      <img
                        src={
                          nakesProfile.photo
                        }
                        alt={
                          nakesProfile.name
                        }
                        className="h-16 w-16 rounded-2xl object-cover ring-2 ring-blue-100"
                      />

                      <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 ring-2 ring-white flex items-center justify-center">

                        <CheckCircle2 className="h-3 w-3 text-white" />

                      </span>

                    </div>

                    <div className="min-w-0 flex-1">

                      <h4 className="font-bold text-slate-900 text-base truncate">
                        {
                          nakesProfile.name
                        }
                      </h4>

                      <p
                        className="text-xs font-semibold text-blue-600"
                        title={
                          nakesProfile.service
                        }
                      >
                        {
                          nakesProfile.service
                        }
                      </p>

                    </div>

                    {/* Section Bawah: Menampilkan Kategori Layanan, Wilayah Layanan, dan Jadwal Operasional */}
                    <div className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Kategori Layanan */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Kategori Layanan
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {categoryDisplay.map((category, index) => (
                            <span
                              key={`desk-cat-${category}-${index}`}
                              className="inline-flex items-center px-2.5 py-1 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold"
                            >
                              {category}
                            </span>
                          ))}
                        </div>
                      </div>

                  <div className="mt-5 space-y-3">

                    {/* WILAYAH */}
                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50">

                      <MapPin className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />

                      <div className="min-w-0">

                        <p className="text-[10px] font-semibold text-slate-400 uppercase">
                          Wilayah Layanan
                        </p>

                        <p className="text-xs font-semibold text-slate-800 truncate">
                          {
                            displayWilayahName
                          }
                        </p>

                      </div>

                    </div>

                    {/* JADWAL */}
                    <div className="flex items-start gap-3 p-3 rounded-2xl bg-slate-50">

                      <Clock className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />

                      <div className="min-w-0 flex-1">

                        <div className="flex items-center justify-between">

                          <p className="text-[10px] font-semibold text-slate-400 uppercase">
                            Jadwal Operasional
                          </p>

                          {pendingRequest && (
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">
                              <Hourglass className="h-3 w-3" />
                              Menunggu Approval
                            </span>
                          )}

                        </div>

                        <p className="text-xs font-semibold text-slate-800">
                          {
                            activeSchedule?.hours ||
                            "-"
                          }
                        </p>

                      </div>

                {/* 2. Wilayah Layanan */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Wilayah Layanan
                  </p>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2.5 font-semibold text-slate-800">
                    <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{wilayahDisplay}</span>
                  </div>
                </div>

                {/* 3. Jadwal Operasional */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Jadwal Operasional
                  </p>
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-2.5 font-semibold text-slate-800">
                    <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>{scheduleDisplay}</span>
                  </div>
                </div>

                </>
              )}

            </div>
          </div>
        </div>

        {/* ===================================================
            MODAL EDIT
            =================================================== */}

        {isEditModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-xs">

            <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto">

              <div className="flex items-center justify-between pb-4 border-b border-slate-100">

                <h3 className="text-lg font-bold text-slate-900">
                  Edit Jam & Operasional
                </h3>

                <button
                  onClick={() =>
                    setIsEditModalOpen(
                      false
                    )
                  }
                  className="p-1.5 rounded-xl text-slate-400 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>

              </div>

              <form
                onSubmit={
                  handleSubmitOperasional
                }
                className="mt-4 space-y-4"
              >

                {/* WILAYAH */}
                <div>

                  <label className="text-xs font-semibold text-slate-700">
                    Wilayah Layanan
                  </label>

                  <select
                    value={
                      formData.id_wilayah_layanan
                    }
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        id_wilayah_layanan:
                          e.target.value,
                      })
                    }
                    className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-medium outline-none focus:border-blue-500"
                    required
                  >

                    <option value="">
                      Pilih Wilayah Layanan
                    </option>

                    {listWilayah.map(
                      (wil) => {

                        const idVal =
                          wil.id ??
                          wil.id_wilayah_layanan ??
                          wil.id_provinsi;

                        const nameVal =
                          wil.nama_provinsi ||
                          wil.nama_wilayah ||
                          wil.nama ||
                          `Wilayah #${idVal}`;

                        return (
                          <option
                            key={
                              idVal
                            }
                            value={
                              idVal
                            }
                          >
                            {
                              nameVal
                            }
                          </option>
                        );
                      }
                    )}

                  </select>

                </div>

                {/* KATEGORI */}
                <div>

                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Kategori Layanan
                  </label>

                  <div className="space-y-1.5 max-h-36 overflow-y-auto border border-slate-200 rounded-xl p-3 bg-slate-50/50">

                    {listCategories.length >
                    0 ? (
                      listCategories.map(
                        (cat) => {

                          const catId =
                            Number(
                              cat.id ??
                                cat.id_kategori_layanan
                            );

                          const catName =
                            cat.nama_kategori ||
                            cat.nama ||
                            `Kategori #${catId}`;

                          const checked =
                            formData.kategori_layanan.includes(
                              catId
                            );

                          return (
                            <label
                              key={
                                catId
                              }
                              className="flex items-center gap-2.5 text-xs text-slate-700 cursor-pointer py-1"
                            >

                              <input
                                type="checkbox"
                                checked={
                                  checked
                                }
                                onChange={() =>
                                  handleCategoryToggle(
                                    catId
                                  )
                                }
                                className="rounded border-slate-300 text-blue-600 h-4 w-4"
                              />

                              <span>
                                {
                                  catName
                                }
                              </span>

                            </label>
                          );
                        }
                      )
                    ) : (
                      <p className="text-xs text-slate-400">
                        Tidak ada data kategori layanan
                      </p>
                    )}

                  </div>

                </div>

                {/* HARI */}
                <div className="grid grid-cols-2 gap-3">

                  <div>

                    <label className="text-xs font-semibold text-slate-700">
                      Hari Mulai
                    </label>

                    <select
                      value={
                        formData.hari_mulai
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          hari_mulai:
                            e.target.value,
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-medium"
                      required
                    >

                      <option value="">
                        Pilih Hari
                      </option>

                      {LIST_HARI.map(
                        (day) => (
                          <option
                            key={day}
                            value={day}
                          >
                            {day}
                          </option>
                        )
                      )}

                    </select>

                  </div>

                  <div>

                    <label className="text-xs font-semibold text-slate-700">
                      Hari Selesai
                    </label>

                    <select
                      value={
                        formData.hari_selesai
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          hari_selesai:
                            e.target.value,
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-medium"
                      required
                    >

                      <option value="">
                        Pilih Hari
                      </option>

                      {LIST_HARI.map(
                        (day) => (
                          <option
                            key={day}
                            value={day}
                          >
                            {day}
                          </option>
                        )
                      )}

                    </select>

                  </div>

                </div>

                {/* JAM */}
                <div className="grid grid-cols-2 gap-3">

                  <div>

                    <label className="text-xs font-semibold text-slate-700">
                      Jam Mulai
                    </label>

                    <input
                      type="time"
                      value={
                        formData.jam_mulai
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          jam_mulai:
                            e.target.value,
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium"
                      required
                    />

                  </div>

                  <div>

                    <label className="text-xs font-semibold text-slate-700">
                      Jam Selesai
                    </label>

                    <input
                      type="time"
                      value={
                        formData.jam_selesai
                      }
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          jam_selesai:
                            e.target.value,
                        })
                      }
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-xs font-medium"
                      required
                    />

                  </div>

                </div>

                <div className="rounded-xl bg-amber-50 p-3 border border-amber-200/60">

                  <p className="text-[11px] font-medium text-amber-800">
                    Perubahan jadwal & operasional akan diajukan ke admin untuk proses persetujuan.
                  </p>

                </div>

                <div className="flex gap-2 pt-2">

                  <button
                    type="button"
                    onClick={() =>
                      setIsEditModalOpen(
                        false
                      )
                    }
                    disabled={
                      submitting
                    }
                    className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    disabled={
                      submitting
                    }
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 text-xs font-semibold text-white flex items-center justify-center gap-2"
                  >

                    {submitting && (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    )}

                    {submitting
                      ? "Mengirim..."
                      : "Kirim ke Admin"}

                  </button>

                </div>

              </form>
            </div>
          </div>
        )}

      </div>
    </>
  );
}
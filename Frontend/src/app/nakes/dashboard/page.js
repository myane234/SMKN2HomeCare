"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
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
  Phone,
  Home,
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  User,
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
  const router = useRouter();

  const [isEditModalOpen, setIsEditModalOpen] =
    useState(false);
  const [isMobileSheetOpen, setIsMobileSheetOpen] =
    useState(false);
  const [isDesktopCardOpen, setIsDesktopCardOpen] =
    useState(true);

  const touchStartRef = useRef(null);

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

  const scheduleDisplay =
    activeSchedule?.hours || "-";

  // =========================================================
  // AUTOMATIC ONLINE/OFFLINE STATUS HELPER
  // =========================================================
  const checkIsOnlineStatus = () => {
    const waktuLayanan = activeSchedule?.waktu_layanan;
    if (!waktuLayanan || !Array.isArray(waktuLayanan) || waktuLayanan.length === 0) {
      return false;
    }

    const now = new Date();
    const daysMap = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const currentDayName = daysMap[now.getDay()];
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    return waktuLayanan.some((item) => {
      if (!item || !item.hari || !item.jam_mulai || !item.jam_selesai) return false;
      if (item.hari !== currentDayName) return false;

      const [startH, startM] = String(item.jam_mulai).split(":").map(Number);
      const [endH, endM] = String(item.jam_selesai).split(":").map(Number);

      if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return false;

      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;

      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    });
  };

  const isOnlineStatus = checkIsOnlineStatus();

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
                type="button"
                onClick={() => setApprovalPopup(null)}
                className={`w-full py-2.5 text-xs font-semibold text-white rounded-xl shadow-sm transition ${
                  approvalPopup.type === "approved"
                    ? "bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98]"
                    : "bg-rose-600 hover:bg-rose-700 active:scale-[0.98]"
                }`}
              >
                Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          TOAST NOTIFICATION
          ===================================================== */}
      {toastMessage && (
        <div
          className={`fixed top-20 right-4 sm:right-6 z-[90] max-w-md text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 backdrop-blur-md animate-in slide-in-from-top-4 duration-300 ${
            toastMessage.type === "error"
              ? "bg-rose-600/95 border border-rose-500"
              : "bg-emerald-600/95 border border-emerald-500"
          }`}
        >
          {toastMessage.type === "error" ? (
            <AlertCircle className="w-5 h-5 shrink-0" />
          ) : (
            <CheckCircle2 className="w-5 h-5 shrink-0" />
          )}

          <p className="text-xs font-medium pr-2">{toastMessage.text}</p>

          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="ml-auto p-1 hover:bg-white/20 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="min-h-screen bg-slate-50/80 pb-24 sm:pb-12">
        {/* =====================================================
            1. HEADER TOP BAR (Sticky Top)
            ===================================================== */}
        <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-sm transition-all">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
            {/* Sisi Kiri: Tombol [← Beranda] */}
            <button
              type="button"
              onClick={() => router.push("/")}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-medium transition active:scale-95"
              title="Kembali ke Beranda"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            {/* Tengah: Judul "Dashboard Nakes" */}
            <h1 className="text-base sm:text-lg font-bold text-slate-900 truncate tracking-tight text-center">
              Dashboard Nakes
            </h1>

            {/* Sisi Kanan: Ikon [🔔 Notif] */}
            <button
              type="button"
              className="relative p-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 transition active:scale-95"
              title="Notifikasi"
            >
              <Bell className="w-5 h-5" />
              {pendingRequest && (
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
              )}
            </button>
          </div>
        </header>

        {/* MAIN CONTAINER */}
        <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-3 sm:pt-6 pb-28 sm:pb-6 space-y-4 sm:space-y-6">
          {/* =====================================================
              2. NOTIFICATION & PENDING REQUEST ALERT
              Diposisikan tepat di bawah Top Bar / di atas Hero Banner
              ===================================================== */}
          {pendingRequest && (
            <div className="rounded-2xl bg-amber-50/90 border border-amber-200/90 p-4 sm:p-5 shadow-sm animate-in fade-in duration-300">
              <div className="flex items-start gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-inner">
                  <Hourglass className="w-5 h-5" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-amber-200/80 text-amber-900 text-[10px] font-bold uppercase tracking-wider">
                      Pending Approval
                    </span>
                  </div>
                  <h3 className="font-bold text-sm text-amber-950 mt-1">
                    Pengajuan Operasional Menunggu Persetujuan
                  </h3>

                  <p className="text-xs text-amber-800/90 mt-1 leading-relaxed">
                    Data operasional aktif Anda tetap digunakan hingga perubahan ini disetujui oleh admin.
                  </p>

                  <div className="mt-3 bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-amber-100/60 space-y-1.5 text-xs text-slate-700">
                    <div>
                      <span className="font-semibold text-slate-900">
                        Wilayah Layanan:
                      </span>{" "}
                      {pendingRequest.location || "-"}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900">
                        Jadwal Operasional:
                      </span>{" "}
                      {pendingRequest.hours || "-"}
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900">
                        Kategori Layanan:
                      </span>{" "}
                      {pendingRequest.kategoriNames?.join(", ") || "-"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =====================================================
              3. HERO BANNER STATUS (Dinamis Sesuai Jam Operasional)
              ===================================================== */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white p-5 sm:p-8 shadow-lg shadow-blue-500/10 mt-8 sm:mt-0 my-1 sm:my-0">
            {/* Background Decorative Element */}
            <div className="absolute -right-10 -bottom-10 w-60 h-60 rounded-full bg-white/10 blur-2xl pointer-events-none" />

            <div className="relative flex flex-col sm:flex-row items-center justify-between gap-5 sm:gap-6">
              <div className="text-center sm:text-left z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 border border-white/20 text-xs font-semibold backdrop-blur-md mb-2.5 sm:mb-3">
                  {isOnlineStatus ? (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
                      <span>Status: Online 🟢</span>
                    </>
                  ) : (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-sm shadow-rose-400/50" />
                      <span>Status: Offline 🔴</span>
                    </>
                  )}
                </div>

                <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight">
                  Menunggu Pesanan
                </h2>

                <p className="mt-1.5 sm:mt-2 max-w-md text-xs sm:text-sm text-blue-100 leading-relaxed">
                  {isOnlineStatus
                    ? "Sistem aktif dan siap menerima panggilan layanan. Pesanan pasien akan otomatis tampil secara real-time di dashboard ini."
                    : "Anda sedang di luar jam operasional. Sistem tidak menerima pesanan saat ini."}
                </p>
              </div>

              <div className="shrink-0 z-10">
                <img
                  src="/images/dashboard/nurse-hero.png"
                  alt="Status Nakes"
                  className="w-32 sm:w-48 md:w-56 object-contain drop-shadow-md"
                />
              </div>
            </div>
          </div>

          {/* =====================================================
              1. TAMPILAN DESKTOP (`sm:` ke atas)
              1 Card Tunggal (Collapsible)
              ===================================================== */}
          <div className="hidden sm:block">
            {loading ? (
              <div className="rounded-3xl bg-white border border-slate-200/80 p-12 text-center text-slate-400 text-sm flex items-center justify-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                Memuat data profil nakes...
              </div>
            ) : (
              <div className="rounded-3xl bg-white border border-slate-200/80 shadow-sm overflow-hidden transition-all duration-300">
                {/* Header Card: Judul "Profil Operasional" + Tombol Toggle "Sembunyikan/Tampilkan" */}
                <div
                  onClick={() => setIsDesktopCardOpen((prev) => !prev)}
                  className="p-6 flex items-center justify-between cursor-pointer select-none border-b border-slate-100 hover:bg-slate-50/60 transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-blue-50 text-blue-600">
                      <Stethoscope className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base sm:text-lg">
                        Profil Operasional
                      </h3>
                      <p className="text-xs text-slate-500">
                        Kelola data pribadi, wilayah, jadwal, dan kategori layanan
                      </p>
                    </div>
                  </div>

                  {/* Tombol Toggle "Sembunyikan/Tampilkan" */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsDesktopCardOpen((prev) => !prev);
                    }}
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold transition"
                  >
                    <span>{isDesktopCardOpen ? "Sembunyikan" : "Tampilkan"}</span>
                    {isDesktopCardOpen ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>

                {/* Isi Card (Saat Terbuka) */}
                {isDesktopCardOpen && (
                  <div className="p-6 space-y-6 divide-y divide-slate-100 animate-in fade-in duration-200">
                    {/* Section Atas: Foto Nakes, Nama Lengkap, No. Telepon, Alamat Utama, dan Tombol Action [Edit Operasional] */}
                    <div className="space-y-5">
                      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                        {/* Foto Nakes (rasio 3x4) */}
                        <div className="w-32 h-40 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shadow-sm shrink-0 flex items-center justify-center">
                          {nakesProfile.photo ? (
                            <img
                              src={nakesProfile.photo}
                              alt="Pas Foto Nakes"
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 p-2 text-center">
                              <User className="w-10 h-10 mb-1 opacity-40" />
                              <span className="text-[10px]">Belum ada foto</span>
                            </div>
                          )}
                        </div>

                        {/* Nama, No HP, Alamat */}
                        <div className="flex-1 space-y-4 text-center sm:text-left w-full min-w-0">
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Nama Lengkap
                            </p>
                            <p className="mt-0.5 text-lg font-extrabold text-slate-900 truncate">
                              {nakesProfile.name}
                            </p>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0 mt-0.5">
                                <Phone className="w-4 h-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                  No. Telepon
                                </p>
                                <p className="text-xs font-semibold text-slate-800 break-words mt-0.5">
                                  {nakesProfile.phone}
                                </p>
                              </div>
                            </div>

                            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                              <div className="p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0 mt-0.5">
                                <Home className="w-4 h-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                                  Alamat Utama
                                </p>
                                <p className="text-xs font-medium text-slate-700 leading-relaxed break-words mt-0.5">
                                  {nakesProfile.address}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Tombol Action [Edit Operasional] (setelah Alamat) */}
                          <div className="flex justify-end pt-1">
                            <button
                              type="button"
                              onClick={() => setIsEditModalOpen(true)}
                              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition active:scale-95"
                            >
                              <Edit3 className="w-4 h-4" />
                              <span>Edit Operasional</span>
                            </button>
                          </div>
                        </div>
                      </div>
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

                      {/* Wilayah Layanan */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                        <div className="p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0 mt-0.5">
                          <MapPin className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Wilayah Layanan
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-800">
                            {wilayahDisplay}
                          </p>
                        </div>
                      </div>

                      {/* Jadwal Operasional */}
                      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-start gap-3">
                        <div className="p-2 rounded-xl bg-blue-50 text-blue-600 shrink-0 mt-0.5">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            Jadwal Operasional
                          </p>
                          <p className="mt-1 text-xs font-semibold text-slate-800">
                            {scheduleDisplay}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>

        {/* =====================================================
            2. TAMPILAN MOBILE (`< sm`)
            Bottom Sheet Fixed Bottom (Framer Motion Touch Gesture)
            ===================================================== */}
        <div className="block sm:hidden">
          {/* Backdrop Blur saat Bottom Sheet terbuka */}
          {isMobileSheetOpen && (
            <div
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs transition-opacity"
              onClick={() => setIsMobileSheetOpen(false)}
            />
          )}

          {/* Fixed Bottom Sheet Container */}
          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={0.15}
            onDragEnd={(event, info) => {
              // Swipe up (offset.y < -30 atau velocity.y < -200) -> Buka sheet
              if (info.offset.y < -30 || info.velocity.y < -200) {
                setIsMobileSheetOpen(true);
              }
              // Swipe down (offset.y > 30 atau velocity.y > 200) -> Tutup sheet
              else if (info.offset.y > 30 || info.velocity.y > 200) {
                setIsMobileSheetOpen(false);
              }
            }}
            className={`fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl border-t border-slate-200 transition-all duration-300 ease-out flex flex-col h-auto ${
              isMobileSheetOpen ? "max-h-[85vh]" : "max-h-none"
            }`}
          >
            {/* Header / Drag Handle Clickable & Touch Area */}
            <div
              onClick={() => setIsMobileSheetOpen((prev) => !prev)}
              className="px-5 pt-3 pb-4 cursor-pointer select-none bg-white rounded-t-3xl border-b border-slate-100 touch-none"
            >
              {/* Drag Handle Indicator */}
              <div className="w-full pb-3 flex justify-center">
                <div className="w-12 h-1.5 rounded-full bg-slate-300 hover:bg-slate-400 transition" />
              </div>

              {/* Kondisi Collapsed: Foto Profil, Nama, No HP, Alamat Lengkap Utuh */}
              <div className="flex items-start gap-3.5">
                {/* Foto Profil (kiri) */}
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0 flex items-center justify-center mt-0.5 shadow-xs">
                  {nakesProfile.photo ? (
                    <img
                      src={nakesProfile.photo}
                      alt="Foto Nakes"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  ) : (
                    <User className="w-7 h-7 text-slate-400" />
                  )}
                </div>

                {/* Nama, No. Telepon, Alamat Lengkap Utuh */}
                <div className="min-w-0 flex-1 space-y-1">
                  <h4 className="font-extrabold text-slate-900 text-sm sm:text-base leading-tight">
                    {nakesProfile.name}
                  </h4>
                  <p className="text-xs font-semibold text-blue-600 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 shrink-0" />
                    <span>{nakesProfile.phone}</span>
                  </p>
                  <p className="text-xs text-slate-600 text-blue-600 leading-relaxed flex items-start gap-1.5 pt-0.5">
                    <Home className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="break-words font-medium">
                      {nakesProfile.address}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Kondisi Terbuka / Expanded (Swipe Up):
                Informasi tanpa redundansi alamat.
                Urutan: 1. Kategori Layanan (Badges), 2. Wilayah Layanan, 3. Jadwal Operasional, 4. Tombol [Edit Operasional] */}
            {isMobileSheetOpen && (
              <div className="p-5 overflow-y-auto space-y-4 text-xs flex-1 animate-in fade-in duration-200">
                {/* 1. Kategori Layanan (Badges) */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Kategori Layanan
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {categoryDisplay.map((category, index) => (
                      <span
                        key={`mob-exp-${category}-${index}`}
                        className="inline-flex items-center px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
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

                {/* 4. Tombol [Edit Operasional] full-width di paling bawah */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(true);
                      setIsMobileSheetOpen(false);
                    }}
                    className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit Operasional</span>
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* =====================================================
          6. MODAL EDIT OPERASIONAL
          Form pop-up dengan header sticky, pilihan checkbox kategori,
          select wilayah, time picker jam kerja, serta action buttons.
          ===================================================== */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header Sticky Modal */}
            <div className="sticky top-0 z-10 bg-white flex items-center justify-between p-5 border-b border-slate-100">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Edit Profil Operasional
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Perubahan kategori, wilayah, dan jadwal akan diajukan ke admin.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body (Scrollable) */}
            <form
              onSubmit={handleSubmitOperasional}
              className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1"
            >
              {/* Checkbox Kategori */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Kategori Layanan
                </label>

                <div className="border border-slate-200/90 rounded-2xl p-3 space-y-2 max-h-48 overflow-y-auto bg-slate-50/50">
                  {listCategories.length > 0 ? (
                    listCategories.map((category) => {
                      const categoryId = Number(
                        category.id ??
                          category.id_kategori_layanan ??
                          category.id_kategori
                      );

                      const categoryName =
                        category.nama_kategori ||
                        category.nama_layanan ||
                        category.nama ||
                        category.label ||
                        `Kategori #${categoryId}`;

                      const checked =
                        formData.kategori_layanan.includes(categoryId);

                      return (
                        <label
                          key={categoryId}
                          className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition ${
                            checked
                              ? "bg-blue-50/90 border-blue-200 text-blue-900 shadow-xs"
                              : "bg-white border-slate-200/60 hover:bg-slate-100/80 text-slate-700"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => handleCategoryToggle(categoryId)}
                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                          />
                          <span className="text-xs font-medium">
                            {categoryName}
                          </span>
                        </label>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-400 p-2 text-center">
                      Data kategori belum tersedia.
                    </p>
                  )}
                </div>
              </div>

              {/* Select Wilayah */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Wilayah Layanan
                </label>

                <select
                  value={formData.id_wilayah_layanan}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      id_wilayah_layanan: e.target.value,
                    }))
                  }
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                  required
                >
                  <option value="">Pilih wilayah layanan</option>
                  {listWilayah.map((wilayah) => {
                    const id =
                      wilayah.id_provinsi ??
                      wilayah.id_wilayah_layanan ??
                      wilayah.id;

                    const name =
                      wilayah.nama_provinsi ||
                      wilayah.nama_wilayah ||
                      wilayah.nama;

                    return (
                      <option key={id} value={id}>
                        {name}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Select Hari Operasional */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
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
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                    required
                  >
                    <option value="">Pilih hari</option>
                    {LIST_HARI.map((hari) => (
                      <option key={hari} value={hari}>
                        {hari}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
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
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                    required
                  >
                    <option value="">Pilih hari</option>
                    {LIST_HARI.map((hari) => (
                      <option key={hari} value={hari}>
                        {hari}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Time Picker Jam Kerja */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
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
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">
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
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
                    required
                  />
                </div>
              </div>

              {/* Info Pengajuan */}
              <div className="rounded-2xl bg-amber-50/80 border border-amber-200/80 p-3.5 flex items-start gap-3">
                <Hourglass className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 leading-relaxed">
                  Perubahan kategori, wilayah, dan jadwal akan menjadi pengajuan baru dan tidak langsung mengubah data aktif sebelum disetujui admin.
                </p>
              </div>

              {/* Action Buttons di Bagian Bawah Modal */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  disabled={submitting}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition active:scale-95"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-50 transition active:scale-95 shadow-sm"
                >
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {submitting ? "Mengirim..." : "Kirim ke Admin"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
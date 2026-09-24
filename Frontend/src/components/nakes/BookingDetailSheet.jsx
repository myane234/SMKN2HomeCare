"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, useAnimationControls, useDragControls } from "framer-motion";
import useSWR from "swr";
import {
  X,
  Loader2,
  MessageSquare,
  CheckCircle,
  Plus,
  Minus,
  Package,
  MapPin,
  Send,
  Lock,
  AlertCircle,
  Maximize2,
  Minimize2,
} from "lucide-react";
import {
  getBhpBooking,
  addBhpBooking,
  getNakesOrderDetail,
  updateNakesLocation,
  sendBookingChatMessage,
  getBookingChatMessages,
  deleteBookingChatRoom,
} from "@/services/nakesService";
import api from "@/services/api";

export default function BookingDetailSheet({
  booking,
  isOpen,
  onClose,
  bookingDetailLoading,
  getBookingCode,
  getBookingPatientName,
  getBookingVisitDate,
  onRefresh,
}) {
  const controls = useAnimationControls();
  const dragControls = useDragControls();
  const messagesEndRef = useRef(null);
  const finishTimeoutRef = useRef(null);

  const [bhpItems, setBhpItems] = useState([]);
  const [bhpMeta, setBhpMeta] = useState({
    total_tambahan: 0,
    status_pembayaran_bhp: null,
  });
  const [savingBhp, setSavingBhp] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [toast, setToast] = useState(null);
  const [biayaTambahanStatus, setBiayaTambahanStatus] = useState(null);
  const [checkingBiayaTambahan, setCheckingBiayaTambahan] = useState(false);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingChat, setSendingChat] = useState(false);

  const [sheetMode, setSheetMode] = useState("peek");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  const bookingId = booking?.id_booking ?? booking?.booking_id ?? booking?.id ?? null;
  const bookingCode = booking?.booking_code ?? booking?.kode_booking ?? booking?.code ?? null;
  const targetCode = bookingCode || bookingId;

  const statusStr = String(booking?.status_booking ?? booking?.status ?? "").toLowerCase();
  const isDesktop = (viewport?.width ?? 0) >= 768;

  const safeGetPatientName = (b) =>
    getBookingPatientName?.(b) || b?.pasien?.nama_lengkap || b?.pasien?.nama || b?.nama_pasien || b?.user?.name || "Pasien";
  const safeGetBookingCode = (b) =>
    getBookingCode?.(b) || b?.booking_code || b?.kode_booking || (getBookingId?.(b) ? `#${getBookingId?.(b)}` : "-");
  const safeGetVisitDate = (b) =>
    getBookingVisitDate?.(b) || b?.tanggal_kunjungan || b?.tanggal_booking || "-";

  const serviceName = Array.isArray(booking?.layanan_items) && booking.layanan_items.length > 0
    ? booking.layanan_items.map((item) => item?.nama_layanan || item?.layanan?.nama_layanan || item?.nama).filter(Boolean).join(", ") || "-"
    : booking?.layanan?.nama_layanan || booking?.nama_layanan || booking?.service_name || "-";

  // Layout metrics untuk Bottom Sheet vs Fullscreen
  const MOBILE_NAV_HEIGHT = 70;
  const MOBILE_PEEK_HEIGHT = 76;
  const DESKTOP_PEEK_HEIGHT = 80;
  const DESKTOP_SHEET_HEIGHT = 440;

  const sheetHeight = isFullscreen
    ? isDesktop
      ? "85vh"
      : "100vh"
    : isDesktop
    ? DESKTOP_SHEET_HEIGHT
    : Math.max(380, (viewport?.height ?? 800) - MOBILE_NAV_HEIGHT - 12);

  const peekHeight = isDesktop ? DESKTOP_PEEK_HEIGHT : MOBILE_PEEK_HEIGHT;
  const peekOffset = isFullscreen
    ? 0
    : typeof sheetHeight === "number"
    ? Math.max(0, sheetHeight - peekHeight)
    : Math.max(0, (viewport?.height ?? 800) * 0.9 - peekHeight);

  const makeKey = (idLayanan, idBhp) => `${idLayanan ?? "x"}_${idBhp ?? "x"}`;

  const normalizeStatus = (value) => {
    if (!value) return null;
    const s = String(value).trim().toLowerCase();
    if (
      s === "lunas" ||
      s === "paid" ||
      s === "settlement" ||
      s === "success" ||
      s === "completed" ||
      s.includes("lunas") ||
      s.includes("settlement") ||
      s.includes("paid")
    ) {
      return "Lunas";
    }
    if (
      s === "belum bayar" ||
      s === "unpaid" ||
      s === "pending" ||
      s === "waiting" ||
      s.includes("belum") ||
      s.includes("pending")
    ) {
      return "Belum Bayar";
    }
    return String(value);
  };

  /* ── SKELETON dari booking.layanan_items (WAJIB) ── */
  const buildSkeletonFromBooking = useCallback(() => {
    const list = [];
    const map = new Map();

    if (Array.isArray(booking?.layanan_items)) {
      booking.layanan_items.forEach((layanan) => {
        const idLayanan = layanan?.id_layanan ?? layanan?.id ?? null;
        const namaLayanan = layanan?.nama_layanan || layanan?.nama || null;
        const bhpList = layanan?.bhp_items || layanan?.items || layanan?.bhp || [];

        if (Array.isArray(bhpList)) {
          bhpList.forEach((b) => {
            const idBhp = b?.id_bhp ?? b?.bhp_item?.id_bhp ?? b?.id ?? null;
            if (idLayanan == null || idBhp == null) return;

            const key = makeKey(idLayanan, idBhp);
            if (map.has(key)) return;

            const item = {
              id_booking_bhp: b?.id_booking_bhp ?? null,
              id_layanan: idLayanan,
              nama_layanan: namaLayanan,
              id_bhp: idBhp,
              nama_bhp: b?.nama_bhp ?? b?.bhp_item?.nama_bhp ?? b?.nama_item ?? b?.nama ?? "-",
              harga_satuan: Number(b?.harga_satuan ?? b?.harga_jual ?? b?.harga ?? b?.bhp_item?.harga_jual ?? 0) || 0,
              qty_default: Number(b?.qty_default ?? b?.default_qty ?? b?.jumlah_default ?? b?.qty ?? b?.jumlah ?? 0) || 0,
              qty_real: Number(b?.qty_default ?? b?.default_qty ?? b?.jumlah_default ?? b?.qty ?? b?.jumlah ?? 0) || 0,
              qty_tambahan: 0,
            };
            map.set(key, item);
            list.push(item);
          });
        }
      });
    }
    return { list, map };
  }, [booking]);

  /* ── PARSE RESPONSE /bhp ── */
  const parseBhpResponse = useCallback(
    (response) => {
      const root = response?.data?.data ?? response?.data ?? response ?? {};
      const { list: skeletonList, map: skeletonMap } = buildSkeletonFromBooking();

      let itemsSource = [];
      if (Array.isArray(root?.items)) itemsSource = root.items;
      else if (Array.isArray(root?.bhp_items)) itemsSource = root.bhp_items;
      else if (Array.isArray(response?.data)) itemsSource = response.data;
      else if (Array.isArray(root)) itemsSource = root;

      const usedKeys = new Set();

      itemsSource.forEach((entry) => {
        const idLayanan = entry?.id_layanan ?? entry?.layanan_id ?? null;
        const idBhp = entry?.id_bhp ?? entry?.bhp_item?.id_bhp ?? entry?.id ?? null;
        if (idBhp == null) return;

        const qtyTambahanRaw = entry?.qty_tambahan ?? entry?.jumlah_tambahan ?? null;
        const qtyRealRaw = entry?.qty_real ?? entry?.jumlah_real ?? entry?.qty ?? entry?.jumlah ?? null;

        let targetKey = null;

        if (idLayanan != null) {
          const k = makeKey(idLayanan, idBhp);
          if (skeletonMap.has(k) && !usedKeys.has(k)) targetKey = k;
        }

        if (!targetKey) {
          for (const [k, val] of skeletonMap) {
            if (val.id_bhp === idBhp && !usedKeys.has(k)) {
              targetKey = k;
              break;
            }
          }
        }

        if (targetKey) {
          usedKeys.add(targetKey);
          const sk = skeletonMap.get(targetKey);
          if (qtyRealRaw != null) sk.qty_real = Math.max(sk.qty_default, Number(qtyRealRaw) || 0);
          else sk.qty_real = sk.qty_default + Math.max(0, Number(qtyTambahanRaw) || 0);
          sk.qty_tambahan = Math.max(0, sk.qty_real - sk.qty_default);
          if (entry?.id_booking_bhp) sk.id_booking_bhp = entry.id_booking_bhp;
          if (entry?.nama_bhp && (!sk.nama_bhp || sk.nama_bhp === "-")) sk.nama_bhp = entry.nama_bhp;
        } else {
          const newItem = {
            id_booking_bhp: entry?.id_booking_bhp ?? null,
            id_layanan: idLayanan,
            nama_layanan: entry?.nama_layanan ?? null,
            id_bhp: idBhp,
            nama_bhp: entry?.nama_bhp ?? entry?.bhp_item?.nama_bhp ?? entry?.nama_item ?? "-",
            harga_satuan: Number(entry?.harga_satuan ?? entry?.harga_jual ?? entry?.harga ?? 0) || 0,
            qty_default: Math.max(0, Number(entry?.qty_default) || 0),
            qty_real: 0,
            qty_tambahan: 0,
          };
          newItem.qty_real = Math.max(
            newItem.qty_default,
            Number(qtyRealRaw) || newItem.qty_default + Math.max(0, Number(qtyTambahanRaw) || 0)
          );
          newItem.qty_tambahan = Math.max(0, newItem.qty_real - newItem.qty_default);
          skeletonList.push(newItem);
          skeletonMap.set(makeKey(idLayanan, idBhp) + "_" + skeletonList.length, newItem);
        }
      });

      const calculatedTotal = skeletonList.reduce(
        (acc, item) => acc + (Number(item.qty_tambahan) || 0) * (Number(item.harga_satuan) || 0),
        0
      );

      const rawTotalFromMeta = root?.total_tambahan ?? root?.sb_tambahan ?? response?.meta?.total_tambahan;
      let totalTambahan = calculatedTotal;
      if (rawTotalFromMeta != null && Number(rawTotalFromMeta) > 0) {
        totalTambahan = Math.max(calculatedTotal, Number(rawTotalFromMeta));
      }

      const statusPembayaran = normalizeStatus(
        root?.status_transaksi ??
        root?.status_pembayaran_bhp ??
        response?.meta?.status_pembayaran_bhp ??
        (totalTambahan === 0 ? "Lunas" : null)
      );

      return {
        items: skeletonList,
        total_tambahan: totalTambahan,
        status_pembayaran_bhp: statusPembayaran,
      };
    },
    [buildSkeletonFromBooking]
  );

  const extractBiayaTambahanFromResponse = (res) => {
    const root = res?.data ?? res ?? {};
    const bookingData = root?.booking ?? root;

    const nominal =
      Number(
        bookingData?.total_biaya_tambahan ??
        bookingData?.total_tambahan ??
        root?.total_biaya_tambahan ??
        0
      ) || 0;

    const rawStatus =
      bookingData?.status_pembayaran_biaya_tambahan ??
      bookingData?.status_pembayaran_bhp ??
      bookingData?.status_biaya_tambahan ??
      root?.status_pembayaran_biaya_tambahan ??
      null;

    return {
      nominal,
      status: normalizeStatus(rawStatus),
    };
  };

  const loadBiayaTambahanStatus = useCallback(async () => {
    if (!bookingId || checkingBiayaTambahan) return;
    setCheckingBiayaTambahan(true);

    try {
      const res = await getNakesOrderDetail(bookingId);
      const parsed = extractBiayaTambahanFromResponse(res);

      if (parsed.nominal !== undefined && parsed.nominal !== null) {
        setBhpMeta((prev) => ({
          ...prev,
          total_tambahan: parsed.nominal,
        }));
      }

      if (parsed.status) {
        setBiayaTambahanStatus(parsed.status);
        setBhpMeta((prev) => ({
          ...prev,
          status_pembayaran_bhp: parsed.status,
        }));
      }
    } catch (error) {
      console.warn("Gagal mengecek status biaya tambahan:", error);
    } finally {
      setCheckingBiayaTambahan(false);
    }
  }, [bookingId, checkingBiayaTambahan]);

  useEffect(() => {
    const updateViewport = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateViewport();
    window.addEventListener("resize", updateViewport);
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  useEffect(() => {
    if (!isOpen || !booking) return;

    setSheetMode("peek");
    setIsFullscreen(false);
    const currentHeight = isDesktop
      ? DESKTOP_SHEET_HEIGHT
      : Math.max(380, window.innerHeight - MOBILE_NAV_HEIGHT - 12);

    const currentPeekOffset = Math.max(
      0,
      currentHeight - (isDesktop ? DESKTOP_PEEK_HEIGHT : MOBILE_PEEK_HEIGHT)
    );

    controls.start({
      y: currentPeekOffset,
      transition: { type: "spring", damping: 30, stiffness: 280 },
    });
  }, [isOpen, bookingId, controls, isDesktop]);

  useEffect(() => {
    if (!isOpen) return;

    if (isFullscreen) {
      controls.start({
        y: 0,
        transition: { type: "spring", damping: 30, stiffness: 280 },
      });
    } else {
      controls.start({
        y: sheetMode === "full" ? 0 : peekOffset,
        transition: { type: "spring", damping: 30, stiffness: 280 },
      });
    }
  }, [sheetMode, isFullscreen, peekOffset, controls, isOpen]);

  useEffect(() => {
    return () => {
      if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);
    };
  }, []);

  // Location tracking (berjalan secara independen tanpa memicu re-fetch data)
  useEffect(() => {
    if (!bookingId || !isOpen) return;

    let cancelled = false;

    const updateLocation = () => {
      if (typeof window === "undefined" || !navigator.geolocation) return;

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          if (cancelled) return;
          try {
            await updateNakesLocation({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              booking_id: bookingId,
            });
          } catch (error) {
            console.warn("Gagal update lokasi:", error);
          }
        },
        () => {},
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    };

    updateLocation();
    const interval = window.setInterval(updateLocation, 15000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [bookingId, isOpen]);

  const [loadedTargetCode, setLoadedTargetCode] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setLoadedTargetCode(null);
    }
  }, [isOpen]);

  // Conditional SWR untuk BHP (Hanya panggil bookingCode yang terbuka, shouldRetryOnError: false)
  const {
    data: rawBhpData,
    isLoading: loadingBhp,
    mutate: mutateBhp,
  } = useSWR(
    isOpen && targetCode ? `/api/nakes/booking/${targetCode}/bhp` : null,
    () => getBhpBooking(targetCode),
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      refreshInterval: 0,
      shouldRetryOnError: false,
      dedupingInterval: 10000,
    }
  );

  useEffect(() => {
    if (!isOpen || !targetCode) return;

    // State lokal HANYA di-set dari API saat modal pertama kali DIBUKA (initial load)
    if (loadedTargetCode !== targetCode) {
      if (!rawBhpData) {
        setBhpItems(buildSkeletonFromBooking().list);
        return;
      }

      const result = parseBhpResponse(rawBhpData);
      setBhpItems(result.items);
      setBhpMeta({
        total_tambahan: result.total_tambahan,
        status_pembayaran_bhp: result.status_pembayaran_bhp ?? null,
      });
      if (result.status_pembayaran_bhp) {
        setBiayaTambahanStatus(result.status_pembayaran_bhp);
      }
      loadBiayaTambahanStatus();
      setLoadedTargetCode(targetCode);
    }
  }, [isOpen, targetCode, rawBhpData, loadedTargetCode, parseBhpResponse, buildSkeletonFromBooking, loadBiayaTambahanStatus]);

  /* POLLING STATUS BIAYA TAMBAHAN 5s */
  useEffect(() => {
    if (!bookingId || !isOpen) return;
    const interval = window.setInterval(() => loadBiayaTambahanStatus(), 5000);
    const onVisibility = () => {
      if (document.visibilityState === "visible") loadBiayaTambahanStatus();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onVisibility);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onVisibility);
    };
  }, [bookingId, isOpen, loadBiayaTambahanStatus]);

  /* QTY CHANGE */
  const handleQtyChange = (targetIndex, delta) => {
    setBhpItems((prev) =>
      prev.map((item, index) => {
        if (index !== targetIndex) return item;
        const defaultQty = Number(item?.qty_default) || 0;
        const currentQty = Number(item?.qty_real) || defaultQty;
        const nextQty = Math.max(defaultQty, currentQty + delta);
        return {
          ...item,
          qty_real: nextQty,
          qty_tambahan: Math.max(0, nextQty - defaultQty),
        };
      })
    );
  };

  /* SAVE BHP */
  const handleSaveBhp = async () => {
    if (!targetCode || savingBhp) return;
    setSavingBhp(true);

    try {
      const payloadItems = bhpItems.map((item) => {
        const defaultQty = Number(item.qty_default) || 0;
        const realQty = Math.max(defaultQty, Number(item.qty_real) || defaultQty);
        const tambahanQty = Math.max(0, realQty - defaultQty);
        const harga = Number(item.harga_satuan) || 0;
        return {
          id_booking_bhp: item.id_booking_bhp || null,
          id_layanan: item.id_layanan || null,
          id_bhp: item.id_bhp || null,
          nama_bhp: item.nama_bhp || null,
          nama_layanan: item.nama_layanan || null,
          qty_default: defaultQty,
          qty_real: realQty,
          qty_tambahan: tambahanQty,
          qty: realQty,
          jumlah: realQty,
          jumlah_real: realQty,
          jumlah_tambahan: tambahanQty,
          harga_satuan: harga,
          harga_jual: harga,
          subtotal_tambahan: tambahanQty * harga,
        };
      });

      const totalTambahan = payloadItems.reduce(
        (acc, i) => acc + i.subtotal_tambahan,
        0
      );
      const nakesId = Number(
        booking?.id_nakes ??
        booking?.nakes_id ??
        booking?.nakes?.id_nakes ??
        booking?.nakes?.id ??
        0
      );

      const payload = {
        items: payloadItems,
        total_tambahan: totalTambahan,
        ...(nakesId > 0 ? { updated_by: nakesId } : {}),
      };

      const response = await addBhpBooking(targetCode, payload);
      if (response?.success === false || response?.status === false) {
        throw new Error(response?.message || "Gagal menyimpan.");
      }

      setBhpItems(
        payloadItems.map((p) => ({
          ...p,
          id_booking_bhp: p.id_booking_bhp ?? null,
          qty_default: Number(p.qty_default) || 0,
          qty_real: Number(p.qty_real) || 0,
          qty_tambahan: Number(p.qty_tambahan) || 0,
          harga_satuan: Number(p.harga_satuan) || 0,
        }))
      );

      const isTotalZero = totalTambahan === 0;

      if (isTotalZero) {
        setBiayaTambahanStatus("Lunas");
        setBhpMeta({ total_tambahan: 0, status_pembayaran_bhp: "Lunas" });
      } else {
        setBhpMeta({
          total_tambahan: totalTambahan,
          status_pembayaran_bhp:
            response?.data?.status_transaksi ??
            response?.status_transaksi ??
            "Belum Bayar",
        });
      }

      await mutateBhp();
      if (onRefresh) {
        try {
          await onRefresh();
        } catch {}
      }
      await loadBiayaTambahanStatus();

      setToast({
        type: "success",
        text:
          response?.message ||
          (isTotalZero
            ? "Biaya Tambahan direset ke default."
            : "Biaya Tambahan berhasil disimpan."),
      });
    } catch (error) {
      console.error("Gagal simpan BHP:", error);
      setToast({
        type: "error",
        text: error?.response?.data?.message || error?.message || "Gagal menyimpan.",
      });
    } finally {
      setSavingBhp(false);
    }
  };

  /* GROUPING BHP BY LAYANAN */
  const layananMap = new Map();
  if (Array.isArray(booking?.layanan_items)) {
    booking.layanan_items.forEach((l) => {
      layananMap.set(String(l?.id_layanan ?? l?.id), {
        id: l?.id_layanan ?? l?.id,
        name: l?.nama_layanan || l?.nama || "-",
        order: Number(l?.urutan) || 999,
      });
    });
  }

  const groupedBhp = bhpItems.reduce((groups, item, index) => {
    const sid = item?.id_layanan ?? "unknown";
    const info = layananMap.get(String(sid));
    const key = String(sid);
    if (!groups[key]) {
      groups[key] = {
        id: sid,
        name: item?.nama_layanan || info?.name || "Layanan Tambahan",
        order: info?.order ?? 999,
        items: [],
      };
    }
    groups[key].items.push({ ...item, _index: index });
    return groups;
  }, {});

  const groupedBhpList = Object.values(groupedBhp).sort(
    (a, b) => a.order - b.order
  );

  /* CHAT */
  useEffect(() => {
    if (!bookingId || !isChatOpen) return;
    let cancelled = false;
    const load = async () => {
      try {
        const r = await getBookingChatMessages(bookingId);
        if (cancelled) return;
        const root = r?.data ?? r ?? {};
        const list =
          root?.messages ?? root?.data?.messages ?? r?.messages ?? [];
        setMessages(Array.isArray(list) ? list : []);
      } catch {}
    };
    load();
    const interval = window.setInterval(load, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [bookingId, isChatOpen]);

  const isInit = useRef(true);
  useEffect(() => {
    if (isChatOpen) isInit.current = true;
  }, [isChatOpen]);
  useEffect(() => {
    if (isChatOpen && messages.length > 0 && isInit.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      isInit.current = false;
    }
  }, [messages, isChatOpen]);

  const handleSendChat = async (e) => {
    e.preventDefault();
    const content = chatInput.trim();
    if (!content || !bookingId || sendingChat) return;
    setSendingChat(true);
    setChatInput("");
    try {
      await sendBookingChatMessage(bookingId, content);
      const r = await getBookingChatMessages(bookingId);
      const root = r?.data ?? r ?? {};
      const list =
        root?.messages ?? root?.data?.messages ?? r?.messages ?? [];
      setMessages(Array.isArray(list) ? list : []);
      setTimeout(
        () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }),
        100
      );
    } catch (error) {
      setChatInput(content);
      setToast({
        type: "error",
        text: error?.response?.data?.message || "Gagal kirim.",
      });
    } finally {
      setSendingChat(false);
    }
  };

  /* FINISH VISIT */
  const handleFinishVisit = async () => {
    if (!bookingId || finishing) return;
    setFinishing(true);
    try {
      const paymentRes = await getNakesOrderDetail(bookingId);
      const latest = extractBiayaTambahanFromResponse(paymentRes);

      const calculated = bhpItems.reduce((acc, item) => {
        const d = Number(item?.qty_default) || 0;
        const r = Number(item?.qty_real) || d;
        return acc + Math.max(0, r - d) * Number(item?.harga_satuan || 0);
      }, 0);

      const total = Math.max(
        Number(bhpMeta.total_tambahan || 0),
        calculated,
        latest.nominal || 0
      );
      const latestStatus = latest.status || normalizeStatus(biayaTambahanStatus);

      if (total > 0 && latestStatus !== "Lunas") {
        throw new Error(
          latestStatus
            ? `Biaya Tambahan masih ${latestStatus}. Kunjungan belum dapat diselesaikan.`
            : "Status Biaya Tambahan belum Lunas."
        );
      }

      const r = await api.post(
        `/api/nakes/booking/${encodeURIComponent(bookingId)}/selesai`
      );
      if (r?.data?.success === false)
        throw new Error(r?.data?.message || "Gagal menyelesaikan.");

      try {
        await deleteBookingChatRoom(bookingId);
      } catch {}
      setIsChatOpen(false);
      setToast({
        type: "success",
        text: r?.data?.message || "Kunjungan selesai.",
      });

      finishTimeoutRef.current = window.setTimeout(async () => {
        await controls.start({
          y: typeof sheetHeight === "number" ? sheetHeight : window.innerHeight,
          transition: { type: "spring", damping: 30, stiffness: 280 },
        });
        onClose();
        if (onRefresh) await onRefresh();
      }, 700);
    } catch (error) {
      setToast({
        type: "error",
        text: error?.response?.data?.message || error?.message || "Gagal.",
      });
    } finally {
      setFinishing(false);
    }
  };

  const snapToPeek = async () => {
    setSheetMode("peek");
    await controls.start({
      y: peekOffset,
      transition: { type: "spring", damping: 30, stiffness: 280 },
    });
  };

  const snapToFull = async () => {
    setSheetMode("full");
    await controls.start({
      y: 0,
      transition: { type: "spring", damping: 30, stiffness: 280 },
    });
  };

  const toggleFullscreen = async () => {
    if (isFullscreen) {
      setIsFullscreen(false);
      setSheetMode("full");
    } else {
      setIsFullscreen(true);
      setSheetMode("full");
    }
  };

  const handleDragEnd = async (_event, info) => {
    if (isFullscreen) return;

    const offsetY = info.offset.y;
    const velocityY = info.velocity.y;

    if (sheetMode === "peek") {
      if (offsetY < -45 || velocityY < -300) await snapToFull();
      else await snapToPeek();
      return;
    }
    if (offsetY > 45 || velocityY > 300) await snapToPeek();
    else await snapToFull();
  };

  const handleDragStart = (event) => {
    if (isFullscreen) return;
    dragControls.start(event);
  };

  const calculatedClientTotal = bhpItems.reduce((acc, item) => {
    const d = Number(item?.qty_default) || 0;
    const r = Number(item?.qty_real) || d;
    return acc + Math.max(0, r - d) * Number(item?.harga_satuan || 0);
  }, 0);

  const effectiveTotalTambahan =
    calculatedClientTotal === 0
      ? 0
      : Math.max(Number(bhpMeta.total_tambahan || 0), calculatedClientTotal);

  const paymentStatus = normalizeStatus(
    biayaTambahanStatus || bhpMeta.status_pembayaran_bhp
  );
  const hasAdditionalCost = effectiveTotalTambahan > 0;
  const isBiayaTambahanLunas = !hasAdditionalCost || paymentStatus === "Lunas";

  if (!isOpen || !booking) return null;

  return (
    <>
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[400] max-w-sm px-4 py-3 rounded-2xl shadow-xl text-white flex items-center gap-3 ${
            toast.type === "error" ? "bg-rose-600" : "bg-emerald-600"
          }`}
        >
          <p className="text-xs font-medium">{toast.text}</p>
          <button type="button" onClick={() => setToast(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 ${
          isFullscreen ? "z-[150]" : "z-[30] bottom-[70px]"
        } bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          sheetMode === "full" || isFullscreen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={snapToPeek}
      />

      {/* Bottom Sheet / Pop-up Fullscreen Container */}
      <motion.div
        initial={{ y: peekOffset }}
        animate={controls}
        drag={isFullscreen ? false : "y"}
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: peekOffset }}
        dragElastic={0.04}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        style={{ height: sheetHeight, touchAction: isFullscreen ? "auto" : "none" }}
        className={`fixed bg-white border border-slate-200 shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ${
          isFullscreen
            ? "fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[160] w-[92vw] max-w-4xl h-[85vh] rounded-3xl"
            : isDesktop
            ? "z-[40] bottom-6 right-6 w-[420px] rounded-3xl"
            : "z-[40] bottom-[70px] left-0 right-0 w-full rounded-t-3xl border-b-0"
        }`}
      >
        {/* Header Sheet */}
        <div
          className="shrink-0 bg-white border-b border-slate-100 px-4 py-3 select-none flex items-center justify-between gap-3"
          style={{ touchAction: isFullscreen ? "auto" : "none" }}
          onPointerDown={handleDragStart}
          onClick={() => {
            if (sheetMode === "peek" && !isFullscreen) snapToFull();
          }}
        >
          {!isFullscreen && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 cursor-grab active:cursor-grabbing">
              <div
                className={`w-10 h-1 rounded-full transition-colors ${
                  sheetMode === "peek" ? "bg-blue-500" : "bg-slate-300"
                }`}
              />
            </div>
          )}

          <div className="flex items-center gap-3 min-w-0 pt-1">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 font-bold shrink-0 flex items-center justify-center border border-blue-100 shadow-sm text-xs">
              {booking?.pasien?.foto || booking?.pasien?.foto_profil ? (
                <img
                  src={booking?.pasien?.foto || booking?.pasien?.foto_profil}
                  alt={safeGetPatientName(booking)}
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                safeGetPatientName(booking).charAt(0).toUpperCase()
              )}
            </div>

            <div className="min-w-0">
              <h3 className="text-xs font-bold text-slate-900 truncate">
                {safeGetPatientName(booking)}
              </h3>
              <p className="text-[10px] font-semibold text-blue-600 truncate">
                {safeGetBookingCode(booking)} &bull; {serviceName}
              </p>
            </div>
          </div>

          <div
            className="flex items-center gap-1.5 shrink-0"
            onPointerDown={(event) => event.stopPropagation()}
          >
            {/* Fullscreen Toggle Button */}
            <button
              type="button"
              title={isFullscreen ? "Keluar Fullscreen" : "Mode Fullscreen"}
              onClick={(event) => {
                event.stopPropagation();
                toggleFullscreen();
              }}
              className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 transition-colors"
            >
              {isFullscreen ? (
                <Minimize2 className="w-4 h-4 text-blue-600" />
              ) : (
                <Maximize2 className="w-4 h-4" />
              )}
            </button>

            {/* Close Button */}
            {sheetMode === "full" || isFullscreen ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  if (isFullscreen) {
                    setIsFullscreen(false);
                  }
                  snapToPeek();
                }}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                Tarik ke atas
              </span>
            )}
          </div>
        </div>

        {/* Content View */}
        {(sheetMode === "full" || isFullscreen) && (
          <div
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-3 bg-slate-50/50"
            style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}
          >
            {bookingDetailLoading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : (
              <>
                <div className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Informasi Pasien
                    </p>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 text-[10px] font-semibold shrink-0">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      Tracking Aktif
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">Nama Pasien</p>
                    <p className="text-xs font-bold text-slate-900">
                      {safeGetPatientName(booking)}
                    </p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">Alamat Kunjungan</p>
                    <div className="flex items-start gap-1.5 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-slate-700 leading-relaxed break-words font-medium">
                        {booking?.alamat_kunjungan ||
                          booking?.pasien?.alamat_utama ||
                          "-"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsChatOpen(true)}
                    className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] transition-all text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Chat Pasien (In-App)
                  </button>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Detail Layanan
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[10px] text-slate-400">Layanan</p>
                      <p className="text-xs font-bold text-slate-900 break-words mt-0.5">
                        {serviceName}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Jadwal</p>
                      <p className="text-xs font-bold text-slate-900 mt-0.5">
                        {safeGetVisitDate(booking)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-blue-600" /> Biaya Tambahan
                      </p>
                      {hasAdditionalCost ? (
                        <p className="text-[11px] font-semibold text-slate-700 mt-0.5">
                          Total:{" "}
                          <span className="font-bold text-amber-600">
                            Rp {Number(effectiveTotalTambahan).toLocaleString("id-ID")}
                          </span>
                        </p>
                      ) : (
                        <p className="text-[10px] text-emerald-600 font-medium mt-0.5">
                          Tidak ada biaya tambahan
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {hasAdditionalCost && (
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            paymentStatus === "Lunas"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : paymentStatus === "Belum Bayar"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-slate-50 text-slate-500 border-slate-200"
                          }`}
                        >
                          {paymentStatus || "Belum Bayar"}
                        </span>
                      )}
                      {bhpItems.length > 0 && (
                        <button
                          type="button"
                          disabled={savingBhp}
                          onClick={handleSaveBhp}
                          className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold disabled:opacity-50 transition-colors cursor-pointer"
                        >
                          {savingBhp ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            "Simpan"
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {hasAdditionalCost && paymentStatus === "Belum Bayar" && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2 text-amber-800 text-[11px]">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Biaya Tambahan Belum Dibayar</p>
                        <p className="text-amber-700 leading-snug">
                          Menunggu pasien melunasi biaya tambahan.
                        </p>
                      </div>
                    </div>
                  )}

                  {loadingBhp ? (
                    <div className="py-4 flex justify-center">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    </div>
                  ) : groupedBhpList.length > 0 ? (
                    <div className="space-y-4">
                      {groupedBhpList.map((group) => (
                        <div key={String(group.id)} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider text-left">
                              {group.name}
                            </p>
                            <div className="h-px bg-slate-100 flex-1" />
                          </div>
                          <div className="space-y-2">
                            {group.items.map((item) => {
                              const d = Number(item.qty_default) || 0;
                              const r = Number(item.qty_real) || d;
                              const t = Math.max(0, r - d);
                              const h = Number(item.harga_satuan) || 0;
                              return (
                                <div
                                  key={`${item.id_layanan}_${item.id_bhp}_${item._index}`}
                                  className="flex items-center justify-between gap-3 p-2 rounded-xl bg-slate-50 border border-slate-200/60"
                                >
                                  <div className="min-w-0">
                                    <p className="font-bold text-slate-800 text-xs break-words">
                                      {item.nama_bhp}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
                                      <span>Default: {d}</span>
                                      <span>&bull;</span>
                                      <span>
                                        Harga: Rp {h.toLocaleString("id-ID")}
                                      </span>
                                      {t > 0 && (
                                        <span className="font-bold text-amber-600 bg-amber-100 px-1.5 py-0.2 rounded-md">
                                          +{t} (Rp {(t * h).toLocaleString("id-ID")})
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                      type="button"
                                      disabled={r <= d}
                                      onClick={() =>
                                        handleQtyChange(item._index, -1)
                                      }
                                      className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-600 active:bg-slate-100 disabled:opacity-30 transition-colors cursor-pointer"
                                    >
                                      <Minus className="w-3 h-3" />
                                    </button>
                                    <span className="w-5 text-center font-bold text-slate-900 text-xs">
                                      {r}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleQtyChange(item._index, 1)
                                      }
                                      className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-600 active:bg-slate-100 transition-colors cursor-pointer"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="py-2 text-center text-[11px] text-slate-400">
                      Tidak ada BHP untuk booking ini.
                    </p>
                  )}
                </div>

                {statusStr !== "selesai" && statusStr !== "completed" && (
                  <div className="pt-1 pb-1">
                    {!isBiayaTambahanLunas ? (
                      <div className="space-y-1.5">
                        <button
                          type="button"
                          disabled
                          className="w-full py-2.5 rounded-xl bg-slate-200 text-slate-500 font-bold text-xs flex items-center justify-center gap-2 cursor-not-allowed border border-slate-300 shadow-none"
                        >
                          <Lock className="w-4 h-4 text-slate-400" /> Selesaikan
                          Kunjungan
                        </button>
                        <p className="text-[10px] text-center text-slate-400 font-medium">
                          {checkingBiayaTambahan
                            ? "Sedang memeriksa status..."
                            : paymentStatus
                            ? "Menunggu Biaya Tambahan Lunas."
                            : "Status belum tersedia."}
                        </p>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={finishing}
                        onClick={handleFinishVisit}
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99] cursor-pointer"
                      >
                        {finishing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <CheckCircle className="w-4 h-4" />
                        )}
                        Selesaikan Kunjungan
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </motion.div>

      {isChatOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[500px]">
            <div className="p-4 bg-blue-600 text-white flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold shrink-0 text-xs">
                  {safeGetPatientName(booking).charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-xs truncate">
                    {safeGetPatientName(booking)}
                  </h4>
                  <p className="text-[9px] text-blue-100 font-medium">
                    Chat Kunjungan Direct
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsChatOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/20 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-slate-50">
              {messages.length > 0 ? (
                messages.map((message, index) => {
                  const sType = String(
                    message?.sender_type ?? message?.sender ?? message?.role ?? ""
                  ).toLowerCase();
                  const isNakes = sType === "nakes";
                  const key = message?.id_chat ?? message?.id ?? `${index}`;
                  const senderName = isNakes
                    ? "Anda (Nakes)"
                    : message?.sender_name || safeGetPatientName(booking) || "Pasien";
                  let fTime = "";
                  const raw =
                    message?.timestamp ||
                    message?.created_at ||
                    message?.time ||
                    message?.updated_at;
                  if (raw) {
                    try {
                      const dt = new Date(raw);
                      fTime = !Number.isNaN(dt.getTime())
                        ? dt.toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : String(raw);
                    } catch {
                      fTime = String(raw);
                    }
                  }
                  return (
                    <div
                      key={key}
                      className={`flex flex-col ${
                        isNakes ? "items-end" : "items-start"
                      }`}
                    >
                      <div className="px-1 mb-1 text-[10px] text-slate-400 font-medium">
                        <span>{senderName}</span>
                      </div>
                      <div
                        className={`max-w-[80%] px-3 py-2 rounded-2xl shadow-sm relative group ${
                          isNakes
                            ? "bg-blue-600 text-white rounded-tr-none"
                            : "bg-white text-slate-800 border border-slate-200/80 rounded-tl-none"
                        }`}
                      >
                        <p className="text-xs leading-relaxed break-words pr-10 pb-0.5">
                          {message?.content ?? message?.message ?? ""}
                        </p>
                        {fTime && (
                          <span
                            className={`absolute bottom-1.5 right-2 text-[9px] font-medium leading-none ${
                              isNakes ? "text-blue-100/90" : "text-slate-400"
                            }`}
                          >
                            {fTime.replace(":", ".")}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex items-center justify-center text-center text-xs text-slate-400">
                  Belum ada pesan.
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            <form
              onSubmit={handleSendChat}
              className="p-3 bg-white border-t border-slate-100 flex gap-2 items-center"
            >
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ketik pesan..."
                className="flex-1 min-w-0 rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500 transition-all"
              />
              <button
                type="submit"
                disabled={sendingChat || !chatInput.trim()}
                className="p-2 rounded-xl bg-blue-600 text-white disabled:opacity-40 shrink-0"
              >
                {sendingChat ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
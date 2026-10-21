"use client";

import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { motion, useAnimationControls, useDragControls } from "framer-motion";
import useSWR from "swr";
import {
  X, Loader2, MessageSquare, CheckCircle, Plus, Minus,
  Package, MapPin, Send, Lock, AlertCircle, Maximize2, Minimize2,
} from "lucide-react";
import {
  getBhpBooking, addBhpBooking, getNakesOrderDetail,
  updateNakesLocation, sendBookingChatMessage,
  getBookingChatMessages, deleteBookingChatRoom,
} from "@/services/nakesService";
import api from "@/services/api";

/* ============================================================
 * 1. KONSTANTA & HELPER MURNI (di luar komponen)
 * ==========================================================*/
const STATUS = {
  LUNAS: "Lunas",
  BELUM_BAYAR: "Belum Bayar",
};

const LAYOUT = {
  MOBILE_NAV: 70,
  MOBILE_PEEK: 76,
  DESKTOP_PEEK: 80,
  DESKTOP_SHEET: 440,
  MIN_MOBILE: 380,
};

const rupiah = (n) => `Rp ${Number(n || 0).toLocaleString("id-ID")}`;

const toNum = (v, fallback = 0) => Number(v) || fallback;

const makeKey = (idLayanan, idBhp) => `${idLayanan ?? "x"}_${idBhp ?? "x"}`;

const normalizeStatus = (value) => {
  if (!value) return null;
  const s = String(value).trim().toLowerCase();
  if (/(lunas|paid|settlement|success|completed)/.test(s)) return STATUS.LUNAS;
  if (/(belum|unpaid|pending|waiting)/.test(s)) return STATUS.BELUM_BAYAR;
  return String(value);
};

const getBookingId = (b) => b?.id_booking ?? b?.booking_id ?? b?.id ?? null;
const getBookingCode = (b) => b?.booking_code ?? b?.kode_booking ?? b?.code ?? null;

const getPatientName = (b, fn) =>
  fn?.(b) || b?.pasien?.nama_lengkap || b?.pasien?.nama ||
  b?.nama_pasien || b?.user?.name || "Pasien";

const getServiceName = (b) => {
  const items = b?.layanan_items;
  if (Array.isArray(items) && items.length) {
    const names = items
      .map((i) => i?.nama_layanan || i?.layanan?.nama_layanan || i?.nama)
      .filter(Boolean);
    if (names.length) return names.join(", ");
  }
  return b?.layanan?.nama_layanan || b?.nama_layanan || b?.service_name || "-";
};

const getVisitDate = (b, fn) =>
  fn?.(b) || b?.tanggal_kunjungan || b?.tanggal_booking || "-";

/* Buat snapshot untuk deteksi perubahan BHP */
const createBhpSnapshot = (items) =>
  (Array.isArray(items) ? items : [])
    .map((i) => ({
      id_booking_bhp: i?.id_booking_bhp ?? null,
      id_layanan: i?.id_layanan ?? null,
      id_bhp: i?.id_bhp ?? null,
      qty_real: toNum(i?.qty_real),
    }))
    .sort((a, b) =>
      `${a.id_layanan}_${a.id_bhp}_${a.id_booking_bhp}`.localeCompare(
        `${b.id_layanan}_${b.id_bhp}_${b.id_booking_bhp}`
      )
    );

const isSameSnapshot = (items, snapshot) =>
  JSON.stringify(createBhpSnapshot(items)) === JSON.stringify(snapshot || []);

/* Hitung total tambahan dari item BHP */
const calcTotalTambahan = (items) =>
  (Array.isArray(items) ? items : []).reduce((acc, item) => {
    const d = toNum(item?.qty_default);
    const r = toNum(item?.qty_real, d);
    return acc + Math.max(0, r - d) * toNum(item?.harga_satuan);
  }, 0);

/* Ekstrak data BHP dari response API */
function parseBhpResponse(response, skeletonList, skeletonMap) {
  const root = response?.data?.data ?? response?.data ?? response ?? {};
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

    const qtyTambahan = entry?.qty_tambahan ?? entry?.jumlah_tambahan ?? null;
    const qtyReal = entry?.qty_real ?? entry?.jumlah_real ?? entry?.qty ??
      entry?.jumlah ?? null;

    let targetKey = null;
    if (idLayanan != null) {
      const key = makeKey(idLayanan, idBhp);
      if (skeletonMap.has(key) && !usedKeys.has(key)) targetKey = key;
    }
    if (!targetKey) {
      for (const [key, value] of skeletonMap) {
        if (value.id_bhp === idBhp && !usedKeys.has(key)) {
          targetKey = key;
          break;
        }
      }
    }

    if (targetKey) {
      usedKeys.add(targetKey);
      const item = skeletonMap.get(targetKey);
      item.qty_real = qtyReal != null
        ? Math.max(item.qty_default, toNum(qtyReal))
        : item.qty_default + Math.max(0, toNum(qtyTambahan));
      item.qty_tambahan = Math.max(0, item.qty_real - item.qty_default);
      if (entry?.id_booking_bhp) item.id_booking_bhp = entry.id_booking_bhp;
      if (entry?.nama_bhp && (!item.nama_bhp || item.nama_bhp === "-"))
        item.nama_bhp = entry.nama_bhp;
    } else {
      const newItem = {
        id_booking_bhp: entry?.id_booking_bhp ?? null,
        id_layanan: idLayanan,
        nama_layanan: entry?.nama_layanan ?? null,
        id_bhp: idBhp,
        nama_bhp: entry?.nama_bhp ?? entry?.bhp_item?.nama_bhp ?? entry?.nama_item ?? "-",
        harga_satuan: toNum(entry?.harga_satuan ?? entry?.harga_jual ?? entry?.harga),
        qty_default: Math.max(0, toNum(entry?.qty_default)),
        qty_real: 0,
        qty_tambahan: 0,
      };
      newItem.qty_real = Math.max(
        newItem.qty_default,
        toNum(qtyReal, newItem.qty_default + Math.max(0, toNum(qtyTambahan)))
      );
      newItem.qty_tambahan = Math.max(0, newItem.qty_real - newItem.qty_default);
      skeletonList.push(newItem);
      skeletonMap.set(`${makeKey(idLayanan, idBhp)}_${skeletonList.length}`, newItem);
    }
  });

  const calculated = calcTotalTambahan(skeletonList);
  const rawTotal = root?.total_tambahan ?? root?.sb_tambahan ?? response?.meta?.total_tambahan;
  const totalTambahan = rawTotal != null && Number(rawTotal) > 0
    ? Math.max(calculated, Number(rawTotal))
    : calculated;

  const statusPembayaran = normalizeStatus(
    root?.status_transaksi ?? root?.status_pembayaran_bhp ??
    response?.meta?.status_pembayaran_bhp ?? null
  );

  return { items: skeletonList, total_tambahan: totalTambahan, status_pembayaran_bhp: statusPembayaran };
}

/* Ekstrak status biaya tambahan dari detail order */
function extractBiayaTambahan(response) {
  let root = response?.data ?? response ?? {};
  for (let i = 0; i < 4; i++) {
    if (root?.data && typeof root.data === "object" && !Array.isArray(root)) root = root.data;
    else break;
  }
  const bookingData = root?.booking ?? root;
  const tambahan = root?.biaya_tambahan_pasien ?? bookingData?.biaya_tambahan_pasien ??
    root?.biaya_tambahan ?? bookingData?.biaya_tambahan ?? null;

  const nominal = toNum(
    tambahan?.nominal ?? tambahan?.amount ?? tambahan?.jumlah ??
    root?.nominal ?? bookingData?.total_biaya_tambahan ??
    bookingData?.total_tambahan ?? root?.total_biaya_tambahan ??
    root?.total_tambahan
  );

  const rawStatus = tambahan?.status_transaksi ?? tambahan?.status_pembayaran ??
    tambahan?.status ?? root?.status_transaksi ?? root?.status_pembayaran ??
    bookingData?.status_pembayaran_biaya_tambahan ??
    bookingData?.status_pembayaran_bhp ?? bookingData?.status_biaya_tambahan ?? null;

  return {
    nominal,
    status: normalizeStatus(rawStatus),
    order_id: tambahan?.order_id ?? null,
    kode_booking_tambahan: tambahan?.kode_booking ?? null,
    waktu_bayar: tambahan?.waktu_bayar ?? null,
  };
}

/* Bangun skeleton BHP dari booking */
function buildSkeleton(booking) {
  const list = [];
  const map = new Map();
  if (!Array.isArray(booking?.layanan_items)) return { list, map };

  booking.layanan_items.forEach((layanan) => {
    const idLayanan = layanan?.id_layanan ?? layanan?.id ?? null;
    const namaLayanan = layanan?.nama_layanan || layanan?.nama || null;
    const bhpList = layanan?.bhp_items || layanan?.items || layanan?.bhp || [];
    if (!Array.isArray(bhpList)) return;

    bhpList.forEach((b) => {
      const idBhp = b?.id_bhp ?? b?.bhp_item?.id_bhp ?? b?.id ?? null;
      if (idLayanan == null || idBhp == null) return;
      const key = makeKey(idLayanan, idBhp);
      if (map.has(key)) return;

      const defaultQty = toNum(
        b?.qty_default ?? b?.default_qty ?? b?.jumlah_default ?? b?.qty ?? b?.jumlah
      );

      const item = {
        id_booking_bhp: b?.id_booking_bhp ?? null,
        id_layanan: idLayanan,
        nama_layanan: namaLayanan,
        id_bhp: idBhp,
        nama_bhp: b?.nama_bhp ?? b?.bhp_item?.nama_bhp ?? b?.nama_item ?? b?.nama ?? "-",
        harga_satuan: toNum(b?.harga_satuan ?? b?.harga_jual ?? b?.harga ?? b?.bhp_item?.harga_jual),
        qty_default: defaultQty,
        qty_real: defaultQty,
        qty_tambahan: 0,
      };
      map.set(key, item);
      list.push(item);
    });
  });
  return { list, map };
}

/* Ambil pesan chat dari response apa pun bentuknya */
const extractMessages = (response) => {
  const root = response?.data ?? response ?? {};
  const list = root?.messages ?? root?.data?.messages ?? response?.messages ?? [];
  return Array.isArray(list) ? list : [];
};

/* ============================================================
 * 2. CUSTOM HOOKS
 * ==========================================================*/

/* Hook: viewport */
function useViewport() {
  const [vp, setVp] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const update = () => setVp({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);
  return vp;
}

/* Hook: toast auto-close */
function useToast() {
  const [toast, setToast] = useState(null);
  const show = useCallback((type, text) => setToast({ type, text }), []);
  const clear = useCallback(() => setToast(null), []);
  return { toast, show, clear };
}

/* ============================================================
 * 3. KOMPONEN KECIL
 * ==========================================================*/
function Toast({ toast, onClose }) {
  if (!toast) return null;
  const isError = toast.type === "error";
  return (
    <div className={`fixed top-4 right-4 z-[400] max-w-sm px-4 py-3 rounded-2xl shadow-xl text-white flex items-center gap-3 ${isError ? "bg-rose-600" : "bg-emerald-600"}`}>
      <p className="text-xs font-medium">{toast.text}</p>
      <button type="button" onClick={onClose}><X className="w-4 h-4" /></button>
    </div>
  );
}

function SheetHeader({
  booking, patientName, bookingCode, serviceName,
  isFullscreen, sheetMode, onToggleFullscreen, onClose, onDragStart,
}) {
  return (
    <div
      className="shrink-0 bg-white border-b border-slate-100 px-4 py-3 select-none flex items-center justify-between gap-3"
      style={{ touchAction: isFullscreen ? "auto" : "none" }}
      onPointerDown={onDragStart}
    >
      {!isFullscreen && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2">
          <div className={`w-10 h-1 rounded-full ${sheetMode === "peek" ? "bg-blue-500" : "bg-slate-300"}`} />
        </div>
      )}

      <div className="flex items-center gap-3 min-w-0 pt-1">
        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 font-bold shrink-0 flex items-center justify-center border border-blue-100 shadow-sm text-xs overflow-hidden">
          {booking?.pasien?.foto || booking?.pasien?.foto_profil ? (
            <img src={booking.pasien.foto || booking.pasien.foto_profil} alt={patientName} className="w-full h-full object-cover" />
          ) : (
            patientName.charAt(0).toUpperCase()
          )}
        </div>
        <div className="min-w-0">
          <h3 className="text-xs font-bold text-slate-900 truncate">{patientName}</h3>
          <p className="text-[10px] font-semibold text-blue-600 truncate">{bookingCode} • {serviceName}</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0" onPointerDown={(e) => e.stopPropagation()}>
        <button type="button" onClick={(e) => { e.stopPropagation(); onToggleFullscreen(); }} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500">
          {isFullscreen ? <Minimize2 className="w-4 h-4 text-blue-600" /> : <Maximize2 className="w-4 h-4" />}
        </button>
        {sheetMode === "full" || isFullscreen ? (
          <button type="button" onClick={(e) => { e.stopPropagation(); onClose(); }} className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400">
            <X className="w-4 h-4" />
          </button>
        ) : (
          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
            Tarik ke atas
          </span>
        )}
      </div>
    </div>
  );
}

function BhpItemRow({ item, disabled, onQtyChange }) {
  const d = toNum(item.qty_default);
  const r = toNum(item.qty_real, d);
  const t = Math.max(0, r - d);
  const h = toNum(item.harga_satuan);

  return (
    <div className="flex items-center justify-between gap-3 p-2 rounded-xl bg-slate-50 border border-slate-200/60">
      <div className="min-w-0">
        <p className="font-bold text-slate-800 text-xs break-words">{item.nama_bhp}</p>
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
          <span>Default: {d}</span>
          <span>•</span>
          <span>Harga: {rupiah(h)}</span>
          {t > 0 && (
            <span className="font-bold text-amber-600 bg-amber-100 px-1.5 rounded-md">
              +{t} ({rupiah(t * h)})
            </span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button type="button" disabled={disabled || r <= d} onClick={() => onQtyChange(item._index, -1)}
          className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 disabled:opacity-30">
          <Minus className="w-3 h-3" />
        </button>
        <span className="w-5 text-center font-bold text-slate-900 text-xs">{r}</span>
        <button type="button" disabled={disabled} onClick={() => onQtyChange(item._index, 1)}
          className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600 disabled:opacity-30">
          <Plus className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}

function ChatModal({ open, booking, patientName, messages, chatInput, sendingChat, messagesEndRef, onClose, onInputChange, onSend }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[600px]">
        <div className="p-4 bg-blue-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold shrink-0 text-sm">
              {patientName.charAt(0).toUpperCase()}
            </div>
            <h4 className="font-bold truncate">{patientName}</h4>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-white/20">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-slate-50">
          {messages.length > 0 ? messages.map((m, i) => {
            const sType = String(m?.sender_type ?? m?.sender ?? m?.role ?? "").toLowerCase();
            const isNakes = sType === "nakes";
            const key = m?.id_chat ?? m?.id ?? i;
            const senderName = isNakes ? "Anda (Nakes)" : m?.sender_name || patientName;
            const raw = m?.timestamp || m?.created_at || m?.time || m?.updated_at;
            let fTime = "";
            if (raw) {
              const dt = new Date(raw);
              fTime = !Number.isNaN(dt.getTime())
                ? dt.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })
                : String(raw);
            }
            return (
              <div key={key} className={`flex flex-col ${isNakes ? "items-end" : "items-start"}`}>
                <div className="px-1 mb-1 text-xs text-slate-500 font-semibold">{senderName}</div>
                <div className={`max-w-[75%] px-4 py-2.5 rounded-2xl shadow-sm ${isNakes ? "bg-blue-600 text-white rounded-tr-none" : "bg-white text-slate-800 border border-slate-200/80 rounded-tl-none"}`}>
                  <p className="text-sm leading-relaxed break-words font-medium">{m?.content ?? m?.message ?? ""}</p>
                  {fTime && (
                    <div className={`text-[11px] font-bold mt-1 text-right ${isNakes ? "text-blue-100" : "text-slate-500"}`}>
                      {fTime.replace(":", ".")} WIB
                    </div>
                  )}
                </div>
              </div>
            );
          }) : (
            <div className="h-full flex items-center justify-center text-sm text-slate-400 font-medium">
              Belum ada pesan.
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={onSend} className="p-4 bg-white border-t border-slate-100 flex gap-2.5 items-center">
          <input type="text" value={chatInput} onChange={(e) => onInputChange(e.target.value)}
            placeholder="Ketik pesan..."
            className="flex-1 min-w-0 rounded-2xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-blue-500" />
          <button type="submit" disabled={sendingChat || !chatInput.trim()}
            className="p-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 shrink-0">
            {sendingChat ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  );
}

/* ============================================================
 * 4. KOMPONEN UTAMA
 * ==========================================================*/
export default function BookingDetailSheet({
  booking,
  isOpen,
  onClose,
  bookingDetailLoading,
  getBookingCode: getCodeProp,
  getBookingPatientName,
  getBookingVisitDate: getVisitProp,
  onRefresh,
}) {
  const controls = useAnimationControls();
  const dragControls = useDragControls();
  const messagesEndRef = useRef(null);
  const finishTimeoutRef = useRef(null);
  const checkingRef = useRef(false);

  const viewport = useViewport();
  const { toast, show: showToast, clear: clearToast } = useToast();

  const [bhpItems, setBhpItems] = useState([]);
  const [savedSnapshot, setSavedSnapshot] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [bhpMeta, setBhpMeta] = useState({ total_tambahan: 0, status_pembayaran_bhp: null });
  const [savingBhp, setSavingBhp] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [biayaStatus, setBiayaStatus] = useState(null);
  const [checkingBiaya, setCheckingBiaya] = useState(false);
  const [loadedCode, setLoadedCode] = useState(null);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingChat, setSendingChat] = useState(false);

  const [sheetMode, setSheetMode] = useState("peek");
  const [isFullscreen, setIsFullscreen] = useState(false);

  /* Derived values */
  const bookingId = getBookingId(booking);
  const bookingCode = getBookingCode(booking) || getCodeProp?.(booking);
  const targetCode = bookingCode || bookingId;
  const statusStr = String(booking?.status_booking ?? booking?.status ?? "").toLowerCase();
  const isDesktop = (viewport.width ?? 0) >= 768;
  const patientName = getPatientName(booking, getBookingPatientName);
  const serviceName = useMemo(() => getServiceName(booking), [booking]);
  const visitDate = getVisitDate(booking, getVisitProp);

  const sheetHeight = useMemo(() => {
    if (isFullscreen) return isDesktop ? "85vh" : "100vh";
    if (isDesktop) return LAYOUT.DESKTOP_SHEET;
    return Math.max(LAYOUT.MIN_MOBILE, (viewport.height ?? 800) - LAYOUT.MOBILE_NAV - 12);
  }, [isFullscreen, isDesktop, viewport.height]);

  const peekHeight = isDesktop ? LAYOUT.DESKTOP_PEEK : LAYOUT.MOBILE_PEEK;
  const peekOffset = useMemo(() => {
    if (isFullscreen) return 0;
    if (typeof sheetHeight === "number") return Math.max(0, sheetHeight - peekHeight);
    return Math.max(0, (viewport.height ?? 800) * 0.9 - peekHeight);
  }, [isFullscreen, sheetHeight, peekHeight, viewport.height]);

  const isBhpLocked = normalizeStatus(biayaStatus || bhpMeta.status_pembayaran_bhp) === STATUS.LUNAS;

  const effectiveTotal = useMemo(() => {
    const clientTotal = calcTotalTambahan(bhpItems);
    if (clientTotal === 0) return toNum(bhpMeta.total_tambahan);
    return Math.max(toNum(bhpMeta.total_tambahan), clientTotal);
  }, [bhpItems, bhpMeta.total_tambahan]);

  const paymentStatus = normalizeStatus(biayaStatus || bhpMeta.status_pembayaran_bhp);
  const hasAdditionalCost = effectiveTotal > 0;
  const isBiayaLunas = !hasAdditionalCost || paymentStatus === STATUS.LUNAS;

  /* Grouping BHP per layanan */
  const groupedBhpList = useMemo(() => {
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
    const groups = {};
    bhpItems.forEach((item, index) => {
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
    });
    return Object.values(groups).sort((a, b) => a.order - b.order);
  }, [bhpItems, booking]);

  /* ------------------------------------------------------------
   * Effect: reset saat sheet tutup
   * ----------------------------------------------------------*/
  useEffect(() => {
    if (!isOpen) {
      setLoadedCode(null);
      setBiayaStatus(null);
      setBhpMeta({ total_tambahan: 0, status_pembayaran_bhp: null });
      setSavedSnapshot([]);
      setHasChanges(false);
    }
  }, [isOpen]);

  /* ------------------------------------------------------------
   * Effect: sheet terbuka — snap ke peek
   * ----------------------------------------------------------*/
  useEffect(() => {
    if (!isOpen || !booking) return;
    setSheetMode("peek");
    setIsFullscreen(false);
    const currentHeight = isDesktop
      ? LAYOUT.DESKTOP_SHEET
      : Math.max(LAYOUT.MIN_MOBILE, window.innerHeight - LAYOUT.MOBILE_NAV - 12);
    const currentPeekOffset = Math.max(0, currentHeight - (isDesktop ? LAYOUT.DESKTOP_PEEK : LAYOUT.MOBILE_PEEK));
    controls.start({ y: currentPeekOffset, transition: { type: "spring", damping: 30, stiffness: 280 } });
  }, [isOpen, bookingId, controls, isDesktop]);

  /* ------------------------------------------------------------
   * Effect: animasi snap berdasarkan mode
   * ----------------------------------------------------------*/
  useEffect(() => {
    if (!isOpen) return;
    controls.start({
      y: isFullscreen ? 0 : sheetMode === "full" ? 0 : peekOffset,
      transition: { type: "spring", damping: 30, stiffness: 280 },
    });
  }, [sheetMode, isFullscreen, peekOffset, controls, isOpen]);

  /* ------------------------------------------------------------
   * Effect: update lokasi
   * ----------------------------------------------------------*/
  useEffect(() => {
    if (!bookingId || !isOpen) return;
    let cancelled = false;
    if (typeof window === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        if (cancelled) return;
        try {
          await updateNakesLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            booking_id: bookingId,
          });
        } catch (e) { console.warn("Gagal update lokasi:", e); }
      },
      () => {},
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
    return () => { cancelled = true; };
  }, [bookingId, isOpen]);

  /* ------------------------------------------------------------
   * SWR: load BHP
   * ----------------------------------------------------------*/
  const { data: rawBhpData, isLoading: loadingBhp } = useSWR(
    isOpen && targetCode ? `/api/nakes/booking/${encodeURIComponent(targetCode)}/bhp` : null,
    () => getBhpBooking(targetCode),
    { revalidateOnFocus: false, revalidateOnReconnect: false, refreshInterval: 0, shouldRetryOnError: false, dedupingInterval: 10000 }
  );

  /* ------------------------------------------------------------
   * Effect: parse data BHP saat SWR selesai
   * ----------------------------------------------------------*/
  useEffect(() => {
    if (!isOpen || !targetCode) return;
    if (loadedCode === targetCode) return;

    if (!rawBhpData) {
      const { list } = buildSkeleton(booking);
      setBhpItems(list);
      setSavedSnapshot(createBhpSnapshot(list));
      setHasChanges(false);
      return;
    }

    const { list, map } = buildSkeleton(booking);
    const result = parseBhpResponse(rawBhpData, list, map);
    setBhpItems(result.items);
    setSavedSnapshot(createBhpSnapshot(result.items));
    setHasChanges(false);
    setBhpMeta((prev) => ({
      ...prev,
      total_tambahan: result.total_tambahan,
      ...(result.status_pembayaran_bhp ? { status_pembayaran_bhp: result.status_pembayaran_bhp } : {}),
    }));
    if (result.status_pembayaran_bhp) setBiayaStatus(result.status_pembayaran_bhp);
    setLoadedCode(targetCode);
  }, [isOpen, targetCode, rawBhpData, loadedCode, booking]);

  /* ------------------------------------------------------------
   * Load status biaya tambahan
   * ----------------------------------------------------------*/
  const loadBiayaStatus = useCallback(async () => {
    if (!bookingId || checkingRef.current) return;
    checkingRef.current = true;
    setCheckingBiaya(true);
    try {
      const res = await getNakesOrderDetail(bookingId);
      const parsed = extractBiayaTambahan(res);
      setBhpMeta((prev) => ({
        ...prev,
        total_tambahan: parsed.nominal > 0 ? parsed.nominal : prev.total_tambahan,
        ...(parsed.status ? { status_pembayaran_bhp: parsed.status } : {}),
      }));
      if (parsed.status) setBiayaStatus(parsed.status);
    } catch (e) {
      console.warn("Gagal cek status biaya tambahan:", e);
    } finally {
      checkingRef.current = false;
      setCheckingBiaya(false);
    }
  }, [bookingId]);

  useEffect(() => {
    if (!isOpen || !bookingId) return;
    loadBiayaStatus();
  }, [isOpen, bookingId, loadBiayaStatus]);

  /* ------------------------------------------------------------
   * Sync saat tab kembali terlihat
   * ----------------------------------------------------------*/
  useEffect(() => {
    if (!bookingId || !isOpen) return;
    const onVis = () => {
      if (document.visibilityState === "visible") loadBiayaStatus();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [bookingId, isOpen, loadBiayaStatus]);

  /* ------------------------------------------------------------
   * Cleanup timeout
   * ----------------------------------------------------------*/
  useEffect(() => () => {
    if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);
  }, []);

  /* ------------------------------------------------------------
   * Handler: qty berubah
   * ----------------------------------------------------------*/
  const handleQtyChange = useCallback((targetIndex, delta) => {
    if (isBhpLocked) return;
    setBhpItems((prev) => {
      const next = prev.map((item, index) => {
        if (index !== targetIndex) return item;
        const d = toNum(item?.qty_default);
        const c = toNum(item?.qty_real, d);
        const n = Math.max(d, c + delta);
        return { ...item, qty_real: n, qty_tambahan: Math.max(0, n - d) };
      });
      setHasChanges(!isSameSnapshot(next, savedSnapshot));
      return next;
    });
  }, [isBhpLocked, savedSnapshot]);

  /* ------------------------------------------------------------
   * Handler: simpan BHP
   * ----------------------------------------------------------*/
  const handleSaveBhp = useCallback(async () => {
    if (!targetCode || savingBhp || isBhpLocked || !hasChanges) return;
    setSavingBhp(true);
    try {
      const payloadItems = bhpItems.map((item) => {
        const d = toNum(item.qty_default);
        const r = Math.max(d, toNum(item.qty_real, d));
        const t = Math.max(0, r - d);
        const h = toNum(item.harga_satuan);
        return {
          id_booking_bhp: item.id_booking_bhp || null,
          id_layanan: item.id_layanan || null,
          id_bhp: item.id_bhp || null,
          nama_bhp: item.nama_bhp || null,
          nama_layanan: item.nama_layanan || null,
          qty_default: d, qty_real: r, qty_tambahan: t,
          qty: r, jumlah: r, jumlah_real: r, jumlah_tambahan: t,
          harga_satuan: h, harga_jual: h,
          subtotal_tambahan: t * h,
        };
      });
      const totalTambahan = payloadItems.reduce((a, i) => a + i.subtotal_tambahan, 0);
      const nakesId = toNum(booking?.id_nakes ?? booking?.nakes_id ?? booking?.nakes?.id_nakes ?? booking?.nakes?.id);
      const payload = {
        items: payloadItems,
        total_tambahan: totalTambahan,
        ...(nakesId > 0 ? { updated_by: nakesId } : {}),
      };
      const res = await addBhpBooking(targetCode, payload);
      if (res?.success === false || res?.status === false) {
        throw new Error(res?.message || "Gagal menyimpan.");
      }
      const normalized = payloadItems.map((i) => ({
        ...i,
        qty_default: toNum(i.qty_default),
        qty_real: toNum(i.qty_real),
        qty_tambahan: toNum(i.qty_tambahan),
        harga_satuan: toNum(i.harga_satuan),
      }));
      setBhpItems(normalized);
      setSavedSnapshot(createBhpSnapshot(normalized));
      setHasChanges(false);

      if (totalTambahan === 0) {
        setBiayaStatus(STATUS.LUNAS);
        setBhpMeta({ total_tambahan: 0, status_pembayaran_bhp: STATUS.LUNAS });
      } else {
        const status = normalizeStatus(res?.data?.status_transaksi ?? res?.status_transaksi ?? STATUS.BELUM_BAYAR);
        setBhpMeta({ total_tambahan: totalTambahan, status_pembayaran_bhp: status });
        setBiayaStatus(status);
      }
      showToast("success", res?.message || "Biaya Tambahan berhasil disimpan.");
    } catch (e) {
      console.error("Gagal simpan BHP:", e);
      showToast("error", e?.response?.data?.message || e?.message || "Gagal menyimpan.");
    } finally {
      setSavingBhp(false);
    }
  }, [targetCode, savingBhp, isBhpLocked, hasChanges, bhpItems, booking, showToast]);

  /* ------------------------------------------------------------
   * Chat: load & kirim
   * ----------------------------------------------------------*/
  useEffect(() => {
    if (!bookingId || !isChatOpen) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await getBookingChatMessages(bookingId);
        if (!cancelled) setMessages(extractMessages(res));
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [bookingId, isChatOpen]);

  useEffect(() => {
    if (isChatOpen && messages.length > 0) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isChatOpen]);

  const handleSendChat = useCallback(async (e) => {
    e.preventDefault();
    const content = chatInput.trim();
    if (!content || !bookingId || sendingChat) return;
    setSendingChat(true);
    setChatInput("");
    try {
      await sendBookingChatMessage(bookingId, content);
      const res = await getBookingChatMessages(bookingId);
      setMessages(extractMessages(res));
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e) {
      setChatInput(content);
      showToast("error", e?.response?.data?.message || "Gagal kirim.");
    } finally {
      setSendingChat(false);
    }
  }, [chatInput, bookingId, sendingChat, showToast]);

  /* ------------------------------------------------------------
   * Handler: selesaikan kunjungan
   * ----------------------------------------------------------*/
  const handleFinishVisit = useCallback(async () => {
    if (!bookingId || finishing) return;
    setFinishing(true);
    try {
      const payRes = await getNakesOrderDetail(bookingId);
      const latest = extractBiayaTambahan(payRes);
      const calculated = calcTotalTambahan(bhpItems);
      const total = Math.max(toNum(bhpMeta.total_tambahan), calculated, toNum(latest.nominal));
      const status = latest.status || normalizeStatus(biayaStatus);

      if (total > 0 && status !== STATUS.LUNAS) {
        throw new Error(
          status
            ? `Biaya Tambahan masih ${status}. Kunjungan belum dapat diselesaikan.`
            : "Status Biaya Tambahan belum Lunas."
        );
      }

      const res = await api.post(`/api/nakes/booking/${encodeURIComponent(bookingId)}/selesai`);
      if (res?.data?.success === false) {
        throw new Error(res?.data?.message || "Gagal menyelesaikan.");
      }
      try { await deleteBookingChatRoom(bookingId); } catch {}
      setIsChatOpen(false);
      showToast("success", res?.data?.message || "Kunjungan selesai.");

      finishTimeoutRef.current = window.setTimeout(async () => {
        await controls.start({
          y: typeof sheetHeight === "number" ? sheetHeight : window.innerHeight,
          transition: { type: "spring", damping: 30, stiffness: 280 },
        });
        onClose();
        if (onRefresh) await onRefresh();
      }, 700);
    } catch (e) {
      showToast("error", e?.response?.data?.message || e?.message || "Gagal.");
    } finally {
      setFinishing(false);
    }
  }, [bookingId, finishing, bhpItems, bhpMeta.total_tambahan, biayaStatus, controls, sheetHeight, onClose, onRefresh, showToast]);

  /* ------------------------------------------------------------
   * Handler: drag & snap
   * ----------------------------------------------------------*/
  const snapToPeek = useCallback(async () => {
    setSheetMode("peek");
    await controls.start({ y: peekOffset, transition: { type: "spring", damping: 30, stiffness: 280 } });
  }, [controls, peekOffset]);

  const snapToFull = useCallback(async () => {
    setSheetMode("full");
    await controls.start({ y: 0, transition: { type: "spring", damping: 30, stiffness: 280 } });
  }, [controls]);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((v) => !v);
    setSheetMode("full");
  }, []);

  const handleDragEnd = useCallback(async (_e, info) => {
    if (isFullscreen) return;
    const { offset, velocity } = info;
    if (sheetMode === "peek") {
      if (offset.y < -45 || velocity.y < -300) await snapToFull();
      else await snapToPeek();
      return;
    }
    if (offset.y > 45 || velocity.y > 300) await snapToPeek();
    else await snapToFull();
  }, [isFullscreen, sheetMode, snapToPeek, snapToFull]);

  const handleDragStart = useCallback((e) => {
    if (!isFullscreen) dragControls.start(e);
  }, [isFullscreen, dragControls]);

  if (!isOpen || !booking) return null;

  /* ------------------------------------------------------------
   * RENDER
   * ----------------------------------------------------------*/
  return (
    <>
      <Toast toast={toast} onClose={clearToast} />

      <div
        className={`fixed inset-0 ${isFullscreen ? "z-[150]" : "z-[30] bottom-[70px]"} bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-300 ${
          sheetMode === "full" || isFullscreen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={snapToPeek}
      />

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
            ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[160] w-[92vw] max-w-4xl h-[85vh] rounded-3xl"
            : isDesktop
            ? "z-[40] bottom-6 right-6 w-[420px] rounded-3xl"
            : "z-[40] bottom-[70px] left-0 right-0 w-full rounded-t-3xl border-b-0"
        }`}
      >
        <SheetHeader
          booking={booking}
          patientName={patientName}
          bookingCode={bookingCode || `#${bookingId}`}
          serviceName={serviceName}
          isFullscreen={isFullscreen}
          sheetMode={sheetMode}
          onToggleFullscreen={toggleFullscreen}
          onClose={() => { if (isFullscreen) setIsFullscreen(false); snapToPeek(); }}
          onDragStart={handleDragStart}
        />

        {(sheetMode === "full" || isFullscreen) && (
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 space-y-3 bg-slate-50/50"
            style={{ WebkitOverflowScrolling: "touch", touchAction: "pan-y" }}>
            {bookingDetailLoading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
              </div>
            ) : (
              <>
                {/* --- INFO PASIEN --- */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Informasi Pasien</p>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 text-[10px] font-semibold">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                      </span>
                      Tracking Aktif
                    </span>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">Nama Pasien</p>
                    <p className="text-xs font-bold text-slate-900">{patientName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400">Alamat Kunjungan</p>
                    <div className="flex items-start gap-1.5 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-slate-700 leading-relaxed break-words font-medium">
                        {booking?.alamat_kunjungan || booking?.pasien?.alamat_utama || "-"}
                      </p>
                    </div>
                  </div>
                  <button type="button" onClick={() => setIsChatOpen(true)}
                    className="w-full py-3 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] transition-all text-white font-bold text-sm flex items-center justify-center gap-2.5 shadow-md">
                    <MessageSquare className="w-4 h-4" /> Chat Pasien
                  </button>
                </div>

                {/* --- DETAIL LAYANAN --- */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Detail Layanan</p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className="text-[10px] text-slate-400">Layanan</p>
                      <p className="text-xs font-bold text-slate-900 break-words mt-0.5">{serviceName}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400">Jadwal</p>
                      <p className="text-xs font-bold text-slate-900 mt-0.5">{visitDate}</p>
                    </div>
                  </div>
                </div>

                {/* --- BIAYA TAMBAHAN --- */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-blue-600" /> Biaya Tambahan
                      </p>
                      {hasAdditionalCost ? (
                        <p className="text-[11px] font-semibold text-slate-700 mt-0.5">
                          Total: <span className="font-bold text-amber-600">{rupiah(effectiveTotal)}</span>
                        </p>
                      ) : (
                        <p className="text-[10px] text-emerald-600 font-medium mt-0.5">Tidak ada biaya tambahan</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {hasAdditionalCost && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          paymentStatus === STATUS.LUNAS ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : paymentStatus === STATUS.BELUM_BAYAR ? "bg-amber-50 text-amber-700 border-amber-200"
                          : "bg-slate-50 text-slate-500 border-slate-200"
                        }`}>
                          {paymentStatus || "Status belum tersedia"}
                        </span>
                      )}
                      {!isBhpLocked && hasChanges && (
                        <button type="button" disabled={savingBhp} onClick={handleSaveBhp}
                          className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-50 flex items-center gap-1.5 shadow-md">
                          {savingBhp ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Menyimpan...</span></> : "Simpan"}
                        </button>
                      )}
                      {isBhpLocked && (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-500 border border-slate-200">
                          <Lock className="w-3 h-3" /> Terkunci
                        </span>
                      )}
                    </div>
                  </div>

                  {hasAdditionalCost && paymentStatus === STATUS.BELUM_BAYAR && (
                    <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2 text-amber-800 text-[11px]">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Biaya Tambahan Belum Dibayar</p>
                        <p className="text-amber-700 leading-snug">Menunggu pasien melunasi biaya tambahan.</p>
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
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{group.name}</p>
                            <div className="h-px bg-slate-100 flex-1" />
                          </div>
                          <div className="space-y-2">
                            {group.items.map((item) => (
                              <BhpItemRow key={`${item.id_layanan}_${item.id_bhp}_${item._index}`}
                                item={item} disabled={isBhpLocked} onQtyChange={handleQtyChange} />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="py-2 text-center text-[11px] text-slate-400">Tidak ada BHP untuk booking ini.</p>
                  )}
                </div>

                {/* --- TOMBOL SELESAI --- */}
                {statusStr !== "selesai" && statusStr !== "completed" && (
                  <div className="pt-1 pb-1">
                    {!isBiayaLunas ? (
                      <div className="space-y-1.5">
                        <button type="button" disabled
                          className="w-full py-2.5 rounded-xl bg-slate-200 text-slate-500 font-bold text-xs flex items-center justify-center gap-2 cursor-not-allowed border border-slate-300">
                          <Lock className="w-4 h-4 text-slate-400" /> Selesaikan Kunjungan
                        </button>
                        <p className="text-[10px] text-center text-slate-400 font-medium">
                          {checkingBiaya ? "Sedang memeriksa status..."
                            : paymentStatus ? "Menunggu Biaya Tambahan Lunas."
                            : "Status belum tersedia."}
                        </p>
                      </div>
                    ) : (
                      <button type="button" disabled={finishing} onClick={handleFinishVisit}
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm">
                        {finishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
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

      <ChatModal
        open={isChatOpen}
        booking={booking}
        patientName={patientName}
        messages={messages}
        chatInput={chatInput}
        sendingChat={sendingChat}
        messagesEndRef={messagesEndRef}
        onClose={() => setIsChatOpen(false)}
        onInputChange={setChatInput}
        onSend={handleSendChat}
      />
    </>
  );
}
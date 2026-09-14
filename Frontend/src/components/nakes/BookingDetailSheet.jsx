"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useAnimationControls, useDragControls } from "framer-motion";
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
} from "lucide-react";
import {
  getBhpBooking,
  updateBhpBooking,
  finishBooking,
  updateNakesLocation,
  sendBookingChatMessage,
  getBookingChatMessages,
  deleteBookingChatRoom,
} from "@/services/nakesService";

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
  const [loadingBhp, setLoadingBhp] = useState(false);
  const [savingBhp, setSavingBhp] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [toast, setToast] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [sendingChat, setSendingChat] = useState(false);
  const [sheetMode, setSheetMode] = useState("peek");
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  const bookingId = booking?.id_booking ?? booking?.booking_id ?? booking?.id ?? null;
  const statusStr = String(booking?.status_booking ?? booking?.status ?? "").toLowerCase();

  const isDesktop = viewport.width >= 768;

  // Tinggi navbar mobile (70px agar nempel pas di atas navbar tanpa menutupi)
  const MOBILE_NAV_HEIGHT = 70; 
  const MOBILE_PEEK_HEIGHT = 76;
  const DESKTOP_PEEK_HEIGHT = 80;
  const DESKTOP_SHEET_HEIGHT = 440;

  // Tinggi maksimal sheet saat ditarik ke atas agar TIDAK menutupi navbar
  const sheetHeight = isDesktop
    ? DESKTOP_SHEET_HEIGHT
    : Math.max(380, viewport.height - MOBILE_NAV_HEIGHT - 12);

  const peekHeight = isDesktop ? DESKTOP_PEEK_HEIGHT : MOBILE_PEEK_HEIGHT;
  const peekOffset = Math.max(0, sheetHeight - peekHeight);

  const serviceName = Array.isArray(booking?.layanan_items)
    ? booking.layanan_items.map((item) => item?.nama_layanan || item?.nama).filter(Boolean).join(", ") || "-"
    : booking?.layanan?.nama_layanan || booking?.nama_layanan || "-";

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
    const currentHeight = isDesktop
      ? DESKTOP_SHEET_HEIGHT
      : Math.max(380, window.innerHeight - MOBILE_NAV_HEIGHT - 12);

    const currentPeekOffset = Math.max(0, currentHeight - (isDesktop ? DESKTOP_PEEK_HEIGHT : MOBILE_PEEK_HEIGHT));

    controls.start({
      y: currentPeekOffset,
      transition: { type: "spring", damping: 30, stiffness: 280 },
    });
  }, [isOpen, bookingId, controls, isDesktop]);

  useEffect(() => {
    if (!isOpen) return;

    controls.start({
      y: sheetMode === "full" ? 0 : peekOffset,
      transition: { type: "spring", damping: 30, stiffness: 280 },
    });
  }, [sheetMode, peekOffset, controls, isOpen]);

  useEffect(() => {
    return () => {
      if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);
    };
  }, []);

  // Location tracking
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

  // Load BHP
  useEffect(() => {
    if (!bookingId || !isOpen) return;

    let cancelled = false;

    const loadBhp = async () => {
      setLoadingBhp(true);
      try {
        const response = await getBhpBooking(bookingId);
        if (cancelled) return;

        const raw = response?.data ?? response ?? [];
        const data = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.items)
          ? raw.items
          : Array.isArray(raw?.booking_bhp)
          ? raw.booking_bhp
          : [];

        const normalized = data.map((item) => {
          const defaultQty = Number(item?.qty_default ?? item?.jumlah_default ?? item?.qty ?? 0);
          const realQty = Number(item?.qty_real ?? item?.jumlah_real ?? defaultQty);

          return {
            ...item,
            id_booking_bhp: item?.id_booking_bhp ?? null,
            id_bhp: item?.id_bhp ?? item?.id ?? null,
            nama_bhp: item?.nama_bhp ?? item?.nama_item ?? item?.nama ?? "-",
            qty_default: Number.isFinite(defaultQty) ? Math.max(0, defaultQty) : 0,
            qty_real: Number.isFinite(realQty)
              ? Math.max(realQty, Number.isFinite(defaultQty) ? defaultQty : 0)
              : 0,
          };
        });

        setBhpItems(normalized);
      } catch (error) {
        console.error("Gagal memuat BHP:", error);
      } finally {
        if (!cancelled) setLoadingBhp(false);
      }
    };

    loadBhp();
    return () => { cancelled = true; };
  }, [bookingId, isOpen]);

  // Load Chat
  useEffect(() => {
    if (!bookingId || !isChatOpen) return;

    let cancelled = false;

    const loadChat = async () => {
      try {
        const response = await getBookingChatMessages(bookingId);
        if (cancelled) return;

        const root = response?.data ?? response ?? {};
        const list = root?.messages ?? root?.data?.messages ?? response?.messages ?? [];
        setMessages(Array.isArray(list) ? list : []);
      } catch (error) {
        console.error("Gagal memuat chat:", error);
      }
    };

    loadChat();
    const interval = window.setInterval(loadChat, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [bookingId, isChatOpen]);

  useEffect(() => {
    if (isChatOpen && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isChatOpen]);

  const handleQtyChange = (index, delta) => {
    setBhpItems((previous) =>
      previous.map((item, itemIndex) => {
        if (itemIndex !== index) return item;

        const nextQty = Math.max(
          Number(item.qty_default) || 0,
          (Number(item.qty_real) || 0) + delta
        );

        return { ...item, qty_real: nextQty };
      })
    );
  };

  const handleSaveBhp = async () => {
    if (!bookingId || savingBhp) return;
    setSavingBhp(true);

    try {
      await updateBhpBooking(bookingId, bhpItems);
      setToast({ type: "success", text: "Kuantitas BHP berhasil diperbarui." });
    } catch (error) {
      setToast({
        type: "error",
        text: error?.response?.data?.message || "Gagal menyimpan BHP.",
      });
    } finally {
      setSavingBhp(false);
    }
  };

  const handleSendChat = async (event) => {
    event.preventDefault();
    const content = chatInput.trim();
    if (!content || !bookingId || sendingChat) return;

    setSendingChat(true);
    setChatInput("");

    try {
      await sendBookingChatMessage(bookingId, content);
      const response = await getBookingChatMessages(bookingId);
      const root = response?.data ?? response ?? {};
      const list = root?.messages ?? root?.data?.messages ?? response?.messages ?? [];
      setMessages(Array.isArray(list) ? list : []);
    } catch (error) {
      setChatInput(content);
      setToast({
        type: "error",
        text: error?.response?.data?.message || "Gagal mengirim pesan.",
      });
    } finally {
      setSendingChat(false);
    }
  };

  const handleFinishVisit = async () => {
    if (!bookingId || finishing) return;
    setFinishing(true);

    try {
      await finishBooking(bookingId);
      try {
        await deleteBookingChatRoom(bookingId);
      } catch (error) {
        console.warn("Gagal menutup room chat:", error);
      }

      setIsChatOpen(false);
      setToast({ type: "success", text: "Kunjungan berhasil diselesaikan." });

      finishTimeoutRef.current = window.setTimeout(async () => {
        await controls.start({
          y: sheetHeight,
          transition: { type: "spring", damping: 30, stiffness: 280 },
        });
        onClose();
        if (onRefresh) await onRefresh();
      }, 700);
    } catch (error) {
      setToast({
        type: "error",
        text: error?.response?.data?.message || "Gagal menyelesaikan kunjungan.",
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

  const handleDragEnd = async (_event, info) => {
    const offsetY = info.offset.y;
    const velocityY = info.velocity.y;

    if (sheetMode === "peek") {
      if (offsetY < -45 || velocityY < -300) {
        await snapToFull();
      } else {
        await snapToPeek();
      }
      return;
    }

    if (offsetY > 45 || velocityY > 300) {
      await snapToPeek();
    } else {
      await snapToFull();
    }
  };

  const handleDragStart = (event) => {
    dragControls.start(event);
  };

  if (!isOpen || !booking) return null;

  return (
    <>
      {toast && (
        <div className={`fixed top-4 right-4 z-[400] max-w-sm px-4 py-3 rounded-2xl shadow-xl text-white flex items-center gap-3 ${toast.type === "error" ? "bg-rose-600" : "bg-emerald-600"}`}>
          <p className="text-xs font-medium">{toast.text}</p>
          <button type="button" onClick={() => setToast(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Backdrop overlay (dibuat bottom-[70px] agar tidak menutupi navbar) */}
      <div
        className={`fixed inset-x-0 top-0 bottom-[70px] z-[30] bg-slate-900/40 backdrop-blur-[2px] transition-opacity duration-300 md:hidden ${
          sheetMode === "full" ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={snapToPeek}
      />

      {/* Bottom Sheet (z-[40] berada tepat di bawah Navbar z-[50]) */}
      <motion.div
        initial={{ y: peekOffset }}
        animate={controls}
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{ top: 0, bottom: peekOffset }}
        dragElastic={0.04}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        style={{ height: sheetHeight, touchAction: "none" }}
        className={`fixed z-[40] bg-white border border-slate-200 shadow-[0_-8px_25px_rgba(15,23,42,0.12)] flex flex-col overflow-hidden transition-all ${
          isDesktop
            ? "bottom-6 right-6 w-[420px] rounded-3xl"
            : "bottom-[70px] left-0 right-0 w-full rounded-t-3xl border-b-0"
        }`}
      >
        {/* Handle Bar & Bar Peek */}
        <div
          className="shrink-0 bg-white border-b border-slate-100 cursor-grab active:cursor-grabbing select-none touch-none"
          style={{ touchAction: "none" }}
          onPointerDown={handleDragStart}
          onClick={() => {
            if (sheetMode === "peek") snapToFull();
          }}
        >
          <div className="pt-2.5 pb-1 flex justify-center">
            <div className={`rounded-full transition-colors ${sheetMode === "peek" ? "w-10 h-1.5 bg-blue-500" : "w-10 h-1.5 bg-slate-300"}`} />
          </div>

          <div className="px-4 pb-3 pt-1">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 font-bold shrink-0 flex items-center justify-center border border-blue-100 shadow-sm text-xs">
                  {booking?.pasien?.foto || booking?.pasien?.foto_profil ? (
                    <img
                      src={booking?.pasien?.foto || booking?.pasien?.foto_profil}
                      alt={getBookingPatientName(booking)}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    getBookingPatientName(booking).charAt(0).toUpperCase()
                  )}
                </div>

                <div className="min-w-0">
                  <h3 className="text-xs font-bold text-slate-900 truncate">
                    {getBookingPatientName(booking)}
                  </h3>
                  <p className="text-[10px] font-semibold text-blue-600 truncate">
                    {getBookingCode(booking)} &bull; {serviceName}
                  </p>
                </div>
              </div>

              {sheetMode === "full" ? (
                <button
                  type="button"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.stopPropagation();
                    snapToPeek();
                  }}
                  className="w-7 h-7 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 shrink-0 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full shrink-0 border border-blue-100">
                  Tarik ke atas
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Content View */}
        {sheetMode === "full" && (
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
                {/* Informasi Pasien & Live Tracking */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Informasi Pasien
                    </p>

                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 text-[10px] font-semibold shrink-0">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                      </span>
                      Tracking Aktif
                    </span>
                  </div>

                  <div>
                    <p className="text-[10px] text-slate-400">Nama Pasien</p>
                    <p className="text-xs font-bold text-slate-900">
                      {getBookingPatientName(booking)}
                    </p>
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

                  <button
                    type="button"
                    onClick={() => setIsChatOpen(true)}
                    className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] transition-all text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    Chat Pasien (In-App)
                  </button>
                </div>

                {/* Detail Layanan */}
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
                        {getBookingVisitDate(booking)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Barang Habis Pakai (BHP) */}
                <div className="p-3.5 rounded-2xl bg-white border border-slate-100 shadow-sm space-y-2.5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-blue-600" />
                      Barang Habis Pakai (BHP)
                    </p>

                    {bhpItems.length > 0 && (
                      <button
                        type="button"
                        disabled={savingBhp}
                        onClick={handleSaveBhp}
                        className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold disabled:opacity-50 transition-colors"
                      >
                        {savingBhp ? <Loader2 className="w-3 h-3 animate-spin" /> : "Simpan BHP"}
                      </button>
                    )}
                  </div>

                  {loadingBhp ? (
                    <div className="py-4 flex justify-center">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    </div>
                  ) : bhpItems.length > 0 ? (
                    <div className="space-y-2">
                      {bhpItems.map((item, index) => {
                        const key = item?.id_booking_bhp ?? `${item?.id_bhp ?? "bhp"}-${index}`;

                        return (
                          <div
                            key={key}
                            className="flex items-center justify-between gap-3 p-2 rounded-xl bg-slate-50 border border-slate-200/60"
                          >
                            <div className="min-w-0">
                              <p className="font-bold text-slate-800 text-xs break-words">
                                {item.nama_bhp}
                              </p>
                              <p className="text-[10px] font-medium text-slate-400">
                                Qty Default: {item.qty_default}
                              </p>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                type="button"
                                disabled={item.qty_real <= item.qty_default}
                                onClick={() => handleQtyChange(index, -1)}
                                className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-600 active:bg-slate-100 disabled:opacity-30 transition-colors"
                              >
                                <Minus className="w-3 h-3" />
                              </button>

                              <span className="w-5 text-center font-bold text-slate-900 text-xs">
                                {item.qty_real}
                              </span>

                              <button
                                type="button"
                                onClick={() => handleQtyChange(index, 1)}
                                className="w-6 h-6 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-600 active:bg-slate-100 transition-colors"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="py-2 text-center text-[11px] text-slate-400">
                      Tidak ada BHP untuk booking ini.
                    </p>
                  )}
                </div>

                {/* Finish Action */}
                {statusStr !== "selesai" && statusStr !== "completed" && (
                  <div className="pt-1 pb-1">
                    <button
                      type="button"
                      disabled={finishing}
                      onClick={handleFinishVisit}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99]"
                    >
                      {finishing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      Selesaikan Kunjungan
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </motion.div>

      {/* Chat Modal */}
      {isChatOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col h-[500px]">
            <div className="p-4 bg-blue-600 text-white flex items-center justify-between shadow-md">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold shrink-0 text-xs">
                  {getBookingPatientName(booking).charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0">
                  <h4 className="font-bold text-xs truncate">
                    {getBookingPatientName(booking)}
                  </h4>
                  <p className="text-[9px] text-blue-100 font-medium">Chat Kunjungan Direct</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsChatOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/20 shrink-0 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 p-3 overflow-y-auto space-y-2.5 bg-slate-50">
              {messages.length > 0 ? (
                messages.map((message, index) => {
                  const senderType = String(
                    message?.sender_type ?? message?.sender ?? message?.role ?? ""
                  ).toLowerCase();
                  const isNakes = senderType === "nakes";
                  const key = message?.id_chat ?? message?.id ?? `${index}`;

                  return (
                    <div key={key} className={`flex ${isNakes ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[80%] px-3 py-2 rounded-2xl shadow-sm ${
                          isNakes
                            ? "bg-blue-600 text-white rounded-tr-none"
                            : "bg-white text-slate-800 border border-slate-200/80 rounded-tl-none"
                        }`}
                      >
                        <p className="text-xs leading-relaxed break-words">
                          {message?.content ?? message?.message ?? ""}
                        </p>
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
                onChange={(event) => setChatInput(event.target.value)}
                placeholder="Ketik pesan..."
                className="flex-1 min-w-0 rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-blue-500 transition-all"
              />

              <button
                type="submit"
                disabled={sendingChat || !chatInput.trim()}
                className="p-2 rounded-xl bg-blue-600 text-white disabled:opacity-40 shrink-0"
              >
                {sendingChat ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
"use client";

import { useEffect, useState, useCallback, useRef, Suspense } from "react";
import { useRouter } from "next/navigation";
import { getBookingAktif, sendBookingChat, getWebSocketConfig, getBookingChatHistory } from "@/services/bookingService";
import { resolveImageUrl } from "@/services/resolveImage";

/* ── helpers ── */
function formatCurrency(v) {
  const n = Number(v);
  if (Number.isNaN(n)) return "Rp0";
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(n);
}

function normalizeLayananList(layanan) {
  if (!layanan) return [];
  return Array.isArray(layanan) ? layanan : [layanan];
}

/* ── Status config (palette konsisten hijau SmartCare) ── */
const STATUS_CFG = {
  Pending:      { accent: "from-amber-500 to-amber-600",    badge: "bg-amber-100 text-amber-700", dot: "bg-amber-400", stepIdx: 0 },
  Dikonfirmasi: { accent: "from-sky-600 to-blue-600",       badge: "bg-sky-100 text-sky-700",       dot: "bg-sky-500",    stepIdx: 1 },
  DiPerjalanan: { accent: "from-emerald-600 to-green-600",  badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500", stepIdx: 2 },
  Tindakan:     { accent: "from-emerald-700 to-green-600",  badge: "bg-emerald-100 text-emerald-700", dot: "bg-emerald-500", stepIdx: 3 },
};

const STEPS = [
  { label: "Menunggu Konfirmasi",          icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  { label: "Pesanan Dikonfirmasi",         icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" },
  { label: "Nakes Dalam Perjalanan",       icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" },
  { label: "Sedang Tindakan",              icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" },
];

/* ── sub-components ── */
function StepTimeline({ stepIdx }) {
  return (
    <div className="space-y-0">
      {STEPS.map((s, i) => {
        const done   = i < stepIdx;
        const active = i === stepIdx;
        const isLast = i === STEPS.length - 1;
        return (
          <div key={s.label} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div className={`
                w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300
                ${done ? "bg-emerald-500" : active ? "bg-emerald-600 ring-4 ring-emerald-100" : "bg-slate-100"}
              `}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}
                  className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${done || active ? "text-white" : "text-slate-400"}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={s.icon} />
                </svg>
              </div>
              {!isLast && (
                <div className={`w-0.5 h-7 sm:h-8 mt-1 transition-colors duration-300 ${done ? "bg-emerald-400" : "bg-slate-200"}`} />
              )}
            </div>
            <div className="pt-1 sm:pt-1.5 pb-4 sm:pb-5">
              <p className={`text-xs sm:text-sm font-semibold leading-tight ${active ? "text-slate-900" : done ? "text-emerald-600" : "text-slate-400"}`}>
                {s.label}
              </p>
              {active && (
                <p className="text-[11px] sm:text-xs text-slate-500 mt-0.5">Sedang berlangsung</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      {title && (
        <div className="px-4 py-3 border-b border-slate-100">
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-widest text-slate-400">{title}</p>
        </div>
      )}
      <div className="px-4 py-4">{children}</div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-slate-50 last:border-0 gap-3">
      <span className="text-xs sm:text-sm text-slate-500 flex-shrink-0">{label}</span>
      <span className="text-xs sm:text-sm font-semibold text-slate-800 text-right break-words">{value}</span>
    </div>
  );
}

function LayananItem({ layanan }) {
  const photo = resolveImageUrl(layanan.foto_layanan ?? null);
  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-slate-50 last:border-0">
      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={photo} alt={layanan.nama_layanan} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-emerald-50">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-5 h-5 text-emerald-400">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs sm:text-sm font-semibold text-slate-800 truncate">{layanan.nama_layanan || "-"}</p>
        {layanan.tipe_layanan && (
          <p className="text-[10px] sm:text-[11px] text-slate-400 capitalize">{layanan.tipe_layanan}</p>
        )}
      </div>
      {layanan.s1 != null && (
        <p className="text-xs sm:text-sm font-bold text-slate-700 flex-shrink-0">{formatCurrency(layanan.s1)}</p>
      )}
    </div>
  );
}

/* ── Modal / Popup Chat ke Nakes (Gojek / Grab Style 2-Way Realtime) ── */
function ChatModal({ isOpen, onClose, bookingId, nakesName, nakesPhoto }) {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const messagesEndRef = useRef(null);
  const wsRef = useRef(null);

  // Helper normalisasi pesan dari berbagai struktur data (backend Laravel / WS Go / CMS)
  const normalizeMessage = (msg, idx = 0) => {
    if (!msg) return null;
    const content = msg.content || msg.message || msg.text || "";
    if (!content) return null;

    const senderRaw = String(msg.sender_type || msg.sender_role || msg.sender || "").toLowerCase();
    const isPatient = 
      senderRaw === "pasien" || 
      senderRaw === "patient" || 
      senderRaw === "user" || 
      senderRaw === "client";

    let timeFormatted = "";
    if (msg.created_at || msg.time) {
      try {
        const d = new Date(msg.created_at || msg.time);
        if (!Number.isNaN(d.getTime())) {
          timeFormatted = d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
        } else {
          timeFormatted = String(msg.time || "");
        }
      } catch {
        timeFormatted = String(msg.time || "");
      }
    }
    if (!timeFormatted) {
      timeFormatted = new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
    }

    return {
      id: msg.id || msg.id_message || `msg-${Date.now()}-${idx}-${Math.random()}`,
      sender: isPatient ? "pasien" : "nakes",
      senderName: msg.sender_name || (isPatient ? "Saya" : nakesName || "Tenaga Medis"),
      text: content,
      time: timeFormatted,
    };
  };

  // 1. Fetch riwayat chat dan sambungkan WebSocket
  useEffect(() => {
    if (!isOpen || !bookingId) return;

    let isSubscribed = true;
    const cacheKey = `shc_chat_${bookingId}`;

    // Muat riwayat awal dari cache lokal jika ada
    try {
      const saved = localStorage.getItem(cacheKey);
      if (saved) {
        setMessages(JSON.parse(saved));
      }
    } catch {
      // ignore
    }

    // Ambil riwayat chat terbaru dari backend database
    const loadHistory = async () => {
      try {
        setIsLoadingHistory(true);
        const res = await getBookingChatHistory(bookingId);
        if (!isSubscribed) return;

        const rawList = 
          res?.data?.messages || 
          res?.messages || 
          (Array.isArray(res?.data) ? res.data : null) || 
          (Array.isArray(res) ? res : []);

        if (Array.isArray(rawList) && rawList.length > 0) {
          const parsed = rawList.map((m, i) => normalizeMessage(m, i)).filter(Boolean);
          if (parsed.length > 0) {
            setMessages(parsed);
            try {
              localStorage.setItem(cacheKey, JSON.stringify(parsed));
            } catch {
              // ignore
            }
          }
        } else {
          setMessages((prev) => {
            if (prev.length === 0) {
              return [
                {
                  id: "system-welcome",
                  sender: "system",
                  text: "Chat terhubung secara langsung dengan Tenaga Medis.",
                  time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
                },
              ];
            }
            return prev;
          });
        }
      } catch (err) {
        console.warn("Gagal load history chat:", err);
      } finally {
        if (isSubscribed) setIsLoadingHistory(false);
      }
    };

    loadHistory();

    // Inisialisasi WebSocket Realtime
    const initWS = async () => {
      try {
        let wsUrl = "";
        const wsConfig = await getWebSocketConfig();
        if (wsConfig?.data?.url || wsConfig?.url) {
          wsUrl = wsConfig.data?.url || wsConfig.url;
        }

        // Fallback default host WS Go jika config null
        if (!wsUrl) {
          wsUrl = `ws://192.168.18.12:8088/ws?booking_id=${bookingId}`;
        } else if (!wsUrl.includes("booking_id=")) {
          wsUrl += (wsUrl.includes("?") ? "&" : "?") + `booking_id=${bookingId}`;
        }

        if (!isSubscribed) return;

        const socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          // Socket connected
        };

        socket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            // Cek jika pesan milik booking ini atau pesan umum dalam room
            const bId = data?.booking_id || data?.id_booking || data?.id;
            if (!bId || String(bId) === String(bookingId)) {
              const incoming = normalizeMessage(data);
              if (incoming) {
                setMessages((prev) => {
                  // Hindari duplikasi pesan jika ID sudah ada
                  const isDuplicate = prev.some((p) => p.id === incoming.id || (p.text === incoming.text && p.sender === incoming.sender && Math.abs(new Date(p.time || 0) - new Date(incoming.time || 0)) < 2000));
                  if (isDuplicate) return prev;

                  const updated = [...prev, incoming];
                  try {
                    localStorage.setItem(cacheKey, JSON.stringify(updated));
                  } catch {
                    // ignore
                  }
                  return updated;
                });
              }
            }
          } catch (e) {
            console.error("Gagal parse incoming WS:", e);
          }
        };

        socket.onerror = (e) => {
          console.warn("WebSocket chat error / connection fallback:", e);
        };
      } catch (err) {
        console.warn("Init WS exception:", err);
      }
    };

    initWS();

    // Fallback polling berkala setiap 4 detik untuk memastikan 2-way convo selalu sinkron meskipun WS terhalang jaringan lokal
    const pollingInterval = setInterval(async () => {
      try {
        const res = await getBookingChatHistory(bookingId);
        const rawList = 
          res?.data?.messages || 
          res?.messages || 
          (Array.isArray(res?.data) ? res.data : null) || 
          (Array.isArray(res) ? res : []);

        if (Array.isArray(rawList) && rawList.length > 0) {
          const parsed = rawList.map((m, i) => normalizeMessage(m, i)).filter(Boolean);
          if (parsed.length > 0) {
            setMessages((prev) => {
              if (parsed.length !== prev.filter((m) => m.sender !== "system").length) {
                try {
                  localStorage.setItem(cacheKey, JSON.stringify(parsed));
                } catch {
                  // ignore
                }
                return parsed;
              }
              return prev;
            });
          }
        }
      } catch {
        // silent polling error
      }
    }, 4000);

    return () => {
      isSubscribed = false;
      clearInterval(pollingInterval);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isOpen, bookingId, nakesName]);

  // Auto scroll ke bawah
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Kirim chat dari pasien
  const handleSend = async (e) => {
    e?.preventDefault();
    const trimmed = inputMessage.trim();
    if (!trimmed || isSending) return;

    const newMsg = {
      id: "msg-" + Date.now(),
      sender: "pasien",
      senderName: "Saya",
      text: trimmed,
      time: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
    };

    const cacheKey = `shc_chat_${bookingId}`;

    // Optimistic update
    setMessages((prev) => {
      const updated = [...prev, newMsg];
      try {
        localStorage.setItem(cacheKey, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });

    setInputMessage("");
    setIsSending(true);

    try {
      // 1. Kirim via WebSocket jika terhubung
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        try {
          wsRef.current.send(
            JSON.stringify({
              booking_id: Number(bookingId),
              sender_type: "pasien",
              content: trimmed,
            })
          );
        } catch {
          // ignore
        }
      }

      // 2. Kirim via REST API backend Laravel (diteruskan ke WS server Go)
      await sendBookingChat(bookingId, trimmed);
    } catch (err) {
      console.error("Gagal kirim chat:", err);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col h-[85vh] sm:h-[600px] overflow-hidden">
        {/* Chat Header */}
        <div className="bg-emerald-600 px-4 py-3.5 flex items-center justify-between text-white shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-white/20 border border-white/30 shrink-0">
              {nakesPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={nakesPhoto} alt={nakesName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-bold truncate max-w-[200px] leading-tight">{nakesName || "Tenaga Medis"}</p>
              <p className="text-[11px] text-emerald-100 flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-pulse" />
                Online &middot; SmartCare
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white transition active:scale-95 cursor-pointer"
            aria-label="Tutup Chat"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Chat Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
          {isLoadingHistory && messages.length === 0 && (
            <div className="text-center py-6 text-slate-400 text-xs">
              <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-1.5" />
              Menghubungkan percakapan...
            </div>
          )}

          {messages.map((m) => {
            if (m.sender === "system") {
              return (
                <div key={m.id} className="text-center my-2">
                  <span className="inline-block px-3 py-1 bg-slate-200/70 text-slate-600 rounded-full text-[11px]">
                    {m.text}
                  </span>
                </div>
              );
            }

            const isMe = m.sender === "pasien";
            return (
              <div key={m.id} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                <span className="text-[10px] text-slate-400 mb-0.5 px-1 font-medium">
                  {isMe ? "Saya" : m.senderName || nakesName || "Tenaga Medis"}
                </span>
                <div
                  className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                    isMe
                      ? "bg-emerald-600 text-white rounded-br-xs"
                      : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs"
                  }`}
                >
                  <p className="break-words">{m.text}</p>
                  <p className={`text-[9px] mt-1 text-right ${isMe ? "text-emerald-200" : "text-slate-400"}`}>
                    {m.time}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick replies */}
        <div className="px-3 py-2 bg-white border-t border-slate-100 flex gap-1.5 overflow-x-auto no-scrollbar">
          {["Halo, apakah sudah dekat?", "Saya menunggu di depan rumah ya", "Terima kasih!"].map((text) => (
            <button
              key={text}
              type="button"
              onClick={() => {
                setInputMessage(text);
              }}
              className="text-[11px] px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full shrink-0 transition active:scale-95 cursor-pointer"
            >
              {text}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 bg-white border-t border-slate-100 flex items-center gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Tulis pesan ke tenaga medis..."
            className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-slate-100 border border-transparent rounded-full focus:bg-white focus:border-emerald-500 focus:outline-none transition"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isSending}
            className="w-10 h-10 rounded-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white flex items-center justify-center transition active:scale-95 shrink-0 cursor-pointer"
            aria-label="Kirim Pesan"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 translate-x-0.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}

/* ── Main content ── */
function BookingAktifContent() {
  const router = useRouter();

  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [lastAt, setLastAt]   = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await getBookingAktif();
      if (!res?.data?.booking) { setError("Tidak ada booking aktif saat ini."); setData(null); return; }
      setData(res.data);
      setLastAt(new Date());
      setError(null);
    } catch (err) {
      if (err?.response?.status === 401) { router.push("/login"); return; }
      setError("Gagal memuat data. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 15_000);
    return () => clearInterval(id);
  }, [fetchData]);

  /* ── loading ── */
  if (loading) return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-[3px] border-emerald-500 border-t-transparent animate-spin" />
        <p className="text-sm text-slate-500 font-medium">Memuat status booking...</p>
      </div>
    </div>
  );

  /* ── error ── */
  if (error || !data) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center px-6 text-center gap-5">
      <div className="w-20 h-20 rounded-3xl bg-white border border-slate-200 flex items-center justify-center shadow-sm">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-9 h-9 text-slate-400">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
        </svg>
      </div>
      <div>
        <p className="text-base font-semibold text-slate-800 mb-1">{error ?? "Tidak ada booking aktif"}</p>
        <p className="text-sm text-slate-500">Kamu belum punya pesanan yang sedang berjalan.</p>
      </div>
      <button onClick={() => router.push("/")}
        className="px-6 py-2.5 rounded-full bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 active:scale-95 transition-all">
        Ke Beranda
      </button>
    </div>
  );

  const { booking, tenaga_medis_tracking: nakes, tracking_info: info } = data;
  const status = booking.status_booking;
  const cfg    = STATUS_CFG[status] ?? STATUS_CFG.Pending;
  const nakesData = nakes ?? booking.tenaga_medis ?? {};
  const nakesPhoto = resolveImageUrl(nakesData.foto_profile ?? null);

  const layananList = normalizeLayananList(booking.layanan);
  const layananSummary = layananList.map((l) => l.nama_layanan).filter(Boolean).join(", ") || "-";
  const totalLayanan = layananList.reduce((sum, l) => sum + Number(l.s1 || 0), 0);

  const alamatKunjungan = info?.lokasi_kunjungan?.alamat || booking.alamat_kunjungan || "-";

  return (
    <div className="min-h-screen bg-slate-50" style={{ fontFamily: '"Poppins","Inter","Segoe UI",sans-serif' }}>

      {/* ── HERO BANNER STATUS (Dibuat ringkas, tidak terlalu tinggi/gepeng, dan rapi) ── */}
      <div className={`bg-gradient-to-r ${cfg.accent} px-4 sm:px-6 pt-5 pb-5 relative rounded-b-2xl sm:rounded-b-3xl shadow-sm text-white`}>
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
          {/* Back button */}
          <button
            type="button"
            onClick={() => router.back()}
            className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center shrink-0 transition active:scale-90"
            aria-label="Kembali"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Info Status Tengah */}
          <div className="text-center flex-1 min-w-0">
            <p className="text-[11px] text-white/80 font-medium tracking-wide leading-tight">
              {booking.booking_code}
            </p>
            <h1 className="text-sm sm:text-base font-bold truncate leading-snug mt-0.5">
              {booking.status_label ?? status}
            </h1>
            {info?.estimasi_menit_sampai ? (
              <div className="inline-flex items-center gap-1.5 mt-1 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-[11px] font-medium">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3">
                  <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                </svg>
                <span>~{info.estimasi_menit_sampai} menit &middot; {info.jarak_km} km</span>
              </div>
            ) : null}
          </div>

          {/* Live Indicator Kanan */}
          <div className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/15 text-[10px] font-semibold tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
            <span>LIVE</span>
          </div>
        </div>
      </div>

      {/* ── BODY CONTENT (Diberi margin-top mt-5 lega, sama sekali TIDAK overlap/mepet dengan banner atas) ── */}
      <div className="px-4 sm:px-6 mt-5 pb-24 space-y-4 max-w-lg mx-auto">

        {/* Nakes Card (Gojek Driver Style dengan Call & Chat Action) */}
        {nakesData.nama_lengkap && (
          <Section>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl overflow-hidden bg-slate-100 shrink-0 border border-slate-200 shadow-xs">
                {nakesPhoto
                  ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={nakesPhoto} alt={nakesData.nama_lengkap} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-emerald-50">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 sm:w-7 sm:h-7 text-emerald-500">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  )
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm sm:text-base font-bold text-slate-900 truncate">{nakesData.nama_lengkap}</p>
                <p className="text-[11px] sm:text-xs text-slate-500 truncate mt-0.5">{nakesData.jenis_tenaga_medis}</p>
              </div>

              {/* Action Buttons: Chat & Phone Call (Gojek / Grab Pattern) */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Chat Button (Hijau Gojek/SmartCare Style) */}
                <button
                  type="button"
                  onClick={() => setIsChatOpen(true)}
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-700 flex items-center justify-center shadow-xs active:scale-90 transition-all cursor-pointer"
                  title="Chat Tenaga Medis"
                  aria-label="Chat Tenaga Medis"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 sm:w-5 sm:h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </button>

                {/* Call Button */}
                {nakesData.no_telp && (
                  <a href={`tel:${nakesData.no_telp}`}
                    className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-md active:scale-90 transition-all cursor-pointer"
                    title="Telepon Tenaga Medis"
                    aria-label="Telepon Tenaga Medis">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 sm:w-5 sm:h-5">
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.948V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </Section>
        )}

        {/* Progress Timeline */}
        <Section title="Status Pesanan">
          <StepTimeline stepIdx={cfg.stepIdx} />
        </Section>

        {/* Layanan yang dipesan */}
        <Section title={`Layanan Dipesan${layananList.length > 1 ? ` (${layananList.length})` : ""}`}>
          {layananList.length > 0 ? (
            <>
              {layananList.map((l, idx) => (
                <LayananItem key={l.id_layanan ?? idx} layanan={l} />
              ))}
              {layananList.length > 1 && (
                <div className="flex justify-between items-center pt-3 mt-1 border-t border-slate-100">
                  <span className="text-xs sm:text-sm font-semibold text-slate-500">Subtotal Layanan</span>
                  <span className="text-sm font-bold text-slate-800">{formatCurrency(totalLayanan)}</span>
                </div>
              )}
            </>
          ) : (
            <p className="text-xs sm:text-sm text-slate-400">Data layanan tidak tersedia.</p>
          )}
        </Section>

        {/* Lokasi */}
        <Section title="Lokasi">
          {info?.lokasi_nakes?.alamat && (
            <>
              <div className="flex items-start gap-3 mb-4">
                <div className="mt-0.5 w-8 h-8 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-blue-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-500 mb-0.5">Posisi Nakes Sekarang</p>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{info.lokasi_nakes.alamat}</p>
                </div>
              </div>
              <div className="ml-4 border-l-2 border-dashed border-slate-200 h-4 mb-4" />
            </>
          )}

          <div className="flex items-start gap-3">
            <div className="mt-0.5 w-8 h-8 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4 text-emerald-600">
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
              </svg>
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 mb-0.5">Tujuan Kunjungan</p>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">{alamatKunjungan}</p>
            </div>
          </div>
        </Section>

        {/* Detail Booking */}
        <Section title="Detail Pesanan">
          <InfoRow label="Layanan"          value={layananSummary} />
          <InfoRow label="Tanggal"          value={booking.tanggal_kunjungan ?? "-"} />
          <InfoRow label="Jam"              value={booking.jam_kunjungan?.slice ? booking.jam_kunjungan.slice(0, 5) : (booking.jam_kunjungan ?? "-")} />
          <InfoRow label="Pasien"           value={booking.pasien?.nama_lengkap ?? "-"} />
          <InfoRow label="No. Rekam Medis"  value={booking.medical_record_number ?? "-"} />
          {booking.transaksi?.jumlah_total_format && (
            <InfoRow label="Total Bayar" value={booking.transaksi.jumlah_total_format} />
          )}
          {booking.transaksi?.metode_pembayaran && (
            <InfoRow label="Metode Pembayaran" value={booking.transaksi.metode_pembayaran} />
          )}
          {booking.transaksi?.status_transaksi && (
            <InfoRow label="Status Bayar" value={booking.transaksi.status_transaksi} />
          )}
        </Section>

      </div>

      {/* Popup / Modal Chat */}
      <ChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        bookingId={booking.id_booking}
        nakesName={nakesData.nama_lengkap}
        nakesPhoto={nakesPhoto}
      />
    </div>
  );
}

export default function BookingAktifPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full border-[3px] border-emerald-500 border-t-transparent animate-spin" />
      </div>
    }>
      <BookingAktifContent />
    </Suspense>
  );
}


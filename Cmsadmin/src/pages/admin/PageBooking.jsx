import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { URL as API_URL } from "../../utils/getUrl";
import { BASE_URL as CLIENT_BASE_URL } from "../../utils/apiClient";
import { getAuthHeaders } from "../../utils/auth";
import Pagination from "../../components/pagination";

// Ensure BASE_URL always has /api prefix
const RAW_URL = API_URL || CLIENT_BASE_URL || "https://citra.faaruq.com/api";
const BASE_URL = RAW_URL.endsWith("/api") ? RAW_URL : `${RAW_URL.replace(/\/+$/, "")}/api`;

// ==========================================
// UTILS & HELPER FUNCTIONS
// ==========================================
function formatDate(value) {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function formatRupiah(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

function renderStatusBadge(status) {
  const value = String(status || "pending").toLowerCase();
  if (value === "selesai" || value === "completed" || value === "success") {
    return <span className="inline-flex items-center rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">Selesai</span>;
  }
  if (value === "dibatalkan" || value === "cancelled" || value === "canceled") {
    return <span className="inline-flex items-center rounded-md bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-800 border border-rose-200">Dibatalkan</span>;
  }
  if (value === "diperjalanan" || value === "di perjalanan" || value === "dalam perjalanan") {
    return <span className="inline-flex items-center rounded-md bg-blue-100 px-2.5 py-1 text-xs font-bold text-blue-800 border border-blue-200">Di Perjalanan</span>;
  }
  if (value === "tindakan" || value === "sedang tindakan") {
    return <span className="inline-flex items-center rounded-md bg-purple-100 px-2.5 py-1 text-xs font-bold text-purple-800 border border-purple-200">Tindakan</span>;
  }
  return <span className="inline-flex items-center rounded-md bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800 border border-amber-200">{status || "Pending"}</span>;
}

function renderPaymentBadge(status) {
  const value = String(status || "belum bayar").toLowerCase();
  if (["settlement", "sukses", "paid", "lunas", "capture"].includes(value)) {
    return <span className="inline-flex items-center rounded-md bg-emerald-100 px-2.5 py-1 text-xs font-bold text-emerald-800 border border-emerald-200">Lunas</span>;
  }
  if (["pending", "menunggu", "waiting"].includes(value)) {
    return <span className="inline-flex items-center rounded-md bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800 border border-amber-200">Pending</span>;
  }
  if (["expire", "failed", "gagal", "deny", "cancel"].includes(value)) {
    return <span className="inline-flex items-center rounded-md bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-800 border border-rose-200">Gagal</span>;
  }
  return <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-700 border border-slate-200">Belum Bayar</span>;
}

function getNormalizedPaymentStatus(booking) {
  const rawStatus = String(booking.transaksi?.status_transaksi || "belum bayar").toLowerCase();
  if (["settlement", "sukses", "paid", "lunas", "capture"].includes(rawStatus)) return "lunas";
  if (["pending", "menunggu", "waiting", "belum bayar"].includes(rawStatus)) return "pending";
  if (["expire", "failed", "gagal", "deny", "cancel"].includes(rawStatus)) return "gagal";
  return "pending";
}

// ==========================================
// FUNCTION 1: HALAMAN LIST & DASHBOARD BOOKING CMS
// ==========================================
export default function PageBooking() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  async function fetchBookings() {
    try {
      setLoading(true);
      setErrorMsg("");
      
      // Try /manage-admin/bookings route first, fallback to /admin/bookings, then /booking
      let res = await fetch(`${BASE_URL}/manage-admin/bookings`, {
        headers: getAuthHeaders({ Accept: "application/json" }),
      });

      if (!res.ok) {
        res = await fetch(`${BASE_URL}/admin/bookings`, {
          headers: getAuthHeaders({ Accept: "application/json" }),
        });
      }

      if (!res.ok) {
        res = await fetch(`${BASE_URL}/booking`, {
          headers: getAuthHeaders({ Accept: "application/json" }),
        });
      }

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Gagal mengambil data booking");
      }
      setBookings(data.data || []);
    } catch (err) {
      console.error("Gagal mengambil data booking", err);
      setErrorMsg(err.message || "Gagal mengambil data booking");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeFilter, searchQuery]);

  const filteredBookings = bookings.filter((booking) => {
    const bookingStatus = String(booking.status_booking || "").toLowerCase();
    const paymentStatus = getNormalizedPaymentStatus(booking);

    let matchesCategory = true;
    if (activeFilter !== "all") {
      if (["diperjalanan", "tindakan", "selesai", "dibatalkan"].includes(activeFilter)) {
        matchesCategory = bookingStatus.includes(activeFilter);
      } else {
        matchesCategory = paymentStatus === activeFilter;
      }
    }

    const bookingCode = String(booking.booking_code || `#${booking.id_booking}`).toLowerCase();
    const patientName = String(booking.pasien?.nama_lengkap || booking.pasien?.nama || "").toLowerCase();
    const nakesName = String(booking.tenaga_medis?.nama_lengkap || booking.tenaga_medis?.nama || "").toLowerCase();
    const layananName = String(booking.layanan?.nama_layanan || booking.layanan?.nama || "").toLowerCase();
    const query = searchQuery.toLowerCase().trim();

    return (
      matchesCategory &&
      (query === "" ||
        bookingCode.includes(query) ||
        patientName.includes(query) ||
        nakesName.includes(query) ||
        layananName.includes(query))
    );
  });

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBookings = filteredBookings.slice(startIndex, startIndex + itemsPerPage);

  // Financial Metrics Calculations
  const totalLunasAmount = bookings
    .filter((b) => getNormalizedPaymentStatus(b) === "lunas")
    .reduce((sum, b) => sum + Number(b.transaksi?.jumlah_total || 0), 0);

  const totalHakNakesAmount = bookings
    .reduce((sum, b) => sum + Number(b.transaksi?.hak_nakes || 0), 0);

  const totalProfitHcAmount = bookings
    .reduce((sum, b) => sum + Number(b.transaksi?.profit_hc || 0), 0);

  const counts = {
    all: bookings.length,
    diperjalanan: bookings.filter((b) => String(b.status_booking || "").toLowerCase().includes("diperjalanan")).length,
    tindakan: bookings.filter((b) => String(b.status_booking || "").toLowerCase().includes("tindakan")).length,
    selesai: bookings.filter((b) => String(b.status_booking || "").toLowerCase().includes("selesai")).length,
    lunas: bookings.filter((b) => getNormalizedPaymentStatus(b) === "lunas").length,
    pending: bookings.filter((b) => getNormalizedPaymentStatus(b) === "pending").length,
    gagal: bookings.filter((b) => getNormalizedPaymentStatus(b) === "gagal" || String(b.status_booking || "").toLowerCase().includes("dibatalkan")).length,
  };

  const filterOptions = [
    { key: "all", label: "Semua", count: counts.all },
    { key: "diperjalanan", label: "Di Perjalanan", count: counts.diperjalanan },
    { key: "tindakan", label: "Tindakan", count: counts.tindakan },
    { key: "selesai", label: "Selesai", count: counts.selesai },
    { key: "lunas", label: "Lunas (Bayar)", count: counts.lunas },
    { key: "pending", label: "Pending (Bayar)", count: counts.pending },
    { key: "gagal", label: "Gagal / Batal", count: counts.gagal },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Data Booking & Transaksi</h1>
          <p className="text-sm text-slate-500">Monitoring real-time pesanan layanan kesehatan, status transaksi, dan bagi hasil nakes.</p>
        </div>
        <button
          onClick={fetchBookings}
          className="inline-flex items-center gap-2 text-xs bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold px-3.5 py-2 rounded-xl shadow-sm transition"
        >
          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Data
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Omzet Lunas</p>
          <h3 className="mt-1 text-2xl font-extrabold text-emerald-600">{formatRupiah(totalLunasAmount)}</h3>
          <p className="mt-1 text-xs text-slate-500">{counts.lunas} transaksi telah dibayar</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Booking Masuk</p>
          <h3 className="mt-1 text-2xl font-extrabold text-slate-800">{counts.all}</h3>
          <p className="mt-1 text-xs text-amber-600 font-medium">{counts.pending} pending pembayaran</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Hak Nakes Total</p>
          <h3 className="mt-1 text-2xl font-extrabold text-blue-600">{formatRupiah(totalHakNakesAmount)}</h3>
          <p className="mt-1 text-xs text-slate-500">Jasa Medis + Biaya Transport</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Net Profit HC</p>
          <h3 className="mt-1 text-2xl font-extrabold text-indigo-600">{formatRupiah(totalProfitHcAmount)}</h3>
          <p className="mt-1 text-xs text-slate-500">Setelah komisi & fee Midtrans</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Cari kode booking, pasien, nakes, layanan..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 pl-9 text-xs text-slate-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition"
          />
          <svg className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {filterOptions.map((option) => (
            <button
              key={option.key}
              onClick={() => setActiveFilter(option.key)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium transition ${
                activeFilter === option.key ? "bg-indigo-600 text-white shadow-sm" : "bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100"
              }`}
            >
              <span>{option.label}</span>
              <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${activeFilter === option.key ? "bg-indigo-500 text-white" : "bg-slate-200 text-slate-700"}`}>
                {option.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {errorMsg && <div className="rounded-xl bg-rose-50 p-4 text-xs font-medium text-rose-600 border border-rose-200">{errorMsg}</div>}

      {/* Table Section */}
      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">Memuat data booking & transaksi...</div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-left font-bold uppercase tracking-wider text-slate-500">
                  <th className="w-10 px-4 py-3 text-center">No.</th>
                  <th className="px-4 py-3">Kode Booking</th>
                  <th className="px-4 py-3">Pasien & Alamat</th>
                  <th className="px-4 py-3">Tenaga Medis</th>
                  <th className="px-4 py-3">Layanan</th>
                  <th className="px-4 py-3">Total Tagihan</th>
                  <th className="px-4 py-3">Status Booking</th>
                  <th className="px-4 py-3">Status Transaksi</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal text-slate-700">
                {paginatedBookings.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="py-8 text-center text-slate-400">Tidak ada data booking yang cocok.</td>
                  </tr>
                ) : (
                  paginatedBookings.map((booking, index) => (
                    <tr
                      key={booking.id_booking}
                      onClick={() => navigate(`/bookings/${booking.id_booking}`)}
                      className="hover:bg-slate-50/80 transition cursor-pointer"
                    >
                      <td className="px-4 py-3.5 text-center font-medium text-slate-400">{startIndex + index + 1}</td>
                      <td className="px-4 py-3.5 font-bold font-mono text-indigo-600">{booking.booking_code || `#${booking.id_booking}`}</td>
                      <td className="px-4 py-3.5">
                        <span className="font-semibold text-slate-900 block">{booking.pasien?.nama_lengkap || booking.pasien?.nama || "Pasien Anonim"}</span>
                        <span className="text-[11px] text-slate-400 block truncate max-w-xs">{booking.alamat_kunjungan || "-"}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-medium text-slate-800">{booking.tenaga_medis?.nama_lengkap || booking.tenaga_medis?.nama || <span className="italic text-slate-400">Belum Ditugaskan</span>}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="font-medium text-slate-800">{booking.layanan?.nama_layanan || booking.layanan?.nama || "-"}</span>
                      </td>
                      <td className="px-4 py-3.5 font-bold text-slate-900">{formatRupiah(booking.transaksi?.jumlah_total)}</td>
                      <td className="px-4 py-3.5">{renderStatusBadge(booking.status_booking)}</td>
                      <td className="px-4 py-3.5">{renderPaymentBadge(booking.transaksi?.status_transaksi)}</td>
                      <td className="px-4 py-3.5 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/bookings/${booking.id_booking}`);
                          }}
                          className="rounded-lg bg-indigo-50 border border-indigo-100 px-3 py-1 text-[11px] font-bold text-indigo-600 hover:bg-indigo-100 transition"
                        >
                          Detail &rarr;
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="p-4 border-t border-slate-100">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(page) => setCurrentPage(page)} />
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// FUNCTION 2: HALAMAN DETAIL BOOKING & TRANSAKSI
// ==========================================
export function PageBookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [laporan, setLaporan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const availableStatuses = [
    "Pending",
    "DiPerjalanan",
    "Tindakan",
    "Selesai",
    "Dibatalkan"
  ];

  async function fetchDetail() {
    try {
      setLoading(true);
      setErrorMsg("");

      const res = await fetch(`${BASE_URL}/booking/${id}`, {
        headers: getAuthHeaders({ Accept: "application/json" }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Gagal mengambil detail booking");
      }

      setBooking(data.data);

      // Fetch Laporan Financial Breakdown
      try {
        const lapRes = await fetch(`${BASE_URL}/booking/${id}/laporan`, {
          headers: getAuthHeaders({ Accept: "application/json" }),
        });
        if (lapRes.ok) {
          const lapData = await lapRes.json();
          if (lapData.success) {
            setLaporan(lapData.data);
          }
        }
      } catch (e) {
        console.warn("Laporan endpoint fetch skipped:", e);
      }

    } catch (err) {
      console.error("Gagal mengambil detail booking", err);
      setErrorMsg(err.message || "Gagal mengambil detail booking");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);

  async function handleUpdateStatus(newStatus) {
    try {
      setUpdatingStatus(true);
      setStatusMessage("");

      const res = await fetch(`${BASE_URL}/booking/${id}/status`, {
        method: "PATCH",
        headers: getAuthHeaders({
          "Content-Type": "application/json",
          Accept: "application/json",
        }),
        body: JSON.stringify({ status_booking: newStatus }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Gagal memperbarui status booking");
      }

      setBooking(data.data);
      setStatusMessage(`Status booking berhasil diperbarui menjadi "${newStatus}"`);
      setTimeout(() => setStatusMessage(""), 4000);
    } catch (err) {
      console.error("Gagal update status", err);
      setErrorMsg(err.message || "Gagal memperbarui status booking");
    } finally {
      setUpdatingStatus(false);
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-sm text-slate-500">Memuat detail booking...</div>;
  }

  if (errorMsg || !booking) {
    return (
      <div className="p-6 max-w-4xl mx-auto space-y-4">
        <button onClick={() => navigate(-1)} className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1">
          &larr; Kembali
        </button>
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-600 font-medium">
          {errorMsg || "Data booking tidak ditemukan."}
        </div>
      </div>
    );
  }

  const tx = booking.transaksi;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/booking")}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-sm"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kembali ke Daftar Booking
        </button>
        <div className="flex items-center gap-2">
          {renderStatusBadge(booking.status_booking)}
          {renderPaymentBadge(tx?.status_transaksi)}
        </div>
      </div>

      {statusMessage && (
        <div className="rounded-xl bg-emerald-50 p-3.5 text-xs text-emerald-700 font-semibold border border-emerald-200">
          {statusMessage}
        </div>
      )}

      {/* Main Booking Code & Status Controller */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-xs font-extrabold uppercase tracking-wider text-indigo-600">Rincian & Laporan Transaksi Booking</span>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-900 font-mono">{booking.booking_code || `#${booking.id_booking}`}</h1>
          <p className="mt-1 text-xs text-slate-400">Dibuat pada: {formatDate(booking.created_at)}</p>
        </div>

        {/* Panel Update Status Booking */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 flex flex-col gap-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Ubah Status Booking:</label>
          <div className="flex flex-wrap gap-1.5">
            {availableStatuses.map((st) => {
              const isActive = String(booking.status_booking || "").toLowerCase() === st.toLowerCase();
              return (
                <button
                  key={st}
                  disabled={updatingStatus}
                  onClick={() => handleUpdateStatus(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    isActive
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {st}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column: Patient, Nakes, Service & Schedule Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Informasi Pasien</h3>
              <p className="mt-2 text-base font-bold text-slate-900">{booking.pasien?.nama_lengkap || booking.pasien?.nama || "-"}</p>
              <div className="mt-2 space-y-1 text-xs text-slate-500">
                <p>No. Telp: <span className="font-semibold text-slate-700">{booking.pasien?.no_telp || "-"}</span></p>
                <p>NIK: <span className="font-semibold text-slate-700">{booking.pasien?.nik || "-"}</span></p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Tenaga Medis</h3>
              <p className="mt-2 text-base font-bold text-slate-900">{booking.tenaga_medis?.nama_lengkap || booking.tenaga_medis?.nama || "Belum Ditugaskan"}</p>
              <div className="mt-2 space-y-1 text-xs text-slate-500">
                <p>Spesialisasi: <span className="font-semibold text-slate-700">{booking.tenaga_medis?.jenis_tenaga_medis || "-"}</span></p>
                <p>STR: <span className="font-semibold text-slate-700">{booking.tenaga_medis?.no_str || "-"}</span></p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Jadwal & Lokasi Kunjungan</h3>
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block">Layanan Terpilih</span>
                <span className="font-bold text-slate-800 text-sm">{booking.layanan?.nama_layanan || booking.layanan?.nama || "-"}</span>
              </div>
              <div>
                <span className="text-slate-400 block">Waktu Kunjungan</span>
                <span className="font-bold text-slate-800 text-sm">{formatDate(booking.tanggal_kunjungan)} ({booking.jam_kunjungan || "-"})</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 text-xs">
              <span className="text-slate-400 block font-semibold">Alamat Kunjungan</span>
              <p className="mt-1 font-medium text-slate-800 leading-relaxed">{booking.alamat_kunjungan || "-"}</p>
              {booking.latitude_kunjungan && booking.longitude_kunjungan && (
                <a
                  href={`https://maps.google.com/?q=${booking.latitude_kunjungan},${booking.longitude_kunjungan}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center text-xs font-bold text-indigo-600 hover:underline"
                >
                  Lihat di Google Maps &rarr;
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Financial & Cost Breakdown */}
        <div className="space-y-6">
          {tx && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Rincian Komponen Biaya</h3>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Tarif Jasa Medis (SL)</span>
                  <span className="font-semibold text-slate-900">{formatRupiah(tx.sl)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Bahan Habis Pakai (SB)</span>
                  <span className="font-semibold text-slate-900">{formatRupiah(tx.sb)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Biaya Transportasi (ST)</span>
                  <span className="font-semibold text-slate-900">{formatRupiah(tx.st)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Biaya Admin Aplikasi</span>
                  <span className="font-semibold text-slate-900">{formatRupiah(tx.ba)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>PPN Pajak ({tx.persen_ppn || 0}%)</span>
                  <span className="font-semibold text-slate-900">{formatRupiah(tx.ppn)}</span>
                </div>

                <div className="border-t border-slate-200 pt-3 flex justify-between text-sm font-extrabold text-slate-900">
                  <span>Total Tagihan Pasien</span>
                  <span className="text-indigo-600">{formatRupiah(tx.jumlah_total)}</span>
                </div>

                {/* Bagi Hasil Internal Card */}
                <div className="mt-4 rounded-xl bg-slate-900 text-white p-4 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Distribusi Bagi Hasil Internal</span>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Hak Nakes:</span>
                    <span className="font-bold text-emerald-400">{formatRupiah(tx.hak_nakes)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Net Profit HC:</span>
                    <span className="font-bold text-blue-400">{formatRupiah(tx.profit_hc)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800">
                    <span>Fee Midtrans: {formatRupiah(tx.fee_midtrans || 4000)}</span>
                    <span>HPP BHP: {formatRupiah(tx.hpp_bhp || 0)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
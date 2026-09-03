import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { URL } from "../../utils/getUrl";
import { getAuthHeaders } from "../../utils/auth";
import Pagination from "../../components/pagination";

const BASE_URL = URL;

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
    return <span className="inline-flex items-center rounded-md bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">Selesai</span>;
  }
  if (value === "dibatalkan" || value === "cancelled" || value === "canceled") {
    return <span className="inline-flex items-center rounded-md bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">Dibatalkan</span>;
  }
  if (value === "diperjalanan" || value === "dalam perjalanan") {
    return <span className="inline-flex items-center rounded-md bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">Di Perjalanan</span>;
  }
  if (value === "tindakan" || value === "sedang tindakan") {
    return <span className="inline-flex items-center rounded-md bg-purple-100 px-2.5 py-1 text-xs font-semibold text-purple-700">Tindakan</span>;
  }
  return <span className="inline-flex items-center rounded-md bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">{status || "Pending"}</span>;
}

function renderPaymentBadge(status) {
  const value = String(status || "belum bayar").toLowerCase();
  if (["settlement", "sukses", "paid", "lunas", "capture"].includes(value)) {
    return <span className="inline-flex items-center rounded-md bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-700">Lunas</span>;
  }
  if (["pending", "menunggu", "waiting"].includes(value)) {
    return <span className="inline-flex items-center rounded-md bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">Pending</span>;
  }
  if (["expire", "failed", "gagal", "deny", "cancel"].includes(value)) {
    return <span className="inline-flex items-center rounded-md bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">Gagal</span>;
  }
  return <span className="inline-flex items-center rounded-md bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">Belum Bayar</span>;
}

function getNormalizedPaymentStatus(booking) {
  const rawStatus = String(booking.transaksi?.status_transaksi || "belum bayar").toLowerCase();
  if (["settlement", "sukses", "paid", "lunas", "capture"].includes(rawStatus)) return "lunas";
  if (["pending", "menunggu", "waiting", "belum bayar"].includes(rawStatus)) return "pending";
  if (["expire", "failed", "gagal", "deny", "cancel"].includes(rawStatus)) return "gagal";
  return "pending";
}

const STATUS_BOOKING_OPTIONS = [
  { key: "all", label: "Semua Status" },
  { key: "pending", label: "Pending" },
  { key: "diperjalanan", label: "Di Perjalanan" },
  { key: "tindakan", label: "Tindakan" },
  { key: "selesai", label: "Selesai" },
  { key: "dibatalkan", label: "Dibatalkan" },
];

const MONTH_OPTIONS = [
  { value: "1", label: "Januari" },
  { value: "2", label: "Februari" },
  { value: "3", label: "Maret" },
  { value: "4", label: "April" },
  { value: "5", label: "Mei" },
  { value: "6", label: "Juni" },
  { value: "7", label: "Juli" },
  { value: "8", label: "Agustus" },
  { value: "9", label: "September" },
  { value: "10", label: "Oktober" },
  { value: "11", label: "November" },
  { value: "12", label: "Desember" },
];

const SORT_FIELD_OPTIONS = [
  { value: "tanggal_kunjungan", label: "Tgl Kunjungan" },
  { value: "created_at", label: "Tgl Dibuat" },
  { value: "jumlah_total", label: "Total Bayar" },
  { value: "booking_code", label: "Kode Booking" },
];

// ==========================================
// FUNCTION 1: HALAMAN LIST & DASHBOARD
// ==========================================
export default function PageBooking() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [showFilter, setShowFilter] = useState(true);

  // ----- FILTER STATES -----
  const [statusBooking, setStatusBooking] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [patientFilter, setPatientFilter] = useState("all");
  const [nakesFilter, setNakesFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [rekamMedisId, setRekamMedisId] = useState("");
  const [sortBy, setSortBy] = useState("tanggal_kunjungan");
  const [sortDir, setSortDir] = useState("desc");

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    async function fetchBookings() {
      try {
        setLoading(true);
        setErrorMsg("");
        const res = await fetch(BASE_URL + "/admin/bookings", {
          headers: getAuthHeaders({ Accept: "application/json" }),
        });
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

    fetchBookings();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [statusBooking, searchQuery, dateFrom, dateTo, patientFilter, nakesFilter, monthFilter, yearFilter, rekamMedisId, sortBy, sortDir, itemsPerPage]);

  const patientOptions = useMemo(() => {
    const map = new Map();
    (bookings || []).forEach((b) => {
      if (b.pasien?.id_pasien) map.set(b.pasien.id_pasien, b.pasien.nama_lengkap);
    });
    return Array.from(map, ([id, nama]) => ({ id, nama }));
  }, [bookings]);

  const nakesOptions = useMemo(() => {
    const map = new Map();
    (bookings || []).forEach((b) => {
      if (b.tenaga_medis?.id_tenaga_medis) map.set(b.tenaga_medis.id_tenaga_medis, b.tenaga_medis.nama_lengkap);
    });
    return Array.from(map, ([id, nama]) => ({ id, nama }));
  }, [bookings]);

  const yearOptions = useMemo(() => {
    const years = new Set();
    (bookings || []).forEach((b) => {
      if (b.tanggal_kunjungan) years.add(new Date(b.tanggal_kunjungan).getFullYear());
    });
    return Array.from(years).sort((a, b) => b - a);
  }, [bookings]);

  const filteredBookings = useMemo(() => {
    let result = (bookings || []).filter((booking) => {
      const bookingStatus = String(booking.status_booking || "").toLowerCase();
      const visitDate = booking.tanggal_kunjungan ? new Date(booking.tanggal_kunjungan) : null;

      if (statusBooking !== "all" && !bookingStatus.includes(statusBooking)) return false;

      const query = searchQuery.toLowerCase().trim();
      if (query) {
        const bookingCode = String(booking.booking_code || "#" + booking.id_booking).toLowerCase();
        const patientName = String(booking.pasien?.nama_lengkap || "").toLowerCase();
        if (!bookingCode.includes(query) && !patientName.includes(query)) return false;
      }

      if (dateFrom && visitDate && visitDate < new Date(dateFrom)) return false;
      if (dateTo && visitDate && visitDate > new Date(dateTo + "T23:59:59")) return false;

      if (patientFilter !== "all" && String(booking.pasien?.id_pasien) !== String(patientFilter)) return false;

      if (nakesFilter !== "all" && String(booking.tenaga_medis?.id_tenaga_medis) !== String(nakesFilter)) return false;

      if (visitDate) {
        if (monthFilter !== "all" && visitDate.getMonth() + 1 !== Number(monthFilter)) return false;
        if (yearFilter !== "all" && visitDate.getFullYear() !== Number(yearFilter)) return false;
      } else if (monthFilter !== "all" || yearFilter !== "all") {
        return false;
      }

      if (rekamMedisId.trim() && String(booking.pasien?.id_rekam_medis || "") !== rekamMedisId.trim()) return false;

      return true;
    });

    result = [...result].sort((a, b) => {
      let valA;
      let valB;
      if (sortBy === "jumlah_total") {
        valA = Number(a.transaksi?.jumlah_total || 0);
        valB = Number(b.transaksi?.jumlah_total || 0);
      } else if (sortBy === "booking_code") {
        valA = String(a.booking_code || "");
        valB = String(b.booking_code || "");
      } else {
        valA = new Date(a[sortBy] || 0).getTime();
        valB = new Date(b[sortBy] || 0).getTime();
      }
      if (valA < valB) return sortDir === "asc" ? -1 : 1;
      if (valA > valB) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [bookings, statusBooking, searchQuery, dateFrom, dateTo, patientFilter, nakesFilter, monthFilter, yearFilter, rekamMedisId, sortBy, sortDir]);

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBookings = filteredBookings.slice(startIndex, startIndex + itemsPerPage);

  const lunasInPage = filteredBookings.filter((b) => getNormalizedPaymentStatus(b) === "lunas");
  const totalLunasAmount = lunasInPage.reduce((sum, b) => sum + Number(b.transaksi?.jumlah_total || 0), 0);
  const sedangTindakanCount = filteredBookings.filter((b) => {
    const s = String(b.status_booking || "").toLowerCase();
    return s.includes("tindakan") || s.includes("diperjalanan");
  }).length;
  const selesaiCount = filteredBookings.filter((b) => String(b.status_booking || "").toLowerCase().includes("selesai")).length;

  function handleQuickDate(range) {
    const today = new Date();
    if (range === "today") {
      const iso = today.toISOString().slice(0, 10);
      setDateFrom(iso);
      setDateTo(iso);
    } else if (range === "7days") {
      const past = new Date();
      past.setDate(today.getDate() - 7);
      setDateFrom(past.toISOString().slice(0, 10));
      setDateTo(today.toISOString().slice(0, 10));
    }
  }

  function handleResetFilter() {
    setStatusBooking("all");
    setSearchQuery("");
    setDateFrom("");
    setDateTo("");
    setPatientFilter("all");
    setNakesFilter("all");
    setMonthFilter("all");
    setYearFilter("all");
    setRekamMedisId("");
    setSortBy("tanggal_kunjungan");
    setSortDir("desc");
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard & Manajemen Booking</h1>
          <p className="text-sm text-slate-500">Monitor status kunjungan, transaksi pembayaran, dan filter jadwal pasien.</p>
        </div>
        <button
          onClick={() => setShowFilter((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-600 hover:bg-blue-100"
        >
          {showFilter ? "Sembunyikan Filter" : "Tampilkan Filter"}
        </button>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Total Omzet Lunas</p>
          <h3 className="mt-2 text-2xl font-extrabold text-green-600">{formatRupiah(totalLunasAmount)}</h3>
          <p className="mt-1 text-xs text-slate-400">Dari {lunasInPage.length} transaksi lunas di halaman ini</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Total Booking</p>
          <h3 className="mt-2 text-2xl font-extrabold text-slate-800">{filteredBookings.length}</h3>
          <p className="mt-1 text-xs text-slate-400">Sesuai kriteria filter</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Sedang Tindakan / Jalan</p>
          <h3 className="mt-2 text-2xl font-extrabold text-purple-600">{sedangTindakanCount}</h3>
          <p className="mt-1 text-xs text-slate-400">Proses kunjungan aktif</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Booking Selesai</p>
          <h3 className="mt-2 text-2xl font-extrabold text-green-600">{selesaiCount}</h3>
          <p className="mt-1 text-xs text-slate-400">Kunjungan sukses</p>
        </div>
      </div>

      {showFilter && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-bold text-slate-800">
              <svg className="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h18M6 8h12M10 12h4M12 16v4" />
              </svg>
              Filter Data Booking
            </h2>
            <button onClick={handleResetFilter} className="text-xs font-semibold text-slate-400 hover:text-red-500">
              Reset Filter
            </button>
          </div>

          <div className="mb-4">
            <label className="mb-2 block text-xs font-semibold text-slate-600">Status Booking:</label>
            <div className="flex flex-wrap gap-2">
              {STATUS_BOOKING_OPTIONS.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => setStatusBooking(opt.key)}
                  className={"rounded-full px-4 py-2 text-xs font-semibold transition " + (statusBooking === opt.key ? "bg-blue-600 text-white shadow-sm" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50")}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Pencarian:</label>
              <input
                type="text"
                placeholder="Kode booking / pasien..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-600">Tanggal Dari:</label>
                <div className="flex gap-2 text-[11px] font-semibold text-blue-600">
                  <button onClick={() => handleQuickDate("today")} className="hover:underline">Hari Ini</button>
                  <span className="text-slate-300">|</span>
                  <button onClick={() => handleQuickDate("7days")} className="hover:underline">7 Hari</button>
                </div>
              </div>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Tanggal Sampai:</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Filter Pasien:</label>
              <select
                value={patientFilter}
                onChange={(e) => setPatientFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="all">Semua Pasien</option>
                {patientOptions.map((p) => (
                  <option key={p.id} value={p.id}>{p.nama}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Tenaga Medis (Nakes):</label>
              <select
                value={nakesFilter}
                onChange={(e) => setNakesFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="all">Semua Tenaga Medis</option>
                {nakesOptions.map((n) => (
                  <option key={n.id} value={n.id}>{n.nama}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Bulan:</label>
              <select
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="all">Semua Bulan</option>
                {MONTH_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Tahun:</label>
              <select
                value={yearFilter}
                onChange={(e) => setYearFilter(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="all">Semua Tahun</option>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">ID Rekam Medis:</label>
              <input
                type="text"
                placeholder="Contoh: 16"
                value={rekamMedisId}
                onChange={(e) => setRekamMedisId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-600">Urutan (Sort):</label>
              <div className="flex gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  {SORT_FIELD_OPTIONS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
                <button
                  onClick={() => setSortDir((prev) => (prev === "asc" ? "desc" : "asc"))}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4h13M3 8h9M3 12h5m6-8v16m0 0l-4-4m4 4l4-4" />
                  </svg>
                  {sortDir.toUpperCase()}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Tampilkan:</label>
                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                >
                  <option value={10}>10 per halaman</option>
                  <option value={25}>25 per halaman</option>
                  <option value={50}>50 per halaman</option>
                  <option value={100}>100 per halaman</option>
                </select>
              </div>
              <p className="text-xs text-slate-400">
                Menampilkan {paginatedBookings.length} dari total {filteredBookings.length} booking
              </p>
            </div>
          </div>
        </div>
      )}

      {errorMsg && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{errorMsg}</div>}

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-500">Memuat data booking...</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <th className="w-12 border-b border-slate-200 px-4 py-3 text-center">No.</th>
                  <th className="border-b border-slate-200 px-4 py-3">Kode Booking</th>
                  <th className="border-b border-slate-200 px-4 py-3">Pasien</th>
                  <th className="border-b border-slate-200 px-4 py-3">Nakes</th>
                  <th className="border-b border-slate-200 px-4 py-3">Layanan</th>
                  <th className="border-b border-slate-200 px-4 py-3">Jadwal Kunjungan</th>
                  <th className="border-b border-slate-200 px-4 py-3">Total Bayar</th>
                  <th className="border-b border-slate-200 px-4 py-3">Status Booking</th>
                  <th className="border-b border-slate-200 px-4 py-3">Pembayaran</th>
                  <th className="border-b border-slate-200 px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {paginatedBookings.map((booking, index) => (
                  <tr
                    key={booking.id_booking}
                    onClick={() => navigate("/bookings/" + booking.id_booking)}
                    className="hover:bg-slate-50 transition cursor-pointer"
                  >
                    <td className="border-b border-slate-200 px-4 py-3 text-center text-slate-500">{startIndex + index + 1}</td>
                    <td className="border-b border-slate-200 px-4 py-3 font-semibold text-blue-600">{booking.booking_code || "#" + booking.id_booking}</td>
                    <td className="border-b border-slate-200 px-4 py-3 text-slate-800 font-medium">{booking.pasien?.nama_lengkap || "-"}</td>
                    <td className="border-b border-slate-200 px-4 py-3 text-slate-700">{booking.tenaga_medis?.nama_lengkap || "-"}</td>
                    <td className="border-b border-slate-200 px-4 py-3 text-slate-700">{booking.layanan?.nama_layanan || "-"}</td>
                    <td className="border-b border-slate-200 px-4 py-3 text-slate-700">{formatDate(booking.tanggal_kunjungan)}</td>
                    <td className="border-b border-slate-200 px-4 py-3 font-medium text-slate-900">{formatRupiah(booking.transaksi?.jumlah_total)}</td>
                    <td className="border-b border-slate-200 px-4 py-3">{renderStatusBadge(booking.status_booking)}</td>
                    <td className="border-b border-slate-200 px-4 py-3">{renderPaymentBadge(booking.transaksi?.status_transaksi)}</td>
                    <td className="border-b border-slate-200 px-4 py-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate("/bookings/" + booking.id_booking);
                        }}
                        className="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100"
                      >
                        Detail &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(page) => setCurrentPage(page)} />
        </div>
      )}
    </div>
  );
}

// ==========================================
// FUNCTION 2: HALAMAN DETAIL BOOKING
// ==========================================
export function PageBookingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const availableStatuses = ["Pending", "Di Perjalanan", "Tindakan", "Selesai", "Dibatalkan"];

  async function fetchDetail() {
    try {
      setLoading(true);
      setErrorMsg("");

      const res = await fetch(BASE_URL + "/booking/" + id, {
        headers: getAuthHeaders({ Accept: "application/json" }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Gagal mengambil detail booking");
      }

      setBooking(data.data);
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

      const res = await fetch(BASE_URL + "/booking/" + id + "/status", {
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
      setStatusMessage("Status booking berhasil diperbarui!");
      setTimeout(() => setStatusMessage(""), 4000);
    } catch (err) {
      console.error("Gagal update status", err);
      setErrorMsg(err.message || "Gagal memperbarui status booking");
    } finally {
      setUpdatingStatus(false);
    }
  }

  if (loading) {
    return <div className="p-6 text-sm text-slate-500">Memuat detail booking...</div>;
  }

  if (errorMsg || !booking) {
    return (
      <div className="p-6">
        <button onClick={() => navigate(-1)} className="mb-4 text-sm text-blue-600 hover:underline">
          &larr; Kembali
        </button>
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
          {errorMsg || "Data booking tidak ditemukan."}
        </div>
      </div>
    );
  }

  const mapsHref = "https://maps.google.com/?q=" + booking.latitude_kunjungan + "," + booking.longitude_kunjungan;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate("/booking")}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Kembali ke Daftar Booking
        </button>
        <div className="flex items-center gap-2">
          {renderStatusBadge(booking.status_booking)}
          {renderPaymentBadge(booking.transaksi?.status_transaksi)}
        </div>
      </div>

      {statusMessage && (
        <div className="mb-4 rounded-xl bg-green-50 p-3 text-sm text-green-700 border border-green-200">
          {statusMessage}
        </div>
      )}

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Rincian Transaksi Booking</span>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{booking.booking_code || "#" + booking.id_booking}</h1>
          <p className="mt-1 text-xs text-slate-400">Dibuat pada: {formatDate(booking.created_at)}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex flex-col gap-2">
          <label className="text-xs font-bold uppercase text-slate-600">Ubah Status Booking:</label>
          <div className="flex flex-wrap gap-1.5">
            {availableStatuses.map((st) => {
              const isActive = String(booking.status_booking || "").toLowerCase() === st.toLowerCase();
              return (
                <button
                  key={st}
                  disabled={updatingStatus}
                  onClick={() => handleUpdateStatus(st)}
                  className={"px-3 py-1.5 rounded-lg text-xs font-semibold transition " + (isActive ? "bg-blue-600 text-white shadow" : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-100")}
                >
                  {st}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Informasi Pasien</h3>
              <p className="mt-3 text-base font-bold text-slate-800">{booking.pasien?.nama_lengkap || "-"}</p>
              <div className="mt-2 space-y-1 text-xs text-slate-500">
                <p>No. Telp: <span className="font-medium text-slate-700">{booking.pasien?.no_telp || "-"}</span></p>
                <p>NIK: <span className="font-medium text-slate-700">{booking.pasien?.nik || "-"}</span></p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Tenaga Medis</h3>
              <p className="mt-3 text-base font-bold text-slate-800">{booking.tenaga_medis?.nama_lengkap || "-"}</p>
              <div className="mt-2 space-y-1 text-xs text-slate-500">
                <p>Spesialisasi: <span className="font-medium text-slate-700">{booking.tenaga_medis?.jenis_tenaga_medis || "-"}</span></p>
                <p>STR: <span className="font-medium text-slate-700">{booking.tenaga_medis?.no_str || "-"}</span></p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Jadwal & Lokasi Kunjungan</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-xs text-slate-400 block">Layanan Terpilih</span>
                <span className="font-semibold text-slate-800">{booking.layanan?.nama_layanan || "-"}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Waktu Kunjungan</span>
                <span className="font-semibold text-slate-800">{formatDate(booking.tanggal_kunjungan)} - {booking.jam_kunjungan}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 text-sm">
              <span className="text-xs text-slate-400 block">Alamat Kunjungan</span>
              <p className="mt-1 font-medium text-slate-800">{booking.alamat_kunjungan || "-"}</p>
              {booking.latitude_kunjungan && booking.longitude_kunjungan && (
                <a
                  href={mapsHref}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center text-xs font-semibold text-blue-600 hover:underline"
                >
                  Lihat di Google Maps &rarr;
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {booking.transaksi && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Rincian Pembayaran</h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Tarif Layanan (SL)</span>
                  <span>{formatRupiah(booking.transaksi.sl)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Tarif BHP (SB)</span>
                  <span>{formatRupiah(booking.transaksi.sb)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Biaya Transportasi (ST)</span>
                  <span>{formatRupiah(booking.transaksi.st)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Biaya Administrasi (BA)</span>
                  <span>{formatRupiah(booking.transaksi.ba)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>PPN ({booking.transaksi.persen_ppn || 0}%)</span>
                  <span>{formatRupiah(booking.transaksi.ppn)}</span>
                </div>

                <div className="border-t border-slate-200 pt-3 flex justify-between text-sm font-extrabold text-slate-900">
                  <span>Total Bayar Pasien</span>
                  <span className="text-blue-600">{formatRupiah(booking.transaksi.jumlah_total)}</span>
                </div>

                <div className="mt-4 rounded-xl bg-slate-50 p-3 space-y-1.5 text-[11px] text-slate-500">
                  <div className="flex justify-between">
                    <span>Hak Nakes:</span>
                    <span className="font-semibold text-slate-700">{formatRupiah(booking.transaksi.hak_nakes)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Profit HealthCare:</span>
                    <span className="font-semibold text-green-600">{formatRupiah(booking.transaksi.profit_hc)}</span>
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
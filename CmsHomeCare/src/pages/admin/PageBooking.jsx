import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BASE_URL } from "../../utils/apiClient";
import { getAuthHeaders } from "../../utils/auth";
import Pagination from "../../components/pagination";

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
  // Tambahkan "belum bayar" dan "" (jika transaksi kosong) ke sini
  if (["pending", "menunggu", "waiting", "belum bayar"].includes(rawStatus)) return "pending";
  if (["expire", "failed", "gagal", "deny", "cancel"].includes(rawStatus)) return "gagal";
  return "pending"; // Atau biarkan default ke pending jika tidak masuk kategori lain
}

// ==========================================
// FUNCTION 1: HALAMAN LIST & DASHBOARD
// ==========================================
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

  useEffect(() => {
    async function fetchBookings() {
      try {
        setLoading(true);
        setErrorMsg("");
        const res = await fetch(`${BASE_URL}/admin/bookings`, {
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
    const patientName = String(booking.pasien?.nama_lengkap || "").toLowerCase();
    const query = searchQuery.toLowerCase().trim();

    return matchesCategory && (query === "" || bookingCode.includes(query) || patientName.includes(query));
  });

  const totalPages = Math.ceil(filteredBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedBookings = filteredBookings.slice(startIndex, startIndex + itemsPerPage);

  const totalLunasAmount = bookings
    .filter((b) => getNormalizedPaymentStatus(b) === "lunas")
    .reduce((sum, b) => sum + Number(b.transaksi?.jumlah_total || 0), 0);

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
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard & Manajemen Booking</h1>
        <p className="text-sm text-slate-500">Monitor status kunjungan, transaksi pembayaran, dan detail riwayat pasien.</p>
      </div>

      {/* Stats Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Total Omzet Lunas</p>
          <h3 className="mt-2 text-2xl font-extrabold text-green-600">{formatRupiah(totalLunasAmount)}</h3>
          <p className="mt-1 text-xs text-slate-400">Dari {counts.lunas} transaksi lunas</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Total Booking Masuk</p>
          <h3 className="mt-2 text-2xl font-extrabold text-slate-800">{counts.all}</h3>
          <p className="mt-1 text-xs text-slate-400">Seluruh booking terdaftar</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Sedang Tindakan / Jalan</p>
          <h3 className="mt-2 text-2xl font-extrabold text-purple-600">{counts.tindakan + counts.diperjalanan}</h3>
          <p className="mt-1 text-xs text-slate-400">Proses kunjungan aktif</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase text-slate-500">Booking Selesai</p>
          <h3 className="mt-2 text-2xl font-extrabold text-green-600">{counts.selesai}</h3>
          <p className="mt-1 text-xs text-slate-400">Kunjungan sukses</p>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Cari kode booking / pasien..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2 pl-9 pr-8 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
          <svg className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>

        <div className="flex flex-wrap gap-2">
          {filterOptions.map((option) => (
            <button
              key={option.key}
              onClick={() => setActiveFilter(option.key)}
              className={`inline-flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-medium transition ${
                activeFilter === option.key ? "bg-blue-600 text-white shadow-sm" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <span>{option.label}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${activeFilter === option.key ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-600"}`}>
                {option.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {errorMsg && <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">{errorMsg}</div>}

      {/* Table */}
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
                    onClick={() => navigate(`/admin/bookings/${booking.id_booking}`)}
                    className="hover:bg-slate-50 transition cursor-pointer"
                  >
                    <td className="border-b border-slate-200 px-4 py-3 text-center text-slate-500">{startIndex + index + 1}</td>
                    <td className="border-b border-slate-200 px-4 py-3 font-semibold text-blue-600">{booking.booking_code || `#${booking.id_booking}`}</td>
                    <td className="border-b border-slate-200 px-4 py-3 text-slate-800 font-medium">{booking.pasien?.nama_lengkap || "-"}</td>
                    <td className="border-b border-slate-200 px-4 py-3 text-slate-700">{booking.tenaga_medis?.nama_lengkap || "-"}</td>
                    <td className="border-b border-slate-200 px-4 py-3 text-slate-700">{booking.layanan?.nama_layanan || "-"}</td>
                    <td className="border-b border-slate-200 px-4 py-3 font-medium text-slate-900">{formatRupiah(booking.transaksi?.jumlah_total)}</td>
                    <td className="border-b border-slate-200 px-4 py-3">{renderStatusBadge(booking.status_booking)}</td>
                    <td className="border-b border-slate-200 px-4 py-3">{renderPaymentBadge(booking.transaksi?.status_transaksi)}</td>
                    <td className="border-b border-slate-200 px-4 py-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/bookings/${booking.id_booking}`);
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

  const availableStatuses = [
    "Pending",
    "Di Perjalanan",
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

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate("/admin/bookings")}
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
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{booking.booking_code || `#${booking.id_booking}`}</h1>
          <p className="mt-1 text-xs text-slate-400">Dibuat pada: {formatDate(booking.created_at)}</p>
        </div>

        {/* Panel Update Status Booking */}
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
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    isActive
                      ? "bg-blue-600 text-white shadow"
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
                  href={`https://maps.google.com/?q=${booking.latitude_kunjungan},${booking.longitude_kunjungan}`}
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
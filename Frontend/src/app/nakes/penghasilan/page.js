"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  getRingkasanPenghasilanNakes,
  getRiwayatPenghasilanNakes,
  getSaldoNakes,
  requestWithdrawNakes,
} from "@/services/nakesService";
import RiwayatPenarikan from "./components/RiwayatPenarikan";

const PER_PAGE = 15;
const DAY_MS = 24 * 60 * 60 * 1000;

// =====================================================
// HELPERS
// =====================================================

function formatRupiah(value) {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "—";
  }

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format nominal input menggunakan titik pemisah ribuan.
// Contoh: 847350 menjadi 847.350.
function formatNominalInput(value) {
  const digits = String(value ?? "").replace(/\D/g, "");

  if (!digits) return "";

  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Mengubah nominal berformat 847.350 menjadi angka 847350.
function parseNominalInput(value) {
  const digits = String(value ?? "").replace(/\D/g, "");

  return digits ? Number(digits) : 0;
}

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatTanggal(value) {
  if (!value) return "Tanggal tidak tersedia";

  const parts = String(value).slice(0, 10).split("-");

  if (parts.length !== 3) return String(value);

  const [year, month, day] = parts;

  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day)
  );

  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function getRows(response) {
  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  throw new Error("Data riwayat tidak dapat dibaca.");
}

function getPagination(response, currentPage, rowsLength) {
  const meta =
    response?.pagination ||
    response?.data?.pagination ||
    response?.meta ||
    response?.data?.meta ||
    {};

  const total = Number(meta.total ?? rowsLength) || 0;

  const perPage = Number(meta.per_page ?? PER_PAGE) || PER_PAGE;

  const totalPages = Math.max(
    1,
    Number(meta.total_pages ?? Math.ceil(total / perPage)) || 1
  );

  const actualPage =
    Number(meta.current_page ?? currentPage) || currentPage;

  return {
    total,
    current_page: actualPage,
    total_pages: totalPages,
    has_more_pages: Boolean(
      meta.has_more_pages ?? actualPage < totalPages
    ),
  };
}

function getBookingCode(item) {
  return (
    item?.booking_code ||
    item?.booking?.booking_code ||
    item?.kode_booking ||
    item?.code_booking ||
    ""
  );
}

function getServiceName(item) {
  const services = Array.isArray(item?.layanan)
    ? item.layanan
    : [];

  if (services.length > 0) {
    return services
      .map((service) =>
        typeof service === "string"
          ? service
          : service?.nama_layanan || service?.name
      )
      .filter(Boolean)
      .join(", ");
  }

  const fallback =
    item?.booking?.layanan_items ||
    item?.layanan_items ||
    [];

  if (Array.isArray(fallback)) {
    const names = fallback
      .map(
        (service) =>
          service?.nama_layanan || service?.name
      )
      .filter(Boolean);

    if (names.length > 0) return names.join(", ");
  }

  return item?.nama_layanan || item?.layanan_nama || "";
}

function getIncomeValue(item) {
  const value =
    item?.penghasilan_bersih ??
    item?.rincian_penghasilan?.penghasilan_bersih ??
    item?.total_bersih;

  if (value === null || value === undefined || value === "") {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

// =====================================================
// SMALL COMPONENTS
// =====================================================

function SummaryCard({ title, amount, bookings, period }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <p className="text-xs font-medium text-slate-500">
        {title}
      </p>

      <p className="mt-2 break-words text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
        {amount}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-500">
          {bookings} booking
        </span>

        {period ? (
          <span className="text-xs text-slate-400">
            · {period}
          </span>
        ) : null}
      </div>
    </article>
  );
}

function LoadingCard() {
  return (
    <div className="h-28 animate-pulse rounded-2xl bg-slate-200/70" />
  );
}

function StatusBadge({ status }) {
  const value = String(status || "").toLowerCase();

  const className = value.includes("selesai")
    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
    : value.includes("batal") || value.includes("refund")
      ? "border-rose-200 bg-rose-50 text-rose-700"
      : "border-blue-200 bg-blue-50 text-blue-700";

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${className}`}
    >
      {status || "Lunas"}
    </span>
  );
}

// =====================================================
// MAIN PAGE
// =====================================================

export default function PenghasilanNakesPage() {
  // RINGKASAN
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [summaryError, setSummaryError] = useState("");

  // SALDO
  const [saldoData, setSaldoData] = useState(null);
  const [saldoLoading, setSaldoLoading] = useState(true);

  // TAB KEUANGAN
  const [activeTab, setActiveTab] = useState("income");
  const [withdrawRefreshKey, setWithdrawRefreshKey] = useState(0);

  // RIWAYAT PENGHASILAN
  const [rows, setRows] = useState([]);

  const [pagination, setPagination] = useState({
    total: 0,
    current_page: 1,
    total_pages: 1,
    has_more_pages: false,
  });

  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  // FILTER TANGGAL
  const today = toDateInputValue(new Date());

  const earliestDate = toDateInputValue(
    new Date(Date.now() - DAY_MS * 90)
  );

  const [dateFromInput, setDateFromInput] = useState("");
  const [dateToInput, setDateToInput] = useState("");

  const [filters, setFilters] = useState({
    tanggal_dari: "",
    tanggal_sampai: "",
  });

  const [filterError, setFilterError] = useState("");

  // WITHDRAW
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawSuccessData, setWithdrawSuccessData] = useState(null);

  // =====================================================
  // FETCH SALDO
  // =====================================================

  const fetchSaldo = useCallback(async () => {
    setSaldoLoading(true);

    try {
      const response = await getSaldoNakes();

      setSaldoData(response?.data ?? response);
    } catch (error) {
      console.error("Gagal memuat saldo:", error);
    } finally {
      setSaldoLoading(false);
    }
  }, []);

  // =====================================================
  // FETCH RINGKASAN
  // =====================================================

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    setSummaryError("");

    try {
      const response = await getRingkasanPenghasilanNakes();

      if (!response?.data || typeof response.data !== "object") {
        throw new Error("Ringkasan penghasilan belum dapat ditampilkan.");
      }

      setSummary(response.data);
    } catch (error) {
      setSummary(null);

      setSummaryError(
        getErrorMessage(
          error,
          "Ringkasan penghasilan gagal dimuat."
        )
      );
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  // =====================================================
  // FETCH RIWAYAT PENGHASILAN
  // =====================================================

  const fetchHistory = useCallback(async () => {
    setListLoading(true);
    setListError("");

    const params = {
      page: currentPage,
      per_page: PER_PAGE,
    };

    if (filters.tanggal_dari) {
      params.tanggal_dari = filters.tanggal_dari;
    }

    if (filters.tanggal_sampai) {
      params.tanggal_sampai = filters.tanggal_sampai;
    }

    try {
      const response = await getRiwayatPenghasilanNakes(params);

      const dataRows = getRows(response);

      setRows(dataRows);

      setPagination(
        getPagination(
          response,
          currentPage,
          dataRows.length
        )
      );
    } catch (error) {
      setRows([]);

      setPagination({
        total: 0,
        current_page: 1,
        total_pages: 1,
        has_more_pages: false,
      });

      setListError(
        getErrorMessage(
          error,
          "Riwayat penghasilan gagal dimuat."
        )
      );
    } finally {
      setListLoading(false);
    }
  }, [currentPage, filters]);

  useEffect(() => {
    fetchSaldo();
    fetchSummary();
  }, [fetchSaldo, fetchSummary]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // =====================================================
  // SALDO & VALIDASI WITHDRAW
  // =====================================================

  const currentSaldo = Number(
    saldoData?.saldo ??
      saldoData?.total_saldo ??
      saldoData?.nominal ??
      saldoData?.amount ??
      0
  );

  const minimumWithdraw = Number(
    saldoData?.minimum_withdraw ?? 50000
  );

  const canWithdraw =
    saldoData?.bisa_withdraw !== false &&
    currentSaldo >= minimumWithdraw;

  // Nominal hasil input setelah menghapus pemisah titik.
  const withdrawNominal = parseNominalInput(withdrawAmount);

  // =====================================================
  // WITHDRAW ACTIONS
  // =====================================================

  function openWithdrawModal() {
    if (!canWithdraw) {
      alert(
        `Saldo belum mencukupi. Minimal penarikan ${
          saldoData?.minimum_withdraw_format ||
          formatRupiah(minimumWithdraw)
        }.`
      );

      return;
    }

    setWithdrawAmount(formatNominalInput(currentSaldo));
    setWithdrawSuccessData(null);
    setIsWithdrawModalOpen(true);
  }

  function closeWithdrawModal() {
    setIsWithdrawModalOpen(false);
    setWithdrawSuccessData(null);
  }

  async function submitWithdraw(event) {
    event.preventDefault();

    const nominal = parseNominalInput(withdrawAmount);

    if (!Number.isSafeInteger(nominal) || nominal < minimumWithdraw) {
      alert(
        `Minimal penarikan adalah ${formatRupiah(minimumWithdraw)}.`
      );

      return;
    }

    if (nominal > currentSaldo) {
      alert("Nominal penarikan melebihi saldo tersedia.");
      return;
    }

    try {
      setWithdrawLoading(true);

      const response = await requestWithdrawNakes({
        jumlah: nominal,
      });

      if (response?.success === false) {
        throw new Error(
          response?.message || "Penarikan gagal diproses."
        );
      }

      const successData = response?.data ?? response;

      setWithdrawSuccessData(successData);

      // Setelah berhasil, buka tab penarikan.
      setActiveTab("withdrawal");

      // Refresh daftar penarikan.
      setWithdrawRefreshKey((value) => value + 1);

      // Ambil saldo terbaru dari backend.
      await fetchSaldo();
    } catch (error) {
      alert(
        getErrorMessage(
          error,
          "Gagal melakukan penarikan saldo."
        )
      );
    } finally {
      setWithdrawLoading(false);
    }
  }

  // =====================================================
  // FILTER TANGGAL PENGHASILAN
  // =====================================================

  function applyFilter(event) {
    event.preventDefault();
    setFilterError("");

    if (
      dateFromInput &&
      dateToInput &&
      dateFromInput > dateToInput
    ) {
      setFilterError(
        "Tanggal awal tidak boleh melewati tanggal akhir."
      );
      return;
    }

    if (dateFromInput && dateFromInput > today) {
      setFilterError("Tanggal awal tidak boleh melebihi hari ini.");
      return;
    }

    if (dateToInput && dateToInput > today) {
      setFilterError("Tanggal akhir tidak boleh melebihi hari ini.");
      return;
    }

    if (
      (dateFromInput && dateFromInput < earliestDate) ||
      (dateToInput && dateToInput < earliestDate)
    ) {
      setFilterError(
        "Riwayat yang tersedia hanya mencakup 90 hari terakhir."
      );
      return;
    }

    setCurrentPage(1);

    setFilters({
      tanggal_dari: dateFromInput,
      tanggal_sampai: dateToInput,
    });
  }

  function resetFilter() {
    setDateFromInput("");
    setDateToInput("");
    setFilterError("");
    setCurrentPage(1);

    setFilters({
      tanggal_dari: "",
      tanggal_sampai: "",
    });
  }

  // DATA RINGKASAN
  const harian = summary?.harian;
  const mingguan = summary?.mingguan;
  const bulanan = summary?.bulanan;

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <main className="mx-auto max-w-7xl space-y-6 px-4 py-5 sm:px-6 lg:px-8">

        {/* JUDUL HALAMAN */}
        <section>
          <p className="text-xs font-semibold uppercase tracking-wider text-blue-600">
            Portal Tenaga Medis
          </p>

          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
            Keuangan Saya
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Kelola saldo, lihat penghasilan, dan pantau penarikan Anda.
          </p>
        </section>

        {/* SALDO TERSEDIA */}
        <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 p-5 text-white shadow-sm sm:p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-blue-100">
                Saldo tersedia
              </p>

              <p className="mt-2 text-3xl font-bold tracking-tight">
                {saldoLoading
                  ? "Memuat..."
                  : saldoData?.saldo_format || formatRupiah(currentSaldo)}
              </p>

              <p className="mt-2 text-xs text-blue-100">
                Minimal penarikan{" "}
                {saldoData?.minimum_withdraw_format ||
                  formatRupiah(minimumWithdraw)}
              </p>
            </div>

            <button
              type="button"
              onClick={openWithdrawModal}
              disabled={saldoLoading || !canWithdraw}
              className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-blue-700 shadow-sm transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Tarik saldo
            </button>
          </div>

          {saldoData?.rekening ? (
            <div className="mt-5 border-t border-white/20 pt-4">
              <p className="text-xs text-blue-100">
                Rekening terdaftar
              </p>

              <p className="mt-1 text-sm font-semibold">
                {saldoData.rekening.nama_bank}
                {saldoData.rekening.no_rekening
                  ? ` · ${saldoData.rekening.no_rekening}`
                  : ""}
              </p>

              <p className="mt-0.5 text-xs text-blue-100">
                a.n. {saldoData.rekening.nama_pemilik || "—"}
              </p>
            </div>
          ) : null}
        </section>

        {/* RINGKASAN PENGHASILAN */}
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Ringkasan penghasilan
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Gambaran penghasilan dari aktivitas layanan Anda.
            </p>
          </div>

          {summaryLoading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <LoadingCard />
              <LoadingCard />
              <LoadingCard />
            </div>
          ) : summaryError ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
              <p className="text-sm text-rose-700">
                {summaryError}
              </p>

              <button
                type="button"
                onClick={fetchSummary}
                className="mt-3 text-sm font-semibold text-blue-700 hover:underline"
              >
                Coba lagi
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <SummaryCard
                title="Hari ini"
                amount={
                  harian?.total_bersih_format ||
                  formatRupiah(harian?.total_bersih)
                }
                bookings={Number(
                  harian?.jumlah_booking ?? 0
                ).toLocaleString("id-ID")}
                period={harian?.label || ""}
              />

              <SummaryCard
                title="Minggu ini"
                amount={
                  mingguan?.total_bersih_format ||
                  formatRupiah(mingguan?.total_bersih)
                }
                bookings={Number(
                  mingguan?.jumlah_booking ?? 0
                ).toLocaleString("id-ID")}
                period={
                  mingguan?.label ||
                  (mingguan?.dari && mingguan?.sampai
                    ? `${formatTanggal(mingguan.dari)} – ${formatTanggal(
                        mingguan.sampai
                      )}`
                    : "")
                }
              />

              <SummaryCard
                title="Bulan ini"
                amount={
                  bulanan?.total_bersih_format ||
                  formatRupiah(bulanan?.total_bersih)
                }
                bookings={Number(
                  bulanan?.jumlah_booking ?? 0
                ).toLocaleString("id-ID")}
                period={bulanan?.label || ""}
              />
            </div>
          )}
        </section>

        {/* AKTIVITAS KEUANGAN */}
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Aktivitas keuangan
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Lihat pemasukan dan transaksi penarikan saldo.
            </p>
          </div>

          {/* TAB */}
          <div className="grid grid-cols-2 rounded-xl border border-slate-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setActiveTab("income")}
              aria-pressed={activeTab === "income"}
              className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === "income"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Penghasilan
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("withdrawal")}
              aria-pressed={activeTab === "withdrawal"}
              className={`rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === "withdrawal"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              Penarikan
            </button>
          </div>

          {/* TAB PENGHASILAN */}
          {activeTab === "income" ? (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Riwayat penghasilan
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Pilih rentang tanggal untuk mencari transaksi.
                </p>
              </div>

              {/* FILTER TANGGAL */}
              <form
                onSubmit={applyFilter}
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="space-y-1.5">
                    <span className="block text-xs font-semibold text-slate-600">
                      Tanggal dari
                    </span>

                    <input
                      type="date"
                      value={dateFromInput}
                      min={earliestDate}
                      max={today}
                      onChange={(event) =>
                        setDateFromInput(event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </label>

                  <label className="space-y-1.5">
                    <span className="block text-xs font-semibold text-slate-600">
                      Tanggal sampai
                    </span>

                    <input
                      type="date"
                      value={dateToInput}
                      min={earliestDate}
                      max={today}
                      onChange={(event) =>
                        setDateToInput(event.target.value)
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                    />
                  </label>
                </div>

                {filterError ? (
                  <p
                    role="alert"
                    className="mt-3 text-xs text-rose-600"
                  >
                    {filterError}
                  </p>
                ) : null}

                <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={resetFilter}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Reset
                  </button>

                  <button
                    type="submit"
                    className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Terapkan filter
                  </button>
                </div>
              </form>

              {/* JUMLAH TRANSAKSI */}
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-slate-500">
                  {listLoading
                    ? "Memuat riwayat..."
                    : `${pagination.total.toLocaleString("id-ID")} transaksi`}
                </p>

                <span className="text-xs text-slate-400">
                  Maksimal 90 hari terakhir
                </span>
              </div>

              {/* LOADING */}
              {listLoading ? (
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <LoadingCard />
                  <LoadingCard />
                </div>
              ) : listError ? (
                <div className="rounded-2xl border border-rose-200 bg-white p-6 text-center">
                  <p className="text-sm text-rose-600">
                    {listError}
                  </p>

                  <button
                    type="button"
                    onClick={fetchHistory}
                    className="mt-3 text-sm font-semibold text-blue-700 hover:underline"
                  >
                    Coba lagi
                  </button>
                </div>
              ) : rows.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center">
                  <h4 className="text-sm font-semibold text-slate-800">
                    Belum ada riwayat penghasilan
                  </h4>

                  <p className="mt-1 text-sm text-slate-500">
                    Transaksi penghasilan akan muncul di sini.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  {rows.map((item, index) => {
                    const bookingCode = getBookingCode(item);
                    const income = getIncomeValue(item);
                    const serviceName = getServiceName(item);

                    const recordDate =
                      item?.waktu_bayar ||
                      item?.tanggal_bayar ||
                      item?.tanggal_kunjungan ||
                      item?.booking?.tanggal_kunjungan;

                    const amountFormat =
                      item?.penghasilan_bersih_format ||
                      item?.rincian_penghasilan
                        ?.penghasilan_bersih_format ||
                      (income !== null
                        ? formatRupiah(income)
                        : "Nominal tidak tersedia");

                    return (
                      <article
                        key={
                          bookingCode ||
                          item?.id_booking ||
                          `${index}-${recordDate || "record"}`
                        }
                        className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h4 className="break-words text-sm font-bold text-slate-900">
                              {serviceName || "Layanan"}
                            </h4>

                            {bookingCode ? (
                              <p className="mt-1 break-all font-mono text-[11px] text-slate-400">
                                {bookingCode}
                              </p>
                            ) : null}

                            <p className="mt-2 text-xs text-slate-500">
                              {formatTanggal(recordDate)}
                            </p>
                          </div>

                          <StatusBadge
                            status={
                              item?.status_booking ||
                              item?.status ||
                              "Lunas"
                            }
                          />
                        </div>

                        <div className="mt-4 flex items-end justify-between gap-3 border-t border-slate-100 pt-3">
                          <div>
                            <p className="text-xs text-slate-500">
                              Penghasilan bersih
                            </p>

                            <p className="mt-1 text-base font-bold text-slate-900">
                              {amountFormat}
                            </p>
                          </div>

                          {bookingCode ? (
                            <Link
                              href={`/nakes/penghasilan/detail?booking_code=${encodeURIComponent(
                                bookingCode
                              )}`}
                              className="shrink-0 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                            >
                              Lihat detail
                            </Link>
                          ) : null}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              {/* PAGINATION */}
              {!listLoading && !listError && rows.length > 0 ? (
                <nav
                  aria-label="Halaman riwayat penghasilan"
                  className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <p className="text-xs text-slate-500">
                    Halaman {pagination.current_page} dari{" "}
                    {pagination.total_pages}
                  </p>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={currentPage <= 1}
                      onClick={() =>
                        setCurrentPage((page) =>
                          Math.max(1, page - 1)
                        )
                      }
                      className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 sm:flex-none"
                    >
                      Sebelumnya
                    </button>

                    <button
                      type="button"
                      disabled={
                        currentPage >= pagination.total_pages ||
                        !pagination.has_more_pages
                      }
                      onClick={() =>
                        setCurrentPage((page) => page + 1)
                      }
                      className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 sm:flex-none"
                    >
                      Berikutnya
                    </button>
                  </div>
                </nav>
              ) : null}
            </div>
          ) : (
            <RiwayatPenarikan refreshKey={withdrawRefreshKey} />
          )}
        </section>
      </main>

      {/* =====================================================
          MODAL TARIK SALDO
      ===================================================== */}

      {isWithdrawModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6">

            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {withdrawSuccessData
                  ? "Penarikan berhasil"
                  : "Tarik saldo"}
              </h3>

              <button
                type="button"
                onClick={closeWithdrawModal}
                aria-label="Tutup"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            {/* STRUK PENARIKAN */}
            {withdrawSuccessData ? (
              <div className="space-y-4 pt-5 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-8 w-8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="m4.5 12.75 6 6 9-13.5"
                    />
                  </svg>
                </div>

                <div>
                  <p className="text-sm font-semibold text-emerald-700">
                    {withdrawSuccessData.status_label || "Berhasil"}
                  </p>

                  <p className="mt-2 text-2xl font-bold text-slate-900">
                    {withdrawSuccessData.jumlah_format ||
                      formatRupiah(withdrawSuccessData.jumlah)}
                  </p>

                  <p className="mt-1 break-all font-mono text-xs text-slate-500">
                    {withdrawSuccessData.reference_no || "—"}
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left text-sm">
                  <p className="text-xs text-slate-500">
                    Rekening tujuan
                  </p>

                  <p className="mt-1 font-semibold text-slate-900">
                    {withdrawSuccessData.rekening_tujuan?.nama_bank ||
                      saldoData?.rekening?.nama_bank ||
                      "—"}
                  </p>

                  <p className="text-xs text-slate-600">
                    {withdrawSuccessData.rekening_tujuan?.no_rekening ||
                      saldoData?.rekening?.no_rekening ||
                      "—"}
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    a.n.{" "}
                    {withdrawSuccessData.rekening_tujuan?.nama_pemilik ||
                      saldoData?.rekening?.nama_pemilik ||
                      "—"}
                  </p>

                  <p className="mt-3 text-xs text-slate-500">
                    {withdrawSuccessData.processed_at
                      ? formatTanggal(withdrawSuccessData.processed_at)
                      : ""}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeWithdrawModal}
                  className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Selesai
                </button>
              </div>
            ) : (
              /* FORM PENARIKAN */
              <form
                onSubmit={submitWithdraw}
                className="space-y-4 pt-5"
              >
                <div className="rounded-xl bg-blue-50 p-4">
                  <p className="text-xs text-blue-700">
                    Saldo tersedia
                  </p>

                  <p className="mt-1 text-xl font-bold text-blue-900">
                    {saldoData?.saldo_format ||
                      formatRupiah(currentSaldo)}
                  </p>
                </div>

                {saldoData?.rekening ? (
                  <div className="rounded-xl border border-slate-200 p-4 text-sm">
                    <p className="text-xs text-slate-500">
                      Rekening tujuan
                    </p>

                    <p className="mt-1 font-semibold text-slate-900">
                      {saldoData.rekening.nama_bank}
                    </p>

                    <p className="text-xs text-slate-600">
                      {saldoData.rekening.no_rekening}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      a.n. {saldoData.rekening.nama_pemilik}
                    </p>
                  </div>
                ) : null}

                {/* INPUT NOMINAL */}
                <label className="block space-y-1.5">
                  <span className="text-xs font-semibold text-slate-700">
                    Nominal penarikan
                  </span>

                  <div className="flex items-center rounded-xl border border-slate-200 bg-white px-3.5 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100">
                    <span className="mr-2 text-sm font-semibold text-slate-500">
                      Rp
                    </span>

                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      value={withdrawAmount}
                      onChange={(event) =>
                        setWithdrawAmount(
                          formatNominalInput(event.target.value)
                        )
                      }
                      placeholder="Masukkan nominal"
                      className="w-full min-w-0 bg-transparent py-3 text-base font-semibold text-slate-900 outline-none"
                    />
                  </div>

                  <span className="block text-xs text-slate-500">
                    Minimal penarikan {formatRupiah(minimumWithdraw)}
                  </span>
                </label>

                <div className="flex flex-col-reverse gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={closeWithdrawModal}
                    className="w-full rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    disabled={
                      withdrawLoading ||
                      !withdrawAmount ||
                      !Number.isSafeInteger(withdrawNominal) ||
                      withdrawNominal < minimumWithdraw ||
                      withdrawNominal > currentSaldo
                    }
                    className="w-full rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {withdrawLoading
                      ? "Memproses..."
                      : "Konfirmasi penarikan"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
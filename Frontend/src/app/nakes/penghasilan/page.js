"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import {
  getRingkasanPenghasilanNakes,
  getRiwayatPenghasilanNakes,
} from "@/services/nakesService";

const PER_PAGE = 15;
const DAY_MS = 24 * 60 * 60 * 1000;

function formatRupiah(value) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
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

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");
  const day = String(date.getDate()).padStart(
    2,
    "0"
  );

  return `${year}-${month}-${day}`;
}

function formatTanggal(value) {
  if (!value) {
    return "Tanggal tidak tersedia";
  }

  const parts = String(value)
    .slice(0, 10)
    .split("-");

  if (parts.length !== 3) {
    return String(value);
  }

  const [year, month, day] = parts;

  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day)
  );

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getRows(response) {
  // Bentuk respons sesuai dokumentasi API:
  // { success: true, data: [...], pagination: {...} }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  // Mendukung respons yang membungkus data satu tingkat.
  if (
    Array.isArray(response?.data?.data)
  ) {
    return response.data.data;
  }

  throw new Error(
    "Format data riwayat dari API tidak sesuai dokumentasi."
  );
}

function getPagination(
  response,
  currentPage,
  rowsLength
) {
  const meta =
    response?.pagination ||
    response?.data?.pagination ||
    response?.meta ||
    response?.data?.meta ||
    {};

  const total =
    Number(meta.total ?? rowsLength) || 0;

  const perPage =
    Number(meta.per_page ?? PER_PAGE) ||
    PER_PAGE;

  const totalPages = Math.max(
    1,
    Number(
      meta.total_pages ??
        Math.ceil(total / perPage)
    ) || 1
  );

  const actualPage =
    Number(
      meta.current_page ?? currentPage
    ) || currentPage;

  return {
    total,
    per_page: perPage,
    current_page: actualPage,
    total_pages: totalPages,
    has_more_pages: Boolean(
      meta.has_more_pages ??
        actualPage < totalPages
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
  const services =
    Array.isArray(item?.layanan)
      ? item.layanan
      : [];

  if (services.length > 0) {
    return services
      .map((service) =>
        typeof service === "string"
          ? service
          : service?.nama_layanan ||
            service?.name
      )
      .filter(Boolean)
      .join(", ");
  }

  const bookingServices =
    item?.booking?.layanan_items ||
    item?.layanan_items ||
    [];

  if (Array.isArray(bookingServices)) {
    const names = bookingServices
      .map(
        (service) =>
          service?.nama_layanan ||
          service?.name
      )
      .filter(Boolean);

    if (names.length > 0) {
      return names.join(", ");
    }
  }

  return (
    item?.nama_layanan ||
    item?.layanan_nama ||
    ""
  );
}

function getIncomeValue(item) {
  const value =
    item?.penghasilan_bersih ??
    item?.rincian_penghasilan
      ?.penghasilan_bersih ??
    item?.total_bersih;

  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number)
    ? number
    : null;
}

function getStatus(item) {
  return (
    item?.status_booking ||
    item?.status ||
    item?.booking?.status_booking ||
    "Lunas"
  );
}

function getStatusStyle(status) {
  const value = String(
    status || ""
  ).toLowerCase();

  if (value.includes("selesai")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (
    value.includes("batal") ||
    value.includes("refund")
  ) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (
    value.includes("lunas") ||
    value.includes("paid")
  ) {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

function SummaryCard({
  title,
  amount,
  bookings,
  period,
  featured = false,
}) {
  return (
    <section
      className={`rounded-2xl border p-4 sm:p-5 ${
        featured
          ? "border-blue-100 bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-100"
          : "border-slate-200 bg-white text-slate-900 shadow-sm"
      }`}
    >
      <p
        className={`text-xs font-medium sm:text-sm ${
          featured
            ? "text-blue-100"
            : "text-slate-500"
        }`}
      >
        {title}
      </p>

      <p className="mt-2 break-words text-2xl font-bold tracking-tight sm:text-3xl">
        {amount}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span
          className={`text-xs ${
            featured
              ? "text-blue-100"
              : "text-slate-500"
          }`}
        >
          {bookings} booking
        </span>

        {period ? (
          <span
            className={`text-xs ${
              featured
                ? "text-blue-100"
                : "text-slate-400"
            }`}
          >
            · {period}
          </span>
        ) : null}
      </div>
    </section>
  );
}

function LoadingCard() {
  return (
    <div className="h-32 animate-pulse rounded-2xl bg-slate-200/70" />
  );
}

export default function PenghasilanNakesPage() {
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] =
    useState(true);
  const [summaryError, setSummaryError] =
    useState("");

  const [rows, setRows] = useState([]);
  const [pagination, setPagination] =
    useState({
      total: 0,
      per_page: PER_PAGE,
      current_page: 1,
      total_pages: 1,
      has_more_pages: false,
    });

  const [listLoading, setListLoading] =
    useState(true);
  const [listError, setListError] =
    useState("");
  const [currentPage, setCurrentPage] =
    useState(1);

  const today = toDateInputValue(
    new Date()
  );

  const earliestDate = toDateInputValue(
    new Date(
      Date.now() - DAY_MS * 90
    )
  );

  const [dateFromInput, setDateFromInput] =
    useState("");
  const [dateToInput, setDateToInput] =
    useState("");

  const [filters, setFilters] = useState({
    tanggal_dari: "",
    tanggal_sampai: "",
  });

  const [filterError, setFilterError] =
    useState("");

  // Ringkasan hanya diambil dari API.
  const fetchSummary = useCallback(
    async () => {
      setSummaryLoading(true);
      setSummaryError("");

      try {
        const response =
          await getRingkasanPenghasilanNakes();

        const data = response?.data;

        if (
          !data ||
          typeof data !== "object"
        ) {
          throw new Error(
            "Format ringkasan penghasilan tidak sesuai."
          );
        }

        setSummary(data);
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
    },
    []
  );

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Riwayat selalu mengambil data dari API.
  const fetchHistory = useCallback(
    async () => {
      setListLoading(true);
      setListError("");

      const params = {
        page: currentPage,
        per_page: PER_PAGE,
      };

      if (filters.tanggal_dari) {
        params.tanggal_dari =
          filters.tanggal_dari;
      }

      if (filters.tanggal_sampai) {
        params.tanggal_sampai =
          filters.tanggal_sampai;
      }

      try {
        const response =
          await getRiwayatPenghasilanNakes(
            params
          );

        const dataRows =
          getRows(response);

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
          per_page: PER_PAGE,
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
    },
    [currentPage, filters]
  );

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

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

    if (
      dateFromInput &&
      dateFromInput > today
    ) {
      setFilterError(
        "Tanggal awal tidak boleh melebihi hari ini."
      );
      return;
    }

    if (
      dateToInput &&
      dateToInput > today
    ) {
      setFilterError(
        "Tanggal akhir tidak boleh melebihi hari ini."
      );
      return;
    }

    if (
      dateFromInput &&
      dateFromInput < earliestDate
    ) {
      setFilterError(
        "Data hanya tersedia untuk 90 hari terakhir."
      );
      return;
    }

    if (
      dateToInput &&
      dateToInput < earliestDate
    ) {
      setFilterError(
        "Data hanya tersedia untuk 90 hari terakhir."
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

  const harian = summary?.harian;
  const mingguan = summary?.mingguan;
  const bulanan = summary?.bulanan;

  return (
    <div className="min-h-screen bg-slate-50/70 pb-24">
      <header className="relative mx-auto overflow-hidden rounded-b-3xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 pb-7 pt-6 text-white shadow-md sm:mx-6 sm:mt-6 sm:rounded-2xl sm:px-6 lg:mx-auto lg:max-w-7xl lg:px-8">
        <div className="relative z-10 max-w-7xl space-y-1">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-200 sm:text-xs">
            Portal Tenaga Medis
          </span>

          <h1 className="text-xl font-bold sm:text-2xl">
            Penghasilan Saya
          </h1>

          <p className="max-w-xl text-xs leading-relaxed text-blue-100 sm:text-sm">
            Pantau penghasilan bersih dari kunjungan Anda.
          </p>
        </div>

        <div className="pointer-events-none absolute -bottom-10 -right-7 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      </header>

      <main className="mx-auto mt-5 max-w-7xl space-y-6 px-4 sm:px-6 lg:px-8">
        {/* RINGKASAN */}
        <section className="space-y-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">
              Ringkasan Penghasilan
            </h2>

            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Rekap berdasarkan waktu pembayaran.
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
                className="mt-3 rounded-lg bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Coba Lagi
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <SummaryCard
                title="Bulan Ini"
                amount={
                  bulanan?.total_bersih_format ||
                  formatRupiah(
                    bulanan?.total_bersih
                  )
                }
                bookings={Number(
                  bulanan?.jumlah_booking ?? 0
                ).toLocaleString("id-ID")}
                period={
                  bulanan?.label ||
                  bulanan?.bulan ||
                  ""
                }
                featured
              />

              <SummaryCard
                title="Hari Ini"
                amount={
                  harian?.total_bersih_format ||
                  formatRupiah(
                    harian?.total_bersih
                  )
                }
                bookings={Number(
                  harian?.jumlah_booking ?? 0
                ).toLocaleString("id-ID")}
                period={
                  harian?.label ||
                  harian?.tanggal ||
                  ""
                }
              />

              <SummaryCard
                title="Minggu Ini"
                amount={
                  mingguan?.total_bersih_format ||
                  formatRupiah(
                    mingguan?.total_bersih
                  )
                }
                bookings={Number(
                  mingguan?.jumlah_booking ?? 0
                ).toLocaleString("id-ID")}
                period={
                  mingguan?.label ||
                  (
                    mingguan?.dari &&
                    mingguan?.sampai
                  )
                    ? mingguan?.label ||
                      `${mingguan.dari} – ${mingguan.sampai}`
                    : ""
                }
              />
            </div>
          )}

          <p className="text-[11px] leading-relaxed text-slate-400">
            Penghasilan bersih mengikuti perhitungan backend.
            BHP tidak ditambahkan ke total penghasilan nakes.
          </p>
        </section>

        {/* FILTER RIWAYAT */}
        <section className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 sm:text-lg">
              Riwayat Penghasilan
            </h2>

            <p className="mt-1 text-xs text-slate-500 sm:text-sm">
              Cari transaksi berdasarkan tanggal pembayaran.
            </p>
          </div>

          <form
            onSubmit={applyFilter}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
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
                    setDateFromInput(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                    setDateToInput(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 sm:text-sm"
              >
                Reset
              </button>

              <button
                type="submit"
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 sm:text-sm"
              >
                Terapkan Filter
              </button>
            </div>
          </form>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-slate-500 sm:text-sm">
              {listLoading
                ? "Memuat transaksi..."
                : `${pagination.total.toLocaleString(
                    "id-ID"
                  )} transaksi ditemukan`}
            </p>

            <span className="text-[11px] text-slate-400">
              Maksimal 90 hari terakhir
            </span>
          </div>

          {/* STATUS LIST */}
          {listLoading ? (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              <LoadingCard />
              <LoadingCard />
            </div>
          ) : listError ? (
            <div className="rounded-2xl border border-rose-200 bg-white p-6 text-center shadow-sm">
              <p className="text-sm text-rose-600">
                {listError}
              </p>

              <button
                type="button"
                onClick={fetchHistory}
                className="mt-3 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
              >
                Coba Lagi
              </button>
            </div>
          ) : rows.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                <svg
                  viewBox="0 0 24 24"
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M7 3.75h7l4 4v12.5H7a2 2 0 0 1-2-2v-12.5a2 2 0 0 1 2-2Z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M14 3.75v4h4M8 12h6M8 16h8"
                  />
                </svg>
              </div>

              <h3 className="mt-3 text-sm font-semibold text-slate-800">
                Belum ada riwayat penghasilan
              </h3>

              <p className="mt-1 text-xs text-slate-500">
                Coba ubah filter tanggal atau periksa kembali nanti.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
              {rows.map((item, index) => {
                const bookingCode =
                  getBookingCode(item);

                const income =
                  getIncomeValue(item);

                const status = getStatus(item);

                const recordDate =
                  item?.waktu_bayar ||
                  item?.tanggal_bayar ||
                  item?.tanggal_kunjungan ||
                  item?.booking?.tanggal_kunjungan;

                const serviceName =
                  getServiceName(item);

                const amountFormat =
                  item?.penghasilan_bersih_format ||
                  item?.rincian_penghasilan
                    ?.penghasilan_bersih_format ||
                  (
                    income !== null
                      ? formatRupiah(income)
                      : "Nominal belum tersedia"
                  );

                return (
                  <article
                    key={
                      bookingCode ||
                      item?.id_booking ||
                      `${index}-${recordDate || "record"}`
                    }
                    className="flex flex-col justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md sm:p-5"
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                        <svg
                          viewBox="0 0 24 24"
                          className="h-5 w-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          aria-hidden="true"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8 4.5a3.5 3.5 0 1 0 7 0M6 8.5h11a3 3 0 0 1 3 3v3a5 5 0 0 1-5 5h-3a5 5 0 0 1-5-5v-3a3 3 0 0 1 3-3Z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11.5 11v5M9 13.5h5"
                          />
                        </svg>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <h3 className="break-words text-sm font-bold text-slate-900 sm:text-base">
                            {serviceName ||
                              "Nama layanan tidak tersedia"}
                          </h3>

                          <span
                            className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${getStatusStyle(
                              status
                            )}`}
                          >
                            {status}
                          </span>
                        </div>

                        <p className="mt-1 break-all font-mono text-[11px] text-slate-400 sm:text-xs">
                          {bookingCode || "Kode booking tidak tersedia"}
                        </p>

                        <p className="mt-2 text-xs text-slate-500">
                          {formatTanggal(recordDate)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-end justify-between gap-3 border-t border-slate-100 pt-3">
                      <div>
                        <p className="text-[11px] text-slate-400">
                          Penghasilan bersih
                        </p>

                        <p className="mt-1 break-words text-base font-bold text-slate-900 sm:text-lg">
                          {amountFormat}
                        </p>
                      </div>

                      {bookingCode ? (
                        <Link
                            href={`/nakes/penghasilan/detail?booking_code=${encodeURIComponent(
                                bookingCode
                            )}`}
                            className="inline-flex shrink-0 items-center gap-1 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-semibold text-white transition hover:bg-blue-700"
                            >
                            Detail
                            <svg
                                viewBox="0 0 24 24"
                                className="h-3.5 w-3.5"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                aria-hidden="true"
                            >
                                <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="m9 18 6-6-6-6"
                                />
                            </svg>
                        </Link>
                      ) : (
                        <span className="text-[11px] text-slate-400">
                          Kode booking tidak tersedia
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {/* PAGINATION */}
          {!listLoading &&
          !listError &&
          rows.length > 0 ? (
            <nav
              aria-label="Pagination riwayat penghasilan"
              className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between sm:px-4"
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
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
                >
                  Sebelumnya
                </button>

                <button
                  type="button"
                  disabled={
                    currentPage >=
                      pagination.total_pages ||
                    !pagination.has_more_pages
                  }
                  onClick={() =>
                    setCurrentPage((page) => page + 1)
                  }
                  className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none"
                >
                  Berikutnya
                </button>
              </div>
            </nav>
          ) : null}
        </section>
      </main>
    </div>
  );
}
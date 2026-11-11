"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  getRiwayatWithdrawNakes,
  getDetailWithdrawNakes,
} from "@/services/nakesService";

const PER_PAGE = 15;

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

function formatTanggal(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getErrorMessage(error, fallback) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}

function getRows(response) {
  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (Array.isArray(response?.data?.data)) {
    return response.data.data;
  }

  throw new Error("Data riwayat penarikan tidak dapat dibaca.");
}

function getPagination(response, page, length) {
  const meta =
    response?.pagination ||
    response?.data?.pagination ||
    {};

  const total = Number(meta.total ?? length) || 0;
  const perPage = Number(meta.per_page ?? PER_PAGE) || PER_PAGE;

  return {
    total,
    current_page: Number(meta.current_page ?? page) || page,
    total_pages: Math.max(
      1,
      Number(meta.total_pages ?? Math.ceil(total / perPage)) || 1
    ),
  };
}

function getStatus(item) {
  const value = String(item?.status || "").toLowerCase();

  if (value === "success") {
    return {
      label: item?.status_label || "Berhasil",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-700",
      iconClass: "bg-emerald-50 text-emerald-600",
    };
  }

  if (value === "failed") {
    return {
      label: item?.status_label || "Gagal",
      className:
        "border-rose-200 bg-rose-50 text-rose-700",
      iconClass: "bg-rose-50 text-rose-600",
    };
  }

  return {
    label:
      item?.status_label ||
      item?.status ||
      "Status tidak tersedia",
    className:
      "border-slate-200 bg-slate-50 text-slate-600",
    iconClass: "bg-slate-100 text-slate-500",
  };
}

// =====================================================
// DETAIL MODAL
// =====================================================

function InfoRow({ label, value, mono = false }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-3 last:border-0">
      <span className="shrink-0 text-xs text-slate-500">
        {label}
      </span>

      <span
        className={`break-words text-right text-xs font-semibold text-slate-800 ${
          mono ? "font-mono" : ""
        }`}
      >
        {value || "—"}
      </span>
    </div>
  );
}

function DetailModal({ transaction, onClose }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const requestId = useRef(0);

  const fetchDetail = useCallback(async () => {
    const referenceNo = transaction?.reference_no;

    if (!referenceNo) {
      setError("Nomor referensi tidak tersedia.");
      setLoading(false);
      return;
    }

    const id = ++requestId.current;

    setLoading(true);
    setError("");

    try {
      const response = await getDetailWithdrawNakes(referenceNo);

      if (id === requestId.current) {
        setDetail(response?.data ?? response);
      }
    } catch (err) {
      if (id === requestId.current) {
        setError(
          getErrorMessage(
            err,
            "Detail penarikan gagal dimuat."
          )
        );
      }
    } finally {
      if (id === requestId.current) {
        setLoading(false);
      }
    }
  }, [transaction]);

  useEffect(() => {
    fetchDetail();

    return () => {
      requestId.current += 1;
    };
  }, [fetchDetail]);

  const data = detail || transaction;
  const rekening = data?.rekening_tujuan || {};
  const status = getStatus(data);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="withdraw-detail-title"
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6"
      >
        {/* HEADER */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3
            id="withdraw-detail-title"
            className="text-base font-bold text-slate-900"
          >
            Detail penarikan
          </h3>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup detail"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
          >
            ✕
          </button>
        </div>

        {/* LOADING */}
        {loading ? (
          <div className="space-y-3 py-8">
            <div className="h-8 w-1/2 animate-pulse rounded bg-slate-200" />
            <div className="h-5 animate-pulse rounded bg-slate-100" />
            <div className="h-5 animate-pulse rounded bg-slate-100" />
          </div>
        ) : error ? (
          /* ERROR */
          <div className="py-8 text-center">
            <p className="text-sm text-rose-600">
              {error}
            </p>

            <button
              type="button"
              onClick={fetchDetail}
              className="mt-3 text-sm font-semibold text-blue-700 hover:underline"
            >
              Coba lagi
            </button>
          </div>
        ) : (
          /* DETAIL */
          <div className="space-y-5 pt-4">
            <div className="rounded-xl bg-slate-50 p-4 text-center">
              <span
                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${status.className}`}
              >
                {status.label}
              </span>

              <p className="mt-3 text-2xl font-bold text-slate-900">
                {data?.jumlah_format ||
                  formatRupiah(data?.jumlah)}
              </p>

              <p className="mt-1 break-all font-mono text-xs text-slate-500">
                {data?.reference_no || "—"}
              </p>
            </div>

            {/* INFORMASI TRANSAKSI */}
            <section>
              <h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                Informasi transaksi
              </h4>

              <InfoRow
                label="Nomor referensi"
                value={data?.reference_no}
                mono
              />

              <InfoRow
                label="Tanggal pengajuan"
                value={formatTanggal(data?.created_at)}
              />

              <InfoRow
                label="Waktu diproses"
                value={
                  data?.processed_at
                    ? formatTanggal(data.processed_at)
                    : "—"
                }
              />
            </section>

            {/* REKENING TUJUAN */}
            <section>
              <h4 className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                Rekening tujuan
              </h4>

              <InfoRow
                label="Bank"
                value={rekening?.nama_bank}
              />

              <InfoRow
                label="Kode bank"
                value={rekening?.kode_bank}
              />

              <InfoRow
                label="Nama pemilik"
                value={rekening?.nama_pemilik}
              />

              <InfoRow
                label="Nomor rekening"
                value={rekening?.no_rekening}
                mono
              />
            </section>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-xl border border-slate-200 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50"
        >
          Tutup
        </button>
      </div>
    </div>
  );
}

// =====================================================
// MAIN RIWAYAT PENARIKAN
// =====================================================

export default function RiwayatPenarikan({
  refreshKey = 0,
}) {
  const [rows, setRows] = useState([]);

  const [pagination, setPagination] = useState({
    total: 0,
    current_page: 1,
    total_pages: 1,
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selected, setSelected] = useState(null);

  const requestId = useRef(0);

  // =====================================================
  // FETCH RIWAYAT
  // =====================================================

  const fetchHistory = useCallback(async () => {
    const id = ++requestId.current;

    setLoading(true);
    setError("");

    const params = {
      page: currentPage,
      per_page: PER_PAGE,
    };

    // Semua = tidak mengirim parameter status.
    if (statusFilter !== "all") {
      params.status = statusFilter;
    }

    try {
      const response = await getRiwayatWithdrawNakes(params);

      if (id !== requestId.current) return;

      const dataRows = getRows(response);

      setRows(dataRows);

      setPagination(
        getPagination(
          response,
          currentPage,
          dataRows.length
        )
      );
    } catch (err) {
      if (id !== requestId.current) return;

      setRows([]);

      setError(
        getErrorMessage(
          err,
          "Riwayat penarikan gagal dimuat."
        )
      );
    } finally {
      if (id === requestId.current) {
        setLoading(false);
      }
    }
  }, [currentPage, statusFilter]);

  useEffect(() => {
    fetchHistory();

    return () => {
      requestId.current += 1;
    };
  }, [fetchHistory, refreshKey]);

  // =====================================================
  // FILTER STATUS
  // =====================================================

  function changeStatus(value) {
    setCurrentPage(1);
    setStatusFilter(value);
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <section className="space-y-4">

      {/* HEADER */}
      <div>
        <h3 className="text-base font-bold text-slate-900">
          Riwayat penarikan
        </h3>

        <p className="mt-1 text-sm text-slate-500">
          Daftar transaksi penarikan saldo Anda.
        </p>
      </div>

      {/* FILTER STATUS */}
      <div className="flex flex-wrap gap-2">
        {[
          { value: "all", label: "Semua" },
          { value: "success", label: "Berhasil" },
          { value: "failed", label: "Gagal" },
        ].map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => changeStatus(option.value)}
            aria-pressed={statusFilter === option.value}
            className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
              statusFilter === option.value
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* JUMLAH TRANSAKSI */}
      <p className="text-xs text-slate-500">
        {loading
          ? "Memuat transaksi..."
          : `${pagination.total.toLocaleString("id-ID")} transaksi`}
      </p>

      {/* LOADING */}
      {loading ? (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="h-36 animate-pulse rounded-2xl bg-slate-200/70" />
          <div className="h-36 animate-pulse rounded-2xl bg-slate-200/70" />
        </div>
      ) : error ? (
        /* ERROR */
        <div className="rounded-2xl border border-rose-200 bg-white p-6 text-center">
          <p className="text-sm text-rose-600">
            {error}
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
        /* EMPTY STATE */
        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center">
          <h4 className="text-sm font-semibold text-slate-800">
            {statusFilter === "success"
              ? "Belum ada penarikan berhasil"
              : statusFilter === "failed"
                ? "Belum ada penarikan gagal"
                : "Belum ada riwayat penarikan"}
          </h4>

          <p className="mt-1 text-sm text-slate-500">
            Transaksi penarikan Anda akan muncul di sini.
          </p>
        </div>
      ) : (
        /* LIST TRANSAKSI */
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {rows.map((item, index) => {
            const status = getStatus(item);
            const rekening = item?.rekening_tujuan || {};

            return (
              <article
                key={
                  item?.id_withdrawal ||
                  item?.reference_no ||
                  index
                }
                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-blue-200 hover:shadow-md"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${status.iconClass}`}
                  >
                    {String(item?.status).toLowerCase() === "failed" ? (
                      <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m6 6 12 12M18 6 6 18"
                        />
                      </svg>
                    ) : (
                      <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m5 12 4 4L19 6"
                        />
                      </svg>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h4 className="text-sm font-bold text-slate-900">
                        Penarikan saldo
                      </h4>

                      <span
                        className={`rounded-full border px-2.5 py-1 text-[10px] font-semibold ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>

                    <p className="mt-1 break-all font-mono text-[11px] text-slate-400">
                      {item?.reference_no || "—"}
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                      {formatTanggal(item?.created_at)}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-end justify-between gap-3 border-t border-slate-100 pt-3">
                  <div>
                    <p className="text-xs text-slate-500">
                      Nominal penarikan
                    </p>

                    <p className="mt-1 text-lg font-bold text-slate-900">
                      {item?.jumlah_format ||
                        formatRupiah(item?.jumlah)}
                    </p>

                    {rekening?.nama_bank ? (
                      <p className="mt-1 text-xs text-slate-500">
                        {rekening.nama_bank}
                        {rekening.no_rekening
                          ? ` · ${rekening.no_rekening}`
                          : ""}
                      </p>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelected(item)}
                    disabled={!item?.reference_no}
                    className="shrink-0 rounded-xl bg-blue-600 px-3 py-2.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-40"
                  >
                    Lihat detail
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* PAGINATION */}
      {!loading && !error && rows.length > 0 ? (
        <nav
          aria-label="Halaman riwayat penarikan"
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
              disabled={currentPage >= pagination.total_pages}
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

      {/* DETAIL MODAL */}
      {selected ? (
        <DetailModal
          transaction={selected}
          onClose={() => setSelected(null)}
        />
      ) : null}
    </section>
  );
}
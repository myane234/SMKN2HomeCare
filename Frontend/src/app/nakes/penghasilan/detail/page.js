
"use client";

import {
  Suspense,
  useEffect,
  useState,
} from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { getDetailPenghasilanNakes } from "@/services/nakesService";

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

function formatTanggal(value) {
  if (!value) return "—";

  const match = String(value).match(
    /^(\d{4})-(\d{2})-(\d{2})/
  );

  if (!match) return String(value);

  const [, year, month, day] = match;

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
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatWaktu(value) {
  if (!value) return "—";

  const match = String(value).match(
    /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/
  );

  if (!match) return String(value);

  const [, year, month, day, hour, minute] = match;

  return `${formatTanggal(
    `${year}-${month}-${day}`
  )}, ${hour}:${minute}`;
}

function getErrorMessage(error) {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Gagal memuat detail penghasilan."
  );
}

function getStatusStyle(status) {
  const value = String(status || "").toLowerCase();

  if (value.includes("selesai")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (
    value.includes("batal") ||
    value.includes("refund")
  ) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-blue-200 bg-blue-50 text-blue-700";
}

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 py-3 last:border-0">
      <span className="shrink-0 text-xs text-slate-500 sm:text-sm">
        {label}
      </span>

      <span className="max-w-[65%] break-words text-right text-xs font-semibold leading-relaxed text-slate-800 sm:text-sm">
        {value || "—"}
      </span>
    </div>
  );
}

function IncomeRow({
  label,
  value,
  tone = "default",
  note,
}) {
  const amountColor =
    tone === "minus"
      ? "text-rose-600"
      : tone === "plus"
      ? "text-emerald-700"
      : "text-slate-900";

  return (
    <div className="border-b border-slate-100 py-4 last:border-0">
      <div className="flex items-start justify-between gap-4">
        <span className="text-xs text-slate-600 sm:text-sm">
          {label}
        </span>

        <span
          className={`shrink-0 text-right text-xs font-semibold sm:text-sm ${amountColor}`}
        >
          {value}
        </span>
      </div>

      {note ? (
        <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
          {note}
        </p>
      ) : null}
    </div>
  );
}

function DetailPenghasilanContent() {
  const searchParams = useSearchParams();

  const bookingCode = searchParams.get("booking_code");

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function fetchDetail() {
      if (!bookingCode) {
        setError("Kode booking tidak ditemukan.");
        setDetail(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      setDetail(null);

      try {
        const response =
          await getDetailPenghasilanNakes(bookingCode);

        const result = response?.data;

        if (
          !result ||
          typeof result !== "object" ||
          Array.isArray(result)
        ) {
          throw new Error(
            "Format detail penghasilan dari API tidak sesuai."
          );
        }

        if (active) {
          setDetail(result);
        }
      } catch (err) {
        if (active) {
          setError(getErrorMessage(err));
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    fetchDetail();

    return () => {
      active = false;
    };
  }, [bookingCode]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
        <div className="h-36 animate-pulse rounded-2xl bg-slate-200" />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
          <div className="h-64 animate-pulse rounded-2xl bg-slate-200 lg:col-span-4" />
          <div className="h-80 animate-pulse rounded-2xl bg-slate-200 lg:col-span-8" />
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
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
                d="M12 8v4m0 4h.01M10.3 3.9 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z"
              />
            </svg>
          </div>

          <h1 className="mt-3 text-lg font-bold text-slate-900">
            Detail penghasilan tidak tersedia
          </h1>

          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            {error || "Data transaksi tidak ditemukan."}
          </p>

        </div>
      </div>
    );
  }

  const rincian = detail.rincian_penghasilan || {};

  const layanan = Array.isArray(detail.layanan)
    ? detail.layanan
    : [];

  const namaLayanan = layanan
    .map((item) =>
      typeof item === "string"
        ? item
        : item?.nama_layanan || item?.name
    )
    .filter(Boolean)
    .join(", ");

  const penghasilanBersih =
    rincian.penghasilan_bersih ??
    detail.penghasilan_bersih;

  const penghasilanFormat =
    rincian.penghasilan_bersih_format ||
    detail.penghasilan_bersih_format ||
    formatRupiah(penghasilanBersih);

  const jasaFormat =
    rincian.tarif_jasa_kotor_format ||
    formatRupiah(rincian.tarif_jasa_kotor);

  const potonganFormat =
    rincian.potongan_platform_format ||
    formatRupiah(rincian.potongan_platform);

  const transportFormat =
    rincian.ongkir_format ||
    formatRupiah(rincian.ongkir);

  const potonganTersedia =
    rincian.potongan_platform !== null &&
    rincian.potongan_platform !== undefined;

  const transportTersedia =
    rincian.ongkir !== null &&
    rincian.ongkir !== undefined;

  const status = detail.status_booking;

  return (
    <div className="min-h-screen bg-slate-50/60 pb-24">

      {/* HEADER DETAIL PENGHASILAN */}
        <header className="relative mx-auto overflow-hidden rounded-b-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-6 text-white shadow-md sm:mx-6 sm:mt-6 sm:rounded-2xl sm:px-6 lg:mx-auto lg:max-w-7xl lg:px-8">
        <div className="relative z-10 mx-auto flex max-w-7xl items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-200 sm:text-xs">
                Rincian Transaksi
            </span>

            <h1 className="mt-1 text-xl font-bold sm:text-2xl">
                Detail Penghasilan
            </h1>

            <p className="mt-1 break-all font-mono text-xs text-blue-100 sm:text-sm">
                Kode Booking: {detail.booking_code || bookingCode}
            </p>
            </div>

            {detail.status_booking && (
            <span className="hidden shrink-0 rounded-full border border-white/30 bg-white/15 px-3 py-1 text-xs font-semibold text-white sm:inline-flex">
                {detail.status_booking}
            </span>
            )}
        </div>

        <div className="pointer-events-none absolute -bottom-10 -right-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        </header>

      {/* KONTEN UTAMA — 2 KOLOM PADA DESKTOP */}

      <main className="mx-auto mt-5 max-w-7xl space-y-5 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12 lg:gap-6">

          {/* KOLOM KIRI */}

          <aside className="space-y-5 lg:col-span-4">
            {/* RINGKASAN PENGHASILAN */}

            <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    aria-hidden="true"
                  >
                    <rect
                      x="3"
                      y="5"
                      width="18"
                      height="15"
                      rx="2"
                    />
                    <path d="M7 9h10M7 13h5" />
                  </svg>
                </div>

                <h2 className="text-sm font-bold text-slate-900">
                  Ringkasan Penghasilan
                </h2>
              </div>

              <p className="mt-5 text-xs text-slate-500 sm:text-sm">
                Penghasilan bersih dari kunjungan ini
              </p>

              <p className="mt-1 break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                {penghasilanFormat}
              </p>

              {status ? (
                <span
                  className={`mt-4 inline-flex rounded-full border px-3 py-1 text-xs font-semibold sm:hidden ${getStatusStyle(
                    status
                  )}`}
                >
                  {status}
                </span>
              ) : null}
            </section>

            {/* INFORMASI KUNJUNGAN */}

            <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
              <h2 className="border-b border-slate-100 pb-3 text-sm font-bold text-slate-900 sm:text-base">
                Informasi Kunjungan
              </h2>

              <div className="divide-y divide-slate-100 pt-1">
                <InfoRow
                  label="Nama pasien"
                  value={detail.nama_pasien}
                />

                <InfoRow
                  label="Layanan"
                  value={namaLayanan}
                />

                <InfoRow
                  label="Tanggal kunjungan"
                  value={formatTanggal(detail.tanggal_kunjungan)}
                />

                <InfoRow
                  label="Jam kunjungan"
                  value={
                    detail.jam_kunjungan
                      ? String(detail.jam_kunjungan).slice(0, 5)
                      : "—"
                  }
                />

                <InfoRow
                  label="Waktu pembayaran"
                  value={formatWaktu(detail.waktu_bayar)}
                />
              </div>

              {detail.alamat_kunjungan ? (
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <p className="text-xs font-medium text-slate-500">
                    Alamat kunjungan
                  </p>

                  <div className="mt-2 flex items-start gap-2">
                    <svg
                      viewBox="0 0 24 24"
                      className="mt-0.5 h-4 w-4 shrink-0 text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"
                      />
                      <circle cx="12" cy="10" r="2.5" />
                    </svg>

                    <p className="break-words text-xs leading-relaxed text-slate-700 sm:text-sm">
                      {detail.alamat_kunjungan}
                    </p>
                  </div>
                </div>
              ) : null}
            </section>
          </aside>

          {/* KOLOM KANAN */}

          <section className="min-w-0 lg:col-span-8">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="border-b border-slate-100 pb-4">
                <h2 className="text-base font-bold text-slate-900 sm:text-lg">
                  Rincian Penghasilan
                </h2>

                <p className="mt-1 text-xs leading-relaxed text-slate-500 sm:text-sm">
                  Perincian jasa, potongan platform, dan transport untuk booking ini.
                </p>
              </div>

              <div className="divide-y divide-slate-100">
                <IncomeRow
                  label="Tarif jasa kotor"
                  value={jasaFormat}
                />

                <IncomeRow
                  label="Potongan platform"
                  value={
                    potonganTersedia
                      ? `− ${potonganFormat}`
                      : "—"
                  }
                  tone="minus"
                  note={
                    rincian.keterangan_potongan ||
                    (
                      rincian.persen_fee_nakes != null
                        ? `Persentase hak nakes dari jasa: ${rincian.persen_fee_nakes}%`
                        : undefined
                    )
                  }
                />

                <IncomeRow
                  label="Transport nakes"
                  value={
                    transportTersedia
                      ? `+ ${transportFormat}`
                      : "—"
                  }
                  tone="plus"
                />
              </div>

              <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 p-4 sm:p-5">
                <p className="text-xs font-medium text-blue-700 sm:text-sm">
                  Total Penghasilan Bersih
                </p>

                <p className="mt-1 break-words text-2xl font-bold tracking-tight text-blue-800 sm:text-3xl">
                  {penghasilanFormat}
                </p>

                <p className="mt-2 text-[11px] leading-relaxed text-blue-700/80 sm:text-xs">
                  Nilai akhir mengikuti perhitungan backend. BHP tidak ditambahkan ke total penghasilan nakes.
                </p>
              </div>

              {rincian.persen_fee_nakes != null ? (
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-slate-200 p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      aria-hidden="true"
                    >
                      <circle cx="12" cy="12" r="9" />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 11v5m0-8h.01"
                      />
                    </svg>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-800 sm:text-sm">
                      Pembagian jasa
                    </p>

                    <p className="mt-1 text-xs leading-relaxed text-slate-500">
                      Hak nakes: {rincian.persen_fee_nakes}% dari tarif jasa.
                      {rincian.keterangan_potongan
                        ? ` ${rincian.keterangan_potongan}.`
                        : ""}
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

export default function DetailPenghasilanNakesPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-7xl space-y-5 px-4 py-6 sm:px-6 lg:px-8">
          <div className="h-36 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-64 animate-pulse rounded-2xl bg-slate-200" />
        </div>
      }
    >
      <DetailPenghasilanContent />
    </Suspense>
  );
}

"use client";

import {
  useState,
  useEffect,
  Suspense,
} from "react";
import { useSearchParams } from "next/navigation";
import {
  getBhpBookingStatus,
  getDetailRiwayatKunjungan,
} from "@/services/nakesService";

function DetailRiwayatContent() {
  const searchParams =
    useSearchParams();

  const id =
    searchParams.get("id");

  const [detail, setDetail] =
    useState(null);

  const [bhpState, setBhpState] =
    useState({
      items: [],
      total_tambahan: 0,
      status_transaksi: null,
    });

  const [loading, setLoading] =
    useState(true);

  const [loadingBhp, setLoadingBhp] =
    useState(false);

  const [error, setError] =
    useState(null);

  useEffect(() => {
    if (
      !id ||
      id === "undefined"
    ) {
      setError(
        "ID Kunjungan tidak valid."
      );
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchDetail =
      async () => {
        setLoading(true);
        setError(null);

        try {
          /* =================================================
           * STEP 1
           * Tetap gunakan ID RIWAYAT KUNJUNGAN.
           * =================================================*/
          const res =
            await getDetailRiwayatKunjungan(
              id
            );

          const data =
            res?.data || res;

          if (cancelled) return;

          setDetail(data);

          /* =================================================
           * STEP 2
           * Ambil booking_code dari response riwayat.
           * BUKAN memakai id=44.
           * =================================================*/
          const booking =
            data?.booking || {};

          const bookingCode =
            booking?.booking_code;

          if (!bookingCode) {
            console.warn(
              "booking_code tidak ditemukan pada detail riwayat."
            );

            setBhpState({
              items: [],
              total_tambahan: 0,
              status_transaksi: null,
            });

            return;
          }

          /* =================================================
           * STEP 3
           * GET BHP menggunakan booking_code.
           * =================================================*/
          setLoadingBhp(true);

          try {
            const bhpRes =
              await getBhpBookingStatus(
                bookingCode
              );

            if (cancelled) return;

            setBhpState({
              items:
                Array.isArray(
                  bhpRes?.items
                )
                  ? bhpRes.items
                  : [],
              total_tambahan:
                Number(
                  bhpRes?.total_tambahan
                ) || 0,
              status_transaksi:
                bhpRes?.status_transaksi ||
                null,
            });
          } catch (bhpError) {
            console.warn(
              "Gagal mengambil rincian BHP:",
              bhpError
            );

            if (
              cancelled
            ) {
              return;
            }

            setBhpState({
              items: [],
              total_tambahan: 0,
              status_transaksi:
                null,
            });
          } finally {
            if (!cancelled) {
              setLoadingBhp(
                false
              );
            }
          }
        } catch (err) {
          console.error(
            "Gagal memuat detail riwayat:",
            err
          );

          if (!cancelled) {
            setError(
              "Gagal memuat detail riwayat kunjungan."
            );
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
          }
        }
      };

    fetchDetail();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const formatStatusText =
    (status) => {
      if (
        status ===
        "DiPerjalanan"
      ) {
        return "Di Perjalanan";
      }

      return (
        status || "Selesai"
      );
    };

  const getStatusBadgeStyle =
    (status) => {
      switch (status) {
        case "Selesai":
          return "bg-emerald-500/10 text-emerald-100 border-emerald-400/30";

        case "Tindakan":
          return "bg-purple-500/10 text-purple-100 border-purple-400/30";

        case "DiPerjalanan":
          return "bg-blue-500/10 text-blue-100 border-blue-400/30";

        default:
          return "bg-slate-500/10 text-slate-100 border-slate-400/30";
      }
    };

  const normalizePaymentStatus =
    (status) => {
      if (!status) {
        return null;
      }

      const value =
        String(status)
          .trim()
          .toLowerCase();

      if (
        value === "lunas" ||
        value === "paid" ||
        value ===
          "settlement" ||
        value === "success" ||
        value ===
          "completed" ||
        value.includes(
          "lunas"
        ) ||
        value.includes(
          "settlement"
        ) ||
        value.includes(
          "paid"
        )
      ) {
        return "Lunas";
      }

      if (
        value ===
          "belum bayar" ||
        value === "unpaid" ||
        value ===
          "pending" ||
        value ===
          "waiting" ||
        value.includes(
          "belum"
        ) ||
        value.includes(
          "pending"
        )
      ) {
        return "Belum Bayar";
      }

      return String(status);
    };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4">
        <div className="h-28 bg-slate-200 animate-pulse rounded-2xl" />
        <div className="h-64 bg-slate-200 animate-pulse rounded-2xl" />
      </div>
    );
  }

  if (
    error ||
    !detail
  ) {
    return (
      <div className="p-6 max-w-7xl mx-auto text-center space-y-3">
        <p className="text-red-500 font-medium text-xs sm:text-sm">
          {error ||
            "Data kunjungan tidak ditemukan."}
        </p>
      </div>
    );
  }

  const booking =
    detail?.booking || {};

  const pasien =
    booking?.pasien || {};

  const layananItems =
    Array.isArray(
      booking?.layanan_items
    )
      ? booking.layanan_items
      : [];

  const transaksi =
    booking?.transaksi ||
    {};

  const rincianBiaya =
    transaksi?.rincian_biaya ||
    {};

  const statusKunjungan =
    detail?.status_kunjungan ||
    booking?.status_booking;

  /*
   * =======================================================
   * SUMBER STATUS PEMBAYARAN
   *
   * Untuk flow opsi B:
   * seluruh BHP tambahan dibayar bersama transaksi utama.
   *
   * Jadi:
   * - rincian BHP = endpoint /bhp
   * - status bayar = transaksi utama
   * - grand total = transaksi utama
   * =======================================================
   */
  const totalBhpTambahan =
    Number(
      bhpState?.total_tambahan ||
        rincianBiaya?.sb_tambahan ||
        0
    ) || 0;

  const paymentStatus =
    normalizePaymentStatus(
      totalBhpTambahan > 0
        ? transaksi?.status_transaksi
        : "Lunas"
    );

  const totalLayanan =
    Number(
      rincianBiaya?.sl
    ) || 0;

  const totalBhpLayanan =
    Number(
      rincianBiaya?.sb
    ) || 0;

  const totalTransport =
    Number(
      rincianBiaya?.st
    ) || 0;

  const totalAdmin =
    Number(
      rincianBiaya?.ba
    ) || 0;

  const totalPpn =
    Number(
      rincianBiaya?.ppn
    ) || 0;

  const grandTotal =
    Number(
      transaksi?.jumlah_total
    ) ||
    0;

  /*
   * Cari BHP aktual dari endpoint /bhp
   * berdasarkan layanan + id_bhp.
   */
  const getActualBhp =
    (
      idLayanan,
      idBhp
    ) => {
      return (
        bhpState.items.find(
          (item) =>
            String(
              item?.id_layanan
            ) ===
              String(
                idLayanan
              ) &&
            String(
              item?.id_bhp
            ) ===
              String(
                idBhp
              )
        ) || null
      );
    };

  /*
   * Semua BHP tambahan pada suatu layanan.
   */
  const getAdditionalBhp =
    (idLayanan) => {
      return bhpState.items.filter(
        (item) =>
          String(
            item?.id_layanan
          ) ===
            String(
              idLayanan
            ) &&
          Number(
            item?.qty_tambahan
          ) > 0
      );
    };

  return (
    <div className="min-h-screen bg-slate-50/60 pb-24">
      {/* HEADER */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white pt-6 pb-8 px-4 sm:px-6 lg:px-8 rounded-b-3xl sm:rounded-2xl sm:max-w-7xl sm:mx-auto sm:mt-6 shadow-md relative overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] sm:text-xs font-semibold uppercase tracking-wider text-blue-200">
              Rincian Transaksi
            </span>

            <h1 className="text-xl sm:text-2xl font-bold">
              Detail Kunjungan Medis
            </h1>

            <p className="text-xs sm:text-sm text-blue-100 font-mono mt-0.5">
              Kode Booking:{" "}
              {booking?.booking_code ||
                "-"}
            </p>
          </div>

          <div>
            <span
              className={`inline-block px-3.5 py-1 rounded-full text-xs font-semibold border backdrop-blur-md shadow-sm ${getStatusBadgeStyle(
                statusKunjungan
              )}`}
            >
              {formatStatusText(
                statusKunjungan
              )}
            </span>
          </div>
        </div>

        <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-white/10 rounded-full blur-2xl pointer-events-none" />
      </div>

      {/* KONTEN */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-5 space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 items-start">
          {/* INFORMASI PASIEN */}
          <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
              Informasi Pasien
            </h2>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-400">
                  Nama Pasien
                </p>

                <p className="text-sm font-bold text-slate-900 mt-0.5">
                  {pasien?.nama_lengkap ||
                    "Nama Pasien Tidak Ditemukan"}
                </p>
              </div>

              <div>
                <p className="text-xs text-slate-400">
                  Alamat Kunjungan
                </p>

                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mt-0.5">
                  {booking?.alamat_kunjungan ||
                    pasien?.alamat_utama ||
                    "Alamat tidak dicantumkan"}
                </p>
              </div>

              {booking?.tanggal_kunjungan && (
                <div className="pt-2 border-t border-slate-100 space-y-1">
                  <p className="text-xs text-slate-400">
                    Waktu Kunjungan
                  </p>

                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-600">
                    <svg
                      className="w-3.5 h-3.5 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>

                    <span>
                      {
                        booking.tanggal_kunjungan
                      }{" "}
                      (
                      {
                        booking.jam_kunjungan
                      }
                      )
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* LAYANAN + BHP */}
          <div className="lg:col-span-2 space-y-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 pb-2">
                Daftar Layanan & Alat Medis (BHP)
              </h2>

              {loadingBhp && (
                <div className="text-[11px] text-slate-400">
                  Memuat rincian BHP...
                </div>
              )}

              {layananItems.length >
              0 ? (
                <div className="space-y-3">
                  {layananItems.map(
                    (
                      item,
                      idx
                    ) => {
                      const serviceBhp =
                        Array.isArray(
                          item?.bhp
                        )
                          ? item.bhp
                          : [];

                      const additionalBhp =
                        getAdditionalBhp(
                          item?.id_layanan
                        );

                      return (
                        <div
                          key={
                            item.id_layanan ||
                            idx
                          }
                          className="p-4 bg-slate-50 rounded-xl border border-slate-200/70 space-y-3"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div>
                              <h3 className="text-sm font-bold text-slate-900">
                                {
                                  item.nama_layanan
                                }
                              </h3>

                              {item.deskripsi && (
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                  {
                                    item.deskripsi
                                  }
                                </p>
                              )}
                            </div>

                            <span className="text-[10px] bg-slate-200 text-slate-700 font-semibold px-2.5 py-0.5 rounded shrink-0 uppercase tracking-wider">
                              {item
                                .kategori
                                ?.nama_kategori ||
                                "Medis"}
                            </span>
                          </div>

                          {serviceBhp.length >
                            0 && (
                            <div className="pt-3 border-t border-slate-200/80">
                              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                                Bahan Habis Pakai (BHP) / Peralatan:
                              </p>

                              <div className="flex flex-wrap gap-2">
                                {serviceBhp.map(
                                  (
                                    b
                                  ) => {
                                    const actual =
                                      getActualBhp(
                                        item?.id_layanan,
                                        b?.id_bhp
                                      );

                                    const qtyDefault =
                                      Number(
                                        actual?.qty_default ??
                                          b?.qty_default ??
                                          0
                                      ) || 0;

                                    const qtyReal =
                                      Math.max(
                                        qtyDefault,
                                        Number(
                                          actual?.qty_real ??
                                            qtyDefault
                                        ) || 0
                                      );

                                    const qtyTambahan =
                                      Math.max(
                                        0,
                                        qtyReal -
                                          qtyDefault
                                      );

                                    return (
                                      <span
                                        key={`${item.id_layanan}-${b.id_bhp}`}
                                        className={`text-xs px-2.5 py-1 rounded-lg border font-medium shadow-2xs ${
                                          qtyTambahan >
                                          0
                                            ? "bg-amber-50 text-amber-800 border-amber-200"
                                            : "bg-white text-slate-700 border-slate-200"
                                        }`}
                                      >
                                        {
                                          b.nama_bhp
                                        }{" "}
                                        <strong className="text-blue-600">
                                          (
                                          {
                                            qtyReal
                                          }
                                          x)
                                        </strong>

                                        {qtyTambahan >
                                          0 && (
                                          <span className="text-amber-600 font-bold">
                                            {" "}
                                            +
                                            {
                                              qtyTambahan
                                            }
                                          </span>
                                        )}
                                      </span>
                                    );
                                  }
                                )}
                              </div>

                              {additionalBhp.length >
                                0 && (
                                <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200">
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-2">
                                    BHP Tambahan
                                  </p>

                                  <div className="space-y-1.5">
                                    {additionalBhp.map(
                                      (
                                        bhp,
                                        bhpIndex
                                      ) => {
                                        const subtotal =
                                          Number(
                                            bhp?.total_sb_tambahan
                                          ) ||
                                          (
                                            Number(
                                              bhp?.qty_tambahan
                                            ) ||
                                            0
                                          ) *
                                            (
                                              Number(
                                                bhp?.harga_satuan
                                              ) ||
                                              0
                                            );

                                        return (
                                          <div
                                            key={`${bhp.id_booking_bhp || bhpIndex}-${bhp.id_bhp}`}
                                            className="flex justify-between gap-3 text-[11px] text-amber-900"
                                          >
                                            <span>
                                              {
                                                bhp.nama_bhp
                                              }{" "}
                                              (+
                                              {
                                                bhp.qty_tambahan
                                              }
                                              x)
                                            </span>

                                            <span className="font-semibold">
                                              Rp{" "}
                                              {subtotal.toLocaleString(
                                                "id-ID"
                                              )}
                                            </span>
                                          </div>
                                        );
                                      }
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    }
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">
                  Tidak ada rincian layanan.
                </p>
              )}

              {/* BHP tambahan yang mungkin tidak ada di mapping layanan */}
              {bhpState.items.some(
                (item) =>
                  Number(
                    item?.qty_tambahan
                  ) > 0 &&
                  !layananItems.some(
                    (layanan) =>
                      String(
                        layanan?.id_layanan
                      ) ===
                        String(
                          item?.id_layanan
                        )
                  )
              ) && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700 mb-2">
                    BHP Tambahan Lainnya
                  </p>

                  <div className="space-y-1.5">
                    {bhpState.items
                      .filter(
                        (item) =>
                          Number(
                            item?.qty_tambahan
                          ) > 0
                      )
                      .filter(
                        (item) =>
                          !layananItems.some(
                            (layanan) =>
                              String(
                                layanan?.id_layanan
                              ) ===
                              String(
                                item?.id_layanan
                              )
                          )
                      )
                      .map(
                        (
                          item,
                          idx
                        ) => {
                          const subtotal =
                            Number(
                              item?.total_sb_tambahan
                            ) ||
                            (
                              Number(
                                item?.qty_tambahan
                              ) || 0
                            ) *
                              (
                                Number(
                                  item?.harga_satuan
                                ) || 0
                              );

                          return (
                            <div
                              key={`${item.id_layanan}-${item.id_bhp}-${idx}`}
                              className="flex justify-between text-[11px] text-amber-900"
                            >
                              <span>
                                {
                                  item.nama_bhp
                                }{" "}
                                (+
                                {
                                  item.qty_tambahan
                                }
                                x)
                              </span>

                              <span className="font-semibold">
                                Rp{" "}
                                {subtotal.toLocaleString(
                                  "id-ID"
                                )}
                              </span>
                            </div>
                          );
                        }
                      )}
                  </div>
                </div>
              )}
            </div>

            {/* RINCIAN BIAYA */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Rincian Biaya & Status Pelunasan
                </h2>

                <span
                  className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                    paymentStatus ===
                    "Lunas"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : "bg-amber-100 text-amber-800 border-amber-300"
                  }`}
                >
                  {paymentStatus ||
                    "Status belum tersedia"}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>
                    Biaya Layanan Utama
                  </span>

                  <span className="font-semibold text-slate-900">
                    Rp{" "}
                    {totalLayanan.toLocaleString(
                      "id-ID"
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>
                    BHP Layanan
                  </span>

                  <span className="font-semibold text-slate-900">
                    Rp{" "}
                    {totalBhpLayanan.toLocaleString(
                      "id-ID"
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-slate-600">
                  <span>
                    BHP Tambahan
                  </span>

                  <span className="font-semibold text-amber-700">
                    Rp{" "}
                    {totalBhpTambahan.toLocaleString(
                      "id-ID"
                    )}
                  </span>
                </div>

                {totalTransport >
                  0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>
                      Transport
                    </span>

                    <span className="font-semibold text-slate-900">
                      Rp{" "}
                      {totalTransport.toLocaleString(
                        "id-ID"
                      )}
                    </span>
                  </div>
                )}

                {totalAdmin >
                  0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>
                      Biaya Admin
                    </span>

                    <span className="font-semibold text-slate-900">
                      Rp{" "}
                      {totalAdmin.toLocaleString(
                        "id-ID"
                      )}
                    </span>
                  </div>
                )}

                {totalPpn >
                  0 && (
                  <div className="flex justify-between text-slate-600">
                    <span>
                      PPN
                    </span>

                    <span className="font-semibold text-slate-900">
                      Rp{" "}
                      {totalPpn.toLocaleString(
                        "id-ID"
                      )}
                    </span>
                  </div>
                )}

                <div className="flex justify-between items-center pt-3 border-t border-slate-200 text-sm font-bold">
                  <span className="text-slate-800">
                    Grand Total
                  </span>

                  <span className="text-emerald-600 text-base">
                    Rp{" "}
                    {grandTotal.toLocaleString(
                      "id-ID"
                    )}
                  </span>
                </div>

                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>
                    Metode Pembayaran
                  </span>

                  <span>
                    {transaksi?.metode_pembayaran ||
                      transaksi?.payment_method ||
                      "-"}
                  </span>
                </div>

                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>
                    Waktu Bayar
                  </span>

                  <span>
                    {transaksi?.waktu_bayar ||
                      "-"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DetailRiwayatPage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 text-center text-slate-500 text-xs">
          Memuat detail...
        </div>
      }
    >
      <DetailRiwayatContent />
    </Suspense>
  );
}
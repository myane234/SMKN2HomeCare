"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  FiArrowLeft,
  FiCalendar,
  FiUser,
  FiMapPin,
  FiCreditCard,
  FiClock,
  FiFileText,
} from "react-icons/fi";
import {
  getDetailTransaksi,
  getBiayaTambahanTransaksi,
} from "@/services/transaksiService";

export default function DetailTransaksiPage({ params }) {
  const resolvedParams = use(params);
  const idBooking = resolvedParams?.id_booking;

  const router = useRouter();

  const [transaksi, setTransaksi] = useState(null);
  const [bhpState, setBhpState] = useState({
    items: [],
    total_tambahan: 0,
    status_transaksi: null,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingBhp, setIsLoadingBhp] = useState(false);
  const [error, setError] = useState("");

  const fetchDetailTransaksi = useCallback(async () => {
    if (!idBooking) {
      setIsLoading(false);
      setError("ID booking tidak ditemukan di URL.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await getDetailTransaksi(idBooking);

      if (response?.success === false) {
        setError(
          response?.message ||
            "Gagal memuat detail transaksi."
        );
        return;
      }

      const detail = response?.data || response;

      setTransaksi(detail);

      const bookingCode = detail?.booking?.booking_code;

      if (!bookingCode) {
        setBhpState({
          items: [],
          total_tambahan: 0,
          status_transaksi: null,
        });
        return;
      }

      setIsLoadingBhp(true);

      try {
        const bhpResponse =
          await getBiayaTambahanTransaksi(
            bookingCode
          );

        const root =
          bhpResponse?.data ??
          bhpResponse ??
          {};

        const rawItems =
          Array.isArray(root?.items)
            ? root.items
            : Array.isArray(root?.booking_bhp)
            ? root.booking_bhp
            : Array.isArray(root?.bhp_items)
            ? root.bhp_items
            : [];

        const items = rawItems.map((item) => {
          const qtyDefault =
            Number(
              item?.qty_default ??
                item?.default_qty ??
                item?.jumlah_default ??
                0
            ) || 0;

          const qtyReal = Math.max(
            qtyDefault,
            Number(
              item?.qty_real ??
                item?.jumlah_real ??
                item?.qty ??
                item?.jumlah ??
                qtyDefault
            ) || 0
          );

          const qtyTambahan = Math.max(
            0,
            Number(
              item?.qty_tambahan ??
                item?.jumlah_tambahan ??
                qtyReal - qtyDefault
            ) || 0
          );

          const hargaSatuan =
            Number(
              item?.harga_satuan ??
                item?.harga_jual ??
                item?.harga ??
                0
            ) || 0;

          const subtotalTambahan =
            Number(
              item?.total_sb_tambahan ??
                item?.subtotal_tambahan ??
                item?.subtotal ??
                item?.total_tambahan ??
                qtyTambahan * hargaSatuan
            ) || 0;

          return {
            ...item,
            qty_default: qtyDefault,
            qty_real: qtyReal,
            qty_tambahan: qtyTambahan,
            harga_satuan: hargaSatuan,
            total_sb_tambahan: subtotalTambahan,
          };
        });

        const totalTambahan =
          Number(
            root?.nominal ??
              root?.total_tambahan ??
              root?.sb_tambahan ??
              items.reduce(
                (total, item) =>
                  total +
                  Number(
                    item?.total_sb_tambahan || 0
                  ),
                0
              )
          ) || 0;

        setBhpState({
          items,
          total_tambahan: totalTambahan,
          status_transaksi:
            root?.status_transaksi ??
            root?.status_pembayaran_bhp ??
            null,
        });
      } catch (bhpError) {
        console.warn(
          "Gagal mengambil detail BHP:",
          bhpError
        );

        setBhpState({
          items: [],
          total_tambahan: 0,
          status_transaksi: null,
        });
      } finally {
        setIsLoadingBhp(false);
      }
    } catch (err) {
      console.error(
        "-> Error fetch detail transaksi:",
        err
      );

      if (err?.response?.status === 401) {
        setError(
          "Sesi login sudah habis. Silakan login kembali."
        );
      } else if (err?.response?.data?.message) {
        setError(
          err.response.data.message
        );
      } else {
        setError(
          "Terjadi kesalahan koneksi saat memuat detail transaksi."
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [idBooking]);

  useEffect(() => {
    fetchDetailTransaksi();
  }, [fetchDetailTransaksi]);

  const formatRupiah = (angka) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(Number(angka) || 0);
  };

  const formatTanggal = (value) => {
    if (!value) return "-";

    try {
      return new Date(value).toLocaleDateString(
        "id-ID",
        {
          day: "2-digit",
          month: "long",
          year: "numeric",
        }
      );
    } catch {
      return value;
    }
  };

  const booking =
    transaksi?.booking ||
    transaksi ||
    {};

  const pasien =
    transaksi?.pasien ||
    {};

  const kunjungan =
    transaksi?.kunjungan ||
    {};

  const layananItems =
    Array.isArray(transaksi?.layanan_items)
      ? transaksi.layanan_items
      : transaksi?.layanan
      ? [transaksi.layanan]
      : [];

  const detailPembayaran =
    transaksi?.transaksi ||
    {};

  const rincianBiaya =
    detailPembayaran?.rincian_biaya ||
    {};

  const totalLayanan =
    Number(
      rincianBiaya?.layanan?.nilai ??
        rincianBiaya?.sl ??
        0
    ) || 0;

  const totalBhpLayanan =
    Number(
      rincianBiaya?.bhp?.nilai ??
        rincianBiaya?.sb ??
        0
    ) || 0;

  const totalBhpTambahan =
    Number(
      rincianBiaya?.bhp_tambahan?.nilai ??
        bhpState?.total_tambahan ??
        0
    ) || 0;

  const totalTransportasi =
    Number(
      rincianBiaya?.transportasi?.nilai ??
        rincianBiaya?.st ??
        0
    ) || 0;

  const totalAdministrasi =
    Number(
      rincianBiaya?.administrasi?.nilai ??
        rincianBiaya?.ba ??
        0
    ) || 0;

  const totalPpn =
    Number(
      rincianBiaya?.ppn?.nilai ??
        rincianBiaya?.ppn ??
        0
    ) || 0;

  const grandTotal =
    Number(
      rincianBiaya?.total?.nilai ??
        detailPembayaran?.jumlah_total ??
        0
    ) || 0;

  const renderBadgeStatus = (status) => {
    const statusMap = {
      Selesai:
        "bg-green-100 text-green-700 border-green-200",
      Tindakan:
        "bg-purple-100 text-purple-700 border-purple-200",
      DiPerjalanan:
        "bg-blue-100 text-blue-700 border-blue-200",
      Pending:
        "bg-yellow-100 text-yellow-700 border-yellow-200",
      Dibatalkan:
        "bg-red-100 text-red-700 border-red-200",
    };

    const styleClass =
      statusMap[status] ||
      "bg-gray-100 text-gray-700 border-gray-200";

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-semibold border ${styleClass}`}
      >
        {status || "Unknown"}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        <Link
          href="/transaksi"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 mb-6 transition"
        >
          <FiArrowLeft />
          Kembali ke Riwayat Transaksi
        </Link>

        {isLoading ? (
          <div className="bg-white p-12 text-center rounded-xl shadow-sm border border-gray-200">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto" />
            <p className="mt-4 text-gray-500">
              Memuat detail transaksi...
            </p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-600 p-6 rounded-xl text-center">
            <p className="font-medium mb-4">
              {error}
            </p>

            <button
              onClick={() =>
                router.push("/transaksi")
              }
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition"
            >
              Kembali
            </button>
          </div>
        ) : transaksi ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-wrap justify-between items-center gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">
                  Kode Booking
                </p>

                <h2 className="text-xl font-bold font-mono text-gray-800">
                  {booking?.booking_code ||
                    booking?.id_booking ||
                    `- # ${idBooking}`}
                </h2>
              </div>

              <div>
                {renderBadgeStatus(
                  booking?.status?.value ||
                    booking?.status_booking
                )}
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <FiFileText className="text-blue-600 mt-1" />

                    <div>
                      <p className="text-xs text-gray-500">
                        Layanan
                      </p>

                      <div className="font-semibold text-gray-800">
                        {layananItems.length > 0 ? (
                          <ul className="space-y-1">
                            {layananItems.map(
                              (
                                layanan,
                                index
                              ) => (
                                <li
                                  key={
                                    layanan?.id_layanan ||
                                    index
                                  }
                                >
                                  {layanan?.nama_layanan ||
                                    "Layanan Home Care"}
                                </li>
                              )
                            )}
                          </ul>
                        ) : (
                          "Layanan Home Care"
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <FiCalendar className="text-blue-600 mt-1" />

                    <div>
                      <p className="text-xs text-gray-500">
                        Tanggal Kunjungan
                      </p>

                      <p className="font-medium text-gray-800">
                        {formatTanggal(
                          kunjungan?.tanggal ||
                            booking?.tanggal_kunjungan
                        )}

                        {kunjungan?.jam && (
                          <span className="block text-xs text-gray-500">
                            Pukul{" "}
                            {kunjungan.jam}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <FiClock className="text-blue-600 mt-1" />

                    <div>
                      <p className="text-xs text-gray-500">
                        Waktu Pemesanan
                      </p>

                      <p className="font-medium text-gray-800">
                        {booking?.dibuat_pada ||
                          formatTanggal(
                            booking?.created_at
                          )}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <FiUser className="text-blue-600 mt-1" />

                    <div>
                      <p className="text-xs text-gray-500">
                        Pasien / Pemesan
                      </p>

                      <p className="font-medium text-gray-800">
                        {pasien?.nama_lengkap ||
                          transaksi?.user?.name ||
                          "-"}

                        {pasien?.no_hp && (
                          <span className="block text-xs text-gray-500">
                            {pasien.no_hp}
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <FiMapPin className="text-blue-600 mt-1" />

                    <div>
                      <p className="text-xs text-gray-500">
                        Alamat Kunjungan
                      </p>

                      <p className="font-medium text-gray-800">
                        {kunjungan?.alamat ||
                          transaksi?.alamat_kunjungan ||
                          transaksi?.alamat ||
                          "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <hr className="border-gray-100" />

              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FiCreditCard className="text-blue-600" />
                  Rincian Pembayaran
                </h3>

                <div className="bg-slate-50 p-4 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>
                      Biaya Layanan Utama
                    </span>

                    <span>
                      {formatRupiah(
                        totalLayanan
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-gray-600">
                    <span>
                      BHP Layanan
                    </span>

                    <span>
                      {formatRupiah(
                        totalBhpLayanan
                      )}
                    </span>
                  </div>

                  {totalBhpTambahan > 0 ? (
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200/80 space-y-2 my-1">
                      <div className="flex justify-between text-amber-900 font-semibold text-xs">
                        <span>
                          Tambahan BHP oleh Nakes
                        </span>

                        <span>
                          {formatRupiah(
                            totalBhpTambahan
                          )}
                        </span>
                      </div>

                      {isLoadingBhp ? (
                        <p className="text-[11px] text-amber-700">
                          Memuat rincian BHP...
                        </p>
                      ) : bhpState.items.filter(
                          (item) =>
                            Number(
                              item?.qty_tambahan
                            ) > 0
                        ).length > 0 ? (
                        <div className="space-y-1.5 pl-2 border-l-2 border-amber-300">
                          {bhpState.items
                            .filter(
                              (item) =>
                                Number(
                                  item?.qty_tambahan
                                ) > 0
                            )
                            .map(
                              (
                                item,
                                index
                              ) => {
                                const qtyTambahan =
                                  Number(
                                    item?.qty_tambahan
                                  ) || 0;

                                const hargaSatuan =
                                  Number(
                                    item?.harga_satuan
                                  ) || 0;

                                const subtotal =
                                  Number(
                                    item?.total_sb_tambahan
                                  ) ||
                                  qtyTambahan *
                                    hargaSatuan;

                                return (
                                  <div
                                    key={`${item?.id_booking_bhp || index}-${item?.id_bhp || index}`}
                                    className="flex justify-between text-[11px] text-amber-800 gap-3"
                                  >
                                    <span>
                                      {item?.nama_bhp ||
                                        "BHP"}{" "}
                                      (+
                                      {
                                        qtyTambahan
                                      }{" "}
                                      unit)
                                    </span>

                                    <span className="font-semibold shrink-0">
                                      {formatRupiah(
                                        subtotal
                                      )}
                                    </span>
                                  </div>
                                );
                              }
                            )}
                        </div>
                      ) : (
                        <p className="text-[11px] text-amber-700">
                          Rincian item BHP tambahan tidak tersedia.
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="flex justify-between text-gray-500">
                      <span>
                        BHP Tambahan
                      </span>

                      <span>
                        Rp 0
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between text-gray-600">
                    <span>
                      Transportasi
                    </span>

                    <span>
                      {formatRupiah(
                        totalTransportasi
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-gray-600">
                    <span>
                      Administrasi
                    </span>

                    <span>
                      {formatRupiah(
                        totalAdministrasi
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-gray-600">
                    <span>
                      PPN
                    </span>

                    <span>
                      {formatRupiah(
                        totalPpn
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-gray-900 font-bold text-base pt-2.5 border-t border-gray-200">
                    <span>
                      Grand Total{" "}
                      {detailPembayaran?.status ===
                        "Lunas" &&
                        "LUNAS"}
                    </span>

                    <span className="text-emerald-600 font-bold">
                      {formatRupiah(
                        grandTotal
                      )}
                    </span>
                  </div>

                  <div className="flex justify-between text-xs text-gray-500 pt-1">
                    <span>
                      Metode Pembayaran
                    </span>

                    <span>
                      {detailPembayaran?.metode_pembayaran ||
                        detailPembayaran?.payment_method ||
                        "-"}
                    </span>
                  </div>

                  <div className="flex justify-between text-xs text-gray-500">
                    <span>
                      Waktu Bayar
                    </span>

                    <span>
                      {detailPembayaran?.waktu_bayar ||
                        "-"}
                    </span>
                  </div>
                </div>

                {/* POINTS JANGAN DIUBAH */}
                {detailPembayaran?.points_info && (
                  <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider">
                        Reward Poin
                      </p>

                      <p className="text-sm font-medium text-amber-900">
                        {detailPembayaran
                          .points_info
                          .is_earned
                          ? `Berhasil mendapatkan ${detailPembayaran.points_info.points_earned} Poin dari transaksi ini.`
                          : `Estimasi ${detailPembayaran.points_info.points_earned} Poin (Akan didapat setelah layanan selesai).`}
                      </p>
                    </div>

                    <div className="text-right">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          detailPembayaran
                            .points_info
                            .is_earned
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {detailPembayaran
                          .points_info
                          .is_earned
                          ? `+${detailPembayaran.points_info.points_earned} Poin`
                          : "Pending"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
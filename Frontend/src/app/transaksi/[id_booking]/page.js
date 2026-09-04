"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiArrowLeft, FiCalendar, FiUser, FiMapPin, FiCreditCard, FiClock, FiFileText } from "react-icons/fi";
import { getDetailTransaksi } from "@/services/transaksiService";

export default function DetailTransaksiPage({ params }) {
  // Unwrap params - key "id_booking" HARUS sama persis dengan nama folder [id_booking]
  const resolvedParams = use(params);
  const idBooking = resolvedParams?.id_booking;

  const router = useRouter();
  const [transaksi, setTransaksi] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
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

      if (response.success === false) {
        setError(response.message || "Gagal memuat detail transaksi.");
        return;
      }

      setTransaksi(response.data || response);
    } catch (err) {
      console.error("-> Error fetch detail transaksi:", err);

      if (err?.response?.status === 401) {
        setError("Sesi login sudah habis. Silakan login kembali.");
      } else if (err?.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Terjadi kesalahan koneksi saat memuat detail transaksi.");
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
    }).format(angka || 0);
  };

  const formatTanggal = (value) => {
    if (!value) return "-";
    try {
      return new Date(value).toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch {
      return value;
    }
  };

  const renderBadgeStatus = (status) => {
    const statusMap = {
      Selesai: "bg-green-100 text-green-700 border-green-200",
      Tindakan: "bg-purple-100 text-purple-700 border-purple-200",
      DiPerjalanan: "bg-blue-100 text-blue-700 border-blue-200",
      Pending: "bg-yellow-100 text-yellow-700 border-yellow-200",
      Dibatalkan: "bg-red-100 text-red-700 border-red-200",
    };

    const styleClass = statusMap[status] || "bg-gray-100 text-gray-700 border-gray-200";

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styleClass}`}>
        {status || "Unknown"}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 md:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Tombol Kembali */}
        <Link
          href="/transaksi"
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-blue-600 mb-6 transition"
        >
          <FiArrowLeft /> Kembali ke Riwayat Transaksi
        </Link>

        {isLoading ? (
          <div className="bg-white p-12 text-center rounded-xl shadow-sm border border-gray-200">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Memuat detail transaksi...</p>
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 text-red-600 p-6 rounded-xl text-center">
            <p className="font-medium mb-4">{error}</p>
            <button
              onClick={() => router.push("/transaksi")}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition"
            >
              Kembali
            </button>
          </div>
        ) : transaksi ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header Status */}
            <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-wrap justify-between items-center gap-4">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Kode Booking</p>
                <h2 className="text-xl font-bold font-mono text-gray-800">
                  {transaksi.booking_code || transaksi.id_booking || `- # ${idBooking}`}
                </h2>
              </div>
              <div>{renderBadgeStatus(transaksi.status_booking)}</div>
            </div>

            <div className="p-6 space-y-6">
              {/* Informasi Utama */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <FiFileText className="text-blue-600 mt-1" />
                    <div>
                      <p className="text-xs text-gray-500">Layanan</p>
                      <p className="font-semibold text-gray-800">
                        {transaksi.layanan?.nama_layanan || "Layanan Home Care"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <FiCalendar className="text-blue-600 mt-1" />
                    <div>
                      <p className="text-xs text-gray-500">Tanggal Kunjungan</p>
                      <p className="font-medium text-gray-800">
                        {formatTanggal(transaksi.tanggal_kunjungan)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <FiClock className="text-blue-600 mt-1" />
                    <div>
                      <p className="text-xs text-gray-500">Waktu Pemesanan</p>
                      <p className="font-medium text-gray-800">
                        {formatTanggal(transaksi.created_at)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <FiUser className="text-blue-600 mt-1" />
                    <div>
                      <p className="text-xs text-gray-500">Pasien / Pemesan</p>
                      <p className="font-medium text-gray-800">
                        {transaksi.pasien?.nama_lengkap || transaksi.user?.name || "-"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <FiMapPin className="text-blue-600 mt-1" />
                    <div>
                      <p className="text-xs text-gray-500">Alamat Kunjungan</p>
                      <p className="font-medium text-gray-800">
                        {transaksi.alamat_kunjungan || transaksi.alamat || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <hr className="border-gray-100" />

              {/* Rincian Pembayaran */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FiCreditCard className="text-blue-600" /> Rincian Pembayaran
                </h3>
                <div className="bg-slate-50 p-4 rounded-lg space-y-2 text-sm">
                  <div className="flex justify-between text-gray-600">
                    <span>Biaya Layanan</span>
                    <span>{formatRupiah(transaksi.transaksi?.jumlah_total || transaksi.total)}</span>
                  </div>
                  <div className="flex justify-between text-gray-900 font-bold text-base pt-2 border-t border-gray-200">
                    <span>Total Pembayaran</span>
                    <span className="text-blue-600">
                      {formatRupiah(transaksi.transaksi?.jumlah_total || transaksi.total)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
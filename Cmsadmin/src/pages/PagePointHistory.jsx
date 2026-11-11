import React, { useState, useEffect } from 'react';
import { getPointHistory } from '../data/pointEndpoint';

export default function PagePointHistory() {
  const [history, setHistory] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchHistory(page);
  }, [page]);

  const fetchHistory = async (currentPage) => {
    try {
      setLoading(true);
      const res = await getPointHistory({ page: currentPage, per_page: 20 });
      if (res.success) {
        setHistory(res.data || []);
        setPagination(res.pagination || null);
      }
    } catch (err) {
      console.error('Gagal memuat history poin:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Riwayat Mutasi Poin Pasien</h1>
        <p className="text-sm text-gray-500">Daftar perolehan (EARN), penggunaan (REDEEM), dan poin hangus (EXPIRED).</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="p-4">Pasien</th>
                <th className="p-4">Tipe Transaksi</th>
                <th className="p-4">Jumlah Poin</th>
                <th className="p-4">Saldo Akhir</th>
                <th className="p-4">Keterangan & Kode Booking</th>
                <th className="p-4">Tanggal Transaksi</th>
                <th className="p-4">Masa Kadaluwarsa</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-400">Memuat riwayat transaksi poin...</td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-400">Belum ada riwayat transaksi poin.</td>
                </tr>
              ) : (
                history.map((item) => {
                  let badgeStyle = 'bg-gray-100 text-gray-800';
                  if (item.type === 'EARN') badgeStyle = 'bg-emerald-100 text-emerald-800';
                  if (item.type === 'REDEEM') badgeStyle = 'bg-rose-100 text-rose-800';
                  if (item.type === 'EXPIRED') badgeStyle = 'bg-amber-100 text-amber-800';

                  return (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="p-4 font-medium text-gray-900">{item.nama_pasien}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${badgeStyle}`}>
                          {item.type}
                        </span>
                      </td>
                      <td className={`p-4 font-bold ${item.type === 'EARN' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {item.type === 'EARN' ? `+${item.amount}` : `-${item.amount}`}
                      </td>
                      <td className="p-4 font-semibold">{item.balance_after}</td>
                      <td className="p-4 text-xs text-gray-600">
                        <div>{item.note}</div>
                        {item.booking_code && (
                          <div className="text-[11px] font-mono text-gray-400 mt-0.5">
                            {item.booking_code}
                          </div>
                        )}
                      </td>
                      <td className="p-4 text-xs text-gray-500 whitespace-nowrap">{item.tanggal}</td>
                      <td className="p-4 text-xs text-gray-400 whitespace-nowrap">
                        {item.expired_at || '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION BUILD-IN */}
        {pagination && pagination.total_pages > 1 && (
          <div className="p-4 border-t border-gray-200 bg-gray-50 flex flex-col sm:flex-row justify-between items-center gap-3">
            <span className="text-xs text-gray-500">
              Menampilkan data <span className="font-semibold">{pagination.from}</span> - <span className="font-semibold">{pagination.to}</span> dari total <span className="font-semibold">{pagination.total}</span> data
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                disabled={pagination.current_page === 1 || loading}
                className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Sebelumnya
              </button>
              
              <span className="text-xs font-medium text-gray-600 px-3 py-1 bg-white border border-gray-200 rounded-lg">
                Halaman {pagination.current_page} dari {pagination.total_pages}
              </span>

              <button
                type="button"
                onClick={() => setPage((prev) => Math.min(prev + 1, pagination.total_pages))}
                disabled={pagination.current_page === pagination.total_pages || loading}
                className="px-3 py-1.5 text-xs font-medium bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Selanjutnya
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
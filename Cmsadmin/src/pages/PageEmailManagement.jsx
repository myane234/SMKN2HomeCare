import React, { useState, useEffect } from "react";
import { emailData } from "../data/emailData";

export default function PageEmailManagement() {
  const [broadcastForm, setBroadcastForm] = useState({
    target_role: "pasien",
    subject: "",
    body: "",
    action_url: "",
    action_text: "",
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      setLoadingLogs(true);
      const res = await emailData.getLogs();
      setLogs(res.data || []);
    } catch (err) {
      console.error("Gagal memuat log email:", err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleBroadcastChange = (e) => {
    setBroadcastForm({
      ...broadcastForm,
      [e.target.name]: e.target.value,
    });
  };

  const handleBroadcastSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await emailData.broadcastEmail(broadcastForm);
      setMessage({ type: "success", text: res.message || "Broadcast email berhasil dikirim!" });
      setBroadcastForm({
        target_role: "pasien",
        subject: "",
        body: "",
        action_url: "",
        action_text: "",
      });
      fetchLogs();
    } catch (err) {
      setMessage({ type: "error", text: err.message || "Terjadi kesalahan saat broadcast" });
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.recipient_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || log.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredLogs.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstItem, indexOfLastItem);

  const renderPaginationNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <button
          key={i}
          onClick={() => setCurrentPage(i)}
          className={`px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors ${
            currentPage === i
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-white border border-gray-200 text-gray-700 hover:bg-gray-50"
          }`}
        >
          {i}
        </button>
      );
    }
    return pages;
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full min-h-screen bg-gray-50 space-y-6">
      {/* Header Halaman Full Width */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manajemen & Broadcast Email</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola pengiriman pesan massal dan pantau riwayat log email.</p>
        </div>
        <button
          onClick={fetchLogs}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
        >
          Muat Ulang Log
        </button>
      </div>

      {/* Notifikasi */}
      {message && (
        <div
          className={`p-4 rounded-xl shadow-sm border flex items-center justify-between ${
            message.type === "success" 
              ? "bg-green-50 border-green-200 text-green-700" 
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          <span className="text-sm font-medium">{message.text}</span>
          <button onClick={() => setMessage(null)} className="text-lg font-bold px-2">&times;</button>
        </div>
      )}

      {/* Form Broadcast */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">Kirim Broadcast Email</h2>
        <form onSubmit={handleBroadcastSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Target Role</label>
              <select
                name="target_role"
                value={broadcastForm.target_role}
                onChange={handleBroadcastChange}
                className="w-full rounded-lg border-gray-300 shadow-sm p-2.5 border focus:ring-2 focus:ring-blue-500 bg-white text-sm"
              >
                <option value="pasien">Pasien</option>
                <option value="nakes">Tenaga Medis (Nakes)</option>
                <option value="admin">Admin</option>
                <option value="all">Semua Pengguna (All)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subjek Email</label>
              <input
                type="text"
                name="subject"
                value={broadcastForm.subject}
                onChange={handleBroadcastChange}
                required
                className="w-full rounded-lg border-gray-300 shadow-sm p-2.5 border focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Contoh: Promo Spesial Akhir Tahun!"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Isi Pesan (Body)</label>
            <textarea
              name="body"
              rows="4"
              value={broadcastForm.body}
              onChange={handleBroadcastChange}
              required
              className="w-full rounded-lg border-gray-300 shadow-sm p-2.5 border focus:ring-2 focus:ring-blue-500 text-sm"
              placeholder="Tulis isi pesan email di sini..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action Text (Opsional)</label>
              <input
                type="text"
                name="action_text"
                value={broadcastForm.action_text}
                onChange={handleBroadcastChange}
                className="w-full rounded-lg border-gray-300 shadow-sm p-2.5 border focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Contoh: Kunjungi Website"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Action URL (Opsional)</label>
              <input
                type="text"
                name="action_url"
                value={broadcastForm.action_url}
                onChange={handleBroadcastChange}
                className="w-full rounded-lg border-gray-300 shadow-sm p-2.5 border focus:ring-2 focus:ring-blue-500 text-sm"
                placeholder="Contoh: https://domainmu.com/promo"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 text-white font-medium px-6 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm text-sm"
            >
              {loading ? "Mengirim Broadcast..." : "Kirim Broadcast Email"}
            </button>
          </div>
        </form>
      </div>

      {/* Tabel Log Email Full Width */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <h2 className="text-lg font-semibold text-gray-800">Riwayat Log Pengiriman Email</h2>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <input
              type="text"
              placeholder="Cari email / subjek..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 border rounded-lg text-sm border-gray-300 focus:ring-2 focus:ring-blue-500 w-full sm:w-64"
            />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 border rounded-lg text-sm border-gray-300 focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="all">Semua Status</option>
              <option value="success">Success / Sent</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>

        {loadingLogs ? (
          <div className="py-12 text-center text-gray-500 text-sm">Memuat data log...</div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg border border-gray-100">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Waktu</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Penerima</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Subjek</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentLogs.length > 0 ? (
                    currentLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {log.recipient_email}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{log.subject}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span
                            className={`px-2.5 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              log.status === "success" || log.status === "sent"
                                ? "bg-green-100 text-green-800" 
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {log.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-sm text-gray-500">
                        Tidak ada riwayat log email yang ditemukan.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex flex-col sm:flex-row items-center justify-between pt-4 gap-4 border-t border-gray-100">
              <span className="text-sm text-gray-500">
                Halaman <strong className="text-gray-700">{currentPage}</strong> dari <strong className="text-gray-700">{totalPages}</strong>
              </span>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3.5 py-1.5 border rounded-lg text-sm bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 font-medium"
                >
                  Sebelumnya
                </button>

                {renderPaginationNumbers()}

                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-3.5 py-1.5 border rounded-lg text-sm bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 font-medium"
                >
                  Selanjutnya
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
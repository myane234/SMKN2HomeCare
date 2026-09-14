import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllChatRooms, getBookingDetail } from '../../data/chatEndpoint';

export default function AdminChatRooms() {
  const navigate = useNavigate();
  const [chatRooms, setChatRooms] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // State Filter (Search, Status, Tanggal, Bulan, Tahun)
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // State Tanggal & Bulan/Tahun
  const [tanggalDari, setTanggalDari] = useState(''); // format 'YYYY-MM-DD'
  const [tanggalSampai, setTanggalSampai] = useState(''); // format 'YYYY-MM-DD'
  const [selectedBulan, setSelectedBulan] = useState(''); // '1' - '12'
  const [selectedTahun, setSelectedTahun] = useState(''); // '2026', dll

  // State untuk pagination client-side
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const loadData = async () => {
      try {
        const rooms = await getAllChatRooms();

        const roomsWithDetails = await Promise.all(
          rooms.map(async (room) => {
            const booking = await getBookingDetail(room.booking_id);

            return {
              ...room,
              booking_code: booking?.booking_code || room.booking_code || '-',
              medical_record_number: booking?.medical_record_number || booking?.record_number || booking?.no_rekam_medis || '-',
              tanggal_kunjungan: booking?.tanggal_kunjungan_raw || room.tanggal || '',
              tanggal_kunjungan_formatted: booking?.tanggal_kunjungan || '',
              jam_kunjungan: booking?.jam_kunjungan || booking?.jam_booking || booking?.waktu || room.jam || '',
              status_booking: booking?.status_booking || booking?.status || room.status || '-'
            };
          })
        );

        setChatRooms(roomsWithDetails);
      } catch (error) {
        console.error('Gagal memuat data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  const handleLihatChat = (bookingId) => {
    navigate(`/chat-rooms/${bookingId}`);
  };

  // Helper shortcut tanggal ("Hari Ini" & "7 Hari")
  const handleSetHariIni = () => {
    const today = new Date().toISOString().split('T')[0];
    setTanggalDari(today);
    setTanggalSampai(today);
    setCurrentPage(1);
  };

  const handleSet7Hari = () => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - 7);
    setTanggalDari(start.toISOString().split('T')[0]);
    setTanggalSampai(end.toISOString().split('T')[0]);
    setCurrentPage(1);
  };

  // Ambil daftar unik status booking untuk dropdown filter
  const uniqueStatuses = useMemo(() => {
    const statuses = chatRooms.map((room) => room.status_booking).filter(Boolean);
    return [...new Set(statuses)];
  }, [chatRooms]);

  // Ambil daftar unik tahun dari data kunjungan raw untuk dropdown tahun
  const uniqueYears = useMemo(() => {
    const years = chatRooms.map((room) => {
      if (!room.tanggal_kunjungan) return null;
      const parts = room.tanggal_kunjungan.split('-');
      return parts.length === 3 ? parts[0] : null;
    }).filter(Boolean);
    return [...new Set(years)].sort((a, b) => b - a);
  }, [chatRooms]);

  if (isLoading) {
    return <div className="p-4 sm:p-6 text-sm sm:text-base">Memuat data ruang chat...</div>;
  }

  // Filter data
  const filteredRooms = chatRooms.filter((room) => {
    const query = searchQuery.toLowerCase();
    const code = (room.booking_code || '').toLowerCase();
    const rm = (room.medical_record_number || '').toLowerCase();
    const patientName = (room.pasien?.name || room.pasien?.nama_lengkap || '').toLowerCase();
    const nakesName = (room.nakes?.name || room.tenaga_medis?.nama_lengkap || '').toLowerCase();

    const matchesSearch = code.includes(query) || rm.includes(query) || patientName.includes(query) || nakesName.includes(query);
    const matchesStatus = statusFilter === '' || room.status_booking === statusFilter;

    // Filter Tanggal Kunjungan (Range)
    let matchesDateRange = true;
    if (room.tanggal_kunjungan) {
      if (tanggalDari && room.tanggal_kunjungan < tanggalDari) matchesDateRange = false;
      if (tanggalSampai && room.tanggal_kunjungan > tanggalSampai) matchesDateRange = false;
    } else if (tanggalDari || tanggalSampai) {
      matchesDateRange = false;
    }

    // Filter Bulan & Tahun Kunjungan
    let matchesBulanTahun = true;
    if (room.tanggal_kunjungan) {
      const parts = room.tanggal_kunjungan.split('-');
      if (parts.length === 3) {
        const [year, month] = parts;
        if (selectedBulan && parseInt(month, 10) !== parseInt(selectedBulan, 10)) {
          matchesBulanTahun = false;
        }
        if (selectedTahun && year !== selectedTahun) {
          matchesBulanTahun = false;
        }
      } else {
        if (selectedBulan || selectedTahun) matchesBulanTahun = false;
      }
    } else {
      if (selectedBulan || selectedTahun) matchesBulanTahun = false;
    }

    return matchesSearch && matchesStatus && matchesDateRange && matchesBulanTahun;
  });

  // Hitung pagination
  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage) || 1;
  const safeCurrentPage = currentPage > totalPages ? 1 : currentPage;
  const startIndex = (safeCurrentPage - 1) * itemsPerPage;
  const currentData = filteredRooms.slice(startIndex, startIndex + itemsPerPage);

  const handlePrev = () => {
    if (safeCurrentPage > 1) setCurrentPage(safeCurrentPage - 1);
  };

  const handleNext = () => {
    if (safeCurrentPage < totalPages) setCurrentPage(safeCurrentPage + 1);
  };

  const daftarBulan = [
    { id: '1', name: 'Januari' },
    { id: '2', name: 'Februari' },
    { id: '3', name: 'Maret' },
    { id: '4', name: 'April' },
    { id: '5', name: 'Mei' },
    { id: '6', name: 'Juni' },
    { id: '7', name: 'Juli' },
    { id: '8', name: 'Agustus' },
    { id: '9', name: 'September' },
    { id: '10', name: 'Oktober' },
    { id: '11', name: 'November' },
    { id: '12', name: 'Desember' },
  ];

  return (
    <div className="w-full min-h-screen p-3 sm:p-6 bg-gray-50">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-800">Monitoring Ruang Chat Pasien & Nakes</h1>
      
      {/* Container Filter & Search Bar Responsif Full Width */}
      <div className="mb-6 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200 space-y-4 w-full">
        {/* Baris Pertama: Search Input & Status Booking */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
          {/* Search Input */}
          <div className="relative w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-gray-400">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <input
              type="text"
              placeholder="Cari kode, RM, pasien, nakes..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2.5 text-sm bg-transparent border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Status Filter Dropdown */}
          <div className="w-full">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
            >
              <option value="">Semua Status Booking</option>
              {uniqueStatuses.map((status, idx) => (
                <option key={idx} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Baris Kedua: Tanggal Dari, Tanggal Sampai, Bulan, Tahun */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-gray-100 w-full">
          {/* Tanggal Dari */}
          <div className="w-full">
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-medium text-gray-500">Tanggal Dari:</label>
              <div className="space-x-1 text-[11px]">
                <button type="button" onClick={handleSetHariIni} className="text-blue-600 hover:underline">Hari Ini</button>
                <span className="text-gray-300">|</span>
                <button type="button" onClick={handleSet7Hari} className="text-blue-600 hover:underline">7 Hari</button>
              </div>
            </div>
            <input
              type="date"
              value={tanggalDari}
              onChange={(e) => {
                setTanggalDari(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Tanggal Sampai */}
          <div className="w-full">
            <label className="block text-xs font-medium text-gray-500 mb-1">Tanggal Sampai:</label>
            <input
              type="date"
              value={tanggalSampai}
              onChange={(e) => {
                setTanggalSampai(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Bulan */}
          <div className="w-full">
            <label className="block text-xs font-medium text-gray-500 mb-1">Bulan:</label>
            <select
              value={selectedBulan}
              onChange={(e) => {
                setSelectedBulan(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
            >
              <option value="">Semua Bulan</option>
              {daftarBulan.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Tahun */}
          <div className="w-full">
            <label className="block text-xs font-medium text-gray-500 mb-1">Tahun:</label>
            <select
              value={selectedTahun}
              onChange={(e) => {
                setSelectedTahun(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
            >
              <option value="">Semua Tahun</option>
              {uniqueYears.map((year) => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabel Responsif Full Width */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden w-full">
        <div className="overflow-x-auto w-full">
          <table className="w-full divide-y divide-gray-200 text-sm text-left">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 sm:px-6 py-3.5 font-semibold text-gray-600 uppercase tracking-wider text-xs">No</th>
                <th className="px-4 sm:px-6 py-3.5 font-semibold text-gray-600 uppercase tracking-wider text-xs">Booking Code</th>
                <th className="px-4 sm:px-6 py-3.5 font-semibold text-gray-600 uppercase tracking-wider text-xs">No.Rekam Medis</th>
                <th className="px-4 sm:px-6 py-3.5 font-semibold text-gray-600 uppercase tracking-wider text-xs">Nama Pasien</th>
                <th className="px-4 sm:px-6 py-3.5 font-semibold text-gray-600 uppercase tracking-wider text-xs">Nama Nakes</th>
                <th className="px-4 sm:px-6 py-3.5 font-semibold text-gray-600 uppercase tracking-wider text-xs">Jadwal Kunjungan</th>
                <th className="px-4 sm:px-6 py-3.5 font-semibold text-gray-600 uppercase tracking-wider text-xs">Status Booking</th>
                <th className="px-4 sm:px-6 py-3.5 font-semibold text-gray-600 uppercase tracking-wider text-xs">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {currentData.length > 0 ? (
                currentData.map((room, index) => {
                  const displayTanggal = room.tanggal_kunjungan_formatted || room.tanggal_kunjungan;
                  const combinedJadwal = [displayTanggal, room.jam_kunjungan].filter(Boolean).join(' - ') || '-';
                  const pasienName = room.pasien?.name || room.pasien?.nama_lengkap || 'Tidak ada nama';
                  const nakesName = room.nakes?.name || room.tenaga_medis?.nama_lengkap || '-';

                  return (
                    <tr key={room.booking_id || room.id_booking || index} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-500 text-xs sm:text-sm">
                        {startIndex + index + 1}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap font-medium text-gray-900 text-xs sm:text-sm">
                        {room.booking_code}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-500 text-xs sm:text-sm">
                        {room.medical_record_number}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-500 text-xs sm:text-sm">
                        {pasienName}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-500 text-xs sm:text-sm">
                        {nakesName}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-gray-500 text-xs sm:text-sm">
                        {combinedJadwal}
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm">
                        <span className="px-2.5 py-1 inline-flex leading-4 font-semibold rounded-full bg-blue-100 text-blue-800">
                          {room.status_booking}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-xs sm:text-sm font-medium">
                        <button 
                          onClick={() => handleLihatChat(room.booking_id || room.id_booking)}
                          className="text-blue-600 hover:text-blue-900 transition-colors font-medium cursor-pointer"
                        >
                          Lihat Chat
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-sm text-gray-500">
                    Tidak ada data yang cocok ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Responsif Full Width */}
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-4 bg-white border-t border-gray-200 gap-3 w-full">
          <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
            Halaman <span className="font-medium text-gray-700">{safeCurrentPage}</span> dari <span className="font-medium text-gray-700">{totalPages}</span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handlePrev}
              disabled={safeCurrentPage === 1}
              className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg border transition-colors ${
                safeCurrentPage === 1
                  ? 'bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 cursor-pointer'
              }`}
            >
              ← Sebelumnya
            </button>
            <button
              className="px-3.5 py-2 text-xs sm:text-sm font-medium text-white bg-emerald-600 rounded-lg shadow-sm"
            >
              {safeCurrentPage}
            </button>
            <button
              onClick={handleNext}
              disabled={safeCurrentPage === totalPages}
              className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg border transition-colors ${
                safeCurrentPage === totalPages
                  ? 'bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 cursor-pointer'
              }`}
            >
              Selanjutnya →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
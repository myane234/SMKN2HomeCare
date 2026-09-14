import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getManageChatRoomDetail } from '../../data/chatEndpoint';

export default function AdminChatDetail() {
  const { id: bookingId } = useParams();
  const navigate = useNavigate();
  
  const [chatRoom, setChatRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const socketRef = useRef(null);

  // 1. Ambil riwayat chat lama dari database
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        setIsLoading(true);
        const data = await getManageChatRoomDetail(bookingId);
        
        if (data) {
          setChatRoom(data.room_info);
          setMessages(data.messages || []);
        }
      } catch (error) {
        console.error('Gagal memuat riwayat chat:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (bookingId) {
      fetchChatHistory();
    }
  }, [bookingId]);

  // 2. Hubungkan WebSocket khusus untuk memantau pesan baru secara real-time
  useEffect(() => {
    const wsUrl = `ws://192.168.18.12:8088/ws?booking_id=${bookingId}`;
    socketRef.current = new WebSocket(wsUrl);

    socketRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data && data.content) {
          setMessages((prev) => [...prev, data]);
        }
      } catch (e) {
        console.error('Gagal parse pesan WS:', e);
      }
    };

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
  }, [bookingId]);

  return (
    <div className="w-full min-h-screen p-3 sm:p-6 bg-gray-50 flex flex-col">
      <div className="flex items-center justify-between mb-4 bg-white p-4 rounded-2xl shadow-sm border">
        <button
          onClick={() => navigate('/chat-rooms')}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200"
        >
          ← Kembali
        </button>
        <h2 className="text-base font-bold text-gray-800">
          Monitoring Chat Booking ID: {bookingId}
        </h2>
      </div>

      <div className="flex-1 bg-white rounded-2xl shadow-sm border p-4 flex flex-col h-[650px]">
        {isLoading ? (
          <div className="h-full flex items-center justify-center text-gray-400">Memuat riwayat chat...</div>
        ) : (
          <>
            {/* Box Informasi Ringkas */}
            <div className="bg-gray-50 p-3 rounded-xl mb-3 text-sm grid grid-cols-3 gap-2">
              <div><span className="text-xs text-gray-400 block">Kode</span> {chatRoom?.booking_code}</div>
              <div><span className="text-xs text-gray-400 block">Pasien</span> {chatRoom?.pasien?.name}</div>
              <div><span className="text-xs text-gray-400 block">Nakes</span> {chatRoom?.nakes?.name || '-'}</div>
            </div>

            {/* Daftar Pesan (Read-Only / Monitoring) */}
            <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-gray-50/50 rounded-xl border border-dashed">
              {messages.length > 0 ? (
                messages.map((msg, idx) => {
                  // Jika dikirim oleh pasien/user -> Di kiri (bubble putih)
                  // Jika dikirim oleh nakes/dokter -> Di kanan (bubble biru)
                  const isPatient = 
                    msg.sender_type === 'pasien' || 
                    msg.sender_type === 'patient' || 
                    msg.sender_type === 'user';

                  return (
                    <div key={idx} className={`flex flex-col ${isPatient ? 'items-start' : 'items-end'}`}>
                      <span className="text-[10px] text-gray-400 mb-0.5">
                        {msg.sender_name || msg.sender_type}
                      </span>
                      <div className={`px-4 py-2 rounded-2xl text-sm max-w-md ${
                        isPatient 
                          ? 'bg-white text-gray-800 border' 
                          : 'bg-blue-600 text-white'
                      }`}>
                        {msg.content}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400 text-sm italic">
                  Belum ada riwayat pesan.
                </div>
              )}
            </div>

            {/* Indikator Status Read-Only */}
            <div className="pt-3 mt-2 border-t text-center text-xs text-gray-400 italic">
              Mode Monitoring: Admin hanya dapat memantau percakapan.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
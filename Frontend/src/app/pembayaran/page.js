'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FiArrowLeft, 
  FiCopy, 
  FiCheckCircle,
  FiCreditCard
} from 'react-icons/fi';
import api from '@/services/api';

export default function PaymentQRPage() {
  const router = useRouter();
  
  const [orderId, setOrderId] = useState('');
  const [amount, setAmount] = useState(175000);
  const [bookingId, setBookingId] = useState('45');
  const [metode, setMetode] = useState('qris');
  
  const [paymentData, setPaymentData] = useState(null);
  const [isLoadingApi, setIsLoadingApi] = useState(true);
  const [apiError, setApiError] = useState('');
  const [fixedQrUrl, setFixedQrUrl] = useState('');

  const [expiredAt, setExpiredAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [copiedVA, setCopiedVA] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState(false);

  // Ambil parameter langsung dari URL browser (Aman dari masalah Suspense Next.js)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const metodeParam = params.get('metode') || 'qris';
    const bookingParam = params.get('booking_id') || '45';
    const totalParam = parseInt(params.get('total')) || 175000;
    
    setMetode(metodeParam);
    setBookingId(bookingParam);
    setAmount(totalParam);

    const fetchPaymentInfo = async () => {
      try {
        setIsLoadingApi(true);
        setApiError('');

        console.log("MENGIRIM REQUEST KE BACKEND DENGAN ID:", bookingParam);

        const response = await api.post('/api/booking/charge', {
          id_booking: bookingParam,
          payment_type: metodeParam,
          total: totalParam,
          amount: totalParam,
          gross_amount: totalParam,
          transaction_details: {
            gross_amount: totalParam,
            order_id: `INV-${bookingParam}-${Date.now().toString().slice(-6)}`
          }
        });
        
        console.log("ISI RESPON BACKEND:", response.data);

        const resData = response.data.data || response.data;
        setPaymentData(resData);
        
        const extractedUrl = 
          resData?.actions?.[0]?.url || 
          resData?.qr_url || 
          resData?.payment_details?.qris?.qr_url || 
          resData?.qris_url ||
          resData?.url || 
          resData?.actions?.[0]?.qr_image_url ||
          '';

        if (extractedUrl) {
          setFixedQrUrl(extractedUrl);
        }
        
        const currentOrderId = resData.order_id || `INV-${bookingParam}-${Date.now().toString().slice(-6)}`;
        setOrderId(currentOrderId);

        if (resData.gross_amount || resData.jumlah_total) {
          setAmount(parseFloat(resData.gross_amount || resData.jumlah_total));
        }
        
        const expiryTime = resData.expiry_time || resData.expired_at ? new Date(resData.expiry_time || resData.expired_at) : new Date(Date.now() + 15 * 60 * 1000);
        setExpiredAt(expiryTime);

      } catch (err) {
        console.error('Gagal mengambil data dari server:', err);
        setApiError('Gagal memproses pembayaran ke server: ' + (err.response?.data?.message || err.message));
      } finally {
        setIsLoadingApi(false);
      }
    };

    fetchPaymentInfo();
  }, []);

  // Timer Countdown Mundur
  useEffect(() => {
    if (!expiredAt) return;
    
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiredAt).getTime();
      const diff = Math.max(0, Math.floor((expiry - now) / 1000));
      setTimeLeft(diff);
      
      if (diff === 0 && orderId) {
        router.push(`/pembayaran/payment-confirmation/pending?order_id=${orderId}&status=expired`);
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [expiredAt, orderId, router]);

  // Polling berkala untuk cek status pembayaran ke backend (Success / Pending)
  useEffect(() => {
    if (!orderId) return;

    const checkPaymentStatus = async () => {
      try {
        const res = await api.get(`/api/booking/status?order_id=${orderId}`);
        const statusData = res.data.data || res.data;
        const transactionStatus = statusData.transaction_status || statusData.status;

        if (
          transactionStatus === 'settlement' || 
          transactionStatus === 'success' || 
          transactionStatus === 'paid'
        ) {
          router.push(`/pembayaran/payment-confirmation/success?order_id=${orderId}`);
        } else if (
          transactionStatus === 'expire' || 
          transactionStatus === 'cancelled' ||
          transactionStatus === 'failure'
        ) {
          router.push(`/pembayaran/payment-confirmation/pending?order_id=${orderId}&status=expired`);
        }
      } catch (err) {
        console.error('Gagal mengecek status pembayaran:', err);
      }
    };

    const statusInterval = setInterval(checkPaymentStatus, 5000);
    return () => clearInterval(statusInterval);
  }, [orderId, router]);

  const methods = {
    qris: { name: 'QRIS', isQr: true },
    gopay: { name: 'GoPay', isQr: true },
    dana: { name: 'DANA', isQr: true },
    shopeepay: { name: 'ShopeePay', isQr: true },
    bca_va: { name: 'BCA Virtual Account', isQr: false },
    bri_va: { name: 'BRI Virtual Account', isQr: false }
  };

  const method = methods[metode] || methods.qris;
  
  const qrString = 
    paymentData?.qr_string || 
    paymentData?.uri || 
    paymentData?.actions?.[0]?.qr_string ||
    orderId || 
    bookingId || 
    'SmartHomeCare';
  
  const qrImageUrl = fixedQrUrl || `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrString)}`;
  const virtualAccountNumber = paymentData?.payment_details?.virtual_account?.va_number || paymentData?.virtual_number || '';

  const formatRupiah = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleCopyVA = async () => {
    try {
      await navigator.clipboard.writeText(virtualAccountNumber);
      setCopiedVA(true);
      setTimeout(() => setCopiedVA(false), 2000);
    } catch (err) {
      console.error('Gagal copy:', err);
    }
  };

  const handleCopyOrderId = async () => {
    try {
      await navigator.clipboard.writeText(orderId);
      setCopiedOrderId(true);
      setTimeout(() => setCopiedOrderId(false), 2000);
    } catch (err) {
      console.error('Gagal copy:', err);
    }
  };

  const handleBack = () => {
    router.push(`/pembayaran/pilih-metode?booking_id=${bookingId}&total=${amount}`);
  };

  if (isLoadingApi) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat detail pembayaran dari server...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBack}
              className="p-2 hover:bg-slate-100 rounded-full transition"
            >
              <FiArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <h1 className="text-lg font-bold text-slate-800">Detail Pembayaran</h1>
          </div>
        </div>
      </div>

      {apiError && (
        <div className="max-w-5xl mx-auto px-4 mt-4">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
            {apiError}
          </div>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 md:px-12 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-6">QR / VA Payment</h2>
              
              {method.isQr ? (
                <div className="flex flex-col items-center">
                  <div className="w-56 h-56 bg-white rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300 p-2 shadow-inner">
                    <img 
                      src={qrImageUrl} 
                      alt="QR Code Pembayaran" 
                      className="w-full h-full object-contain" 
                    />
                  </div>
                  <p className="text-sm text-gray-500 mt-4 flex items-center gap-2">
                    <FiCreditCard className="w-4 h-4" /> Scan QR Code untuk membayar
                  </p>
                </div>
              ) : (
                <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                  <p className="text-sm text-gray-600 mb-2">Nomor Virtual Account</p>
                  <div className="flex items-center justify-between gap-4">
                    <code className="text-xl md:text-2xl font-mono font-bold text-blue-700 tracking-wider">
                      {virtualAccountNumber || 'Nomor VA tidak tersedia'}
                    </code>
                    <button
                      onClick={handleCopyVA}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                        copiedVA ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                      }`}
                    >
                      {copiedVA ? <><FiCheckCircle className="w-4 h-4" /><span>Disalin</span></> : <><FiCopy className="w-4 h-4" /><span>Salin</span></>}
                    </button>
                  </div>
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-gray-100 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Order ID</span>
                  <button
                    onClick={handleCopyOrderId}
                    className="group flex items-center gap-1.5 font-mono text-gray-800 hover:text-blue-600 transition-colors"
                  >
                    <span>{orderId}</span>
                    {copiedOrderId ? <FiCheckCircle className="w-3.5 h-3.5 text-green-600" /> : <FiCopy className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100" />}
                  </button>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Total Pembayaran</span>
                  <span className="text-xl font-bold text-gray-900">{formatRupiah(amount)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-800 mb-4">Status Pembayaran</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Status</span>
                  <span className="text-sm font-medium text-blue-600">Menunggu Pembayaran</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Metode</span>
                  <span className="text-sm font-medium text-gray-800">{method.name}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Expired</span>
                  <span className="text-sm font-mono font-medium text-red-500">{formatCountdown(timeLeft)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
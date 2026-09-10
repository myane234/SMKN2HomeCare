"use client";

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { 
  FiArrowLeft, 
  FiCopy, 
  FiCheckCircle,
  FiCreditCard,
  FiAlertCircle
} from 'react-icons/fi';
import api from '@/services/api';

function PaymentQRContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Ambil parameter URL secara langsung
  const rawMetodeParam = searchParams.get('metode') || '';
  const metodeParam = rawMetodeParam === 'bank_transfer'
    ? rawMetodeParam
    : rawMetodeParam.replace(/_(va|transfer)$/, '');
  const bookingParam = searchParams.get('booking_id') || '';
  const urlTotalParam = parseInt(searchParams.get('total') || searchParams.get('price') || '0', 10);

  const getInitialAmount = () => {
    if (urlTotalParam > 0) return urlTotalParam;

    if (typeof window !== 'undefined') {
      try {
        const savedBooking = localStorage.getItem('last_booking') || localStorage.getItem('pending_order') || localStorage.getItem('cart_checkout');
        if (savedBooking) {
          const parsed = JSON.parse(savedBooking);
          const storageTotal = Number(parsed.jumlah_total || parsed.total || parsed.price || parsed.amount || parsed.gross_amount);
          if (storageTotal > 0) return storageTotal;
        }
      } catch (err) {
        console.error("Gagal membaca storage:", err);
      }
    }
    return 0;
  };

  const [orderId, setOrderId] = useState('');
  const [amount, setAmount] = useState(getInitialAmount);
  const [bookingId, setBookingId] = useState(bookingParam);
  const [metode, setMetode] = useState(metodeParam);
  
  const [paymentData, setPaymentData] = useState(null);
  const [isLoadingApi, setIsLoadingApi] = useState(true);
  const [apiError, setApiError] = useState('');

  const [statusText, setStatusText] = useState('Menunggu Pembayaran');
  const [fixedQrUrl, setFixedQrUrl] = useState('');

  const [expiredAt, setExpiredAt] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isExpired, setIsExpired] = useState(false);
  const [copiedVA, setCopiedVA] = useState(false);
  const [copiedOrderId, setCopiedOrderId] = useState(false);
  const [virtualAccountNumber, setVirtualAccountNumber] = useState('');
  const paymentRequestRef = useRef('');

  useEffect(() => {
    const requestKey = `${bookingParam}:${metodeParam}:${urlTotalParam}`;
    if (paymentRequestRef.current === requestKey) return;
    paymentRequestRef.current = requestKey;

    // Prioritaskan nominal dari URL
    const finalAmount = urlTotalParam > 0 ? urlTotalParam : amount;
    if (urlTotalParam > 0) {
      setAmount(urlTotalParam);
    }

    if (!bookingParam) {
      setIsLoadingApi(false);
      setApiError('Parameter booking_id tidak ditemukan pada URL.');
      return;
    }

    const fetchPaymentInfo = async () => {
      try {
        setIsLoadingApi(true);
        setApiError('');

        if (!finalAmount || finalAmount <= 0) {
          throw new Error('Jumlah total pembayaran tidak ditemukan.');
        }

        const bankList = ['bca', 'bri', 'bni', 'seabank'];
        const isBankTransfer = bankList.includes(metodeParam);
        const backendPaymentType = isBankTransfer ? 'bank_transfer' : metodeParam;

        const payload = {
          id_booking: bookingParam,
          payment_type: backendPaymentType,
          total: finalAmount,
          amount: finalAmount,
          gross_amount: finalAmount,
        };

        if (isBankTransfer) {
          payload.bank_transfer = {
            bank: metodeParam
          };
        }

        if (metodeParam === 'gopay') {
          payload.gopay = {
            enable_callback: true,
            callback_url: `${window.location.origin}/pembayaran/payment-confirmation/success?booking_id=${bookingParam}`
          };
        }
        
        if (metodeParam === 'shopeepay') {
          payload.shopeepay = {
            callback_url: `${window.location.origin}/pembayaran/payment-confirmation/success?booking_id=${bookingParam}`
          };
        }

        if (metodeParam === 'dana') {
          payload.dana = {};
        }

        // 1. Hit charge untuk inisiasi pembayaran ke Midtrans
        const response = await api.post('/api/booking/charge', payload);
        const responseBody = response.data || {};
        const resData = responseBody.data || responseBody;
        
        const vaNumber = resData?.va_numbers?.[0]?.va_number
          || responseBody?.va_numbers?.[0]?.va_number
          || resData?.payment_details?.virtual_account?.va_number
          || resData?.va_number
          || resData?.virtual_number
          || '';
          
        setPaymentData(resData);
        setVirtualAccountNumber(String(vaNumber));
        
        if (urlTotalParam && urlTotalParam > 0) {
          setAmount(urlTotalParam);
        } else {
          const apiTotal = Number(resData?.jumlah_total || resData?.gross_amount || resData?.total || resData?.amount);
          if (apiTotal && apiTotal > 0) {
            setAmount(apiTotal);
          }
        }

        const appDeeplinkUrl = resData?.actions?.find(action => action.name === 'deeplink-redirect')?.url || '';
        const webRedirectUrl = 
          resData?.actions?.[0]?.url || 
          resData?.qr_url || 
          resData?.payment_details?.qris?.qr_url || 
          resData?.qris_url ||
          resData?.url || 
          resData?.actions?.[0]?.qr_image_url ||
          resData?.actions?.[1]?.url ||
          '';

        const finalDeeplink = appDeeplinkUrl || webRedirectUrl;
        if (finalDeeplink) {
          setFixedQrUrl(finalDeeplink);
        }
        
        // 2. Ambil booking_code asli dari getPaymentDetails untuk ditampilkan di UI
        // 2. Ambil booking_code dan metode pembayaran asli dari getPaymentDetails untuk ditampilkan di UI
        try {
          const detailRes = await api.get(`/api/booking/${bookingParam}/payment-details`);
          const detailData = detailRes.data?.data || detailRes.data;
          
          if (detailData?.booking_code) {
            setOrderId(detailData.booking_code); // Menampilkan booking_code yang bersih
          } else {
            setOrderId(resData?.order_id || bookingParam);
          }
          
          if (detailData?.status_transaksi) {
            setStatusText(detailData.status_transaksi);
          }

          // Sinkronkan juga metode pembayaran jika tersedia dari backend
          if (detailData?.metode_pembayaran) {
            setMetode(detailData.metode_pembayaran.toLowerCase());
          }
        } catch (detailErr) {
          console.error('Gagal mengambil detail tambahan:', detailErr);
          setOrderId(resData?.order_id || bookingParam);
        }
        
        setBookingId(bookingParam);
        
        const expiryTime = resData.expiry_time || resData.expired_at ? new Date(resData.expiry_time || resData.expired_at) : new Date(Date.now() + 5 * 60 * 1000);
        setExpiredAt(expiryTime);

      } catch (err) {
        console.error('Gagal mengambil data dari server:', err);
        setApiError('Gagal memproses pembayaran ke server: ' + (err.response?.data?.message || err.message));
      } finally {
        setIsLoadingApi(false);
      }
    };
    fetchPaymentInfo();
  }, [bookingParam, metodeParam, urlTotalParam]);

  useEffect(() => {
    if (!expiredAt) return;
    
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const expiry = new Date(expiredAt).getTime();
      const diff = Math.max(0, Math.floor((expiry - now) / 1000));
      setTimeLeft(diff);
      
      if (diff === 0) {
        setIsExpired(true);
        setStatusText('Waktu Pembayaran Habis');
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [expiredAt]);

  useEffect(() => {
    if (!bookingId || !orderId || isExpired) return;

    const checkPaymentStatus = async () => {
      try {
        const res = await api.get(`/api/booking/${bookingId}/payment-details`);
        const responseBody = res.data.data || res.data;
        
        const statusTransaksi = responseBody?.status_transaksi || 'Menunggu Pembayaran';
        setStatusText(statusTransaksi);
        
        const lowerStatus = statusTransaksi.toLowerCase();

        if (
          lowerStatus.includes('sudah bayar') || 
          lowerStatus.includes('success') || 
          lowerStatus.includes('paid') ||
          lowerStatus.includes('settlement') ||
          lowerStatus.includes('lunas')
        ) {
          router.push(`/pembayaran/payment-confirmation/success?booking_id=${bookingId}&order_id=${orderId}&total=${amount}`);
        }
      } catch (err) {
        console.error('Gagal mengecek status pembayaran:', err);
      }
    };

    const statusInterval = setInterval(checkPaymentStatus, 5000);
    return () => clearInterval(statusInterval);
  }, [bookingId, orderId, router, amount, isExpired]);

  const methods = {
    qris: { name: 'QRIS', type: 'qr' },
    gopay: { name: 'GoPay', type: 'qr' },
    shopeepay: { name: 'ShopeePay', type: 'redirect' },
    dana: { name: 'Dana', type: 'redirect' },
    bank_transfer: { name: 'Bank Transfer', type: 'va' },
    bca: { name: 'BCA Virtual Account', type: 'va', bank: 'bca' },
    bri: { name: 'BRI Virtual Account', type: 'va', bank: 'bri' },
    bni: { name: 'BNI Virtual Account', type: 'va', bank: 'bni' },
    seabank: { name: 'SeaBank Virtual Account', type: 'va', bank: 'seabank' },
  };
  const method = methods[metode] || { name: metode ? metode.toUpperCase() : 'Pembayaran', type: 'qr' };
  
  const qrString = 
    paymentData?.qr_string || 
    paymentData?.uri || 
    paymentData?.actions?.[0]?.qr_string ||
    '';
  
  const qrImageUrl = fixedQrUrl && method.type === 'qr' ? fixedQrUrl : (qrString ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(qrString)}` : '');
  
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
    if (!virtualAccountNumber || isExpired) return;
    try {
      await navigator.clipboard.writeText(virtualAccountNumber);
      setCopiedVA(true);
      setTimeout(() => setCopiedVA(false), 2000);
    } catch (err) {
      console.error('Gagal copy:', err);
    }
  };

  const handleCopyOrderId = async () => {
    if (!orderId) return;
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

  const handleBackToCart = () => {
    router.push('/keranjang');
  };

  const handlePesanLayanan = () => {
    router.push('/pesan-layanan');
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 relative overflow-hidden">
              
              {isExpired && (
                <div className="absolute inset-0 bg-white/95 backdrop-blur-xs z-10 flex flex-col items-center justify-center text-center p-6">
                  <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-4 shadow-sm">
                    <FiAlertCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Waktu Pembayaran Telah Habis</h3>
                  <p className="text-sm text-gray-600 max-w-md mb-6">
                    Batas waktu pembayaran untuk pesanan ini telah kedaluwarsa. Silakan pilih opsi di bawah untuk membuat pesanan baru.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 w-full max-w-xs">
                    <button
                      onClick={handleBackToCart}
                      className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition"
                    >
                      Ke Keranjang
                    </button>
                    <button
                      onClick={handlePesanLayanan}
                      className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-md transition"
                    >
                      Pesan Layanan
                    </button>
                  </div>
                </div>
              )}

              <h2 className="text-lg font-semibold text-gray-800 mb-6">{method.name} Payment</h2>
              
              {method.type === 'qr' && !virtualAccountNumber ? (
                <div className="flex flex-col items-center">
                  <div className="w-56 h-56 bg-white rounded-xl flex items-center justify-center border-2 border-dashed border-gray-300 p-2 shadow-inner">
                    {qrImageUrl ? (
                      <img 
                        src={qrImageUrl} 
                        alt="QR Code Pembayaran" 
                        className="w-full h-full object-contain" 
                      />
                    ) : (
                      <span className="text-xs text-slate-400 text-center">QR Code belum tersedia</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-4 flex items-center gap-2">
                    <FiCreditCard className="w-4 h-4" /> Scan QR Code untuk membayar
                  </p>
                </div>
              ) : method.type === 'redirect' && !virtualAccountNumber ? (
                <div className="flex flex-col items-center text-center py-6">
                  <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-4 shadow-sm">
                    <FiCreditCard className="w-8 h-8" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mb-2">Lanjutkan Pembayaran via {method.name}</h3>
                  <p className="text-sm text-gray-600 max-w-sm mb-6">
                    Klik tombol di bawah untuk membuka aplikasi {method.name} secara otomatis di perangkatmu.
                  </p>
                  {fixedQrUrl ? (
                    <button
                      type="button"
                      onClick={() => {
                        window.location.href = fixedQrUrl;
                      }}
                      className="w-full max-w-xs py-3 px-6 bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-xl shadow-md transition text-center inline-block cursor-pointer"
                    >
                      Buka {method.name} & Bayar
                    </button>
                  ) : (
                    <span className="text-xs text-slate-400">Link pembayaran sedang dimuat...</span>
                  )}
                </div>
              ) : (
                <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                  <p className="text-sm text-gray-600 mb-2">Nomor Virtual Account</p>
                  <div className="flex items-center justify-between gap-4">
                    <code className="text-xl md:text-2xl font-mono font-bold text-blue-700 tracking-wider">
                      {virtualAccountNumber || 'Nomor VA tidak tersedia'}
                    </code>
                    {virtualAccountNumber && (
                      <button
                        onClick={handleCopyVA}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                          copiedVA ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        }`}
                      >
                        {copiedVA ? <><FiCheckCircle className="w-4 h-4" /><span>Disalin</span></> : <><FiCopy className="w-4 h-4" /><span>Salin</span></>}
                      </button>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-8 pt-6 border-t border-gray-100 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Booking ID</span>
                  <button
                    onClick={handleCopyOrderId}
                    className="group flex items-center gap-1.5 font-mono text-gray-800 hover:text-blue-600 transition-colors"
                  >
                    <span>{orderId || '-'}</span>
                    {orderId && (
                      copiedOrderId ? <FiCheckCircle className="w-3.5 h-3.5 text-green-600" /> : <FiCopy className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100" />
                    )}
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
                  <span className={`text-sm font-medium ${isExpired ? 'text-red-500' : 'text-blue-600'}`}>{statusText}</span>
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

export default function PaymentQRPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Memuat halaman pembayaran...</p>
        </div>
      </div>
    }>
      <PaymentQRContent />
    </Suspense>
  );
}
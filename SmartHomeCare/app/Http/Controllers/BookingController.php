<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Layanan;
use App\Models\TenagaMedis;
use App\Models\Transaksi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Midtrans\Config as MidtransConfig;
use Midtrans\Snap as MidtransSnap;

class BookingController extends Controller
{
    /**
     * API Pasien: Menampilkan daftar booking milik pasien yang sedang login.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $pasien = $user?->pasien;

        if (!$pasien) {
            return response()->json([
                'success' => false,
                'message' => 'User pasien tidak ditemukan.',
                'data' => []
            ], 404);
        }

        $bookings = Booking::with(['pasien', 'layanan', 'tenagaMedis', 'transaksi'])
            ->where('id_pasien', $pasien->id_pasien)
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar booking pasien',
            'data' => $bookings
        ]);
    }

    /**
     * API Admin: Menampilkan SELURUH booking dari semua pasien untuk kebutuhan Admin.
     */
    public function adminIndex(Request $request)
    {
        $bookings = Booking::with(['pasien', 'layanan', 'tenagaMedis', 'transaksi'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Daftar booking admin',
            'data' => $bookings
        ]);
    }

    /**
     * API Pasien: Membuat booking baru + Generate Snap Token Midtrans.
     */
    public function store(Request $request)
    {
        if ($request->has('payment_type')) {
            return $this->charge($request);
        }

        $validate = $request->validate([
            'id_layanan' => 'required',
            'id_tenaga_medis' => 'nullable',
            'tanggal_kunjungan' => 'required|date',
            'jam_kunjungan' => 'required',
            'alamat_kunjungan' => 'nullable|string',
            'latitude_kunjungan' => 'required|numeric',
            'longitude_kunjungan' => 'required|numeric',
            'catatan' => 'nullable|string',
            'id_promo' => 'nullable',
        ]);

        $user = $request->user();
        $pasien = $user?->pasien;

        if (!$pasien) {
            return response()->json([
                'success' => false,
                'message' => 'User pasien tidak ditemukan.'
            ], 403);
        }

        $alamatKunjungan = $request->input('alamat_kunjungan') ?? $pasien->alamat_utama ?? null;
        if (empty($alamatKunjungan)) {
            return response()->json([
                'success' => false,
                'message' => 'Alamat kunjungan wajib diisi. Isi alamat pasien terlebih dahulu.'
            ], 422);
        }

        // Pengaman: Ambil nilai tunggal jika dikirim sebagai array oleh frontend
        $idLayanan = is_array($validate['id_layanan']) ? ($validate['id_layanan'][0] ?? null) : $validate['id_layanan'];
        $layanan = Layanan::with('masterTarif.bhpItems')->findOrFail($idLayanan);
        
        $tenagaMedisId = $validate['id_tenaga_medis'] ?? null;
        if (is_array($tenagaMedisId)) {
            $tenagaMedisId = $tenagaMedisId[0] ?? null;
        }

        if (!$tenagaMedisId) {
            $tenagaMedisId = TenagaMedis::where('status', 'approved')->value('id_tenaga_medis')
                   ?? TenagaMedis::value('id_tenaga_medis');
        }

        if (!$tenagaMedisId) {
            return response()->json([
                'success' => false,
                'message' => 'Tenaga medis belum tersedia untuk booking.'
            ], 422);
        }

        $tenagaMedis = TenagaMedis::findOrFail($tenagaMedisId);

        // 1. Hitung Jarak (Haversine)
        $distance = 0;
        if ($tenagaMedis->latitude && $tenagaMedis->longitude) {
            $lat1 = (float) $tenagaMedis->latitude;
            $lon1 = (float) $tenagaMedis->longitude;
            $lat2 = (float) $validate['latitude_kunjungan'];
            $lon2 = (float) $validate['longitude_kunjungan'];

            $earthRadius = 6371; // km
            $dLat = deg2rad($lat2 - $lat1);
            $dLon = deg2rad($lon2 - $lon1);
            $a = sin($dLat / 2) * sin($dLat / 2) + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLon / 2) * sin($dLon / 2);
            $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
            $distance = $earthRadius * $c; // in km
        }

        // 2. Load Template Master Tarif
        $masterTarif = $layanan->masterTarif;
        
        // SL = Tarif Layanan
        $sl = (float) $layanan->harga;
        
        // SB = Tarif BHP
        $sb = 0;
        $hppBhp = 0;
        if ($masterTarif && $masterTarif->bhpItems) {
            foreach ($masterTarif->bhpItems as $bhpItem) {
                $itemCost = (float) $bhpItem->harga_satuan * (int) ($bhpItem->pivot->jumlah_pakai ?? 1);
                $sb += $itemCost;
                $hppBhp += $itemCost;
            }
        }
        
        // ST = Tarif Transport
        $tarifTransportPerKm = $masterTarif ? (float) $masterTarif->tarif_transport_per_km : 0.0;
        $st = 0.0;
        if (!$layanan->include_transport && $distance > 0) {
            $st = $distance * $tarifTransportPerKm;
        }
        
        // BA = Biaya Admin
        $ba = $masterTarif ? (float) $masterTarif->biaya_admin : 0.0;
        
        // PPN
        $persenPpn = $masterTarif ? (float) $masterTarif->persentase_ppn : 0.0;
        $ppn = ($sl + $sb + $st) * ($persenPpn / 100);
        
        // TOTAL Pasien Bayar (Midtrans)
        $total = $sl + $sb + $st + $ba + $ppn;
        
        // Bagi Hasil
        $persenFeeNakesRaw = $masterTarif ? (float) $masterTarif->fee_nakes_persen : 0.0;
        $persenFeeNakes = $persenFeeNakesRaw / 100;
        $hakNakes = ($sl * $persenFeeNakes) + $st;
        
        $feeMidtrans = (float) env('FEE_MIDTRANS', 4000.0);
        $profitHc = ($sl * (1 - $persenFeeNakes)) + $sb + $ba - $feeMidtrans - $hppBhp;

        $idPromo = $validate['id_promo'] ?? null;
        if (is_array($idPromo)) {
            $idPromo = $idPromo[0] ?? null;
        }

        DB::beginTransaction();

        try {
            $prefix = 'B-' . date('ymd'); // Menghasilkan "B-260728"
            $todayCount = Booking::whereDate('created_at', now()->toDateString())->count();
            $nextSequence = $todayCount + 1; 
            $bookingCode = $prefix . str_pad($nextSequence, 7, '0', STR_PAD_LEFT);

            $booking = Booking::create([
                'booking_code' => $bookingCode,
                'id_pasien' => $pasien->id_pasien,
                'id_layanan' => $layanan->id_layanan,
                'id_tenaga_medis' => $tenagaMedisId,
                'id_promo' => $idPromo,
                'tanggal_kunjungan' => $validate['tanggal_kunjungan'],
                'jam_kunjungan' => $validate['jam_kunjungan'],
                'alamat_kunjungan' => $alamatKunjungan,
                'latitude_kunjungan' => $validate['latitude_kunjungan'],
                'longitude_kunjungan' => $validate['longitude_kunjungan'],
                'status_booking' => 'Pending',
            ]);

            $transaction = Transaksi::create([
                'id_booking' => $booking->id_booking,
                'jumlah_total' => $total,
                'metode_pembayaran' => 'QRIS',
                'status_transaksi' => 'Belum Bayar',
                'sl' => $sl,
                'sb' => $sb,
                'st' => $st,
                'ba' => $ba,
                'ppn' => $ppn,
                'persen_ppn' => $persenPpn,
                'persen_fee_nakes' => $persenFeeNakesRaw,
                'fee_midtrans' => $feeMidtrans,
                'hpp_bhp' => $hppBhp,
                'hak_nakes' => $hakNakes,
                'profit_hc' => $profitHc,
            ]);

            MidtransConfig::$serverKey = config('services.midtrans.server_key');
            MidtransConfig::$isProduction = config('services.midtrans.is_production');
            MidtransConfig::$isSanitized = config('services.midtrans.is_sanitized');
            MidtransConfig::$is3ds = config('services.midtrans.is_3ds');

            $orderId = 'BOOKING-' . $booking->id_booking . '-' . time();
            
            $itemDetails = [];
            
            $itemDetails[] = [
                'id' => 'LYN-' . $layanan->id_layanan,
                'price' => (float) $sl,
                'quantity' => 1,
                'name' => substr($layanan->nama_layanan, 0, 50),
            ];
            
            if ($sb > 0) {
                $itemDetails[] = [
                    'id' => 'BHP-' . $booking->id_booking,
                    'price' => (float) $sb,
                    'quantity' => 1,
                    'name' => 'Bahan Habis Pakai (BHP)',
                ];
            }
            
            if ($st > 0) {
                $itemDetails[] = [
                    'id' => 'TRN-' . $booking->id_booking,
                    'price' => (float) $st,
                    'quantity' => 1,
                    'name' => 'Biaya Transportasi (' . round($distance, 1) . ' km)',
                ];
            }
            
            if ($ba > 0) {
                $itemDetails[] = [
                    'id' => 'ADM-' . $booking->id_booking,
                    'price' => (float) $ba,
                    'quantity' => 1,
                    'name' => 'Biaya Administrasi',
                ];
            }
            
            if ($ppn > 0) {
                $itemDetails[] = [
                    'id' => 'TAX-' . $booking->id_booking,
                    'price' => (float) $ppn,
                    'quantity' => 1,
                    'name' => 'PPN (' . $persenPpn . '%)',
                ];
            }

            $params = [
                'transaction_details' => [
                    'order_id' => $orderId,
                    'gross_amount' => (float) $total,
                ],
                'customer_details' => [
                    'first_name' => $pasien->nama_lengkap ?? $user->email ?? 'Pasien',
                    'email' => $user->email ?? 'no-reply@example.com',
                ],
                'item_details' => $itemDetails,
            ];

            $snap = MidtransSnap::createTransaction($params);
            $snapToken = $snap->token ?? null;
            $redirectUrl = $snap->redirect_url ?? null;

            DB::commit();

            $booking->load(['pasien', 'layanan', 'tenagaMedis', 'transaksi']);

            return response()->json([
                'success' => true,
                'message' => 'Booking berhasil dibuat. Silakan lanjutkan pembayaran.',
                'data' => [
                    'booking' => $booking,
                    'transaction' => $transaction,
                    'order_id' => $orderId,
                    'snap_token' => $snapToken,
                    'redirect_url' => $redirectUrl,
                ]
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Gagal membuat booking: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * API Detail Booking berdasarkan ID
     */
    public function show($id)
    {
        $booking = Booking::with(['pasien', 'layanan', 'tenagaMedis', 'transaksi'])->find($id);

        if (!$booking) {
            return response()->json([
                'success' => false,
                'message' => 'Booking tidak ditemukan.'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Detail booking',
            'data' => $booking
        ]);
    }

    /**
     * API Update Status Booking oleh Admin/Nakes
     */
    public function updateStatus(Request $request, $id)
    {
        $request->validate([
            'status_booking' => 'required|string|in:Pending,DiPerjalanan,Tindakan,Selesai,Dibatalkan',
        ]);

        $booking = Booking::with(['pasien', 'layanan', 'tenagaMedis', 'transaksi'])->find($id);

        if (!$booking) {
            return response()->json([
                'success' => false,
                'message' => 'Booking tidak ditemukan.'
            ], 404);
        }

        $booking->status_booking = $request->input('status_booking');
        $booking->save();

        return response()->json([
            'success' => true,
            'message' => 'Status booking berhasil diperbarui menjadi ' . $booking->status_booking,
            'data' => $booking
        ]);
    }

    /**
     * API Direct Midtrans Charge
     */
    public function charge(Request $request)
    {
        $request->validate([
            'payment_type' => 'required|string',
            'transaction_details' => 'required|array',
            'transaction_details.order_id' => 'required|string',
            'transaction_details.gross_amount' => 'required|numeric',
        ]);

        $serverKey = config('services.midtrans.server_key');
        $isProduction = config('services.midtrans.is_production');
        $url = $isProduction 
            ? 'https://api.midtrans.com/v2/charge' 
            : 'https://api.sandbox.midtrans.com/v2/charge';

        try {
            $client = Http::withBasicAuth($serverKey, '')
                ->withHeaders([
                    'Accept' => 'application/json',
                    'Content-Type' => 'application/json',
                ]);

            if (config('app.env') === 'local') {
                $client->withoutVerifying();
            }

            $response = $client->post($url, $request->all());

            return response()->json($response->json(), $response->status());
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Gagal meneruskan pembayaran ke Midtrans: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * API Cek Status Transaksi & Booking
     */
    public function checkStatus($idTransaksi)
    {
        $transaksi = Transaksi::with(['booking.pasien', 'booking.layanan', 'booking.tenagaMedis'])->find($idTransaksi);

        if (!$transaksi) {
            return response()->json([
                'success' => false,
                'message' => 'Transaksi tidak ditemukan.'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Status transaksi',
            'data' => [
                'id_transaksi' => $transaksi->id_transaksi,
                'id_booking' => $transaksi->id_booking,
                'booking_code' => $transaksi->booking?->booking_code,
                'status_booking' => $transaksi->booking?->status_booking,
                'status_transaksi' => $transaksi->status_transaksi,
                'metode_pembayaran' => $transaksi->metode_pembayaran,
                'jumlah_total' => $transaksi->jumlah_total,
                'waktu_bayar' => $transaksi->waktu_bayar,
                'booking_detail' => $transaksi->booking,
            ]
        ]);
    }
}
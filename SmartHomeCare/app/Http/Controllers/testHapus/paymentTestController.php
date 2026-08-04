<?php

namespace App\Http\Controllers\testHapus; // 1. Perbaiki 'testHapus' (H besar sesuai nama folder)

use App\Http\Controllers\Controller;
use Midtrans\Config;
use Midtrans\Snap;
use Illuminate\Http\Request;

class paymentTestController extends Controller
{
    public function checkout(Request $request)
    {
        // 1. Setup Konfigurasi Midtrans
        Config::$serverKey = config('services.midtrans.server_key');
        Config::$isProduction = config('services.midtrans.is_production');
        Config::$isSanitized = config('services.midtrans.is_sanitized');
        Config::$is3ds = config('services.midtrans.is_3ds');

        // 2. Buat ID Transaksi Unik (contoh: SERVICE-1718000000)
        $orderId = 'SERVICE-' . time();

        // 3. Payload Transaksi
        $params = [
            'transaction_details' => [
                'order_id' => $orderId,
                'gross_amount' => $request->price ?? 50000, // Default Rp 50.000
            ],
            'customer_details' => [
                'first_name' => $request->name ?? 'User Test',
                'email' => $request->email ?? 'test@example.com',
            ],
            'item_details' => [
                [
                    'id' => 'SERV-01',
                    'price' => $request->price ?? 50000,
                    'quantity' => 1,
                    'name' => $request->service_name ?? 'Layanan Cloud Server',
                ]
            ]
        ];

        try {
    // 1. Buat transaksi Snap
    $transaction = Snap::createTransaction($params);

    // 2. Ambil redirect_url dan token dari object response
    $redirectUrl = $transaction->redirect_url;
    $snapToken = $transaction->token;

    return response()->json([
        'status' => 'success',
        'order_id' => $orderId,
        'snap_token' => $snapToken,
        'redirect_url' => $redirectUrl,
    ]);
} catch (\Exception $e) {
    return response()->json([
        'status' => 'error',
        'message' => $e->getMessage(),
    ], 500);
}
    }
}

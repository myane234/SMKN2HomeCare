<?php

namespace App\Http\Controllers;

use App\Models\Booking;
use App\Models\Transaksi;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Midtrans\Config;
use Midtrans\Notification;
use Midtrans\Transaction;

class TransaksiController extends Controller
{
    public function index(Request $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Daftar transaksi'
        ]);
    }

    public function store(Request $request)
    {
        return response()->json([
            'success' => true,
            'message' => 'Token pembayaran Midtrans',
            'token' => 'dummy-midtrans-token'
        ]);
    }

    public function confirm(Request $request)
    {
        $validate = $request->validate([
            'id_booking' => 'required|exists:bookings,id_booking',
            'order_id' => 'required|string',
        ]);

        $booking = Booking::with('transaksi')->findOrFail($validate['id_booking']);
        $transaction = $booking->transaksi;

        if (!$transaction) {
            return response()->json([
                'success' => false,
                'message' => 'Transaksi booking tidak ditemukan.'
            ], 404);
        }

        Config::$serverKey = config('services.midtrans.server_key');
        Config::$isProduction = config('services.midtrans.is_production');
        Config::$isSanitized = config('services.midtrans.is_sanitized');
        Config::$is3ds = config('services.midtrans.is_3ds');

        try {
            $status = Transaction::status($validate['order_id']);
            $transactionStatus = $status->transaction_status ?? null;

            if (in_array($transactionStatus, ['capture', 'settlement'])) {
                $transaction->update([
                    'status_transaksi' => 'Lunas',
                    'waktu_bayar' => now(),
                ]);
                $booking->update(['status_booking' => 'Diproses']);
            } elseif (in_array($transactionStatus, ['deny', 'cancel', 'expire'])) {
                $transaction->update(['status_transaksi' => 'Gagal']);
                $booking->update(['status_booking' => 'Dibatalkan']);
            }

            return response()->json([
                'success' => true,
                'message' => 'Status transaksi telah diperbarui.',
                'data' => [
                    'transaction_status' => $transactionStatus,
                    'booking_status' => $booking->status_booking,
                ]
            ]);
        } catch (\Throwable $e) {
            Log::error('Midtrans confirm error: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Gagal memverifikasi status pembayaran.',
            ], 500);
        }
    }

    public function callback(Request $request)
    {
        Config::$serverKey = config('services.midtrans.server_key');
        Config::$isProduction = config('services.midtrans.is_production');
        Config::$isSanitized = config('services.midtrans.is_sanitized');
        Config::$is3ds = config('services.midtrans.is_3ds');

        $notification = new Notification();
        $orderId = $notification->order_id ?? null;
        $transactionStatus = $notification->transaction_status ?? null;

        if (!$orderId) {
            return response()->json(['status' => 'error', 'message' => 'Order ID tidak ditemukan.'], 400);
        }

        $bookingId = null;
        if (preg_match('/^BOOKING\-(\d+)\-/', $orderId, $matches)) {
            $bookingId = (int) $matches[1];
        }

        if (!$bookingId) {
            return response()->json(['status' => 'error', 'message' => 'Booking ID tidak dapat diproses.'], 400);
        }

        $booking = Booking::with('transaksi')->find($bookingId);
        if (!$booking) {
            return response()->json(['status' => 'error', 'message' => 'Booking tidak ditemukan.'], 404);
        }

        $transaction = $booking->transaksi;

        if ($transaction) {
            if (in_array($transactionStatus, ['capture', 'settlement'])) {
                $transaction->update([
                    'status_transaksi' => 'Lunas',
                    'waktu_bayar' => now(),
                ]);
                $booking->update(['status_booking' => 'Diproses']);
            } elseif (in_array($transactionStatus, ['deny', 'cancel', 'expire'])) {
                $transaction->update(['status_transaksi' => 'Gagal']);
                $booking->update(['status_booking' => 'Dibatalkan']);
            }
        }

        return response()->json(['status' => 'success']);
    }
}

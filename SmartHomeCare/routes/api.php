<?php

use Illuminate\Http\Request;

use App\Http\Controllers\CoreAuthController;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TenagaMedisController;
use App\Http\Controllers\testHapus\paymentTestController;


// Route::post('/checkout', [PaymentTestController::class, 'checkout']);

Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/nakes/register', [TenagaMedisController::class, 'register']);
    Route::post('/logout', [CoreAuthController::class, 'logout']);
    Route::get('/profile/me', [CoreAuthController::class, 'me']);
});

require __DIR__ . '/api/public.php';
require __DIR__ . '/api/auth.php';
require __DIR__ . '/api/pasien.php';
require __DIR__ . '/api/nakes.php';
require __DIR__ . '/api/admin.php';
require __DIR__ . '/api/booking.php';
require __DIR__ . '/api/transaksi.php';
require __DIR__ . '/api/jadwal.php';
require __DIR__ . '/api/chat.php';

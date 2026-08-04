<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TransaksiController;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/transaksi', [TransaksiController::class, 'store']);
    Route::get('/transaksi', [TransaksiController::class, 'index']);
    Route::post('/transaksi/confirm', [TransaksiController::class, 'confirm']);
});

Route::post('/transaksi/midtrans-callback', [TransaksiController::class, 'callback']);

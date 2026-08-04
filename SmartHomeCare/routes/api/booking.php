<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\BookingController;

Route::post('/booking/charge', [BookingController::class, 'charge']);

Route::middleware(['auth:sanctum'])->group(function () {
    Route::post('/booking', [BookingController::class, 'store']);
    Route::get('/booking', [BookingController::class, 'index']);
    Route::get('/booking/transaksi/{id_transaksi}', [BookingController::class, 'checkStatus']);
    Route::get('/booking/{id}', [BookingController::class, 'show']);
});

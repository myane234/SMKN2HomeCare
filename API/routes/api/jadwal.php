<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\JadwalKerjaController;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/jadwal', [JadwalKerjaController::class, 'index']);
    Route::post('/jadwal', [JadwalKerjaController::class, 'store']);
});

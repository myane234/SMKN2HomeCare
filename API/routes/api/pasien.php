<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\PasienController;

Route::middleware(['auth:sanctum', 'role:pasien'])->group(function () {
    // Route::get('/pasien', [PasienController::class, 'show']);
    Route::put('/pasien', [PasienController::class, 'update']);
    Route::delete('/pasien', [PasienController::class, 'destroy']);
    Route::post('/pasien/complete-profile', [PasienController::class, 'completeProfile']);
});

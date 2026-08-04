<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TenagaMedisController;



Route::middleware(['auth:sanctum', 'role:nakes'])->group(function () {
    Route::get('/tenaga-medis', [TenagaMedisController::class, 'show']);
    Route::put('/tenaga-medis', [TenagaMedisController::class, 'update']);
    Route::delete('/tenaga-medis', [TenagaMedisController::class, 'destroy']);
});

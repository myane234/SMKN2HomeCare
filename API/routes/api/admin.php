<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AdminAuthController;
use App\Http\Controllers\AdminController;
use App\Http\Controllers\AdminNakesController;
use App\Http\Controllers\SuperAdminNakesController;
use App\Http\Controllers\LayananController;
use App\Http\Controllers\PromoController;
use App\Http\Controllers\ArtikelController;
use App\Http\Controllers\BookingController;
use App\Http\Controllers\SuperAdminAuthController;
use App\Http\Controllers\SuperAdminMasterData\SuperAdminPasien;
use App\Http\Controllers\SuperAdminMasterData\SuperAdminDataBarang;
use App\Http\Controllers\SuperAdminMasterData\SuperAdminMasterTarif;
use App\Http\Controllers\WilayahLayananController;

Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    Route::post('/admin/logout', [AdminAuthController::class, 'logout']);
    Route::post('/super-admin/logout', [SuperAdminAuthController::class, 'logout']);
    Route::get('/super-admin/me', [SuperAdminAuthController::class, 'me']);

    Route::post('/layanan', [LayananController::class, 'store']);
    Route::put('/layanan/{layanan}', [LayananController::class, 'update']);
    Route::delete('/layanan/{layanan}', [LayananController::class, 'destroy']);

    Route::post('/promo', [PromoController::class, 'store']);
    Route::put('/promo/{promo}', [PromoController::class, 'update']);
    Route::delete('/promo/{promo}', [PromoController::class, 'destroy']);

    Route::post('/artikel', [ArtikelController::class, 'store']);
    Route::put('/artikel/{artikel}', [ArtikelController::class, 'update']);
    Route::delete('/artikel/{artikel}', [ArtikelController::class, 'destroy']);

    //Super Admin

    Route::get('/admin/nakes/requests', [AdminNakesController::class, 'index']);
    Route::get('/admin/nakes/requests/{id}', [AdminNakesController::class, 'show']);
    Route::post('/admin/nakes/requests/{id}/pelatihan', [AdminNakesController::class, 'pelatihan']);
    Route::post('/admin/nakes/requests/{id}/approve', [AdminNakesController::class, 'approve']);
    Route::post('/admin/nakes/requests/{id}/reject', [AdminNakesController::class, 'reject']);
    Route::get('/admin/nakes', [AdminNakesController::class, 'listActiveNakes']);

    Route::get('/super-admin/nakes', [SuperAdminNakesController::class, 'index']);
    Route::get('/super-admin/nakes/{id}', [SuperAdminNakesController::class, 'show']);
    Route::put('/super-admin/nakes/{id}', [SuperAdminNakesController::class, 'update']);
    Route::delete('/super-admin/nakes/{id}', [SuperAdminNakesController::class, 'destroy']);

    Route::get('/admin', [AdminController::class, 'index']);
    Route::delete('/admin/{id}', [AdminController::class, 'destroy']);
    Route::get('/admin/bookings', [BookingController::class, 'adminIndex']);

    Route::get('/admin/pasien', [SuperAdminPasien::class, 'index']);
    Route::get('/admin/pasien/{id_pasien}', [SuperAdminPasien::class, 'show']);
    Route::put('/admin/pasien/{id_pasien}', [SuperAdminPasien::class, 'update']);
    Route::patch('/admin/pasien/{id}', [SuperAdminPasien::class, 'toggleStatus']);
    Route::delete('/admin/pasien/{id_pasien}', [SuperAdminPasien::class, 'destroy']);



    //data Barang
    Route::apiResource('/bhp-items', SuperAdminDatabarang::class);
    Route::apiResource('/master-tarif', SuperAdminMasterTarif::class);

    Route::post('/wilayah-layanan', [WilayahLayananController::class, 'store']);
    Route::put('/wilayah-layanan/{wilayahLayanan}', [WilayahLayananController::class, 'update']);
    Route::delete('/wilayah-layanan/{wilayahLayanan}', [WilayahLayananController::class, 'destroy']);
    Route::patch('/wilayah-layanan/{wilayahLayanan}/toggle-status', [WilayahLayananController::class, 'toggleStatus']);
});

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
use App\Http\Controllers\KotaKabupatenController;
use App\Http\Controllers\KategoriLayananController;
use App\Http\Controllers\KategoriArtikelController;

Route::middleware(['auth:sanctum', 'role:admin'])->group(function () {
    
    // Auth Admin & Super Admin
    Route::post('/admin/logout', [AdminAuthController::class, 'logout']);
    Route::post('/super-admin/logout', [SuperAdminAuthController::class, 'logout']);
    Route::get('/super-admin/me', [SuperAdminAuthController::class, 'me']);

    // Management Layanan
    Route::post('/layanan', [LayananController::class, 'store']);
    Route::put('/layanan/{layanan}', [LayananController::class, 'update']);
    Route::delete('/layanan/{layanan}', [LayananController::class, 'destroy']);

    // Management Promo
    Route::post('/promo', [PromoController::class, 'store']);
    Route::put('/promo/{promo}', [PromoController::class, 'update']);
    Route::delete('/promo/{promo}', [PromoController::class, 'destroy']);

    // Management Artikel
    Route::post('/artikel', [ArtikelController::class, 'store']);
    Route::post('/artikel/upload-images', [ArtikelController::class, 'uploadImages']);
    Route::put('/artikel/{artikel}', [ArtikelController::class, 'update']);
    Route::delete('/artikel/{artikel}', [ArtikelController::class, 'destroy']);

    // Kategori Layanan CRUD
    Route::post('/layanan/kategori', [KategoriLayananController::class, 'store']);
    Route::get('/layanan/kategori/{id}', [KategoriLayananController::class, 'show']);
    Route::put('/layanan/kategori/{id}', [KategoriLayananController::class, 'update']);
    Route::delete('/layanan/kategori/{id}', [KategoriLayananController::class, 'destroy']);

    // Kategori Artikel CRUD
    Route::post('/artikel/kategori', [KategoriArtikelController::class, 'store']);
    Route::get('/artikel/kategori/{id}', [KategoriArtikelController::class, 'show']);
    Route::put('/artikel/kategori/{id}', [KategoriArtikelController::class, 'update']);
    Route::delete('/artikel/kategori/{id}', [KategoriArtikelController::class, 'destroy']);

    //Super Admin
    // Management Nakes - Admin
    Route::prefix('admin/nakes')->group(function () {
        Route::get('/requests', [AdminNakesController::class, 'index']);
        Route::get('/requests/{id}', [AdminNakesController::class, 'show']);
        
        // Step Verification Routes
        Route::post('/requests/{id}/pelatihan', [AdminNakesController::class, 'setPelatihan']); // Fixed: setPelatihan
        Route::post('/requests/{id}/approve', [AdminNakesController::class, 'approve']);
        Route::post('/requests/{id}/reject', [AdminNakesController::class, 'reject']);
        
        Route::get('/', [AdminNakesController::class, 'listActiveNakes']);
    });

    // Management Nakes - Super Admin
    Route::prefix('super-admin/nakes')->group(function () {
        Route::get('/', [SuperAdminNakesController::class, 'index']);
        Route::get('/{id}', [SuperAdminNakesController::class, 'show']);
        Route::put('/{id}', [SuperAdminNakesController::class, 'update']);
        Route::delete('/{id}', [SuperAdminNakesController::class, 'destroy']);
    });

    // Admin & Bookings
    Route::get('/admin', [AdminController::class, 'index']);
    Route::delete('/admin/{id}', [AdminController::class, 'destroy']);
    Route::get('/admin/bookings', [BookingController::class, 'adminIndex']);

    // Management Pasien
    Route::prefix('admin/pasien')->group(function () {
        Route::get('/', [SuperAdminPasien::class, 'index']);
        Route::get('/{id_pasien}', [SuperAdminPasien::class, 'show']);
        Route::put('/{id_pasien}', [SuperAdminPasien::class, 'update']);
        Route::patch('/{id}/toggle-status', [SuperAdminPasien::class, 'toggleStatus']);
        Route::delete('/{id_pasien}', [SuperAdminPasien::class, 'destroy']);
    });

    // Master Data (BHP & Tarif)
    Route::apiResource('/bhp-items', SuperAdminDataBarang::class);
    Route::apiResource('/master-tarif', SuperAdminMasterTarif::class);

    // Master Wilayah - Provinsi
    Route::prefix('wilayah-layanan')->group(function () {
        Route::post('/', [WilayahLayananController::class, 'store']);
        Route::put('/{wilayahLayanan}', [WilayahLayananController::class, 'update']);
        Route::delete('/{wilayahLayanan}', [WilayahLayananController::class, 'destroy']);
        Route::patch('/{wilayahLayanan}/toggle-status', [WilayahLayananController::class, 'toggleStatus']);
    });

    // Master Wilayah - Kota / Kabupaten
    Route::prefix('kota-kabupaten')->group(function () {
        Route::post('/', [KotaKabupatenController::class, 'store']);
        Route::put('/{id}', [KotaKabupatenController::class, 'update']);
        Route::delete('/{id}', [KotaKabupatenController::class, 'destroy']);
    });

});
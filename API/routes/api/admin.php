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

    //Provinsi
    Route::post('/wilayah-layanan', [WilayahLayananController::class, 'store']);
    Route::put('/wilayah-layanan/{wilayahLayanan}', [WilayahLayananController::class, 'update']);
    Route::delete('/wilayah-layanan/{wilayahLayanan}', [WilayahLayananController::class, 'destroy']);
    Route::patch('/wilayah-layanan/{wilayahLayanan}/toggle-status', [WilayahLayananController::class, 'toggleStatus']);

    //Kota Kabupaten
    Route::post('/kota-kabupaten', [KotaKabupatenController::class, 'store']);
    Route::put('/kota-kabupaten/{id}', [KotaKabupatenController::class, 'update']);
    Route::delete('/kota-kabupaten/{id}', [KotaKabupatenController::class, 'destroy']);
});

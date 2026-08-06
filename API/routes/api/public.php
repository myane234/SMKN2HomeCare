<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\LayananController;
use App\Http\Controllers\PromoController;
use App\Http\Controllers\ArtikelController;
use App\Http\Controllers\KategoriArtikelController;
use App\Http\Controllers\PasienController;
use App\Http\Controllers\KategoriLayananController;
use App\Http\Controllers\WilayahLayananController;
use App\Http\Controllers\KotaKabupatenController;

Route::get('/layanan', [LayananController::class, 'index']);
Route::get('/layanan/kategori', [KategoriLayananController::class, 'index']);
Route::get('/layanan/{layanan}', [LayananController::class, 'show']);

Route::get('/promo', [PromoController::class, 'frontendIndex']);
Route::get('/promo/active', [PromoController::class, 'getActivePromos']);
Route::get('/promo/{promo}', [PromoController::class, 'show']);

Route::get('/artikel', [ArtikelController::class, 'index']);
Route::get('/artikel/kategori', [KategoriArtikelController::class, 'index']);
Route::get('/artikel/{artikel}', [ArtikelController::class, 'show']);

Route::get('/pasien', [PasienController::class, 'index']);

//Provinsi
Route::get('/wilayah-layanan', [WilayahLayananController::class, 'index']);
Route::get('/wilayah-layanan/{wilayahLayanan}', [WilayahLayananController::class, 'show']);


//Kota Kabupaten
Route::get('/kota-kabupaten', [KotaKabupatenController::class, 'index']);
Route::get('/kota-kabupaten/provinsi/{id_provinsi}', [KotaKabupatenController::class, 'getByProvinsi']);
Route::get('/kota-kabupaten/{id}', [KotaKabupatenController::class, 'show']);


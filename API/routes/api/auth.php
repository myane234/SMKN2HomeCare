<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CoreAuthController;
use App\Http\Controllers\GooglePasienController;
use App\Http\Controllers\AdminAuthController;
use App\Http\Controllers\SuperAdminAuthController;

Route::post('/register', [CoreAuthController::class, 'register']);
Route::post('/login', [CoreAuthController::class, 'login']);
Route::post('/googleAuth', [GooglePasienController::class, 'handleGoogleCallback']);

Route::post('/admin/login', [AdminAuthController::class, 'login']);
Route::post('/super-admin/login', [SuperAdminAuthController::class, 'login']);

//verifikasi register 
Route::get('/email/verify/{id}/{hash}', [CoreAuthController::class, 'verifyEmail'])
    ->name('verification.verify')
    ->middleware(['signed']);

Route::post('/email/resend', [CoreAuthController::class, 'resendVerificationEmail']);
Route::post('/change-unverified-email', [CoreAuthController::class, 'changeUnverifiedEmail']);

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Http\Request;

Route::get('/', function () {
    return view('welcome');
});

// Pengaman: jika auth:sanctum mencoba meredirect karena request tidak
// menyertakan Accept: application/json, berikan respon JSON yang jelas
// alih-alih error "Route [login] not defined".
Route::get('/login', function (Request $request) {
    return response()->json([
        'success' => false,
        'message' => 'Unauthenticated. Silakan login terlebih dahulu.',
    ], 401);
})->name('login');


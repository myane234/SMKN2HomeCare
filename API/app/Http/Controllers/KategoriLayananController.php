<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use App\Models\KategoriLayanan;

class KategoriLayananController extends Controller
{
    public function index()
    {
        $kategori = KategoriLayanan::all();
        return response()->json([
            'success' => true,
            'message' => 'Berhasil mengambil daftar kategori layanan',
            'data' => $kategori
        ]);
    }
}

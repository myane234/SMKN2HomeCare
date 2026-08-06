<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\KategoriArtikel;

class KategoriArtikelController extends Controller
{
    /**
     * Tampilkan semua kategori artikel.
     */
    public function index()
    {
        $kategori = KategoriArtikel::all();
        return response()->json([
            'success' => true,
            'message' => 'Berhasil mengambil daftar kategori artikel',
            'data' => $kategori
        ], 200);
    }

    /**
     * Tambah kategori artikel baru (Admin only).
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_kategori' => ['required', 'string', 'max:255', 'unique:kategori_artikels,nama_kategori'],
        ]);

        $kategori = KategoriArtikel::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Kategori artikel berhasil ditambahkan',
            'data' => $kategori
        ], 201);
    }

    /**
     * Tampilkan detail kategori artikel (Admin only).
     */
    public function show($id)
    {
        $kategori = KategoriArtikel::findOrFail($id);
        return response()->json([
            'success' => true,
            'message' => 'Berhasil mengambil detail kategori artikel',
            'data' => $kategori
        ], 200);
    }

    /**
     * Update kategori artikel (Admin only).
     */
    public function update(Request $request, $id)
    {
        $kategori = KategoriArtikel::findOrFail($id);

        $validated = $request->validate([
            'nama_kategori' => ['required', 'string', 'max:255', 'unique:kategori_artikels,nama_kategori,' . $id . ',id_kategori_artikel'],
        ]);

        $kategori->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Kategori artikel berhasil diupdate',
            'data' => $kategori
        ], 200);
    }

    /**
     * Hapus kategori artikel (Admin only).
     */
    public function destroy($id)
    {
        $kategori = KategoriArtikel::findOrFail($id);
        $kategori->delete();

        return response()->json([
            'success' => true,
            'message' => 'Kategori artikel berhasil dihapus'
        ], 200);
    }
}

<?php

namespace App\Http\Controllers\SuperAdminMasterData;

use App\Http\Controllers\Controller;
use App\Models\BhpItem;
use Illuminate\Http\Request;

class SuperAdminDataBarang extends Controller
{
    /**
     * Tampilkan semua daftar item BHP
     */
    public function index()
    {
        $bhpItems = BhpItem::all();

        return response()->json([
            'success' => true,
            'message' => 'Berhasil mengambil data item BHP',
            'data' => $bhpItems
        ], 200);
    }

    /**
     * Simpan item BHP baru ke database
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_barang' => ['required', 'string', 'max:255'],
            'harga_satuan' => ['required', 'numeric', 'min:0'],
            'stok' => ['required', 'integer', 'min:0'],
        ]);

        $bhpItem = BhpItem::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Item BHP berhasil ditambahkan',
            'data' => $bhpItem
        ], 201);
    }

    /**
     * Tampilkan detail item BHP berdasarkan ID
     */
    public function show($id)
    {
        $bhpItem = BhpItem::findOrFail($id);

        return response()->json([
            'success' => true,
            'message' => 'Berhasil mengambil detail item BHP',
            'data' => $bhpItem
        ], 200);
    }

    /**
     * Update item BHP
     */
    public function update(Request $request, $id)
    {
        $bhpItem = BhpItem::findOrFail($id);

        $validated = $request->validate([
            'nama_barang' => ['sometimes', 'required', 'string', 'max:255'],
            'harga_satuan' => ['sometimes', 'required', 'numeric', 'min:0'],
            'stok' => ['sometimes', 'required', 'integer', 'min:0'],
        ]);

        $bhpItem->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Item BHP berhasil diperbarui',
            'data' => $bhpItem
        ], 200);
    }

    /**
     * Hapus item BHP
     */
    public function destroy($id)
    {
        $bhpItem = BhpItem::findOrFail($id);
        $bhpItem->delete();

        return response()->json([
            'success' => true,
            'message' => 'Item BHP berhasil dihapus'
        ], 200);
    }
}
<?php

namespace App\Http\Controllers;

use App\Models\Promo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * @group CMS Promo
 * Endpoint Untuk Paket Bundling
 */
class PromoController extends Controller
{
    public function index()
    {
        // Load relasi layanan
        $promos = Promo::with('layanans')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $promos,
        ], 200);
    }

    public function frontendIndex()
    {
        $promos = Promo::with('layanans')
            ->where('status_promo', 'Aktif')
            ->whereDate('tanggal_mulai', '<=', now()->toDateString())
            ->whereDate('tanggal_berakhir', '>=', now()->toDateString())
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $promos,
        ], 200);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nama_paket' => ['required', 'string', 'max:255'],
            'deskripsi' => ['required', 'string'],
            'diskon_persen' => ['required', 'numeric', 'min:0', 'max:100'],
            'tanggal_mulai' => ['required', 'date'],
            'tanggal_berakhir' => ['required', 'date', 'after_or_equal:tanggal_mulai'],
            'status_promo' => ['required', 'in:Aktif,Tidak Aktif'],
            'layanan_ids' => ['required', 'array'], // Input ID layanan dalam bentuk array
            'layanan_ids.*' => ['exists:layanans,id_layanan'], 
            'gambar_promo' => ['sometimes','nullable','image','max:2048'],
        ]);

        // create promo without image first
        $promoData = $validated;
        unset($promoData['layanan_ids']);

        $promo = Promo::create($promoData);

        // Handle image upload separately
        if ($request->hasFile('gambar_promo')) {
            $path = $request->file('gambar_promo')->store('promo_images', 'public');
            $promo->gambar_promo = $path;
            $promo->save();
        }

        // Simpan relasi ke tabel pivot
        $promo->layanans()->sync($request->layanan_ids);

        return response()->json([
            'success' => true,
            'message' => 'Paket bundling berhasil dibuat',
            'data' => $promo->load('layanans'),
        ], 201);
    }

    public function show(Promo $promo)
    {
        // Memuat layanan saat menampilkan detail
        $promo->load('layanans');
        
        return response()->json([
            'success' => true,
            'data' => $promo,
        ], 200);
    }

    public function update(Request $request, Promo $promo)
    {
        $validated = $request->validate([
            'nama_paket' => ['sometimes', 'required', 'string', 'max:255'],
            'deskripsi' => ['sometimes', 'required', 'string'],
            'diskon_persen' => ['sometimes', 'required', 'numeric', 'min:0', 'max:100'],
            'tanggal_mulai' => ['sometimes', 'required', 'date'],
            'tanggal_berakhir' => ['sometimes', 'required', 'date', 'after_or_equal:tanggal_mulai'],
            'status_promo' => ['sometimes', 'required', 'in:Aktif,Tidak Aktif'],
            'layanan_ids' => ['sometimes', 'required', 'array'],
            'layanan_ids.*' => ['exists:layanans,id_layanan'],
            'gambar_promo' => ['sometimes','nullable','image','max:2048'],
        ]);

        // Handle file upload: delete old file if replaced
        if ($request->hasFile('gambar_promo')) {
            if ($promo->gambar_promo) {
                Storage::disk('public')->delete($promo->gambar_promo);
            }
            $path = $request->file('gambar_promo')->store('promo_images', 'public');
            $validated['gambar_promo'] = $path;
        }

        $promo->fill($validated);
        $promo->save();

        if ($request->has('layanan_ids')) {
            $promo->layanans()->sync($request->layanan_ids);
        }

        return response()->json([
            'success' => true,
            'message' => 'Paket bundling berhasil diubah',
            'data' => $promo->load('layanans'),
        ], 200);
    }

    public function destroy(Promo $promo)
    {
        $promo->layanans()->detach(); // Hapus relasi sebelum delete
        $promo->delete();

        return response()->json([
            'success' => true,
            'message' => 'Paket bundling berhasil dihapus',
        ], 200);
    }

    public function getActivePromos()
    {
        $promos = Promo::with('layanans')
            ->where('status_promo', 'Aktif')
            ->whereDate('tanggal_mulai', '<=', now()->toDateString())
            ->whereDate('tanggal_berakhir', '>=', now()->toDateString())
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $promos,
        ], 200);
    }
}
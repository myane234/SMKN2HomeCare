<?php

namespace App\Http\Controllers;

use App\Models\Artikel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * @group CMS Artikel
 *
 * Endpoint CMS Artikel
 */
class ArtikelController extends Controller
{
    /**
     * Mengambil daftar artikel. Mendukung dua cara pemanggilan:
     * 1. **Tanpa Query**: Mengambil semua artikel.
     * 2. **Filter Kategori**: Menyaring berdasarkan kategori_artikel.
     *
     * @queryParam kategori_artikel string Saring artikel berdasarkan kategori. Must be one of: Tips Kesehatan, Kegiatan. Example: Tips Kesehatan
     *
     * @response scenario="Semua Data" {
     *   "success": true,
     *   "message": "Berhasil mengambil data Artikel",
     *   "data": [
     *     {
     *       "id": 1,
     *       "judul_artikel": "Cara Menjaga Kesehatan di Rumah",
     *       "kategori_artikel": "Tips Kesehatan",
     *       "isi_artikel": "Lorem ipsum...",
     *       "gambar_artikel": "http://localhost/storage/artikel/foto.jpg"
     *     }
     *   ]
     * }
     */
    public function index(Request $request)
    {
        $query = Artikel::query();

        if ($request->has('kategori_artikel')) {
            $query->where('kategori_artikel', $request->kategori_artikel);
        }

        if ($request->has('sort_by') && $request->sort_by === 'views') {
            $query->orderBy('views', 'desc');
        }

        return response()->json([
            'success' => true,
            'message' => 'Berhasil mengambil data Artikel',
            'data'    => $query->get(),
        ], 200);
    }

    /**
     * Tambah artikel baru.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'judul_artikel'    => ['required', 'string', 'max:255'],
            'kategori_artikel' => ['required', 'in:Tips Kesehatan,Kegiatan'],
            'isi_artikel'      => ['required', 'string'],
            'gambar_artikel'   => ['required', 'image', 'mimes:jpeg,png,jpg', 'max:2048'],
        ]);

        if ($request->hasFile('gambar_artikel')) {
            $path = $request->file('gambar_artikel')->store('artikel', 'public');
            $validated['gambar_artikel'] = $path;
        }

        $artikel = Artikel::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Artikel berhasil ditambahkan',
            'data'    => $artikel,
        ], 201);
    }

    /**
     * Ambil detail artikel berdasarkan id.
     */
    public function show($id)
    {
        $artikel = Artikel::findOrFail($id);
        $artikel->increment('views');

        return response()->json([
            'success' => true,
            'message' => 'Berhasil mengambil detail Artikel',
            'data'    => $artikel,
        ], 200);
    }

    /**
     * Update artikel berdasarkan id.
     */
    public function update(Request $request, $id)
    {
        $artikel = Artikel::findOrFail($id);

        $validated = $request->validate([
            'judul_artikel'    => ['sometimes', 'required', 'string', 'max:255'],
            'kategori_artikel' => ['sometimes', 'required', 'in:Tips Kesehatan,Kegiatan'],
            'isi_artikel'      => ['sometimes', 'required', 'string'],
            'gambar_artikel'   => ['sometimes', 'required', 'image', 'mimes:jpeg,png,jpg', 'max:2048'],
        ]);

        if ($request->hasFile('gambar_artikel')) {
            // Hapus gambar lama jika ada
            $oldImage = $artikel->getRawOriginal('gambar_artikel');
            if ($oldImage) {
                Storage::disk('public')->delete($oldImage);
            }

            $path = $request->file('gambar_artikel')->store('artikel', 'public');
            $validated['gambar_artikel'] = $path;
        }

        $artikel->fill($validated);
        $artikel->save();

        return response()->json([
            'success' => true,
            'message' => 'Artikel berhasil diupdate',
            'data'    => $artikel,
        ], 200);
    }

    /**
     * Hapus artikel berdasarkan id.
     */
    public function destroy($id)
    {
        $artikel = Artikel::findOrFail($id);

        $oldImage = $artikel->getRawOriginal('gambar_artikel');
        if ($oldImage) {
            Storage::disk('public')->delete($oldImage);
        }

        $artikel->delete();

        return response()->json([
            'success' => true,
            'message' => 'Artikel berhasil dihapus',
        ], 200);
    }

    /**
     * Upload satu atau beberapa gambar artikel sekaligus.
     * Digunakan untuk fitur drag & drop gambar di editor artikel.
     */
    public function uploadImages(Request $request)
    {
        $request->validate([
            'images'   => ['array'],
            'images.*' => ['image', 'mimes:jpeg,png,jpg,gif,svg,webp', 'max:5120'],
            'image'    => ['image', 'mimes:jpeg,png,jpg,gif,svg,webp', 'max:5120'],
        ]);

        $urls = [];

        // Proses semua file dari field `images[]` (mendukung banyak gambar sekaligus)
        if ($request->hasFile('images')) {
            foreach ($request->file('images') as $file) {
                $path = $file->store('artikel', 'public');
                $urls[] = Storage::disk('public')->url($path);
            }
        }

        // Proses file dari field `image` (gambar tunggal) — diproses terpisah
        // sehingga jika `images[]` DAN `image` dikirim bersamaan, semua file
        // tetap tersimpan dan URL-nya dikembalikan.
        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('artikel', 'public');
            $urls[] = Storage::disk('public')->url($path);
        }

        return response()->json([
            'success' => true,
            'message' => 'Gambar berhasil diupload',
            'urls'    => $urls,
        ], 200);
    }
}

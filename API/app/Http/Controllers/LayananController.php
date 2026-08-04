<?php

namespace App\Http\Controllers;

use App\Models\KategoriLayanan;
use App\Models\Layanan;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Storage;

/**
 * @group CMS Layanan
 * 
 * Endpoint CMS Layanan
 */

class LayananController extends Controller
{
    /**
     * Mengambil daftar layanan medis. Endpoint ini mendukung dua cara pemanggilan:
 * 1. **Polosan (Tanpa Query)**: Mengambil semua daftar layanan secara keseluruhan.
 * 2. **Filter Kategori (Dengan Query)**: Menyaring daftar layanan berdasarkan kategori tertentu.
 *
 * @queryParam kategori string Saring layanan berdasarkan kategori. Must be one of: Fisioterapi, Kardiopulmoner, Neurologis, Muskuloskeletal, Ortopedi, Geniatri, Pasca Operasi. Example: Fisioterapi
 *
 * @response scenario="Semua Data (Polosan)" {
 *   "success": true,
 *   "message": "Berhasil Mengambil data Layanan",
 *   "data": [
 *     {
 *       "id_layanan": 1,
 *       "nama_layanan": "Fisioterapi Stroke Rumah",
 *       "kategori_layanan": "Fisioterapi",
 *       "harga": "150000.00",
 *       "durasi_menit": 60
 *     },
 *     {
 *       "id_layanan": 2,
 *       "nama_layanan": "Terapi Ortopedi",
 *       "kategori_layanan": "Ortopedi",
 *       "harga": "200000.00",
 *       "durasi_menit": 45
 *     }
 *   ]
 * }
 *
 * @response scenario="Dengan Filter Kategori" {
 *   "success": true,
 *   "message": "Berhasil Mengambil data Layanan",
 *   "data": [
 *     {
 *       "id_layanan": 1,
 *       "nama_layanan": "Fisioterapi Stroke Rumah",
 *       "kategori_layanan": "Fisioterapi",
 *       "harga": "150000.00",
 *       "durasi_menit": 60
 *     }
 *   ]
 * }
     */
    public function index(Request $request)
    {

        if($request->query('ambil_kategori') === 'true') {
            $kategori = KategoriLayanan::all();

            return response()->json([
                'success' => 'true',
                'message' => 'Barhasil Mengambil data Layanan',
                'data' => $kategori
            ], 200);
        }

        $query = Layanan::with('kategori');

        if ($request->has('kategori_layanan')) {
            // Find category id by name if the frontend still passes name, or just use id
            $query->whereHas('kategori', function($q) use ($request) {
                $q->where('nama_kategori', $request->kategori_layanan)
                  ->orWhere('id_kategori_layanan', $request->kategori_layanan);
            });
        }

        // Mapping hasil query untuk mengubah path gambar menjadi URL penuh
        $hasil = $query->get()->map(function ($item) {
            $item->foto_layanan = $item->foto_layanan ? url(Storage::url($item->foto_layanan)) : null;
            // Map the relation back to property so frontend doesn't break if expecting string
            $item->kategori_layanan = $item->kategori ? $item->kategori->nama_kategori : null;
            return $item;
        });

        return response()->json([
            'success' => true,
            'message' => 'Berhasil Mengambil data Layanan',
            'data' => $hasil
        ], 200);
    }

    /**
     * Tambah layanan baru.
     */
    public function store(Request $request)
    {
        // Validasi wajib (required) untuk deskripsi dan foto
        $validated = $request->validate([
            'nama_layanan' => ['required', 'string', 'max:255'],
            'deskripsi_layanan' => ['required', 'string'],
            'foto_layanan' => ['required', 'image', 'mimes:jpeg,png,jpg', 'max:2048'], // Wajib file gambar max 2MB
            'include_transport' => ['required', 'boolean'],
            'id_kategori_layanan' => ['required', 'exists:kategori_layanans,id_kategori_layanan'],
            'harga' => ['required', 'numeric'],
            'tipe_layanan' => ['required', 'in:durasi,tindakan'],
            'durasi_menit' => ['nullable', 'integer'],
        ]);

        // Handle upload file ke storage/app/public/layanan
        if ($request->hasFile('foto_layanan')) {
            $path = $request->file('foto_layanan')->store('layanan', 'public');
            $validated['foto_layanan'] = $path;
        }

        $layanan = Layanan::create($validated);
        
        // Ubah format response agar mengembalikan URL penuh gambar
        $layanan->foto_layanan = url(Storage::url($layanan->foto_layanan));

        return response()->json($layanan, 201);
    }

    /**
     * Ambil detail layanan by id.
     */
    public function show($id)
    {
        $layanan = Layanan::query()->findOrFail($id);
        
        // Ubah path menjadi URL penuh sebelum di-return
        $layanan->foto_layanan = $layanan->foto_layanan ? url(Storage::url($layanan->foto_layanan)) : null;
        
        return response()->json($layanan, 200);
    }

    /**
     * Edit layanan by id.
     */
     public function update(Request $request, $id)
    {
        $layanan = Layanan::query()->findOrFail($id);

        $validated = $request->validate([
            'nama_layanan' => ['sometimes', 'required', 'string', 'max:255'],
            'deskripsi_layanan' => ['sometimes', 'required', 'string'],
            'foto_layanan' => ['sometimes', 'required', 'image', 'mimes:jpeg,png,jpg', 'max:2048'],
            'id_kategori_layanan' => ['sometimes', 'required', 'exists:kategori_layanans,id_kategori_layanan'],
            'harga' => ['sometimes', 'required', 'numeric'],
            'tipe_layanan' => ['sometimes', 'required', 'in:durasi,tindakan'],
            'durasi_menit' => ['nullable', 'integer'],
            'include_transport' => ['sometimes', 'required', 'boolean'],
        ]);

        // Handle jika ada upload foto baru untuk menggantikan foto lama
        if ($request->hasFile('foto_layanan')) {
            // Hapus foto lama dari storage biar gak menuh-menuhin server
            if ($layanan->foto_layanan) {
                Storage::disk('public')->delete($layanan->foto_layanan);
            }
            
            $path = $request->file('foto_layanan')->store('layanan', 'public');
            $validated['foto_layanan'] = $path;
        }

        $layanan->fill($validated);
        $layanan->save();

        // Kembalikan URL penuh gambar terbaru
        $layanan->foto_layanan = url(Storage::url($layanan->foto_layanan));

        return response()->json($layanan, 200);
    }

    /**
     * Hapus layanan by id.
     */
    public function destroy($id)
    {
        $layanan = Layanan::query()->findOrFail($id);
        
        if ($layanan->foto_layanan) {
            Storage::disk('public')->delete($layanan->foto_layanan);
        }
        
        $layanan->delete();

        return response()->json(['message' => 'Deleted successfully'], 200);
    }
}


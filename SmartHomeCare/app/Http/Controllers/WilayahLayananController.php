<?php

namespace App\Http\Controllers;

use App\Models\WilayahLayanan;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

/**
 * @group Wilayah Layanan
 *
 * Endpoint master data wilayah layanan.
 */
class WilayahLayananController extends Controller
{
    public function index(Request $request)
    {
        $query = WilayahLayanan::query();

        if ($request->has('status')) {
            $status = $request->query('status');
            if (in_array($status, ['active', 'inactive'], true)) {
                $query->where('is_active', $status === 'active');
            }
        }

        $provinsi = $query->orderBy('nama_provinsi', 'asc')->get();

        return response()->json([
            'success' => true,
            'message' => 'Berhasil mengambil data wilayah layanan',
            'data' => $provinsi,
        ], 200);
    }

    public function show($id)
    {
        $provinsi = WilayahLayanan::findOrFail($id);

        return response()->json([
            'success' => true,
            'message' => 'Berhasil mengambil detail wilayah layanan',
            'data' => $provinsi,
        ], 200);
    }

    public function store(Request $request)
    {
        // 💡 Auto-fallback: Jika FE mengirim nama_wilayah, masukkan ke nama_provinsi
        if (!$request->has('nama_provinsi') && $request->has('nama_wilayah')) {
            $request->merge(['nama_provinsi' => $request->nama_wilayah]);
        }

        $validator = Validator::make($request->all(), [
            'nama_provinsi' => ['required', 'string', 'max:255', 'unique:master_provinsi,nama_provinsi'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        $provinsi = WilayahLayanan::create([
            'nama_provinsi' => $request->nama_provinsi,
            'is_active' => $request->has('is_active') ? $request->boolean('is_active') : true,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Wilayah layanan berhasil ditambahkan',
            'data' => $provinsi,
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $provinsi = WilayahLayanan::findOrFail($id);

        // 💡 Auto-fallback jika FE mengirim nama_wilayah
        if (!$request->has('nama_provinsi') && $request->has('nama_wilayah')) {
            $request->merge(['nama_provinsi' => $request->nama_wilayah]);
        }

        $validator = Validator::make($request->all(), [
            'nama_provinsi' => ['sometimes', 'required', 'string', 'max:255', 'unique:master_provinsi,nama_provinsi,' . $provinsi->id_provinsi . ',id_provinsi'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        $provinsi->update($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Wilayah layanan berhasil diperbarui',
            'data' => $provinsi,
        ], 200);
    }

    public function destroy($id)
    {
        $provinsi = WilayahLayanan::findOrFail($id);
        $provinsi->delete();

        return response()->json([
            'success' => true,
            'message' => 'Wilayah layanan berhasil dihapus',
        ], 200);
    }

    public function toggleStatus($id)
    {
        $provinsi = WilayahLayanan::findOrFail($id);
        $provinsi->is_active = !$provinsi->is_active;
        $provinsi->save();

        return response()->json([
            'success' => true,
            'message' => $provinsi->is_active ? 'Wilayah layanan berhasil diaktifkan' : 'Wilayah layanan berhasil dinonaktifkan',
            'data' => $provinsi,
        ], 200);
    }
}
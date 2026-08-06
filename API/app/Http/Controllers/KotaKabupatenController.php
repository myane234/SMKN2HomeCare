<?php

namespace App\Http\Controllers;

use App\Models\KotaKabupaten;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

/**
 * @group Kota / Kabupaten
 *
 * Endpoint master data kota & kabupaten.
 */
class KotaKabupatenController extends Controller
{
    public function index(Request $request)
    {
        $query = KotaKabupaten::with('provinsi');


        if ($request->has('id_provinsi')) {
            $query->where('id_provinsi', $request->query('id_provinsi'));
        }

        $kota = $query->orderBy('nama_kota', 'asc')->get();

        return response()->json([
            'success' => true,
            'message' => 'Berhasil mengambil data kota/kabupaten',
            'data' => $kota,
        ], 200);
    }

    public function show($id)
    {
        $kota = KotaKabupaten::with('provinsi')->findOrFail($id);

        return response()->json([
            'success' => true,
            'message' => 'Berhasil mengambil detail kota/kabupaten',
            'data' => $kota,
        ], 200);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'id_provinsi' => ['required', 'integer', 'exists:master_provinsi,id_provinsi'],
            'nama_kota' => ['required', 'string', 'max:255'],
        ], [
            'id_provinsi.required' => 'ID Provinsi wajib diisi.',
            'id_provinsi.exists' => 'Data provinsi tidak ditemukan.',
            'nama_kota.required' => 'Nama kota/kabupaten wajib diisi.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        $kota = KotaKabupaten::create([
            'id_provinsi' => $request->id_provinsi,
            'nama_kota' => $request->nama_kota,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Kota/kabupaten berhasil ditambahkan',
            'data' => $kota->load('provinsi'),
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $kota = KotaKabupaten::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'id_provinsi' => ['sometimes', 'required', 'integer', 'exists:master_provinsi,id_provinsi'],
            'nama_kota' => ['sometimes', 'required', 'string', 'max:255'],
        ], [
            'id_provinsi.exists' => 'Data provinsi tidak ditemukan.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validasi gagal',
                'errors' => $validator->errors(),
            ], 422);
        }

        $kota->update($validator->validated());

        return response()->json([
            'success' => true,
            'message' => 'Kota/kabupaten berhasil diperbarui',
            'data' => $kota->load('provinsi'),
        ], 200);
    }

    public function destroy($id)
    {
        $kota = KotaKabupaten::findOrFail($id);
        $kota->delete();

        return response()->json([
            'success' => true,
            'message' => 'Kota/kabupaten berhasil dihapus',
        ], 200);
    }

    public function getByProvinsi($id_provinsi)
    {
        $kota = KotaKabupaten::where('id_provinsi', $id_provinsi)
            ->orderBy('nama_kota', 'asc')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Berhasil mengambil data kota/kabupaten berdasarkan provinsi',
            'data' => $kota,
        ], 200);
    }
}
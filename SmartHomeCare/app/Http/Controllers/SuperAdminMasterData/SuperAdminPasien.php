<?php

namespace App\Http\Controllers\SuperAdminMasterData;

use App\Http\Controllers\Controller;
use App\Models\Pasien;
use Illuminate\Http\Request;

class SuperAdminPasien extends Controller
{

    public function index()
    {

        $pasien = Pasien::with('user')->get(); 
        
        return response()->json([
            'success' => true,
            'message' => 'Daftar semua pasien berhasil diambil.',
            'data'    => $pasien
        ], 200);
    }

  
    public function show($id_pasien)
    {
        $pasien = Pasien::with('user')->where('id_pasien', $id_pasien)->first();

        if (!$pasien) {
            return response()->json([
                'success' => false,
                'message' => 'Data pasien tidak ditemukan.'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Detail data pasien berhasil diambil.',
            'data'    => $pasien
        ], 200);
    }


    public function update(Request $request, $id_pasien)
    {
        $pasien = Pasien::where('id_pasien', $id_pasien)->first();

        if (!$pasien) {
            return response()->json([
                'success' => false,
                'message' => 'Data pasien tidak ditemukan.'
            ], 404);
        }

        $request->validate([
            'nama_lengkap'   => 'sometimes|required|string|max:255',
            'no_hp'          => 'sometimes|required|string|max:15',
            'nik'            => 'sometimes|required|string|max:16',
            'jenis_kelamin'  => 'sometimes|required|in:L,P',
            'golongan_darah' => 'sometimes|nullable|string|max:3',
        ]);

        $pasien->update($request->only([
            'nama_lengkap',
            'no_hp',
            'nik',
            'golongan_darah',
            'jenis_kelamin',
            'alamat_utama'
        ]));

        return response()->json([
            'success' => true,
            'message' => 'Data pasien berhasil diperbarui.',
            'data'    => $pasien->load('user')
        ], 200);
    }


    public function toggleStatus($id_pasien)
    {
        $pasien = Pasien::with('user')->where('id_pasien', $id_pasien)->first();

        if (!$pasien || !$pasien->user) {
            return response()->json([
                'success' => false,
                'message' => 'Data pasien atau akun user tidak ditemukan.'
            ], 404);
        }

  
        $user = $pasien->user;
        $user->is_active = !$user->is_active;
        $user->save();

        
        if (!$user->is_active) {
            $user->tokens()->delete();
        }

        $statusText = $user->is_active ? 'diaktifkan' : 'dinonaktifkan';

        return response()->json([
            'success' => true,
            'message' => "Akun pasien berhasil {$statusText}.",
            'data'    => $pasien->load('user')
        ], 200);
    }

    public function destroy($id_pasien)
    {
        $pasien = Pasien::where('id_pasien', $id_pasien)->first();

        if (!$pasien) {
            return response()->json([
                'success' => false,
                'message' => 'Data pasien tidak ditemukan.'
            ], 404);
        }

        $pasien->delete();

        return response()->json([
            'success' => true,
            'message' => 'Data pasien berhasil dihapus.'
        ], 200);
    }
}
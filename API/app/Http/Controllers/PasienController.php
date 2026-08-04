<?php

namespace App\Http\Controllers;

use App\Models\Pasien;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

use Illuminate\Validation\Rule;
use App\Enums\KategoriGoldar;
use App\Enums\JenisKelamin;


/**
 * @group Pasien Panel
 *
 * APIs for patient profile management and profile completion
 */
class PasienController extends Controller
{

    public function index()
    {
        $pasien = Pasien::query()->get();
        return response()->json([
            'success' => true,
            'data' => $pasien
        ], 200);
    }

    // public function store(Request $request)
    // {
        
    // }

    // public function show(Request $request)
    // {
    //     $user = $request->user();
        
    //     if (!$user) {
    //         return response()->json([
    //             'success' => false,
    //             'message' => 'User tidak ditemukan'
    //         ], 401);
    //     }

    //     $pasien = Pasien::query()->where('id_user', $user->id_user)->firstOrFail();
    //     return response()->json($pasien, 200);
    // }

    public function update(Request $request)
{
    $user = $request->user();

    if (!$user) {
        return response()->json([
            'success' => false,
            'message' => 'User tidak ditemukan'
        ], 401);
    }

    $pasien = Pasien::query()->where('id_user', $user->id_user)->first();

    if (!$pasien) {
        return response()->json([
            'success' => false,
            'message' => 'Data pasien tidak ditemukan'
        ], 404);
    }

    // 1. Validasi Input Profil
    $validate = $request->validate([
        'nik'            => 'nullable|string',
        'golongan_darah' => ['nullable', Rule::enum(KategoriGoldar::class)],
        'no_hp'          => 'nullable|string',
        'jenis_kelamin'  => ['nullable', 'string', Rule::enum(JenisKelamin::class)],
        'alamat_utama'   => 'nullable|string',
    ]);

    // 2. Filter data agar hanya meng-update field yang benar-benar dikirimkan
    $dataToUpdate = array_filter($validate, fn ($value) => $value !== null);

    $pasien->update($dataToUpdate);

    return response()->json([
        'success' => true,
        'message' => 'Data Pasien Berhasil Di-update',
        'data'    => $pasien->fresh()
    ], 200);
}

    

    public function destroy(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak ditemukan'
            ]);
        }

        DB::transaction(function () use ($user) {
            $pasien = Pasien::query()->where('id_user', $user->id_user)->first();
            $pasien->delete();
            $user->delete();
        });

        return response()->json([
            'success' => true,
            'message' => 'Data Pasien Berhasil Di hapus',
        ]);
    }

    public function completeProfile(Request $request)
    {
        $user = $request->user();

        if(!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak ditemukan'
            ], 401);
        }

        $pasien = Pasien::query()->where('id_user', $user->id_user)->first();

        if (!$pasien) {
            return response()->json([
                'success' => false,
                'message' => 'Data pasien tidak ditemukan'
            ], 404);
        }

        // Buat rules dinamis: hanya wajibkan (required) yang masih kosong
        $rules = [];

        if (empty($user->password)) {
            $rules['password'] = 'required|string';
        }
        if (empty($pasien->nik)) {
            $rules['nik'] = 'required|string';
        }
        if (empty($pasien->golongan_darah)) {
            $rules['golongan_darah'] = ['required', Rule::enum(KategoriGoldar::class)];
        }
        if (empty($pasien->jenis_kelamin)) {
            $rules['jenis_kelamin'] = 'required|string';
        }
        if (empty($pasien->alamat_utama)) {
            $rules['alamat_utama'] = 'required|string';
        }

        // Jika tidak ada rule berarti sudah lengkap semua
        if (empty($rules)) {
            return response()->json([
                'success' => true,
                'message' => 'Data pasien sudah lengkap semua',
                'data' => $pasien
            ]);
        }

        $validate = $request->validate($rules);

        // Update ke User jika field password terisi
        if (isset($validate['password'])) {
            $user->update([
                'password' => bcrypt($validate['password'])
            ]);
        }

        // Update ke Pasien untuk data-data yang dikirim
        $pasienDataToUpdate = [];
        foreach (['nik', 'golongan_darah', 'jenis_kelamin', 'alamat_utama'] as $field) {
            if (isset($validate[$field])) {
                $pasienDataToUpdate[$field] = $validate[$field];
            }
        }

        if (!empty($pasienDataToUpdate)) {
            $pasien->update($pasienDataToUpdate);
        }

        return response()->json([
            'success' => true,
            'message' => 'Profil Pasien Berhasil Dilengkapi',
            'data' => $pasien
        ]);
    }
}


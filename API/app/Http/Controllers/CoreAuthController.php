<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Pasien;
use App\Models\Users;
use App\Models\TenagaMedis;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Auth\Events\Verified;

/**
 * @group User Authentication
 *
 * APIs for registering, logging in, and managing normal users and patients
 */
class CoreAuthController extends Controller
{
    /**
     * Endpoint untuk mengambil detail profil user yang sedang login
     */
    public function me(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak ditemukan atau belum login'
            ], 401);
        }

        // Ambil daftar role user
        $userRoles = $user->roles()->pluck('nama_role')->toArray();

        // Ambil data Pasien & Tenaga Medis terkait
        $pasien = Pasien::where('id_user', $user->id_user)->first();
        $tenagaMedis = TenagaMedis::with('kategoriLayanan')->where('id_user', $user->id_user)->first();

        // Cek kelengkapan profil pasien
        $isProfileComplete = $pasien && $pasien->nik && $pasien->golongan_darah && $pasien->jenis_kelamin && $pasien->alamat_utama;

        return response()->json([
            'success' => true,
            'message' => 'Berhasil mengambil data profil',
            'data' => [
                'user' => [
                    'id_user' => $user->id_user,
                    'email' => $user->email,
                    'is_active' => $user->is_active,
                    'email_verified_at' => $user->email_verified_at,
                ],
                'roles' => $userRoles,
                'is_profile_complete' => (bool) $isProfileComplete,
                'pasien' => $pasien,
                'tenaga_medis' => $tenagaMedis,
            ]
        ], 200);
    }

    /**
     * Endpoint Register Pasien + Kirim Email Verifikasi via Resend
     */
    public function register(Request $request)
    {
        $validate = $request->validate([
            'email' => ['required', 'string', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'nama_lengkap' => ['required', 'string'],
            'no_hp' => ['nullable', 'string'],
            'nik' => ['required', 'string', 'size:16'],
            'golongan_darah' => ['nullable', 'in:A,B,AB,O'],
            'jenis_kelamin' => ['required', 'in:L,P'],
            'alamat_utama' => ['required', 'string']
        ]);

        $createdUser = null;

        $pasien = DB::transaction(function () use ($validate, &$createdUser) {
            $createdUser = Users::create([
                'email' => $validate['email'],
                'password' => Hash::make($validate['password']),
                'is_active' => true
            ]);

            $createdUser->roles()->attach(2);

            return Pasien::create([
                'id_user' => $createdUser->id_user,
                'nama_lengkap' => $validate['nama_lengkap'],
                'no_hp' => $validate['no_hp'] ?? null,
                'nik' => $validate['nik'],
                'golongan_darah' => $validate['golongan_darah'] ?? null,
                'jenis_kelamin' => $validate['jenis_kelamin'],
                'alamat_utama' => $validate['alamat_utama']
            ]);
        });

        if ($createdUser) {
            $createdUser->sendEmailVerificationNotification();
        }

        return response()->json([
            'success' => true,
            'message' => 'Registrasi berhasil! Silakan periksa inbox email Anda untuk verifikasi akun.',
            'data' => $pasien
        ], 201);
    }

    /**
     * Endpoint Verifikasi Email
     */
    public function verifyEmail(Request $request, $id, $hash)
{

    $user = Users::where('id_user', $id)->firstOrFail();


    if (! hash_equals((string) $hash, sha1($user->getEmailForVerification()))) {
        return response()->json([
            'success' => false,
            'message' => 'Link verifikasi tidak valid atau telah diubah.'
        ], 400);
    }


    if ($user->hasVerifiedEmail()) {
        return response()->json([
            'success' => true,
            'message' => 'Email Anda sudah terverifikasi sebelumnya.'
        ]);
    }


    if ($user->markEmailAsVerified()) {
        event(new Verified($user));
    }

    return response()->json([
        'success' => true,
        'message' => 'Email berhasil diverifikasi! Silakan login.'
    ]);
}

/**
 * Ganti email saat Verif
 */

public function changeUnverifiedEmail(Request $request)
{
    $request->validate([
        'old_email' => ['required', 'email'],
        'new_email' => ['required', 'email', 'unique:users,email'],
    ]);

    $user = Users::where('email', $request->old_email)->first();

    if (!$user) {
        return response()->json([
            'success' => false,
            'message' => 'Data pendaftaran tidak ditemukan.'
        ], 404);
    }

    if ($user->hasVerifiedEmail()) {
        return response()->json([
            'success' => false,
            'message' => 'Email ini sudah terverifikasi.'
        ], 400);
    }

    $user->email = $request->new_email;
    $user->save();

    $user->sendEmailVerificationNotification();

    return response()->json([
        'success' => true,
        'message' => 'Email berhasil diperbarui. Link verifikasi baru telah dikirim ke ' . $request->new_email
    ]);
}

    /**
     * Endpoint Kirim Ulang Email Verifikasi
     */
    public function resendVerificationEmail(Request $request)
    {
        $request->validate(['email' => 'required|email']);
        $user = Users::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Email tidak ditemukan.'], 404);
        }

        if ($user->hasVerifiedEmail()) {
            return response()->json(['success' => false, 'message' => 'Email ini sudah terverifikasi.']);
        }

        $user->sendEmailVerificationNotification();

        return response()->json([
            'success' => true,
            'message' => 'Link verifikasi baru telah dikirim ke email Anda.'
        ]);
    }

    /**
     * Endpoint Login Pasien & Nakes (Unified & Token-Based)
     */
    public function login(Request $request)
    {
        $validate = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = Users::whereEmail($validate['email'])->first();

        if (!$user || !Hash::check($validate['password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Data login salah'
            ], 401);
        }

        if (!$user->hasVerifiedEmail()) {
            return response()->json([
                'success' => false,
                'is_unverified' => true,
                'message' => 'Email Anda belum diverifikasi. Silakan periksa inbox email Anda.'
            ], 403);
        }

        $userRoles = $user->roles()->pluck('nama_role')->toArray();

        if (!in_array('pasien', $userRoles) && !in_array('nakes', $userRoles)) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses untuk masuk.'
            ], 403);
        }

        if (!$user->is_active) {
            return response()->json([
                'success' => false,
                'message' => 'Akun Anda telah dinonaktifkan oleh admin.'
            ], 403);
        }

        $token = $user->createToken('auth-token')->plainTextToken;

        $pasien = Pasien::whereIdUser($user->id_user)->first();
        $tenagaMedis = TenagaMedis::where('id_user', $user->id_user)->first();

        $isProfileComplete = $pasien && $pasien->nik && $pasien->golongan_darah && $pasien->jenis_kelamin && $pasien->alamat_utama;

        $nama = 'Guest';
        if ($pasien && $pasien->nama_lengkap) {
            $nama = $pasien->nama_lengkap;
        } elseif ($tenagaMedis && $tenagaMedis->nama_lengkap) {
            $nama = $tenagaMedis->nama_lengkap;
        } else {
            $nama = $user->email;
        }

        $responseData = [
            'token' => $token,
            'roles' => $userRoles,
            'nama' => $nama,
            'is_profile_complete' => (bool) $isProfileComplete
        ];

        if (in_array('nakes', $userRoles)) {
            $responseData['tenaga_medis'] = $tenagaMedis;
        }

        return response()->json([
            'success' => true,
            'message' => 'Berhasil Login',
            'data' => $responseData
        ]);
    }

    /**
     * Endpoint Logout
     */
    public function logout(Request $request) {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Berhasil Logout'
        ]);
    }
}
<?php

namespace App\Http\Controllers;

use App\Models\Pasien;
use App\Models\Users;
use App\Models\Role;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Facades\Log;

/**
 * @group User Authentication
 * 
 * Endpoint Login Pasien Dengan Google (rencana pasien dan nakes sih)
 */

class GooglePasienController extends Controller
{
  public function handleGoogleCallback(Request $request)
  {
    $request->validate([
      'access_token' => 'required|string',
    ]);

    try {
      /** @var \Laravel\Socialite\Two\AbstractProvider $driver */
      $driver = Socialite::driver('google');
      $googleUser = $driver->userFromToken($request->access_token);

      $User = DB::transaction(function () use ($googleUser) {
        $checkUser = Users::where('email', '=', $googleUser->getEmail(), 'and')->first();

        if (!$checkUser) {
          $user = Users::create([
            'email' => $googleUser->getEmail(),
            'password' => null,
            'is_active' => true,
            'google_id' => $googleUser->getId(),
          ]);

         $user->roles()->attach(2);

          Pasien::create([
            'id_user' => $user->id_user,
            'nama_lengkap' => $googleUser->getName() ?? 'Guest',
            'nik' => null,
            'golongan_darah' => null,
            'jenis_kelamin' => null,
            'alamat_utama' => null,
          ]);
          return $user;
        } 
        elseif (!$checkUser->google_id) {
          $checkUser->update(['google_id' => $googleUser->getId()]);
        }

        return $checkUser;
      });

      if (!$User->is_active) {
        return response()->json([
          'success' => false,
          'message' => 'Akun Anda telah dinonaktifkan oleh admin.',
        ], 403);
      }

      $User->load('pasien');
      $userRoles = $User->roles()->pluck('nama_role')->toArray();

      $token = $User->createToken('auth-token')->plainTextToken;
      $pasien = $User->pasien;
      $isProfileComplete = $pasien && $pasien->nik && $pasien->golongan_darah && $pasien->jenis_kelamin && $pasien->alamat_utama && $User->password;

      return response()->json([
        'success' => true,
        'message' => 'Login Google Berhasil',
        'token' => $token,
        'user' => $User,
        'roles' => $userRoles,
        'is_profile_complete' => (bool) $isProfileComplete
      ], 200);
    } catch (Exception $e) {
    Log::error($e->getMessage());

      return response()->json([
        'success' => false,
        'message' => 'Login Google Gagal',
      ], 500);
    }
  }

  
}


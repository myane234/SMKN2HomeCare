<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Users;
use App\Models\Admin;
use Illuminate\Support\Facades\Hash;

/**
 * @group Super Admin Authentication
 * Endpoint autentikasi untuk Super Admin
 */
class SuperAdminAuthController extends Controller
{
    public function login(Request $request)
    {
        $validate = $request->validate([
            'email'    => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = Users::whereEmail($validate['email'])->first();

        if (!$user || !Hash::check($validate['password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Email atau password salah',
            ], 401);
        }

        // Harus punya role admin
        $roles = $user->roles()->pluck('nama_role')->toArray();
        if (!in_array('admin', $roles)) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses',
            ], 403);
        }

        // Harus berstatus Super Admin
        $admin = Admin::where('id_user', $user->id_user)->first();

        if (!$admin || $admin->tier_admin !== 'Super Admin') {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Hanya Super Admin yang diizinkan.',
            ], 403);
        }

        // Revoke token lama (opsional, bersihkan sesi sebelumnya)
        $user->tokens()->where('name', 'super-admin-token')->delete();

        $token = $user->createToken('super-admin-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Berhasil login sebagai Super Admin',
            'data'    => [
                'token'      => $token,
                'roles'      => $roles,
                'tier_admin' => $admin->tier_admin,
                'nama'       => $admin->nama_lengkap,
                'email'      => $user->email,
            ],
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Berhasil logout',
        ]);
    }

    public function me(Request $request)
    {
        $user  = $request->user();
        $admin = Admin::where('id_user', $user->id_user)->first();

        return response()->json([
            'success' => true,
            'data'    => [
                'email'      => $user->email,
                'nama'       => $admin?->nama_lengkap,
                'tier_admin' => $admin?->tier_admin,
                'roles'      => $user->roles()->pluck('nama_role'),
            ],
        ]);
    }
}

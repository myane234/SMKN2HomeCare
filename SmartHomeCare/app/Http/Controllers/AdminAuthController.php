<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Users;
use App\Models\Admin;
use Illuminate\Support\Facades\Hash;

/**
 * @group Admin Authentication
 *
 * APIs for logging in and managing Admin CMS authentication
 */
class AdminAuthController extends Controller
{
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

        // Check if user has admin role
        $roles = $user->roles()->pluck('nama_role')->toArray();
        if (!in_array('admin', $roles)) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses admin'
            ], 403);
        }

        $admin = Admin::where('id_user', $user->id_user)->first();

        // Inject super_admin to roles if tier_admin is Super Admin
        if ($admin && $admin->tier_admin === 'Super Admin') {
            $roles[] = 'super_admin';
        }

        // Use Sanctum for token generation
        $token = $user->createToken('admin-token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Berhasil Login sebagai Admin',
            'data' => [
                'token' => $token,
                'roles' => $roles,
                'nama' => $admin ? $admin->nama_lengkap : 'Admin',
            ]
        ]);
    }

    public function logout(Request $request)
    {
        // Revoke the token that was used to authenticate the current request...
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Berhasil Logout'
        ]);
    }
}

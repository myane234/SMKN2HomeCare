<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use Exception;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use App\Enums\KategoriAdmin;
use Illuminate\Support\Facades\Log;

/**
 * @group Super Admin - Admin Management
 *
 * APIs for Super Admin to create, list, and delete CMS Admin users
 */
class AdminController extends Controller
{
    public function index()
    {
        $data = Admin::query()->get();

        return response()->json([
            'success' => true,
            'message' => 'Berhasil Mengambil Data user Admin',
            'data' => $data,
            'total' => count($data)
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'id_user' => ['required', 'integer'],
            'nama_lengkap' => ['required', 'string', 'max:255'],
            'tier_admin' => ['required', Rule::enum(KategoriAdmin::class)],
        ]);

        $admin = Admin::create($validated);
        return response()->json([
            'success' => true,
            'message' => 'Berhasil Create Admin',
            'data' => $admin
        ], 201);
    }

    public function show($id)
    {
        $admin = Admin::query()->findOrFail($id);
        return response()->json($admin, 200);
    }

    public function update(Request $request, $id)
    {
        $admin = Admin::query()->findOrFail($id);

        $validated = $request->validate([
            'id_user' => ['sometimes', 'required', 'integer'],
            'nama_lengkap' => ['sometimes', 'required', 'string', 'max:255'],
            'tier_admin' => ['sometimes', Rule::enum(KategoriAdmin::class)],
        ]);

        $admin->fill($validated);
        $admin->save();

        return response()->json($admin, 200);
    }

    public function destroy($id)
    {

    try {
        $admin = Admin::query()->findOrFail($id);
        $admin->delete($id);

        return response()->json([
            'success' => true,
            'message' => "Berhasil Hapus User"
        ], 200);

    } catch(Exception $e) {
        Log::error($e->getMessage());
        return response()->json([
            'success' => false,
            'message' => 'Gagal Hapus User'
        ], 500);
    }
        
    }
}


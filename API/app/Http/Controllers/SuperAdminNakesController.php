<?php

namespace App\Http\Controllers;

use App\Models\Admin;
use App\Models\TenagaMedis;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class SuperAdminNakesController extends Controller
{
    private function authorizeSuperAdmin(Request $request)
    {
        $user = $request->user();
        $admin = Admin::where('id_user', $user?->id_user)->first();

        if (!$admin || $admin->tier_admin !== 'Super Admin') {
            return response()->json([
                'success' => false,
                'message' => 'Akses ditolak. Hanya Super Admin yang dapat mengelola data Nakes.'
            ], 403);
        }

        return null;
    }

    public function index(Request $request)
    {
        $denied = $this->authorizeSuperAdmin($request);
        if ($denied) {
            return $denied;
        }

        $data = TenagaMedis::with(['user', 'pasien', 'kategoriLayanan'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Berhasil mengambil data Nakes',
            'data' => $data,
            'total' => $data->count(),
        ]);
    }

    public function show(Request $request, $id)
    {
        $denied = $this->authorizeSuperAdmin($request);
        if ($denied) {
            return $denied;
        }

        $tenagaMedis = TenagaMedis::with(['user', 'pasien', 'kategoriLayanan'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $tenagaMedis,
        ]);
    }

    public function update(Request $request, $id)
    {
        $denied = $this->authorizeSuperAdmin($request);
        if ($denied) {
            return $denied;
        }

        $tenagaMedis = TenagaMedis::findOrFail($id);

        $validated = $request->validate([
            'nama_lengkap' => ['sometimes', 'required', 'string', 'max:255'],
            'nik' => ['sometimes', 'required', 'string', 'regex:/^[0-9]{16}$/'],
            'jenis_tenaga_medis' => ['sometimes', 'required', 'string', 'max:100'],
            'no_str' => ['sometimes', 'required', 'string', 'regex:/^[0-9]{16}$/'],
            'lulusan' => ['sometimes', 'nullable', 'string', 'max:255'],
            'latitude' => ['sometimes', 'nullable', 'numeric'],
            'longitude' => ['sometimes', 'nullable', 'numeric'],
            'foto_profile' => ['sometimes', 'image', 'mimes:jpeg,png,jpg,webp', 'max:5120'],
            'id_wilayah_layanan' => ['sometimes', 'nullable', 'exists:wilayah_layanan,id'],
            'alamat_lengkap' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'kategori_layanan' => ['sometimes', 'array'],
            'kategori_layanan.*' => ['exists:kategori_layanans,id_kategori_layanan'],
        ]);

        if ($request->hasFile('foto_profile')) {
            $file = $request->file('foto_profile');
            $filename = 'nakes_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
            $path = $file->storeAs('uploads/nakes', $filename, 'public');
            $validated['foto_profile'] = '/storage/' . $path;
        }

        $tenagaMedis->fill($validated);
        $tenagaMedis->save();

        if ($request->has('kategori_layanan')) {
            $tenagaMedis->kategoriLayanan()->sync($request->kategori_layanan);
        }

        return response()->json([
            'success' => true,
            'message' => 'Data Nakes berhasil diperbarui oleh Super Admin',
            'data' => $tenagaMedis->fresh(),
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $denied = $this->authorizeSuperAdmin($request);
        if ($denied) {
            return $denied;
        }

        $tenagaMedis = TenagaMedis::findOrFail($id);
        $user = $tenagaMedis->user;

        if ($user) {
            $user->roles()->detach(3);
        }

        $tenagaMedis->delete();

        return response()->json([
            'success' => true,
            'message' => 'Data Nakes berhasil dihapus oleh Super Admin',
        ]);
    }
}

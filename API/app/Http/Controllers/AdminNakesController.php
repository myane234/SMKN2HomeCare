<?php

namespace App\Http\Controllers;

use App\Models\TenagaMedis;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

/**
 * @group Admin Nakes Management
 *
 * APIs for managing nakes registration requests and active health workers
 */
class AdminNakesController extends Controller
{
    /**
     * List semua pendaftaran nakes (Bisa filter status: pending, pelatihan, approved, rejected)
     */
    public function index(Request $request)
    {
        $status = $request->query('status');
        
        $query = TenagaMedis::with(['user', 'pasien', 'wilayahLayanan', 'kategoriLayanan'])
            ->orderBy('created_at', 'desc');

        if ($status && in_array(strtolower($status), ['pending', 'pelatihan', 'approved', 'rejected'])) {
            $query->where('status', strtolower($status));
        }

        $nakesRequests = $query->get();

        return response()->json([
            'success' => true,
            'message' => 'Berhasil mengambil daftar pendaftaran Nakes.',
            'data'    => $nakesRequests
        ]);
    }

    /**
     * List khusus tenaga medis yang sudah aktif / approved
     */
    public function listActiveNakes()
    {
        $tenagaMedis = TenagaMedis::with(['user', 'pasien', 'wilayahLayanan', 'kategoriLayanan'])
            ->where('status', 'approved')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'Berhasil mengambil daftar Nakes aktif.',
            'data'    => $tenagaMedis
        ]);
    }

    /**
     * Detail lengkap nakes beserta berkas, wilayah, dan kategori layanannya
     */
    public function show($id)
    {
        $tenagaMedis = TenagaMedis::with(['user', 'pasien', 'wilayahLayanan', 'kategoriLayanan'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'message' => 'Berhasil mengambil detail Nakes.',
            'data'    => $tenagaMedis
        ]);
    }

    /**
     * STEP 1: Ajukan Pendaftaran ke Tahap Pelatihan (Harus dari status 'pending')
     */
    public function setPelatihan(Request $request, $id)
    {
        $tenagaMedis = TenagaMedis::findOrFail($id);

        // Validasi Ketat: Hanya boleh dari 'pending'
        if ($tenagaMedis->status !== 'pending') {
            return response()->json([
                'success' => false,
                'message' => 'Hanya pendaftaran berstatus "pending" yang dapat diajukan ke tahap pelatihan.'
            ], 400);
        }

        $tenagaMedis->update([
            'status'      => 'pelatihan',
            'admin_notes' => null
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pendaftaran Nakes berhasil diajukan ke tahap pelatihan.',
            'data'    => $tenagaMedis->fresh(['user', 'pasien', 'wilayahLayanan', 'kategoriLayanan'])
        ]);
    }

    /**
     * STEP 2: Approve Pelatihan & Aktifkan Akun (Harus dari status 'pelatihan')
     */
    public function approve(Request $request, $id)
    {
        $tenagaMedis = TenagaMedis::findOrFail($id);

        // Validasi Ketat: Harus sudah berada di tahap 'pelatihan'
        if ($tenagaMedis->status !== 'pelatihan') {
            return response()->json([
                'success' => false,
                'message' => 'Pendaftaran Nakes tidak bisa langsung di-approve. Harus diajukan ke tahap pelatihan terlebih dahulu.'
            ], 400);
        }

        $result = DB::transaction(function () use ($tenagaMedis) {
            // 1. Update status nakes di tabel tenaga_medis menjadi 'approved'
            $tenagaMedis->update([
                'status'      => 'approved',
                'admin_notes' => null
            ]);

            // 2. Aktifkan/Attach Role Nakes (id_role = 3) ke User
            $user = $tenagaMedis->user;
            if ($user && !$user->roles()->where('user_roles.id_role', 3)->exists()) {
                $user->roles()->attach(3);
            }

            return $tenagaMedis->fresh(['user', 'pasien', 'wilayahLayanan', 'kategoriLayanan']);
        });

        return response()->json([
            'success' => true,
            'message' => 'Nakes dinyatakan lulus pelatihan dan akun/role Nakes berhasil diaktifkan.',
            'data'    => $result
        ]);
    }

    /**
     * REJECT: Tolak Pendaftaran (Dapat dilakukan saat status 'pending' maupun 'pelatihan')
     */
    public function reject(Request $request, $id)
    {
        $tenagaMedis = TenagaMedis::findOrFail($id);

        if ($tenagaMedis->status === 'approved') {
            return response()->json([
                'success' => false,
                'message' => 'Nakes yang sudah di-approve/aktif tidak bisa langsung di-reject.'
            ], 400);
        }

        if ($tenagaMedis->status === 'rejected') {
            return response()->json([
                'success' => false,
                'message' => 'Pendaftaran Nakes ini sudah di-reject sebelumnya.'
            ], 400);
        }

        $validate = $request->validate([
            'admin_notes' => ['required', 'string', 'max:1000']
        ], [
            'admin_notes.required' => 'Alasan penolakan (admin_notes) wajib diisi.'
        ]);

        $tenagaMedis->update([
            'status'      => 'rejected',
            'admin_notes' => $validate['admin_notes']
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Pendaftaran Nakes berhasil ditolak.',
            'data'    => $tenagaMedis->fresh(['user', 'pasien', 'wilayahLayanan', 'kategoriLayanan'])
        ]);
    }
}
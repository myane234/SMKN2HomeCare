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
     * List semua pendaftaran nakes (Bisa filter status: pending, approved, rejected)
     */
    public function index(Request $request)
    {
        $status = $request->query('status');
        $query = TenagaMedis::with(['user', 'pasien'])
            ->orderBy('created_at', 'desc');

        if ($status && in_array(strtolower($status), ['pending', 'approved', 'rejected', 'pelatihan'])) {
            $query->where('status', strtolower($status));
        }

        $nakesRequests = $query->get();

        return response()->json([
            'success' => true,
            'data' => $nakesRequests
        ]);
    }

    /**
     * List khusus tenaga medis yang sudah aktif / approved
     */
    public function listActiveNakes()
    {
        $tenagaMedis = TenagaMedis::with(['user', 'pasien'])
            ->where('status', 'approved')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $tenagaMedis
        ]);
    }

    /**
     * Detail lengkap nakes beserta file & pengalaman kerjanya
     */
    public function show($id)
    {
        $tenagaMedis = TenagaMedis::with(['user', 'pasien'])->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $tenagaMedis
        ]);
    }

    /**
     * Approve nakes request (Ubah status jadi approved & aktifkan Role Nakes)
     */
    public function pelatihan(Request $request, $id)
    {
        $tenagaMedis = TenagaMedis::findOrFail($id);

        if ($tenagaMedis->status === 'approved') {
            return response()->json([
                'success' => false,
                'message' => 'Pendaftaran Nakes ini sudah di-approve sebelumnya.'
            ], 400);
        }

        $result = DB::transaction(function () use ($tenagaMedis) {
            // 1. Update status nakes di tabel tenaga_medis
            $tenagaMedis->update([
                'status' => 'approved',
                'admin_notes' => null
            ]);

            // 2. Attach role nakes (role_id = 3) ke user jika belum ada
            $user = $tenagaMedis->user;
            if ($user && !$user->roles()->where('user_roles.id_role', 3)->exists()) {
                $user->roles()->attach(3);
            }

            return $tenagaMedis->fresh(['user', 'pasien']);
        });

        return response()->json([
            'success' => true,
            'message' => 'Nakes request berhasil di-approve. Role Nakes telah diaktifkan.',
            'data' => $result
        ]);
    }

    /**
     * Reject nakes request (Bisa ditolak dari status pending maupun pelatihan)
     */
    public function reject(Request $request, $id)
    {
        $tenagaMedis = TenagaMedis::findOrFail($id);

        if ($tenagaMedis->status === 'approved') {
            return response()->json([
                'success' => false,
                'message' => 'Nakes yang sudah status approved tidak bisa langsung di-reject.'
            ], 400);
        }

        $validate = $request->validate([
            'admin_notes' => ['required', 'string']
        ], [
            'admin_notes.required' => 'Alasan penolakan (admin_notes) wajib diisi.'
        ]);

        $tenagaMedis->update([
            'status' => 'rejected',
            'admin_notes' => $validate['admin_notes']
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Nakes request berhasil di-reject.',
            'data' => $tenagaMedis->fresh(['user', 'pasien'])
        ]);
    }
}
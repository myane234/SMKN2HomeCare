<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\TenagaMedis;
use App\Models\Pasien;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

/**
 * @group Tenaga Medis Panel
 * 
 * Endpoint Pendaftaran & Manajemen Profil Tenaga Medis (Nakes)
 * Syarat Wajib: User harus terautentikasi DAN sudah memiliki profil Pasien terdaftar.
 */
class TenagaMedisController extends Controller
{
    /**
     * Endpoint Pendaftaran Nakes (4 Step FE)
     */
    public function register(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User harus login terlebih dahulu.'
            ], 401);
        }

        // GUARD 1: User harus terdaftar sebagai Pasien
        $pasien = Pasien::where('id_user', $user->id_user)->first();

        if (!$pasien) {
            return response()->json([
                'success' => false,
                'message' => 'Pendaftaran Nakes gagal. Anda harus terdaftar dan login sebagai Pasien terlebih dahulu.'
            ], 403);
        }

        // GUARD 2: Cek pendaftaran nakes yang sudah ada
        $existingNakes = TenagaMedis::where('id_user', $user->id_user)->first();

        if ($existingNakes) {
            if (in_array($existingNakes->status, ['pending', 'pelatihan'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Permohonan pendaftaran Nakes Anda sedang diproses oleh admin. Harap tunggu persetujuan.'
                ], 400);
            }

            if ($existingNakes->status === 'approved') {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda sudah terdaftar sebagai Tenaga Kesehatan aktif.'
                ], 400);
            }
        }

        // VALIDASI INPUT 4 STEP DARI FE
        $validate = $request->validate([
            // Step 1: Data Diri
            'nama_lengkap'       => ['required', 'string', 'max:255'],
            'nik'                => ['required', 'string', 'regex:/^[0-9]{16}$/'],
            'jenis_kelamin'      => ['nullable', 'in:L,P'],
            'tempat_lahir'       => ['nullable', 'string', 'max:255'],
            'tanggal_lahir'      => ['nullable', 'date'],
            'alamat_lengkap'     => ['nullable', 'string', 'max:1000'],
            'no_telp'            => ['nullable', 'string', 'max:15'],
            'foto_profile'       => ['required', 'image', 'mimes:jpeg,png,jpg,webp', 'max:5120'],

            // Step 2: Legalitas & Profesi
            'jenis_tenaga_medis' => ['required', 'string', 'max:100'],
            'no_str'             => ['required', 'string', 'max:255'],
            'no_sip'             => ['nullable', 'string', 'max:255'],
            'no_npwp'            => ['nullable', 'string', 'max:255'],
            'lulusan'            => ['nullable', 'string', 'max:255'],

            // Step 3: Upload Dokumen File
            'ijazah'             => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'sertifikat'         => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'file_cv'            => ['nullable', 'file', 'mimes:pdf,doc,docx', 'max:5120'],
            'file_skck'          => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'file_str'           => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'file_sip'           => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],

            // Step 4: Pengalaman & Seminar (Array / JSON String)
            'pengalaman_kerja'   => ['nullable'],
            'seminar_pelatihan'  => ['nullable'],

            // GPS Coordinates
            'latitude'           => ['nullable', 'numeric'],
            'longitude'          => ['nullable', 'numeric'],
            'id_wilayah_layanan' => ['nullable', 'integer'],
        ], [
            'nik.required'          => 'NIK wajib diisi.',
            'nik.regex'             => 'NIK harus tepat 16 digit angka.',
            'nama_lengkap.required' => 'Nama lengkap wajib diisi.',
            'no_str.required'       => 'Nomor STR wajib diisi.',
            'foto_profile.required' => 'Foto profil medis wajib diunggah.',
            'foto_profile.image'    => 'Foto profil harus berupa gambar.',
            'foto_profile.max'      => 'Ukuran foto maksimal 5 MB.',
            'jenis_tenaga_medis.required' => 'Jenis tenaga medis wajib dipilih.',
        ]);

        // HELPER UPLOAD FILE
        $uploadFile = function ($fieldName, $folder = 'uploads/nakes/docs') use ($request) {
            if ($request->hasFile($fieldName)) {
                $file = $request->file($fieldName);
                $filename = $fieldName . '_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                $path = $file->storeAs($folder, $filename, 'public');
                return '/storage/' . $path;
            }
            return null;
        };

        // Kumpulkan Lokasi File
        $filesData = [
            'foto_profile' => $uploadFile('foto_profile', 'uploads/nakes/profiles'),
            'ijazah'       => $uploadFile('ijazah'),
            'sertifikat'   => $uploadFile('sertifikat'),
            'file_cv'      => $uploadFile('file_cv'),
            'file_skck'    => $uploadFile('file_skck'),
            'file_str'     => $uploadFile('file_str'),
            'file_sip'     => $uploadFile('file_sip'),
        ];

        // Decodes JSON String jika dikirim via FormData FE
        $pengalaman = $request->input('pengalaman_kerja');
        if (is_string($pengalaman)) {
            $pengalaman = json_decode($pengalaman, true);
        }

        $seminar = $request->input('seminar_pelatihan');
        if (is_string($seminar)) {
            $seminar = json_decode($seminar, true);
        }

        // SIMPAN / RE-APPLY DATA KE TABEL TENAGA_MEDIS
        $nakes = TenagaMedis::updateOrCreate(
            ['id_user' => $user->id_user],
            [
                'id_pasien'          => $pasien->id_pasien,
                'id_wilayah_layanan' => $validate['id_wilayah_layanan'] ?? null,
                'nama_lengkap'       => $validate['nama_lengkap'],
                'nik'                => $validate['nik'],
                'jenis_kelamin'      => $validate['jenis_kelamin'] ?? null,
                'tempat_lahir'       => $validate['tempat_lahir'] ?? null,
                'tanggal_lahir'      => $validate['tanggal_lahir'] ?? null,
                'alamat_lengkap'     => $validate['alamat_lengkap'] ?? null,
                'no_telp'            => $validate['no_telp'] ?? null,
                
                'jenis_tenaga_medis' => $validate['jenis_tenaga_medis'],
                'no_str'             => $validate['no_str'],
                'no_sip'             => $validate['no_sip'] ?? null,
                'no_npwp'            => $validate['no_npwp'] ?? null,
                'lulusan'            => $validate['lulusan'] ?? null,

                'foto_profile'       => $filesData['foto_profile'] ?? $existingNakes?->foto_profile,
                'ijazah'             => $filesData['ijazah'] ?? $existingNakes?->ijazah,
                'sertifikat'         => $filesData['sertifikat'] ?? $existingNakes?->sertifikat,
                'file_cv'            => $filesData['file_cv'] ?? $existingNakes?->file_cv,
                'file_skck'          => $filesData['file_skck'] ?? $existingNakes?->file_skck,
                'file_str'           => $filesData['file_str'] ?? $existingNakes?->file_str,
                'file_sip'           => $filesData['file_sip'] ?? $existingNakes?->file_sip,

                'pengalaman_kerja'   => $pengalaman,
                'seminar_pelatihan'  => $seminar,

                'latitude'           => $validate['latitude'] ?? null,
                'longitude'          => $validate['longitude'] ?? null,

                'status'             => 'pending',
                'admin_notes'        => null,
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Pendaftaran Nakes berhasil dikirim. Menunggu persetujuan admin.',
            'data'    => $nakes
        ], 201);
    }

    /**
     * Tampilkan Detail Profil Nakes User Login
     */
    public function show(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak ditemukan.'
            ], 401);
        }

        // Menambahkan 'wilayahLayanan' ke dalam with()
        $tenagaMedis = TenagaMedis::with(['user', 'pasien', 'kategoriLayanan', 'wilayahLayanan'])
            ->where('id_user', $user->id_user)
            ->first();

        if (!$tenagaMedis) {
            return response()->json([
                'success' => false,
                'message' => 'Data profil Tenaga Medis tidak ditemukan.'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data'    => $tenagaMedis
        ], 200);
    }

    /**
     * Update Detail Profil Nakes
     */
    public function update(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak ditemukan.'
            ], 401);
        }

        $tenagaMedis = TenagaMedis::where('id_user', $user->id_user)->first();

        if (!$tenagaMedis) {
            return response()->json([
                'success' => false,
                'message' => 'Data Tenaga Medis tidak ditemukan.'
            ], 404);
        }

        $validated = $request->validate([
            'nama_lengkap'       => ['sometimes', 'required', 'string', 'max:255'],
            'nik'                => ['sometimes', 'required', 'string', 'regex:/^[0-9]{16}$/'],
            'jenis_kelamin'      => ['sometimes', 'nullable', 'in:L,P'],
            'tempat_lahir'       => ['sometimes', 'nullable', 'string', 'max:255'],
            'tanggal_lahir'      => ['sometimes', 'nullable', 'date'],
            'alamat_lengkap'     => ['sometimes', 'nullable', 'string', 'max:1000'],
            'no_telp'            => ['sometimes', 'nullable', 'string', 'max:15'],

            'jenis_tenaga_medis' => ['sometimes', 'required', 'string', 'max:100'],
            'no_str'             => ['sometimes', 'required', 'string', 'max:255'],
            'no_sip'             => ['sometimes', 'nullable', 'string', 'max:255'],
            'no_npwp'            => ['sometimes', 'nullable', 'string', 'max:255'],
            'lulusan'            => ['sometimes', 'nullable', 'string', 'max:255'],

            'foto_profile'       => ['sometimes', 'image', 'mimes:jpeg,png,jpg,webp', 'max:5120'],
            'ijazah'             => ['sometimes', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'sertifikat'         => ['sometimes', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'file_cv'            => ['sometimes', 'file', 'mimes:pdf,doc,docx', 'max:5120'],
            'file_skck'          => ['sometimes', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'file_str'           => ['sometimes', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'file_sip'           => ['sometimes', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],

            'pengalaman_kerja'   => ['sometimes', 'nullable'],
            'seminar_pelatihan'  => ['sometimes', 'nullable'],

            'latitude'           => ['sometimes', 'nullable', 'numeric'],
            'longitude'          => ['sometimes', 'nullable', 'numeric'],
            'id_wilayah_layanan' => ['sometimes', 'nullable', 'integer'],

            'kategori_layanan'   => ['sometimes', 'array'],
            'kategori_layanan.*' => ['exists:kategori_layanan,id_kategori_layanan'],
        ]);

        // Helper update file
        $uploadFile = function ($fieldName, $folder = 'uploads/nakes/docs') use ($request) {
            if ($request->hasFile($fieldName)) {
                $file = $request->file($fieldName);
                $filename = $fieldName . '_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                $path = $file->storeAs($folder, $filename, 'public');
                return '/storage/' . $path;
            }
            return null;
        };

        // File Updates
        $fileFields = ['foto_profile', 'ijazah', 'sertifikat', 'file_cv', 'file_skck', 'file_str', 'file_sip'];
        foreach ($fileFields as $field) {
            $folder = ($field === 'foto_profile') ? 'uploads/nakes/profiles' : 'uploads/nakes/docs';
            $uploadedPath = $uploadFile($field, $folder);
            if ($uploadedPath) {
                $validated[$field] = $uploadedPath;
            }
        }

        // Handle JSON Arrays jika berupa String
        if (isset($validated['pengalaman_kerja']) && is_string($validated['pengalaman_kerja'])) {
            $validated['pengalaman_kerja'] = json_decode($validated['pengalaman_kerja'], true);
        }

        if (isset($validated['seminar_pelatihan']) && is_string($validated['seminar_pelatihan'])) {
            $validated['seminar_pelatihan'] = json_decode($validated['seminar_pelatihan'], true);
        }

        $tenagaMedis->fill($validated);
        $tenagaMedis->save();

        // Sync Relasi Kategori Layanan jika disertakan
        if ($request->has('kategori_layanan')) {
            $tenagaMedis->kategoriLayanan()->sync($request->kategori_layanan);
        }

        return response()->json([
            'success' => true,
            'message' => 'Data Nakes berhasil diperbarui.',
            'data'    => $tenagaMedis->load(['user', 'pasien', 'kategoriLayanan', 'wilayahLayanan'])
        ], 200);
    }

    /**
     * Hapus Profil Nakes
     */
    public function destroy(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'User tidak ditemukan.'
            ], 401);
        }

        $tenagaMedis = TenagaMedis::where('id_user', $user->id_user)->first();

        if (!$tenagaMedis) {
            return response()->json([
                'success' => false,
                'message' => 'Data Tenaga Medis tidak ditemukan.'
            ], 404);
        }

        $tenagaMedis->delete();

        return response()->json([
            'success' => true,
            'message' => 'Data Nakes berhasil dihapus.'
        ], 200);
    }
}
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\TenagaMedis;
use App\Models\Pasien;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class TenagaMedisController extends Controller
{
    /**
     * Endpoint Pendaftaran Nakes
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

        // GUARD 1: Harus terdaftar sebagai Pasien
        $pasien = Pasien::where('id_user', $user->id_user)->first();

        if (!$pasien) {
            return response()->json([
                'success' => false,
                'message' => 'Pendaftaran Nakes gagal. Anda harus terdaftar sebagai Pasien terlebih dahulu.'
            ], 403);
        }

        // GUARD 2: Cek pendaftaran existing
        $existingNakes = TenagaMedis::where('id_user', $user->id_user)->first();

        if ($existingNakes) {
            if (in_array($existingNakes->status, ['pending', 'pelatihan'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Permohonan pendaftaran Nakes Anda sedang diproses oleh admin.'
                ], 400);
            }

            if ($existingNakes->status === 'approved') {
                return response()->json([
                    'success' => false,
                    'message' => 'Anda sudah terdaftar sebagai Tenaga Kesehatan aktif.'
                ], 400);
            }
        }

        // VALIDASI INPUT (gagal di sini = belum ada file kesentuh, aman)
        $validate = $request->validate([
            // Data Diri
            'nik'                => ['required', 'string', 'regex:/^[0-9]{16}$/'],
            'nama_lengkap'       => ['required', 'string', 'max:255'],
            'nama_panggilan'     => ['required', 'string', 'max:100'],
            'jenis_kelamin'      => ['required', 'in:L,P'],
            'tempat_lahir'       => ['required', 'string', 'max:255'],
            'tanggal_lahir'      => ['required', 'date'],
            'agama'              => ['required', 'string', 'max:50'],
            'no_telp'            => ['required', 'string', 'max:15'],
            'id_wilayah_layanan' => ['required', 'integer', 'exists:master_provinsi,id_provinsi'],
            'alamat_lengkap'     => ['required', 'string', 'max:1000'],
            'foto_profile'       => ['nullable', 'image', 'mimes:jpeg,png,jpg,webp', 'max:5120'],

            // Jenis Tenaga Medis (self-assign nakes)
            'jenis_tenaga_medis' => ['required', 'string', 'max:100'],

            // Profesi & Pendidikan
            'universitas'        => ['required', 'string', 'max:255'],
            'program_studi'      => ['required', 'string', 'max:255'],
            'tahun_lulus'        => ['required', 'digits:4', 'integer'],
            'no_str'             => ['required', 'string', 'max:255'],
            'no_sip'             => ['required', 'string', 'max:255'],

            // Berkas Utama
            'file_ktp'           => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'ijazah'             => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'file_skck'          => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'file_cv'            => ['required', 'file', 'mimes:pdf,doc,docx,jpg,jpeg,png', 'max:5120'],
            'file_str'           => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'file_sip'           => ['required', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],

            // Nullable
            'tempat_kerja'       => ['nullable', 'string', 'max:255'],
            'lama_bekerja'       => ['nullable', 'string', 'max:100'],
            'dokumen_tambahan'   => ['nullable', 'array', 'max:10'],
            'dokumen_tambahan.*' => ['file', 'mimes:pdf,jpg,jpeg,png,doc,docx', 'max:5120'],
        ], [
            'nik.required'                => 'NIK wajib diisi.',
            'nik.regex'                   => 'NIK harus tepat 16 digit angka.',
            'nama_lengkap.required'       => 'Nama lengkap wajib diisi.',
            'nama_panggilan.required'     => 'Nama panggilan wajib diisi.',
            'id_wilayah_layanan.required' => 'Wilayah operasional wajib dipilih.',
            'id_wilayah_layanan.exists'   => 'Wilayah operasional tidak valid.',
            'jenis_tenaga_medis.required' => 'Kategori/jenis tenaga medis wajib dipilih.',
            'no_str.required'             => 'Nomor STR wajib diisi.',
            'no_sip.required'             => 'Nomor SIP wajib diisi.',
            'file_ktp.required'           => 'Foto KTP wajib diunggah.',
            'ijazah.required'             => 'Foto Ijazah wajib diunggah.',
            'file_skck.required'          => 'Foto SKCK wajib diunggah.',
            'file_cv.required'            => 'File CV wajib diunggah.',
            'file_str.required'           => 'Foto STR wajib diunggah.',
            'file_sip.required'           => 'Foto SIP wajib diunggah.',
            'dokumen_tambahan.max'        => 'Dokumen tambahan maksimal 10 file.',
            'dokumen_tambahan.*.mimes'    => 'Dokumen tambahan harus berupa PDF, gambar, atau Word.',
        ]);

        // Tracking semua path yang berhasil ke-upload, buat cleanup kalau proses gagal
        $uploadedPaths = [];

        $uploadFile = function ($fieldName, $folder = 'uploads/nakes/docs') use ($request, &$uploadedPaths) {
            if ($request->hasFile($fieldName)) {
                $file = $request->file($fieldName);
                $filename = $fieldName . '_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                $path = $file->storeAs($folder, $filename, 'public');
                $uploadedPaths[] = $path;
                return '/storage/' . $path;
            }
            return null;
        };

        try {
            // Upload dulu (di luar DB transaction, karena storage bukan bagian dari transaction)
            $dokumenTambahanPaths = [];
            if ($request->hasFile('dokumen_tambahan')) {
                foreach ($request->file('dokumen_tambahan') as $file) {
                    $filename = 'doc_extra_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                    $path = $file->storeAs('uploads/nakes/docs_extra', $filename, 'public');
                    $uploadedPaths[] = $path;
                    $dokumenTambahanPaths[] = '/storage/' . $path;
                }
            }

            $filesData = [
                'foto_profile' => $uploadFile('foto_profile', 'uploads/nakes/profiles'),
                'file_ktp'     => $uploadFile('file_ktp'),
                'ijazah'       => $uploadFile('ijazah'),
                'file_skck'    => $uploadFile('file_skck'),
                'file_cv'      => $uploadFile('file_cv'),
                'file_str'     => $uploadFile('file_str'),
                'file_sip'     => $uploadFile('file_sip'),
            ];

            // Baru masuk transaction pas nulis ke DB
            $nakes = DB::transaction(function () use (
                $user, $pasien, $validate, $filesData, $dokumenTambahanPaths, $existingNakes
            ) {
                return TenagaMedis::updateOrCreate(
                    ['id_user' => $user->id_user],
                    [
                        'id_pasien'          => $pasien->id_pasien,
                        'id_wilayah_layanan' => $validate['id_wilayah_layanan'],

                        'nik'                => $validate['nik'],
                        'nama_lengkap'       => $validate['nama_lengkap'],
                        'nama_panggilan'     => $validate['nama_panggilan'],
                        'jenis_kelamin'      => $validate['jenis_kelamin'],
                        'tempat_lahir'       => $validate['tempat_lahir'],
                        'tanggal_lahir'      => $validate['tanggal_lahir'],
                        'agama'              => $validate['agama'],
                        'no_telp'            => $validate['no_telp'],
                        'alamat_lengkap'     => $validate['alamat_lengkap'],

                        'jenis_tenaga_medis' => $validate['jenis_tenaga_medis'],

                        'universitas'        => $validate['universitas'],
                        'program_studi'      => $validate['program_studi'],
                        'tahun_lulus'        => $validate['tahun_lulus'],
                        'no_str'             => $validate['no_str'],
                        'no_sip'             => $validate['no_sip'],

                        'foto_profile'       => $filesData['foto_profile'] ?? $existingNakes?->foto_profile,
                        'file_ktp'           => $filesData['file_ktp'] ?? $existingNakes?->file_ktp,
                        'ijazah'             => $filesData['ijazah'] ?? $existingNakes?->ijazah,
                        'file_skck'          => $filesData['file_skck'] ?? $existingNakes?->file_skck,
                        'file_cv'            => $filesData['file_cv'] ?? $existingNakes?->file_cv,
                        'file_str'           => $filesData['file_str'] ?? $existingNakes?->file_str,
                        'file_sip'           => $filesData['file_sip'] ?? $existingNakes?->file_sip,

                        'tempat_kerja'       => $validate['tempat_kerja'] ?? null,
                        'lama_bekerja'       => $validate['lama_bekerja'] ?? null,
                        'dokumen_tambahan'   => !empty($dokumenTambahanPaths) ? $dokumenTambahanPaths : ($existingNakes?->dokumen_tambahan ?? null),

                        'status'             => 'pending',
                        'admin_notes'        => null,
                    ]
                );
            });

            return response()->json([
                'success' => true,
                'message' => 'Pendaftaran Nakes berhasil dikirim. Menunggu persetujuan admin.',
                'data'    => $nakes
            ], 201);

        } catch (\Throwable $e) {
            // GAGAL -> bersihin semua file yang sempet ke-upload, jangan nyampah
            foreach ($uploadedPaths as $path) {
                if (Storage::disk('public')->exists($path)) {
                    Storage::disk('public')->delete($path);
                }
            }

            Log::error('Gagal register Nakes: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Pendaftaran Nakes gagal diproses. Silakan coba lagi.'
            ], 500);
        }
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
     * Update Profil Nakes
     */
    public function update(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'User tidak ditemukan.'], 401);
        }

        $tenagaMedis = TenagaMedis::where('id_user', $user->id_user)->first();

        if (!$tenagaMedis) {
            return response()->json(['success' => false, 'message' => 'Data Tenaga Medis tidak ditemukan.'], 404);
        }

        $validated = $request->validate([
            'nik'                => ['sometimes', 'required', 'string', 'regex:/^[0-9]{16}$/'],
            'nama_lengkap'       => ['sometimes', 'required', 'string', 'max:255'],
            'nama_panggilan'     => ['sometimes', 'nullable', 'string', 'max:100'],
            'jenis_kelamin'      => ['sometimes', 'required', 'in:L,P'],
            'tempat_lahir'       => ['sometimes', 'required', 'string', 'max:255'],
            'tanggal_lahir'      => ['sometimes', 'required', 'date'],
            'agama'              => ['sometimes', 'required', 'string', 'max:50'],
            'no_telp'            => ['sometimes', 'required', 'string', 'max:15'],
            'id_wilayah_layanan' => ['sometimes', 'required', 'integer'],
            'alamat_lengkap'     => ['sometimes', 'required', 'string', 'max:1000'],
            
            'jenis_tenaga_medis' => ['sometimes', 'required', 'string', 'max:100'],
            'universitas'        => ['sometimes', 'required', 'string', 'max:255'],
            'program_studi'      => ['sometimes', 'required', 'string', 'max:255'],
            'tahun_lulus'        => ['sometimes', 'required', 'digits:4', 'integer'],
            'no_str'             => ['sometimes', 'required', 'string', 'max:255'],
            'no_sip'             => ['sometimes', 'nullable', 'string', 'max:255'],

            'foto_profile'       => ['sometimes', 'image', 'mimes:jpeg,png,jpg,webp', 'max:5120'],
            'file_ktp'           => ['sometimes', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'ijazah'             => ['sometimes', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'file_skck'          => ['sometimes', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'file_cv'            => ['sometimes', 'file', 'mimes:pdf,doc,docx', 'max:5120'],
            'file_str'           => ['sometimes', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
            'file_sip'           => ['sometimes', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],

            'tempat_kerja'       => ['sometimes', 'nullable', 'string', 'max:255'],
            'lama_bekerja'       => ['sometimes', 'nullable', 'string', 'max:100'],
            'dokumen_tambahan'   => ['sometimes', 'array', 'max:10'],
            'dokumen_tambahan.*' => ['file', 'mimes:pdf,jpg,jpeg,png,doc,docx', 'max:5120'],

            'kategori_layanan'   => ['sometimes', 'array'],
            'kategori_layanan.*' => ['exists:kategori_layanan,id_kategori_layanan'],
        ]);

        $uploadFile = function ($fieldName, $folder = 'uploads/nakes/docs') use ($request) {
            if ($request->hasFile($fieldName)) {
                $file = $request->file($fieldName);
                $filename = $fieldName . '_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                $path = $file->storeAs($folder, $filename, 'public');
                return '/storage/' . $path;
            }
            return null;
        };

        // File Single
        $fileFields = ['foto_profile', 'file_ktp', 'ijazah', 'file_skck', 'file_cv', 'file_str', 'file_sip'];
        foreach ($fileFields as $field) {
            $folder = ($field === 'foto_profile') ? 'uploads/nakes/profiles' : 'uploads/nakes/docs';
            $uploadedPath = $uploadFile($field, $folder);
            if ($uploadedPath) {
                $validated[$field] = $uploadedPath;
            }
        }

        // Multiple files
        if ($request->hasFile('dokumen_tambahan')) {
            $newExtraPaths = [];
            foreach ($request->file('dokumen_tambahan') as $file) {
                $filename = 'doc_extra_' . time() . '_' . uniqid() . '.' . $file->getClientOriginalExtension();
                $path = $file->storeAs('uploads/nakes/docs_extra', $filename, 'public');
                $newExtraPaths[] = '/storage/' . $path;
            }
            $validated['dokumen_tambahan'] = $newExtraPaths;
        }

        $tenagaMedis->fill($validated);
        $tenagaMedis->save();

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
     * Hapus Profil Nakes (Cleanup File)
     */
    public function destroy(Request $request)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'User tidak ditemukan.'], 401);
        }

        $tenagaMedis = TenagaMedis::where('id_user', $user->id_user)->first();

        if (!$tenagaMedis) {
            return response()->json(['success' => false, 'message' => 'Data Tenaga Medis tidak ditemukan.'], 404);
        }

        $singleFiles = ['foto_profile', 'file_ktp', 'ijazah', 'file_skck', 'file_cv', 'file_str', 'file_sip'];
        foreach ($singleFiles as $field) {
            if ($tenagaMedis->$field) {
                $path = str_replace('/storage/', '', $tenagaMedis->$field);
                if (Storage::disk('public')->exists($path)) {
                    Storage::disk('public')->delete($path);
                }
            }
        }

        // Clean up dokumen tambahan
        if (is_array($tenagaMedis->dokumen_tambahan)) {
            foreach ($tenagaMedis->dokumen_tambahan as $extraPath) {
                $path = str_replace('/storage/', '', $extraPath);
                if (Storage::disk('public')->exists($path)) {
                    Storage::disk('public')->delete($path);
                }
            }
        }

        $tenagaMedis->delete();

        return response()->json([
            'success' => true,
            'message' => 'Data Nakes dan seluruh berkas berhasil dihapus.'
        ], 200);
    }
}
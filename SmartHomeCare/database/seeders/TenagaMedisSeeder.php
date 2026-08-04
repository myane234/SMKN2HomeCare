<?php

namespace Database\Seeders;

use App\Models\TenagaMedis;
use App\Models\Users;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class TenagaMedisSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Buat beberapa data tenaga medis dummy beserta akun usernya
        for ($i = 1; $i <= 5; $i++) {
            $user = Users::create([
                'email' => "nakes{$i}@example.com", // Diperbaiki menjadi tanda kutip dua ganda (")
                'password' => Hash::make('password'),
            ]);

            TenagaMedis::create([
                'id_user' => $user->id_user,
                'nama_lengkap' => "Dr. Tenaga Medis {$i}",
                'nik' => '320101' . rand(100000000, 999999999),
                'jenis_kelamin' => $i % 2 == 0 ? 'P' : 'L',
                'tempat_lahir' => 'Jakarta',
                'tanggal_lahir' => '1990-01-01',
                'alamat_lengkap' => "Jl. Kesehatan No. {$i}, Jakarta",
                'no_telp' => '0812345678' . $i,
                'jenis_tenaga_medis' => 'Dokter Umum',
                'no_str' => 'STR-' . rand(10000, 99999),
                'no_sip' => 'SIP-' . rand(10000, 99999),
                'no_npwp' => '12.345.678.9-001.000',
                'lulusan' => 'Universitas Indonesia',
                // Koordinat dummy (diatur agar fitur jarak Haversine di controller bisa berjalan)
                'latitude' => -6.200000 + ($i * 0.01),
                'longitude' => 106.816666 + ($i * 0.01),
                'status' => 'approved', // Penting agar terbaca oleh logika booking controller
                'pengalaman_kerja' => [
                    ['instansi' => 'RS Sehat Selalu', 'tahun' => '2015-2020'],
                ],
                'seminar_pelatihan' => [
                    ['nama' => 'Pelatihan First Aid', 'tahun' => '2021'],
                ],
            ]);
        }
    }
}
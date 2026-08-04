<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Http;
use App\Models\WilayahLayanan;
use Illuminate\Support\Str;

class MasterProvinsiSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 1. Ambil data JSON dari API Emsifa
        $response = Http::get('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json');

        if ($response->successful()) {
            $provinces = $response->json();

            foreach ($provinces as $province) {
                // 2. Ubah format nama dari "ACEH" menjadi "Aceh" (Title Case)
                $namaRapi = Str::title($province['name']);

                // 3. Masukkan ke database tanpa membawa ID dari API
                // updateOrCreate mendeteksi berdasarkan 'nama_provinsi' agar tidak duplikat
                WilayahLayanan::updateOrCreate(
                    ['nama_provinsi' => $namaRapi]
                );
            }

            $this->command->info('Berhasil sinkronisasi data ke master_provinsi_layanan.');
        } else {
            $this->command->error('Gagal mengambil data dari API Wilayah Indonesia.');
        }
    }
}

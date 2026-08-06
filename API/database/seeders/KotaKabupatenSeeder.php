<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Http;
use App\Models\WilayahLayanan;
use App\Models\KotaKabupaten;

class KotaKabupatenSeeder extends Seeder
{
    public function run(): void
    {
        $responseProvinsi = Http::get('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json');

        if ($responseProvinsi->failed()) {
            $this->command->error('Gagal mengambil data provinsi.');
            return;
        }

        $provinces = $responseProvinsi->json();

        foreach ($provinces as $prov) {
            $provinsiModel = WilayahLayanan::updateOrCreate(
                ['nama_provinsi' => $prov['name']],
                ['is_active' => true]
            );

            $localProvinsiId = $provinsiModel->id_provinsi;

            $responseKota = Http::get("https://www.emsifa.com/api-wilayah-indonesia/api/regencies/{$prov['id']}.json");

            if ($responseKota->successful()) {
                $cities = $responseKota->json();

                foreach ($cities as $city) {
                    KotaKabupaten::updateOrCreate(
                        ['nama_kota' => $city['name']],
                        ['id_provinsi' => $localProvinsiId]
                    );
                }

                $this->command->info("Berhasil mengimpor kota untuk: {$prov['name']} (ID Lokal: {$localProvinsiId})");
            }
        }
    }
}
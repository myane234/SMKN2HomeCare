<?php
namespace Database\Seeders;

use App\Models\WilayahLayanan;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Http;

class ProvinsiSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Fetch data dari API EMSIFA
        $response = Http::get('https://www.emsifa.com/api-wilayah-indonesia/api/provinces.json');

        if ($response->successful()) {
            $provinces = $response->json();

            foreach ($provinces as $item) {
                // ID akan auto-increment (1, 2, 3...) bawaan database
                WilayahLayanan::firstOrCreate([
                    'nama_provinsi' => $item['name'],
                ]);
            }
        }
    }
}
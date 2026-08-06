<?php

namespace Database\Seeders;

use App\Models\Users;
use App\Models\Pasien;
use App\Models\Layanan;
use App\Models\Artikel;
use Database\Seeders\ProvinsiSeeder;
use Database\Seeders\TenagaMedisSeeder;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            roleSeeder::class,
            AdminSeeder::class,
            SuperAdminSeeder::class,
            KategoriLayananSeeder::class,
            LayananSeeder::class,
            PromoSeeder::class,
            ProvinsiSeeder::class,
            KotaKabupatenSeeder::class,
            ArtikelSeeder::class,
            // TenagaMedisSeeder::class
        ]);

        // Jika ingin membuat data pasien tetap langsung di sini, silakan:
        Pasien::factory(10)->create();

        Pasien::factory(5)->create([
            'id_user' => Users::factory()->google(),
        ]);
    }
}
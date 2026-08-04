<?php

namespace Database\Factories;

use App\Models\KategoriLayanan;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\File;

class LayananFactory extends Factory
{
    public function definition(): array
    {
        $tipeLayanan = $this->faker->randomElement(['durasi', 'tindakan']);

        // 1. Tentukan folder tempat kumpulan gambar lu berada
        $folderPath = public_path('images/folder_layanan');
        $storedPath = 'layanan/default.jpg'; // Fallback kalau folder kosong/gak ketemu

        // 2. Ambil semua file gambar yang ada di dalam folder tersebut (ekstensi jpg, jpeg, png)
        if (is_dir($folderPath)) {
            $files = glob($folderPath . '/*.{jpg,jpeg,png}', GLOB_BRACE);

            if (!empty($files)) {
                // 3. Pilih salah satu file gambar secara acak dari folder tersebut
                $randomImage = $files[array_rand($files)];

                // 4. Salin gambar acak yang dipilih ke storage
                $storedPath = Storage::disk('public')->putFile('layanan', new File($randomImage));
            }
        }

        return [
            'nama_layanan' => $this->faker->words(3, true),
            'deskripsi_layanan' => $this->faker->sentence(),
            
            // Fotonya bakal beda-beda tiap data dibuat, ngambil acak dari folder!
            'foto_layanan' => $storedPath, 
            
            'include_transport' => $this->faker->boolean(),
            'id_kategori_layanan' => KategoriLayanan::inRandomOrder()->first()?->id_kategori_layanan ?? 1,
            'harga' => $this->faker->numberBetween(50000, 500000),
            'tipe_layanan' => $tipeLayanan,
            'durasi_menit' => $tipeLayanan === 'durasi' ? $this->faker->randomElement([30, 60, 90, 120]) : null,
        ];
    }
}

<?php

namespace Database\Factories;

use App\Models\Artikel;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\File;

class ArtikelFactory extends Factory
{
    protected $model = Artikel::class;

    public function definition(): array
    {
        // 1. Tentukan folder kumpulan gambar artikel di folder public Anda
        // Contoh: public/images/folder_artikel/ atau mau digabung dengan folder lain juga bebas
        $folderPath = public_path('images/folder_artikel');
        $storedPath = 'artikel/default.jpg'; // Fallback jika folder kosong

        // 2. Ambil gambar secara acak dari folder lokal
        if (is_dir($folderPath)) {
            $files = glob($folderPath . '/*.{jpg,jpeg,png}', GLOB_BRACE);

            if (!empty($files)) {
                $randomImage = $files[array_rand($files)];
                // Simpan ke storage disk public/artikel
                $storedPath = Storage::disk('public')->putFile('artikel', new File($randomImage));
            }
        }

        return [
            'judul_artikel' => $this->faker->sentence(4),
            'kategori_artikel' => $this->faker->randomElement(['Tips Kesehatan', 'Kegiatan']),
            'isi_artikel' => $this->faker->paragraphs(3, true),
            'gambar_artikel' => $storedPath, // Otomatis comot gambar dari folder lokal
        ];
    }
}
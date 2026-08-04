<?php

namespace Database\Factories;

use App\Models\Promo;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Storage;
use Illuminate\Http\File;

class PromoFactory extends Factory
{
    protected $model = Promo::class;

    public function definition(): array
    {
        // 1. Tentukan folder kumpulan gambar promo di folder public Anda
        // Contoh: simpan banyak gambar di public/images/folder_promo/
        $folderPath = public_path('images/folder_promo');
        $storedPath = null; // Karena di validasi 'sometimes','nullable'

        // 2. Ambil gambar secara acak dari folder jika ada
        if (is_dir($folderPath)) {
            $files = glob($folderPath . '/*.{jpg,jpeg,png}', GLOB_BRACE);

            if (!empty($files)) {
                $randomImage = $files[array_rand($files)];
                // Simpan ke storage disk public/promo_images
                $storedPath = Storage::disk('public')->putFile('promo_images', new File($randomImage));
            }
        }

        $tanggalMulai = $this->faker->dateTimeBetween('-1 week', '+1 week');
        $tanggalBerakhir = $this->faker->dateTimeBetween($tanggalMulai, '+1 month');

        return [
            'nama_paket' => $this->faker->words(3, true) . ' Promo',
            'deskripsi' => $this->faker->sentence(),
            'diskon_persen' => $this->faker->randomElement([10, 15, 20, 25, 50]),
            'tanggal_mulai' => $tanggalMulai->format('Y-m-d'),
            'tanggal_berakhir' => $tanggalBerakhir->format('Y-m-d'),
            'status_promo' => $this->faker->randomElement(['Aktif', 'Tidak Aktif']),
            'gambar_promo' => $storedPath, // Menyimpan path hasil copy dari folder lokal
        ];
    }
}
<?php

namespace Database\Seeders;

use App\Models\Promo;
use App\Models\Layanan;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

class PromoSeeder extends Seeder
{
    public function run(): void
    {
        // Pastikan folder storage untuk promo_images ada
        if (!Storage::disk('public')->exists('promo_images')) {
            Storage::disk('public')->makeDirectory('promo_images');
        }

        // Copy default image as fallback
        $defaultImagePath = base_path('../FEHomeCare/public/images/logo/logo.png'); // fallback
        if (file_exists($defaultImagePath)) {
            Storage::disk('public')->put('promo_images/default.jpg', file_get_contents($defaultImagePath));
        }

        $promos = [
            [
                'nama_paket' => 'Paket Ibu & Buah Hati',
                'deskripsi' => 'Dapatkan diskon 15% untuk layanan lengkap Pijat Laktasi dan Perawatan Bayi Baru Lahir. Paket ini dirancang khusus untuk memastikan kenyamanan ibu dan kesehatan optimal bagi bayi Anda.',
                'diskon_persen' => 15.00,
                'source_image' => 'newborn.png',
                'status_promo' => 'Aktif',
                'layanan_names' => [
                    'Pijat Laktasi',
                    'Perawatan Bayi Baru Lahir (Newborn Care)'
                ],
            ],
            [
                'nama_paket' => 'Paket Fisioterapi Intensif',
                'deskripsi' => 'Rehabilitasi motorik pasca stroke yang teratur sangat penting. Nikmati penawaran khusus diskon 20% untuk terapi intensif langsung di rumah Anda oleh fisioterapis profesional kami.',
                'diskon_persen' => 20.00,
                'source_image' => 'fisio.png',
                'status_promo' => 'Aktif',
                'layanan_names' => [
                    'Fisioterapi Stroke Homecare',
                    'Fisioterapi Cedera Olahraga'
                ],
            ],
            [
                'nama_paket' => 'Paket Sehat Lansia',
                'deskripsi' => 'Pantau kesehatan orang tua tercinta secara berkala. Nikmati paket Medical Checkup lengkap dengan diskon 10% untuk pemeriksaan tanda vital, gula darah, kolesterol, dan asam urat.',
                'diskon_persen' => 10.00,
                'source_image' => 'mcu.png',
                'status_promo' => 'Aktif',
                'layanan_names' => [
                    'Home Care MCU Package',
                    'Pemeriksaan Gula Darah & Kolesterol'
                ],
            ],
            [
                'nama_paket' => 'Paket Bebas Luka',
                'deskripsi' => 'Perawatan luka modern yang higienis dan steril untuk mempercepat penyembuhan. Dapatkan potongan diskon 25% untuk perawatan luka pasca operasi dan luka diabetes.',
                'diskon_persen' => 25.00,
                'source_image' => 'luka.png',
                'status_promo' => 'Aktif',
                'layanan_names' => [
                    'Perawatan Luka Diabetes',
                    'Perawatan Luka Pasca Operasi'
                ],
            ],
        ];

        foreach ($promos as $promoData) {
            $sourcePath = base_path('../FEHomeCare/public/images/promo/' . $promoData['source_image']);
            $gambarPath = 'promo_images/default.jpg'; // fallback

            if (file_exists($sourcePath)) {
                $filename = basename($sourcePath);
                $destPath = 'promo_images/' . $filename;
                Storage::disk('public')->put($destPath, file_get_contents($sourcePath));
                $gambarPath = $destPath;
            }

            $promo = Promo::updateOrCreate(
                ['nama_paket' => $promoData['nama_paket']],
                [
                    'deskripsi' => $promoData['deskripsi'],
                    'diskon_persen' => $promoData['diskon_persen'],
                    'tanggal_mulai' => now()->subDays(5)->format('Y-m-d'),
                    'tanggal_berakhir' => now()->addMonth()->format('Y-m-d'),
                    'status_promo' => $promoData['status_promo'],
                    'gambar_promo' => $gambarPath,
                ]
            );

            // Cari ID layanan berdasarkan nama
            $layananIds = Layanan::whereIn('nama_layanan', $promoData['layanan_names'])->pluck('id_layanan')->toArray();
            
            // Sinkronkan relasi pivot
            $promo->layanans()->sync($layananIds);
        }
    }
}
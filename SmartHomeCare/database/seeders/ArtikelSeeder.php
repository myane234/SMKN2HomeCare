<?php

namespace Database\Seeders;

use App\Models\Artikel;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

class ArtikelSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Pastikan folder storage untuk artikel ada
        if (!Storage::disk('public')->exists('artikel')) {
            Storage::disk('public')->makeDirectory('artikel');
        }

        // Copy default image as fallback
        $defaultImagePath = base_path('../FEHomeCare/public/images/logo/logo.png'); // fallback
        if (file_exists($defaultImagePath)) {
            Storage::disk('public')->put('artikel/default.jpg', file_get_contents($defaultImagePath));
        }

        $articles = [
            [
                'judul_artikel' => '5 Cara Menjaga Kesehatan Lansia di Rumah',
                'kategori_artikel' => 'Tips Kesehatan',
                'source_image' => 'hero/hero-2.jpg',
                'isi_artikel' => "Menjaga kesehatan lansia di rumah memerlukan perhatian khusus. Beberapa langkah yang dapat dilakukan antara lain: menjaga pola makan bergizi seimbang, memastikan aktivitas fisik ringan tetap berjalan seperti jalan santai, mengelola kepatuhan minum obat secara teratur, menjaga keamanan lingkungan rumah untuk mencegah jatuh (seperti memasang pegangan di kamar mandi), serta melakukan kontrol kesehatan secara rutin bersama tim medis Home Care.",
            ],
            [
                'judul_artikel' => 'Manfaat Fisioterapi Pasca Stroke Sejak Dini',
                'kategori_artikel' => 'Tips Kesehatan',
                'source_image' => 'about/Stroke rehabilitation.jpg',
                'isi_artikel' => "Stroke dapat menyebabkan kelemahan anggota gerak. Melakukan fisioterapi sejak dini sangat penting untuk merangsang kembali jalur saraf motorik yang terganggu (neuroplastisitas). Dengan latihan teratur di bawah bimbingan fisioterapis profesional, pasien dapat dilatih untuk berjalan kembali, memegang benda, meningkatkan keseimbangan tubuh, serta mengembalikan kemandirian dalam melakukan aktivitas sehari-hari di rumah.",
            ],
            [
                'judul_artikel' => 'Pentingnya Perawatan Tali Pusat Bayi Baru Lahir yang Benar',
                'kategori_artikel' => 'Tips Kesehatan',
                'source_image' => 'layanan/ibu-anak/tali-pusar.png',
                'isi_artikel' => "Merawat tali pusat bayi baru lahir seringkali membuat orang tua khawatir. Kunci utama perawatan tali pusat adalah menjaganya tetap bersih dan kering. Hindari membungkus tali pusat dengan ramuan tradisional atau alkohol. Gunakan kasa steril jika diperlukan dan biarkan terpapar udara agar cepat kering dan lepas dengan sendirinya (puput) secara alami tanpa menimbulkan infeksi.",
            ],
            [
                'judul_artikel' => 'Smart Home Care Mengadakan CSR Pemeriksaan Kesehatan Gratis',
                'kategori_artikel' => 'Kegiatan',
                'source_image' => 'tentang-kami/HeroTentangKami.jpeg',
                'isi_artikel' => "Sebagai wujud kepedulian terhadap kesehatan masyarakat, Smart Home Care menyelenggarakan kegiatan Corporate Social Responsibility (CSR) berupa pemeriksaan kesehatan gratis. Kegiatan ini meliputi pemeriksaan tekanan darah, cek gula darah sewaktu, pemeriksaan asam urat, serta konsultasi gratis dengan perawat kami. Acara ini dihadiri oleh ratusan warga sekitar yang sangat antusias menjaga kesehatan mereka sejak dini.",
            ],
            [
                'judul_artikel' => 'Ekspansi Layanan Smart Home Care Kini Hadir di Kota Baru',
                'kategori_artikel' => 'Kegiatan',
                'source_image' => 'tentang-kami/kenapaSmartHomeCare.jpeg',
                'isi_artikel' => "Guna memenuhi kebutuhan masyarakat akan layanan medis berkualitas di rumah, Smart Home Care secara resmi membuka kantor cabang baru. Dengan hadirnya cabang baru ini, kami berkomitmen untuk memberikan pelayanan home care seperti perawatan luka modern, fisioterapi, bidan home care, serta pemasangan alat medis dengan respon yang lebih cepat dan jangkauan wilayah yang lebih luas untuk keluarga Anda.",
            ],
        ];

        foreach ($articles as $article) {
            // Tentukan path gambar
            $sourcePath = base_path('../FEHomeCare/public/images/' . $article['source_image']);
            $gambarPath = 'artikel/default.jpg'; // fallback

            if (file_exists($sourcePath)) {
                $filename = basename($sourcePath);
                $destPath = 'artikel/' . $filename;
                Storage::disk('public')->put($destPath, file_get_contents($sourcePath));
                $gambarPath = $destPath;
            }

            Artikel::updateOrCreate(
                ['judul_artikel' => $article['judul_artikel']],
                [
                    'kategori_artikel' => $article['kategori_artikel'],
                    'isi_artikel' => $article['isi_artikel'],
                    'gambar_artikel' => $gambarPath,
                ]
            );
        }
    }
}

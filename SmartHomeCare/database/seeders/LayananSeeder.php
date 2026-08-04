<?php

namespace Database\Seeders;

use App\Models\KategoriLayanan;
use App\Models\Layanan;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Storage;

class LayananSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Pastikan folder storage untuk layanan ada
        if (!Storage::disk('public')->exists('layanan')) {
            Storage::disk('public')->makeDirectory('layanan');
        }

        // Copy default image as fallback
        $defaultImagePath = base_path('../FEHomeCare/public/images/logo/logo.png'); // fallback
        if (file_exists($defaultImagePath)) {
            Storage::disk('public')->put('layanan/default.jpg', file_get_contents($defaultImagePath));
        }

        $services = [
            // --- IBU DAN ANAK ---
            [
                'nama_layanan' => 'Pijat Laktasi',
                'deskripsi_layanan' => 'Pijat khusus untuk ibu menyusui guna merangsang produksi ASI, meredakan payudara bengkak, dan memberikan efek relaksasi.',
                'kategori' => 'Ibu dan Anak',
                'source_image' => 'layanan/ibu-anak/pijat-laktasi.png',
                'harga' => 150000,
                'tipe_layanan' => 'durasi',
                'durasi_menit' => 60,
                'include_transport' => true,
            ],
            [
                'nama_layanan' => 'Perawatan Bayi Baru Lahir (Newborn Care)',
                'deskripsi_layanan' => 'Layanan home care komprehensif oleh bidan berpengalaman untuk memandikan, merawat tali pusat, serta pijat bayi baru lahir.',
                'kategori' => 'Ibu dan Anak',
                'source_image' => 'layanan/ibu-anak/pijat-bayi.png',
                'harga' => 250000,
                'tipe_layanan' => 'durasi',
                'durasi_menit' => 120,
                'include_transport' => true,
            ],
            [
                'nama_layanan' => 'Senam Hamil Privat',
                'deskripsi_layanan' => 'Sesi latihan senam hamil personal di rumah untuk melatih pernapasan, kelenturan otot panggul, dan mempersiapkan persalinan yang lancar.',
                'kategori' => 'Ibu dan Anak',
                'source_image' => 'layanan/ibu-anak/senam-hamil.png',
                'harga' => 200000,
                'tipe_layanan' => 'durasi',
                'durasi_menit' => 90,
                'include_transport' => true,
            ],
            [
                'nama_layanan' => 'Perawatan Tali Pusat',
                'deskripsi_layanan' => 'Perawatan higienis tali pusat bayi baru lahir untuk mencegah infeksi dan mempercepat proses lepasnya tali pusat.',
                'kategori' => 'Ibu dan Anak',
                'source_image' => 'layanan/ibu-anak/tali-pusar.png',
                'harga' => 85000,
                'tipe_layanan' => 'tindakan',
                'durasi_menit' => null,
                'include_transport' => true,
            ],

            // --- PERAWATAN LUKA ---
            [
                'nama_layanan' => 'Perawatan Luka Diabetes',
                'deskripsi_layanan' => 'Perawatan luka gangren akibat diabetes melitus menggunakan metode modern dressing untuk mempercepat penyembuhan dan mencegah infeksi.',
                'kategori' => 'Perawatan Luka',
                'source_image' => 'layanan/luka/luka-diabetes.png',
                'harga' => 220000,
                'tipe_layanan' => 'tindakan',
                'durasi_menit' => null,
                'include_transport' => true,
            ],
            [
                'nama_layanan' => 'Perawatan Luka Pasca Operasi',
                'deskripsi_layanan' => 'Perawatan pembersihan luka jahitan pasca operasi (sesar, usus buntu, dll.) dengan teknik steril untuk mencegah infeksi sekunder.',
                'kategori' => 'Perawatan Luka',
                'source_image' => 'layanan/luka/luka-pasca-operasi.png',
                'harga' => 180000,
                'tipe_layanan' => 'tindakan',
                'durasi_menit' => null,
                'include_transport' => true,
            ],
            [
                'nama_layanan' => 'Perawatan Luka Bakar',
                'deskripsi_layanan' => 'Penanganan dan perawatan luka bakar derajat ringan hingga sedang menggunakan salep khusus dan balutan steril.',
                'kategori' => 'Perawatan Luka',
                'source_image' => 'layanan/luka/luka-bakar.png',
                'harga' => 150000,
                'tipe_layanan' => 'tindakan',
                'durasi_menit' => null,
                'include_transport' => true,
            ],

            // --- MEDICAL CHECKUP ---
            [
                'nama_layanan' => 'Pemeriksaan Gula Darah & Kolesterol',
                'deskripsi_layanan' => 'Paket pemeriksaan kadar gula darah sewaktu, kolesterol total, dan asam urat lengkap dengan konsultasi hasil di rumah Anda.',
                'kategori' => 'Medical Checkup',
                'source_image' => 'promo/mcu.png',
                'harga' => 120000,
                'tipe_layanan' => 'tindakan',
                'durasi_menit' => null,
                'include_transport' => true,
            ],
            [
                'nama_layanan' => 'Home Care MCU Package',
                'deskripsi_layanan' => 'Skrining kesehatan menyeluruh meliputi pemeriksaan tanda vital, gula darah, kolesterol, asam urat, serta konsultasi gaya hidup sehat.',
                'kategori' => 'Medical Checkup',
                'source_image' => 'promo/mcu.png',
                'harga' => 250000,
                'tipe_layanan' => 'tindakan',
                'durasi_menit' => null,
                'include_transport' => true,
            ],

            // --- FISIOTERAPI ---
            [
                'nama_layanan' => 'Fisioterapi Stroke Homecare',
                'deskripsi_layanan' => 'Terapi rehabilitasi motorik dan sensorik khusus untuk pasien pasca stroke guna mengembalikan fungsi gerak dan kemandirian aktivitas.',
                'kategori' => 'Fisioterapi',
                'source_image' => 'promo/fisio.png',
                'harga' => 250000,
                'tipe_layanan' => 'durasi',
                'durasi_menit' => 60,
                'include_transport' => true,
            ],
            [
                'nama_layanan' => 'Fisioterapi Cedera Olahraga',
                'deskripsi_layanan' => 'Penanganan terapi untuk pemulihan cedera otot, ligamen, atau sendi pasca berolahraga agar dapat kembali beraktivitas maksimal.',
                'kategori' => 'Fisioterapi',
                'source_image' => 'promo/fisio.png',
                'harga' => 200000,
                'tipe_layanan' => 'durasi',
                'durasi_menit' => 60,
                'include_transport' => true,
            ],

            // --- PEMASANGAN & PENGGANTIAN ALAT MEDIS ---
            [
                'nama_layanan' => 'Pemasangan Kateter Urine',
                'deskripsi_layanan' => 'Prosedur pemasangan atau penggantian selang kateter urine (Foley catheter) steril oleh perawat berlisensi menggunakan alat sekali pakai.',
                'kategori' => 'Pemasangan dan Penggantian Alat Medis',
                'source_image' => 'layanan/alat-medis/kateter.png',
                'harga' => 200000,
                'tipe_layanan' => 'tindakan',
                'durasi_menit' => null,
                'include_transport' => true,
            ],
            [
                'nama_layanan' => 'Pemasangan NGT (Selang Makan)',
                'deskripsi_layanan' => 'Prosedur pemasangan Nasogastric Tube (NGT) steril untuk membantu pemberian nutrisi/cairan langsung ke lambung pasien.',
                'kategori' => 'Pemasangan dan Penggantian Alat Medis',
                'source_image' => 'layanan/alat-medis/ngt.png',
                'harga' => 220000,
                'tipe_layanan' => 'tindakan',
                'durasi_menit' => null,
                'include_transport' => true,
            ],
            [
                'nama_layanan' => 'Pemasangan Infus & Terapi Cairan',
                'deskripsi_layanan' => 'Pemasangan jalur intravena (infus) untuk pemberian cairan dehidrasi atau obat-obatan sesuai dengan resep dan instruksi dokter.',
                'kategori' => 'Pemasangan dan Penggantian Alat Medis',
                'source_image' => 'layanan/alat-medis/infus.png',
                'harga' => 150000,
                'tipe_layanan' => 'tindakan',
                'durasi_menit' => null,
                'include_transport' => true,
            ],
        ];

        foreach ($services as $service) {
            $kategori = KategoriLayanan::where('nama_kategori', $service['kategori'])->first();
            
            if (!$kategori) {
                continue;
            }

            // Tentukan path gambar
            $sourcePath = base_path('../FEHomeCare/public/images/' . $service['source_image']);
            $fotoPath = 'layanan/default.jpg'; // fallback

            if (file_exists($sourcePath)) {
                $filename = basename($sourcePath);
                $destPath = 'layanan/' . $filename;
                Storage::disk('public')->put($destPath, file_get_contents($sourcePath));
                $fotoPath = $destPath;
            }

            Layanan::updateOrCreate(
                ['nama_layanan' => $service['nama_layanan']],
                [
                    'deskripsi_layanan' => $service['deskripsi_layanan'],
                    'id_kategori_layanan' => $kategori->id_kategori_layanan,
                    'foto_layanan' => $fotoPath,
                    'harga' => $service['harga'],
                    'tipe_layanan' => $service['tipe_layanan'],
                    'durasi_menit' => $service['durasi_menit'],
                    'include_transport' => $service['include_transport'],
                ]
            );
        }
    }
}

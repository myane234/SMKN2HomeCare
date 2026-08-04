<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class KategoriLayananSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $kategoris = [
            'Ibu dan Anak',
            'Perawatan Luka',
            'Medical Checkup',
            'Fisioterapi',
            'Pemasangan dan Penggantian Alat Medis',
        ];

        foreach ($kategoris as $kategori) {
            \App\Models\KategoriLayanan::updateOrCreate(['nama_kategori' => $kategori]);
        }
    }
}

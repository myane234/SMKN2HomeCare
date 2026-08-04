<?php

namespace Database\Factories;

use App\Models\Pasien;
use App\Models\Users;
use Illuminate\Database\Eloquent\Factories\Factory;

class PasienFactory extends Factory
{
    protected $model = Pasien::class;
    
    public function definition(): array
    {
        return [
            // Ini akan otomatis membuat User baru dan mengisi 'id_user' di tabel pasiens
            'id_user'        => Users::factory(), 
            'nama_lengkap'   => fake()->name(),
            'nik'            => fake()->numerify('1234567890123456'), 
            'golongan_darah' => fake()->randomElement(['A', 'B', 'AB', 'O']),
            'jenis_kelamin'  => fake()->randomElement(['L', 'P']),
            'alamat_utama'   => fake()->address(),
        ];
    }
}
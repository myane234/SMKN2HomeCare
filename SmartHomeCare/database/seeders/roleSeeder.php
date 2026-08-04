<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class roleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Role::create([
           'nama_role' =>  'admin'
        ]);

        Role::create([
            'nama_role' => 'pasien'
        ]);

        Role::create([
            'nama_role' => 'nakes'
        ]);
    }
}

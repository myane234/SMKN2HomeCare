<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\Users;
use App\Models\Admin;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Pastikan role admin sudah ada (dari roleSeeder)
        $adminRole = Role::where('nama_role', 'admin')->first();

        if (!$adminRole) {
            $adminRole = Role::create(['nama_role' => 'admin']);
        }

        // Buat user faruq
        $user = Users::firstOrCreate(
            ['email' => 'faruq@homecare.com'],
            [
                'password' => Hash::make('faruqganteng'),
                'is_active' => true,
            ]
        );

        // Attach role admin ke user
        if (!$user->roles->contains($adminRole->id_role)) {
            $user->roles()->attach($adminRole->id_role);
        }

        // Buat record di tabel admins
        Admin::firstOrCreate(
            ['id_user' => $user->id_user],
            [
                'nama_lengkap' => 'Faruq Admin',
                'tier_admin' => 'Admin', // assuming this field is required based on model
            ]
        );
    }
}

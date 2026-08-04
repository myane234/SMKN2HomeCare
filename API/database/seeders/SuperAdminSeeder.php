<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\Users;
use App\Models\Admin;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    /**
     * Seeder untuk akun Super Admin.
     * Email   : admin@gmail.com
     * Password: faruqganteng
     */
    public function run(): void
    {
        // Pastikan role admin sudah ada
        $adminRole = Role::firstOrCreate(['nama_role' => 'admin']);

        // Buat atau update user
        $user = Users::firstOrCreate(
            ['email' => 'admin@gmail.com'],
            [
                'password'  => Hash::make('faruqganteng'),
                'is_active' => true,
            ]
        );

        // Pastikan password selalu sinkron (jika user sudah ada)
        if (!Hash::check('faruqganteng', $user->password)) {
            $user->password = Hash::make('faruqganteng');
            $user->save();
        }

        // Attach role admin
        if (!$user->roles->contains('id_role', $adminRole->id_role)) {
            $user->roles()->attach($adminRole->id_role);
        }

        // Buat atau update record di tabel admins dengan tier Super Admin
        Admin::updateOrCreate(
            ['id_user' => $user->id_user],
            [
                'nama_lengkap' => 'Super Admin',
                'tier_admin'   => 'Super Admin',
            ]
        );

        $this->command->info('✅ Super Admin seeded: admin@gmail.com / faruqganteng');
    }
}

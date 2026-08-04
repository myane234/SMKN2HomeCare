<?php

namespace Database\Factories;

use App\Models\Users;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;

class UsersFactory extends Factory
{
    protected $model = Users::class;

    public function definition(): array
    {
        return [
            'email'     => fake()->unique()->safeEmail(),
            'password'  => Hash::make('faruqganteng'),
            'google_id' => null,
            'avatar'    => null,
            'is_active' => 1,
        ];
    }

    public function google(): static
    {
        return $this->state(fn (array $attributes) => [
            'password'  => null,
            'google_id' => fake()->unique()->numerify('1234567890######'),
            'avatar'    => fake()->imageUrl(200, 200, 'people'),
        ]);
    }

    /**
     * TAMBAHKAN METHOD INI
     * Mengatur apa yang terjadi SETELAH user berhasil dibuat
     */
    public function configure(): static
    {
        return $this->afterCreating(function (Users $user) {
            // Otomatis menempelkan role ID 2 (Pasien) ke user yang baru dibuat
            $user->roles()->attach(2); 
        });
    }
}
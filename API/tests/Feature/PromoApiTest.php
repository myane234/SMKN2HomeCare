<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\Users;
use App\Models\Layanan;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PromoApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_manage_promos_and_frontend_can_view_active_promos(): void
    {
        $adminRole = Role::create(['nama_role' => 'admin']);
        $adminUser = Users::create([
            'email' => 'admin@example.com',
            'password' => bcrypt('password123'),
            'is_active' => true,
        ]);
        $adminUser->roles()->attach($adminRole->id_role);

        $this->actingAs($adminUser, 'sanctum');

        // Create a Layanan record since layanans are required for pivot
        $layanan = Layanan::create([
            'nama_layanan' => 'Layanan Ibu dan Anak',
            'deskripsi_layanan' => 'Deskripsi Layanan Ibu dan Anak',
            'kategori_layanan' => 'Ibu dan Anak',
            'foto_layanan' => 'layanan_ibu.jpg',
            'harga' => 150000.00,
            'tipe_layanan' => 'tindakan',
            'durasi_menit' => 60,
        ]);

        // 1. Admin Create Promo
        $createResponse = $this->postJson('/api/promo', [
            'nama_paket' => 'SAVE10',
            'deskripsi' => 'Deskripsi Promo SAVE10',
            'diskon_persen' => 10.00,
            'tanggal_berakhir' => '2026-12-31',
            'status_promo' => 'Aktif',
            'layanan_ids' => [$layanan->id_layanan],
        ]);

        $createResponse->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.nama_paket', 'SAVE10');

        $promoId = $createResponse->json('data.id_promo');

        // 2. Public / Admin Show Promo
        $showResponse = $this->getJson("/api/promo/{$promoId}");
        $showResponse->assertStatus(200)
            ->assertJsonPath('data.id_promo', $promoId);

        // 3. Admin Update Promo
        $updateResponse = $this->putJson("/api/promo/{$promoId}", [
            'nama_paket' => 'SAVE20',
            'diskon_persen' => 20.00,
        ]);
        $updateResponse->assertStatus(200)
            ->assertJsonPath('data.nama_paket', 'SAVE20');

        // 4. Public index of all promos
        $indexResponse = $this->getJson('/api/promo');
        $indexResponse->assertStatus(200)
            ->assertJsonCount(1, 'data');

        // 5. Public active promos list
        $frontendResponse = $this->getJson('/api/promo/active');
        $frontendResponse->assertStatus(200)
            ->assertJsonCount(1, 'data');

        // 6. Admin Delete Promo
        $deleteResponse = $this->deleteJson("/api/promo/{$promoId}");
        $deleteResponse->assertStatus(200)
            ->assertJsonPath('success', true);
    }
}

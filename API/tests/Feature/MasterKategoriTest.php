<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\Users;
use App\Models\KategoriLayanan;
use App\Models\KategoriArtikel;
use App\Models\Artikel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MasterKategoriTest extends TestCase
{
    use RefreshDatabase;

    private $adminUser;

    protected function setUp(): void
    {
        parent::setUp();

        // Setup Admin User
        $adminRole = Role::create(['nama_role' => 'admin']);
        $this->adminUser = Users::create([
            'email' => 'admin@example.com',
            'password' => bcrypt('password123'),
            'is_active' => true,
        ]);
        $this->adminUser->roles()->attach($adminRole->id_role);
    }

    /**
     * Kategori Layanan CRUD Tests
     */
    public function test_kategori_layanan_crud(): void
    {
        // 1. Get Categories (Public)
        $response = $this->getJson('/api/layanan/kategori');
        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        // 2. Create Category (Unauthorized)
        $response = $this->postJson('/api/layanan/kategori', ['nama_kategori' => 'Kategori Baru']);
        $response->assertStatus(401);

        // 3. Create Category (Authorized)
        $this->actingAs($this->adminUser, 'sanctum');
        $response = $this->postJson('/api/layanan/kategori', ['nama_kategori' => 'Kategori Baru']);
        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.nama_kategori', 'Kategori Baru');

        $kategoriId = $response->json('data.id_kategori_layanan');

        // 4. Show Category
        $response = $this->getJson("/api/layanan/kategori/{$kategoriId}");
        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.nama_kategori', 'Kategori Baru');

        // 5. Update Category
        $response = $this->putJson("/api/layanan/kategori/{$kategoriId}", ['nama_kategori' => 'Kategori Edit']);
        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.nama_kategori', 'Kategori Edit');

        // 6. Delete Category
        $response = $this->deleteJson("/api/layanan/kategori/{$kategoriId}");
        $response->assertStatus(200)
            ->assertJsonPath('success', true);
    }

    /**
     * Kategori Artikel CRUD Tests
     */
    public function test_kategori_artikel_crud(): void
    {
        // 1. Get Categories (Public)
        $response = $this->getJson('/api/artikel/kategori');
        $response->assertStatus(200)
            ->assertJsonPath('success', true);

        // 2. Create Category (Unauthorized)
        $response = $this->postJson('/api/artikel/kategori', ['nama_kategori' => 'Kategori Artikel Baru']);
        $response->assertStatus(401);

        // 3. Create Category (Authorized)
        $this->actingAs($this->adminUser, 'sanctum');
        $response = $this->postJson('/api/artikel/kategori', ['nama_kategori' => 'Kategori Artikel Baru']);
        $response->assertStatus(201)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.nama_kategori', 'Kategori Artikel Baru');

        $kategoriId = $response->json('data.id_kategori_artikel');

        // 4. Show Category
        $response = $this->getJson("/api/artikel/kategori/{$kategoriId}");
        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.nama_kategori', 'Kategori Artikel Baru');

        // 5. Update Category
        $response = $this->putJson("/api/artikel/kategori/{$kategoriId}", ['nama_kategori' => 'Kategori Artikel Edit']);
        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.nama_kategori', 'Kategori Artikel Edit');

        // 6. Delete Category
        $response = $this->deleteJson("/api/artikel/kategori/{$kategoriId}");
        $response->assertStatus(200)
            ->assertJsonPath('success', true);
    }

    /**
     * Artikel Category Compatibility Tests
     */
    public function test_artikel_compatibility_with_kategori(): void
    {
        $this->actingAs($this->adminUser, 'sanctum');

        // 1. Create a KategoriArtikel
        $kategori = KategoriArtikel::create(['nama_kategori' => 'Kategori Khusus']);

        // 2. Create Artikel using id_kategori_artikel
        $artikel = Artikel::create([
            'judul_artikel' => 'Judul Artikel',
            'id_kategori_artikel' => $kategori->id_kategori_artikel,
            'isi_artikel' => 'Isi artikel panjang.',
            'gambar_artikel' => 'artikel/pic.jpg'
        ]);

        // 3. Get Artikel and check legacy property 'kategori_artikel'
        $response = $this->getJson("/api/artikel/{$artikel->id}");
        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.kategori_artikel', 'Kategori Khusus'); // Accessor works!

        // 4. Filter artikel by name
        $response = $this->getJson('/api/artikel?kategori_artikel=Kategori+Khusus');
        $response->assertStatus(200)
            ->assertJsonCount(1, 'data');

        // 5. Filter artikel by ID
        $response = $this->getJson("/api/artikel?kategori_artikel={$kategori->id_kategori_artikel}");
        $response->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }
}

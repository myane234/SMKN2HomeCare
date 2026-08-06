<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\Users;
use App\Models\Artikel;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class ArtikelApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_public_viewing_article_increments_views(): void
    {
        // Create an article
        $artikel = Artikel::create([
            'judul_artikel' => 'Cara Hidup Sehat',
            'kategori_artikel' => 'Tips Kesehatan',
            'isi_artikel' => 'Ini isi artikel sehat.',
            'gambar_artikel' => 'artikel/gambar1.jpg',
            'views' => 0,
        ]);

        // Access the show route
        $response = $this->getJson("/api/artikel/{$artikel->id}");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.views', 1);

        // Access show route again
        $response2 = $this->getJson("/api/artikel/{$artikel->id}");
        $response2->assertJsonPath('data.views', 2);

        // Verify in database
        $this->assertDatabaseHas('artikels', [
            'id' => $artikel->id,
            'views' => 2,
        ]);
    }

    public function test_articles_can_be_sorted_by_views(): void
    {
        // Create articles with different views
        Artikel::create([
            'judul_artikel' => 'Artikel Sedikit',
            'kategori_artikel' => 'Tips Kesehatan',
            'isi_artikel' => 'Isi',
            'gambar_artikel' => 'artikel/pic.jpg',
            'views' => 5,
        ]);

        Artikel::create([
            'judul_artikel' => 'Artikel Banyak',
            'kategori_artikel' => 'Tips Kesehatan',
            'isi_artikel' => 'Isi',
            'gambar_artikel' => 'artikel/pic2.jpg',
            'views' => 10,
        ]);

        // Get sorted by views
        $response = $this->getJson('/api/artikel?sort_by=views');

        $response->assertStatus(200);
        $data = $response->json('data');

        $this->assertEquals('Artikel Banyak', $data[0]['judul_artikel']);
        $this->assertEquals('Artikel Sedikit', $data[1]['judul_artikel']);
    }

    public function test_admin_can_upload_single_and_multiple_images(): void
    {
        Storage::fake('public');

        // Setup Admin User
        $adminRole = Role::create(['nama_role' => 'admin']);
        $adminUser = Users::create([
            'email' => 'admin@example.com',
            'password' => bcrypt('password123'),
            'is_active' => true,
        ]);
        $adminUser->roles()->attach($adminRole->id_role);

        $this->actingAs($adminUser, 'sanctum');

        // 1. Test single image upload (using 'image' key)
        $file = UploadedFile::fake()->image('photo1.jpg');
        $response = $this->postJson('/api/artikel/upload-images', [
            'image' => $file,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);
        
        $urls = $response->json('urls');
        $this->assertCount(1, $urls);
        
        // Assert file exists on disk
        $path = substr($urls[0], strpos($urls[0], 'artikel/'));
        Storage::disk('public')->assertExists($path);

        // 2. Test multiple images upload (using 'images[]' key)
        $files = [
            UploadedFile::fake()->image('photo2.jpg'),
            UploadedFile::fake()->image('photo3.jpg'),
        ];
        $response2 = $this->postJson('/api/artikel/upload-images', [
            'images' => $files,
        ]);

        $response2->assertStatus(200)
            ->assertJsonPath('success', true);

        $urls2 = $response2->json('urls');
        $this->assertCount(2, $urls2);

        foreach ($urls2 as $url) {
            $path = substr($url, strpos($url, 'artikel/'));
            Storage::disk('public')->assertExists($path);
        }
    }
}

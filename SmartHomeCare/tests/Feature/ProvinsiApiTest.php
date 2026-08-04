<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;
use App\Models\WilayahLayanan;
use Tests\TestCase;

class ProvinsiApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_fetch_provinces_from_master_data_api(): void
    {
        if (!Schema::hasTable('master_provinsi')) {
            Schema::create('master_provinsi', function (Blueprint $table) {
                $table->id('id_provinsi');
                $table->string('nama_provinsi')->unique();
                $table->timestamps();
            });
        }

        WilayahLayanan::create(['nama_provinsi' => 'Jawa Barat']);

        $response = $this->getJson('/api/provinsi');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonFragment(['nama_provinsi' => 'Jawa Barat']);
    }
}

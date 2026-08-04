<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('kategori_layanan_tenaga_medis', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_tenaga_medis')->constrained('tenaga_medis', 'id_tenaga_medis')->cascadeOnDelete();
            $table->foreignId('id_kategori_layanan')->constrained('kategori_layanans', 'id_kategori_layanan')->cascadeOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('kategori_layanan_tenaga_medis');
    }
};

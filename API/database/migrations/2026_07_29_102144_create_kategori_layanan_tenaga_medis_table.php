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
            $table->bigIncrements('id');
            $table->unsignedBigInteger('id_tenaga_medis')->index('kategori_layanan_tenaga_medis_id_tenaga_medis_foreign');
            $table->unsignedBigInteger('id_kategori_layanan')->index('kategori_layanan_tenaga_medis_id_kategori_layanan_foreign');
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

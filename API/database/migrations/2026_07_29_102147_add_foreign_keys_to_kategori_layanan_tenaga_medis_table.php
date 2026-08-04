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
        Schema::table('kategori_layanan_tenaga_medis', function (Blueprint $table) {
            $table->foreign(['id_kategori_layanan'])->references(['id_kategori_layanan'])->on('kategori_layanans')->onUpdate('restrict')->onDelete('cascade');
            $table->foreign(['id_tenaga_medis'])->references(['id_tenaga_medis'])->on('tenaga_medis')->onUpdate('restrict')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('kategori_layanan_tenaga_medis', function (Blueprint $table) {
            $table->dropForeign('kategori_layanan_tenaga_medis_id_kategori_layanan_foreign');
            $table->dropForeign('kategori_layanan_tenaga_medis_id_tenaga_medis_foreign');
        });
    }
};

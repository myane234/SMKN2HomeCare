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
        Schema::table('layanans', function (Blueprint $table) {
            $table->dropColumn('kategori_layanan');
            $table->foreignId('id_kategori_layanan')->nullable()->constrained('kategori_layanans', 'id_kategori_layanan')->nullOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('layanans', function (Blueprint $table) {
            $table->enum('kategori_layanan', ['Ibu dan Anak', 'Perawatan Luka', 'Medical Checkup', 'Fisioterapi', 'Pemasangan dan Penggantian Alat Medis'])->nullable();
            $table->dropForeign(['id_kategori_layanan']);
            $table->dropColumn('id_kategori_layanan');
        });
    }
};

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
        Schema::create('Master_Kota_Kabupaten', function (Blueprint $table) {
            $table->id('id_kota');
            $table->foreignId('id_provinsi')
                  ->constrained('master_provinsi', 'id_provinsi')
                  ->onDelete('cascade');
            $table->string('nama_kota');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('Master_Kota_Kabupaten');
    }
};

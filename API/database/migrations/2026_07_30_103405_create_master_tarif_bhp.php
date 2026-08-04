<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('master_tarif_bhp', function (Blueprint $table) {
            $table->id('id_master_tarif_bhp');
            
            // Relasi ke Master Tarif
            $table->unsignedBigInteger('id_master_tarif');
            $table->foreign('id_master_tarif')
                  ->references('id_master_tarif')
                  ->on('master_tarif')
                  ->onDelete('cascade');

            // Relasi ke Master Barang BHP
            $table->unsignedBigInteger('id_bhp');
            $table->foreign('id_bhp')
                  ->references('id_bhp')
                  ->on('bhp_items')
                  ->onDelete('cascade');

            // Jumlah barang yang dihabiskan untuk template ini
            $table->integer('jumlah_pakai')->default(1); 
            
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('master_tarif_bhp');
    }
};
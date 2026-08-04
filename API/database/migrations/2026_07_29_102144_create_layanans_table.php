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
        Schema::create('layanans', function (Blueprint $table) {
            $table->bigIncrements('id_layanan');
            
            // Relasi ke Master Tarif (Template aturan biaya BHP, Admin, PPN, Nakes, Transport)
            $table->unsignedBigInteger('id_master_tarif')->nullable()->index();
            $table->foreign('id_master_tarif')
                  ->references('id_master_tarif')
                  ->on('master_tarif')
                  ->onDelete('set null');

            $table->unsignedBigInteger('id_kategori_layanan')->nullable()->index('layanans_id_kategori_layanan_foreign');
            
            $table->string('nama_layanan');
            $table->text('deskripsi_layanan');
            $table->string('foto_layanan');
            
            // Harga Dasar Murni Layanan
            $table->decimal('harga', 12, 2); 
            
            $table->enum('tipe_layanan', ['durasi', 'tindakan'])->default('tindakan');
            $table->integer('durasi_menit')->nullable();
            $table->boolean('include_transport')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('layanans');
    }
};
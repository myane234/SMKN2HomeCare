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
        Schema::create('promos', function (Blueprint $table) {
            $table->bigIncrements('id_promo');
            $table->string('nama_paket');
            $table->text('deskripsi');
            $table->string('gambar_promo')->nullable();
            $table->decimal('diskon_persen', 5);
            $table->date('tanggal_mulai');
            $table->date('tanggal_berakhir');
            $table->enum('status_promo', ['Aktif', 'Tidak Aktif']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('promos');
    }
};

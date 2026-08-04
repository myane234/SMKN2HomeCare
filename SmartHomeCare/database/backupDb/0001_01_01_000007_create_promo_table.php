<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
{
    // Gunakan Schema::create karena tabel belum ada
    Schema::create('promos', function (Blueprint $table) {
        $table->bigIncrements('id_promo');
        $table->string('nama_paket'); // Ganti dari kode_promo
        $table->text('deskripsi');    // Ganti dari deskripsi_layanan
        $table->decimal('diskon_persen', 5, 2); // Ganti dari potongan_harga
        $table->date('tanggal_berakhir');
        $table->enum('status_promo', ['Aktif', 'Tidak Aktif']);
        $table->timestamps();
    });

    // Buat tabel pivotnya
    Schema::create('promo_layanan', function (Blueprint $table) {
        $table->id();
        $table->unsignedBigInteger('id_promo');
        $table->unsignedBigInteger('id_layanan');
        
        // Foreign Keys
        $table->foreign('id_promo')->references('id_promo')->on('promos')->onDelete('cascade');
        $table->foreign('id_layanan')->references('id_layanan')->on('layanans')->onDelete('cascade');
    });
}

public function down()
{
    Schema::dropIfExists('promo_layanan');
    Schema::dropIfExists('promos');
}
};
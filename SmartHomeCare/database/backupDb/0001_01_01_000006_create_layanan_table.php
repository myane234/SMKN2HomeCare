<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Enums\KategoriLayanan;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('layanans', function (Blueprint $table) {
            $table->id('id_layanan');
            $table->string('nama_layanan');
            $table->text('deskripsi_layanan');
            $table->enum('kategori_layanan', array_column(KategoriLayanan::cases(), 'value'));
            $table->string('foto_layanan');
            $table->decimal('harga',10,2);
            $table->enum('tipe_layanan', ['durasi', 'tindakan'])->default('tindakan');
            $table->integer('durasi_menit')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('layanans');
    }
};
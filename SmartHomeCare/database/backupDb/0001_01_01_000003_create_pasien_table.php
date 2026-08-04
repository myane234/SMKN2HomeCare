<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pasiens', function (Blueprint $table) {
            $table->id('id_pasien');
            $table->foreignId('id_user')->constrained('users','id_user')->cascadeOnDelete();
            $table->string('nama_lengkap');
            $table->string('no_hp')->nullable();
            $table->string('nik')->nullable();
            $table->enum('golongan_darah',['A','B','AB','O'])->nullable();
            $table->enum('jenis_kelamin',['L','P'])->nullable();
            $table->string('alamat_utama')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pasiens');
    }
};
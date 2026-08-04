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
        Schema::create('pasiens', function (Blueprint $table) {
            $table->bigIncrements('id_pasien');
            $table->unsignedBigInteger('id_user')->index('pasiens_id_user_foreign');
            $table->string('nama_lengkap');
            $table->string('no_hp')->nullable();
            $table->string('nik')->nullable();
            $table->enum('golongan_darah', ['A', 'B', 'AB', 'O'])->nullable();
            $table->enum('jenis_kelamin', ['L', 'P'])->nullable();
            $table->string('alamat_utama')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('pasiens');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenaga_medis', function (Blueprint $table) {
            $table->id('id_tenaga_medis');
            $table->foreignId('id_user')->constrained('users', 'id_user')->cascadeOnDelete();
            $table->foreignId('id_pasien')->nullable()->constrained('pasiens', 'id_pasien')->cascadeOnDelete();
            
            // Relasi ke wilayah_layanan (sekarang aman karena tabelnya sudah dibuat duluan)
            $table->foreignId('id_wilayah_layanan')
                  ->nullable()
                  ->constrained('wilayah_layanan', 'id_wilayah_layanan')
                  ->nullOnDelete();

            $table->string('nama_lengkap');
            $table->string('nik', 16)->nullable();
            $table->string('jenis_tenaga_medis', 100);
            $table->string('no_str');
            $table->string('foto_profile')->nullable();
            $table->string('ijazah')->nullable();
            $table->string('sertifikat')->nullable();
            $table->string('lulusan')->nullable();
            $table->string('alamat_lengkap', 1000)->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenaga_medis');
    }
};
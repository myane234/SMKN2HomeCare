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
        Schema::create('nakes_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_user')->constrained('users', 'id_user')->cascadeOnDelete();
            $table->foreignId('id_pasien')->nullable()->constrained('pasiens', 'id_pasien')->cascadeOnDelete();
            
            // Relasi ke wilayah_layanan
            $table->foreignId('id_wilayah_layanan')
                  ->nullable()
                  ->constrained('wilayah_layanan', 'id_wilayah_layanan')
                  ->nullOnDelete();

            $table->string('nama_lengkap');
            $table->string('nik', 16);
            $table->string('no_str', 16);
            $table->string('foto_profile')->nullable();
            $table->string('jenis_tenaga_medis');
            $table->string('lulusan')->nullable();
            $table->string('alamat_lengkap', 1000)->nullable();
            $table->string('ijazah')->nullable();
            $table->string('sertifikat')->nullable();
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
            
            // STATUS ENUM DENGAN NILAI BARU (pending, pelatihan, approved, rejected)
            $table->enum('status', ['pending', 'pelatihan', 'approved', 'rejected'])->default('pending');
            $table->text('admin_notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('nakes_requests');
    }
};
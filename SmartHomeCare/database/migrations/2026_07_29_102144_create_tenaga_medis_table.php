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
        Schema::create('tenaga_medis', function (Blueprint $table) {
            // Primary Key & Foreign Keys
            $table->bigIncrements('id_tenaga_medis');
            $table->unsignedBigInteger('id_user')->index('tenaga_medis_id_user_foreign');
            $table->unsignedBigInteger('id_pasien')->nullable()->index('tenaga_medis_id_pasien_foreign');
            $table->unsignedBigInteger('id_wilayah_layanan')->nullable()->index('tenaga_medis_id_wilayah_layanan_foreign');

            // STEP 1: Data Diri & Profil Dasar
            $table->string('nama_lengkap');
            $table->string('nik', 16)->nullable();
            $table->enum('jenis_kelamin', ['L', 'P'])->nullable();
            $table->string('tempat_lahir')->nullable();
            $table->date('tanggal_lahir')->nullable();
            $table->string('alamat_lengkap', 1000)->nullable();
            $table->string('no_telp', 15)->nullable();
            $table->string('foto_profile')->nullable();

            // STEP 2: Legalitas & Profesi
            $table->string('jenis_tenaga_medis', 100);
            $table->string('no_str');
            $table->string('no_sip')->nullable();
            $table->string('no_npwp')->nullable();
            $table->string('lulusan')->nullable();

            // STEP 3: Upload Dokumen (Path File Storage)
            $table->string('ijazah')->nullable();
            $table->string('sertifikat')->nullable();
            $table->string('file_cv')->nullable();
            $table->string('file_skck')->nullable();
            $table->string('file_str')->nullable();
            $table->string('file_sip')->nullable();

            // STEP 4: Pengalaman & Seminar (Format JSON)
            $table->json('pengalaman_kerja')->nullable();
            $table->json('seminar_pelatihan')->nullable();

            // LOKASI (GPS Coordinates)
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();

            // VERIFIKASI & STATUS
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
        Schema::dropIfExists('tenaga_medis');
    }
};
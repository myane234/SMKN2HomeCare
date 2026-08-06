<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenaga_medis', function (Blueprint $table) {
            $table->bigIncrements('id_tenaga_medis');
            $table->unsignedBigInteger('id_user')->unique()->index('tenaga_medis_id_user_foreign');
            $table->unsignedBigInteger('id_pasien')->index('tenaga_medis_id_pasien_foreign');
            $table->unsignedBigInteger('id_wilayah_layanan')->index('tenaga_medis_id_wilayah_layanan_foreign');

            // DATA DIRI
            $table->string('nik', 16)->unique();
            $table->string('nama_lengkap');
            $table->string('nama_panggilan', 100);
            $table->enum('jenis_kelamin', ['L', 'P']);
            $table->string('tempat_lahir');
            $table->date('tanggal_lahir');
            $table->string('agama', 50);
            $table->string('no_telp', 15);
            $table->text('alamat_lengkap');
            $table->string('foto_profile')->nullable();

            // JENIS TENAGA MEDIS (self-assign oleh nakes pas register)
            $table->string('jenis_tenaga_medis', 100);

            // PENDIDIKAN & LEGALITAS
            $table->string('universitas');
            $table->string('program_studi');
            $table->year('tahun_lulus');
            $table->string('no_str');
            $table->string('no_sip');

            // BERKAS UTAMA
            $table->string('file_ktp');
            $table->string('ijazah');
            $table->string('file_skck');
            $table->string('file_cv');
            $table->string('file_str');
            $table->string('file_sip');

            // NULLABLE
            $table->string('tempat_kerja')->nullable();
            $table->string('lama_bekerja')->nullable();
            $table->json('dokumen_tambahan')->nullable();

            // STATUS & VERIFIKASI (dipegang admin, approve/reject doang)
            $table->enum('status', ['pending', 'pelatihan', 'approved', 'rejected'])->default('pending');
            $table->text('admin_notes')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenaga_medis');
    }
};
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
        // Add fields to nakes_requests table
        Schema::table('nakes_requests', function (Blueprint $table) {
            if (!Schema::hasColumn('nakes_requests', 'id_pasien')) {
                $table->foreignId('id_pasien')->nullable()->after('id_user')->constrained('pasiens', 'id_pasien')->cascadeOnDelete();
            }
            if (!Schema::hasColumn('nakes_requests', 'nama_lengkap')) {
                $table->string('nama_lengkap')->nullable()->after('id_pasien');
            }
            if (!Schema::hasColumn('nakes_requests', 'nik')) {
                $table->string('nik', 16)->nullable()->after('nama_lengkap');
            }
            if (!Schema::hasColumn('nakes_requests', 'foto_profile')) {
                $table->string('foto_profile')->nullable()->after('no_str');
            }
        });

        // Add fields to tenaga_medis table
        Schema::table('tenaga_medis', function (Blueprint $table) {
            if (!Schema::hasColumn('tenaga_medis', 'id_pasien')) {
                $table->foreignId('id_pasien')->nullable()->after('id_user')->constrained('pasiens', 'id_pasien')->cascadeOnDelete();
            }
            if (!Schema::hasColumn('tenaga_medis', 'nik')) {
                $table->string('nik', 16)->nullable()->after('nama_lengkap');
            }
            if (!Schema::hasColumn('tenaga_medis', 'foto_profile')) {
                $table->string('foto_profile')->nullable()->after('no_str');
            }
            if (!Schema::hasColumn('tenaga_medis', 'latitude')) {
                $table->decimal('latitude', 10, 8)->nullable()->after('lulusan');
            }
            if (!Schema::hasColumn('tenaga_medis', 'longitude')) {
                $table->decimal('longitude', 11, 8)->nullable()->after('latitude');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('nakes_requests', function (Blueprint $table) {
            $table->dropForeign(['id_pasien']);
            $table->dropColumn(['id_pasien', 'nama_lengkap', 'nik', 'foto_profile']);
        });

        Schema::table('tenaga_medis', function (Blueprint $table) {
            $table->dropForeign(['id_pasien']);
            $table->dropColumn(['id_pasien', 'nik', 'foto_profile', 'latitude', 'longitude']);
        });
    }
};

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
        Schema::table('tenaga_medis', function (Blueprint $table) {
            $table->foreign(['id_pasien'])->references(['id_pasien'])->on('pasiens')->onUpdate('restrict')->onDelete('cascade');
            $table->foreign(['id_user'])->references(['id_user'])->on('users')->onUpdate('restrict')->onDelete('cascade');
     

            $table->foreign('id_wilayah_layanan', 'tenaga_medis_id_wilayah_layanan_foreign')
          ->references('id_provinsi')
          ->on('master_provinsi')
          ->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tenaga_medis', function (Blueprint $table) {
            $table->dropForeign('tenaga_medis_id_pasien_foreign');
            $table->dropForeign('tenaga_medis_id_user_foreign');
            $table->dropForeign('tenaga_medis_id_wilayah_layanan_foreign');
        });
    }
};
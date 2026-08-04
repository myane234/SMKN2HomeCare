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
        Schema::table('bookings', function (Blueprint $table) {
            $table->foreign(['id_layanan'])->references(['id_layanan'])->on('layanans')->onUpdate('restrict')->onDelete('restrict');
            $table->foreign(['id_pasien'])->references(['id_pasien'])->on('pasiens')->onUpdate('restrict')->onDelete('restrict');
            $table->foreign(['id_promo'])->references(['id_promo'])->on('promos')->onUpdate('restrict')->onDelete('restrict');
            $table->foreign(['id_tenaga_medis'])->references(['id_tenaga_medis'])->on('tenaga_medis')->onUpdate('restrict')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bookings', function (Blueprint $table) {
            $table->dropForeign('bookings_id_layanan_foreign');
            $table->dropForeign('bookings_id_pasien_foreign');
            $table->dropForeign('bookings_id_promo_foreign');
            $table->dropForeign('bookings_id_tenaga_medis_foreign');
        });
    }
};

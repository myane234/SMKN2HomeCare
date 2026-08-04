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
        Schema::table('jadwal_kerjas', function (Blueprint $table) {
            $table->foreign(['id_tenaga_medis'])->references(['id_tenaga_medis'])->on('tenaga_medis')->onUpdate('restrict')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('jadwal_kerjas', function (Blueprint $table) {
            $table->dropForeign('jadwal_kerjas_id_tenaga_medis_foreign');
        });
    }
};

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
        Schema::table('promo_layanan', function (Blueprint $table) {
            $table->foreign(['id_layanan'])->references(['id_layanan'])->on('layanans')->onUpdate('restrict')->onDelete('cascade');
            $table->foreign(['id_promo'])->references(['id_promo'])->on('promos')->onUpdate('restrict')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('promo_layanan', function (Blueprint $table) {
            $table->dropForeign('promo_layanan_id_layanan_foreign');
            $table->dropForeign('promo_layanan_id_promo_foreign');
        });
    }
};

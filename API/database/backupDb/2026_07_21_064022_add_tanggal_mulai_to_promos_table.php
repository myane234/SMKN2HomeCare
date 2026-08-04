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
        Schema::table('promos', function (Blueprint $table) {
            //
            $table->date('tanggal_mulai')->after('diskon_persen');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('promos', function (Blueprint $table) {
            //
        });
    }
};

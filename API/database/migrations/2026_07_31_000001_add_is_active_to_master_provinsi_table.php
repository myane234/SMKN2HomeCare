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
        Schema::table('master_provinsi', function (Blueprint $table) {
            if (!Schema::hasColumn('master_provinsi', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('nama_provinsi');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('master_provinsi', function (Blueprint $table) {
            if (Schema::hasColumn('master_provinsi', 'is_active')) {
                $table->dropColumn('is_active');
            }
        });
    }
};

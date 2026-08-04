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
        Schema::table('user_roles', function (Blueprint $table) {
            $table->foreign(['id_role'])->references(['id_role'])->on('roles')->onUpdate('restrict')->onDelete('cascade');
            $table->foreign(['id_user'])->references(['id_user'])->on('users')->onUpdate('restrict')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('user_roles', function (Blueprint $table) {
            $table->dropForeign('user_roles_id_role_foreign');
            $table->dropForeign('user_roles_id_user_foreign');
        });
    }
};

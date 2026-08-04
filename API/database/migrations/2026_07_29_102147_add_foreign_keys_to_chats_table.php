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
        Schema::table('chats', function (Blueprint $table) {
            $table->foreign(['id_booking'])->references(['id_booking'])->on('bookings')->onUpdate('restrict')->onDelete('restrict');
            $table->foreign(['id_pengirim'])->references(['id_user'])->on('users')->onUpdate('restrict')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('chats', function (Blueprint $table) {
            $table->dropForeign('chats_id_booking_foreign');
            $table->dropForeign('chats_id_pengirim_foreign');
        });
    }
};

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
        Schema::create('chats', function (Blueprint $table) {
            $table->bigIncrements('id_chat');
            $table->unsignedBigInteger('id_booking')->index('chats_id_booking_foreign');
            $table->unsignedBigInteger('id_pengirim')->index('chats_id_pengirim_foreign');
            $table->text('pesan');
            $table->timestamp('waktu_kirim')->useCurrent();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chats');
    }
};

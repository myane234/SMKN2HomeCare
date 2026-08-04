<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chats', function (Blueprint $table) {
            $table->id('id_chat');

            $table->foreignId('id_booking')
                  ->constrained('bookings','id_booking');

            $table->foreignId('id_pengirim')
                  ->constrained('users','id_user');

            $table->text('pesan');
            $table->timestamp('waktu_kirim')->useCurrent();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('chats');
    }
};
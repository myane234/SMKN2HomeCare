<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('admins', function (Blueprint $table) {
            $table->id('id_admin');
            $table->foreignId('id_user')->constrained('users','id_user')->cascadeOnDelete();
            $table->string('nama_lengkap');
            $table->enum('tier_admin', [
                'Super Admin',
                'Admin'
            ]);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('admins');
    }
};
?>
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
        Schema::create('transaksis', function (Blueprint $table) {
            $table->bigIncrements('id_transaksi');
            $table->unsignedBigInteger('id_booking')->index('transaksis_id_booking_foreign');
            $table->decimal('jumlah_total', 10);
            $table->enum('metode_pembayaran', ['Transfer', 'QRIS', 'Cash']);
            $table->enum('status_transaksi', ['Belum Bayar', 'Lunas', 'Gagal']);
            $table->timestamp('waktu_bayar')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transaksis');
    }
};

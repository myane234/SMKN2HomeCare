<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transaksis', function (Blueprint $table) {
            $table->id('id_transaksi');

            $table->foreignId('id_booking')
                  ->constrained('bookings','id_booking');

            $table->decimal('jumlah_total',10,2);

            $table->enum('metode_pembayaran',[ //MidTrans 
                'Transfer',
                'QRIS',
                'Cash'
            ]);

            $table->enum('status_transaksi',[
                'Belum Bayar',
                'Lunas',
                'Gagal'
            ]);

            $table->timestamp('waktu_bayar')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transaksis');
    }
};
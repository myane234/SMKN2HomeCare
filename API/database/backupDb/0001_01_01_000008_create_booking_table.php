<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bookings', function (Blueprint $table) {
            $table->id('id_booking');
            $table->string('booking_code');

            $table->foreignId('id_pasien')
                  ->constrained('pasiens','id_pasien');

            $table->foreignId('id_layanan')
                  ->constrained('layanans','id_layanan');

            $table->foreignId('id_tenaga_medis')
                  ->constrained('tenaga_medis','id_tenaga_medis');

            $table->foreignId('id_promo')
                  ->nullable()
                  ->constrained('promos','id_promo');

            $table->date('tanggal_kunjungan');
            $table->time('jam_kunjungan');
            $table->string('alamat_kunjungan');
            $table->decimal('latitude_kunjungan',10,7);
            $table->decimal('longitude_kunjungan',11,7);

            $table->enum('status_booking',[
                'Pending',
                'Diproses',
                'Selesai',
                'Dibatalkan'
            ]);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};
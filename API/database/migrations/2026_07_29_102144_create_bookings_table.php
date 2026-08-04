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
        Schema::create('bookings', function (Blueprint $table) {
            $table->bigIncrements('id_booking');
            $table->string('booking_code');
            $table->unsignedBigInteger('id_pasien')->index('bookings_id_pasien_foreign');
            $table->unsignedBigInteger('id_layanan')->index('bookings_id_layanan_foreign');
            $table->unsignedBigInteger('id_tenaga_medis')->index('bookings_id_tenaga_medis_foreign');
            $table->unsignedBigInteger('id_promo')->nullable()->index('bookings_id_promo_foreign');
            $table->date('tanggal_kunjungan');
            $table->time('jam_kunjungan');
            $table->string('alamat_kunjungan');
            $table->decimal('latitude_kunjungan', 10, 7);
            $table->decimal('longitude_kunjungan', 11, 7);
            $table->enum('status_booking', ['Pending', 'DiPerjalanan', 'Tindakan' ,'Selesai', 'Dibatalkan']);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bookings');
    }
};

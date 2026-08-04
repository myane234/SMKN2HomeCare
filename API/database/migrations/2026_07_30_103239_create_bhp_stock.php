<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('bhp_items', function (Blueprint $table) {
            $table->id('id_bhp');
            $table->string('nama_barang');                   // Contoh: Jarum Suntik 3cc, Alkohol Swab, Infus Set
            $table->decimal('harga_satuan', 12, 2);          // Harga beli/satuan barang
            $table->integer('stok')->default(0);             // Sisa stok fisik di gudang
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('bhp_items');
    }
};
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('master_tarif', function (Blueprint $table) {
            $table->id('id_master_tarif');
            $table->string('nama_template');                 // Contoh: Template Tindakan Medis Standar
            $table->enum('kategori_tarif', ['tindakan', 'waktu']); // Kategori master tarif
            
            // Komponen Biaya Tambahan dalam Template
            $table->decimal('biaya_admin', 12, 2)->default(0.00);   
            $table->decimal('persentase_ppn', 5, 2)->default(11.00); 
            
            // Komponen Hak / Fee Nakes
            $table->decimal('fee_nakes_persen', 5, 2)->default(0.00);  
            $table->decimal('fee_nakes_nominal', 12, 2)->default(0.00); 
            
            // Komponen Transport
            $table->decimal('tarif_transport_per_km', 12, 2)->default(0.00); 
            
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('master_tarif');
    }
};
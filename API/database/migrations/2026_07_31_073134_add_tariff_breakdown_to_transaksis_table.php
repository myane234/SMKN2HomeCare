<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('transaksis', function (Blueprint $table) {
            $table->decimal('sl', 12, 2)->default(0.00)->after('id_booking');
            $table->decimal('sb', 12, 2)->default(0.00)->after('sl');
            $table->decimal('st', 12, 2)->default(0.00)->after('sb');
            $table->decimal('ba', 12, 2)->default(0.00)->after('st');
            $table->decimal('ppn', 12, 2)->default(0.00)->after('ba');
            $table->decimal('persen_ppn', 5, 2)->default(0.00)->after('ppn');
            $table->decimal('persen_fee_nakes', 5, 2)->default(0.00)->after('persen_ppn');
            $table->decimal('fee_midtrans', 12, 2)->default(0.00)->after('persen_fee_nakes');
            $table->decimal('hpp_bhp', 12, 2)->default(0.00)->after('fee_midtrans');
            $table->decimal('hak_nakes', 12, 2)->default(0.00)->after('hpp_bhp');
            $table->decimal('profit_hc', 12, 2)->default(0.00)->after('hak_nakes');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transaksis', function (Blueprint $table) {
            $table->dropColumn([
                'sl', 'sb', 'st', 'ba', 'ppn', 'persen_ppn',
                'persen_fee_nakes', 'fee_midtrans', 'hpp_bhp', 'hak_nakes', 'profit_hc'
            ]);
        });
    }
};

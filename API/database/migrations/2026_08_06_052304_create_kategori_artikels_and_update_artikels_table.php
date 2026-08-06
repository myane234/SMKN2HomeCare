<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Buat tabel kategori_artikels
        Schema::create('kategori_artikels', function (Blueprint $table) {
            $table->bigIncrements('id_kategori_artikel');
            $table->string('nama_kategori');
            $table->timestamps();
        });

        // 2. Isi data default
        DB::table('kategori_artikels')->insert([
            ['nama_kategori' => 'Tips Kesehatan', 'created_at' => now(), 'updated_at' => now()],
            ['nama_kategori' => 'Kegiatan', 'created_at' => now(), 'updated_at' => now()],
        ]);

        // 3. Tambahkan kolom foreign key di artikels
        Schema::table('artikels', function (Blueprint $table) {
            $table->unsignedBigInteger('id_kategori_artikel')->nullable()->after('id');
            $table->foreign('id_kategori_artikel')
                  ->references('id_kategori_artikel')
                  ->on('kategori_artikels')
                  ->onDelete('set null');
        });

        // 4. Migrasi data lama ke foreign key baru
        $tipsId = DB::table('kategori_artikels')->where('nama_kategori', 'Tips Kesehatan')->value('id_kategori_artikel');
        $kegiatanId = DB::table('kategori_artikels')->where('nama_kategori', 'Kegiatan')->value('id_kategori_artikel');

        if ($tipsId) {
            DB::table('artikels')->where('kategori_artikel', 'Tips Kesehatan')->update(['id_kategori_artikel' => $tipsId]);
        }
        if ($kegiatanId) {
            DB::table('artikels')->where('kategori_artikel', 'Kegiatan')->update(['id_kategori_artikel' => $kegiatanId]);
        }

        // 5. Hapus kolom ENUM lama
        Schema::table('artikels', function (Blueprint $table) {
            $table->dropColumn('kategori_artikel');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Kembalikan ke format ENUM jika rollback
        Schema::table('artikels', function (Blueprint $table) {
            $table->enum('kategori_artikel', ['Tips Kesehatan', 'Kegiatan'])->nullable()->after('id_kategori_artikel');
        });

        $tipsId = DB::table('kategori_artikels')->where('nama_kategori', 'Tips Kesehatan')->value('id_kategori_artikel');
        $kegiatanId = DB::table('kategori_artikels')->where('nama_kategori', 'Kegiatan')->value('id_kategori_artikel');

        if ($tipsId) {
            DB::table('artikels')->where('id_kategori_artikel', $tipsId)->update(['kategori_artikel' => 'Tips Kesehatan']);
        }
        if ($kegiatanId) {
            DB::table('artikels')->where('id_kategori_artikel', $kegiatanId)->update(['kategori_artikel' => 'Kegiatan']);
        }

        Schema::table('artikels', function (Blueprint $table) {
            $table->dropForeign(['id_kategori_artikel']);
            $table->dropColumn('id_kategori_artikel');
        });

        Schema::dropIfExists('kategori_artikels');
    }
};

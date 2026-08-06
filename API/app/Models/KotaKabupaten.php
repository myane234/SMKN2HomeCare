<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class KotaKabupaten extends Model
{
    protected $table = 'Master_Kota_Kabupaten';
    protected $primaryKey = 'id_kota';

    protected $fillable = [
        'id_provinsi',
        'nama_kota',
    ];

    /**
     * Relasi Many-to-One ke WilayahLayanan (master_provinsi)
     */
    public function provinsi(): BelongsTo
    {
        return $this->belongsTo(WilayahLayanan::class, 'id_provinsi', 'id_provinsi');
    }
}
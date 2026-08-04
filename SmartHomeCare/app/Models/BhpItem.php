<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class BhpItem extends Model
{
    use HasFactory;

    protected $table = 'bhp_items';
    protected $primaryKey = 'id_bhp';

    protected $fillable = [
        'nama_barang',
        'harga_satuan',
        'stok',
    ];

    // Relasi Many-to-Many ke MasterTarif melalui tabel pivot master_tarif_bhp
    public function masterTarifs()
    {
        return $this->belongsToMany(MasterTarif::class, 'master_tarif_bhp', 'id_bhp', 'id_master_tarif')
                    ->withPivot('jumlah_pakai')
                    ->withTimestamps();
    }
}
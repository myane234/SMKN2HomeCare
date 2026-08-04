<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MasterTarif extends Model
{
    use HasFactory;

    protected $table = 'master_tarif';
    protected $primaryKey = 'id_master_tarif';

    protected $fillable = [
        'nama_template',
        'kategori_tarif',
        'biaya_admin',
        'persentase_ppn',
        'fee_nakes_persen',
        'fee_nakes_nominal',
        'tarif_transport_per_km',
        'is_active',
    ];

    // Relasi ke Layanan (1 Template bisa dipakai banyak Layanan)
    public function layanans()
    {
        return $this->hasMany(Layanan::class, 'id_master_tarif', 'id_master_tarif');
    }
    
    public function bhpItems()
    {
        return $this->belongsToMany(BhpItem::class, 'master_tarif_bhp', 'id_master_tarif', 'id_bhp')
                    ->withPivot('jumlah_pakai')
                    ->withTimestamps();
    }
}
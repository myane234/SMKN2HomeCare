<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Layanan extends Model
{
    use HasFactory;
    protected $primaryKey = 'id_layanan';

    protected $fillable = [
        'id_master_tarif',
        'nama_layanan',
        'id_kategori_layanan',
        'harga',
        'tipe_layanan',
        'durasi_menit',
        'include_transport',
        'foto_layanan',
        'deskripsi_layanan',
    ];

    public function kategori()
    {
        return $this->belongsTo(KategoriLayanan::class, 'id_kategori_layanan', 'id_kategori_layanan');
    }

    public function masterTarif()
    {
        return $this->belongsTo(MasterTarif::class, 'id_master_tarif', 'id_master_tarif');
    }
}

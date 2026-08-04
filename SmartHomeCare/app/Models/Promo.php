<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Promo extends Model
{
    use HasFactory;
    
    protected $table = 'promos';
    protected $primaryKey = 'id_promo';

    protected $fillable = [
        'nama_paket',
        'deskripsi',
        'diskon_persen',
        'tanggal_mulai',
        'tanggal_berakhir',
        'status_promo',
        'gambar_promo',
    ];

    protected $casts = [
        'diskon_persen' => 'decimal:2',
        'tanggal_mulai' => 'date',
        'tanggal_berakhir' => 'date',
    ];

    public function getGambarPromoUrlAttribute()
    {
        if (!$this->gambar_promo) {
            return null;
        }

        return \Illuminate\Support\Facades\Storage::disk('public')->url($this->gambar_promo);
    }

    public function layanans()
    {
        return $this->belongsToMany(Layanan::class, 'promo_layanan', 'id_promo', 'id_layanan');
    }
}
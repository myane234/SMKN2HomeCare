<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Storage;

class Artikel extends Model
{
    use HasFactory;
    
    protected $table = 'artikels';

    protected $fillable = [
        'judul_artikel',
        'id_kategori_artikel',
        'isi_artikel',
        'gambar_artikel',
        'views',
    ];

    protected $appends = ['kategori_artikel'];

    /**
     * Relasi ke KategoriArtikel.
     */
    public function kategori()
    {
        return $this->belongsTo(KategoriArtikel::class, 'id_kategori_artikel', 'id_kategori_artikel');
    }

    /**
     * Accessor untuk mendapatkan nama kategori sebagai string demi backward compatibility.
     */
    public function getKategoriArtikelAttribute()
    {
        return $this->kategori ? $this->kategori->nama_kategori : null;
    }

    /**
     * Accessor untuk mendapatkan URL penuh dari gambar artikel.
     */
    public function getGambarArtikelAttribute($value)
    {
        return $value ? Storage::disk('public')->url($value) : null;
    }
}

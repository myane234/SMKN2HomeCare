<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Artikel extends Model
{
    use HasFactory;
    
    protected $table = 'artikels';

    protected $fillable = [
        'judul_artikel',
        'kategori_artikel',
        'isi_artikel',
        'gambar_artikel',
        'views',
    ];
}

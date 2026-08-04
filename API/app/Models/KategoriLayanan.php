<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class KategoriLayanan extends Model
{
    protected $table = 'kategori_layanans';
    protected $primaryKey = 'id_kategori_layanan';
    protected $fillable = ['nama_kategori'];
}

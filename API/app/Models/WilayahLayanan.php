<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WilayahLayanan extends Model
{
    protected $table = 'master_provinsi';
    protected $primaryKey = 'id_provinsi';

    protected $fillable = [
        'nama_provinsi',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use App\Models\Users;
use App\Models\TenagaMedis;
use App\Models\NakesRequest;

class Pasien extends Model
{
    use HasFactory;

    protected $table = 'pasiens';
    protected $primaryKey = 'id_pasien';

    protected $fillable = [
        'id_user',
        'nama_lengkap',
        'no_hp',
        'nik',
        'golongan_darah',
        'jenis_kelamin',
        'alamat_utama',
    ];

    public function user()
    {
        return $this->belongsTo(Users::class, 'id_user', 'id_user');
    }

    public function tenagaMedis()
    {
        return $this->hasOne(TenagaMedis::class, 'id_pasien', 'id_pasien');
    }

    public function nakesRequests()
    {
        return $this->hasMany(NakesRequest::class, 'id_pasien', 'id_pasien');
    }
}

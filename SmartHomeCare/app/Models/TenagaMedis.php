<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TenagaMedis extends Model
{
    use HasFactory;

    protected $table = 'tenaga_medis';
    protected $primaryKey = 'id_tenaga_medis';

    protected $fillable = [
        'id_user',
        'id_pasien',
        'id_wilayah_layanan',

        'nama_lengkap',
        'nik',
        'jenis_kelamin',
        'tempat_lahir',
        'tanggal_lahir',
        'alamat_lengkap',
        'no_telp',
        'foto_profile',

        'jenis_tenaga_medis',
        'no_str',
        'no_sip',
        'no_npwp',
        'lulusan',

   
        'ijazah',
        'sertifikat',
        'file_cv',
        'file_skck',
        'file_str',
        'file_sip',

  
        'pengalaman_kerja',
        'seminar_pelatihan',


        'latitude',
        'longitude',


        'status',
        'admin_notes',
    ];


    protected $casts = [
        'pengalaman_kerja'  => 'array',
        'seminar_pelatihan' => 'array',
        'tanggal_lahir'     => 'date',
    ];

  
    public function user()
    {
        return $this->belongsTo(Users::class, 'id_user', 'id_user');
    }

   
    public function pasien()
    {
        return $this->belongsTo(Pasien::class, 'id_pasien', 'id_pasien');
    }
    
    public function wilayahLayanan()
    {
        return $this->belongsTo(WilayahLayanan::class, 'id_wilayah_layanan', 'id_wilayah_layanan');
    }

    public function kategoriLayanan()
    {
        return $this->belongsToMany(
            KategoriLayanan::class,
            'kategori_layanan_tenaga_medis',
            'id_tenaga_medis',
            'id_kategori_layanan'
        );
    }
}
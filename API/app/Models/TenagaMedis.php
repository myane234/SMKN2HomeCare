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

        // Data Diri
        'nik',
        'nama_lengkap',
        'nama_panggilan',
        'jenis_kelamin',
        'tempat_lahir',
        'tanggal_lahir',
        'agama',
        'no_telp',
        'alamat_lengkap',
        'foto_profile',

        // Pendidikan & Legalitas
        'jenis_tenaga_medis',
        'universitas',
        'program_studi',
        'tahun_lulus',
        'no_str',
        'no_sip',

        // File Berkas Utama
        'file_ktp',
        'ijazah',
        'file_skck',
        'file_cv',
        'file_str',
        'file_sip',

        // Nullable Fields
        'tempat_kerja',
        'lama_bekerja',
        'dokumen_tambahan',

        // Status
        'status',
        'admin_notes',
    ];

    protected $casts = [
        'dokumen_tambahan' => 'array',
        'tanggal_lahir'    => 'date',
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
    return $this->belongsTo(WilayahLayanan::class, 'id_wilayah_layanan', 'id_provinsi');
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
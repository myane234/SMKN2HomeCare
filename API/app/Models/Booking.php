<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    use HasFactory;

    protected $table = 'bookings';
    protected $primaryKey = 'id_booking';

    protected $fillable = [
        'booking_code',
        'id_pasien',
        'id_layanan',
        'id_tenaga_medis',
        'id_promo',
        'tanggal_kunjungan',
        'jam_kunjungan',
        'alamat_kunjungan',
        'latitude_kunjungan',
        'longitude_kunjungan',
        'status_booking',
    ];

    public function pasien()
    {
        return $this->belongsTo(Pasien::class, 'id_pasien', 'id_pasien');
    }

    public function layanan()
    {
        return $this->belongsTo(Layanan::class, 'id_layanan', 'id_layanan');
    }

    public function tenagaMedis()
    {
        return $this->belongsTo(TenagaMedis::class, 'id_tenaga_medis', 'id_tenaga_medis');
    }

    public function transaksi()
    {
        return $this->hasOne(Transaksi::class, 'id_booking', 'id_booking');
    }
}

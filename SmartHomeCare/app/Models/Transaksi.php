<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Transaksi extends Model
{
    use HasFactory;

    protected $table = 'transaksis';
    protected $primaryKey = 'id_transaksi';

    protected $fillable = [
        'id_booking',
        'jumlah_total',
        'metode_pembayaran',
        'status_transaksi',
        'waktu_bayar',
        'sl',
        'sb',
        'st',
        'ba',
        'ppn',
        'persen_ppn',
        'persen_fee_nakes',
        'fee_midtrans',
        'hpp_bhp',
        'hak_nakes',
        'profit_hc',
    ];

    public function booking()
    {
        return $this->belongsTo(Booking::class, 'id_booking', 'id_booking');
    }
}

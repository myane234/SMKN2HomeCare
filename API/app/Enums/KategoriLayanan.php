<?php

namespace App\Enums;

enum KategoriLayanan: string 
{
    case IbuDanAnak = 'Ibu dan Anak';
    case PerawatanLuka = 'Perawatan Luka';
    case MedicalCheckup = 'Medical Checkup';
    case Fisioterapi = 'Fisioterapi';
    case PemasanganAlatMedis = 'Pemasangan dan Penggantian Alat Medis';
}
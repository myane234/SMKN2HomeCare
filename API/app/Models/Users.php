<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail; 
use Illuminate\Auth\MustVerifyEmail as MustVerifyEmailTrait;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Users extends Authenticatable implements MustVerifyEmail 
{
    use HasFactory, HasApiTokens, Notifiable, MustVerifyEmailTrait; 

    protected $table = 'users';
    protected $primaryKey = 'id_user'; 

    protected $fillable = [
        'email',
        'password',
        'is_active',
        'google_id',
        'email_verified_at',
    ];

    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

    public function pasien() {
        return $this->hasOne(Pasien::class, 'id_user', 'id_user');
    }

    public function roles() {
        return $this->belongsToMany(
            Role::class,
            'user_roles',
            'id_user',
            'id_role'
        )->withTimestamps();
    }
}
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MemberQrCode extends Model
{
    use HasFactory;

    protected $fillable = ['member_id', 'qr_token', 'expires_at'];

    protected $hidden = ['qr_token'];

    public function member()
    {
        return $this->belongsTo(Member::class);
    }
}

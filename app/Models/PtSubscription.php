<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PtSubscription extends Model
{
    use HasFactory;

    protected $fillable = [
        'member_id',
        'trainer_id',
        'pt_package_id',
        'total_sessions',
        'remaining_sessions',
        'price_paid',
        'payment_method',
        'payment_status',
        'sold_by_id',
        'start_date',
        'end_date',
        'status',
    ];

    public function member()
    {
        return $this->belongsTo(Member::class);
    }

    public function trainer()
    {
        return $this->belongsTo(Trainer::class);
    }

    public function package()
    {
        return $this->belongsTo(PtPackage::class, 'pt_package_id');
    }

    public function sessions()
    {
        return $this->hasMany(PtSession::class);
    }
}

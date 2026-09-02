<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MembershipSubscription extends Model
{
    use HasFactory;

    protected $fillable = [
        'member_id',
        'package_id',
        'start_date',
        'end_date',
        'price_paid',
        'status',
        'freeze_start_date',
        'freeze_end_date',
        'freeze_reason',
        'sold_by_id',
    ];

    public function member()
    {
        return $this->belongsTo(Member::class);
    }

    public function package()
    {
        return $this->belongsTo(MembershipPackage::class, 'package_id');
    }

    public function soldBy()
    {
        return $this->belongsTo(User::class, 'sold_by_id');
    }

    public function transactions()
    {
        return $this->hasMany(MembershipTransaction::class, 'subscription_id');
    }
}

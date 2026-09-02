<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MembershipTransaction extends Model
{
    use HasFactory;

    protected $fillable = [
        'subscription_id',
        'member_id',
        'transaction_code',
        'payment_method',
        'amount',
        'status',
        'paid_at',
        'created_by',
        'notes',
    ];

    public function subscription()
    {
        return $this->belongsTo(MembershipSubscription::class, 'subscription_id');
    }

    public function member()
    {
        return $this->belongsTo(Member::class);
    }

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}

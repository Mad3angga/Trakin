<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PtSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'pt_subscription_id',
        'member_id',
        'trainer_id',
        'session_date',
        'start_time',
        'end_time',
        'status',
        'notes',
    ];

    public function subscription()
    {
        return $this->belongsTo(PtSubscription::class, 'pt_subscription_id');
    }

    public function member()
    {
        return $this->belongsTo(Member::class);
    }

    public function trainer()
    {
        return $this->belongsTo(Trainer::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Trainer extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'branch_id',
        'trainer_code',
        'full_name',
        'email',
        'phone',
        'specialization',
        'bio',
        'skills',
        'achievements',
        'photo',
        'portrait_photo',
        'status',
    ];

    protected $hidden = [];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function availabilities()
    {
        return $this->hasMany(TrainerAvailability::class);
    }

    public function classSchedules()
    {
        return $this->hasMany(ClassSchedule::class);
    }

    public function ptSubscriptions()
    {
        return $this->hasMany(PtSubscription::class);
    }

    public function ptSessions()
    {
        return $this->hasMany(PtSession::class);
    }
}

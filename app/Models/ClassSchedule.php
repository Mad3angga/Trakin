<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ClassSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'class_id',
        'branch_id',
        'trainer_id',
        'start_time',
        'end_time',
        'room',
        'max_capacity',
        'status',
    ];

    public function gymClass()
    {
        return $this->belongsTo(GymClass::class, 'class_id');
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function trainer()
    {
        return $this->belongsTo(Trainer::class);
    }

    public function registrations()
    {
        return $this->hasMany(ClassRegistration::class);
    }
}

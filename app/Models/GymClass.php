<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GymClass extends Model
{
    use HasFactory;

    protected $table = 'classes';

    protected $fillable = ['name', 'description', 'category', 'image', 'capacity', 'duration_minutes', 'status'];

    public function schedules()
    {
        return $this->hasMany(ClassSchedule::class, 'class_id');
    }
}

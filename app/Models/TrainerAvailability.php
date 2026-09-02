<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TrainerAvailability extends Model
{
    use HasFactory;

    protected $fillable = ['trainer_id', 'day_of_week', 'start_time', 'end_time'];

    public function trainer()
    {
        return $this->belongsTo(Trainer::class);
    }
}

<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PtPackage extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'total_sessions', 'price', 'validity_days', 'status'];
}

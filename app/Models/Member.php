<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Member extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'user_id',
        'branch_id',
        'member_code',
        'full_name',
        'email',
        'phone',
        'gender',
        'date_of_birth',
        'address',
        'emergency_contact_name',
        'emergency_contact_phone',
        'photo',
        'status',
        'notes',
    ];

    protected $hidden = [
        'email',
        'date_of_birth',
        'address',
        'emergency_contact_name',
        'emergency_contact_phone',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function qrCode()
    {
        return $this->hasOne(MemberQrCode::class);
    }

    public function subscriptions()
    {
        return $this->hasMany(MembershipSubscription::class);
    }

    public function activeSubscription()
    {
        return $this->hasOne(MembershipSubscription::class)->where('status', 'active')->where('end_date', '>=', now()->toDateString());
    }

    public function transactions()
    {
        return $this->hasMany(MembershipTransaction::class);
    }

    public function attendances()
    {
        return $this->hasMany(Attendance::class);
    }

    public function classRegistrations()
    {
        return $this->hasMany(ClassRegistration::class);
    }

    public function ptSubscriptions()
    {
        return $this->hasMany(PtSubscription::class);
    }
}

<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasRoles;

    protected $fillable = [
        'name',
        'email',
        'password',
        'branch_id',
        'phone',
        'photo',
        'device_token',
        'last_seen_at',
        'status',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'last_seen_at' => 'datetime',
        ];
    }

    // Role Constants
    const ROLE_OWNER = 'Owner';
    const ROLE_MANAGER = 'Manager';
    const ROLE_SALES = 'Sales';
    const ROLE_FRONT_DESK = 'Front Desk';
    const ROLE_TRAINER = 'Trainer';
    const ROLE_MEMBER = 'Member';

    // Main Role Groups
    const CATEGORY_MANAGEMENT = 'management';
    const CATEGORY_STAFF = 'staff';
    const CATEGORY_MEMBER = 'member';

    const MANAGEMENT_ROLES = [self::ROLE_OWNER, self::ROLE_MANAGER];
    const STAFF_ROLES = [self::ROLE_SALES, self::ROLE_FRONT_DESK, self::ROLE_TRAINER];

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function member()
    {
        return $this->hasOne(Member::class);
    }

    public function trainer()
    {
        return $this->hasOne(Trainer::class);
    }

    /**
     * Get the main role category: 'management', 'staff', or 'member'
     */
    public function getRoleCategoryAttribute(): string
    {
        $roleName = $this->roles->first()?->name;
        if (in_array($roleName, self::MANAGEMENT_ROLES)) {
            return self::CATEGORY_MANAGEMENT;
        }
        if (in_array($roleName, self::STAFF_ROLES)) {
            return self::CATEGORY_STAFF;
        }
        if ($roleName === self::ROLE_MEMBER) {
            return self::CATEGORY_MEMBER;
        }
        return 'other';
    }

    /**
     * Get a formatted display label for the role (e.g., "Staff (Sales)", "Owner", "Manager")
     */
    public function getMainRoleLabelAttribute(): string
    {
        $roleName = $this->roles->first()?->name ?? 'Staf';
        if (in_array($roleName, self::STAFF_ROLES)) {
            return "Staff ({$roleName})";
        }
        return $roleName;
    }

    public function isOwner(): bool
    {
        return $this->hasRole(self::ROLE_OWNER);
    }

    public function isManager(): bool
    {
        return $this->hasRole(self::ROLE_MANAGER);
    }

    public function isStaff(): bool
    {
        return $this->hasAnyRole(self::STAFF_ROLES);
    }

    public function isMember(): bool
    {
        return $this->hasRole(self::ROLE_MEMBER);
    }
}

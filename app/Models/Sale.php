<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Sale extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_number',
        'member_id',
        'branch_id',
        'payment_method',
        'subtotal',
        'tax',
        'discount',
        'total_amount',
        'paid_amount',
        'change_amount',
        'payment_status',
        'cashier_id',
        'sold_by_id',
    ];

    public function member()
    {
        return $this->belongsTo(Member::class);
    }

    public function branch()
    {
        return $this->belongsTo(Branch::class);
    }

    public function cashier()
    {
        return $this->belongsTo(User::class, 'cashier_id');
    }

    public function soldBy()
    {
        return $this->belongsTo(User::class, 'sold_by_id');
    }

    public function items()
    {
        return $this->hasMany(SaleItem::class);
    }
}

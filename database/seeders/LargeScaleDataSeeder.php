<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\Member;
use App\Models\MembershipPackage;
use App\Models\Product;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class LargeScaleDataSeeder extends Seeder
{
    public function run(): void
    {
        $branch = Branch::first() ?? Branch::create([
            'name' => 'Trakin Fitness Center Main',
            'code' => 'TRK-01',
            'address' => 'Jl. Sudirman No. 88, Jakarta',
            'phone' => '021-5551234',
            'email' => 'info@trakingym.id',
            'status' => 'active',
        ]);

        $cashier = User::first();
        $packages = MembershipPackage::all();
        $products = Product::all();
        $members = Member::all();

        if ($products->isEmpty() || $packages->isEmpty()) {
            return;
        }

        $paymentMethods = ['cash', 'qris', 'debit'];
        $memberIds = $members->pluck('id')->toArray();
        $productItems = $products->toArray();
        $packageItems = $packages->toArray();

        $startDate = Carbon::create(2025, 1, 1, 8, 0, 0);
        $endDate = Carbon::create(2026, 8, 3, 21, 0, 0);
        $totalSeconds = $startDate->diffInSeconds($endDate);

        DB::statement('PRAGMA foreign_keys = OFF;');
        DB::disableQueryLog();

        // 1. Generate 7,000 POS Sales & Items
        $salesBatch = [];
        $saleItemsBatch = [];

        for ($i = 1; $i <= 7000; $i++) {
            $randomSecs = rand(0, $totalSeconds);
            $createdAt = $startDate->copy()->addSeconds($randomSecs);

            $memberId = (!empty($memberIds) && rand(1, 10) <= 7) ? $memberIds[array_rand($memberIds)] : null;
            $paymentMethod = $paymentMethods[array_rand($paymentMethods)];

            $subtotal = 0;
            $numItems = rand(1, 3);
            $chosenProducts = [];

            for ($j = 0; $j < $numItems; $j++) {
                $product = $productItems[array_rand($productItems)];
                $qty = rand(1, 3);
                $itemSubtotal = $product['price'] * $qty;
                $subtotal += $itemSubtotal;
                $chosenProducts[] = [
                    'product_id' => $product['id'],
                    'quantity' => $qty,
                    'unit_price' => $product['price'],
                    'subtotal' => $itemSubtotal,
                ];
            }

            $tax = (int) round($subtotal * 0.11);
            $discount = (rand(1, 10) === 1) ? rand(5000, 20000) : 0;
            $totalAmount = max(0, $subtotal + $tax - $discount);
            $paidAmount = $totalAmount + ((rand(0, 1) === 1) ? rand(0, 50000) : 0);
            $changeAmount = $paidAmount - $totalAmount;

            $saleId = DB::table('sales')->insertGetId([
                'invoice_number' => 'INV-' . $createdAt->format('Ymd') . '-' . str_pad($i, 6, '0', STR_PAD_LEFT) . '-' . Str::random(4),
                'member_id' => $memberId,
                'branch_id' => $branch->id,
                'payment_method' => $paymentMethod,
                'subtotal' => $subtotal,
                'tax' => $tax,
                'discount' => $discount,
                'total_amount' => $totalAmount,
                'paid_amount' => $paidAmount,
                'change_amount' => $changeAmount,
                'payment_status' => 'paid',
                'cashier_id' => $cashier?->id,
                'created_at' => $createdAt->toDateTimeString(),
                'updated_at' => $createdAt->toDateTimeString(),
            ]);

            foreach ($chosenProducts as &$cp) {
                $cp['sale_id'] = $saleId;
                $cp['created_at'] = $createdAt->toDateTimeString();
                $cp['updated_at'] = $createdAt->toDateTimeString();
                $saleItemsBatch[] = $cp;
            }

            if (count($saleItemsBatch) >= 1000) {
                DB::table('sale_items')->insert($saleItemsBatch);
                $saleItemsBatch = [];
            }
        }

        if (!empty($saleItemsBatch)) {
            DB::table('sale_items')->insert($saleItemsBatch);
        }

        // 2. Generate 2,000 Membership Transactions & Subscriptions
        $txnBatch = [];

        for ($i = 1; $i <= 2000; $i++) {
            $randomSecs = rand(0, $totalSeconds);
            $createdAt = $startDate->copy()->addSeconds($randomSecs);

            $memberId = !empty($memberIds) ? $memberIds[array_rand($memberIds)] : 1;
            $package = $packageItems[array_rand($packageItems)];
            $paymentMethod = $paymentMethods[array_rand($paymentMethods)];

            $startDateSub = $createdAt->copy()->toDateString();
            $endDateSub = $createdAt->copy()->addDays($package['duration_days'])->toDateString();

            $subId = DB::table('membership_subscriptions')->insertGetId([
                'member_id' => $memberId,
                'package_id' => $package['id'],
                'start_date' => $startDateSub,
                'end_date' => $endDateSub,
                'price_paid' => $package['price'],
                'status' => ($endDateSub >= now()->toDateString()) ? 'active' : 'expired',
                'created_at' => $createdAt->toDateTimeString(),
                'updated_at' => $createdAt->toDateTimeString(),
            ]);

            $txnBatch[] = [
                'subscription_id' => $subId,
                'member_id' => $memberId,
                'transaction_code' => 'TRX-MBR-' . $createdAt->format('Ymd') . '-' . str_pad($i, 6, '0', STR_PAD_LEFT) . '-' . Str::random(4),
                'payment_method' => $paymentMethod,
                'amount' => $package['price'],
                'status' => 'paid',
                'paid_at' => $createdAt->toDateTimeString(),
                'created_by' => $cashier?->id,
                'notes' => 'Pembayaran Paket ' . $package['name'],
                'created_at' => $createdAt->toDateTimeString(),
                'updated_at' => $createdAt->toDateTimeString(),
            ];

            if (count($txnBatch) >= 1000) {
                DB::table('membership_transactions')->insert($txnBatch);
                $txnBatch = [];
            }
        }

        if (!empty($txnBatch)) {
            DB::table('membership_transactions')->insert($txnBatch);
        }

        // 3. Generate 1,000 Attendance Check-In Logs
        $attendanceBatch = [];
        for ($i = 1; $i <= 1000; $i++) {
            $randomSecs = rand(0, $totalSeconds);
            $checkInTime = $startDate->copy()->addSeconds($randomSecs);
            $checkOutTime = (rand(1, 10) <= 8) ? $checkInTime->copy()->addMinutes(rand(45, 120)) : null;

            $memberId = !empty($memberIds) ? $memberIds[array_rand($memberIds)] : 1;

            $attendanceBatch[] = [
                'member_id' => $memberId,
                'branch_id' => $branch->id,
                'check_in_time' => $checkInTime->toDateTimeString(),
                'check_out_time' => $checkOutTime?->toDateTimeString(),
                'check_in_method' => (rand(1, 2) === 1) ? 'qr' : 'manual',
                'status' => $checkOutTime ? 'checked_out' : 'checked_in',
                'created_by' => $cashier?->id,
                'created_at' => $checkInTime->toDateTimeString(),
                'updated_at' => $checkInTime->toDateTimeString(),
            ];

            if (count($attendanceBatch) >= 1000) {
                DB::table('attendances')->insert($attendanceBatch);
                $attendanceBatch = [];
            }
        }

        if (!empty($attendanceBatch)) {
            DB::table('attendances')->insert($attendanceBatch);
        }

        DB::statement('PRAGMA foreign_keys = ON;');
    }
}

<?php

namespace Database\Seeders;

use App\Models\Attendance;
use App\Models\Branch;
use App\Models\Member;
use App\Models\MemberQrCode;
use App\Models\MembershipPackage;
use App\Models\MembershipSubscription;
use App\Models\MembershipTransaction;
use App\Models\Product;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class RealWorldTestSeeder extends Seeder
{
    public function run(): void
    {
        $branch = Branch::first() ?? Branch::create([
            'name' => 'Trakin Fitness Center Main',
            'code' => 'TRK-01',
            'address' => 'Jl. Sudirman No. 88, Jakarta Selatan',
            'phone' => '021-5551234',
            'email' => 'info@trakingym.id',
            'status' => 'active',
        ]);

        $frontdesk = User::whereHas('roles', fn($q) => $q->where('name', 'Front Desk'))->first() ?? User::first();
        $packages = MembershipPackage::all();
        $products = Product::all();

        if ($packages->isEmpty() || $products->isEmpty()) {
            return;
        }

        $firstNames = ['Ahmad', 'Budi', 'Chandra', 'Denny', 'Eko', 'Fajar', 'Gilang', 'Hendy', 'Irfan', 'Joko', 'Kevin', 'Lukman', 'Mahendra', 'Niko', 'Oktavian', 'Pratama', 'Rahmat', 'Surya', 'Taufik', 'Utama', 'Vicky', 'Wahyu', 'Yudi', 'Zainal', 'Amanda', 'Bella', 'Citra', 'Dewi', 'Eka', 'Fitri', 'Gita', 'Hani', 'Indah', 'Jessica', 'Kartika', 'Laras', 'Maya', 'Nia', 'Olivia', 'Putri', 'Rina', 'Siti', 'Tania', 'Utami', 'Vina', 'Wulan', 'Yulia'];
        $lastNames = ['Santoso', 'Wijaya', 'Saputra', 'Kusuma', 'Hidayat', 'Nugroho', 'Prasetyo', 'Ramadhan', 'Setiawan', 'Utomo', 'Lestari', 'Wibowo', 'Pratiwi', 'Purnama', 'Gunawan', 'Herman', 'Suryani', 'Mulyadi', 'Firmansyah', 'Sujono'];
        $genders = ['male', 'female'];
        $paymentMethods = ['cash', 'qris', 'debit'];

        $lastMemberId = Member::max('id') ?? 10;

        // Generate 100 Realistic Members
        for ($i = 1; $i <= 100; $i++) {
            $num = $lastMemberId + $i + 1000;
            $code = 'MBR-' . $num;
            $fn = $firstNames[array_rand($firstNames)];
            $ln = $lastNames[array_rand($lastNames)];
            $fullName = "{$fn} {$ln}";
            $gender = $genders[array_rand($genders)];
            $phone = '081' . rand(10000000, 99999999);
            $email = strtolower($fn) . '.' . strtolower($ln) . rand(100, 999) . '@example.com';

            $status = (rand(1, 10) <= 8) ? 'active' : ((rand(1, 2) === 1) ? 'frozen' : 'inactive');

            $member = Member::create([
                'branch_id' => $branch->id,
                'member_code' => $code,
                'full_name' => $fullName,
                'email' => $email,
                'phone' => $phone,
                'gender' => $gender,
                'date_of_birth' => Carbon::now()->subYears(rand(18, 45))->subDays(rand(1, 360))->toDateString(),
                'address' => 'Jl. Kebayoran Baru No. ' . rand(1, 150) . ', Jakarta',
                'emergency_contact_name' => 'Keluarga ' . $fn,
                'emergency_contact_phone' => '081' . rand(10000000, 99999999),
                'status' => $status,
            ]);

            // Create QR Code Token
            MemberQrCode::create([
                'member_id' => $member->id,
                'qr_token' => 'TRK-QR-' . $code,
                'expires_at' => Carbon::now()->addDays(rand(30, 365)),
            ]);

            // Assign Membership Subscription & Transaction
            $pkg = $packages->random();
            $daysAgo = rand(1, 60);
            $startDate = Carbon::now()->subDays($daysAgo);
            $endDate = (clone $startDate)->addDays($pkg->duration_days);

            $subStatus = ($endDate->isFuture() && $status !== 'inactive') ? 'active' : 'expired';

            $sub = MembershipSubscription::create([
                'member_id' => $member->id,
                'package_id' => $pkg->id,
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'price_paid' => $pkg->price,
                'status' => $subStatus,
            ]);

            $payMethod = $paymentMethods[array_rand($paymentMethods)];

            MembershipTransaction::create([
                'subscription_id' => $sub->id,
                'member_id' => $member->id,
                'transaction_code' => 'TX-' . $code . '-' . rand(100, 999),
                'payment_method' => $payMethod,
                'amount' => $pkg->price,
                'status' => 'paid',
                'paid_at' => $startDate,
                'created_by' => $frontdesk->id ?? 1,
                'notes' => "Pembelian paket {$pkg->name}",
            ]);

            // Generate Attendances for active members in the last 7 days
            if ($subStatus === 'active') {
                $checkInCount = rand(2, 6);
                for ($a = 0; $a < $checkInCount; $a++) {
                    $attDate = Carbon::now()->subDays(rand(0, 6))->setHour(rand(6, 20))->setMinute(rand(0, 59));
                    Attendance::create([
                        'member_id' => $member->id,
                        'branch_id' => $branch->id,
                        'check_in_time' => $attDate,
                        'check_out_time' => (clone $attDate)->addMinutes(rand(45, 120)),
                        'check_in_method' => (rand(1, 2) === 1) ? 'qr' : 'manual',
                        'status' => 'checked_out',
                        'created_by' => $frontdesk->id ?? 1,
                    ]);
                }
            }

            // Generate POS Sales Transactions
            if (rand(1, 2) === 1) {
                $saleDate = Carbon::now()->subDays(rand(0, 14))->setHour(rand(8, 21));
                $p1 = $products->random();
                $qty1 = rand(1, 3);
                $subt = $p1->price * $qty1;
                $tax = round($subt * 0.11);
                $tot = $subt + $tax;

                $sale = Sale::create([
                    'branch_id' => $branch->id,
                    'member_id' => $member->id,
                    'invoice_number' => 'INV-' . $saleDate->timestamp . rand(100, 999) . '-' . $i,
                    'subtotal' => $subt,
                    'discount' => 0,
                    'tax' => $tax,
                    'total_amount' => $tot,
                    'paid_amount' => $tot + rand(0, 50000),
                    'change_amount' => 0,
                    'payment_method' => $payMethod,
                    'payment_status' => 'paid',
                    'cashier_id' => $frontdesk->id ?? 1,
                    'created_at' => $saleDate,
                ]);

                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_id' => $p1->id,
                    'quantity' => $qty1,
                    'unit_price' => $p1->price,
                    'subtotal' => $subt,
                ]);
            }
        }
    }
}

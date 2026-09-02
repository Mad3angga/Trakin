<?php

namespace Database\Seeders;

use App\Models\Branch;
use App\Models\ClassRegistration;
use App\Models\ClassSchedule;
use App\Models\GymClass;
use App\Models\Member;
use App\Models\MemberQrCode;
use App\Models\MembershipPackage;
use App\Models\MembershipSubscription;
use App\Models\MembershipTransaction;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\PtPackage;
use App\Models\Setting;
use App\Models\Trainer;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Roles
        $roles = ['Owner', 'Manager', 'Sales', 'Trainer', 'Front Desk', 'Member'];
        foreach ($roles as $roleName) {
            Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
        }

        // 2. Branch
        $branch = Branch::create([
            'name' => 'Trakin Fitness Center Main',
            'code' => 'TRK-01',
            'address' => 'Jl. Sudirman No. 88, Jakarta Selatan',
            'phone' => '021-5551234',
            'email' => 'info@trakingym.id',
            'status' => 'active',
        ]);

        // 3. Settings
        Setting::create(['key' => 'gym_name', 'value' => 'Trakin Fitness Center', 'group' => 'general']);
        Setting::create(['key' => 'gym_tagline', 'value' => 'Transform Your Power & Health', 'group' => 'general']);
        Setting::create(['key' => 'gym_address', 'value' => 'Jl. Sudirman No. 88, Jakarta Selatan', 'group' => 'general']);
        Setting::create(['key' => 'gym_phone', 'value' => '021-5551234', 'group' => 'general']);
        Setting::create(['key' => 'gym_email', 'value' => 'info@trakingym.id', 'group' => 'general']);
        Setting::create(['key' => 'gym_latitude', 'value' => '-6.2088', 'group' => 'gym_location']);
        Setting::create(['key' => 'gym_longitude', 'value' => '106.8456', 'group' => 'gym_location']);
        Setting::create(['key' => 'currency_symbol', 'value' => 'Rp', 'group' => 'finance']);
        Setting::create(['key' => 'tax_percentage', 'value' => '11', 'group' => 'finance']);

        // 4. Core Users
        $owner = User::create([
            'name' => 'Owner Admin',
            'email' => 'owner@trakin.com',
            'password' => Hash::make('password'),
            'branch_id' => $branch->id,
            'phone' => '081234567890',
            'status' => 'active',
        ]);
        $owner->assignRole('Owner');

        $manager = User::create([
            'name' => 'General Manager',
            'email' => 'manager@trakin.com',
            'password' => Hash::make('password'),
            'branch_id' => $branch->id,
            'phone' => '081234567891',
            'status' => 'active',
        ]);
        $manager->assignRole('Manager');

        $frontdesk = User::create([
            'name' => 'Rina Cashier',
            'email' => 'frontdesk@trakin.com',
            'password' => Hash::make('password'),
            'branch_id' => $branch->id,
            'phone' => '081234567892',
            'status' => 'active',
        ]);
        $frontdesk->assignRole('Front Desk');

        $sales = User::create([
            'name' => 'Budi Sales Executive',
            'email' => 'sales@trakin.com',
            'password' => Hash::make('password'),
            'branch_id' => $branch->id,
            'phone' => '081234567895',
            'status' => 'active',
        ]);
        $sales->assignRole('Sales');

        // 5. Trainer Users & Trainer Records
        $trainerUser1 = User::create([
            'name' => 'Coach Alex Rivers',
            'email' => 'alex@trakin.com',
            'password' => Hash::make('password'),
            'branch_id' => $branch->id,
            'phone' => '081234567893',
            'status' => 'active',
        ]);
        $trainerUser1->assignRole('Trainer');

        $trainer1 = Trainer::create([
            'user_id' => $trainerUser1->id,
            'branch_id' => $branch->id,
            'trainer_code' => 'TR-001',
            'full_name' => 'Alex Rivers',
            'email' => 'alex@trakin.com',
            'phone' => '081234567893',
            'specialization' => 'Bodybuilding & Strength Conditioning',
            'bio' => 'Certified IFBB Pro Trainer with 8+ years experience.',
            'status' => 'active',
        ]);

        $trainerUser2 = User::create([
            'name' => 'Coach Sarah Jenkins',
            'email' => 'sarah@trakin.com',
            'password' => Hash::make('password'),
            'branch_id' => $branch->id,
            'phone' => '081234567894',
            'status' => 'active',
        ]);
        $trainerUser2->assignRole('Trainer');

        $trainer2 = Trainer::create([
            'user_id' => $trainerUser2->id,
            'branch_id' => $branch->id,
            'trainer_code' => 'TR-002',
            'full_name' => 'Sarah Jenkins',
            'email' => 'sarah@trakin.com',
            'phone' => '081234567894',
            'specialization' => 'HIIT, Pilates & Weight Loss',
            'bio' => 'Passionate fitness enthusiast specializing in high-energy group workouts.',
            'status' => 'active',
        ]);

        // 6. Membership Packages
        $pkgBronze = MembershipPackage::create([
            'branch_id' => $branch->id,
            'name' => 'Bronze Monthly Pass',
            'description' => 'Akses penuh seluruh area gym selama 1 Bulan.',
            'duration_days' => 30,
            'price' => 350000,
            'registration_fee' => 50000,
            'status' => 'active',
        ]);

        $pkgSilver = MembershipPackage::create([
            'branch_id' => $branch->id,
            'name' => 'Silver Quarterly Pass',
            'description' => 'Akses 3 Bulan + Gratis 1x Konsultasi Nutrisi.',
            'duration_days' => 90,
            'price' => 950000,
            'registration_fee' => 0,
            'status' => 'active',
        ]);

        $pkgGold = MembershipPackage::create([
            'branch_id' => $branch->id,
            'name' => 'Gold Annual VIP Pass',
            'description' => 'Akses VIP 1 Tahun + Gratis Loker & Handuk Gym.',
            'duration_days' => 365,
            'price' => 3200000,
            'registration_fee' => 0,
            'status' => 'active',
        ]);

        // 7. Member User & Profile
        $memberUser = User::create([
            'name' => 'Budi Santoso',
            'email' => 'member@trakin.com',
            'password' => Hash::make('password'),
            'branch_id' => $branch->id,
            'phone' => '081999888777',
            'status' => 'active',
        ]);
        $memberUser->assignRole('Member');

        $member = Member::create([
            'user_id' => $memberUser->id,
            'branch_id' => $branch->id,
            'member_code' => 'MBR-1001',
            'full_name' => 'Budi Santoso',
            'email' => 'member@trakin.com',
            'phone' => '081999888777',
            'gender' => 'male',
            'date_of_birth' => '1995-05-15',
            'address' => 'Jl. Kebon Jeruk No. 12, Jakarta',
            'emergency_contact_name' => 'Siti (Istri)',
            'emergency_contact_phone' => '081999888700',
            'status' => 'active',
        ]);

        MemberQrCode::create([
            'member_id' => $member->id,
            'qr_token' => 'TRK-QR-MBR-1001',
            'expires_at' => now()->addDays(365),
        ]);

        $sub = MembershipSubscription::create([
            'member_id' => $member->id,
            'package_id' => $pkgGold->id,
            'start_date' => now()->toDateString(),
            'end_date' => now()->addDays(365)->toDateString(),
            'price_paid' => 3200000,
            'status' => 'active',
        ]);

        MembershipTransaction::create([
            'subscription_id' => $sub->id,
            'member_id' => $member->id,
            'transaction_code' => 'TX-MBR-1001-01',
            'payment_method' => 'qris',
            'amount' => 3200000,
            'status' => 'paid',
            'paid_at' => now(),
            'created_by' => $frontdesk->id,
            'notes' => 'Registrasi Paket Gold VIP Pass 1 Tahun',
        ]);

        // Sample Member 2
        $member2 = Member::create([
            'branch_id' => $branch->id,
            'member_code' => 'MBR-1002',
            'full_name' => 'Dewi Lestari',
            'email' => 'dewi@example.com',
            'phone' => '081888777666',
            'gender' => 'female',
            'date_of_birth' => '1998-11-20',
            'address' => 'Jl. Kemang Raya No. 45, Jakarta',
            'status' => 'active',
        ]);

        MemberQrCode::create([
            'member_id' => $member2->id,
            'qr_token' => 'TRK-QR-MBR-1002',
            'expires_at' => now()->addDays(30),
        ]);

        MembershipSubscription::create([
            'member_id' => $member2->id,
            'package_id' => $pkgBronze->id,
            'start_date' => now()->toDateString(),
            'end_date' => now()->addDays(30)->toDateString(),
            'price_paid' => 400000,
            'status' => 'active',
        ]);

        // 8. Gym Classes & Schedules
        $classHiit = GymClass::create([
            'name' => 'Morning HIIT Blast',
            'description' => 'Latihan kardio intensitas tinggi pembakar kalori maksimal.',
            'category' => 'Cardio',
            'capacity' => 15,
            'duration_minutes' => 45,
            'status' => 'active',
        ]);

        $classPower = GymClass::create([
            'name' => 'Powerlifting & Strength',
            'description' => 'Teknik dasar Squat, Bench Press, & Deadlift untuk kekuatan.',
            'category' => 'Strength',
            'capacity' => 10,
            'duration_minutes' => 60,
            'status' => 'active',
        ]);

        $schedule1 = ClassSchedule::create([
            'class_id' => $classHiit->id,
            'branch_id' => $branch->id,
            'trainer_id' => $trainer2->id,
            'start_time' => now()->addHours(2)->toDateTimeString(),
            'end_time' => now()->addHours(3)->toDateTimeString(),
            'room' => 'Studio A',
            'max_capacity' => 15,
            'status' => 'scheduled',
        ]);

        ClassRegistration::create([
            'class_schedule_id' => $schedule1->id,
            'member_id' => $member->id,
            'status' => 'registered',
        ]);

        // 9. POS Categories & Products
        $catSupp = ProductCategory::create(['name' => 'Supplements', 'slug' => 'supplements', 'description' => 'Whey protein, Creatine, Pre-workout']);
        $catBev = ProductCategory::create(['name' => 'Beverages', 'slug' => 'beverages', 'description' => 'Air mineral, Isotonic, Protein Shake']);
        $catGear = ProductCategory::create(['name' => 'Gym Gear', 'slug' => 'gym-gear', 'description' => 'Handuk, Shaker, Straps']);

        Product::create([
            'category_id' => $catSupp->id,
            'barcode' => '8991001001',
            'name' => 'Optimum Nutrition Gold Whey 2lbs',
            'sku' => 'SUP-WHEY-01',
            'price' => 480000,
            'cost_price' => 400000,
            'stock' => 20,
            'min_stock' => 5,
            'unit' => 'botol',
            'status' => 'active',
        ]);

        Product::create([
            'category_id' => $catSupp->id,
            'barcode' => '8991001002',
            'name' => 'Creatine Monohydrate 300g',
            'sku' => 'SUP-CREA-01',
            'price' => 250000,
            'cost_price' => 190000,
            'stock' => 12,
            'min_stock' => 3,
            'unit' => 'botol',
            'status' => 'active',
        ]);

        Product::create([
            'category_id' => $catBev->id,
            'barcode' => '8991001003',
            'name' => 'Pocari Sweat 500ml',
            'sku' => 'BEV-POCARI',
            'price' => 12000,
            'cost_price' => 8000,
            'stock' => 45,
            'min_stock' => 10,
            'unit' => 'pcs',
            'status' => 'active',
        ]);

        Product::create([
            'category_id' => $catBev->id,
            'barcode' => '8991001004',
            'name' => 'Le Minerale 600ml',
            'sku' => 'BEV-WATER',
            'price' => 6000,
            'cost_price' => 3500,
            'stock' => 80,
            'min_stock' => 20,
            'unit' => 'pcs',
            'status' => 'active',
        ]);

        Product::create([
            'category_id' => $catGear->id,
            'barcode' => '8991001005',
            'name' => 'Trakin Microfiber Gym Towel',
            'sku' => 'GEAR-TOWEL',
            'price' => 65000,
            'cost_price' => 35000,
            'stock' => 25,
            'min_stock' => 5,
            'unit' => 'pcs',
            'status' => 'active',
        ]);

        Product::create([
            'category_id' => $catGear->id,
            'barcode' => '8991001006',
            'name' => 'Stainless Shaker Bottle 750ml',
            'sku' => 'GEAR-SHAKER',
            'price' => 95000,
            'cost_price' => 60000,
            'stock' => 4, // low stock alert testing
            'min_stock' => 5,
            'unit' => 'pcs',
            'status' => 'active',
        ]);

        // 10. PT Package
        PtPackage::create([
            'name' => '10 Sessions Personal Training',
            'total_sessions' => 10,
            'price' => 1500000,
            'validity_days' => 45,
            'status' => 'active',
        ]);
    }
}

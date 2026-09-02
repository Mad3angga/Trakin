<?php

namespace App\Http\Controllers;

use App\Models\Member;
use App\Models\MemberQrCode;
use App\Models\MembershipPackage;
use App\Models\MembershipSubscription;
use App\Models\MembershipTransaction;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\PtPackage;
use App\Models\PtSession;
use App\Models\PtSubscription;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Setting;
use App\Models\StockMovement;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;

class POSController extends Controller
{
    private function getReceiptSettings()
    {
        $defaults = [
            'pos_receipt_gym_name' => 'Trakin Fitness Gym',
            'pos_receipt_address' => 'Jl. Fitness No. 8, Pusat Kota',
            'pos_receipt_phone' => '0812-3456-7890',
            'pos_receipt_footer_title' => 'TERIMA KASIH',
            'pos_receipt_footer_note' => 'Selamat Berolahraga & Stay Fit!',
            'pos_receipt_show_tax' => '1',
        ];

        $settings = Setting::where('group', 'pos_receipt')->pluck('value', 'key')->toArray();

        return array_merge($defaults, $settings);
    }

    public function index(Request $request)
    {
        $products = Product::with('category')
            ->where('status', 'active')
            ->get();

        $categories = ProductCategory::all();
        $members = Member::select('id', 'member_code', 'full_name', 'phone')->get();
        $packages = MembershipPackage::where('status', 'active')->get();
        $ptPackages = PtPackage::where('status', 'active')->get();
        $salesStaff = User::whereDoesntHave('roles', function ($query) {
            $query->where('name', 'Member');
        })->select('id', 'name')->orderBy('name', 'asc')->get();

        $bookingToken = $request->query('pt_booking_token');
        $pendingPtBooking = $bookingToken ? Cache::get($bookingToken) : null;

        return Inertia::render('Admin/POS/Index', [
            'products' => $products,
            'categories' => $categories,
            'members' => $members,
            'packages' => $packages,
            'ptPackages' => $ptPackages,
            'salesStaff' => $salesStaff,
            'receiptSettings' => $this->getReceiptSettings(),
            'selectedMemberId' => $request->query('member_id'),
            'selectedPackageId' => $request->query('package_id'),
            'selectedPtPackageId' => $request->query('pt_package_id'),
            'selectedPtSubscriptionId' => $request->query('pt_subscription_id'),
            'selectedPtBookingToken' => $bookingToken,
            'pendingPtBooking' => $pendingPtBooking,
            'selectedSoldById' => $request->query('sold_by_id'),
        ]);
    }

    public function receiptSettings()
    {
        if (!auth()->user()?->hasAnyRole(['Owner', 'Manager'])) {
            abort(403, 'Hanya Owner & Manager yang dapat mengelola Receipt.');
        }
        return Inertia::render('Admin/POS/Settings', [
            'receiptSettings' => $this->getReceiptSettings(),
        ]);
    }

    public function updateReceiptSettings(Request $request)
    {
        if (!auth()->user()?->hasAnyRole(['Owner', 'Manager'])) {
            abort(403, 'Hanya Owner & Manager yang dapat mengelola Receipt.');
        }
        $validated = $request->validate([
            'pos_receipt_gym_name' => 'required|string|max:255',
            'pos_receipt_address' => 'required|string|max:255',
            'pos_receipt_phone' => 'required|string|max:100',
            'pos_receipt_footer_title' => 'required|string|max:255',
            'pos_receipt_footer_note' => 'required|string|max:255',
            'pos_receipt_show_tax' => 'nullable|string',
        ]);

        foreach ($validated as $key => $value) {
            Setting::updateOrCreate(['key' => $key], ['value' => $value ?? '']);
        }

        return back()->with('success', 'Pengaturan Struk Kasir POS berhasil diperbarui!');
    }

    public function registerMember(Request $request)
    {
        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'phone' => 'required|string|max:50',
            'email' => 'nullable|email|max:255|unique:users,email',
            'gender' => 'required|in:male,female',
            'package_id' => 'required|exists:membership_packages,id',
            'sold_by_id' => 'nullable|exists:users,id',
            'password' => 'nullable|string|min:8',
        ]);

        $branchId = auth()->user()?->branch_id ?? \App\Models\Branch::first()?->id;
        $memberPassword = $validated['password'] ?? Str::random(12);

        $memberData = DB::transaction(function () use ($validated, $branchId, $memberPassword) {
            do {
                $memberCode = 'MBR-' . str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            } while (Member::where('member_code', $memberCode)->exists());
            $userEmail = !empty($validated['email']) ? $validated['email'] : strtolower($memberCode) . '@trakin.local';

            $user = User::create([
                'name' => $validated['full_name'],
                'email' => $userEmail,
                'password' => Hash::make($memberPassword),
                'branch_id' => $branchId,
                'phone' => $validated['phone'],
                'status' => 'active',
            ]);
            $user->syncRoles(['Member']);
            app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

            $member = Member::create([
                'user_id' => $user->id,
                'branch_id' => $branchId,
                'member_code' => $memberCode,
                'full_name' => $validated['full_name'],
                'email' => $validated['email'] ?? null,
                'phone' => $validated['phone'],
                'gender' => $validated['gender'],
                'status' => 'active',
            ]);

            MemberQrCode::create([
                'member_id' => $member->id,
                'qr_token' => 'TRK-QR-' . $memberCode,
                'expires_at' => now()->addDays(365),
            ]);

            $package = MembershipPackage::findOrFail($validated['package_id']);

            return [
                'member' => [
                    'id' => $member->id,
                    'member_code' => $member->member_code,
                    'full_name' => $member->full_name,
                    'phone' => $member->phone,
                ],
                'package' => [
                    'id' => $package->id,
                    'name' => $package->name,
                    'price' => (float) $package->price,
                    'duration_days' => $package->duration_days,
                ],
                'sold_by_id' => $validated['sold_by_id'] ?? null,
            ];
        });

        return response()->json([
            'success' => true,
            'message' => "Member {$memberData['member']['full_name']} ({$memberData['member']['member_code']}) berhasil terdaftar!",
            'member' => $memberData['member'],
            'package' => $memberData['package'],
            'sold_by_id' => $memberData['sold_by_id'],
        ]);
    }

    public function checkout(Request $request)
    {
        $validated = $request->validate([
            'member_id' => 'nullable|exists:members,id',
            'sold_by_id' => 'nullable|exists:users,id',
            'payment_method' => 'required|string',
            'cart' => 'required|array|min:1',
            'cart.*.item_type' => 'nullable|string|in:product,package,pt_package',
            'cart.*.product_id' => 'nullable|exists:products,id',
            'cart.*.package_id' => 'nullable|exists:membership_packages,id',
            'cart.*.pt_package_id' => 'nullable|exists:pt_packages,id',
            'cart.*.pt_subscription_id' => 'nullable|exists:pt_subscriptions,id',
            'cart.*.pt_booking_token' => 'nullable|string',
            'cart.*.booking_data' => 'nullable|array',
            'cart.*.quantity' => 'required|integer|min:1',
            'paid_amount' => 'required|numeric|min:0',
            'discount' => 'nullable|numeric|min:0',
            'tax' => 'nullable|numeric|min:0',
        ]);

        $sale = DB::transaction(function () use ($validated) {
            $subtotal = 0;
            $itemsData = [];

            foreach ($validated['cart'] as $item) {
                $itemType = $item['item_type'] ?? 'product';

                if ($itemType === 'package' || !empty($item['package_id'])) {
                    $pkg = MembershipPackage::findOrFail($item['package_id']);
                    $itemSubtotal = $pkg->price * $item['quantity'];
                    $subtotal += $itemSubtotal;

                    $itemsData[] = [
                        'item_type' => 'package',
                        'package' => $pkg,
                        'pt_package' => null,
                        'pt_subscription_id' => null,
                        'pt_booking_token' => null,
                        'booking_data' => null,
                        'product' => null,
                        'name' => 'Paket Gym: ' . $pkg->name,
                        'quantity' => $item['quantity'],
                        'unit_price' => $pkg->price,
                        'subtotal' => $itemSubtotal,
                    ];
                } elseif ($itemType === 'pt_package' || !empty($item['pt_package_id'])) {
                    $ptPkg = PtPackage::findOrFail($item['pt_package_id']);
                    $itemSubtotal = $ptPkg->price * $item['quantity'];
                    $subtotal += $itemSubtotal;

                    $itemsData[] = [
                        'item_type' => 'pt_package',
                        'package' => null,
                        'pt_package' => $ptPkg,
                        'pt_subscription_id' => $item['pt_subscription_id'] ?? null,
                        'pt_booking_token' => $item['pt_booking_token'] ?? null,
                        'booking_data' => $item['booking_data'] ?? null,
                        'product' => null,
                        'name' => 'Sesi Personal Trainer: ' . $ptPkg->name,
                        'quantity' => $item['quantity'],
                        'unit_price' => $ptPkg->price,
                        'subtotal' => $itemSubtotal,
                    ];
                } else {
                    $product = Product::findOrFail($item['product_id']);

                    if ($product->stock < $item['quantity']) {
                        throw new \Exception("Stok produk {$product->name} tidak mencukupi (sisa: {$product->stock}).");
                    }

                    $itemSubtotal = $product->price * $item['quantity'];
                    $subtotal += $itemSubtotal;

                    $itemsData[] = [
                        'item_type' => 'product',
                        'package' => null,
                        'pt_package' => null,
                        'pt_subscription_id' => null,
                        'pt_booking_token' => null,
                        'booking_data' => null,
                        'product' => $product,
                        'name' => $product->name,
                        'quantity' => $item['quantity'],
                        'unit_price' => $product->price,
                        'subtotal' => $itemSubtotal,
                    ];
                }
            }

            $discount = (float) ($validated['discount'] ?? 0);
            // Cap discount to 30% of subtotal to prevent free-order abuse; also never exceed subtotal
            $maxDiscount = (float) round($subtotal * 0.30);
            if ($discount > $maxDiscount) {
                throw new \Illuminate\Validation\ValidationException(
                    validator([], []),
                    response()->json(['message' => 'Discount melebihi batas maksimal 30% dari subtotal (max Rp '.number_format($maxDiscount,0,',','.').')'], 422)
                );
            }
            if ($discount > $subtotal) {
                $discount = $subtotal;
            }
            // paid_amount must cover total; prevent negative change trick
            $taxableSubtotal = 0;
            foreach ($itemsData as $data) {
                if ($data['item_type'] === 'product') {
                    $taxableSubtotal += $data['subtotal'];
                }
            }

            $receiptSettings = $this->getReceiptSettings();
            $showTaxSetting = ($receiptSettings['pos_receipt_show_tax'] ?? '1') !== '0';
            $tax = $showTaxSetting ? (float) round($taxableSubtotal * 0.11) : 0;

            $totalAmount = max(0, $subtotal + $tax - $discount);
            if ((float) $validated['paid_amount'] < $totalAmount) {
                throw new \Exception('Paid amount kurang dari total tagihan (butuh Rp '.number_format($totalAmount,0,',','.').')');
            }
            $changeAmount = (float) $validated['paid_amount'] - $totalAmount;

            do {
                $invoiceNumber = 'INV-' . date('Ymd') . '-' . str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            } while (Sale::where('invoice_number', $invoiceNumber)->exists());

            $sale = Sale::create([
                'invoice_number' => $invoiceNumber,
                'member_id' => $validated['member_id'] ?? null,
                'sold_by_id' => $validated['sold_by_id'] ?? null,
                'branch_id' => auth()->user()?->branch_id,
                'payment_method' => $validated['payment_method'],
                'subtotal' => $subtotal,
                'tax' => $tax,
                'discount' => $discount,
                'total_amount' => $totalAmount,
                'paid_amount' => $validated['paid_amount'],
                'change_amount' => $changeAmount,
                'payment_status' => 'paid',
                'cashier_id' => auth()->id(),
            ]);

            $packageSystemProduct = Product::firstOrCreate(
                ['sku' => 'PKG-GYM'],
                ['name' => 'Paket Membership Gym', 'price' => 0, 'stock' => 999999, 'status' => 'active']
            );

            $ptSystemProduct = Product::firstOrCreate(
                ['sku' => 'PKG-PT'],
                ['name' => 'Paket Sesi Personal Trainer', 'price' => 0, 'stock' => 999999, 'status' => 'active']
            );

            foreach ($itemsData as $data) {
                if ($data['item_type'] === 'package') {
                    SaleItem::create([
                        'sale_id' => $sale->id,
                        'product_id' => $packageSystemProduct->id,
                        'quantity' => $data['quantity'],
                        'unit_price' => $data['unit_price'],
                        'subtotal' => $data['subtotal'],
                    ]);

                    if (!empty($validated['member_id'])) {
                        $pkg = $data['package'];
                        $startDate = now();
                        $endDate = (clone $startDate)->addDays($pkg->duration_days);

                        $subscription = MembershipSubscription::create([
                            'member_id' => $validated['member_id'],
                            'package_id' => $pkg->id,
                            'start_date' => $startDate->toDateString(),
                            'end_date' => $endDate->toDateString(),
                            'status' => 'active',
                            'price_paid' => $pkg->price,
                            'sold_by_id' => $validated['sold_by_id'] ?? null,
                        ]);

                        MembershipTransaction::create([
                            'subscription_id' => $subscription->id,
                            'member_id' => $validated['member_id'],
                            'amount' => $data['subtotal'],
                            'payment_method' => $validated['payment_method'],
                            'status' => 'paid',
                            'transaction_code' => 'TX-POS-' . time() . '-' . rand(100, 999),
                            'paid_at' => now(),
                            'created_by' => auth()->id(),
                            'notes' => 'Pembelian POS Paket Membership: ' . $pkg->name,
                        ]);
                    }
                } elseif ($data['item_type'] === 'pt_package') {
                    SaleItem::create([
                        'sale_id' => $sale->id,
                        'product_id' => $ptSystemProduct->id,
                        'quantity' => $data['quantity'],
                        'unit_price' => $data['unit_price'],
                        'subtotal' => $data['subtotal'],
                    ]);

                    $bookingData = null;
                    if (!empty($data['pt_booking_token'])) {
                        $bookingData = Cache::get($data['pt_booking_token']);
                    }
                    if (!$bookingData && !empty($data['booking_data'])) {
                        $bookingData = $data['booking_data'];
                    }

                    if ($bookingData && !empty($bookingData['sessions'])) {
                        $member1 = Member::find($bookingData['member_id'] ?? $validated['member_id']);
                        $member2 = !empty($bookingData['secondary_member_id']) ? Member::find($bookingData['secondary_member_id']) : null;

                        $notesText = $bookingData['notes'] ?? 'Sesi Latihan Personal Trainer';
                        if ($member2 && $member1) {
                            $notesText = 'Semi-Private PT (Berdua: ' . $member1->full_name . ' & ' . $member2->full_name . ') - ' . $notesText;
                        }

                        if ($member1) {
                            $this->finalizePtBookingForMember(
                                $member1->id,
                                $bookingData['trainer_id'],
                                $bookingData['sessions'],
                                $bookingData['pt_package_id'] ?? $data['pt_package']->id,
                                $notesText,
                                $validated['payment_method'],
                                $validated['sold_by_id'] ?? $bookingData['sold_by_id'] ?? null,
                                $data['subtotal']
                            );
                        }

                        if ($member2) {
                            $this->finalizePtBookingForMember(
                                $member2->id,
                                $bookingData['trainer_id'],
                                $bookingData['sessions'],
                                $bookingData['pt_package_id'] ?? $data['pt_package']->id,
                                $notesText,
                                $validated['payment_method'],
                                $validated['sold_by_id'] ?? $bookingData['sold_by_id'] ?? null,
                                $data['subtotal']
                            );
                        }

                        if (!empty($bookingData['token'])) {
                            Cache::forget($bookingData['token']);
                        }
                    } elseif (!empty($data['pt_subscription_id'])) {
                        $ptSub = PtSubscription::find($data['pt_subscription_id']);
                        if ($ptSub) {
                            $ptSub->update([
                                'price_paid' => $data['subtotal'],
                                'payment_method' => $validated['payment_method'],
                                'payment_status' => 'paid',
                                'sold_by_id' => $validated['sold_by_id'] ?? $ptSub->sold_by_id,
                            ]);
                        }
                    } elseif (!empty($validated['member_id'])) {
                        $pkg = $data['pt_package'];
                        PtSubscription::create([
                            'member_id' => $validated['member_id'],
                            'trainer_id' => $validated['sold_by_id'] ?? Trainer::first()?->id ?? 1,
                            'pt_package_id' => $pkg->id,
                            'total_sessions' => $pkg->total_sessions,
                            'remaining_sessions' => $pkg->total_sessions,
                            'price_paid' => $data['subtotal'],
                            'payment_method' => $validated['payment_method'],
                            'payment_status' => 'paid',
                            'start_date' => now()->toDateString(),
                            'end_date' => now()->addDays($pkg->validity_days ?? 60)->toDateString(),
                            'status' => 'active',
                        ]);
                    }
                } else {
                    $product = $data['product'];

                    SaleItem::create([
                        'sale_id' => $sale->id,
                        'product_id' => $product->id,
                        'quantity' => $data['quantity'],
                        'unit_price' => $data['unit_price'],
                        'subtotal' => $data['subtotal'],
                    ]);

                    $product->decrement('stock', $data['quantity']);

                    StockMovement::create([
                        'product_id' => $product->id,
                        'branch_id' => auth()->user()?->branch_id,
                        'type' => 'out',
                        'quantity' => $data['quantity'],
                        'reference_type' => 'sale',
                        'reference_id' => $sale->id,
                        'notes' => 'Penjualan Kasir POS #' . $sale->invoice_number,
                        'created_by' => auth()->id(),
                    ]);
                }
            }

            return $sale;
        });

        return response()->json([
            'success' => true,
            'message' => 'Transaksi berhasil!',
            'sale' => $sale,
        ]);
    }

    private function finalizePtBookingForMember($memberId, $trainerId, array $sessions, $packageId, string $notesText, string $paymentMethod, $soldById, $pricePaid)
    {
        $sessionCount = count($sessions);
        $firstDate = $sessions[0]['date'] ?? now()->toDateString();
        $lastDate = end($sessions)['date'] ?? now()->toDateString();

        $package = $packageId ? PtPackage::find($packageId) : null;
        if (!$package) {
            $package = PtPackage::first() ?? PtPackage::create([
                'name' => 'Paket PT ' . $sessionCount . ' Sesi',
                'total_sessions' => $sessionCount,
                'price' => $pricePaid,
                'validity_days' => 60,
                'status' => 'active',
            ]);
        }

        $totalSess = max($package->total_sessions, $sessionCount);
        $remaining = max(0, $totalSess - $sessionCount);

        $subscription = PtSubscription::create([
            'member_id' => $memberId,
            'trainer_id' => $trainerId,
            'pt_package_id' => $package->id,
            'total_sessions' => $totalSess,
            'remaining_sessions' => $remaining,
            'price_paid' => (float) $pricePaid,
            'payment_method' => $paymentMethod,
            'payment_status' => 'paid',
            'start_date' => Carbon::parse($firstDate)->toDateString(),
            'end_date' => Carbon::parse($lastDate)->addDays(30)->toDateString(),
            'status' => 'active',
        ]);

        foreach ($sessions as $sess) {
            PtSession::create([
                'pt_subscription_id' => $subscription->id,
                'member_id' => $memberId,
                'trainer_id' => $trainerId,
                'session_date' => $sess['date'],
                'start_time' => $sess['start_time'],
                'end_time' => $sess['end_time'],
                'status' => 'scheduled',
                'notes' => $notesText,
            ]);
        }

        return $subscription;
    }
}

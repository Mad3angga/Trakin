<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\Member;
use App\Models\MemberQrCode;
use App\Models\MembershipPackage;
use App\Models\MembershipSubscription;
use App\Models\MembershipTransaction;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;

class MemberController extends Controller
{
    public function index(Request $request)
    {
        $query = Member::with(['branch', 'activeSubscription.package', 'qrCode', 'user']);

        if ($request->filled('search')) {
            $search = addcslashes($request->search, '%_\\');
            $query->where(function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                  ->orWhere('member_code', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $members = $query->latest()->paginate(10)->withQueryString();
        $packages = MembershipPackage::where('status', 'active')->get();
        $branches = Branch::where('status', 'active')->get();
        // Komisi penjualan: hanya staff yang boleh muncul, Member harus tidak pernah muncul
        $salesStaff = User::whereHas('roles', function ($query) {
            $query->whereIn('name', ['Owner', 'Manager', 'Sales', 'Front Desk', 'Trainer']);
        })->with('roles')->select('id', 'name')->orderBy('name', 'asc')->get()->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'role' => $user->getRoleNames()->first() ?? '-',
            ];
        });

        return Inertia::render('Admin/Members/Index', [
            'members' => $members,
            'packages' => $packages,
            'branches' => $branches,
            'salesStaff' => $salesStaff,
            'filters' => $request->only(['search', 'status']),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'email' => 'nullable|email|unique:members,email|unique:users,email',
            'phone' => 'required|string|max:30',
            'password' => 'nullable|string|min:8',
            'gender' => 'required|in:male,female',
            'date_of_birth' => 'nullable|date',
            'address' => 'nullable|string',
            'emergency_contact_name' => 'nullable|string|max:255',
            'emergency_contact_phone' => 'nullable|string|max:30',
            'branch_id' => 'nullable|exists:branches,id',
            'package_id' => 'nullable|exists:membership_packages,id',
            'sold_by_id' => 'nullable|exists:users,id',
        ]);

        // Branch isolation: non-Owner cannot spoof branch_id
        $branchId = auth()->user()?->branch_id ?? $validated['branch_id'] ?? Branch::first()?->id;
        if (!auth()->user()?->hasRole('Owner') && !empty($validated['branch_id']) && (int)$validated['branch_id'] !== (int)$branchId) {
            abort(403, 'Tidak boleh membuat member untuk cabang lain.');
        }
        // sold_by_id must belong to same branch if provided
        if (!empty($validated['sold_by_id'])) {
            $seller = User::find($validated['sold_by_id']);
            if ($seller && $seller->branch_id && $seller->branch_id !== $branchId) {
                abort(403, 'Sales staff tidak valid untuk cabang ini.');
            }
        }
        $memberPassword = !empty($validated['password']) ? $validated['password'] : Str::random(12);

        $member = DB::transaction(function () use ($validated, $memberPassword, $branchId) {
            do {
                $memberCode = 'MBR-' . str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            } while (Member::where('member_code', $memberCode)->exists());

            // User account for Member Portal access
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
                'date_of_birth' => $validated['date_of_birth'] ?? null,
                'address' => $validated['address'] ?? null,
                'emergency_contact_name' => $validated['emergency_contact_name'] ?? null,
                'emergency_contact_phone' => $validated['emergency_contact_phone'] ?? null,
                'status' => 'active',
            ]);

            // QR Code
            MemberQrCode::create([
                'member_id' => $member->id,
                'qr_token' => 'TRK-QR-' . $memberCode,
                'expires_at' => now()->addDays(365),
            ]);

            return $member;
        });

        $pkgParam = !empty($validated['package_id']) ? '&package_id=' . $validated['package_id'] : '';
        $soldParam = !empty($validated['sold_by_id']) ? '&sold_by_id=' . $validated['sold_by_id'] : '';

        return redirect('/pos?member_id=' . $member->id . $pkgParam . $soldParam)->with('success', "Member {$member->full_name} ({$member->member_code}) berhasil dibuat. Silahkan pilih metode pembayaran di POS.");
    }

    public function renew(Request $request, Member $member)
    {
        $validated = $request->validate([
            'package_id' => 'required|exists:membership_packages,id',
            'payment_method' => 'required|string',
        ]);

        DB::transaction(function () use ($validated, $member) {
            $package = MembershipPackage::findOrFail($validated['package_id']);

            $activeSub = $member->activeSubscription;
            $startDate = ($activeSub && $activeSub->end_date >= now()->toDateString())
                ? \Carbon\Carbon::parse($activeSub->end_date)->addDay()
                : now();

            $endDate = (clone $startDate)->addDays($package->duration_days);

            $subscription = MembershipSubscription::create([
                'member_id' => $member->id,
                'package_id' => $package->id,
                'start_date' => $startDate->toDateString(),
                'end_date' => $endDate->toDateString(),
                'price_paid' => $package->price,
                'status' => 'active',
            ]);

            $member->update(['status' => 'active']);

            MembershipTransaction::create([
                'subscription_id' => $subscription->id,
                'member_id' => $member->id,
                'transaction_code' => 'TX-RNW-' . $member->member_code . '-' . time(),
                'payment_method' => $validated['payment_method'],
                'amount' => $package->price,
                'status' => 'paid',
                'paid_at' => now(),
                'created_by' => auth()->id(),
                'notes' => 'Perpanjangan Membership: ' . $package->name,
            ]);
        });

        return back()->with('success', 'Membership berhasil diperpanjang!');
    }

    public function freeze(Request $request, Member $member)
    {
        $validated = $request->validate([
            'freeze_days' => 'required|integer|min:1|max:90',
            'reason' => 'required|string|max:255',
        ]);

        $activeSub = $member->activeSubscription;
        if (!$activeSub) {
            return back()->with('error', 'Member tidak memiliki paket membership aktif yang dapat dibekukan.');
        }

        $newEndDate = \Carbon\Carbon::parse($activeSub->end_date)->addDays((int)$validated['freeze_days']);
        $activeSub->update([
            'status' => 'frozen',
            'freeze_start_date' => now()->toDateString(),
            'freeze_end_date' => now()->addDays((int)$validated['freeze_days'])->toDateString(),
            'freeze_reason' => $validated['reason'],
            'end_date' => $newEndDate->toDateString(),
        ]);

        $member->update(['status' => 'frozen']);

        return back()->with('success', "Membership berhasil dibekukan selama {$validated['freeze_days']} hari.");
    }

    public function resetPassword(Request $request, Member $member)
    {
        $validated = $request->validate([
            'password' => 'nullable|string|min:8',
        ]);

        $newPassword = $validated['password'] ?? Str::random(8);

        if (!$member->user) {
            $userEmail = !empty($member->email) ? $member->email : strtolower($member->member_code) . '@trakin.local';
            $user = User::create([
                'name' => $member->full_name,
                'email' => $userEmail,
                'password' => Hash::make($newPassword),
                'branch_id' => $member->branch_id,
                'phone' => $member->phone,
                'status' => 'active',
            ]);
            $user->syncRoles(['Member']);
            app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();
            $member->update(['user_id' => $user->id]);
        } else {
            $member->user->update([
                'password' => Hash::make($newPassword),
            ]);
        }

        return back()->with('success', "Password member {$member->full_name} ({$member->member_code}) berhasil di-reset.")->with('generatedPassword', $newPassword);
    }

    public function destroy(Member $member)
    {
        DB::transaction(function () use ($member) {
            if ($member->user) {
                $member->user->delete();
            }
            $member->delete();
        });

        return back()->with('success', 'Data member berhasil dihapus!');
    }
}

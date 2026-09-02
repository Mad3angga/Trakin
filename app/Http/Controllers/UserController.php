<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class UserController extends Controller
{
    public function index()
    {
        // Ensure all system roles exist in database
        $canonicalRoles = ['Owner', 'Manager', 'Sales', 'Trainer', 'Front Desk', 'Member'];
        foreach ($canonicalRoles as $rName) {
            Role::firstOrCreate(['name' => $rName, 'guard_name' => 'web']);
        }

        // Exclude members from staff management
        $users = User::whereDoesntHave('roles', function ($query) {
            $query->where('name', 'Member');
        })->with(['roles', 'branch'])->get()->map(function ($u) {
            $roleName = $u->roles->first()?->name ?? 'Front Desk';
            $u->role_name = $roleName;
            $u->role_category = in_array($roleName, User::MANAGEMENT_ROLES) ? 'management' : 'staff';
            $u->main_role_display = in_array($roleName, User::STAFF_ROLES)
                ? "Staff ({$roleName})"
                : $roleName;
            return $u;
        });

        // Structured role definition with categories and permission descriptions
        $structuredRoles = [
            [
                'name' => User::ROLE_OWNER,
                'category' => User::CATEGORY_MANAGEMENT,
                'category_label' => 'Manajemen',
                'badge' => 'Owner',
                'description' => 'Pemilik Gym. Hak akses tertinggi mencakup manajemen staf, laporan finansial, analitik, dan pengaturan sistem.',
                'features' => ['Semua Akses Fitur', 'Kelola Akun Staf & Role', 'Laporan Keuangan & Pengeluaran', 'AI Assistant & Dev Mode'],
            ],
            [
                'name' => User::ROLE_MANAGER,
                'category' => User::CATEGORY_MANAGEMENT,
                'category_label' => 'Manajemen',
                'badge' => 'Manager',
                'description' => 'Pengelola Operasional. Hak akses operasional lengkap untuk paket gym, inventori, laporan, dan kelas.',
                'features' => ['Laporan & Statistik', 'Inventori Produk & POS', 'Paket Gym & PT', 'Manajemen Kelas & Trainer'],
            ],
            [
                'name' => User::ROLE_SALES,
                'category' => User::CATEGORY_STAFF,
                'category_label' => 'Staf Operasional',
                'badge' => 'Staff (Sales)',
                'description' => 'Staf Penjualan. Khusus penanganan pendaftaran member, penjualan paket & ritel POS, dan target penjualan.',
                'features' => ['Registrasi Member Baru', 'POS Kasir Ritel & Paket', 'Tracking Member & Penjualan', 'Jadwal Sesi PT'],
            ],
            [
                'name' => User::ROLE_FRONT_DESK,
                'category' => User::CATEGORY_STAFF,
                'category_label' => 'Staf Operasional',
                'badge' => 'Staff (Front Desk)',
                'description' => 'Staf Resepsionis / Kasir. Akses operasional meja depan, check-in kiosk kehadiran, dan kasir harian.',
                'features' => ['Kiosk QR Check-In', 'POS Kasir Ritel & Paket', 'Registrasi & Data Member', 'Kehadiran Harian'],
            ],
            [
                'name' => User::ROLE_TRAINER,
                'category' => User::CATEGORY_STAFF,
                'category_label' => 'Staf Operasional',
                'badge' => 'Staff (Trainer)',
                'description' => 'Staf Instruktur & Pelatih. Akses ke jadwal booking sesi PT personal, kelas latihan, dan log kehadiran.',
                'features' => ['Jadwal Kalender Sesi PT', 'Manajemen Kelas & Booking', 'Log Kehadiran Sesi', 'Profil Coach'],
            ],
        ];

        $branches = Branch::all();

        return Inertia::render('Admin/Users/Index', [
            'users' => $users,
            'roles' => $structuredRoles,
            'branches' => $branches,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8',
            'phone' => 'nullable|string|max:20',
            'branch_id' => 'required|exists:branches,id',
            'role' => 'required|exists:roles,name',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'phone' => $validated['phone'] ?? null,
            'branch_id' => $validated['branch_id'],
            'status' => 'active',
        ]);

        $user->syncRoles([$validated['role']]);
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        return redirect()->back()->with('success', "Staf {$user->name} berhasil dibuat dengan role {$validated['role']}.");
    }

    public function updateRole(Request $request, User $user)
    {
        $validated = $request->validate([
            'role' => 'required|exists:roles,name',
        ]);

        // Sync roles replaces all existing roles with only the new target role
        $user->syncRoles([$validated['role']]);

        // Flush Spatie permission cache so role changes take effect immediately across all sessions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        return redirect()->back()->with('success', "Role staf {$user->name} berhasil diubah menjadi {$validated['role']}.");
    }

    public function destroy(User $user)
    {
        if ($user->id === Auth::id()) {
            return redirect()->back()->with('error', 'Anda tidak dapat menghapus akun Anda sendiri.');
        }

        $name = $user->name;
        $user->delete();

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        return redirect()->back()->with('success', "Akun staf {$name} berhasil dihapus.");
    }
}

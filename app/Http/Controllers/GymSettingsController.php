<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use App\Models\Expense;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Models\StockMovement;
use App\Models\MembershipTransaction;
use App\Models\MemberQrCode;
use App\Models\Setting;
use App\Models\User;
use App\Models\Notification;
use App\Models\GymClass;
use App\Models\ClassSchedule;
use App\Models\Trainer;
use App\Models\Member;
use App\Models\PtSession;
use App\Models\Attendance;
use App\Models\MembershipSubscription;
use App\Models\MembershipPackage;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class GymSettingsController extends Controller
{
    private function ensureDevModeAllowed(): void
    {
        if (!app()->environment('local', 'development', 'testing') && !app()->runningUnitTests()) {
            abort(403, 'Dev Mode hanya tersedia di environment local/development.');
        }
        // Extra critical guard: if APP_DEBUG is false in production, never allow dev actions even if env misconfigured
        if (config('app.debug') === false && app()->environment('production')) {
            abort(403, 'Dev Mode dimatikan di production.');
        }
    }

    private function logDevActivity(string $activity, string $description, array $properties = []): void
    {
        try {
            ActivityLog::create([
                'user_id' => auth()->id(),
                'activity' => $activity,
                'description' => $description,
                'properties' => $properties,
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('dev activity log failed: ' . $e->getMessage());
        }
    }

    private function getSettings()
    {
        $defaults = [
            'gym_name' => 'Trakin Fitness Center',
            'gym_tagline' => 'Transform Your Power & Health',
            'gym_address' => 'Jl. Sudirman No. 88, Jakarta Selatan',
            'gym_phone' => '021-5551234',
            'gym_email' => 'info@trakingym.id',
            'gym_logo' => '',
            'system_timezone' => config('app.timezone', 'Asia/Jakarta'),
            'system_date_format' => 'd/m/Y',
            'system_time_format' => 'H:i',
            'pos_receipt_gym_name' => 'Trakin Fitness Gym',
            'pos_receipt_address' => 'Jl. Fitness No. 8, Pusat Kota',
            'pos_receipt_phone' => '0812-3456-7890',
            'pos_receipt_footer_title' => 'TERIMA KASIH',
            'pos_receipt_footer_note' => 'Selamat Berolahraga & Stay Fit!',
            'pos_receipt_show_tax' => '1',
            'commission_pt_rate' => '45',
            'commission_pt_type' => 'percent',
            'commission_membership_rate' => '50000',
            'commission_membership_type' => 'flat',
            // Dev Mode Feature Toggles
            'feature_class_booking' => '1',
            'feature_pt_booking' => '1',
            'feature_pos_module' => '1',
            'feature_kiosk_qr' => '1',
            'feature_auto_notifications' => '1',
            'feature_maintenance_mode' => '0',
        ];

        $settings = Setting::whereIn('key', array_keys($defaults))->pluck('value', 'key')->toArray();

        return array_merge($defaults, $settings);
    }

    public function edit()
    {
        $user = auth()->user();
        try {
            $recentNotifications = Notification::with('user:id,name,email')
                ->orderByDesc('created_at')
                ->limit(15)
                ->get()
                ->map(fn($n) => [
                    'id' => $n->id,
                    'title' => $n->title,
                    'message' => $n->message,
                    'type' => $n->type,
                    'is_read' => (bool) $n->is_read,
                    'user' => $n->user ? ['id' => $n->user->id, 'name' => $n->user->name] : null,
                    'created_at' => $n->created_at?->toIso8601String(),
                    'created_human' => $n->created_at?->diffForHumans(),
                ]);
        } catch (\Throwable $e) {
            $recentNotifications = collect();
        }

        $serviceAccountPath = config('services.firebase.service_account') ?: storage_path('app/firebase/service-account.json');
        $hasFirebaseJson = file_exists($serviceAccountPath);
        $firebaseProjectId = null;
        if ($hasFirebaseJson) {
            try {
                $sa = json_decode(file_get_contents($serviceAccountPath), true);
                $firebaseProjectId = $sa['project_id'] ?? null;
            } catch (\Throwable $e) {}
        }

        return Inertia::render('Admin/Settings/SettingsMain', [
            'gymSettings' => $this->getSettings(),
            'ownerAccount' => [
                'name' => $user->name,
                'email' => $user->email,
                'phone' => $user->phone ?? '',
                'photo' => $user->photo ?? null,
            ],
            'devStats' => [
                'total_users' => rescue(fn() => User::count(), 0, false),
                'total_members' => rescue(fn() => Member::count(), 0, false),
                'total_devices' => rescue(fn() => User::whereNotNull('device_token')->where('device_token', '!=', '')->count(), 0, false),
                'total_notifications' => rescue(fn() => Notification::count(), 0, false),
                'user_notifications' => rescue(fn() => Notification::where('user_id', $user->id)->count(), 0, false),
            ],
            'devRecentNotifications' => $recentNotifications,
            'devHealth' => [
                'app_env' => config('app.env'),
                'app_debug' => (bool) config('app.debug'),
                'gemini_configured' => !empty(config('services.gemini.key')),
                'fcm_legacy_configured' => !empty(config('services.fcm.key')),
                'firebase_json_exists' => $hasFirebaseJson,
                'firebase_project_id' => $firebaseProjectId ?: config('services.firebase.project_id') ?: config('services.fcm.project_id'),
                'storage_writable' => is_writable(storage_path()),
                'is_local' => app()->environment('local', 'development', 'testing'),
                'queue_driver' => config('queue.default'),
                'cache_store' => config('cache.store') ?? config('cache.default'),
            ],
            'devActivityLogs' => rescue(function() {
                return ActivityLog::with('user:id,name')->orderByDesc('created_at')->limit(20)->get()->map(fn($l)=>[
                    'id'=>$l->id,'activity'=>$l->activity,'description'=>$l->description,'properties'=>$l->properties,'user'=>$l->user?->only(['id','name']),'created_human'=>$l->created_at?->diffForHumans(),'created_at'=>$l->created_at?->toIso8601String(),
                ]);
            }, collect(), false),
            'devLogTail' => rescue(function() {
                if (!config('app.debug')) return null;
                $logPath = storage_path('logs/laravel.log');
                if (!file_exists($logPath)) return null;
                $lines = @file($logPath, FILE_IGNORE_NEW_LINES);
                if (!$lines) return null;
                return implode("\n", array_slice($lines, -80));
            }, null, false),
            'devHealthLive' => session('devHealthLive'),
            'devFcmPreview' => session('devFcmPreview'),
        ]);
    }

    private function ensureCanManageGymSettings(): void
    {
        $user = auth()->user();
        if (!$user || !$user->hasAnyRole(['Owner', 'Manager'])) {
            abort(403, 'Hanya Owner & Manager yang dapat mengelola Details, System, dan Receipt.');
        }
    }

    public function update(Request $request)
    {
        $user = auth()->user();
        $isManager = $user && $user->hasAnyRole(['Owner', 'Manager']);

        if (!$isManager) {
            $validated = $request->validate([
                'owner_name' => 'required|string|max:255',
                'owner_phone' => 'nullable|string|max:100',
                'owner_photo' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:3072',
                'owner_password' => 'nullable|string|min:8|confirmed',
                'current_password' => 'required_with:owner_password|current_password',
            ]);
            $userData = [
                'name' => $validated['owner_name'],
                'phone' => $validated['owner_phone'] ?? null,
            ];
            if ($request->hasFile('owner_photo')) {
                $photoFile = $request->file('owner_photo');
                $extension = strtolower($photoFile->extension() ?: 'jpg');
                if (!in_array($extension, ['jpg','jpeg','png','webp'], true)) $extension = 'jpg';
                $filename = 'profile_' . $user->id . '_' . time() . '_' . \Illuminate\Support\Str::random(8) . '.' . $extension;
                if (!empty($user->photo) && str_starts_with($user->photo, '/storage/uploads/profiles/')) {
                    $old = str_replace('/storage/', '', $user->photo);
                    \Illuminate\Support\Facades\Storage::disk('public')->delete($old);
                }
                $photoFile->storeAs('uploads/profiles', $filename, 'public');
                $userData['photo'] = '/storage/uploads/profiles/' . $filename;
            }
            if (!empty($validated['owner_password'])) {
                $userData['password'] = \Illuminate\Support\Facades\Hash::make($validated['owner_password']);
            }
            $user->update($userData);
            return back()->with('success', 'Profil akun berhasil diperbarui!');
        }

        $validated = $request->validate([
            'gym_name' => 'required|string|max:255',
            'gym_tagline' => 'nullable|string|max:255',
            'gym_address' => 'nullable|string|max:500',
            'gym_phone' => 'nullable|string|max:100',
            'gym_email' => 'nullable|email|max:255',
            'gym_logo' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'system_timezone' => 'required|string|timezone:all',
            'system_date_format' => 'required|string|in:d/m/Y,m/d/Y,Y-m-d',
            'system_time_format' => 'required|string|in:H:i,h:i A',
            'pos_receipt_gym_name' => 'nullable|string|max:255',
            'pos_receipt_address' => 'nullable|string|max:255',
            'pos_receipt_phone' => 'nullable|string|max:100',
            'pos_receipt_footer_title' => 'nullable|string|max:255',
            'pos_receipt_footer_note' => 'nullable|string|max:255',
            'pos_receipt_show_tax' => 'nullable|in:0,1',
            'commission_pt_rate' => 'nullable|numeric|min:0|max:100',
            'commission_pt_type' => 'nullable|in:percent,flat',
            'commission_membership_rate' => 'nullable|numeric|min:0',
            'commission_membership_type' => 'nullable|in:percent,flat',
            'owner_name' => 'required|string|max:255',
            'owner_phone' => 'nullable|string|max:100',
            'owner_photo' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:3072',
            'owner_password' => 'nullable|string|min:8|confirmed',
            'current_password' => 'required_with:owner_password|current_password',
        ]);

        // Update Owner Account (keep email read-only)
        $userData = [
            'name' => $validated['owner_name'],
            'phone' => $validated['owner_phone'] ?? null,
        ];

        if ($request->hasFile('owner_photo')) {
            $photoFile = $request->file('owner_photo');
            $extension = strtolower($photoFile->extension() ?: 'jpg');
            if (!in_array($extension, ['jpg','jpeg','png','webp'], true)) $extension = 'jpg';
            $filename = 'profile_' . $user->id . '_' . time() . '_' . \Illuminate\Support\Str::random(8) . '.' . $extension;
            // Delete old photo if exists
            if (!empty($user->photo) && str_starts_with($user->photo, '/storage/uploads/profiles/')) {
                $old = str_replace('/storage/', '', $user->photo);
                \Illuminate\Support\Facades\Storage::disk('public')->delete($old);
            }
            $photoFile->storeAs('uploads/profiles', $filename, 'public');
            $photoPath = '/storage/uploads/profiles/' . $filename;
            $userData['photo'] = $photoPath;
        }

        if (!empty($validated['owner_password'])) {
            $userData['password'] = \Illuminate\Support\Facades\Hash::make($validated['owner_password']);
        }
        $user->update($userData);

        foreach (['gym_name', 'gym_tagline', 'gym_address', 'gym_phone', 'gym_email'] as $key) {
            if (array_key_exists($key, $validated)) {
                Setting::updateOrCreate(
                    ['key' => $key],
                    ['value' => (string) ($validated[$key] ?? ''), 'group' => 'general']
                );
            }
        }

        if (!empty($validated['gym_name'])) {
            if ($user->branch_id) {
                \App\Models\Branch::where('id', $user->branch_id)->update([
                    'name' => $validated['gym_name'],
                ]);
            }
        }

        foreach (['system_timezone', 'system_date_format', 'system_time_format'] as $key) {
            Setting::updateOrCreate(
                ['key' => $key],
                ['value' => (string) $validated[$key], 'group' => 'system']
            );
        }

        Cache::forget('system_timezone');
        $newTz = $validated['system_timezone'] ?? null;
        if ($newTz && in_array($newTz, timezone_identifiers_list(), true)) {
            config(['app.timezone' => $newTz]);
            date_default_timezone_set($newTz);
            Cache::put('system_timezone', $newTz, 3600);
        }

        foreach (['pos_receipt_gym_name', 'pos_receipt_address', 'pos_receipt_phone', 'pos_receipt_footer_title', 'pos_receipt_footer_note', 'pos_receipt_show_tax'] as $key) {
            if (array_key_exists($key, $validated)) {
                Setting::updateOrCreate(
                    ['key' => $key],
                    ['value' => (string) ($validated[$key] ?? ''), 'group' => 'pos_receipt']
                );
            }
        }

        foreach (['commission_pt_rate', 'commission_pt_type', 'commission_membership_rate', 'commission_membership_type'] as $key) {
            if (array_key_exists($key, $validated)) {
                Setting::updateOrCreate(
                    ['key' => $key],
                    ['value' => (string) ($validated[$key] ?? ''), 'group' => 'commission']
                );
            }
        }

        if ($request->hasFile('gym_logo')) {
            $file = $request->file('gym_logo');
            $extension = strtolower($file->extension() ?: 'jpg');
            if (!in_array($extension, ['jpg','jpeg','png','webp'], true)) $extension = 'jpg';
            $filename = 'gym_logo_' . time() . '_' . \Illuminate\Support\Str::random(6) . '.' . $extension;
            $file->storeAs('uploads/settings', $filename, 'public');

            Setting::updateOrCreate(
                ['key' => 'gym_logo'],
                ['value' => '/storage/uploads/settings/' . $filename, 'group' => 'general']
            );
        }

        return back()->with('success', 'Pengaturan gym & akun owner berhasil diperbarui!');
    }

    public function deletePhoto(Request $request)
    {
        $user = auth()->user();
        if (!empty($user->photo) && str_starts_with($user->photo, '/storage/uploads/profiles/')) {
            $old = str_replace('/storage/', '', $user->photo);
            \Illuminate\Support\Facades\Storage::disk('public')->delete($old);
        }
        $user->photo = null;
        $user->save();

        $member = \App\Models\Member::where('user_id', $user->id)->first();
        if ($member && !empty($member->photo)) {
            if (str_starts_with($member->photo, '/storage/uploads/profiles/')) {
                $old = str_replace('/storage/', '', $member->photo);
                \Illuminate\Support\Facades\Storage::disk('public')->delete($old);
            }
            $member->photo = null;
            $member->save();
        }
        $trainer = \App\Models\Trainer::where('user_id', $user->id)->first();
        if ($trainer && !empty($trainer->photo)) {
            if (str_starts_with($trainer->photo, '/storage/uploads/profiles/')) {
                $old = str_replace('/storage/', '', $trainer->photo);
                \Illuminate\Support\Facades\Storage::disk('public')->delete($old);
            }
            $trainer->photo = null;
            $trainer->save();
        }

        return back()->with('success', 'Foto profil berhasil dihapus, kembali ke default.');
    }

    private function ensureDevActionAllowed(): void
    {
        $this->ensureDevModeAllowed();
    }

    public function broadcast(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:100',
            'body' => 'required|string|max:500',
            'target' => 'required|in:all,member,trainer,staff,owner',
        ]);

        // Tentukan user target berdasarkan role — In-App untuk semua, FCM hanya yang ada device_token
        $baseQuery = \App\Models\User::query();
        if ($validated['target'] !== 'all') {
            $roleMap = [
                'member' => 'Member',
                'trainer' => 'Trainer',
                'staff' => ['Owner', 'Manager', 'Front Desk'],
                'owner' => 'Owner',
            ];
            $roles = (array) ($roleMap[$validated['target']] ?? []);
            $baseQuery->whereHas('roles', fn($q) => $q->whereIn('name', $roles));
        }
        $usersForDb = (clone $baseQuery)->get(['id']);
        $users = (clone $baseQuery)->whereNotNull('device_token')->where('device_token','!=','')->get(['id', 'device_token']);
        $tokens = $users->pluck('device_token')->filter()->unique()->values();

        // Simpan ke tabel notifications untuk in-app polling (semua target, bukan hanya yang ada token)
        foreach ($usersForDb as $u) {
            try {
                Notification::create([
                    'user_id' => $u->id,
                    'title' => $validated['title'],
                    'message' => $validated['body'],
                    'type' => 'broadcast',
                    'is_read' => false,
                ]);
            } catch (\Throwable $e) {
                Log::warning('broadcast db save failed: ' . $e->getMessage());
            }
        }

        $fcmResult = $this->sendFcmMessages($tokens, $validated['title'], $validated['body']);

        $inAppCount = $usersForDb->count();
        $fcmTargets = $tokens->count();
        $msg = "Broadcast terkirim ke {$inAppCount} pengguna In-App (FCM push: {$fcmResult['sent']} sukses, {$fcmResult['failed']} gagal dari {$fcmTargets} device).";
        if ($fcmTargets === 0) {
            $msg .= ' Tidak ada device_token — login via Aplikasi HP (Android/iOS) dulu agar push muncul di lockscreen. In-App tetap masuk.';
        }

        return back()->with('success', $msg);
    }

    /**
     * Dev Mode: Dispatch Specific Test Notifications
     */
    public function testNotification(Request $request)
    {
        $this->ensureDevActionAllowed();
        $validated = $request->validate([
            'type' => 'required|string|max:50',
            'title' => 'required|string|max:150',
            'body' => 'required|string|max:500',
            'target' => 'required|in:me,members,trainers,all',
        ]);

        $currentUser = auth()->user();
        $targetUsers = collect();

        if ($validated['target'] === 'me') {
            $targetUsers = collect([$currentUser]);
        } elseif ($validated['target'] === 'members') {
            $targetUsers = User::role('Member')->get();
        } elseif ($validated['target'] === 'trainers') {
            $targetUsers = User::role('Trainer')->get();
        } else {
            $targetUsers = User::all();
        }

        if ($targetUsers->isEmpty()) {
            $targetUsers = collect([$currentUser]);
        }

        // Save In-App Notification to DB for each target user
        foreach ($targetUsers as $u) {
            try {
                Notification::create([
                    'user_id' => $u->id,
                    'title' => $validated['title'],
                    'message' => $validated['body'],
                    'type' => $validated['type'],
                    'is_read' => false,
                ]);
            } catch (\Throwable $e) {
                Log::warning('test notification db save failed: ' . $e->getMessage());
            }
        }

        // Send push via FCM if target users have device tokens
        $tokens = $targetUsers->pluck('device_token')->filter()->unique()->values();
        $fcmResult = $this->sendFcmMessages($tokens, $validated['title'], $validated['body'], ['type' => $validated['type']]);

        $msg = "Simulasi notifikasi '{$validated['title']}' berhasil dibuat untuk {$targetUsers->count()} pengguna In-App!";
        if ($tokens->isNotEmpty()) {
            $msg .= " (FCM Push: {$fcmResult['sent']} terkirim ke device).";
        }

        return back()->with('success', $msg);
    }

    /**
     * Dev Mode: Toggle Feature Flag
     */
    public function toggleFeature(Request $request)
    {
        $this->ensureDevActionAllowed();
        $validated = $request->validate([
            'feature' => 'required|string|in:feature_class_booking,feature_pt_booking,feature_pos_module,feature_kiosk_qr,feature_auto_notifications,feature_maintenance_mode',
            'enabled' => 'required|boolean',
        ]);

        Setting::updateOrCreate(
            ['key' => $validated['feature']],
            ['value' => $validated['enabled'] ? '1' : '0', 'group' => 'features']
        );

        $featureLabels = [
            'feature_class_booking' => 'Modul Booking Kelas',
            'feature_pt_booking' => 'Modul Booking Personal Trainer (PT)',
            'feature_pos_module' => 'Modul POS & Kasir',
            'feature_kiosk_qr' => 'Fitur Kiosk & QR Check-in',
            'feature_auto_notifications' => 'Engine Pengingat Notifikasi Otomatis',
            'feature_maintenance_mode' => 'Mode Pemeliharaan (Maintenance Banner)',
        ];

        $label = $featureLabels[$validated['feature']] ?? $validated['feature'];
        $status = $validated['enabled'] ? 'DIAKTIFKAN' : 'DINONAKTIFKAN';

        return back()->with('success', "Fitur {$label} berhasil {$status}!");
    }

    /**
     * Dev Mode: Clear Notifications for Current User
     */
    public function clearNotifications()
    {
        $this->ensureDevActionAllowed();
        $user = auth()->user();
        $count = Notification::where('user_id', $user->id)->count();
        Notification::where('user_id', $user->id)->delete();
        $this->logDevActivity('dev_clear_notifications', "Bersihkan {$count} notifikasi milik {$user->name}", ['count' => $count]);

        return back()->with('success', "Berhasil menghapus {$count} notifikasi milik Anda.");
    }

    public function clearAllNotificationsGlobal()
    {
        $this->ensureDevActionAllowed();
        $count = Notification::count();
        Notification::truncate();
        $this->logDevActivity('dev_clear_all_notifications', "Bersihkan seluruh notifikasi global ({$count} baris)", ['count' => $count]);
        return back()->with('success', "Seluruh {$count} notifikasi global berhasil dibersihkan!");
    }

    /**
     * Dev Mode: Create a Mock Class Session for Testing
     */
    public function mockClassSession()
    {
        $this->ensureDevActionAllowed();
        $firstClass = GymClass::first();
        if (!$firstClass) {
            $firstClass = GymClass::create([
                'name' => 'HIIT Fat Burn (Dev Test)',
                'category' => 'Cardio & HIIT',
                'description' => 'Sesi simulasi pengujian kelas gym untuk testing booking dan reminder.',
                'capacity' => 20,
                'duration_minutes' => 60,
            ]);
        }

        $trainer = Trainer::first();
        $schedule = ClassSchedule::create([
            'class_id' => $firstClass->id,
            'trainer_id' => $trainer?->id,
            'branch_id' => auth()->user()->branch_id ?? 1,
            'start_time' => now()->addHour(),
            'end_time' => now()->addHours(2),
            'room' => 'Studio 1 (Dev Mock)',
            'max_capacity' => $firstClass->capacity ?: 20,
            'status' => 'scheduled',
        ]);

        $this->logDevActivity('dev_mock_class', "Buat jadwal kelas {$firstClass->name}", ['schedule_id' => $schedule->id, 'class' => $firstClass->name]);
        return back()->with('success', "Sesi simulasi kelas '{$firstClass->name}' berhasil dibuat untuk 1 jam ke depan! (ID: {$schedule->id})");
    }

    /**
     * Dev Mode: Create a Mock PT Session
     */
    public function mockPtSession()
    {
        $this->ensureDevActionAllowed();
        $trainer = Trainer::first();
        $member = Member::first();

        if (!$trainer || !$member) {
            return back()->with('error', 'Diperlukan minimal 1 Trainer dan 1 Member terdaftar untuk membuat sesi PT.');
        }

        $session = PtSession::create([
            'trainer_id' => $trainer->id,
            'member_id' => $member->id,
            'branch_id' => auth()->user()->branch_id ?? 1,
            'session_date' => now()->toDateString(),
            'start_time' => now()->addMinutes(45)->format('H:i:s'),
            'end_time' => now()->addMinutes(105)->format('H:i:s'),
            'status' => 'scheduled',
            'notes' => 'Sesi simulasi pengujian Personal Trainer (Dev Mode)',
        ]);

        $this->logDevActivity('dev_mock_pt', "Buat sesi PT {$trainer->full_name} - {$member->full_name}", ['session_id' => $session->id]);
        return back()->with('success', "Sesi PT simulasi dengan Coach {$trainer->full_name} berhasil dibuat! (ID: {$session->id})");
    }

    /**
     * Dev Mode: Simulate Gym Attendance Check-in for Current User
     */
    public function mockAttendance()
    {
        $this->ensureDevActionAllowed();
        $user = auth()->user();
        $member = Member::where('user_id', $user->id)->first() ?? Member::first();

        if (!$member) {
            return back()->with('error', 'Tidak ditemukan data Member untuk check-in.');
        }

        $attendance = Attendance::create([
            'member_id' => $member->id,
            'branch_id' => $user->branch_id ?? 1,
            'check_in_time' => now(),
            'status' => 'checked_in',
            'method' => 'qr_kiosk',
            'notes' => 'Simulasi Check-in Dev Mode',
        ]);

        $this->logDevActivity('dev_mock_attendance', "Check-in {$member->full_name}", ['attendance_id' => $attendance->id]);
        return back()->with('success', "Check-in gym simulasi berhasil dicatat untuk {$member->full_name}! (ID: {$attendance->id})");
    }

    /**
     * Dev Mode: Extend Membership by +30 Days
     */
    public function extendMembership()
    {
        $this->ensureDevActionAllowed();
        $user = auth()->user();
        $member = Member::where('user_id', $user->id)->first() ?? Member::first();

        if (!$member) {
            return back()->with('error', 'Tidak ditemukan profil Member.');
        }

        $package = MembershipPackage::first();
        $activeSub = MembershipSubscription::where('member_id', $member->id)
            ->where('status', 'active')
            ->latest('end_date')
            ->first();

        if ($activeSub) {
            $newEnd = \Carbon\Carbon::parse($activeSub->end_date)->addDays(30);
            $activeSub->update([
                'end_date' => $newEnd->toDateString(),
            ]);
            $msg = "Masa aktif membership {$member->full_name} berhasil diperpanjang +30 hari hingga {$newEnd->translatedFormat('d F Y')}!";
        } else {
            $sub = MembershipSubscription::create([
                'member_id' => $member->id,
                'package_id' => $package?->id ?? 1,
                'start_date' => now()->toDateString(),
                'end_date' => now()->addDays(30)->toDateString(),
                'status' => 'active',
                'payment_status' => 'paid',
                'notes' => 'Aktivasi simulasi paket membership 30 hari (Dev Mode)',
            ]);
            $msg = "Paket membership 30 hari aktif berhasil di-generate untuk {$member->full_name}!";
        }

        $this->logDevActivity('dev_extend_membership', $msg, ['member_id' => $member->id]);
        return back()->with('success', $msg);
    }

    /**
     * Dev Mode: Mock POS Sale (1 produk random)
     */
    public function mockSale()
    {
        $this->ensureDevActionAllowed();
        $user = auth()->user();
        $product = Product::where('status', 'active')->where('stock', '>', 0)->inRandomOrder()->first() ?? Product::first();
        $member = Member::inRandomOrder()->first();

        if (!$product) {
            return back()->with('error', 'Tidak ada produk aktif untuk transaksi mock.');
        }

        $qty = rand(1, 2);
        if ($product->stock < $qty) $qty = 1;

        $subtotal = $product->price * $qty;
        $tax = (int) round($subtotal * 0.11);
        $discount = rand(0, 1) ? rand(2000, 8000) : 0;
        $total = max(0, $subtotal + $tax - $discount);
        $paidAmount = $total + rand(0, 20000);
        $changeAmount = $paidAmount - $total;

        do {
            $invoice = 'INV-' . now()->format('Ymd') . '-' . str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
        } while (Sale::where('invoice_number', $invoice)->exists());

        $sale = DB::transaction(function () use ($product, $member, $user, $qty, $subtotal, $tax, $discount, $total, $paidAmount, $changeAmount, $invoice) {
            $sale = Sale::create([
                'invoice_number' => $invoice,
                'member_id' => $member?->id,
                'branch_id' => $user->branch_id ?? 1,
                'payment_method' => ['cash','qris','debit'][array_rand(['cash','qris','debit'])],
                'subtotal' => $subtotal,
                'tax' => $tax,
                'discount' => $discount,
                'total_amount' => $total,
                'paid_amount' => $paidAmount,
                'change_amount' => $changeAmount,
                'payment_status' => 'paid',
                'cashier_id' => $user->id,
            ]);

            SaleItem::create([
                'sale_id' => $sale->id,
                'product_id' => $product->id,
                'quantity' => $qty,
                'unit_price' => $product->price,
                'subtotal' => $subtotal,
            ]);

            $product->decrement('stock', $qty);

            StockMovement::create([
                'product_id' => $product->id,
                'type' => 'out',
                'quantity' => $qty,
                'reference_type' => 'sale',
                'reference_id' => $sale->id,
                'notes' => "Mock POS sale (Dev Mode) {$invoice}",
                'created_by' => $user->id,
            ]);

            return $sale;
        });

        $this->logDevActivity('dev_mock_sale', "Mock sale {$invoice} - {$product->name} x{$qty}", ['sale_id' => $sale->id, 'invoice' => $invoice]);
        return back()->with('success', "Transaksi mock POS berhasil: {$invoice} — {$product->name} x{$qty} (Rp ".number_format($total,0,',','.').")");
    }

    /**
     * Dev Mode: Mock Expense
     */
    public function mockExpense()
    {
        $this->ensureDevActionAllowed();
        $user = auth()->user();
        $categories = ['Operasional','Maintenance','Marketing','Gaji','Utilitas','Supplies'];
        $category = $categories[array_rand($categories)];
        $amount = rand(50000, 800000);
        $expense = Expense::create([
            'branch_id' => $user->branch_id ?? 1,
            'category' => $category,
            'description' => "Pengeluaran mock {$category} (Dev Mode)",
            'amount' => $amount,
            'expense_date' => now()->toDateString(),
            'created_by' => $user->id,
        ]);

        $this->logDevActivity('dev_mock_expense', "Mock expense {$category} Rp {$amount}", ['expense_id' => $expense->id]);
        return back()->with('success', "Pengeluaran mock berhasil: {$category} Rp ".number_format($amount,0,',','.')." (ID: {$expense->id})");
    }

    /**
     * Dev Mode: Mock Membership Transaction (extend/buat paket)
     */
    public function mockMembershipTransaction()
    {
        $this->ensureDevActionAllowed();
        $user = auth()->user();
        $member = Member::inRandomOrder()->first() ?? Member::first();
        $package = MembershipPackage::where('status','active')->inRandomOrder()->first() ?? MembershipPackage::first();

        if (!$member || !$package) {
            return back()->with('error', 'Butuh minimal 1 Member & 1 Paket untuk mock transaksi membership.');
        }

        $startDate = now()->toDateString();
        $endDate = now()->addDays($package->duration_days)->toDateString();

        $subscription = MembershipSubscription::create([
            'member_id' => $member->id,
            'package_id' => $package->id,
            'start_date' => $startDate,
            'end_date' => $endDate,
            'price_paid' => $package->price,
            'status' => 'active',
        ]);

        do {
            $code = 'TX-DEV-' . now()->format('Ymd') . '-' . str_pad(random_int(0, 99999), 5, '0', STR_PAD_LEFT);
        } while (MembershipTransaction::where('transaction_code', $code)->exists());

        $trx = MembershipTransaction::create([
            'subscription_id' => $subscription->id,
            'member_id' => $member->id,
            'transaction_code' => $code,
            'payment_method' => ['cash','qris','debit'][array_rand(['cash','qris','debit'])],
            'amount' => $package->price,
            'status' => 'paid',
            'paid_at' => now(),
            'created_by' => $user->id,
            'notes' => 'Transaksi mock membership (Dev Mode)',
        ]);

        $this->logDevActivity('dev_mock_membership_trx', "Mock membership {$member->full_name} - {$package->name}", ['trx_id' => $trx->id, 'subscription_id' => $subscription->id]);
        return back()->with('success', "Transaksi membership mock berhasil: {$member->full_name} — {$package->name} (Rp ".number_format($package->price,0,',','.').")");
    }

    /**
     * Dev Mode: Bulk Mock Attendance (N check-ins today)
     */
    public function mockBulkAttendance(Request $request)
    {
        $this->ensureDevActionAllowed();
        $validated = $request->validate(['count' => 'nullable|integer|min:1|max:50']);
        $count = (int) ($validated['count'] ?? 10);
        $user = auth()->user();
        $members = Member::inRandomOrder()->limit($count)->get();
        if ($members->count() < $count) {
            $members = Member::all();
            if ($members->isEmpty()) return back()->with('error', 'Tidak ada member untuk bulk attendance.');
            // cycle if not enough
            while ($members->count() < $count) {
                $members = $members->merge(Member::inRandomOrder()->limit($count - $members->count())->get());
            }
        }
        $created = 0;
        foreach ($members->take($count) as $member) {
            try {
                Attendance::create([
                    'member_id' => $member->id,
                    'branch_id' => $user->branch_id ?? 1,
                    'check_in_time' => now()->subMinutes(rand(0, 480)),
                    'status' => 'checked_in',
                    'method' => 'qr_kiosk',
                    'notes' => 'Bulk mock attendance Dev Mode',
                ]);
                $created++;
            } catch (\Throwable $e) {
                Log::warning('bulk attendance failed: '.$e->getMessage());
            }
        }
        $this->logDevActivity('dev_mock_bulk_attendance', "Bulk {$created} check-ins", ['count' => $created]);
        return back()->with('success', "Berhasil buat {$created} check-in bulk hari ini!");
    }

    /**
     * Dev Mode: Bulk Mock Sales (N transaksi POS)
     */
    public function mockBulkSales(Request $request)
    {
        $this->ensureDevActionAllowed();
        $validated = $request->validate(['count' => 'nullable|integer|min:1|max:20']);
        $count = (int) ($validated['count'] ?? 5);
        $user = auth()->user();
        $created = 0;
        $totalValue = 0;
        for ($i = 0; $i < $count; $i++) {
            $product = Product::where('status','active')->where('stock','>',0)->inRandomOrder()->first() ?? Product::first();
            if (!$product) break;
            $qty = rand(1,2);
            if ($product->stock < $qty) continue;
            $member = Member::inRandomOrder()->first();
            $subtotal = $product->price * $qty;
            $tax = (int) round($subtotal*0.11);
            $discount = rand(0,1) ? rand(2000,6000):0;
            $total = max(0,$subtotal+$tax-$discount);
            $paid = $total + rand(0,15000);
            do { $inv='INV-'.now()->format('Ymd').'-'.str_pad(random_int(0,999999),6,'0',STR_PAD_LEFT);} while (Sale::where('invoice_number',$inv)->exists());
            try {
                DB::transaction(function() use ($product,$member,$user,$qty,$subtotal,$tax,$discount,$total,$paid,$inv){
                    $sale=Sale::create(['invoice_number'=>$inv,'member_id'=>$member?->id,'branch_id'=>$user->branch_id??1,'payment_method'=>['cash','qris','debit'][array_rand(['cash','qris','debit'])],'subtotal'=>$subtotal,'tax'=>$tax,'discount'=>$discount,'total_amount'=>$total,'paid_amount'=>$paid,'change_amount'=>$paid-$total,'payment_status'=>'paid','cashier_id'=>$user->id]);
                    SaleItem::create(['sale_id'=>$sale->id,'product_id'=>$product->id,'quantity'=>$qty,'unit_price'=>$product->price,'subtotal'=>$subtotal]);
                    $product->decrement('stock',$qty);
                    StockMovement::create(['product_id'=>$product->id,'type'=>'out','quantity'=>$qty,'reference_type'=>'sale','reference_id'=>$sale->id,'notes'=>"Bulk mock sale Dev Mode {$inv}",'created_by'=>$user->id]);
                });
                $created++; $totalValue+=$total;
            } catch (\Throwable $e) { Log::warning('bulk sale failed: '.$e->getMessage()); }
        }
        $this->logDevActivity('dev_mock_bulk_sales', "Bulk {$created} sales Rp {$totalValue}", ['count'=>$created,'total'=>$totalValue]);
        return back()->with('success', "Berhasil buat {$created} transaksi POS bulk (total Rp ".number_format($totalValue,0,',','.').")");
    }

    /**
     * Dev Mode: Bulk Mock Class Bookings (fill schedule)
     */
    public function mockBulkClassBookings(Request $request)
    {
        $this->ensureDevActionAllowed();
        $validated = $request->validate(['count' => 'nullable|integer|min:1|max:20']);
        $count = (int) ($validated['count'] ?? 5);
        $schedule = ClassSchedule::where('status','scheduled')->orderByDesc('id')->first() ?? ClassSchedule::first();
        if (!$schedule) return back()->with('error', 'Tidak ada jadwal kelas tersedia untuk booking bulk.');
        $members = Member::whereNotIn('id', function($q) use ($schedule){ $q->select('member_id')->from('class_registrations')->where('class_schedule_id',$schedule->id); })->inRandomOrder()->limit($count)->get();
        if ($members->isEmpty()) return back()->with('error', 'Semua member sudah booking jadwal ini.');
        $created=0;
        foreach ($members as $member) {
            if ($schedule->registrations()->count() >= $schedule->max_capacity) break;
            try {
                \App\Models\ClassRegistration::create(['class_schedule_id'=>$schedule->id,'member_id'=>$member->id,'status'=>'registered']);
                $created++;
            } catch (\Throwable $e) { Log::warning('bulk class booking failed: '.$e->getMessage()); }
        }
        $this->logDevActivity('dev_mock_bulk_class_bookings', "Bulk {$created} bookings untuk schedule {$schedule->id}", ['schedule_id'=>$schedule->id,'count'=>$created]);
        return back()->with('success', "Berhasil buat {$created} booking kelas untuk jadwal #{$schedule->id}!");
    }

    /**
     * Dev Mode: Clear Activity Logs
     */
    public function clearActivityLogs()
    {
        $this->ensureDevActionAllowed();
        $count = ActivityLog::count();
        ActivityLog::truncate();
        return back()->with('success', "Berhasil hapus {$count} activity logs!");
    }

    /**
     * Dev Mode: Live health check (Gemini/FCM/storage)
     */
    public function healthCheck(Request $request)
    {
        $this->ensureDevActionAllowed();
        $results = [];

        // Gemini live ping (lightweight)
        $geminiKey = config('services.gemini.key');
        if (empty($geminiKey)) {
            $results['gemini'] = ['ok'=>false,'msg'=>'GEMINI_API_KEY kosong'];
        } else {
            try {
                $res = Http::timeout(6)->get('https://generativelanguage.googleapis.com/v1beta/models', ['key'=>$geminiKey]);
                $results['gemini'] = $res->successful() ? ['ok'=>true,'msg'=>'Gemini API reachable ('.$res->json('models.0.name','ok').')'] : ['ok'=>false,'msg'=>'Gemini HTTP '.$res->status().' '.str($res->body())->limit(120)];
            } catch (\Throwable $e) {
                $results['gemini'] = ['ok'=>false,'msg'=>'Gemini error: '.$e->getMessage()];
            }
        }

        // FCM v1 token generation
        $saPath = config('services.firebase.service_account') ?: storage_path('app/firebase/service-account.json');
        if (!file_exists($saPath)) {
            $results['fcm'] = ['ok'=>false,'msg'=>'service-account.json tidak ditemukan'];
        } else {
            try {
                $sa = json_decode(file_get_contents($saPath), true);
                $token = $this->getGoogleAccessToken($sa);
                $results['fcm'] = $token ? ['ok'=>true,'msg'=>'FCM v1 token OK (project '.($sa['project_id']??'-').')'] : ['ok'=>false,'msg'=>'Gagal generate token'];
            } catch (\Throwable $e) {
                $results['fcm'] = ['ok'=>false,'msg'=>'FCM error: '.$e->getMessage()];
            }
        }

        // Storage & DB
        $results['storage'] = is_writable(storage_path()) ? ['ok'=>true,'msg'=>'storage writable'] : ['ok'=>false,'msg'=>'storage NOT writable'];
        try { DB::select('select 1'); $results['db']=['ok'=>true,'msg'=>'DB OK']; } catch(\Throwable $e){ $results['db']=['ok'=>false,'msg'=>$e->getMessage()]; }
        $results['queue'] = ['ok'=>true,'msg'=>'driver: '.config('queue.default')];
        $results['env'] = ['ok'=>app()->environment('local','development','testing'),'msg'=>config('app.env').(config('app.debug')?' debug ON':'')];

        // Preview payloads
        $sampleFcm = [
            'message'=>[
                'token'=>'<device_token>',
                'notification'=>['title'=>'Contoh','body'=>'Body mock'],
                'data'=>['title'=>'Contoh','body'=>'Body','type'=>'class_reminder'],
                'android'=>['priority'=>'HIGH'],
            ]
        ];

        return back()->with('success', 'Health check selesai: Gemini '.($results['gemini']['ok']?'✅':'❌').' FCM '.($results['fcm']['ok']?'✅':'❌'))->with('devHealthLive', $results)->with('devFcmPreview', $sampleFcm);
    }

    /**
     * Dev Mode: Wipe transactional dev data (sales, expenses, attendance, etc.)
     */
    public function wipeDevData(Request $request)
    {
        $this->ensureDevActionAllowed();
        $validated = $request->validate([
            'tables' => 'nullable|array',
            'tables.*' => 'in:sales,expenses,attendances,notifications,activity_logs,membership_transactions,stock_movements',
            'confirm' => 'required|in:WIPE',
        ]);

        $allowed = [
            'sales' => [\App\Models\Sale::class, \App\Models\SaleItem::class],
            'expenses' => [Expense::class],
            'attendances' => [Attendance::class],
            'notifications' => [Notification::class],
            'activity_logs' => [ActivityLog::class],
            'membership_transactions' => [MembershipTransaction::class, MembershipSubscription::class],
            'stock_movements' => [StockMovement::class, \App\Models\StockAdjustment::class],
        ];

        $tables = $validated['tables'] ?? array_keys($allowed);
        $wiped = [];
        DB::statement('PRAGMA foreign_keys = OFF;');
        foreach ($tables as $key) {
            foreach ((array) ($allowed[$key] ?? []) as $model) {
                try { $count = $model::count(); $model::truncate(); $wiped[$key] = ($wiped[$key] ?? 0) + $count; } catch (\Throwable $e) { Log::warning("wipe {$key} failed: ".$e->getMessage()); }
            }
        }
        DB::statement('PRAGMA foreign_keys = ON;');

        $this->logDevActivity('dev_wipe_data', 'Wipe dev data: '.implode(', ', array_keys($wiped)), $wiped);
        return back()->with('success', 'Wipe selesai: '.collect($wiped)->map(fn($c,$k)=>"{$k}={$c}")->implode(', '));
    }

    /**
     * Dev Mode: Clear cache / config / view
     */
    public function clearCache()
    {
        $this->ensureDevActionAllowed();
        try { Cache::flush(); } catch (\Throwable $e) {}
        try { Artisan::call('config:clear'); } catch (\Throwable $e) {}
        try { Artisan::call('view:clear'); } catch (\Throwable $e) {}
        $this->logDevActivity('dev_clear_cache', 'Clear cache/config/view');
        return back()->with('success', 'Cache, config & view berhasil dibersihkan!');
    }

    /**
     * Dev Mode: Clear laravel.log
     */
    public function clearLog()
    {
        $this->ensureDevActionAllowed();
        $path = storage_path('logs/laravel.log');
        if (file_exists($path)) {
            @file_put_contents($path, '');
            $this->logDevActivity('dev_clear_log', 'Clear laravel.log');
            return back()->with('success', 'laravel.log berhasil dikosongkan!');
        }
        return back()->with('error', 'File laravel.log tidak ditemukan.');
    }

    /**
     * Dev Mode: Mock expired membership (end_date = yesterday, status expired)
     */
    public function mockExpiredMembership()
    {
        $this->ensureDevActionAllowed();
        $member = Member::inRandomOrder()->first() ?? Member::first();
        $package = MembershipPackage::where('status','active')->inRandomOrder()->first() ?? MembershipPackage::first();
        if (!$member || !$package) return back()->with('error', 'Butuh member & paket.');

        $sub = MembershipSubscription::create([
            'member_id' => $member->id,
            'package_id' => $package->id,
            'start_date' => now()->subDays($package->duration_days + 5)->toDateString(),
            'end_date' => now()->subDay()->toDateString(),
            'price_paid' => $package->price,
            'status' => 'expired',
        ]);

        do { $code='TX-DEV-'.now()->format('Ymd').'-'.str_pad(random_int(0,99999),5,'0',STR_PAD_LEFT);} while (MembershipTransaction::where('transaction_code',$code)->exists());
        $trx = MembershipTransaction::create([
            'subscription_id'=>$sub->id,'member_id'=>$member->id,'transaction_code'=>$code,
            'payment_method'=>['cash','qris','debit'][array_rand(['cash','qris','debit'])],
            'amount'=>$package->price,'status'=>'paid','paid_at'=>now()->subDays($package->duration_days+5),'created_by'=>auth()->id(),'notes'=>'Mock expired membership (Dev Mode)',
        ]);

        $this->logDevActivity('dev_mock_expired_membership', "Expired {$member->full_name}", ['subscription_id'=>$sub->id]);
        return back()->with('success', "Membership expired dibuat untuk {$member->full_name} (expired kemarin).");
    }

    /**
     * Dev Mode: Mock low-stock product (set stock = 1)
     */
    public function mockLowStock(Request $request)
    {
        $this->ensureDevActionAllowed();
        $product = Product::where('status','active')->inRandomOrder()->first();
        if (!$product) return back()->with('error', 'Tidak ada produk.');

        $prev = $product->stock;
        $product->update(['stock'=>1]);
        \App\Models\StockAdjustment::create([
            'product_id'=>$product->id,'previous_stock'=>$prev,'actual_stock'=>1,'difference'=>1-$prev,'reason'=>'Mock low stock Dev Mode','adjusted_by'=>auth()->id(),
        ]);
        StockMovement::create(['product_id'=>$product->id,'type'=>'adjustment','quantity'=>abs(1-$prev),'notes'=>"Mock low stock 1 (prev {$prev})",'created_by'=>auth()->id()]);

        $this->logDevActivity('dev_mock_low_stock', "Low stock {$product->name}", ['product_id'=>$product->id,'prev'=>$prev]);
        return back()->with('success', "Produk {$product->name} stok diset jadi 1 (sebelumnya {$prev}) — trigger low stock alert!");
    }

    /**
     * Dev Mode: Create dummy member (user + member + QR + optional subscription)
     */
    public function createDummyMember(Request $request)
    {
        $this->ensureDevActionAllowed();
        $validated = $request->validate([
            'with_subscription' => 'nullable|boolean',
        ]);

        $branchId = auth()->user()?->branch_id ?? \App\Models\Branch::first()?->id ?? 1;
        $names = ['Riko Pratama','Sinta Dewi','Agus Wijaya','Maya Sari','Bima Sakti','Luna Putri','Dedi Hermawan','Nadia Zafira'];
        $fullName = $names[array_rand($names)] . ' ' . Str::random(3);
        $phone = '08' . rand(11,19) . rand(10000000,99999999);

        $member = DB::transaction(function() use ($fullName,$phone,$branchId,$validated){
            do { $code='MBR-'.str_pad(random_int(0,999999),6,'0',STR_PAD_LEFT);} while (Member::where('member_code',$code)->exists());
            $email = strtolower(str_replace(' ','.','dev.'.Str::slug($fullName).'.'.Str::random(4))).'@trakin.local';
            $user = User::create(['name'=>$fullName,'email'=>$email,'password'=>Hash::make('password'),'branch_id'=>$branchId,'phone'=>$phone,'status'=>'active']);
            $user->syncRoles(['Member']);
            app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

            $member = Member::create([
                'user_id'=>$user->id,'branch_id'=>$branchId,'member_code'=>$code,'full_name'=>$fullName,
                'email'=>$email,'phone'=>$phone,'gender'=>rand(0,1)?'male':'female',
                'date_of_birth'=>now()->subYears(rand(20,35))->toDateString(),'status'=>'active',
            ]);
            MemberQrCode::create(['member_id'=>$member->id,'qr_token'=>'TRK-QR-'.$code,'expires_at'=>now()->addDays(365)]);

            if (!empty($validated['with_subscription'])) {
                $pkg = MembershipPackage::where('status','active')->inRandomOrder()->first() ?? MembershipPackage::first();
                if ($pkg) {
                    $sub = MembershipSubscription::create([
                        'member_id'=>$member->id,'package_id'=>$pkg->id,
                        'start_date'=>now()->toDateString(),'end_date'=>now()->addDays($pkg->duration_days)->toDateString(),
                        'price_paid'=>$pkg->price,'status'=>'active',
                    ]);
                    do { $tx='TX-DEV-'.now()->format('Ymd').'-'.str_pad(random_int(0,99999),5,'0',STR_PAD_LEFT);} while (MembershipTransaction::where('transaction_code',$tx)->exists());
                    MembershipTransaction::create([
                        'subscription_id'=>$sub->id,'member_id'=>$member->id,'transaction_code'=>$tx,
                        'payment_method'=>'cash','amount'=>$pkg->price,'status'=>'paid','paid_at'=>now(),'created_by'=>auth()->id(),'notes'=>'Dummy member subscription (Dev Mode)',
                    ]);
                }
            }
            return $member;
        });

        $this->logDevActivity('dev_create_dummy_member', "Dummy member {$member->full_name}", ['member_id'=>$member->id, 'code'=>$member->member_code]);
        return back()->with('success', "Dummy member dibuat: {$member->full_name} ({$member->member_code}) — login: {$member->email} / password");
    }

    /**
     * Helper to send FCM notifications
     */
    private function sendFcmMessages($tokens, $title, $body, array $data = [])
    {
        $sent = 0;
        $failed = 0;
        if ($tokens->isEmpty()) {
            return ['sent' => 0, 'failed' => 0];
        }

        $hasFcmV1 = false;
        $serviceAccountPath = config('services.firebase.service_account');
        if (!$serviceAccountPath) {
            $serviceAccountPath = storage_path('app/firebase/service-account.json');
        }

        if (file_exists($serviceAccountPath)) {
            try {
                $sa = json_decode(file_get_contents($serviceAccountPath), true);
                $projectId = $sa['project_id'] ?? config('services.firebase.project_id') ?? config('services.fcm.project_id');
                if (!empty($projectId)) {
                    $accessToken = $this->getGoogleAccessToken($sa);
                    $hasFcmV1 = true;
                    foreach ($tokens as $token) {
                        try {
                            $payload = [
                                'message' => [
                                    'token' => $token,
                                    'notification' => [
                                        'title' => $title,
                                        'body' => $body,
                                    ],
                                    'data' => array_merge([
                                        'title' => $title,
                                        'body' => $body,
                                    ], $data),
                                    'android' => ['priority' => 'HIGH', 'notification' => ['sound' => 'default']],
                                    'apns' => ['payload' => ['aps' => ['sound' => 'default']]],
                                ],
                            ];
                            $res = Http::withToken($accessToken)->timeout(8)->post(
                                "https://fcm.googleapis.com/v1/projects/{$projectId}/messages:send",
                                $payload
                            );
                            $res->successful() ? $sent++ : $failed++;
                        } catch (\Throwable $e) {
                            $failed++;
                        }
                    }
                }
            } catch (\Throwable $e) {
                Log::warning('FCM v1 test failed: ' . $e->getMessage());
            }
        }

        if (!$hasFcmV1) {
            $fcmKey = config('services.fcm.key');
            if ($fcmKey) {
                foreach ($tokens as $token) {
                    try {
                        $res = Http::withHeaders([
                            'Authorization' => 'key=' . $fcmKey,
                            'Content-Type' => 'application/json',
                        ])->timeout(8)->post('https://fcm.googleapis.com/fcm/send', [
                            'to' => $token,
                            'notification' => ['title' => $title, 'body' => $body, 'sound' => 'default'],
                            'data' => array_merge(['title' => $title, 'body' => $body], $data),
                            'priority' => 'high',
                        ]);
                        $res->successful() ? $sent++ : $failed++;
                    } catch (\Throwable $e) {
                        $failed++;
                    }
                }
            }
        }

        return ['sent' => $sent, 'failed' => $failed];
    }

    private function getGoogleAccessToken(array $sa): string
    {
        $header = base64_encode(json_encode(['alg' => 'RS256', 'typ' => 'JWT']));
        $now = time();
        $claims = base64_encode(json_encode([
            'iss' => $sa['client_email'],
            'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
            'aud' => 'https://oauth2.googleapis.com/token',
            'iat' => $now,
            'exp' => $now + 3600,
        ]));
        $b64 = fn($s) => rtrim(strtr(base64_encode($s), '+/', '-_'), '=');
        $unsigned = $b64(json_encode(['alg' => 'RS256', 'typ' => 'JWT'])) . '.' . $b64(json_encode([
            'iss' => $sa['client_email'],
            'scope' => 'https://www.googleapis.com/auth/firebase.messaging',
            'aud' => 'https://oauth2.googleapis.com/token',
            'iat' => $now,
            'exp' => $now + 3600,
        ]));
        $privateKey = $sa['private_key'];
        openssl_sign($unsigned, $signature, $privateKey, OPENSSL_ALGO_SHA256);
        $jwt = $unsigned . '.' . $b64($signature);
        $res = Http::asForm()->post('https://oauth2.googleapis.com/token', [
            'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
            'assertion' => $jwt,
        ]);
        if (!$res->successful()) {
            throw new \Exception('OAuth token failed: ' . $res->body());
        }
        return $res->json('access_token');
    }
}

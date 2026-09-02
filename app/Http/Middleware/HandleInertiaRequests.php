<?php

namespace App\Http\Middleware;

use App\Helpers\TimezoneHelper;
use App\Models\Setting;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();

        $systemTimezone = null;
        try {
            $systemTimezone = \Illuminate\Support\Facades\Cache::remember('system_timezone', 3600, function () {
                try {
                    return Setting::where('key', 'system_timezone')->value('value');
                } catch (\Throwable $e) {
                    return null;
                }
            });
        } catch (\Throwable $e) {
            $systemTimezone = null;
        }
        $systemTimezone = $systemTimezone ?: config('app.timezone', 'Asia/Jakarta');
        if ($systemTimezone && in_array($systemTimezone, timezone_identifiers_list(), true)) {
            try {
                date_default_timezone_set($systemTimezone);
                config(['app.timezone' => $systemTimezone]);
            } catch (\Throwable $e) {
            }
        }

        try {
            $settings = Setting::pluck('value', 'key')->toArray();
        } catch (\Throwable $e) {
            $settings = [];
        }
        if (empty($settings['system_timezone']) && $systemTimezone) {
            $settings['system_timezone'] = $systemTimezone;
        }

        $gymName = $settings['gym_name'] ?? $user?->branch?->name ?? 'Trakin Fitness Center';
        $gymTagline = $settings['gym_tagline'] ?? 'Transform Your Power & Health';
        $gymLogo = $settings['gym_logo'] ?? '';
        if ($gymLogo && !str_starts_with($gymLogo, 'http') && !str_starts_with($gymLogo, '/')) {
            $gymLogo = '/storage/' . $gymLogo;
        }

        $notifications = [];

        if ($user) {
            try {
                if (!$user->last_seen_at || $user->last_seen_at->lt(now()->subMinute())) {
                    $user->update(['last_seen_at' => now()]);
                }
            } catch (\Throwable $e) {
                // Ignore heartbeat update errors
            }

            try {
                // 1. Class Reminders (Upcoming Class within 24 Hours)
                if ($user->member) {
                    $upcomingClassReg = \App\Models\ClassRegistration::with(['schedule.gymClass'])
                        ->where('member_id', $user->member->id)
                        ->whereHas('schedule', function ($q) {
                            $q->where('start_time', '>=', now())
                              ->where('start_time', '<=', now()->addHours(24));
                        })
                        ->first();

                    if ($upcomingClassReg && $upcomingClassReg->schedule) {
                        $sch = $upcomingClassReg->schedule;
                        $className = $sch->gymClass?->name ?? 'Kelas Gym';
                        $startTime = \Carbon\Carbon::parse($sch->start_time)->format('H:i');
                        $dateStr = \Carbon\Carbon::parse($sch->start_time)->isToday() ? 'Hari ini' : 'Besok';
                        $tzAbbr = TimezoneHelper::abbr($systemTimezone);

                        $notifications[] = [
                            'id' => 'class_' . $sch->id,
                            'type' => 'class',
                            'title' => 'Reminder Kelas Gym',
                            'message' => 'Kelas "' . $className . '" terjadwal ' . $dateStr . ' pkl ' . $startTime . ' ' . $tzAbbr,
                            'time' => $dateStr . ' ' . $startTime,
                            'url' => '/member/classes',
                            'action_text' => 'Lihat Kelas',
                            'scheduled_at' => \Carbon\Carbon::parse($sch->start_time)->toIso8601String(),
                        ];
                    }
                }

                // 3. PT Session Reminders (Upcoming Scheduled PT Session today or tomorrow)
                $upcomingPtSession = null;
                if ($user->member) {
                    $upcomingPtSession = \App\Models\PtSession::with('trainer')
                        ->where('member_id', $user->member->id)
                        ->where('status', 'scheduled')
                        ->whereDate('session_date', '>=', now()->toDateString())
                        ->whereDate('session_date', '<=', now()->addDay()->toDateString())
                        ->orderBy('session_date')
                        ->orderBy('start_time')
                        ->first();
                } elseif ($user->trainer) {
                    $upcomingPtSession = \App\Models\PtSession::with('member')
                        ->where('trainer_id', $user->trainer->id)
                        ->where('status', 'scheduled')
                        ->whereDate('session_date', '>=', now()->toDateString())
                        ->whereDate('session_date', '<=', now()->addDay()->toDateString())
                        ->orderBy('session_date')
                        ->orderBy('start_time')
                        ->first();
                }

                if ($upcomingPtSession) {
                    $partnerName = $user->trainer
                        ? ($upcomingPtSession->member?->full_name ?? 'Client')
                        : ($upcomingPtSession->trainer?->full_name ?? 'Personal Trainer');
                    $sessionDate = \Carbon\Carbon::parse($upcomingPtSession->session_date)->isToday() ? 'Hari ini' : 'Besok';
                    $sessionTime = \Carbon\Carbon::parse($upcomingPtSession->start_time)->format('H:i');
                    $ptDateTimeStr = $upcomingPtSession->session_date . ' ' . $upcomingPtSession->start_time;

                    $notifications[] = [
                        'id' => 'pt_' . $upcomingPtSession->id,
                        'type' => 'pt_session',
                        'title' => 'Reminder Sesi PT',
                        'message' => 'Sesi Personal Trainer dengan ' . $partnerName . ' terjadwal ' . $sessionDate . ' pkl ' . $sessionTime,
                        'time' => $sessionDate . ' ' . $sessionTime,
                        'url' => $user->trainer ? '/dashboard' : '/member/dashboard',
                        'action_text' => 'Lihat Sesi',
                        'scheduled_at' => \Carbon\Carbon::parse($ptDateTimeStr)->toIso8601String(),
                        'is_read' => false,
                        'created_at' => \Carbon\Carbon::parse($ptDateTimeStr)->toIso8601String(),
                    ];
                }

                // 4. Database Notifications (Broadcast & Personal Announcements)
                $dbNotifs = \App\Models\Notification::where(function ($q) use ($user) {
                    $q->where('user_id', $user->id)
                      ->orWhere(function ($sub) use ($user) {
                          $sub->whereNull('user_id');
                          if ($user->created_at) {
                              $sub->where('created_at', '>=', $user->created_at->subMinutes(5));
                          }
                      });
                })
                ->where(function ($q) use ($user) {
                    if ($user->created_at) {
                        $q->where('created_at', '>=', $user->created_at->subMinutes(5));
                    }
                })
                ->orderBy('created_at', 'desc')
                ->take(30)
                ->get();

                foreach ($dbNotifs as $dbNotif) {
                    $notifications[] = [
                        'id' => 'db_' . $dbNotif->id,
                        'db_id' => $dbNotif->id,
                        'type' => $dbNotif->type ?? 'broadcast',
                        'title' => $dbNotif->title,
                        'message' => $dbNotif->message,
                        'time' => $dbNotif->created_at ? $dbNotif->created_at->diffForHumans() : 'Baru saja',
                        'is_read' => (bool) $dbNotif->is_read,
                        'url' => '/member/dashboard',
                        'action_text' => 'Lihat',
                        'created_at' => $dbNotif->created_at ? $dbNotif->created_at->toIso8601String() : now()->toIso8601String(),
                    ];
                }
            } catch (\Throwable $e) {
                \Log::error('Error building shared notifications: ' . $e->getMessage());
            }
        }

        $featureFlags = [
            'feature_class_booking' => ($settings['feature_class_booking'] ?? '1') !== '0',
            'feature_pt_booking' => ($settings['feature_pt_booking'] ?? '1') !== '0',
            'feature_pos_module' => ($settings['feature_pos_module'] ?? '1') !== '0',
            'feature_kiosk_qr' => ($settings['feature_kiosk_qr'] ?? '1') !== '0',
            'feature_auto_notifications' => ($settings['feature_auto_notifications'] ?? '1') !== '0',
            'feature_maintenance_mode' => ($settings['feature_maintenance_mode'] ?? '0') === '1',
        ];

        return array_merge(parent::share($request), [
            'gym_name' => $gymName,
            'gym_tagline' => $gymTagline,
            'gym_logo' => $gymLogo,
            'feature_flags' => $featureFlags,
            'gym_settings' => [
                'gym_name' => $gymName,
                'gym_tagline' => $gymTagline,
                'gym_logo' => $gymLogo,
                'gym_address' => $settings['gym_address'] ?? '',
                'gym_phone' => $settings['gym_phone'] ?? '',
                'gym_email' => $settings['gym_email'] ?? '',
                'system_timezone' => $systemTimezone,
                'system_date_format' => $settings['system_date_format'] ?? 'd/m/Y',
                'system_time_format' => $settings['system_time_format'] ?? 'H:i',
                'pos_receipt_gym_name' => $settings['pos_receipt_gym_name'] ?? $gymName,
                'pos_receipt_address' => $settings['pos_receipt_address'] ?? ($settings['gym_address'] ?? ''),
                'pos_receipt_phone' => $settings['pos_receipt_phone'] ?? ($settings['gym_phone'] ?? ''),
                'pos_receipt_footer_title' => $settings['pos_receipt_footer_title'] ?? 'TERIMA KASIH',
                'pos_receipt_footer_note' => $settings['pos_receipt_footer_note'] ?? 'Selamat Berolahraga & Stay Fit!',
                'pos_receipt_show_tax' => $settings['pos_receipt_show_tax'] ?? '1',
            ],
            'notifications' => $notifications,
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'photo' => $user->photo,
                    'roles' => $user->getRoleNames(),
                    'branch' => $user->branch ? [
                        'id' => $user->branch->id,
                        'name' => $gymName,
                        'code' => $user->branch->code,
                    ] : null,
                    'member' => $user->member ? [
                        'id' => $user->member->id,
                        'member_code' => $user->member->member_code,
                        'status' => $user->member->status,
                        'qr_token' => $user->member->qrCode ? $user->member->qrCode->qr_token : null,
                    ] : null,
                    'trainer' => $user->trainer ? [
                        'id' => $user->trainer->id,
                        'trainer_code' => $user->trainer->trainer_code,
                        'specialization' => $user->trainer->specialization,
                    ] : null,
                ] : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ]);
    }
}

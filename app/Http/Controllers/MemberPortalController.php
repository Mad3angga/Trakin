<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\ClassRegistration;
use App\Models\ClassSchedule;
use App\Models\Member;
use App\Models\MembershipTransaction;
use App\Models\Trainer;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class MemberPortalController extends Controller
{
    public function dashboard()
    {
        $user = auth()->user();
        $member = Member::with(['activeSubscription.package', 'qrCode', 'branch'])
            ->where('user_id', $user->id)
            ->first();

        if (!$member) {
            return Inertia::render('Member/Dashboard', [
                'member' => null,
                'activeSubscription' => null,
                'upcomingClasses' => [],
                'recentAttendances' => [],
                'activeAttendance' => null,
                'streak' => ['weekly_streak' => 0, 'monthly_checkins' => 0, 'total_checkins' => 0, 'week_days' => []],
            ]);
        }

        $activeSubscription = $member->activeSubscription;

        $upcomingClasses = ClassRegistration::with(['schedule.gymClass', 'schedule.trainer'])
            ->where('member_id', $member->id)
            ->whereHas('schedule', function ($q) {
                $q->where('start_time', '>=', now());
            })
            ->get();

        $recentAttendances = Attendance::where('member_id', $member->id)
            ->latest('check_in_time')
            ->limit(5)
            ->get();

        $activeAttendance = Attendance::where('member_id', $member->id)
            ->where('status', 'checked_in')
            ->latest('check_in_time')
            ->first();

        // Calculate Weekly Workout Streak (Consecutive weeks checked in)
        $weeks = Attendance::where('member_id', $member->id)
            ->pluck('check_in_time')
            ->map(fn($t) => Carbon::parse($t)->format('Y-W'))
            ->unique()
            ->sortDesc()
            ->values()
            ->toArray();

        $weeklyStreak = 0;
        $currentWeek = Carbon::now()->format('Y-W');
        $previousWeek = Carbon::now()->subWeek()->format('Y-W');

        if (!empty($weeks)) {
            $checkWeek = in_array($currentWeek, $weeks) ? Carbon::now() : (in_array($previousWeek, $weeks) ? Carbon::now()->subWeek() : null);

            if ($checkWeek) {
                while (in_array($checkWeek->format('Y-W'), $weeks)) {
                    $weeklyStreak++;
                    $checkWeek->subWeek();
                }
            }
        }

        // Calculate 7-Day Week Activity Status (M T W T F S S)
        $startOfWeek = Carbon::now()->startOfWeek();
        $endOfWeek = Carbon::now()->endOfWeek();

        $attendancesThisWeek = Attendance::where('member_id', $member->id)
            ->whereBetween('check_in_time', [$startOfWeek, $endOfWeek])
            ->pluck('check_in_time')
            ->map(fn($t) => Carbon::parse($t)->format('Y-m-d'))
            ->unique()
            ->toArray();

        $dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
        $weekDays = [];

        for ($d = 0; $d < 7; $d++) {
            $dateObj = (clone $startOfWeek)->addDays($d);
            $dateStr = $dateObj->toDateString();
            $weekDays[] = [
                'day' => $dayLabels[$d],
                'date' => $dateStr,
                'active' => in_array($dateStr, $attendancesThisWeek),
                'is_today' => $dateStr === Carbon::today()->toDateString(),
            ];
        }

        $monthlyCheckIns = Attendance::where('member_id', $member->id)
            ->whereMonth('check_in_time', now()->month)
            ->whereYear('check_in_time', now()->year)
            ->count();

        $totalCheckIns = Attendance::where('member_id', $member->id)->count();

        $trainers = Trainer::with('user')
            ->where('status', 'active')
            ->get()
            ->map(function ($tr) {
                return [
                    'id' => $tr->id,
                    'full_name' => $tr->full_name,
                    'specialization' => $tr->specialization,
                    'phone' => $tr->phone ?: ($tr->user?->phone ?: null),
                    'email' => $tr->email ?: ($tr->user?->email ?: null),
                    'bio' => $tr->bio,
                    'photo' => $tr->photo ?: ($tr->user?->photo ?: null),
                    'portrait_photo' => $tr->portrait_photo ?: null,
                ];
            });

        return Inertia::render('Member/Dashboard', [
            'user' => $user,
            'member' => $member,
            'activeSubscription' => $activeSubscription ? [
                'package_name' => $activeSubscription->package->name,
                'start_date' => $activeSubscription->start_date,
                'end_date' => $activeSubscription->end_date,
                'status' => $activeSubscription->status,
                'days_left' => max(0, (int) now()->diffInDays(Carbon::parse($activeSubscription->end_date), false)),
            ] : null,
            'upcomingClasses' => $upcomingClasses,
            'recentAttendances' => $recentAttendances,
            'trainers' => $trainers,
            'activeAttendance' => $activeAttendance ? [
                'id' => $activeAttendance->id,
                'check_in_time' => $activeAttendance->check_in_time,
            ] : null,
            'streak' => [
                'weekly_streak' => $weeklyStreak,
                'monthly_checkins' => $monthlyCheckIns,
                'total_checkins' => $totalCheckIns,
                'week_days' => $weekDays,
            ],
        ]);
    }

    public function classes()
    {
        $user = auth()->user();
        $member = Member::where('user_id', $user->id)->first();

        $schedules = ClassSchedule::with(['gymClass', 'trainer.user', 'registrations.member.user'])
            ->where('start_time', '>=', now()->subHours(2))
            ->orderBy('start_time')
            ->get()
            ->map(function ($schedule) use ($member) {
                $registered = $member ? $schedule->registrations->contains('member_id', $member->id) : false;
                
                $attendees = $schedule->registrations->map(function ($reg) {
                    return [
                        'id' => $reg->member_id,
                        'name' => $reg->member?->full_name ?? ($reg->member?->user?->name ?? 'Member'),
                        'photo' => $reg->member?->photo ?? ($reg->member?->user?->photo ?? null),
                    ];
                });

                return array_merge($schedule->toArray(), [
                    'is_registered' => $registered,
                    'available_slots' => max(0, $schedule->max_capacity - $schedule->registrations->count()),
                    'attendees' => $attendees,
                    'trainer_photo' => $schedule->trainer?->portrait_photo ?: ($schedule->trainer?->photo ?: ($schedule->trainer?->user?->photo ?: null)),
                ]);
            });

        return Inertia::render('Member/Classes', [
            'schedules' => $schedules,
            'member' => $member,
        ]);
    }

    public function bookClass(Request $request, ClassSchedule $schedule)
    {
        $user = auth()->user();
        $member = Member::where('user_id', $user->id)->first();

        if (!$member) {
            return back()->with('error', 'Profil member tidak ditemukan.');
        }

        if (!$member->activeSubscription) {
            return back()->with('error', 'Anda harus memiliki paket membership aktif untuk mendaftar kelas.');
        }

        if ($schedule->registrations()->count() >= $schedule->max_capacity) {
            return back()->with('error', 'Kelas ini sudah penuh.');
        }

        $already = ClassRegistration::where('class_schedule_id', $schedule->id)
            ->where('member_id', $member->id)
            ->exists();

        if ($already) {
            return back()->with('error', 'Anda sudah terdaftar di kelas ini.');
        }

        ClassRegistration::create([
            'class_schedule_id' => $schedule->id,
            'member_id' => $member->id,
            'status' => 'registered',
        ]);

        return back()->with('success', 'Berhasil mendaftar kelas!');
    }

    public function cancelClass(Request $request, ClassSchedule $schedule)
    {
        return back()->with('error', 'Pendaftaran kelas bersifat permanen dan tidak dapat dibatalkan.');
    }

    public function trainers(Request $request)
    {
        $user = auth()->user();
        $member = Member::where('user_id', $user->id)->first();

        $trainers = Trainer::with(['user', 'classSchedules.gymClass'])
            ->where('status', 'active')
            ->get()
            ->map(function ($tr) {
                $upcomingClasses = $tr->classSchedules
                    ->where('start_time', '>=', now())
                    ->sortBy('start_time')
                    ->take(3)
                    ->map(fn($cs) => [
                        'id' => $cs->id,
                        'name' => $cs->gymClass?->name,
                        'start_time' => $cs->start_time,
                        'room' => $cs->room,
                    ])->values();

                return [
                    'id' => $tr->id,
                    'full_name' => $tr->full_name,
                    'specialization' => $tr->specialization,
                    'phone' => $tr->phone ?: ($tr->user?->phone ?: null),
                    'email' => $tr->email ?: ($tr->user?->email ?: null),
                    'bio' => $tr->bio,
                    'skills' => $tr->skills,
                    'achievements' => $tr->achievements,
                    'photo' => $tr->photo ?: ($tr->user?->photo ?: null),
                    'portrait_photo' => $tr->portrait_photo ?: null,
                    'trainer_code' => $tr->trainer_code,
                    'classes' => $upcomingClasses,
                ];
            });

        return Inertia::render('Member/Trainers', [
            'trainers' => $trainers,
            'member' => $member,
            'selectedId' => $request->query('select'),
        ]);
    }

    public function history()
    {
        $user = auth()->user();
        $member = Member::where('user_id', $user->id)->first();

        $attendances = $member ? Attendance::where('member_id', $member->id)->latest('check_in_time')->paginate(10) : [];
        $transactions = $member ? MembershipTransaction::with('subscription.package')->where('member_id', $member->id)->latest()->get() : [];

        return Inertia::render('Member/History', [
            'attendances' => $attendances,
            'transactions' => $transactions,
        ]);
    }

    public function profile()
    {
        $user = auth()->user();
        $user->load('roles');
        $member = Member::with(['activeSubscription.package', 'branch'])
            ->where('user_id', $user->id)
            ->first();
        $trainer = Trainer::where('user_id', $user->id)->first();

        return Inertia::render('Member/Profile', [
            'user' => array_merge($user->toArray(), [
                'roles' => $user->getRoleNames(),
            ]),
            'member' => $member,
            'trainer' => $trainer,
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = auth()->user();
        $member = Member::where('user_id', $user->id)->first();
        $trainer = Trainer::where('user_id', $user->id)->first();

        $rules = [
            'display_name' => 'required|string|max:100',
            'phone' => 'nullable|string|max:20',
            'photo' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:3072',
        ];

        if ($request->filled('password')) {
            $rules['password'] = 'required|string|min:8|confirmed';
            $rules['current_password'] = 'required|string|current_password';
        }

        $validated = $request->validate($rules);

        // Handle Profile Photo Upload - works for ALL roles (Owner, Manager, Front Desk, Trainer, Member)
        if ($request->hasFile('photo')) {
            $file = $request->file('photo');
            $extension = strtolower($file->extension() ?: 'jpg');
            if (!in_array($extension, ['jpg','jpeg','png','webp'], true)) $extension = 'jpg';
            $filename = 'profile_' . $user->id . '_' . time() . '_' . \Illuminate\Support\Str::random(8) . '.' . $extension;
            // Delete old photo to prevent orphan accumulation
            if (!empty($user->photo) && str_starts_with($user->photo, '/storage/uploads/profiles/')) {
                $old = str_replace('/storage/', '', $user->photo);
                \Illuminate\Support\Facades\Storage::disk('public')->delete($old);
            }
            $file->storeAs('uploads/profiles', $filename, 'public');
            $photoPath = '/storage/uploads/profiles/' . $filename;

            $user->photo = $photoPath;
            if ($member) {
                $member->photo = $photoPath;
            }
            if ($trainer) {
                $trainer->photo = $photoPath;
            }
        }

        // Update Display Name (User->name) and phone for ALL roles
        $user->name = $validated['display_name'];
        if (array_key_exists('phone', $validated)) {
            $user->phone = $validated['phone'];
        }
        if (!empty($validated['password'])) {
            $user->password = bcrypt($validated['password']);
        }
        $user->save();

        if ($member) {
            if (array_key_exists('phone', $validated)) {
                $member->phone = $validated['phone'];
            }
            $member->save();
        }

        if ($trainer) {
            if (array_key_exists('phone', $validated)) {
                $trainer->phone = $validated['phone'];
            }
            $trainer->save();
        }

        return back()->with('success', 'Profil, Foto, dan Display Name berhasil diperbarui!');
    }

    public function deletePhoto(Request $request)
    {
        $user = auth()->user();
        $member = Member::where('user_id', $user->id)->first();
        $trainer = Trainer::where('user_id', $user->id)->first();

        if (!empty($user->photo) && str_starts_with($user->photo, '/storage/uploads/profiles/')) {
            $old = str_replace('/storage/', '', $user->photo);
            \Illuminate\Support\Facades\Storage::disk('public')->delete($old);
        }
        $user->photo = null;
        $user->save();

        if ($member && !empty($member->photo)) {
            if (str_starts_with($member->photo, '/storage/uploads/profiles/')) {
                $old = str_replace('/storage/', '', $member->photo);
                \Illuminate\Support\Facades\Storage::disk('public')->delete($old);
            }
            $member->photo = null;
            $member->save();
        }
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

    public function clearAllNotifications(Request $request)
    {
        $user = auth()->user();
        if ($user) {
            \App\Models\Notification::where('user_id', $user->id)->delete();
        }

        return back();
    }

    public function markNotificationRead($id)
    {
        $user = auth()->user();
        if (str_starts_with($id, 'db_')) {
            $dbId = substr($id, 3);
            \App\Models\Notification::where('id', $dbId)
                ->where('user_id', $user->id)
                ->update(['is_read' => true]);
        }
        return back();
    }

    public function markAllNotificationsRead()
    {
        $user = auth()->user();
        if ($user) {
            \App\Models\Notification::where('user_id', $user->id)
            ->update(['is_read' => true]);
        }

        return back();
    }

    public function destroyNotification($id)
    {
        $user = auth()->user();
        if (str_starts_with($id, 'db_')) {
            $dbId = substr($id, 3);
            \App\Models\Notification::where('id', $dbId)
                ->where('user_id', $user->id)
                ->delete();
        }
        return back();
    }
}


<?php

namespace App\Http\Controllers;

use App\Models\Member;
use App\Models\PtPackage;
use App\Models\PtSession;
use App\Models\PtSubscription;
use App\Models\Trainer;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Inertia\Inertia;

class PtSessionController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $isTrainer = $user->hasRole('Trainer');
        $trainer = $isTrainer ? Trainer::where('user_id', $user->id)->first() : null;

        $month = (int) $request->input('month', now()->month);
        $year = (int) $request->input('year', now()->year);

        $selectedDateObj = Carbon::createFromDate($year, $month, 1);
        $startOfMonth = (clone $selectedDateObj)->startOfMonth();
        $endOfMonth = (clone $selectedDateObj)->endOfMonth();

        $startGrid = (clone $startOfMonth)->startOfWeek();
        $endGrid = (clone $endOfMonth)->endOfWeek();

        // 1. Fetch Calendar Sessions for month
        $allCalendarSessionsQuery = PtSession::with(['trainer:id,full_name', 'member:id,full_name,member_code'])
            ->whereBetween('session_date', [$startGrid->toDateString(), $endGrid->toDateString()]);

        if ($isTrainer && $trainer) {
            $allCalendarSessionsQuery->where('trainer_id', $trainer->id);
        }

        if ($request->filled('trainer_id')) {
            $allCalendarSessionsQuery->where('trainer_id', $request->trainer_id);
        }

        $allCalendarSessions = $allCalendarSessionsQuery->get();

        // 2. Fetch Sessions List Table
        $query = PtSession::with(['trainer', 'member', 'subscription']);

        if ($isTrainer && $trainer) {
            $query->where('trainer_id', $trainer->id);
        }

        if ($request->filled('trainer_id')) {
            $query->where('trainer_id', $request->trainer_id);
        }

        if ($request->filled('member_id')) {
            $query->where('member_id', $request->member_id);
        }

        $defaultDate = $request->input('date');
        if ($defaultDate) {
            $query->whereDate('session_date', $defaultDate);
        }

        $rawSessions = $query->orderBy('session_date', 'desc')->orderBy('start_time', 'asc')->get();

        // Group sessions with identical trainer, date, start_time, and end_time into 1 row
        $grouped = $rawSessions->groupBy(function ($item) {
            return $item->trainer_id . '_' . $item->session_date . '_' . $item->start_time . '_' . $item->end_time;
        })->map(function ($group) {
            $first = $group->first();
            $memberNames = $group->pluck('member.full_name')->filter()->unique()->join(' & ');
            $memberCodes = $group->pluck('member.member_code')->filter()->unique()->join(' • ');
            $sessionIds = $group->pluck('id')->toArray();

            return [
                'id' => $first->id,
                'session_ids' => $sessionIds,
                'is_group' => $group->count() > 1,
                'member_count' => $group->count(),
                'trainer' => $first->trainer,
                'member' => [
                    'id' => $first->member_id,
                    'full_name' => $memberNames ?: ($first->member?->full_name ?? '—'),
                    'member_code' => $memberCodes ?: ($first->member?->member_code ?? '—'),
                ],
                'session_date' => $first->session_date,
                'start_time' => $first->start_time,
                'end_time' => $first->end_time,
                'status' => $first->status,
                'notes' => $first->notes,
                'created_at' => $first->created_at,
            ];
        })->values();

        $page = (int)$request->input('page', 1);
        $perPage = 10;
        $ptSessions = new \Illuminate\Pagination\LengthAwarePaginator(
            $grouped->forPage($page, $perPage)->values(),
            $grouped->count(),
            $perPage,
            $page,
            ['path' => $request->url(), 'query' => $request->query()]
        );

        $trainers = Trainer::where('status', 'active')->get();
        $members = Member::where('status', 'active')->get();
        $ptPackages = PtPackage::where('status', 'active')->get();

        return Inertia::render('Admin/PersonalTrainer/Index', [
            'ptSessions' => $ptSessions,
            'allCalendarSessions' => $allCalendarSessions,
            'trainers' => $trainers,
            'members' => $members,
            'ptPackages' => $ptPackages,
            'filters' => [
                'trainer_id' => $request->input('trainer_id', ''),
                'member_id' => $request->input('member_id', ''),
                'date' => $defaultDate,
                'month' => $month,
                'year' => $year,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $user = auth()->user();
        if ($user->hasRole('Trainer')) {
            $trainer = Trainer::where('user_id', $user->id)->first() ?? Trainer::first();
            if ($trainer) {
                $request->merge(['trainer_id' => $trainer->id]);
            }
        }

        $validated = $request->validate([
            'trainer_id' => 'required|exists:trainers,id',
            'member_id' => 'required|exists:members,id',
            'secondary_member_id' => 'nullable|exists:members,id|different:member_id',
            'session_date' => 'required|date',
            'start_time' => 'required',
            'end_time' => 'required',
            'notes' => 'nullable|string|max:255',
            'pt_package_id' => 'nullable|exists:pt_packages,id',
        ]);

        $member1 = Member::find($validated['member_id']);
        $member2 = !empty($validated['secondary_member_id']) ? Member::find($validated['secondary_member_id']) : null;

        $notesText = $validated['notes'] ?? 'Sesi Latihan Personal Trainer';
        if ($member2) {
            $notesText = 'Semi-Private PT (Berdua: ' . $member1->full_name . ' & ' . $member2->full_name . ') - ' . $notesText;
        }

        // Handle Member 1 Subscription & Session
        $this->createSessionForMember($validated['member_id'], $validated['trainer_id'], $validated, $notesText);

        // Handle Member 2 (if Semi-Private / Berdua)
        if ($member2) {
            $this->createSessionForMember($member2->id, $validated['trainer_id'], $validated, $notesText);
        }

        return back()->with('success', $member2 ? 'Jadwal Sesi PT Berdua (Semi-Private) berhasil ditambahkan!' : 'Jadwal Sesi Personal Trainer berhasil ditambahkan!');
    }

    private function createSessionForMember($memberId, $trainerId, array $validated, string $notesText)
    {
        $subscription = PtSubscription::where('member_id', $memberId)
            ->where('trainer_id', $trainerId)
            ->where('status', 'active')
            ->first();

        if (!$subscription) {
            $package = PtPackage::first() ?? PtPackage::create([
                'name' => 'Paket Private PT 10 Sesi',
                'total_sessions' => 10,
                'price' => 1500000,
                'validity_days' => 30,
                'status' => 'active',
            ]);

            $subscription = PtSubscription::create([
                'member_id' => $memberId,
                'trainer_id' => $trainerId,
                'pt_package_id' => $validated['pt_package_id'] ?? $package->id,
                'total_sessions' => $package->total_sessions,
                'remaining_sessions' => max(0, $package->total_sessions - 1),
                'price_paid' => (float) $package->price,
                'payment_method' => $validated['payment_method'] ?? 'cash',
                'payment_status' => 'paid',
                'start_date' => Carbon::parse($validated['session_date'])->toDateString(),
                'end_date' => Carbon::parse($validated['session_date'])->addDays($package->validity_days)->toDateString(),
                'status' => 'active',
            ]);
        } else {
            if ($subscription->remaining_sessions > 0) {
                $subscription->decrement('remaining_sessions');
            }
        }

        PtSession::create([
            'pt_subscription_id' => $subscription->id,
            'member_id' => $memberId,
            'trainer_id' => $trainerId,
            'session_date' => $validated['session_date'],
            'start_time' => $validated['start_time'],
            'end_time' => $validated['end_time'],
            'status' => 'scheduled',
            'notes' => $notesText,
        ]);
    }

    public function create()
    {
        $trainers = Trainer::where('status', 'active')->get();
        if ($trainers->isEmpty()) {
            $trainers = Trainer::all();
        }

        $members = Member::where('status', 'active')->get();
        if ($members->isEmpty()) {
            $members = Member::all();
        }

        $ptPackages = PtPackage::where('status', 'active')->get();
        if ($ptPackages->isEmpty()) {
            $ptPackages = PtPackage::all();
        }

        $existingSessions = PtSession::with(['member:id,full_name,member_code', 'trainer:id,full_name'])
            ->whereIn('status', ['scheduled', 'confirmed'])
            ->where('session_date', '>=', now()->subDays(60)->toDateString())
            ->get();

        return Inertia::render('Admin/PersonalTrainer/Create', [
            'trainers' => $trainers,
            'members' => $members,
            'ptPackages' => $ptPackages,
            'existingSessions' => $existingSessions,
        ]);
    }

    public function storeMultiple(Request $request)
    {
        $user = auth()->user();
        if ($user->hasRole('Trainer')) {
            $trainer = Trainer::where('user_id', $user->id)->first() ?? Trainer::first();
            if ($trainer) {
                $request->merge(['trainer_id' => $trainer->id]);
            }
        }

        $validated = $request->validate([
            'trainer_id' => 'required|exists:trainers,id',
            'member_id' => 'required|exists:members,id',
            'secondary_member_id' => 'nullable|exists:members,id|different:member_id',
            'pt_package_id' => 'nullable|exists:pt_packages,id',
            'notes' => 'nullable|string|max:255',
            'sessions' => 'required|array|min:1',
            'sessions.*.date' => 'required|date',
            'sessions.*.start_time' => 'required',
            'sessions.*.end_time' => 'required',
        ]);

        $member1 = Member::find($validated['member_id']);
        $member2 = !empty($validated['secondary_member_id']) ? Member::find($validated['secondary_member_id']) : null;

        $activePackages = PtPackage::where('status', 'active')->orderBy('total_sessions', 'asc')->get();
        $minPackage = $activePackages->first();
        $minSessions = $minPackage ? (int) $minPackage->total_sessions : 1;

        $sessionCount = count($validated['sessions']);

        if ($minPackage && $sessionCount < $minSessions) {
            return back()->withErrors([
                'sessions' => "Jumlah sesi ({$sessionCount} sesi) tidak valid. Minimal pemesanan sesi PT adalah {$minSessions} sesi mengikuti paket sesi terkecil yang tersedia di gym ({$minPackage->name})."
            ])->with('error', "Jumlah sesi tidak valid! Minimal pemesanan adalah {$minSessions} sesi ({$minPackage->name}).");
        }

        $package = null;
        if (!empty($validated['pt_package_id'])) {
            $package = PtPackage::find($validated['pt_package_id']);
        }
        if (!$package || $package->total_sessions != $sessionCount) {
            $exactPackage = PtPackage::where('total_sessions', $sessionCount)->where('status', 'active')->first();
            if ($exactPackage) {
                $package = $exactPackage;
            }
        }
        if (!$package) {
            $firstPkg = PtPackage::where('status', 'active')->first();
            $unitRate = $firstPkg && $firstPkg->total_sessions > 0 ? ($firstPkg->price / $firstPkg->total_sessions) : 150000;
            $estimatedPrice = round($unitRate * $sessionCount);

            $package = PtPackage::create([
                'name' => 'Paket PT ' . $sessionCount . ' Sesi',
                'total_sessions' => $sessionCount,
                'price' => $estimatedPrice,
                'validity_days' => max(30, $sessionCount * 4),
                'status' => 'active',
            ]);
        }

        $token = 'pt_book_' . Str::random(24);
        $trainer = Trainer::find($validated['trainer_id']);

        $bookingData = [
            'token' => $token,
            'trainer_id' => (int) $validated['trainer_id'],
            'member_id' => (int) $validated['member_id'],
            'secondary_member_id' => !empty($validated['secondary_member_id']) ? (int) $validated['secondary_member_id'] : null,
            'pt_package_id' => (int) $package->id,
            'package_name' => $package->name,
            'price' => (float) $package->price,
            'session_count' => $sessionCount,
            'notes' => $validated['notes'] ?? null,
            'sessions' => $validated['sessions'],
            'sold_by_id' => $trainer?->user_id ?? null,
        ];

        Cache::put($token, $bookingData, now()->addHours(6));

        $soldByParam = ($trainer && $trainer->user_id) ? '&sold_by_id=' . $trainer->user_id : '';

        return redirect('/pos?member_id=' . $member1->id . '&pt_package_id=' . $package->id . '&pt_booking_token=' . $token . $soldByParam)
            ->with('success', "Jadwal {$sessionCount} sesi PT untuk {$member1->full_name} siap dibayar. Selesaikan pembayaran di POS untuk mengonfirmasi jadwal.");
    }

    public function cancel(PtSession $ptSession)
    {
        $sessionDateTime = Carbon::parse($ptSession->session_date . ' ' . $ptSession->start_time);
        if ($sessionDateTime->isPast()) {
            return back()->with('error', 'Sesi Personal Trainer yang jamnya sudah lewat tidak dapat dibatalkan.');
        }

        PtSession::where('trainer_id', $ptSession->trainer_id)
            ->where('session_date', $ptSession->session_date)
            ->where('start_time', $ptSession->start_time)
            ->where('end_time', $ptSession->end_time)
            ->update(['status' => 'cancelled']);

        return back()->with('success', 'Sesi Personal Trainer dibatalkan.');
    }
}

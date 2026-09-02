<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\ClassSchedule;
use App\Models\Expense;
use App\Models\Member;
use App\Models\MembershipSubscription;
use App\Models\Product;
use App\Models\PtSession;
use App\Models\Sale;
use App\Models\Trainer;
use App\Helpers\TimezoneHelper;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function index(Request $request)
    {
        $today = now()->toDateString();
        $user = auth()->user();
        $isTrainer = $user->hasRole('Trainer');

        if ($isTrainer) {
            $trainer = Trainer::where('user_id', $user->id)->first();
            $trainerId = $trainer?->id;

            $month = (int) $request->input('month', now()->month);
            $year = (int) $request->input('year', now()->year);

            $selectedDateObj = Carbon::createFromDate($year, $month, 1);
            $startOfMonth = (clone $selectedDateObj)->startOfMonth();
            $endOfMonth = (clone $selectedDateObj)->endOfMonth();

            // Calendar grid boundaries (Monday to Sunday)
            $startGrid = (clone $startOfMonth)->startOfWeek();
            $endGrid = (clone $endOfMonth)->endOfWeek();

            // Fetch PT Sessions for Coach
            $ptSessions = PtSession::with(['member'])
                ->when($trainerId, function ($q) use ($trainerId) {
                    $q->where('trainer_id', $trainerId);
                })
                ->whereBetween('session_date', [$startGrid->toDateString(), $endGrid->toDateString()])
                ->get();

            // Fetch Class Schedules
            $classSchedules = ClassSchedule::with(['gymClass', 'registrations.member'])
                ->when($trainerId, function ($q) use ($trainerId) {
                    $q->where('trainer_id', $trainerId);
                })
                ->whereBetween('start_time', [$startGrid->toDateTimeString(), $endGrid->toDateTimeString()])
                ->get();

            // Group calendar events by date 'YYYY-MM-DD'
            $calendarEvents = [];

            // Group PT sessions by date & time slot so 2-on-1 PT sessions merge into one card
            $groupedPtSessions = [];
            foreach ($ptSessions as $sess) {
                $groupKey = $sess->session_date . '_' . substr($sess->start_time, 0, 5) . '_' . substr($sess->end_time, 0, 5);
                if (!isset($groupedPtSessions[$groupKey])) {
                    $groupedPtSessions[$groupKey] = [];
                }
                $groupedPtSessions[$groupKey][] = $sess;
            }

            $tzAbbr = TimezoneHelper::currentAbbr();
            foreach ($groupedPtSessions as $groupKey => $sessions) {
                $firstSess = $sessions[0];
                $dateKey = $firstSess->session_date;

                if (!isset($calendarEvents[$dateKey])) {
                    $calendarEvents[$dateKey] = [];
                }

                $timeStr = substr($firstSess->start_time, 0, 5) . '-' . substr($firstSess->end_time, 0, 5);
                $isMulti = count($sessions) > 1;

                if ($isMulti) {
                    $names = array_map(fn($s) => $s->member?->full_name ?? 'Client PT', $sessions);
                    $title = '2to1 - ' . implode(' & ', $names);
                    $clientName = implode(' & ', $names);
                    $codes = implode(', ', array_map(fn($s) => $s->member?->member_code ?? 'MBR-GUEST', $sessions));
                    $phones = implode(', ', array_map(fn($s) => $s->member?->phone ?? '—', $sessions));

                    $calendarEvents[$dateKey][] = [
                        'id' => 'pt-group-' . $firstSess->id,
                        'title' => $title,
                        'time' => $timeStr,
                        'type' => 'pt',
                        'color' => 'blue',
                        'status' => $firstSess->status,
                        'details' => [
                            'type_label' => 'Sesi Personal Trainer Berdua (2-on-1)',
                            'client_name' => $clientName,
                            'member_code' => $codes,
                            'phone' => $phones,
                            'email' => '—',
                            'date' => Carbon::parse($firstSess->session_date)->format('Y-m-d'),
                            'time' => $timeStr . ' ' . $tzAbbr,
                            'notes' => $firstSess->notes ?? 'Sesi Latihan Personal Trainer Berdua',
                            'status' => $firstSess->status,
                        ],
                    ];
                } else {
                    $calendarEvents[$dateKey][] = [
                        'id' => 'pt-' . $firstSess->id,
                        'title' => '1to1 - ' . ($firstSess->member?->full_name ?? 'Client PT'),
                        'time' => $timeStr,
                        'type' => 'pt',
                        'color' => 'blue',
                        'status' => $firstSess->status,
                        'details' => [
                            'type_label' => 'Sesi Personal Trainer (1-on-1)',
                            'client_name' => $firstSess->member?->full_name ?? 'Member Client',
                            'member_code' => $firstSess->member?->member_code ?? 'MBR-GUEST',
                            'phone' => $firstSess->member?->phone ?? '—',
                            'email' => $firstSess->member?->email ?? '—',
                            'date' => Carbon::parse($firstSess->session_date)->format('Y-m-d'),
                            'time' => $timeStr . ' ' . $tzAbbr,
                            'notes' => $firstSess->notes ?? 'Sesi Latihan Fitness & Strength',
                            'status' => $firstSess->status,
                        ],
                    ];
                }
            }

            foreach ($classSchedules as $cls) {
                $dateKey = Carbon::parse($cls->start_time)->toDateString();
                if (!isset($calendarEvents[$dateKey])) {
                    $calendarEvents[$dateKey] = [];
                }
                $calendarEvents[$dateKey][] = [
                    'id' => 'cls-' . $cls->id,
                    'title' => $cls->gymClass?->name ?? 'Kelas Gym',
                    'time' => Carbon::parse($cls->start_time)->format('H:i') . '-' . Carbon::parse($cls->end_time)->format('H:i'),
                    'type' => 'class',
                    'color' => 'pink',
                    'status' => $cls->status,
                    'details' => [
                        'type_label' => 'Jadwal Kelas Gym',
                        'class_name' => $cls->gymClass?->name ?? 'Kelas Fitness',
                        'category' => $cls->gymClass?->category ?? 'Umum',
                        'room' => $cls->room ?? 'Utama',
                        'date' => Carbon::parse($cls->start_time)->format('Y-m-d H:i'),
                        'time' => Carbon::parse($cls->start_time)->format('H:i') . ' - ' . Carbon::parse($cls->end_time)->format('H:i') . ' ' . $tzAbbr,
                        'capacity' => ($cls->registrations->count()) . ' / ' . $cls->max_capacity . ' Peserta',
                        'participants' => $cls->registrations->map(fn($r) => $r->member?->full_name)->filter()->values(),
                        'status' => $cls->status,
                    ],
                ];
            }

            $members = Member::where('status', 'active')->get();

            return Inertia::render('Admin/Dashboard', [
                'isTrainer' => true,
                'trainer' => $trainer,
                'members' => $members,
                'calendarEvents' => $calendarEvents,
                'selectedMonth' => $month,
                'selectedYear' => $year,
                'startGridDate' => $startGrid->toDateString(),
                'endGridDate' => $endGrid->toDateString(),
                'metrics' => [
                    'activeClassesCount' => $classSchedules->count(),
                    'totalPtSessions' => $ptSessions->count(),
                ],
            ]);
        }

        // Key Metrics for Owner, Manager, Front Desk
        $totalMembers = Member::count();
        $activeMembers = Member::where('status', 'active')->count();
        $todayRevenue = Sale::whereDate('created_at', $today)->where('payment_status', 'paid')->sum('total_amount');
        $todayAttendance = Attendance::whereDate('check_in_time', $today)->count();
        $activeClassesCount = ClassSchedule::whereDate('start_time', $today)->count();
        $monthExpenses = Expense::whereBetween('expense_date', [now()->startOfMonth()->toDateString(), now()->endOfMonth()->toDateString()])->sum('amount');

        // Expiring memberships in next 7 days
        $expiringMemberships = MembershipSubscription::with(['member', 'package'])
            ->where('status', 'active')
            ->whereBetween('end_date', [$today, now()->addDays(7)->toDateString()])
            ->limit(5)
            ->get();

        // Low Stock Products
        $lowStockProducts = Product::whereColumn('stock', '<=', 'min_stock')
            ->limit(5)
            ->get();

        // Revenue trend for past 7 days
        $revenueChartData = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $dateStr = $date->toDateString();
            $posRev = Sale::whereDate('created_at', $dateStr)->where('payment_status', 'paid')->sum('total_amount');
            $memRev = \App\Models\MembershipTransaction::whereDate('created_at', $dateStr)->where('status', 'paid')->sum('amount');

            $revenueChartData[] = [
                'day' => $date->format('D, d M'),
                'POS Sales' => (float) $posRev,
                'Membership' => (float) $memRev,
                'Total' => (float) ($posRev + $memRev),
            ];
        }

        // Attendance trend for past 7 days
        $daysIndo = ['Sun' => 'Min', 'Mon' => 'Sen', 'Tue' => 'Sel', 'Wed' => 'Rab', 'Thu' => 'Kam', 'Fri' => 'Jum', 'Sat' => 'Sab'];
        $monthsIndo = ['Jan' => 'Jan', 'Feb' => 'Feb', 'Mar' => 'Mar', 'Apr' => 'Apr', 'May' => 'Mei', 'Jun' => 'Jun', 'Jul' => 'Jul', 'Aug' => 'Ags', 'Sep' => 'Sep', 'Oct' => 'Okt', 'Nov' => 'Nov', 'Dec' => 'Des'];

        $attendanceChartData = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i);
            $dateStr = $date->toDateString();
            $count = Attendance::whereDate('check_in_time', $dateStr)->count();

            $dayName = $daysIndo[$date->format('D')] ?? $date->format('D');
            $monthName = $monthsIndo[$date->format('M')] ?? $date->format('M');

            $attendanceChartData[] = [
                'day' => "{$dayName}, {$date->format('d')} {$monthName}",
                'Attendances' => $count,
            ];
        }

        // Today's Recent Check-ins - hanya hari ini (misal Rabu -> data Rabu)
        $recentCheckIns = Attendance::with('member')
            ->whereDate('check_in_time', $today)
            ->latest('check_in_time')
            ->limit(10)
            ->get();

        return Inertia::render('Admin/Dashboard', [
            'isTrainer' => false,
            'metrics' => [
                'totalMembers' => $totalMembers,
                'activeMembers' => $activeMembers,
                'todayRevenue' => (float) $todayRevenue,
                'todayAttendance' => $todayAttendance,
                'activeClassesCount' => $activeClassesCount,
                'monthExpenses' => (float) $monthExpenses,
            ],
            'expiringMemberships' => $expiringMemberships,
            'lowStockProducts' => $lowStockProducts,
            'revenueChartData' => $revenueChartData,
            'attendanceChartData' => $attendanceChartData,
            'recentCheckIns' => $recentCheckIns,
        ]);
    }
}

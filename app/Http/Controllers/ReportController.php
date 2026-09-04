<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Expense;
use App\Models\Setting;
use App\Models\User;
use App\Models\MembershipTransaction;
use App\Models\PtSubscription;
use App\Models\Sale;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ReportController extends Controller
{
    public function index(Request $request)
    {
        $startDate = $request->input('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', now()->endOfMonth()->toDateString());
        $selectedYear = (int) $request->input('year', now()->year);
        $selectedMonth = (int) $request->input('month', now()->month);

        // Project inception - earliest attendance or earliest user as fallback, used to hide pre-project months/years in kunjungan
        $projectStartRaw = Attendance::min('check_in_time') ?? User::min('created_at') ?? now()->toDateTimeString();
        $projectStartCarbon = Carbon::parse($projectStartRaw);
        $projectStartYear = (int) $projectStartCarbon->year;
        $projectStartMonth = (int) $projectStartCarbon->format('m');
        if ($projectStartYear > (int) now()->year) {
            $projectStartYear = (int) now()->year;
            $projectStartMonth = 1;
        }

        // POS Sales total - cast ke float agar null/empty menjadi 0
        $posTotal = (float) Sale::whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->where('payment_status', 'paid')
            ->sum('total_amount');

        // Membership Transactions total
        $membershipTotal = (float) MembershipTransaction::whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->where('status', 'paid')
            ->sum('amount');

        // PT Subscriptions total
        $ptTotal = (float) PtSubscription::whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->where('payment_status', 'paid')
            ->sum('price_paid');

        // Expenses total - COALESCE ke 0 ketika tidak ada data pengeluaran pada periode
        $expensesTotal = (float) Expense::whereBetween('expense_date', [$startDate, $endDate])
            ->sum('amount');

        $totalRevenue = (float) ($posTotal + $membershipTotal + $ptTotal);
        // Estimasi laba bersih: jika tidak ada pengeluaran, laba = total omset (tidak boleh minus)
        $netIncome = $totalRevenue - $expensesTotal;
        if ($expensesTotal == 0) {
            $netIncome = $totalRevenue;
        }

        // Total Attendance in period
        $attendanceTotal = Attendance::whereBetween('check_in_time', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])->count();

        // Paginated Sales
        $sales = Sale::with(['member', 'cashier'])
            ->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->latest()
            ->paginate(10, ['*'], 'sales_page');

        // Paginated Membership transactions
        $membershipTransactions = MembershipTransaction::with(['member', 'subscription.package'])
            ->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
            ->latest()
            ->paginate(10, ['*'], 'membership_page');

        // Generate Revenue Chart Data with Dynamic Grouping (Day / Week / Month)
        $chartData = [];
        $periodStart = Carbon::parse($startDate);
        $periodEnd = Carbon::parse($endDate);
        $diffInDays = $periodStart->diffInDays($periodEnd);

        $driver = DB::connection()->getDriverName();
        $weekSql = match ($driver) {
            'pgsql' => "to_char(created_at, 'YYYY-IW')",
            'mysql', 'mariadb' => "DATE_FORMAT(created_at, '%Y-%v')",
            default => "strftime('%Y-%W', created_at)",
        };
        $monthSql = match ($driver) {
            'pgsql' => "to_char(created_at, 'YYYY-MM')",
            'mysql', 'mariadb' => "DATE_FORMAT(created_at, '%Y-%m')",
            default => "strftime('%Y-%m', created_at)",
        };
        $monthOnlySql = match ($driver) {
            'pgsql' => "to_char(check_in_time, 'MM')",
            'mysql', 'mariadb' => "DATE_FORMAT(check_in_time, '%m')",
            default => "strftime('%m', check_in_time)",
        };
        $yearOnlySql = match ($driver) {
            'pgsql' => "to_char(check_in_time, 'YYYY')",
            'mysql', 'mariadb' => "DATE_FORMAT(check_in_time, '%Y')",
            default => "strftime('%Y', check_in_time)",
        };

        $periodVisitData = [];

        if ($diffInDays <= 35) {
            // Group by Day
            $dailySales = Sale::selectRaw("DATE(created_at) as date, SUM(total_amount) as total")
                ->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
                ->where('payment_status', 'paid')
                ->groupBy('date')
                ->pluck('total', 'date');

            $dailyMembership = MembershipTransaction::selectRaw("DATE(created_at) as date, SUM(amount) as total")
                ->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
                ->where('status', 'paid')
                ->groupBy('date')
                ->pluck('total', 'date');

            $dailyAttendance = Attendance::selectRaw("DATE(check_in_time) as date, COUNT(*) as count")
                ->whereBetween('check_in_time', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
                ->groupBy('date')
                ->pluck('count', 'date');

            for ($date = clone $periodStart; $date->lte($periodEnd); $date->addDay()) {
                $dateStr = $date->toDateString();
                $posVal = (float) ($dailySales[$dateStr] ?? 0);
                $memVal = (float) ($dailyMembership[$dateStr] ?? 0);

                $chartData[] = [
                    'day' => $date->format('d M'),
                    'POS Kasir' => $posVal,
                    'Membership' => $memVal,
                    'Total' => $posVal + $memVal,
                ];

                $periodVisitData[] = [
                    'label' => $date->format('d M'),
                    'full_label' => $date->format('d M Y'),
                    'count' => (int) ($dailyAttendance[$dateStr] ?? 0),
                ];
            }
        } elseif ($diffInDays <= 180) {
            // Group by Week
            $weeklySales = Sale::selectRaw("{$weekSql} as wk, SUM(total_amount) as total")
                ->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
                ->where('payment_status', 'paid')
                ->groupBy('wk')->pluck('total', 'wk');

            $weeklyMem = MembershipTransaction::selectRaw("{$weekSql} as wk, SUM(amount) as total")
                ->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
                ->where('status', 'paid')
                ->groupBy('wk')->pluck('total', 'wk');

            $attWeekSql = match ($driver) {
                'pgsql' => "to_char(check_in_time, 'YYYY-IW')",
                'mysql', 'mariadb' => "DATE_FORMAT(check_in_time, '%Y-%v')",
                default => "strftime('%Y-%W', check_in_time)",
            };
            $weeklyAttendance = Attendance::selectRaw("{$attWeekSql} as wk, COUNT(*) as count")
                ->whereBetween('check_in_time', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
                ->groupBy('wk')->pluck('count', 'wk');

            $curr = clone $periodStart;
            while ($curr->lte($periodEnd)) {
                $wkKey = $curr->format('Y-W');
                $posVal = (float) ($weeklySales[$wkKey] ?? 0);
                $memVal = (float) ($weeklyMem[$wkKey] ?? 0);

                $chartData[] = [
                    'day' => 'M' . $curr->format('W (d/m)'),
                    'POS Kasir' => $posVal,
                    'Membership' => $memVal,
                    'Total' => $posVal + $memVal,
                ];

                $periodVisitData[] = [
                    'label' => 'M' . $curr->format('W (d/m)'),
                    'full_label' => 'Minggu ' . $curr->format('W (d M Y)'),
                    'count' => (int) ($weeklyAttendance[$wkKey] ?? 0),
                ];

                $curr->addWeek();
            }
        } else {
            // Group by Month
            $monthlySales = Sale::selectRaw("{$monthSql} as ym, SUM(total_amount) as total")
                ->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
                ->where('payment_status', 'paid')
                ->groupBy('ym')->pluck('total', 'ym');

            $monthlyMem = MembershipTransaction::selectRaw("{$monthSql} as ym, SUM(amount) as total")
                ->whereBetween('created_at', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
                ->where('status', 'paid')
                ->groupBy('ym')->pluck('total', 'ym');

            $attMonthSql = match ($driver) {
                'pgsql' => "to_char(check_in_time, 'YYYY-MM')",
                'mysql', 'mariadb' => "DATE_FORMAT(check_in_time, '%Y-%m')",
                default => "strftime('%Y-%m', check_in_time)",
            };
            $monthlyAtt = Attendance::selectRaw("{$attMonthSql} as ym, COUNT(*) as count")
                ->whereBetween('check_in_time', [$startDate . ' 00:00:00', $endDate . ' 23:59:59'])
                ->groupBy('ym')->pluck('count', 'ym');

            $curr = clone $periodStart->startOfMonth();
            while ($curr->lte($periodEnd)) {
                $ymKey = $curr->format('Y-m');
                $posVal = (float) ($monthlySales[$ymKey] ?? 0);
                $memVal = (float) ($monthlyMem[$ymKey] ?? 0);

                $chartData[] = [
                    'day' => $curr->format('M Y'),
                    'POS Kasir' => $posVal,
                    'Membership' => $memVal,
                    'Total' => $posVal + $memVal,
                ];

                $periodVisitData[] = [
                    'label' => $curr->format('M Y'),
                    'full_label' => $curr->format('F Y'),
                    'count' => (int) ($monthlyAtt[$ymKey] ?? 0),
                ];

                $curr->addMonth();
            }
        }

        // Weekly Visit Breakdown for selected Month & Year (Minggu 1 s/d Minggu 4/5)
        $firstDayOfMonth = Carbon::create($selectedYear, $selectedMonth, 1)->startOfDay();
        $lastDayOfMonth = (clone $firstDayOfMonth)->endOfMonth();

        $weeklyVisitData = [];
        $currentWeekStart = clone $firstDayOfMonth;
        $weekNumber = 1;

        while ($currentWeekStart->lte($lastDayOfMonth)) {
            $currentWeekEnd = (clone $currentWeekStart)->addDays(6)->endOfDay();
            if ($currentWeekEnd->gt($lastDayOfMonth)) {
                $currentWeekEnd = clone $lastDayOfMonth;
            }

            $count = Attendance::whereBetween('check_in_time', [$currentWeekStart->toDateTimeString(), $currentWeekEnd->toDateTimeString()])->count();

            $weeklyVisitData[] = [
                'week_key' => "W{$weekNumber}",
                'week_label' => "Minggu {$weekNumber} (" . $currentWeekStart->format('d M') . ' - ' . $currentWeekEnd->format('d M Y') . ")",
                'short_label' => "Minggu {$weekNumber}",
                'count' => $count,
            ];

            $currentWeekStart = (clone $currentWeekEnd)->addDay()->startOfDay();
            $weekNumber++;
        }

        // Monthly Visit Data for selected Year (Only up to current month for present year)
        $monthlyAttendances = Attendance::selectRaw("{$monthOnlySql} as month, COUNT(*) as count")
            ->whereYear('check_in_time', $selectedYear)
            ->groupBy('month')
            ->pluck('count', 'month');

        $monthNamesIndo = ['01' => 'Januari', '02' => 'Februari', '03' => 'Maret', '04' => 'April', '05' => 'Mei', '06' => 'Juni', '07' => 'Juli', '08' => 'Agustus', '09' => 'September', '10' => 'Oktober', '11' => 'November', '12' => 'Desember'];
        $maxMonthToShow = ($selectedYear < now()->year) ? 12 : (($selectedYear == now()->year) ? (int) now()->format('m') : 0);
        $minMonthToShow = ($selectedYear === $projectStartYear) ? $projectStartMonth : 1;

        $monthlyVisitData = [];
        if ($selectedYear >= $projectStartYear) {
            foreach ($monthNamesIndo as $mKey => $mName) {
                $mInt = (int) $mKey;
                if ($mInt >= $minMonthToShow && $mInt <= $maxMonthToShow) {
                    $monthlyVisitData[] = [
                        'month_key' => $mKey,
                        'month_name' => $mName,
                        'year' => $selectedYear,
                        'count' => (int) ($monthlyAttendances[$mKey] ?? 0),
                    ];
                }
            }
        }

        // Yearly Visit Data - continuous from project inception to current year (fills missing years with 0)
        $yearlyRaw = Attendance::selectRaw("{$yearOnlySql} as year, COUNT(*) as count")
            ->groupBy('year')
            ->pluck('count', 'year');
        $yearlyCounts = [];
        foreach ($yearlyRaw as $k => $v) {
            $yearlyCounts[(string) $k] = (int) $v;
        }
        // Also handle zero-padded keys just in case
        foreach ($yearlyRaw as $k => $v) {
            $yearlyCounts[trim((string) $k)] = (int) $v;
        }
        $currentYear = (int) now()->year;
        $yearlyVisitData = [];
        for ($y = $projectStartYear; $y <= $currentYear; $y++) {
            $yStr = (string) $y;
            $yearlyVisitData[] = [
                'year' => $yStr,
                'count' => (int) ($yearlyCounts[$yStr] ?? 0),
            ];
        }

        // Komisi — hitung berdasarkan rate di Settings (periode start_date s/d end_date)
        $commissionSettings = Setting::whereIn('key', ['commission_pt_rate','commission_pt_type','commission_membership_rate','commission_membership_type'])->pluck('value','key');
        $ptRate = (float) ($commissionSettings['commission_pt_rate'] ?? 45);
        $ptType = $commissionSettings['commission_pt_type'] ?? 'percent';
        $memRate = (float) ($commissionSettings['commission_membership_rate'] ?? 50000);
        $memType = $commissionSettings['commission_membership_type'] ?? 'flat';

        // PT subscriptions in period
        $ptSubscriptions = PtSubscription::with([
            'trainer:id,full_name,photo,specialization',
            'member:id,full_name',
            'package:id,name'
        ])
            ->whereBetween('created_at', [$startDate.' 00:00:00', $endDate.' 23:59:59'])
            ->where('payment_status', 'paid')
            ->latest()
            ->get();

        $calcPt = function($price) use ($ptRate, $ptType) {
            if ($ptType === 'percent') return $price * $ptRate / 100;
            return $ptRate;
        };
        $calcMem = function($amount) use ($memRate, $memType) {
            if ($memType === 'percent') return $amount * $memRate / 100;
            return $memRate;
        };

        $ptCommissionTotal = 0;
        $ptCommissionByTrainer = [];
        $ptCommissionList = [];
        foreach ($ptSubscriptions as $sub) {
            $comm = $calcPt((float) $sub->price_paid);
            $ptCommissionTotal += $comm;
            $tid = $sub->trainer_id ?? 'unknown';
            $tname = $sub->trainer->full_name ?? 'Tanpa Trainer';
            $tphoto = $sub->trainer->photo ?? null;
            $tspec = $sub->trainer->specialization ?? 'Personal Trainer';
            if (!isset($ptCommissionByTrainer[$tid])) {
                $ptCommissionByTrainer[$tid] = [
                    'trainer_id' => $tid,
                    'trainer_name' => $tname,
                    'trainer_photo' => $tphoto,
                    'specialization' => $tspec,
                    'count' => 0,
                    'omset' => 0,
                    'komisi' => 0
                ];
            }
            $ptCommissionByTrainer[$tid]['count'] += 1;
            $ptCommissionByTrainer[$tid]['omset'] += (float) $sub->price_paid;
            $ptCommissionByTrainer[$tid]['komisi'] += $comm;
            $ptCommissionList[] = [
                'id' => $sub->id,
                'transaction_code' => '#PT-' . str_pad($sub->id, 5, '0', STR_PAD_LEFT),
                'member_name' => $sub->member->full_name ?? '-',
                'trainer_name' => $tname,
                'trainer_photo' => $tphoto,
                'staff_name' => $tname,
                'staff_photo' => $tphoto,
                'package_name' => $sub->package->name ?? ($sub->total_sessions ? "{$sub->total_sessions} Sesi PT" : 'Paket PT'),
                'price_paid' => (float) $sub->price_paid,
                'amount' => (float) $sub->price_paid,
                'komisi' => (float) $comm,
                'date' => $sub->created_at->format('d/m/Y'),
                'raw_date' => $sub->created_at->toDateString(),
                'total_sessions' => $sub->total_sessions,
                'unit_count' => $sub->total_sessions ?? 1,
                'unit_label' => ($sub->total_sessions ?? 1) . ' Sesi',
                'rate_label' => $ptRate . ($ptType === 'percent' ? '%' : ' flat'),
                'payment_method' => $sub->payment_method ? ucfirst($sub->payment_method) : 'Cash',
                'type' => 'pt',
                'type_label' => 'Trainer PT',
                'status' => 'Success',
            ];
        }

        // Membership transactions in period — komisi diambil dari pilihan komisi saat registrasi (sold_by_id di subscription), bukan dari akun login (created_by)
        $memTransactions = MembershipTransaction::with([
            'member:id,full_name',
            'subscription.soldBy:id,name,photo',
            'subscription.package:id,name',
            'creator:id,name,photo'
        ])
            ->whereBetween('created_at', [$startDate.' 00:00:00', $endDate.' 23:59:59'])
            ->where('status', 'paid')
            ->latest()
            ->get();

        $memCommissionTotal = 0;
        $memCommissionBySales = [];
        $memCommissionList = [];
        foreach ($memTransactions as $tx) {
            $comm = $calcMem((float) $tx->amount);
            $memCommissionTotal += $comm;
            $soldBy = $tx->subscription?->soldBy;
            $uid = $soldBy?->id ?? $tx->subscription?->sold_by_id ?? $tx->created_by ?? 'unknown';
            $uname = $soldBy?->name ?? $tx->creator?->name ?? 'Tanpa Komisi';
            $uphoto = $soldBy?->photo ?? $tx->creator?->photo ?? null;
            if (!isset($memCommissionBySales[$uid])) {
                $memCommissionBySales[$uid] = [
                    'user_id' => $uid,
                    'user_name' => $uname,
                    'user_photo' => $uphoto,
                    'count' => 0,
                    'omset' => 0,
                    'komisi' => 0
                ];
            }
            $memCommissionBySales[$uid]['count'] += 1;
            $memCommissionBySales[$uid]['omset'] += (float) $tx->amount;
            $memCommissionBySales[$uid]['komisi'] += $comm;
            $memCommissionList[] = [
                'id' => $tx->id,
                'transaction_code' => $tx->transaction_code,
                'member_name' => $tx->member->full_name ?? '-',
                'sales_name' => $uname,
                'sales_photo' => $uphoto,
                'staff_name' => $uname,
                'staff_photo' => $uphoto,
                'package_name' => $tx->subscription?->package?->name ?? 'Paket Gym',
                'payment_method' => $tx->payment_method ? ucfirst($tx->payment_method) : 'Cash',
                'price_paid' => (float) $tx->amount,
                'amount' => (float) $tx->amount,
                'komisi' => (float) $comm,
                'date' => $tx->created_at->format('d/m/Y'),
                'raw_date' => $tx->created_at->toDateString(),
                'total_sessions' => 1,
                'unit_count' => 1,
                'unit_label' => '1 Closing',
                'rate_label' => $memRate . ($memType === 'percent' ? '%' : ' flat'),
                'type' => 'membership',
                'type_label' => 'Sales Membership',
                'status' => 'Success',
            ];
        }

        $allCommissionList = array_merge($ptCommissionList, $memCommissionList);
        usort($allCommissionList, fn($a, $b) => strcmp($b['raw_date'], $a['raw_date']));

        $commissionSummary = [
            'pt_rate'=> $ptRate,
            'pt_type'=> $ptType,
            'membership_rate'=> $memRate,
            'membership_type'=> $memType,
            'pt_total'=> (float) $ptCommissionTotal,
            'pt_count'=> count($ptCommissionList),
            'membership_total'=> (float) $memCommissionTotal,
            'membership_count'=> count($memCommissionList),
            'grand_total'=> (float) ($ptCommissionTotal + $memCommissionTotal),
        ];

        return Inertia::render('Admin/Reports/Index', [
            'summary' => [
                'posTotal' => (float) $posTotal,
                'membershipTotal' => (float) $membershipTotal,
                'ptTotal' => (float) $ptTotal,
                'totalRevenue' => (float) $totalRevenue,
                'expensesTotal' => (float) $expensesTotal,
                'netIncome' => (float) $netIncome,
                'attendanceTotal' => $attendanceTotal,
            ],
            'commissionSummary' => $commissionSummary,
            'ptCommissionByTrainer' => array_values($ptCommissionByTrainer),
            'ptCommissionList' => $ptCommissionList,
            'memCommissionBySales' => array_values($memCommissionBySales),
            'memCommissionList' => $memCommissionList,
            'allCommissionList' => $allCommissionList,
            'sales' => $sales,
            'membershipTransactions' => $membershipTransactions,
            'chartData' => $chartData,
            'periodVisitData' => $periodVisitData,
            'weeklyVisitData' => $weeklyVisitData,
            'monthlyVisitData' => $monthlyVisitData,
            'yearlyVisitData' => $yearlyVisitData,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'year' => $selectedYear,
                'month' => $selectedMonth,
                'project_start_year' => $projectStartYear,
                'project_start_month' => $projectStartMonth,
            ],
            'projectStartYear' => $projectStartYear,
            'projectStartMonth' => $projectStartMonth,
        ]);
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Attendance;
use App\Models\Member;
use App\Models\MemberQrCode;
use App\Models\PtSession;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class AttendanceController extends Controller
{
    /**
     * Auto check-out any active check-in sessions that have exceeded 3 hours duration.
     */
    private function autoCheckoutStaleSessions()
    {
        $cutoffTime = now()->subHours(3);

        Attendance::where('status', 'checked_in')
            ->where('check_in_time', '<=', $cutoffTime)
            ->get()
            ->each(function ($att) {
                $checkInTime = Carbon::parse($att->check_in_time);
                $att->update([
                    'check_out_time' => (clone $checkInTime)->addHours(3)->toDateTimeString(),
                    'status' => 'checked_out',
                    'notes' => 'Auto Check-Out (Timeout 3 Jam)',
                ]);
            });
    }

    /**
     * Calculate Haversine GPS Distance between two lat/lng points in meters.
     */
    public function index(Request $request)
    {
        $this->autoCheckoutStaleSessions();

        $query = Attendance::with(['member.activeSubscription.package', 'branch']);

        if ($request->filled('search')) {
            $search = addcslashes($request->search, '%_\\');
            $query->whereHas('member', function ($q) use ($search) {
                $q->where('full_name', 'like', "%{$search}%")
                  ->orWhere('member_code', 'like', "%{$search}%");
            });
        }

        if ($request->filled('date')) {
            $query->whereDate('check_in_time', $request->date);
        } else {
            $query->whereDate('check_in_time', now()->toDateString());
        }

        $attendances = $query->latest('check_in_time')->paginate(10)->withQueryString();
        $currentlyCheckedInCount = Attendance::where('status', 'checked_in')->count();

        return Inertia::render('Admin/Attendance/Index', [
            'attendances' => $attendances,
            'currentlyCheckedInCount' => $currentlyCheckedInCount,
            'filters' => $request->only(['search', 'date']),
        ]);
    }

    public function kiosk()
    {
        $this->autoCheckoutStaleSessions();

        $recentCheckIns = Attendance::with('member')
            ->whereDate('check_in_time', now()->toDateString())
            ->latest('check_in_time')
            ->get();

        $currentlyCheckedInCount = Attendance::where('status', 'checked_in')->count();

        return Inertia::render('Admin/Attendance/Kiosk', [
            'recentCheckIns' => $recentCheckIns,
            'currentlyCheckedInCount' => $currentlyCheckedInCount,
        ]);
    }

    public function checkIn(Request $request)
    {
        $this->autoCheckoutStaleSessions();

        $request->validate([
            'query' => 'required|string', // Member Code or QR Token
        ]);

        $rawQuery = trim($request->input('query'));
        $queryParts = explode(':', $rawQuery);
        $queryStr = $queryParts[0];

        // Find member by member_code OR QR token
        $member = Member::with(['activeSubscription.package', 'qrCode'])
            ->where('member_code', $queryStr)
            ->orWhereHas('qrCode', function ($q) use ($queryStr) {
                $q->where('qr_token', $queryStr);
            })
            ->first();

        if (!$member) {
            return back()->with('error', 'Member tidak ditemukan. Periksa kembali Kode Member atau QR Token.');
        }

        // Check active membership
        $activeSub = $member->activeSubscription;
        if (!$activeSub || $activeSub->end_date < now()->toDateString()) {
            return back()->with('error', "Check-in GAGAL: Membership {$member->full_name} ({$member->member_code}) sudah tidak aktif atau expired.");
        }

        if ($member->status === 'frozen') {
            return back()->with('error', "Check-in GAGAL: Membership {$member->full_name} dalam status DIBEKUKAN (Frozen).");
        }

        // Auto-complete PT Session if member has a scheduled PT session for today
        $ptSession = PtSession::with('trainer')
            ->where('member_id', $member->id)
            ->whereDate('session_date', now()->toDateString())
            ->whereIn('status', ['scheduled', 'confirmed', 'pending'])
            ->first();

        $ptNote = null;
        if ($ptSession) {
            $ptSession->update([
                'status' => 'completed',
            ]);

            $trainerName = $ptSession->trainer?->full_name ?? 'Personal Trainer';
            $startTime = Carbon::parse($ptSession->start_time)->format('H:i');
            $endTime = Carbon::parse($ptSession->end_time)->format('H:i');
            $ptNote = "Sesi PT bersama {$trainerName} (pkl {$startTime}-{$endTime}) Dijalankan & Selesai";
        }

        // Smart Re-Scan Auto Close: If member has an unclosed check-in, auto check-out previous session!
        $alreadyCheckedIn = Attendance::where('member_id', $member->id)
            ->where('status', 'checked_in')
            ->first();

        if ($alreadyCheckedIn) {
            $alreadyCheckedIn->update([
                'check_out_time' => now(),
                'status' => 'checked_out',
                'notes' => $alreadyCheckedIn->notes ? $alreadyCheckedIn->notes . ' (Auto Check-Out Re-Scan)' : 'Auto Check-Out (Re-Scan Check-In)',
            ]);
        }

        // Perform Check-in
        Attendance::create([
            'member_id' => $member->id,
            'branch_id' => auth()->user()?->branch_id ?? $member->branch_id,
            'check_in_time' => now(),
            'check_in_method' => Str::startsWith($queryStr, 'TRK-QR') ? 'qr' : 'manual',
            'status' => 'checked_in',
            'notes' => $ptNote,
            'created_by' => auth()->id(),
        ]);

        $msg = "CHECK-IN BERHASIL! Selamat datang, {$member->full_name} ({$activeSub->package->name}).";
        if ($ptNote) {
            $msg .= " " . $ptNote . ".";
        }
        if ($alreadyCheckedIn) {
            $msg .= " (Sesi latihan sebelumnya otomatis di-Check-Out).";
        }

        return back()->with('success', $msg);
    }

    public function checkOut(Attendance $attendance)
    {
        if ($attendance->status === 'checked_out') {
            return back()->with('error', 'Member sudah melakukan Check-out.');
        }

        $attendance->update([
            'check_out_time' => now(),
            'status' => 'checked_out',
            'notes' => 'Check-Out Manual oleh Admin',
        ]);

        return back()->with('success', "Check-out berhasil untuk member {$attendance->member->full_name}.");
    }

    public function checkOutAllActive()
    {
        $updatedCount = Attendance::where('status', 'checked_in')
            ->update([
                'check_out_time' => now(),
                'status' => 'checked_out',
                'notes' => 'Check-Out Massal (Tutup Shift Kasir)',
            ]);

        return back()->with('success', "Berhasil melakukan Check-out Massal untuk {$updatedCount} member aktif.");
    }
}

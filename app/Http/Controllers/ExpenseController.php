<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Inertia\Inertia;

class ExpenseController extends Controller
{
    public const CATEGORIES = [
        'Operasional & Keperluan Harian',
        'Utilitas (Listrik, Air, Wifi)',
        'Sewa Tempat & Gedung',
        'Maintenance Alat & Fasilitas',
        'Gaji & Honor Karyawan',
        'Pemasaran & Promosi',
        'Belanja Stok & Perlengkapan',
        'Lain-lain',
    ];

    public function index(Request $request)
    {
        $startDate = $request->input('start_date', now()->startOfMonth()->toDateString());
        $endDate = $request->input('end_date', now()->endOfMonth()->toDateString());
        $category = $request->input('category', '');
        $search = $request->input('search', '');

        $query = Expense::with(['creator:id,name', 'branch:id,name'])
            ->whereBetween('expense_date', [$startDate, $endDate]);

        if (!empty($category)) {
            $query->where('category', $category);
        }

        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                  ->orWhere('notes', 'like', "%{$search}%")
                  ->orWhere('category', 'like', "%{$search}%");
            });
        }

        $expenses = (clone $query)->orderBy('expense_date', 'desc')->orderBy('id', 'desc')->paginate(10)->withQueryString();

        // 1. Total in filtered period
        $periodTotal = (float) Expense::whereBetween('expense_date', [$startDate, $endDate])
            ->when(!empty($category), fn($q) => $q->where('category', $category))
            ->sum('amount');

        // 2. Total this month
        $thisMonthTotal = (float) Expense::whereBetween('expense_date', [now()->startOfMonth()->toDateString(), now()->endOfMonth()->toDateString()])->sum('amount');

        // 3. Total today
        $todayTotal = (float) Expense::whereDate('expense_date', now()->toDateString())->sum('amount');

        // 4. Breakdown by category for current period
        $categoryBreakdown = Expense::whereBetween('expense_date', [$startDate, $endDate])
            ->select('category', DB::raw('SUM(amount) as total'), DB::raw('COUNT(*) as count'))
            ->groupBy('category')
            ->orderBy('total', 'desc')
            ->get()
            ->map(fn($item) => [
                'category' => $item->category,
                'total' => (float) $item->total,
                'count' => (int) $item->count,
            ]);

        $topCategory = $categoryBreakdown->first();

        // 5. Chart Trend Data
        $chartData = [];
        $pStart = Carbon::parse($startDate);
        $pEnd = Carbon::parse($endDate);
        $diffDays = $pStart->diffInDays($pEnd);

        if ($diffDays <= 35) {
            $daily = Expense::whereBetween('expense_date', [$startDate, $endDate])
                ->when(!empty($category), fn($q) => $q->where('category', $category))
                ->selectRaw('DATE(expense_date) as dt, SUM(amount) as total')
                ->groupBy('dt')
                ->pluck('total', 'dt');

            for ($d = clone $pStart; $d->lte($pEnd); $d->addDay()) {
                $dStr = $d->toDateString();
                $chartData[] = [
                    'label' => $d->format('d M'),
                    'total' => (float) ($daily[$dStr] ?? 0),
                ];
            }
        } else {
            $driver = DB::connection()->getDriverName();
            $monthSql = match ($driver) {
                'pgsql' => "to_char(expense_date, 'YYYY-MM')",
                'mysql', 'mariadb' => "DATE_FORMAT(expense_date, '%Y-%m')",
                default => "strftime('%Y-%m', expense_date)",
            };

            $monthly = Expense::whereBetween('expense_date', [$startDate, $endDate])
                ->when(!empty($category), fn($q) => $q->where('category', $category))
                ->selectRaw("{$monthSql} as ym, SUM(amount) as total")
                ->groupBy('ym')
                ->pluck('total', 'ym');

            $curr = clone $pStart->startOfMonth();
            while ($curr->lte($pEnd)) {
                $ymKey = $curr->format('Y-m');
                $chartData[] = [
                    'label' => $curr->format('M Y'),
                    'total' => (float) ($monthly[$ymKey] ?? 0),
                ];
                $curr->addMonth();
            }
        }

        return Inertia::render('Admin/Expenses/Index', [
            'expenses' => $expenses,
            'summary' => [
                'periodTotal' => $periodTotal,
                'thisMonthTotal' => $thisMonthTotal,
                'todayTotal' => $todayTotal,
                'topCategory' => $topCategory ? $topCategory['category'] : 'Belum Ada',
                'topCategoryAmount' => $topCategory ? $topCategory['total'] : 0,
            ],
            'categoryBreakdown' => $categoryBreakdown,
            'chartData' => $chartData,
            'categories' => self::CATEGORIES,
            'filters' => [
                'start_date' => $startDate,
                'end_date' => $endDate,
                'category' => $category,
                'search' => $search,
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'category' => 'required|string|max:100',
            'description' => 'required|string|max:255',
            'amount' => 'required|numeric|min:1',
            'expense_date' => 'required|date',
            'payment_method' => 'required|string|max:50',
            'notes' => 'nullable|string|max:1000',
            'receipt_photo' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
        ]);

        $receiptPath = null;
        if ($request->hasFile('receipt_photo')) {
            $file = $request->file('receipt_photo');
            $filename = 'expense_' . time() . '_' . rand(1000, 9999) . '.' . $file->getClientOriginalExtension();
            $destinationPath = public_path('uploads/expenses');
            if (!File::isDirectory($destinationPath)) {
                File::makeDirectory($destinationPath, 0755, true, true);
            }
            $file->move($destinationPath, $filename);
            $receiptPath = '/uploads/expenses/' . $filename;
        }

        Expense::create([
            'branch_id' => auth()->user()?->branch_id,
            'category' => $validated['category'],
            'description' => $validated['description'],
            'amount' => $validated['amount'],
            'payment_method' => $validated['payment_method'],
            'expense_date' => $validated['expense_date'],
            'receipt_photo' => $receiptPath,
            'notes' => $validated['notes'] ?? null,
            'created_by' => auth()->id(),
        ]);

        return back()->with('success', 'Catatan pengeluaran berhasil ditambahkan!');
    }

    public function update(Request $request, Expense $expense)
    {
        $validated = $request->validate([
            'category' => 'required|string|max:100',
            'description' => 'required|string|max:255',
            'amount' => 'required|numeric|min:1',
            'expense_date' => 'required|date',
            'payment_method' => 'required|string|max:50',
            'notes' => 'nullable|string|max:1000',
            'receipt_photo' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
        ]);

        $receiptPath = $expense->receipt_photo;
        if ($request->hasFile('receipt_photo')) {
            // Remove old file if exists
            if (!empty($expense->receipt_photo) && File::exists(public_path($expense->receipt_photo))) {
                File::delete(public_path($expense->receipt_photo));
            }

            $file = $request->file('receipt_photo');
            $filename = 'expense_' . time() . '_' . rand(1000, 9999) . '.' . $file->getClientOriginalExtension();
            $destinationPath = public_path('uploads/expenses');
            if (!File::isDirectory($destinationPath)) {
                File::makeDirectory($destinationPath, 0755, true, true);
            }
            $file->move($destinationPath, $filename);
            $receiptPath = '/uploads/expenses/' . $filename;
        }

        $expense->update([
            'category' => $validated['category'],
            'description' => $validated['description'],
            'amount' => $validated['amount'],
            'payment_method' => $validated['payment_method'],
            'expense_date' => $validated['expense_date'],
            'receipt_photo' => $receiptPath,
            'notes' => $validated['notes'] ?? null,
        ]);

        return back()->with('success', 'Catatan pengeluaran berhasil diperbarui!');
    }

    public function destroy(Expense $expense)
    {
        if (!empty($expense->receipt_photo) && File::exists(public_path($expense->receipt_photo))) {
            File::delete(public_path($expense->receipt_photo));
        }

        $expense->delete();

        return back()->with('success', 'Catatan pengeluaran berhasil dihapus!');
    }
}

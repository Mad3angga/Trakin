<?php

namespace App\Http\Controllers;

use App\Models\Branch;
use App\Models\MembershipPackage;
use App\Models\PtPackage;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PackageController extends Controller
{
    public function index()
    {
        $packages = MembershipPackage::with('branch')->get();
        $ptPackages = PtPackage::all();
        $branches = Branch::all();

        return Inertia::render('Admin/Packages/Index', [
            'packages' => $packages,
            'ptPackages' => $ptPackages,
            'branches' => $branches,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'duration_days' => 'required|integer|min:1',
            'price' => 'required|numeric|min:0',
            'registration_fee' => 'nullable|numeric|min:0',
            'branch_id' => 'required|exists:branches,id',
        ]);

        $validated['registration_fee'] = $validated['registration_fee'] ?? 0;
        $validated['status'] = 'active';

        MembershipPackage::create($validated);

        return redirect()->back()->with('success', 'Paket membership berhasil ditambahkan.');
    }

    public function update(Request $request, MembershipPackage $package)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'duration_days' => 'required|integer|min:1',
            'price' => 'required|numeric|min:0',
            'registration_fee' => 'nullable|numeric|min:0',
            'status' => 'required|in:active,inactive',
        ]);

        $package->update($validated);

        return redirect()->back()->with('success', 'Paket membership berhasil diperbarui.');
    }

    public function storePtPackage(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'total_sessions' => 'required|integer|min:1',
            'price' => 'required|numeric|min:0',
            'validity_days' => 'required|integer|min:1',
        ]);

        $validated['status'] = 'active';

        PtPackage::create($validated);

        return redirect()->back()->with('success', 'Paket Personal Trainer berhasil ditambahkan.');
    }

    public function updatePtPackage(Request $request, PtPackage $ptPackage)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'total_sessions' => 'required|integer|min:1',
            'price' => 'required|numeric|min:0',
            'validity_days' => 'required|integer|min:1',
            'status' => 'required|in:active,inactive',
        ]);

        $ptPackage->update($validated);

        return redirect()->back()->with('success', 'Paket Personal Trainer berhasil diperbarui.');
    }

    public function destroyPtPackage(PtPackage $ptPackage)
    {
        $ptPackage->delete();

        return redirect()->back()->with('success', 'Paket Personal Trainer berhasil dihapus.');
    }
}

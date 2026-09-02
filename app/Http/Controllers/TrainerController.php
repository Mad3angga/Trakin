<?php

namespace App\Http\Controllers;

use App\Models\Member;
use App\Models\PtPackage;
use App\Models\PtSubscription;
use App\Models\Trainer;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Inertia\Inertia;

class TrainerController extends Controller
{
    public function index()
    {
        $trainers = Trainer::with(['user', 'ptSubscriptions.member'])->get();
        $ptPackages = PtPackage::where('status', 'active')->get();
        $members = Member::where('status', 'active')->select('id', 'full_name', 'member_code')->get();

        return Inertia::render('Admin/Trainers/Index', [
            'trainers' => $trainers,
            'ptPackages' => $ptPackages,
            'members' => $members,
        ]);
    }

    public function storeTrainer(Request $request)
    {
        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'email' => 'required|email|unique:trainers,email|unique:users,email',
            'phone' => 'required|string|max:30',
            'specialization' => 'required|string|max:255',
            'bio' => 'nullable|string',
            'skills' => 'nullable|string',
            'achievements' => 'nullable|string',
            'password' => 'nullable|string|min:8',
            'photo' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:4096',
            'portrait_photo' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:4096',
        ]);

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $file = $request->file('photo');
            $filename = 'trainer_' . time() . '_' . Str::random(6) . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('uploads/trainers'), $filename);
            $photoPath = '/uploads/trainers/' . $filename;
        }

        $portraitPhotoPath = null;
        if ($request->hasFile('portrait_photo')) {
            $file = $request->file('portrait_photo');
            $filename = 'trainer_portrait_' . time() . '_' . Str::random(6) . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('uploads/trainers'), $filename);
            $portraitPhotoPath = '/uploads/trainers/' . $filename;
        }

        $trainerPassword = $validated['password'] ?? Str::random(10);

        $user = User::create([
            'name' => $validated['full_name'],
            'email' => $validated['email'],
            'password' => Hash::make($trainerPassword),
            'branch_id' => auth()->user()?->branch_id,
            'phone' => $validated['phone'],
            'photo' => $photoPath,
            'status' => 'active',
        ]);
        $user->syncRoles(['Trainer']);
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        do {
            $trainerCode = 'TR-' . str_pad(random_int(0, 99999), 5, '0', STR_PAD_LEFT);
        } while (Trainer::where('trainer_code', $trainerCode)->exists());

        Trainer::create([
            'user_id' => $user->id,
            'branch_id' => auth()->user()?->branch_id,
            'trainer_code' => $trainerCode,
            'full_name' => $validated['full_name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'specialization' => $validated['specialization'],
            'bio' => $validated['bio'] ?? null,
            'skills' => $validated['skills'] ?? null,
            'achievements' => $validated['achievements'] ?? null,
            'photo' => $photoPath,
            'portrait_photo' => $portraitPhotoPath,
            'status' => 'active',
        ]);

        return back()->with('success', 'Trainer baru berhasil ditambahkan!')->with('generatedPassword', $trainerPassword);
    }

    public function updateTrainer(Request $request, Trainer $trainer)
    {
        $validated = $request->validate([
            'full_name' => 'required|string|max:255',
            'email' => 'required|email|unique:trainers,email,' . $trainer->id . '|unique:users,email,' . ($trainer->user_id ?? 0),
            'phone' => 'required|string|max:30',
            'specialization' => 'required|string|max:255',
            'bio' => 'nullable|string',
            'skills' => 'nullable|string',
            'achievements' => 'nullable|string',
            'status' => 'required|in:active,inactive',
            'photo' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:4096',
            'portrait_photo' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:4096',
        ]);

        $photoPath = $trainer->photo;
        if ($request->hasFile('photo')) {
            $file = $request->file('photo');
            $filename = 'trainer_' . time() . '_' . Str::random(6) . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('uploads/trainers'), $filename);
            $photoPath = '/uploads/trainers/' . $filename;
        }

        $portraitPhotoPath = $trainer->portrait_photo;
        if ($request->hasFile('portrait_photo')) {
            $file = $request->file('portrait_photo');
            $filename = 'trainer_portrait_' . time() . '_' . Str::random(6) . '.' . $file->getClientOriginalExtension();
            $file->move(public_path('uploads/trainers'), $filename);
            $portraitPhotoPath = '/uploads/trainers/' . $filename;
        }

        $trainer->update([
            'full_name' => $validated['full_name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'specialization' => $validated['specialization'],
            'bio' => $validated['bio'] ?? null,
            'skills' => $validated['skills'] ?? null,
            'achievements' => $validated['achievements'] ?? null,
            'status' => $validated['status'],
            'photo' => $photoPath,
            'portrait_photo' => $portraitPhotoPath,
        ]);

        if ($trainer->user) {
            $trainer->user->update([
                'name' => $validated['full_name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'],
                'photo' => $photoPath,
                'status' => $validated['status'],
            ]);
        }

        return back()->with('success', 'Data trainer berhasil diperbarui!');
    }
}

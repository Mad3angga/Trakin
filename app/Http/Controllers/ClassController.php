<?php

namespace App\Http\Controllers;

use App\Models\ClassRegistration;
use App\Models\ClassSchedule;
use App\Models\GymClass;
use App\Models\Member;
use App\Models\Trainer;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Inertia\Inertia;

class ClassController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $isTrainer = $user->hasRole('Trainer');
        $trainer = $isTrainer ? Trainer::where('user_id', $user->id)->first() : null;

        $classes = GymClass::withCount('schedules')->orderBy('name')->get();

        $scheduleQuery = ClassSchedule::with(['gymClass', 'trainer', 'registrations.member'])
            ->whereDate('start_time', '>=', now()->toDateString());

        if ($isTrainer && $trainer) {
            $scheduleQuery->where('trainer_id', $trainer->id);
        }

        $schedules = $scheduleQuery->orderBy('start_time')->get();

        $trainers = Trainer::where('status', 'active')->get();
        $members = Member::where('status', 'active')->select('id', 'member_code', 'full_name')->get();

        return Inertia::render('Admin/Classes/Index', [
            'isTrainer' => $isTrainer,
            'currentTrainer' => $trainer,
            'classes' => $classes,
            'schedules' => $schedules,
            'trainers' => $trainers,
            'members' => $members,
        ]);
    }

    public function storeClass(Request $request)
    {
        if (auth()->user()->hasRole('Trainer')) {
            abort(403, 'Trainer tidak diizinkan untuk membuat jenis kelas baru.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:100',
            'description' => 'nullable|string',
            'capacity' => 'required|integer|min:1',
            'duration_minutes' => 'required|integer|min:15',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
        ]);

        if ($request->hasFile('image')) {
            $file = $request->file('image');
            $dir = public_path('uploads/classes');
            if (!file_exists($dir)) {
                mkdir($dir, 0755, true);
            }
            $ext = $file->getClientOriginalExtension() ?: ($file->guessExtension() ?: 'jpg');
            $filename = 'class_' . time() . '_' . Str::random(6) . '.' . $ext;
            $file->move($dir, $filename);
            $validated['image'] = '/uploads/classes/' . $filename;
        }

        GymClass::create($validated);

        return back()->with('success', 'Kelas gym baru berhasil ditambahkan!');
    }

    public function updateClass(Request $request, GymClass $gymClass)
    {
        if (auth()->user()->hasRole('Trainer')) {
            abort(403, 'Trainer tidak diizinkan untuk mengedit jenis kelas.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'category' => 'required|string|max:100',
            'description' => 'nullable|string',
            'capacity' => 'required|integer|min:1',
            'duration_minutes' => 'required|integer|min:15',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,webp|max:5120',
        ]);

        if ($request->hasFile('image')) {
            // Remove previous cover if stored locally
            if ($gymClass->image && str_starts_with($gymClass->image, '/uploads/classes/')) {
                $oldPath = public_path(ltrim($gymClass->image, '/'));
                if (file_exists($oldPath)) {
                    @unlink($oldPath);
                }
            }

            $file = $request->file('image');
            $dir = public_path('uploads/classes');
            if (!file_exists($dir)) {
                mkdir($dir, 0755, true);
            }
            $ext = $file->getClientOriginalExtension() ?: ($file->guessExtension() ?: 'jpg');
            $filename = 'class_' . time() . '_' . Str::random(6) . '.' . $ext;
            $file->move($dir, $filename);
            $validated['image'] = '/uploads/classes/' . $filename;
        } else {
            unset($validated['image']);
        }

        $gymClass->update($validated);

        return back()->with('success', 'Jenis kelas berhasil diperbarui!');
    }

    public function destroyClass(GymClass $gymClass)
    {
        if (auth()->user()->hasRole('Trainer')) {
            abort(403, 'Trainer tidak diizinkan untuk menghapus jenis kelas.');
        }

        // Delete associated cover image file if exists
        if ($gymClass->image && str_starts_with($gymClass->image, '/uploads/classes/')) {
            $oldPath = public_path(ltrim($gymClass->image, '/'));
            if (file_exists($oldPath)) {
                @unlink($oldPath);
            }
        }

        $gymClass->delete();

        return back()->with('success', 'Jenis kelas berhasil dihapus!');
    }

    public function storeSchedule(Request $request)
    {
        $user = auth()->user();
        if ($user->hasRole('Trainer')) {
            $trainer = Trainer::where('user_id', $user->id)->first() ?? Trainer::first();
            if ($trainer) {
                $request->merge(['trainer_id' => $trainer->id]);
            }
        }

        $validated = $request->validate([
            'class_id' => 'required|exists:classes,id',
            'trainer_id' => 'required|exists:trainers,id',
            'start_time' => 'required|date',
            'room' => 'required|string|max:100',
            'max_capacity' => 'required|integer|min:1',
        ]);

        $gymClass = GymClass::findOrFail($validated['class_id']);
        $startTime = \Carbon\Carbon::parse($validated['start_time']);
        $endTime = (clone $startTime)->addMinutes($gymClass->duration_minutes);

        ClassSchedule::create([
            'class_id' => $gymClass->id,
            'branch_id' => $user?->branch_id,
            'trainer_id' => $validated['trainer_id'],
            'start_time' => $startTime->toDateTimeString(),
            'end_time' => $endTime->toDateTimeString(),
            'room' => $validated['room'],
            'max_capacity' => $validated['max_capacity'],
            'status' => 'scheduled',
        ]);

        return back()->with('success', 'Jadwal kelas baru berhasil dibuat!');
    }
}

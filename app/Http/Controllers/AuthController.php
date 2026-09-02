<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class AuthController extends Controller
{
    public function showLogin()
    {
        if (Auth::check()) {
            $user = Auth::user();
            if ($user->hasRole('Member')) {
                return redirect()->route('member.dashboard');
            }
            return redirect()->route('admin.dashboard');
        }

        return Inertia::render('Auth/Login');
    }

    public function login(Request $request)
    {
        $request->validate([
            'email' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $loginInput = $request->input('email');
        $password = $request->input('password');

        $user = \App\Models\User::where(function ($q) use ($loginInput) {
            $q->where('email', $loginInput)
              ->orWhere('phone', $loginInput)
              ->orWhere('name', $loginInput);
        })->first();

        if ($user && \Illuminate\Support\Facades\Hash::check($password, $user->password)) {
            Auth::login($user, $request->boolean('remember'));
            $request->session()->regenerate();

            if ($user->hasRole('Member')) {
                return redirect()->intended(route('member.dashboard'))->with('success', 'Selamat datang kembali di Member Portal!');
            }

            return redirect()->intended(route('admin.dashboard'))->with('success', 'Login berhasil! Selamat datang di Trakin Admin Portal.');
        }

        return back()->withErrors([
            'email' => 'Email/No. HP atau password yang Anda masukkan salah.',
        ])->onlyInput('email');
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect()->route('login')->with('success', 'Anda telah berhasil keluar dari sistem.');
    }

    public function updateDeviceToken(Request $request)
    {
        $validated = $request->validate([
            'token' => 'required|string',
        ]);

        $request->user()->update([
            'device_token' => $validated['token'],
        ]);

        return response()->json(['success' => true]);
    }
}

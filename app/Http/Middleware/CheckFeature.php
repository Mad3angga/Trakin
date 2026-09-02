<?php

namespace App\Http\Middleware;

use App\Models\Setting;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckFeature
{
    /**
     * Handle an incoming request.
     *
     * Usage: ->middleware('feature:feature_pos_module')
     */
    public function handle(Request $request, Closure $next, string $featureKey): Response
    {
        try {
            $value = Setting::where('key', $featureKey)->value('value');
        } catch (\Throwable $e) {
            return $next($request);
        }

        // Default enabled (1) if not set, except maintenance_mode which defaults 0
        $defaults = [
            'feature_class_booking' => '1',
            'feature_pt_booking' => '1',
            'feature_pos_module' => '1',
            'feature_kiosk_qr' => '1',
            'feature_auto_notifications' => '1',
            'feature_maintenance_mode' => '0',
        ];

        $effective = $value ?? ($defaults[$featureKey] ?? '1');
        $isEnabled = $effective === '1' || $effective === 1 || $effective === true;

        // maintenance_mode is inverse: when ON, we block normal access (show banner elsewhere)
        // For gate purposes, if maintenance_mode is ON, we allow but frontend shows banner.
        // So we don't block on maintenance_mode.
        if ($featureKey === 'feature_maintenance_mode') {
            return $next($request);
        }

        if (!$isEnabled) {
            if ($request->expectsJson() || $request->header('X-Inertia')) {
                return back()->with('error', 'Fitur ini sedang dinonaktifkan di Dev Mode (Settings → Dev Mode).');
            }
            abort(403, 'Fitur dinonaktifkan (Dev Mode)');
        }

        return $next($request);
    }
}

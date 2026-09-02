<?php

namespace App\Providers;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     * Apply system_timezone from DB to PHP / Laravel globally
     * so now(), Carbon, schedulers, queues all follow user config.
     */
    public function boot(): void
    {
        try {
            // Skip if settings table doesn't exist yet (fresh install / migrate)
            if (!Schema::hasTable('settings')) {
                return;
            }

            $timezone = Cache::remember('system_timezone', 3600, function () {
                try {
                    return Setting::where('key', 'system_timezone')->value('value');
                } catch (\Throwable $e) {
                    return null;
                }
            });

            $timezone = $timezone ?: config('app.timezone', 'Asia/Jakarta');

            if ($timezone && in_array($timezone, timezone_identifiers_list(), true)) {
                config(['app.timezone' => $timezone]);
                date_default_timezone_set($timezone);
            }
        } catch (\Throwable $e) {
            // Silently ignore — fallback to config/app.php default
        }
    }
}

<?php

namespace App\Helpers;

class TimezoneHelper
{
    const ABBR_MAP = [
        'Asia/Jakarta' => 'WIB',
        'Asia/Makassar' => 'WITA',
        'Asia/Jayapura' => 'WIT',
        'UTC' => 'UTC',
    ];

    public static function abbr(?string $tz): string
    {
        if (!$tz) return 'WIB';
        return self::ABBR_MAP[$tz] ?? (str_contains($tz, '/') ? substr(strrchr($tz, '/'), 1) : $tz);
    }

    public static function currentAbbr(): string
    {
        $tz = config('app.timezone', 'Asia/Jakarta');
        try {
            $cached = \Illuminate\Support\Facades\Cache::get('system_timezone');
            if ($cached) $tz = $cached;
            else {
                $dbTz = \App\Models\Setting::where('key', 'system_timezone')->value('value');
                if ($dbTz) $tz = $dbTz;
            }
        } catch (\Throwable $e) {}
        return self::abbr($tz);
    }

    public static function currentTimezone(): string
    {
        $tz = config('app.timezone', 'Asia/Jakarta');
        try {
            $cached = \Illuminate\Support\Facades\Cache::get('system_timezone');
            if ($cached) $tz = $cached;
        } catch (\Throwable $e) {}
        return $tz;
    }
}

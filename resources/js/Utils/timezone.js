export const DEFAULT_TZ = 'Asia/Jakarta';

export const TZ_ABBR = {
    'Asia/Jakarta': 'WIB',
    'Asia/Makassar': 'WITA',
    'Asia/Jayapura': 'WIT',
    'UTC': 'UTC',
};

export function getTimezoneAbbr(tz) {
    return TZ_ABBR[tz] || tz?.split('/').pop() || 'WIB';
}

export function resolveTimezone(tz) {
    if (typeof tz === 'string' && tz.trim() && (() => { try { Intl.DateTimeFormat(undefined, { timeZone: tz }); return true; } catch { return false; } })()) {
        return tz;
    }
    return DEFAULT_TZ;
}

export function formatInTimezone(isoString, timezone, opts = {}) {
    if (!isoString) return '';
    const tz = resolveTimezone(timezone);
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return '';
        return date.toLocaleString('id-ID', { timeZone: tz, ...opts });
    } catch {
        return '';
    }
}

export function formatStartSchedule(isoString, timezone) {
    if (!isoString) return '';
    const tz = resolveTimezone(timezone);
    try {
        const date = new Date(isoString);
        if (isNaN(date.getTime())) return '';
        const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: tz }).replace('.', ':');
        const dateStr = date.toLocaleDateString('id-ID', { month: 'short', day: 'numeric', timeZone: tz });
        return `Start: ${timeStr}, ${dateStr}`;
    } catch {
        return '';
    }
}

import React, { useState, useEffect } from 'react';
import { usePage, Link } from '@inertiajs/react';
import { MessageSquare, Calendar, Dumbbell, X, ChevronRight, Bell } from 'lucide-react';

export default function NotificationToast() {
    const { notifications } = usePage().props;
    const [dismissedIds, setDismissedIds] = useState([]);

    // Sound chime when new notifications load
    useEffect(() => {
        if (!notifications || notifications.length === 0) return;

        const activeNotifs = notifications.filter((n) => !dismissedIds.includes(n.id));
        if (activeNotifs.length > 0) {
            try {
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
                osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5

                gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);

                osc.connect(gain);
                gain.connect(audioCtx.destination);

                osc.start();
                osc.stop(audioCtx.currentTime + 0.3);
            } catch (e) {
                // Audio context may be restricted by browser gesture policies
            }
        }
    }, [notifications?.length]);

    if (!notifications || notifications.length === 0) return null;

    const visibleNotifications = notifications.filter((n) => !dismissedIds.includes(n.id));
    if (visibleNotifications.length === 0) return null;

    const handleDismiss = (id) => {
        setDismissedIds((prev) => [...prev, id]);
    };

    return (
        <div className="fixed top-4 right-3 sm:right-6 left-3 sm:left-auto z-50 max-w-sm sm:max-w-md w-full space-y-2.5 pointer-events-none safe-top">
            {visibleNotifications.map((notif) => {
                let badgeBg = 'bg-blue-500/10 text-blue-600 border-blue-200';
                let Icon = MessageSquare;

                if (notif.type === 'class') {
                    badgeBg = 'bg-purple-500/10 text-purple-600 border-purple-200';
                    Icon = Calendar;
                } else if (notif.type === 'pt_session') {
                    badgeBg = 'bg-emerald-500/10 text-emerald-600 border-emerald-200';
                    Icon = Dumbbell;
                }

                return (
                    <div
                        key={notif.id}
                        className="pointer-events-auto bg-white/95 backdrop-blur-md border border-gray-200/90 shadow-xl rounded-2xl p-3.5 flex items-start gap-3 transition-all animate-in slide-in-from-top-4 duration-300 relative group"
                    >
                        {/* Icon Badge */}
                        <div className={`p-2.5 rounded-xl border ${badgeBg} shrink-0`}>
                            <Icon className="w-5 h-5" />
                        </div>

                        {/* Text Content */}
                        <div className="min-w-0 flex-1 pr-6">
                            <div className="flex items-center gap-2">
                                <h4 className="text-xs font-bold text-gray-900 leading-tight truncate">
                                    {notif.title}
                                </h4>
                                <span className="text-[10px] font-semibold text-gray-400 shrink-0">
                                    {notif.time}
                                </span>
                            </div>
                            <p className="text-xs text-gray-600 leading-snug mt-0.5 line-clamp-2">
                                {notif.message}
                            </p>

                            {/* Action Link */}
                            {notif.url && (
                                <Link
                                    href={notif.url}
                                    onClick={() => handleDismiss(notif.id)}
                                    className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 mt-2 group/btn"
                                >
                                    <span>{notif.action_text || 'Lihat Detail'}</span>
                                    <ChevronRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 transition-transform" />
                                </Link>
                            )}
                        </div>

                        {/* Close Button */}
                        <button
                            type="button"
                            onClick={() => handleDismiss(notif.id)}
                            className="absolute top-3 right-3 text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
                            title="Tutup Notifikasi"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}

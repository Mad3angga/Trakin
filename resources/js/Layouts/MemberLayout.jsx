import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { initCapacitorPush } from '@/Utils/capacitor';
import { initNativeNotifications, requestNativeNotificationPermissions, sendNativeSystemNotification } from '@/Utils/notifications';
import { LayoutDashboard, Calendar, History, LogOut, Dumbbell, User, CheckCircle, AlertCircle, Bell } from 'lucide-react';
import NotificationHistoryModal from '@/Components/Member/NotificationHistoryModal';

export default function MemberLayout({ children, title, hideHeader = false, hideBottomNav = false }) {
    const { auth, flash, gym_name, gym_logo, notifications } = usePage().props;
    const [keyboardOpen, setKeyboardOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const notifiedIdsRef = useRef(new Set());

    const user = auth?.user;
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';

    const unreadCount = useMemo(() => {
        if (!notifications || notifications.length === 0) return 0;
        try {
            const uKey = `trakin_cleared_notifs_u${user?.id || 'default'}`;
            const rKey = `trakin_read_notifs_u${user?.id || 'default'}`;
            const cleared = new Set(JSON.parse(localStorage.getItem(uKey) || '[]'));
            const read = new Set(JSON.parse(localStorage.getItem(rKey) || '[]'));
            return notifications.filter((n) => !cleared.has(String(n.id)) && !read.has(String(n.id)) && !n.is_read).length;
        } catch {
            return notifications.filter((n) => !n.is_read).length;
        }
    }, [notifications, isNotificationOpen, user?.id]);

    // Detect iOS keyboard open/close via visualViewport
    useEffect(() => {
        const vv = window.visualViewport;
        if (!vv) return;

        const handleResize = () => {
            const isOpen = vv.height < window.innerHeight * 0.75;
            setKeyboardOpen(isOpen);
        };

        vv.addEventListener('resize', handleResize);
        return () => vv.removeEventListener('resize', handleResize);
    }, []);

    // Request OS Native System Notification permissions on load
    useEffect(() => {
        initCapacitorPush();
        initNativeNotifications();
        requestNativeNotificationPermissions();
    }, []);

    // Dispatch Native OS System Notifications
    useEffect(() => {
        if (!notifications || notifications.length === 0) return;

        notifications.forEach((notif) => {
            if (!notifiedIdsRef.current.has(notif.id)) {
                notifiedIdsRef.current.add(notif.id);
                sendNativeSystemNotification({
                    id: notif.id,
                    title: notif.title,
                    body: notif.message,
                    url: notif.url,
                    scheduledAt: notif.scheduled_at,
                });
            }
        });
    }, [notifications]);

    // Polling background notifications
    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({
                only: ['notifications'],
                preserveScroll: true,
                preserveState: true,
            });
        }, 10000);

        return () => clearInterval(interval);
    }, []);

    const nav = [
        { name: 'Dashboard', href: '/member/dashboard', icon: LayoutDashboard },
        { name: 'Kelas', href: '/member/classes', icon: Calendar },
        { name: 'Riwayat', href: '/member/history', icon: History },
        { name: 'Profil', href: '/member/profile', icon: User },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Minimalist Top Header */}
            {!hideHeader && (
                <header className="bg-white/95 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 shadow-sm safe-top">
                    <div className="max-w-md sm:max-w-xl md:max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
                        <Link href="/member/dashboard" className="flex items-center gap-2">
                            <img src="/images/logo_trakin.png" alt="Trakin Logo" className="w-8 h-8 rounded-lg object-cover shadow-xs border border-gray-200" />
                            <div>
                                <span className="font-bold text-sm text-gray-900 block leading-tight">Trakin</span>
                                <span className="text-[10px] text-gray-500 font-medium block leading-none">{gym_name || 'Member Portal'}</span>
                            </div>
                        </Link>

                        <div className="flex items-center gap-1.5 sm:gap-2">
                            {/* Notification History Button */}
                            <button
                                type="button"
                                onClick={() => setIsNotificationOpen(true)}
                                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 active:scale-95 rounded-xl transition-all relative flex items-center justify-center cursor-pointer"
                                title="Riwayat Notifikasi"
                            >
                                <Bell className="w-4 h-4" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
                                )}
                            </button>

                            {/* Logout Button */}
                            <Link
                                href="/logout"
                                method="post"
                                as="button"
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 active:scale-95 rounded-xl transition-all flex items-center gap-1.5 text-xs font-medium cursor-pointer"
                                title="Keluar"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="hidden sm:inline">Keluar</span>
                            </Link>
                        </div>
                    </div>
                </header>
            )}

            {/* Notification History Modal */}
            <NotificationHistoryModal
                isOpen={isNotificationOpen}
                onClose={() => setIsNotificationOpen(false)}
                notifications={notifications || []}
                userId={user?.id}
            />

            {/* Flash Banners */}
            <div className="max-w-md sm:max-w-xl md:max-w-3xl mx-auto px-4 w-full">
                {flash?.success && (
                    <div className="mt-4 px-4 py-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-xs font-medium flex items-center gap-2 shadow-xs">
                        <CheckCircle className="w-4 h-4 shrink-0 text-green-600" />
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="mt-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-center gap-2 shadow-xs">
                        <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                        {flash.error}
                    </div>
                )}
            </div>

            {/* Main Content */}
            <main className={`max-w-md sm:max-w-xl md:max-w-3xl mx-auto w-full flex-1 ${hideHeader || hideBottomNav ? 'px-0 py-0 sm:px-4 sm:py-2' : 'px-4 py-4 sm:py-5'} ${!keyboardOpen && !hideBottomNav ? 'pb-20 sm:pb-24' : ''}`}>
                {children}
            </main>

            {!keyboardOpen && !hideBottomNav && (
                <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/80 shadow-lg safe-bottom">
                    <div className="max-w-md sm:max-w-xl md:max-w-3xl mx-auto px-2 h-16 flex items-center justify-around">
                        {nav.map((item) => {
                            const Icon = item.icon;
                            const active = currentPath === item.href;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all ${active
                                        ? 'text-blue-600 font-bold'
                                        : 'text-gray-400 hover:text-gray-700 font-medium'
                                        }`}
                                >
                                    <div className={`p-1.5 rounded-xl transition-all relative ${active ? 'bg-blue-50 text-blue-600 scale-105' : ''}`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <span className="text-[11px] leading-tight mt-0.5">{item.name}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

import React, { useMemo, useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import {
    ArrowLeft,
    Settings,
    BellOff,
    CheckCheck,
    Trash2,
} from 'lucide-react';

export default function NotificationHistoryModal({
    isOpen,
    onClose,
    notifications = [],
    userId = null,
}) {
    const storageClearedKey = `trakin_cleared_notifs_u${userId || 'default'}`;
    const storageReadKey = `trakin_read_notifs_u${userId || 'default'}`;

    const [clearedIds, setClearedIds] = useState(new Set());
    const [readIds, setReadIds] = useState(new Set());
    const [showMenu, setShowMenu] = useState(false);

    // Sync localStorage keys whenever userId changes or modal opens
    useEffect(() => {
        try {
            const savedCleared = localStorage.getItem(storageClearedKey);
            setClearedIds(savedCleared ? new Set(JSON.parse(savedCleared)) : new Set());

            const savedRead = localStorage.getItem(storageReadKey);
            setReadIds(savedRead ? new Set(JSON.parse(savedRead)) : new Set());
        } catch {
            setClearedIds(new Set());
            setReadIds(new Set());
        }
    }, [userId, isOpen, storageClearedKey, storageReadKey]);

    // Active notifications excluding cleared ones
    const activeNotifications = useMemo(() => {
        return notifications.filter((n) => !clearedIds.has(String(n.id)));
    }, [notifications, clearedIds]);

    const unreadCount = useMemo(() => {
        return activeNotifications.filter((n) => !n.is_read && !readIds.has(String(n.id))).length;
    }, [activeNotifications, readIds]);

    // Group notifications into "Today" and "Most recent" (or "Yesterday", "Earlier")
    const groupedSections = useMemo(() => {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const todayItems = [];
        const recentItems = [];

        activeNotifications.forEach((n) => {
            const dateStr = n.created_at || n.scheduled_at;
            const itemDate = dateStr ? new Date(dateStr) : now;
            const itemDay = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());

            if (itemDay.getTime() === today.getTime()) {
                todayItems.push(n);
            } else {
                recentItems.push(n);
            }
        });

        const sections = [];
        if (todayItems.length > 0) {
            sections.push({ title: 'Today', items: todayItems });
        }
        if (recentItems.length > 0) {
            sections.push({ title: 'Most recent', items: recentItems });
        }

        if (sections.length === 0 && activeNotifications.length > 0) {
            sections.push({ title: 'Today', items: activeNotifications });
        }

        return sections;
    }, [activeNotifications]);

    // Clear All Action
    const handleClearAll = () => {
        setShowMenu(false);
        const allIds = new Set(clearedIds);
        notifications.forEach((n) => allIds.add(String(n.id)));
        setClearedIds(allIds);

        try {
            localStorage.setItem(storageClearedKey, JSON.stringify(Array.from(allIds)));
        } catch (err) {
            console.warn('Storage error:', err);
        }

        router.post(
            '/notifications/clear-all',
            {},
            {
                preserveScroll: true,
                preserveState: true,
            }
        );
    };

    // Mark All Read Action
    const handleMarkAllRead = () => {
        setShowMenu(false);
        const allRead = new Set(readIds);
        activeNotifications.forEach((n) => allRead.add(String(n.id)));
        setReadIds(allRead);

        try {
            localStorage.setItem(storageReadKey, JSON.stringify(Array.from(allRead)));
        } catch (err) {
            console.warn('Storage error:', err);
        }

        router.post(
            '/notifications/read-all',
            {},
            {
                preserveScroll: true,
                preserveState: true,
            }
        );
    };

    const handleNotificationClick = (notif) => {
        const notifIdStr = String(notif.id);
        if (!notif.is_read && !readIds.has(notifIdStr)) {
            const newRead = new Set(readIds);
            newRead.add(notifIdStr);
            setReadIds(newRead);
            try {
                localStorage.setItem(storageReadKey, JSON.stringify(Array.from(newRead)));
            } catch (err) {
                console.warn('Storage error:', err);
            }

            router.post(
                `/notifications/${notif.id}/read`,
                {},
                {
                    preserveScroll: true,
                    preserveState: true,
                }
            );
        }

        if (notif.url) {
            onClose();
            router.visit(notif.url);
        }
    };

    if (!isOpen) return null;

    // Render clean circle badge with application logo icon (logo_trakin.png)
    const renderAvatarBadge = (notif) => {
        if (notif.photo) {
            return (
                <img
                    src={notif.photo}
                    alt=""
                    className="w-12 h-12 rounded-full object-cover shrink-0 ring-1 ring-gray-100"
                />
            );
        }

        return (
            <div className="w-12 h-12 rounded-full bg-blue-50/80 border border-blue-100/80 p-2 flex items-center justify-center shrink-0 overflow-hidden shadow-2xs">
                <img
                    src="/images/logo_trakin.png"
                    alt="Trakin"
                    className="w-full h-full object-contain rounded-full"
                />
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 bg-white flex flex-col justify-between overflow-hidden animate-in fade-in duration-200">
            
            {/* Header & Content Area */}
            <div className="flex-1 overflow-y-auto flex flex-col pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))]">
                <div className="max-w-xl w-full mx-auto px-5 sm:px-6 flex-1 flex flex-col">
                    
                    {/* Top Action Bar (Back Arrow & Settings Icon) */}
                    <div className="flex items-center justify-between py-2 shrink-0 relative">
                        <button
                            type="button"
                            onClick={onClose}
                            className="p-1 -ml-1 text-gray-900 hover:opacity-70 active:scale-95 transition-all cursor-pointer"
                            title="Kembali"
                        >
                            <ArrowLeft className="w-6 h-6 stroke-[2.2]" />
                        </button>

                        <div className="relative">
                            <button
                                type="button"
                                onClick={() => setShowMenu(!showMenu)}
                                className="p-1 -mr-1 text-gray-900 hover:opacity-70 active:scale-95 transition-all cursor-pointer"
                                title="Pengaturan Notifikasi"
                            >
                                <Settings className="w-6 h-6 stroke-[2]" />
                            </button>

                            {/* Dropdown Menu for Actions */}
                            {showMenu && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setShowMenu(false)}
                                    />
                                    <div className="absolute right-0 top-10 z-20 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-1.5 animate-in fade-in zoom-in-95 duration-150">
                                        <button
                                            type="button"
                                            onClick={handleMarkAllRead}
                                            className="w-full px-4 py-2.5 text-left text-xs font-semibold text-gray-700 hover:bg-gray-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                                        >
                                            <CheckCheck className="w-4 h-4 text-blue-600" />
                                            <span>Tandai Semua Dibaca</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleClearAll}
                                            className="w-full px-4 py-2.5 text-left text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                                        >
                                            <Trash2 className="w-4 h-4 text-red-600" />
                                            <span>Hapus Semua Notifikasi</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Big Bold Headline Title */}
                    <div className="pt-4 pb-2 shrink-0">
                        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                            Notifications
                        </h1>
                    </div>

                    {/* Notifications List View */}
                    <div className="flex-1 mt-4">
                        {activeNotifications.length === 0 ? (
                            <div className="py-24 text-center flex flex-col items-center justify-center px-4">
                                <div className="w-14 h-14 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mb-3">
                                    <BellOff className="w-6 h-6" />
                                </div>
                                <h3 className="text-base font-bold text-gray-900">
                                    No notifications
                                </h3>
                                <p className="text-xs text-gray-400 max-w-xs mt-1 leading-relaxed">
                                    You're all caught up! Important updates and gym reminders will appear here.
                                </p>
                            </div>
                        ) : (
                            groupedSections.map((section) => (
                                <div key={section.title} className="mb-6">
                                    
                                    {/* Section Heading ("Today", "Most recent") */}
                                    <h2 className="text-base font-bold text-gray-900 mb-2">
                                        {section.title}
                                    </h2>

                                    {/* Seamless List with Hairline Dividers */}
                                    <div className="divide-y divide-gray-100 border-t border-gray-100">
                                        {section.items.map((notif) => {
                                            const notifIdStr = String(notif.id);
                                            const isUnread = !notif.is_read && !readIds.has(notifIdStr);

                                            return (
                                                <div
                                                    key={notif.id}
                                                    onClick={() => handleNotificationClick(notif)}
                                                    className={`py-4.5 flex items-start gap-4 transition-colors cursor-pointer active:bg-gray-50/80 ${
                                                        isUnread ? 'bg-blue-50/15' : ''
                                                    }`}
                                                >
                                                    {/* Left Circular Badge */}
                                                    {renderAvatarBadge(notif)}

                                                    {/* Right Text Content */}
                                                    <div className="flex-1 min-w-0 pr-1">
                                                        <div className="flex items-baseline flex-wrap gap-x-1.5 leading-snug">
                                                            <span className="font-bold text-sm sm:text-base text-gray-900">
                                                                {notif.title}
                                                            </span>
                                                            <span className="text-gray-400 font-normal text-xs sm:text-sm">
                                                                · {notif.time || 'Yesterday'}
                                                            </span>
                                                        </div>

                                                        <p className="text-xs sm:text-sm text-gray-600 font-normal leading-relaxed mt-1">
                                                            {notif.message}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                </div>
                            ))
                        )}
                    </div>

                </div>
            </div>

        </div>
    );
}

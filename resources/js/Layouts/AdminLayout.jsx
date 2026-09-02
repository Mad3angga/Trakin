import React, { useState, useEffect, useRef } from 'react';
import { Link, usePage, router } from '@inertiajs/react';
import { initCapacitorPush } from '@/Utils/capacitor';
import { initNativeNotifications, requestNativeNotificationPermissions, sendNativeSystemNotification } from '@/Utils/notifications';
import {
    LayoutDashboard, Users, ScanLine, ShoppingCart, Calendar, Dumbbell,
    Package, BarChart3, LogOut, Menu, X, CheckCircle, AlertCircle, ClipboardList, CreditCard, ShieldCheck, UserCheck, ChevronDown, Settings, Sparkles, MessageSquare, User, Receipt
} from 'lucide-react';

export default function AdminLayout({ children, title, hideHeader = false, hideBottomNav = false }) {
    const { auth, flash, gym_name, gym_logo, notifications, feature_flags } = usePage().props;
    const flags = feature_flags || {};
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
        if (typeof window === 'undefined') return false;
        return window.localStorage.getItem('trakin-sidebar-collapsed') === 'true';
    });
    const notifiedIdsRef = useRef(new Set());

    useEffect(() => {
        window.localStorage.setItem('trakin-sidebar-collapsed', String(sidebarCollapsed));
    }, [sidebarCollapsed]);

    useEffect(() => {
        initCapacitorPush();
        initNativeNotifications();
        requestNativeNotificationPermissions();
    }, []);

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

    useEffect(() => {
        const interval = setInterval(() => {
            router.reload({ only: ['notifications'], preserveScroll: true, preserveState: true });
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    const user = auth?.user;
    const role = user?.roles?.[0] || 'User';
    const canManageGymSettings = ['Owner', 'Manager'].includes(role);
    const canViewSettings = ['Owner', 'Manager', 'Front Desk', 'Sales', 'Trainer'].includes(role);

    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    const [posDropdownOpen, setPosDropdownOpen] = useState(currentPath.startsWith('/pos'));
    const [trainerDropdownOpen, setTrainerDropdownOpen] = useState(currentPath === '/trainers' || currentPath === '/personal-trainer');

    const allNav = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['Owner', 'Manager', 'Front Desk', 'Sales', 'Trainer'] },
        { name: 'Member', href: '/members', icon: Users, roles: ['Owner', 'Manager', 'Front Desk', 'Sales'] },
        { name: 'Paket Gym', href: '/packages', icon: CreditCard, roles: ['Owner', 'Manager'] },
        { name: 'Check-In', href: '/attendance/kiosk', icon: ScanLine, roles: ['Owner', 'Manager', 'Front Desk', 'Sales'], feature: 'feature_kiosk_qr' },
        { name: 'Kehadiran', href: '/attendance', icon: ClipboardList, roles: ['Owner', 'Manager', 'Front Desk', 'Sales', 'Trainer'] },
        { name: 'POS', href: '/pos', icon: ShoppingCart, roles: ['Owner', 'Manager', 'Front Desk', 'Sales'], feature: 'feature_pos_module' },
        { name: 'Kelas', href: '/classes', icon: Calendar, roles: ['Owner', 'Manager', 'Trainer'], feature: 'feature_class_booking' },
        {
            name: 'Manajemen PT',
            id: 'trainer',
            icon: Dumbbell,
            roles: ['Owner', 'Manager', 'Front Desk', 'Sales'],
            hasChildren: true,
            children: [
                { name: 'Daftar Trainer', href: '/trainers', icon: Dumbbell, roles: ['Owner', 'Manager'] },
                { name: 'Jadwal & Sesi PT', href: '/personal-trainer', icon: UserCheck, roles: ['Owner', 'Manager', 'Front Desk', 'Sales'], feature: 'feature_pt_booking' },
            ]
        },
        { name: 'Inventori', href: '/inventory', icon: Package, roles: ['Owner', 'Manager'] },
        { name: 'Pengeluaran', href: '/expenses', icon: Receipt, roles: ['Owner', 'Manager'] },
        { name: 'Laporan', href: '/reports', icon: BarChart3, roles: ['Owner', 'Manager'] },
        { name: 'Manajemen Staf', href: '/users', icon: ShieldCheck, roles: ['Owner'] },
        { name: 'AI Assistant', href: '/owner/ai-assistant', icon: Sparkles, roles: ['Owner', 'Manager'] },
    ];

    const isFeatureEnabled = (key) => {
        if (!key) return true;
        if (flags[key] === undefined) return true;
        return flags[key] !== false;
    };

    const nav = allNav.filter((item) => {
        if (!item.roles.includes(role)) return false;
        if (item.feature && !isFeatureEnabled(item.feature)) return false;
        return true;
    });

    return (
        <div className="min-h-screen bg-[#F8F9FB] font-sans antialiased">
            {sidebarOpen && (
                <div className="fixed inset-0 z-40 bg-black/10 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            <aside className={`fixed inset-y-0 left-0 z-50 ${sidebarCollapsed ? 'w-[72px]' : 'w-[240px]'} bg-white border-r border-gray-100/80 transform transition-all duration-300 ease-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col`}>
                <div className={`h-14 px-4 flex items-center border-b border-gray-100/80 shrink-0 ${sidebarCollapsed ? 'justify-center' : 'justify-between'}`}>
                    {sidebarCollapsed ? (
                        <button type="button" onClick={() => setSidebarCollapsed(false)} className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors" title="Tampilkan sidebar">
                            <Menu className="w-4 h-4" />
                        </button>
                    ) : (
                        <>
                            <div className="flex items-center gap-2.5">
                                <img src="/images/logo_trakin.png" alt="Trakin Logo" className="w-8 h-8 rounded-xl object-cover border border-gray-100 shadow-xs" />
                                <div>
                                    <span className="font-extrabold text-sm tracking-tight text-gray-900">Trakin</span>
                                </div>
                            </div>
                            <button type="button" onClick={() => setSidebarCollapsed(true)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors" title="Sembunyikan sidebar">
                                <Menu className="w-4 h-4" />
                            </button>
                        </>
                    )}
                </div>

                <nav className={`flex-1 overflow-y-auto p-3 space-y-1 ${sidebarCollapsed ? 'overflow-x-hidden px-2' : ''}`}>
                    {nav.map((item) => {
                        const Icon = item.icon;
                        if (item.hasChildren) {
                            const isTrainer = item.id === 'trainer';
                            const isOpen = isTrainer ? trainerDropdownOpen : posDropdownOpen;
                            const toggleOpen = isTrainer ? () => setTrainerDropdownOpen(!trainerDropdownOpen) : () => setPosDropdownOpen(!posDropdownOpen);
                            const isParentActive = isTrainer ? (currentPath === '/trainers' || currentPath.startsWith('/personal-trainer')) : currentPath.startsWith('/pos');
                            const visibleChildren = item.children.filter((child) => {
                                if (!child.roles.includes(role)) return false;
                                if (child.feature && !isFeatureEnabled(child.feature)) return false;
                                return true;
                            });
                            if (visibleChildren.length === 0) return null;
                            return (
                                <div key={item.name} className="space-y-1">
                                    <button
                                        type="button"
                                        onClick={toggleOpen}
                                        className={`${sidebarCollapsed ? 'justify-center' : 'justify-between'} w-full flex items-center px-3 py-2 rounded-2xl text-xs transition-all duration-200 ${isParentActive ? 'bg-blue-50 text-blue-700 font-medium border border-blue-100' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium'}`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <Icon className="w-[18px] h-[18px] shrink-0" />
                                            {!sidebarCollapsed && <span>{item.name}</span>}
                                        </div>
                                        {!sidebarCollapsed && <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />}
                                    </button>
                                    {isOpen && !sidebarCollapsed && (
                                        <div className="ml-2 pl-3 border-l border-gray-100 space-y-1">
                                            {visibleChildren.map((subItem) => {
                                                const SubIcon = subItem.icon;
                                                const isSubActive = currentPath === subItem.href;
                                                return (
                                                    <Link
                                                        key={subItem.name}
                                                        href={subItem.href}
                                                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs transition-all duration-200 ${isSubActive ? 'bg-blue-50 text-blue-700 font-medium border border-blue-100' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium'}`}
                                                    >
                                                        <SubIcon className="w-3.5 h-3.5 shrink-0" />
                                                        <span>{subItem.name}</span>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        }
                        const active = currentPath === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                title={sidebarCollapsed ? item.name : undefined}
                                className={`${sidebarCollapsed ? 'justify-center px-2' : ''} flex items-center gap-2.5 px-3 py-2 rounded-2xl text-xs transition-all duration-200 ${active ? 'bg-blue-50 text-blue-700 font-medium border border-blue-100' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900 font-medium'}`}
                            >
                                <Icon className="w-[18px] h-[18px] shrink-0" />
                                {!sidebarCollapsed && item.name}
                            </Link>
                        );
                    })}
                </nav>

                <div className={`p-3 border-t border-gray-100/80 bg-white shrink-0 ${sidebarCollapsed ? 'px-2' : ''}`}>
                    <div className={`${sidebarCollapsed ? 'justify-center p-2' : 'p-3'} flex items-center gap-3 rounded-2xl bg-gray-50 border border-gray-100 mb-3 ${sidebarCollapsed ? 'flex-col' : ''}`}>
                        <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 shadow-xs relative bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0">
                            {user?.photo && <img src={user.photo} alt="" onError={(e) => { e.currentTarget.style.display = 'none'; }} className="w-full h-full object-cover absolute inset-0 z-10" />}
                            <span className="z-0">{user?.name?.substring(0, 2).toUpperCase()}</span>
                        </div>
                        {!sidebarCollapsed && (
                            <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold text-gray-900 truncate leading-tight tracking-tight">{user?.name}</p>
                                <p className="text-[11px] text-gray-500 leading-tight">
                                    {['Sales', 'Trainer', 'Front Desk'].includes(role) ? `Staff (${role})` : role}
                                </p>
                            </div>
                        )}
                        {canViewSettings && !sidebarCollapsed && (
                            <Link href={role === 'Trainer' ? '/trainer/profile' : '/settings'} className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors shrink-0 ${currentPath === '/trainer/profile' || currentPath.startsWith('/settings') ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'text-gray-400 hover:text-gray-700 hover:bg-white border border-transparent hover:border-gray-100'}`} title="Pengaturan & Profil">
                                <Settings className="w-3.5 h-3.5" />
                            </Link>
                        )}
                    </div>
                    <Link href="/logout" method="post" as="button" className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                        <LogOut className="w-3.5 h-3.5" />
                        {!sidebarCollapsed && 'Keluar'}
                    </Link>
                </div>
            </aside>

            {flags.feature_maintenance_mode && (
                <div className={`${sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-[240px]'} bg-amber-500 text-white text-xs font-semibold px-4 py-2 flex items-center justify-center gap-2 transition-all duration-300`}>
                    <span>🚧 Mode Pemeliharaan Aktif — Beberapa fitur mungkin dibatasi.</span>
                </div>
            )}

            <div className={`${sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-[240px]'} transition-all duration-300`}>
                {!hideHeader && (
                    <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100/80">
                        <div className="h-14 flex items-center px-4 lg:px-8">
                            <button onClick={() => setSidebarOpen(true)} className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors -ml-1">
                                <Menu className="w-4 h-4" />
                            </button>
                            <h1 className="text-sm font-bold tracking-tight text-gray-900 ml-2 lg:ml-0">{title}</h1>
                            <div className="ml-auto flex items-center gap-3">
                                {gym_logo ? (
                                    <img src={gym_logo} alt={gym_name || 'Gym Logo'} className="w-8 h-8 rounded-full object-cover border border-gray-100 shadow-xs shrink-0" />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-bold text-[11px] border border-gray-100 shrink-0">
                                        {(gym_name || user?.branch?.name || 'T')[0].toUpperCase()}
                                    </div>
                                )}
                                <span className="hidden sm:inline text-xs text-gray-900 font-semibold tracking-tight truncate max-w-[160px]">{gym_name || user?.branch?.name}</span>
                            </div>
                        </div>
                    </header>
                )}

                {flash?.success && (
                    <div className="mx-4 lg:mx-8 mt-6 px-4 py-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-medium flex items-center gap-2.5 shadow-xs">
                        <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="mx-4 lg:mx-8 mt-6 px-4 py-3 rounded-2xl bg-red-50 border border-red-100 text-red-700 text-xs font-medium flex items-center gap-2.5 shadow-xs">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {flash.error}
                    </div>
                )}

                <main className="p-4 lg:p-8">{children}</main>
            </div>
        </div>
    );
}

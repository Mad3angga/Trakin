import React, { useState, useEffect } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import MemberLayout from '@/Layouts/MemberLayout';
import { formatInTimezone } from '@/Utils/timezone';
import { QrCode, Calendar, RefreshCw, ShieldCheck, Flame, Check, Info, Dumbbell, Bookmark, MessageCircle, Users, ChevronRight } from 'lucide-react';

export default function MemberDashboard({ user, member, activeSubscription, upcomingClasses, recentAttendances, activeAttendance, streak, trainers = [] }) {
    const pageProps = usePage().props;
    const systemTimezone = pageProps.gym_settings?.system_timezone || pageProps.gymSettings?.system_timezone || 'Asia/Jakarta';
    const { auth } = pageProps;
    const currentUser = auth?.user || user;
    const displayName = currentUser?.name || member?.full_name || 'Member';
    const userPhoto = currentUser?.photo || member?.photo;
    const [secondsLeft, setSecondsLeft] = useState(30);
    const [timestampSecret, setTimestampSecret] = useState(Math.floor(Date.now() / 1000));

    // Dynamic QR Refresh Timer (Every 30 seconds)
    useEffect(() => {
        const timer = setInterval(() => {
            setSecondsLeft((prev) => {
                if (prev <= 1) {
                    setTimestampSecret(Math.floor(Date.now() / 1000));
                    return 30;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const handleManualRefresh = () => {
        setTimestampSecret(Math.floor(Date.now() / 1000));
        setSecondsLeft(30);
    };

    const baseQrToken = member?.qrCode?.qr_token || member?.member_code || 'MBR-GUEST';
    const dynamicQrData = `${baseQrToken}:${timestampSecret}`;

    const weeklyStreak = streak?.weekly_streak || 0;
    const weekDays = streak?.week_days || [
        { day: 'M', active: false },
        { day: 'T', active: false },
        { day: 'W', active: false },
        { day: 'T', active: false },
        { day: 'F', active: false },
        { day: 'S', active: false },
        { day: 'S', active: false },
    ];

    return (
        <MemberLayout title="Dashboard Member">
            <Head title="Member Dashboard" />

            <div className="space-y-4">
                {/* Greeting with Profile Avatar & Display Name */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/member/profile" title="Ke Pengaturan Profil">
                            {userPhoto ? (
                                <img src={userPhoto} alt={displayName} className="w-11 h-11 rounded-full object-cover border-2 border-blue-500 shadow-xs hover:opacity-90 transition-opacity" />
                            ) : (
                                <div className="w-11 h-11 rounded-full bg-blue-600 text-white font-bold text-sm flex items-center justify-center border-2 border-blue-200 shadow-xs hover:bg-blue-700 transition-colors">
                                    {displayName.substring(0, 2).toUpperCase()}
                                </div>
                            )}
                        </Link>
                        <div>
                            <h2 className="text-base font-bold text-gray-900 leading-tight">Halo, {displayName}! 👋</h2>
                            <p className="text-xs text-gray-500">Semangat latihan hari ini!</p>
                        </div>
                    </div>
                </div>

                {/* Duolingo/Fitness-Style Streak Card */}
                <div className="bg-white rounded-2xl border border-gray-200 p-6 relative shadow-sm">
                    {/* Info Icon Top Right */}
                    <div className="absolute top-4 right-4 text-gray-300 hover:text-gray-500 cursor-pointer">
                        <Info className="w-4 h-4" />
                    </div>

                    {/* Top: Flame Icon & Large Count */}
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center shrink-0">
                            <Flame className="w-10 h-10 text-orange-500 fill-orange-500" />
                        </div>
                        <div>
                            <div className="text-4xl font-extrabold text-gray-900 tracking-tight leading-none">
                                {weeklyStreak}
                            </div>
                            <div className="text-sm font-medium text-gray-400 mt-1">
                                week streak
                            </div>
                        </div>
                    </div>

                    {/* Bottom: 7 Days Checkmark Circles */}
                    <div className="grid grid-cols-7 gap-2 pt-2">
                        {weekDays.map((item, index) => (
                            <div key={index} className="flex flex-col items-center gap-1.5">
                                <div
                                    className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${item.active
                                        ? 'bg-orange-500 border-orange-500 text-white shadow-xs'
                                        : 'bg-gray-50 border-gray-200 text-gray-300'
                                        }`}
                                >
                                    <Check className="w-4 h-4 stroke-[3]" />
                                </div>
                                <span className={`text-[11px] font-bold ${item.active ? 'text-gray-900' : 'text-gray-400'}`}>
                                    {item.day}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Membership Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Membership Pass</span>
                        {activeSubscription ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {activeSubscription.status || 'Aktif'}
                            </span>
                        ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                                Non-Aktif
                            </span>
                        )}
                    </div>

                    {activeSubscription ? (
                        <div className="space-y-2">
                            <h3 className="text-xl font-semibold text-gray-900">{activeSubscription.package_name}</h3>
                            <div className="flex items-center justify-between text-xs text-gray-600">
                                <span>Sisa Masa Aktif</span>
                                <span className="font-semibold text-blue-600">{activeSubscription.days_left} Hari Lagi</span>
                            </div>
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                <div className="bg-blue-600 h-full rounded-full w-3/4" />
                            </div>
                            <p className="text-[10px] text-gray-400">Berlaku s/d: {activeSubscription.end_date}</p>
                        </div>
                    ) : (
                        <p className="text-xs text-gray-500">Anda tidak memiliki paket membership aktif saat ini.</p>
                    )}
                </div>

                {/* Dynamic QR Code Pass */}
                {member && (
                    <div className="bg-white rounded-xl border border-gray-200 p-5 text-center space-y-3">
                        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                            <div className="text-left">
                                <h3 className="font-semibold text-sm text-gray-900">QR Check-In</h3>
                                <p className="text-[10px] text-gray-400">Scan di terminal front desk untuk masuk</p>
                            </div>
                            <button
                                onClick={handleManualRefresh}
                                className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center gap-1 text-xs cursor-pointer"
                                title="Refresh QR Token"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                                Refresh
                            </button>
                        </div>

                        {/* QR Image */}
                        <div className="relative w-44 h-44 bg-white p-2.5 border-2 border-blue-500/30 rounded-2xl mx-auto flex items-center justify-center shadow-sm">
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(dynamicQrData)}`}
                                alt="Dynamic Member QR Code"
                                className="w-full h-full object-contain"
                            />
                        </div>


                    </div>
                )}

                {/* Upcoming classes */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-sm text-gray-900">Kelas Terdaftar</h3>
                        <Link href="/member/classes" className="text-xs text-blue-600 hover:underline">Lihat Semua →</Link>
                    </div>

                    {upcomingClasses.length === 0 ? (
                        <p className="text-xs text-gray-400 py-3 text-center">Belum ada kelas terdaftar.</p>
                    ) : (
                        upcomingClasses.map((reg) => (
                            <div key={reg.id} className="p-3 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-between text-xs">
                                <div>
                                    <p className="font-medium text-gray-900">{reg.schedule?.gym_class?.name}</p>
                                    <p className="text-[10px] text-gray-400">Ruangan: {reg.schedule?.room}</p>
                                </div>
                                <span className="text-xs text-gray-600 font-medium">
                                    {formatInTimezone(reg.schedule?.start_time, systemTimezone, { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        ))
                    )}
                </div>

                {/* Personal Trainer List Section */}
                <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                        <h3 className="font-bold text-sm text-gray-900">Personal Trainer</h3>
                        <Link href="/member/trainers" className="text-xs text-blue-600 hover:underline font-medium">
                            Lihat Semua →
                        </Link>
                    </div>

                    {trainers.length === 0 ? (
                        <div className="py-6 text-center text-xs text-gray-400">
                            Belum ada personal trainer terdaftar.
                        </div>
                    ) : (
                        <div className="flex gap-3.5 overflow-x-auto pb-2 pt-1 snap-x snap-mandatory scrollbar-none sm:grid sm:grid-cols-2 sm:overflow-visible">
                            {trainers.map((tr) => {
                                const portraitUrl = tr.portrait_photo || tr.photo;

                                return (
                                    <Link
                                        key={tr.id}
                                        href={`/member/trainers?select=${tr.id}`}
                                        className="relative rounded-xl overflow-hidden shadow-sm border border-slate-800 bg-slate-900 group h-[280px] w-[210px] sm:w-auto shrink-0 snap-start flex flex-col justify-end transition-all transform hover:-translate-y-1 hover:shadow-md cursor-pointer block text-left"
                                    >
                                        {/* Background Portrait Photo */}
                                        {portraitUrl ? (
                                            <img
                                                src={portraitUrl}
                                                alt={tr.full_name}
                                                className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-950 flex items-center justify-center">
                                                <span className="text-4xl font-extrabold text-white/30 tracking-widest uppercase">
                                                    {tr.full_name.substring(0, 2)}
                                                </span>
                                            </div>
                                        )}

                                        {/* Gradient Dark Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 via-45% to-black/10" />

                                        {/* Card Content Overlay */}
                                        <div className="relative z-10 p-4 space-y-1.5 text-white">
                                            {tr.specialization && (
                                                <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-white/20 backdrop-blur-md border border-white/30 text-white shadow-2xs">
                                                    {tr.specialization}
                                                </span>
                                            )}
                                            <h4 className="text-base font-extrabold tracking-tight text-white leading-snug drop-shadow-xs">
                                                {tr.full_name}
                                            </h4>
                                            {tr.bio && (
                                                <p className="text-[11px] text-white/80 line-clamp-2 leading-relaxed drop-shadow-2xs">
                                                    {tr.bio}
                                                </p>
                                            )}
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </MemberLayout>
    );
}

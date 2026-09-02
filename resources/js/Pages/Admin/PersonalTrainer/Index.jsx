import React, { useState } from 'react';
import { Head, useForm, router, Link, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Pagination from '@/Components/Pagination';
import { getTimezoneAbbr, formatInTimezone } from '@/Utils/timezone';

export default function PtSessionsIndex({ ptSessions, allCalendarSessions, trainers, members, ptPackages, filters }) {
    const pageProps = usePage().props;
    const { auth } = pageProps;
    const systemTimezone = pageProps.gym_settings?.system_timezone || pageProps.gymSettings?.system_timezone || 'Asia/Jakarta';
    const tzAbbr = getTimezoneAbbr(systemTimezone);
    const isTrainerRole = auth?.user?.roles?.includes('Trainer') || auth?.user?.roles?.[0] === 'Trainer';
    const todayStr = new Date().toISOString().split('T')[0];
    const today = new Date();

    const [selectedTrainer, setSelectedTrainer] = useState(filters?.trainer_id || '');
    const [selectedMember, setSelectedMember] = useState(filters?.member_id || '');
    const [selectedDate, setSelectedDate] = useState(filters?.date || '');

    // Month & Year state for calendar navigation
    const [calMonth, setCalMonth] = useState(filters?.month ? parseInt(filters.month) - 1 : today.getMonth());
    const [calYear, setCalYear] = useState(filters?.year ? parseInt(filters.year) : today.getFullYear());

    const safeCalendarSessions = Array.isArray(allCalendarSessions)
        ? allCalendarSessions
        : Array.isArray(allCalendarSessions?.data)
        ? allCalendarSessions.data
        : [];

    const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const dayNames = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

    // Generate Calendar Days Grid
    const getMonthGrid = (year, month) => {
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        let startDayOfWeek = firstDay.getDay() - 1;
        if (startDayOfWeek === -1) startDayOfWeek = 6;

        const grid = [];
        const prevMonthLastDay = new Date(year, month, 0).getDate();

        // Prev month days
        for (let i = startDayOfWeek - 1; i >= 0; i--) {
            const d = new Date(year, month - 1, prevMonthLastDay - i);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const dt = String(d.getDate()).padStart(2, '0');
            grid.push({ date: d, dayNumber: prevMonthLastDay - i, isCurrentMonth: false, dateStr: `${y}-${m}-${dt}` });
        }

        // Current month days
        for (let day = 1; day <= lastDay.getDate(); day++) {
            const d = new Date(year, month, day);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const dt = String(d.getDate()).padStart(2, '0');
            grid.push({ date: d, dayNumber: day, isCurrentMonth: true, dateStr: `${y}-${m}-${dt}` });
        }

        // Next month days padding
        const totalNeeded = grid.length > 35 ? 42 : 35;
        const remaining = totalNeeded - grid.length;
        for (let day = 1; day <= remaining; day++) {
            const d = new Date(year, month + 1, day);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const dt = String(d.getDate()).padStart(2, '0');
            grid.push({ date: d, dayNumber: day, isCurrentMonth: false, dateStr: `${y}-${m}-${dt}` });
        }

        return grid;
    };

    const calendarGrid = getMonthGrid(calYear, calMonth);

    // Month Navigation Functions
    const handlePrevMonth = () => {
        let newMonth = calMonth - 1;
        let newYear = calYear;
        if (newMonth < 0) {
            newMonth = 11;
            newYear = calYear - 1;
        }
        setCalMonth(newMonth);
        setCalYear(newYear);
        router.get('/personal-trainer', { trainer_id: selectedTrainer, month: newMonth + 1, year: newYear, date: selectedDate }, { preserveState: true });
    };

    const handleNextMonth = () => {
        let newMonth = calMonth + 1;
        let newYear = calYear;
        if (newMonth > 11) {
            newMonth = 0;
            newYear = calYear + 1;
        }
        setCalMonth(newMonth);
        setCalYear(newYear);
        router.get('/personal-trainer', { trainer_id: selectedTrainer, month: newMonth + 1, year: newYear, date: selectedDate }, { preserveState: true });
    };

    const handleFilterTrainer = (trainerId) => {
        setSelectedTrainer(trainerId);
        router.get('/personal-trainer', { trainer_id: trainerId, month: calMonth + 1, year: calYear, date: selectedDate }, { preserveState: true });
    };

    const handleSelectCalendarDate = (dateStr) => {
        if (selectedDate === dateStr) {
            setSelectedDate('');
            router.get('/personal-trainer', { trainer_id: selectedTrainer, month: calMonth + 1, year: calYear }, { preserveState: true });
        } else {
            setSelectedDate(dateStr);
            router.get('/personal-trainer', { trainer_id: selectedTrainer, date: dateStr, month: calMonth + 1, year: calYear }, { preserveState: true });
        }
    };

    const handleCancelSession = (id) => {
        if (confirm('Batalkan jadwal sesi Personal Trainer ini?')) {
            router.post(`/personal-trainer/${id}/cancel`);
        }
    };

    return (
        <AdminLayout title="Jadwal & Sesi PT">
            <Head title="Jadwal & Sesi PT" />

            <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans antialiased text-gray-900">
                {/* Header Banner */}
                <div className="bg-white rounded-3xl border border-gray-100/80 shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link href="/trainer/profile" title="Profil Coach" className="shrink-0">
                            <div className="w-11 h-11 rounded-full overflow-hidden border-2 border-blue-500 shadow-xs relative bg-blue-600 text-white font-bold text-sm flex items-center justify-center shrink-0">
                                {auth?.user?.photo && (
                                    <img
                                        src={auth.user.photo}
                                        alt=""
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                        className="w-full h-full object-cover absolute inset-0 z-10"
                                    />
                                )}
                                <span className="z-0">{(auth?.user?.name || 'Coach').substring(0, 2).toUpperCase()}</span>
                            </div>
                        </Link>
                        <div>
                            <h1 className="text-base font-bold text-slate-900 leading-tight">Halo, {auth?.user?.name || 'Coach'}! 👋</h1>
                            <p className="text-xs text-gray-500 mt-0.5">Semangat melatih client hari ini!</p>
                        </div>
                    </div>
                    {!isTrainerRole && (
                        <Link
                            href="/personal-trainer/create"
                            className="w-full sm:w-auto px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl transition-colors text-center cursor-pointer shadow-xs"
                        >
                            Tambah Sesi PT
                        </Link>
                    )}
                </div>

                {/* Main Interactive Month Calendar Section */}
                <div className="bg-white p-4 rounded-lg border border-gray-200 space-y-4">
                    {/* Calendar Header Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                        <div className="flex items-center gap-3">
                            <h2 className="text-sm font-semibold text-slate-900">
                                Kalender Sesi PT ({monthNames[calMonth]} {calYear})
                            </h2>
                            <button
                                type="button"
                                onClick={() => {
                                    setCalMonth(today.getMonth());
                                    setCalYear(today.getFullYear());
                                    router.get('/personal-trainer', { trainer_id: selectedTrainer, month: today.getMonth() + 1, year: today.getFullYear() }, { preserveState: true });
                                }}
                                className="text-[11px] font-medium text-slate-700 bg-gray-100 px-2 py-0.5 rounded hover:bg-gray-200 transition-colors"
                            >
                                Bulan Ini
                            </button>
                        </div>

                        {/* Controls: Filter Coach & Month Arrow Navigation */}
                        <div className="flex items-center gap-2 flex-wrap">
                            {!isTrainerRole && (
                                <div className="flex items-center gap-1.5 bg-white border border-gray-300 px-2.5 py-1 rounded-lg text-xs">
                                    <span className="font-medium text-gray-600">Coach:</span>
                                    <select
                                        value={selectedTrainer}
                                        onChange={(e) => handleFilterTrainer(e.target.value)}
                                        className="bg-transparent text-xs font-medium text-slate-900 focus:outline-none cursor-pointer"
                                    >
                                        <option value="">Semua Coach PT</option>
                                        {trainers.map((t) => (
                                            <option key={t.id} value={t.id}>{t.full_name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={handlePrevMonth}
                                    className="w-7 h-7 flex items-center justify-center text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-md border border-gray-200 transition-colors"
                                    title="Bulan Sebelumnya"
                                >
                                    ‹
                                </button>
                                <button
                                    type="button"
                                    onClick={handleNextMonth}
                                    className="w-7 h-7 flex items-center justify-center text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-md border border-gray-200 transition-colors"
                                    title="Bulan Berikutnya"
                                >
                                    ›
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Calendar Grid */}
                    <div>
                        {/* Days of Week Header */}
                        <div className="grid grid-cols-7 text-center border-b border-gray-200 pb-2 mb-2">
                            {dayNames.map((day, idx) => (
                                <div key={idx} className="text-xs font-semibold text-gray-500">
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Dates Cells Grid */}
                        <div className="grid grid-cols-7 gap-1.5">
                            {calendarGrid.map((cell, idx) => {
                                const isDateActive = selectedDate === cell.dateStr;
                                const isToday = cell.dateStr === todayStr;

                                const daySessions = safeCalendarSessions.filter((s) => s.session_date === cell.dateStr);

                                return (
                                    <div
                                        key={idx}
                                        onClick={() => handleSelectCalendarDate(cell.dateStr)}
                                        className={`min-h-[92px] rounded-md border p-1.5 flex flex-col justify-between transition-all cursor-pointer select-none relative ${
                                            isDateActive
                                                ? 'bg-blue-50/60 border-2 border-blue-600 ring-2 ring-blue-500/20 text-slate-900 shadow-2xs'
                                                : cell.isCurrentMonth
                                                ? 'bg-white border-gray-200 hover:border-gray-300 text-slate-900'
                                                : 'bg-gray-50/50 border-gray-100 text-gray-300 hover:bg-gray-100'
                                        }`}
                                    >
                                        {/* Day Header */}
                                        <div className="w-full flex items-center justify-between">
                                            <span className={`text-xs font-semibold ${isToday ? 'bg-blue-600 text-white px-1.5 py-0.2 rounded text-[11px]' : isDateActive ? 'text-blue-700 font-bold' : ''}`}>
                                                {cell.dayNumber}
                                            </span>

                                            {daySessions.length > 0 && (
                                                <span className={`text-[9px] font-medium px-1 rounded border ${isDateActive ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                                    {daySessions.length} Sesi
                                                </span>
                                            )}
                                        </div>

                                        {/* Client Sessions Badges inside Date Cell */}
                                        {daySessions.length > 0 ? (
                                            <div className="w-full space-y-1 my-1 overflow-hidden">
                                                {daySessions.slice(0, 3).map((sess, sIdx) => {
                                                    const startTimeStr = sess.start_time ? sess.start_time.substring(0, 5) : '';
                                                    const endTimeStr = sess.end_time ? sess.end_time.substring(0, 5) : '';
                                                    const timeRangeStr = endTimeStr ? `${startTimeStr}-${endTimeStr}` : startTimeStr;
                                                    const memberName = sess.member?.full_name ? sess.member.full_name.split(' ')[0] : 'Client';
                                                    const trainerName = sess.trainer?.full_name ? sess.trainer.full_name.split(' ')[0] : 'PT';

                                                    const isCompleted = sess.status === 'completed';
                                                    const isCancelled = sess.status === 'cancelled';

                                                    return (
                                                        <div
                                                            key={sess.id || sIdx}
                                                            className={`w-full px-1 py-0.5 rounded text-[9px] font-medium flex items-center justify-between truncate border ${
                                                                isCompleted
                                                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
                                                                    : isCancelled
                                                                    ? 'bg-gray-100 text-gray-600 border-gray-200 line-through opacity-75'
                                                                    : 'bg-amber-50 text-amber-900 border-amber-200/80'
                                                            }`}
                                                            title={`${timeRangeStr} ${tzAbbr} • ${sess.member?.full_name || 'Client'} (Coach ${sess.trainer?.full_name || 'PT'})`}
                                                        >
                                                            <span className="truncate">{timeRangeStr} {memberName}</span>
                                                        </div>
                                                    );
                                                })}
                                                {daySessions.length > 3 && (
                                                    <span className="text-[8px] text-gray-500 font-medium block text-center">
                                                        +{daySessions.length - 3} sesi
                                                    </span>
                                                )}
                                            </div>
                                        ) : (
                                            <div className="my-auto text-center">
                                                <span className="text-[10px] text-gray-300">Kosong</span>
                                            </div>
                                        )}

                                        <div className="w-full text-right text-[9px] text-gray-400 font-medium">
                                            {isDateActive ? 'Terpilih' : ''}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Session Details List Table */}
                <div className="bg-white rounded-3xl border border-gray-100/80 shadow-xs overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <div>
                            <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                                Rincian Daftar Sesi PT {selectedDate ? `Tanggal ${selectedDate}` : ''}
                            </h2>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {selectedDate ? `Menampilkan sesi latihan khusus tanggal ${selectedDate}` : 'Menampilkan seluruh rincian sesi Personal Trainer'}
                            </p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50/50 text-[11px] font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-100 uppercase tracking-wider">
                                <tr>
                                    <th className="px-4 py-3">Coach / Trainer</th>
                                    <th className="px-4 py-3">Member Client</th>
                                    <th className="px-4 py-3">Tanggal & Jam Sesi</th>
                                    <th className="px-4 py-3">Catatan Program</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {ptSessions.data.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-4 py-8 text-center text-gray-400 text-xs">
                                            Tidak ada sesi Personal Trainer yang terdaftar untuk kriteria filter ini.
                                        </td>
                                    </tr>
                                ) : (
                                    ptSessions.data.map((sess) => (
                                        <tr key={sess.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 text-slate-900">
                                                <p className="font-semibold text-slate-900 text-xs">{sess.trainer?.full_name || 'Coach PT'}</p>
                                                <p className="text-[10px] text-gray-400">{sess.trainer?.specialization || 'Fitness Coach'}</p>
                                            </td>
                                            <td className="px-4 py-3 text-gray-700">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    <p className="font-semibold text-slate-900 text-xs">{sess.member?.full_name}</p>
                                                    {sess.is_group && (
                                                        <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
                                                            Berdua ({sess.member_count} Client)
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-gray-400">{sess.member?.member_code}</p>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-600">
                                                <p className="text-xs font-medium text-slate-900">
                                                    {formatInTimezone(sess.session_date, systemTimezone, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                                                </p>
                                                <p className="text-[11px] font-mono text-gray-500">
                                                    {sess.start_time} - {sess.end_time} {tzAbbr}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-600 max-w-xs truncate">
                                                {sess.notes || '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                                                    sess.status === 'scheduled' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                                    sess.status === 'completed' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                                                    'bg-rose-50 text-rose-800 border-rose-200'
                                                }`}>
                                                    {sess.status === 'scheduled' ? 'Terjadwal' : sess.status === 'completed' ? 'Selesai' : 'Dibatalkan'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                {sess.status === 'scheduled' && (() => {
                                                    const sessionDateObj = new Date(`${sess.session_date}T${sess.start_time}`);
                                                    const isPast = sessionDateObj < new Date();
                                                    return isPast ? (
                                                        <span className="text-[11px] text-gray-400 font-medium italic">Sudah Lewat</span>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleCancelSession(sess.id)}
                                                            className="px-2 py-1 text-xs font-medium text-rose-600 hover:text-rose-700 bg-white border border-gray-300 hover:border-rose-300 rounded transition-colors cursor-pointer"
                                                        >
                                                            Batalkan
                                                        </button>
                                                    );
                                                })()}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination paginator={ptSessions} />
                </div>
            </div>
        </AdminLayout>
    );
}

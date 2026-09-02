import React, { useState } from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';

export default function PersonalTrainerCreate(props = {}) {
    const trainers = props?.trainers;
    const members = props?.members;
    const ptPackages = props?.ptPackages;
    const rawExisting = props?.existingSessions;

    const safeTrainers = Array.isArray(trainers) ? trainers : (Array.isArray(trainers?.data) ? trainers.data : []);
    const safeMembers = Array.isArray(members) ? members : (Array.isArray(members?.data) ? members.data : []);
    const safePtPackages = Array.isArray(ptPackages) ? ptPackages : (Array.isArray(ptPackages?.data) ? ptPackages.data : []);
    const safeExistingSessions = Array.isArray(rawExisting) ? rawExisting : (Array.isArray(rawExisting?.data) ? rawExisting.data : []);

    const today = new Date();
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed

    // Member Live Search States
    const [member1SearchQuery, setMember1SearchQuery] = useState('');
    const [selectedMember1, setSelectedMember1] = useState(null);
    const [isMember1Open, setIsMember1Open] = useState(false);

    const [member2SearchQuery, setMember2SearchQuery] = useState('');
    const [selectedMember2, setSelectedMember2] = useState(null);
    const [isMember2Open, setIsMember2Open] = useState(false);

    // Form state
    const [sessionType, setSessionType] = useState('private'); // 'private' | 'semi-private'
    const [defaultStartTime, setDefaultStartTime] = useState('09:00');
    const [defaultEndTime, setDefaultEndTime] = useState('10:00');

    const form = useForm({
        trainer_id: safeTrainers[0]?.id ? String(safeTrainers[0].id) : '',
        member_id: '',
        secondary_member_id: '',
        pt_package_id: safePtPackages[0]?.id ? String(safePtPackages[0].id) : '',
        notes: '',
        sessions: [], // array of { date: 'YYYY-MM-DD', start_time: '09:00', end_time: '10:00' }
    });

    // Filter members for live search
    const filteredMembers1 = safeMembers.filter((m) =>
        (m.full_name?.toLowerCase().includes(member1SearchQuery.toLowerCase()) ||
        m.member_code?.toLowerCase().includes(member1SearchQuery.toLowerCase()) ||
        m.phone?.toLowerCase().includes(member1SearchQuery.toLowerCase())) &&
        String(m.id) !== String(form.data.secondary_member_id)
    );

    const filteredMembers2 = safeMembers.filter((m) =>
        (m.full_name?.toLowerCase().includes(member2SearchQuery.toLowerCase()) ||
        m.member_code?.toLowerCase().includes(member2SearchQuery.toLowerCase()) ||
        m.phone?.toLowerCase().includes(member2SearchQuery.toLowerCase())) &&
        String(m.id) !== String(form.data.member_id)
    );

    const handleSelectMember1 = (m) => {
        setSelectedMember1(m);
        form.setData('member_id', String(m.id));
        setMember1SearchQuery('');
        setIsMember1Open(false);
    };

    const handleSelectMember2 = (m) => {
        setSelectedMember2(m);
        form.setData('secondary_member_id', String(m.id));
        setMember2SearchQuery('');
        setIsMember2Open(false);
    };

    const formatIDR = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

    const sessionCount = form.data.sessions.length;

    // Minimum package session calculation from active gym packages
    const activePackages = safePtPackages
        .filter((p) => p.status === 'active')
        .sort((a, b) => Number(a.total_sessions) - Number(b.total_sessions));

    const minPackage = activePackages[0] || null;
    const minSessions = minPackage ? Number(minPackage.total_sessions) : 1;
    const isBelowMinimum = sessionCount > 0 && sessionCount < minSessions;

    const matchedPtPackage = safePtPackages.find((p) => Number(p.total_sessions) === sessionCount) || null;

    // Unit rate estimation if no exact package matches (e.g. rate per session)
    const baseRatePerSession = safePtPackages.length > 0
        ? Math.round(Number(safePtPackages[0].price) / (Number(safePtPackages[0].total_sessions) || 1))
        : 150000;

    const effectivePrice = matchedPtPackage ? Number(matchedPtPackage.price) : sessionCount * baseRatePerSession;
    const effectivePackageName = matchedPtPackage ? matchedPtPackage.name : (sessionCount > 0 ? `Paket PT ${sessionCount} Sesi` : 'Paket PT');

    // Calendar Grid Helper Functions
    const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const dayNames = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

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

    const calendarGrid = getMonthGrid(currentYear, currentMonth);

    // Toggle Date Selection
    const handleToggleDate = (dateStr) => {
        const existingIdx = form.data.sessions.findIndex((s) => s.date === dateStr);
        let updated = [...form.data.sessions];

        if (existingIdx >= 0) {
            updated.splice(existingIdx, 1);
        } else {
            updated.push({
                date: dateStr,
                start_time: defaultStartTime,
                end_time: defaultEndTime,
            });
        }

        updated.sort((a, b) => (a.date > b.date ? 1 : -1));

        const matchingPkg = safePtPackages.find((p) => Number(p.total_sessions) === updated.length);
        form.setData((prev) => ({
            ...prev,
            sessions: updated,
            pt_package_id: matchingPkg ? String(matchingPkg.id) : '',
        }));
    };

    // Update Time per Session
    const handleTimeChange = (dateStr, field, value) => {
        const updated = form.data.sessions.map((s) => {
            if (s.date === dateStr) {
                return { ...s, [field]: value };
            }
            return s;
        });
        form.setData('sessions', updated);
    };

    const handleApplyDefaultTimeToAll = () => {
        const updated = form.data.sessions.map((s) => ({
            ...s,
            start_time: defaultStartTime,
            end_time: defaultEndTime,
        }));
        form.setData('sessions', updated);
    };

    // Month Navigation
    const handlePrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(currentYear - 1);
        } else {
            setCurrentMonth(currentMonth - 1);
        }
    };

    const handleNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(currentYear + 1);
        } else {
            setCurrentMonth(currentMonth + 1);
        }
    };

    // Helper to check if a session time overlaps with any existing scheduled session
    const getSessionCollision = (dateStr, startTime, endTime) => {
        if (!dateStr || !startTime || !endTime) return null;

        return safeExistingSessions.find((existing) => {
            if (existing.session_date !== dateStr) return false;

            if (form.data.trainer_id && String(existing.trainer_id) !== String(form.data.trainer_id)) {
                return false;
            }

            const exStart = existing.start_time ? existing.start_time.substring(0, 5) : '';
            const exEnd = existing.end_time ? existing.end_time.substring(0, 5) : '';

            if (!exStart || !exEnd) return false;

            return startTime < exEnd && endTime > exStart;
        });
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!form.data.member_id) {
            alert('Silakan pilih member client terlebih dahulu.');
            return;
        }

        if (minPackage && form.data.sessions.length < minSessions) {
            alert(`Minimal pemesanan adalah ${minSessions} sesi.`);
            return;
        }

        const collidingSessions = form.data.sessions.filter(s => getSessionCollision(s.date, s.start_time, s.end_time));
        if (collidingSessions.length > 0) {
            if (!confirm(`Peringatan Bentrok Jadwal:\n\nTerdapat ${collidingSessions.length} sesi yang jamnya bertabrakan dengan jadwal lain yang sudah ada.\n\nApakah Anda tetap ingin melanjutkan dan menyimpan jadwal ini?`)) {
                return;
            }
        }

        form.post('/personal-trainer/store-multiple');
    };

    const formatReadableDate = (dateStr) => {
        try {
            const parts = dateStr.split('-');
            const d = new Date(parts[0], parts[1] - 1, parts[2]);
            return d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    return (
        <AdminLayout title="Penjadwalan Sesi PT">
            <Head title="Penjadwalan Sesi PT" />

            <div className="space-y-5 max-w-6xl mx-auto">
                {/* Clean Page Header */}
                <div className="bg-white rounded-3xl border border-gray-100/80 shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/personal-trainer"
                            className="w-8 h-8 flex items-center justify-center text-sm font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors"
                            title="Kembali ke Jadwal PT"
                        >
                            ←
                        </Link>
                        <div>
                            <h1 className="text-base font-semibold text-slate-900">
                                Penjadwalan Multi-Sesi PT
                            </h1>
                            <p className="text-xs text-gray-500 mt-0.5">
                                Atur coach, pilih member client, dan tentukan tanggal latihan melalui kalender interaktif.
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                    {/* LEFT PANEL: Form Inputs (4 Columns) */}
                    <div className="lg:col-span-4 space-y-4 bg-white p-4 rounded-xl border border-gray-200 self-start">
                        <div className="border-b border-gray-100 pb-2.5">
                            <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                                Parameter Sesi & Client
                            </h2>
                        </div>

                        {/* Trainer Selection */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Personal Trainer / Coach</label>
                            <select
                                value={form.data.trainer_id}
                                onChange={(e) => form.setData('trainer_id', e.target.value)}
                                className="w-full text-xs bg-white border border-gray-200 rounded-xl px-3 py-2 text-gray-900 focus:ring-1 focus:ring-slate-900 focus:border-slate-900 focus:outline-none"
                                required
                            >
                                {safeTrainers.map((t) => (
                                    <option key={t.id} value={t.id}>
                                        {t.full_name} ({t.specialization || 'PT Coach'})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Mode Sesi: Private vs Semi-Private */}
                        <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">Mode Sesi</label>
                            <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-100 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSessionType('private');
                                        setSelectedMember2(null);
                                        form.setData('secondary_member_id', '');
                                    }}
                                    className={`py-1.5 text-xs font-medium rounded-md transition-colors text-center ${
                                        sessionType === 'private' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    Private (1 Client)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setSessionType('semi-private')}
                                    className={`py-1.5 text-xs font-medium rounded-md transition-colors text-center ${
                                        sessionType === 'semi-private' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-gray-600 hover:text-gray-900'
                                    }`}
                                >
                                    Semi-Private (2 Client)
                                </button>
                            </div>
                        </div>

                        {/* Primary Member Live Search */}
                        <div className="space-y-1.5">
                            <label className="block text-xs font-medium text-gray-700">
                                {sessionType === 'semi-private' ? 'Client Utama (Member 1)' : 'Pilih Member Client'}
                            </label>

                            {selectedMember1 ? (
                                <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-gray-200 rounded-xl">
                                    <div>
                                        <p className="text-xs font-semibold text-slate-900">{selectedMember1.full_name}</p>
                                        <p className="text-[10px] text-gray-500">{selectedMember1.member_code} • {selectedMember1.phone || '—'}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setSelectedMember1(null);
                                            form.setData('member_id', '');
                                            setIsMember1Open(true);
                                        }}
                                        className="text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-gray-300 px-2 py-0.5 rounded transition-colors"
                                    >
                                        Ganti
                                    </button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={member1SearchQuery}
                                        onFocus={() => setIsMember1Open(true)}
                                        onChange={(e) => {
                                            setMember1SearchQuery(e.target.value);
                                            setIsMember1Open(true);
                                        }}
                                        placeholder="Cari nama, kode, atau HP..."
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-900 focus:border-slate-900 focus:outline-none bg-white"
                                    />

                                    {isMember1Open && (
                                        <div className="absolute z-30 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-md divide-y divide-gray-100">
                                            {filteredMembers1.length === 0 ? (
                                                <p className="p-3 text-xs text-gray-400 text-center">Member tidak ditemukan.</p>
                                            ) : (
                                                filteredMembers1.map((m) => (
                                                    <button
                                                        type="button"
                                                        key={m.id}
                                                        onClick={() => handleSelectMember1(m)}
                                                        className="w-full text-left p-2 hover:bg-gray-50 flex items-center justify-between transition-colors"
                                                    >
                                                        <div>
                                                            <p className="text-xs font-medium text-slate-900">{m.full_name}</p>
                                                            <p className="text-[10px] text-gray-500">{m.member_code}</p>
                                                        </div>
                                                        <span className="text-[10px] font-medium text-slate-700 bg-gray-100 px-2 py-0.5 rounded">Pilih</span>
                                                    </button>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Secondary Member Live Search for Semi-Private */}
                        {sessionType === 'semi-private' && (
                            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-1.5">
                                <label className="block text-xs font-medium text-slate-900">Client Kedua (Member 2)</label>

                                {selectedMember2 ? (
                                    <div className="flex items-center justify-between p-2 bg-white border border-gray-200 rounded-md">
                                        <div>
                                            <p className="text-xs font-semibold text-slate-900">{selectedMember2.full_name}</p>
                                            <p className="text-[10px] text-gray-500">{selectedMember2.member_code}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setSelectedMember2(null);
                                                form.setData('secondary_member_id', '');
                                                setIsMember2Open(true);
                                            }}
                                            className="text-xs font-medium text-slate-700 hover:text-slate-900 bg-gray-50 border border-gray-300 px-2 py-0.5 rounded transition-colors"
                                        >
                                            Ganti
                                        </button>
                                    </div>
                                ) : (
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={member2SearchQuery}
                                            onFocus={() => setIsMember2Open(true)}
                                            onChange={(e) => {
                                                setMember2SearchQuery(e.target.value);
                                                setIsMember2Open(true);
                                            }}
                                            placeholder="Cari member pasangan..."
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:ring-1 focus:ring-slate-900 focus:border-slate-900 focus:outline-none bg-white"
                                        />

                                        {isMember2Open && (
                                            <div className="absolute z-30 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-md divide-y divide-gray-100">
                                                {filteredMembers2.length === 0 ? (
                                                    <p className="p-3 text-xs text-gray-400 text-center">Member tidak ditemukan.</p>
                                                ) : (
                                                    filteredMembers2.map((m) => (
                                                        <button
                                                            type="button"
                                                            key={m.id}
                                                            onClick={() => handleSelectMember2(m)}
                                                            className="w-full text-left p-2 hover:bg-gray-50 flex items-center justify-between transition-colors"
                                                        >
                                                            <div>
                                                                <p className="text-xs font-medium text-slate-900">{m.full_name}</p>
                                                                <p className="text-[10px] text-gray-500">{m.member_code}</p>
                                                            </div>
                                                            <span className="text-[10px] font-medium text-slate-700 bg-gray-100 px-2 py-0.5 rounded">Pilih</span>
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Default Time Inputs */}
                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                            <div>
                                <label className="block text-[11px] font-medium text-gray-700 mb-1">Jam Mulai</label>
                                <input
                                    type="time"
                                    value={defaultStartTime}
                                    onChange={(e) => setDefaultStartTime(e.target.value)}
                                    className="w-full text-xs border border-gray-200 rounded-xl px-2.5 py-1.5 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-[11px] font-medium text-gray-700 mb-1">Jam Selesai</label>
                                <input
                                    type="time"
                                    value={defaultEndTime}
                                    onChange={(e) => setDefaultEndTime(e.target.value)}
                                    className="w-full text-xs border border-gray-200 rounded-xl px-2.5 py-1.5 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                                />
                            </div>
                        </div>

                        {form.data.sessions.length > 0 && (
                            <button
                                type="button"
                                onClick={handleApplyDefaultTimeToAll}
                                className="w-full text-[11px] font-medium text-slate-700 hover:text-slate-900 bg-gray-50 hover:bg-gray-100 py-1.5 rounded-xl border border-gray-200 transition-colors"
                            >
                                Terapkan Jam ({defaultStartTime} - {defaultEndTime}) ke Semua Tanggal
                            </button>
                        )}

                        {/* Catatan Sesi */}
                        <div className="pt-2">
                            <label className="block text-xs font-medium text-gray-700 mb-1">Catatan Program (Opsional)</label>
                            <input
                                type="text"
                                value={form.data.notes}
                                onChange={(e) => form.setData('notes', e.target.value)}
                                placeholder="Contoh: Program Muscle Building"
                                className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2 focus:ring-1 focus:ring-slate-900 focus:outline-none"
                            />
                        </div>
                    </div>

                    {/* RIGHT PANEL: Interactive Calendar & Schedule Summary (8 Columns) */}
                    <div className="lg:col-span-8 space-y-5">
                        {/* Interactive Month Calendar */}
                        <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-4">
                            {/* Calendar Header Controls */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <h2 className="text-sm font-semibold text-slate-900">
                                        {monthNames[currentMonth]} {currentYear}
                                    </h2>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setCurrentYear(today.getFullYear());
                                            setCurrentMonth(today.getMonth());
                                        }}
                                        className="text-[10px] font-medium text-slate-700 bg-gray-100 hover:bg-gray-200 px-2 py-0.5 rounded transition-colors"
                                    >
                                        Bulan Ini
                                    </button>
                                </div>
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

                            {/* Calendar Days Table */}
                            <div className="w-full">
                                {/* Weekday Headers */}
                                <div className="grid grid-cols-7 gap-1 text-center mb-1">
                                    {dayNames.map((d) => (
                                        <div key={d} className="text-[11px] font-medium text-gray-500 py-1">
                                            {d}
                                        </div>
                                    ))}
                                </div>

                                {/* Day Cells */}
                                <div className="grid grid-cols-7 gap-1">
                                    {calendarGrid.map((cell, idx) => {
                                        const isSelected = form.data.sessions.some((s) => s.date === cell.dateStr);
                                        const sessionIndex = form.data.sessions.findIndex((s) => s.date === cell.dateStr);
                                        const currentSession = isSelected ? form.data.sessions[sessionIndex] : null;

                                        // Check collision
                                        const hasCollision = isSelected && currentSession && getSessionCollision(currentSession.date, currentSession.start_time, currentSession.end_time);

                                        // Existing sessions for trainer on this date
                                        const dayExisting = safeExistingSessions.filter((s) => {
                                            if (s.session_date !== cell.dateStr) return false;
                                            if (form.data.trainer_id && String(s.trainer_id) !== String(form.data.trainer_id)) return false;
                                            return true;
                                        });

                                        return (
                                            <button
                                                type="button"
                                                key={idx}
                                                onClick={() => handleToggleDate(cell.dateStr)}
                                                className={`min-h-16 p-1.5 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                                                    hasCollision
                                                        ? 'bg-rose-50 border-rose-400 text-rose-900 ring-2 ring-rose-200'
                                                        : isSelected
                                                        ? 'bg-blue-50/60 border-2 border-blue-600 ring-2 ring-blue-500/20 text-slate-900 shadow-2xs'
                                                        : cell.isCurrentMonth
                                                        ? 'bg-white border-gray-200 text-gray-800 hover:border-blue-400 hover:bg-blue-50/20'
                                                        : 'bg-gray-50/50 border-gray-100 text-gray-300 hover:bg-gray-100'
                                                }`}
                                            >
                                                {/* Day Header */}
                                                <div className="w-full flex items-center justify-between">
                                                    <span className={`text-xs font-semibold ${isSelected && !hasCollision ? 'text-blue-700 font-bold' : ''}`}>
                                                        {cell.dayNumber}
                                                    </span>

                                                    {hasCollision ? (
                                                        <span className="text-[9px] font-semibold text-rose-700 bg-rose-100 px-1 rounded border border-rose-200">
                                                            Bentrok
                                                        </span>
                                                    ) : dayExisting.length > 0 ? (
                                                        <span className={`text-[9px] font-medium px-1 rounded border ${isSelected ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-amber-50 text-amber-900 border-amber-200'}`}>
                                                            {dayExisting.length} Sesi
                                                        </span>
                                                    ) : null}
                                                </div>

                                                {/* List of Existing Scheduled Sessions for selected PT */}
                                                {dayExisting.length > 0 && !isSelected && (
                                                    <div className="w-full space-y-1 my-1 overflow-hidden">
                                                        {dayExisting.slice(0, 2).map((exSess, eIdx) => {
                                                            const startTimeStr = exSess.start_time ? exSess.start_time.substring(0, 5) : '';
                                                            const endTimeStr = exSess.end_time ? exSess.end_time.substring(0, 5) : '';
                                                            const timeRangeStr = endTimeStr ? `${startTimeStr}-${endTimeStr}` : startTimeStr;
                                                            const memberName = exSess.member?.full_name ? exSess.member.full_name.split(' ')[0] : 'Client';

                                                            return (
                                                                <div
                                                                    key={exSess.id || eIdx}
                                                                    className="w-full px-1 py-0.5 rounded text-[9px] font-medium bg-amber-50 text-amber-900 border border-amber-200/80 flex items-center justify-between truncate"
                                                                >
                                                                    <span className="truncate">{memberName}</span>
                                                                    <span className="text-[8px] text-amber-800 shrink-0 ml-1 font-mono">{timeRangeStr}</span>
                                                                </div>
                                                            );
                                                        })}
                                                        {dayExisting.length > 2 && (
                                                            <span className="text-[8px] text-gray-500 italic block pl-1">
                                                                +{dayExisting.length - 2} sesi lain
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Selected New Session Tag */}
                                                {isSelected ? (
                                                    <span className={`w-full text-center text-[10px] font-semibold py-0.5 rounded tracking-wide mt-auto ${hasCollision ? 'bg-rose-600 text-white' : 'bg-blue-600 text-white shadow-2xs'}`}>
                                                        Sesi #{sessionIndex + 1}
                                                    </span>
                                                ) : (
                                                    <span className="text-[10px] text-gray-400 font-medium hover:text-slate-900 mt-auto">
                                                        + Pilih
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Selected Schedule List & Time Config */}
                        <div className="bg-white p-4 rounded-xl border border-gray-200 space-y-4">
                            {/* Summary Sesi Terpilih */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                                <div>
                                    <h2 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                                        Rincian Sesi Terpilih
                                    </h2>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Setiap tanggal yang dipilih otomatis dihitung sebagai sesi latihan.
                                    </p>
                                </div>

                                {sessionCount > 0 && (
                                    <div className={`px-3 py-1 border rounded-md text-xs font-semibold shrink-0 flex items-center gap-2 ${
                                        isBelowMinimum ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-blue-50 border-blue-200 text-blue-900'
                                    }`}>
                                        <span>Total: {sessionCount} Sesi</span>
                                        {isBelowMinimum && (
                                            <>
                                                <span className="text-amber-400">•</span>
                                                <span className="font-bold text-amber-800">Min. {minSessions} Sesi</span>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Warning alert if below minimum sessions */}
                            {isBelowMinimum && (
                                <div className="px-3 py-2 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-xs flex items-center justify-between">
                                    <span>Minimal pemilihan adalah <strong>{minSessions} sesi</strong> (kurang {minSessions - sessionCount} sesi lagi).</span>
                                    <span className="font-semibold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded text-[11px]">{sessionCount}/{minSessions} Sesi</span>
                                </div>
                            )}

                            {form.data.sessions.length === 0 ? (
                                <div className="py-8 text-center space-y-1 border border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                                    <p className="text-xs text-gray-500 font-medium">Belum ada tanggal yang dipilih.</p>
                                    <p className="text-[11px] text-gray-400">Klik tanggal pada kalender di atas untuk menambahkan sesi latihan.</p>
                                </div>
                            ) : (
                                <div className="max-h-72 overflow-y-auto space-y-2.5 pr-1">
                                    {form.data.sessions.map((sess, sIdx) => {
                                        const collision = getSessionCollision(sess.date, sess.start_time, sess.end_time);

                                        return (
                                            <div
                                                key={sess.date}
                                                className={`flex flex-col p-3 rounded-xl border transition-all ${
                                                    collision
                                                        ? 'bg-rose-50/80 border-rose-300'
                                                        : 'border-gray-200 bg-gray-50/50 hover:bg-white'
                                                }`}
                                            >
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <span className={`w-5 h-5 rounded-md text-white text-[10px] font-bold flex items-center justify-center shrink-0 ${collision ? 'bg-rose-600' : 'bg-slate-900'}`}>
                                                            {sIdx + 1}
                                                        </span>
                                                        <div>
                                                            <p className="text-xs font-semibold text-slate-900">{formatReadableDate(sess.date)}</p>
                                                            <p className="text-[10px] text-gray-500 font-mono">{sess.date}</p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2 self-end sm:self-auto">
                                                        <div className={`flex items-center gap-1 bg-white border rounded-md px-2 py-1 ${collision ? 'border-rose-300 ring-1 ring-rose-200' : 'border-gray-300'}`}>
                                                            <input
                                                                type="time"
                                                                value={sess.start_time}
                                                                onChange={(e) => handleTimeChange(sess.date, 'start_time', e.target.value)}
                                                                className="text-xs font-medium text-slate-900 border-none p-0 focus:ring-0"
                                                            />
                                                            <span className="text-xs text-gray-400">-</span>
                                                            <input
                                                                type="time"
                                                                value={sess.end_time}
                                                                onChange={(e) => handleTimeChange(sess.date, 'end_time', e.target.value)}
                                                                className="text-xs font-medium text-slate-900 border-none p-0 focus:ring-0"
                                                            />
                                                        </div>

                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleDate(sess.date)}
                                                            className="text-xs font-medium text-rose-600 hover:text-rose-700 bg-white border border-gray-300 hover:border-rose-300 px-2 py-1 rounded transition-colors cursor-pointer"
                                                        >
                                                            Hapus
                                                        </button>
                                                    </div>
                                                </div>

                                                {collision && (
                                                    <div className="mt-2 p-2 bg-white border border-rose-200 rounded text-rose-800 text-[11px] font-medium">
                                                        Peringatan Bentrok: Jam ({sess.start_time} - {sess.end_time}) bertabrakan dengan jadwal {collision.member?.full_name || 'Client'} ({collision.start_time?.substring(0, 5)} - {collision.end_time?.substring(0, 5)})
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Submit Button Bar */}
                            <div className="pt-3 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                    <div className="text-xs font-medium text-gray-700">
                                        {isBelowMinimum ? (
                                            <span className="text-amber-700 font-semibold">
                                                Minimal {minSessions} Sesi
                                            </span>
                                        ) : (
                                            <>
                                                Paket Terpilih: <strong className="text-slate-900 font-semibold">{effectivePackageName}</strong>
                                            </>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-gray-500 mt-0.5">
                                        {isBelowMinimum ? (
                                            <span className="text-amber-600">
                                                {sessionCount} dari {minSessions} sesi dipilih
                                            </span>
                                        ) : (
                                            `${sessionCount} tanggal sesi dipilih`
                                        )}
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={sessionCount === 0 || isBelowMinimum || form.processing || !form.data.member_id}
                                    className={`px-5 py-2.5 text-white text-xs font-semibold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5 ${
                                        isBelowMinimum
                                            ? 'bg-amber-600 hover:bg-amber-700 disabled:opacity-60 cursor-not-allowed'
                                            : 'bg-blue-600 hover:bg-blue-700 disabled:opacity-50 cursor-pointer'
                                    }`}
                                >
                                    {sessionCount === 0 ? (
                                        'Pilih Tanggal di Kalender'
                                    ) : isBelowMinimum ? (
                                        `Minimal ${minSessions} Sesi (${sessionCount}/${minSessions})`
                                    ) : (
                                        'Simpan & Lanjut ke POS Kasir'
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </form>
            </div>
        </AdminLayout>
    );
}

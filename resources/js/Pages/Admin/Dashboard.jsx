import React, { useState } from 'react';
import { Head, Link, usePage, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Users, DollarSign, QrCode, Calendar, AlertTriangle, ShoppingBag, Plus, Clock, UserCheck, ChevronLeft, ChevronRight, X, Phone, Mail, MapPin, Dumbbell, Search } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid } from 'recharts';
import { getTimezoneAbbr, formatInTimezone } from '@/Utils/timezone';

export default function Dashboard({ isTrainer, trainer, members = [], calendarEvents = {}, selectedMonth = new Date().getMonth() + 1, selectedYear = new Date().getFullYear(), startGridDate, endGridDate, metrics = {}, expiringMemberships = [], lowStockProducts = [], revenueChartData = [], attendanceChartData = [], recentCheckIns = [] }) {
    const pageProps = usePage().props;
    const { auth } = pageProps;
    const systemTimezone = pageProps.gym_settings?.system_timezone || pageProps.gymSettings?.system_timezone || 'Asia/Jakarta';
    const tzAbbr = getTimezoneAbbr(systemTimezone);
    const userRole = auth?.user?.roles?.[0] || 'User';
    const canSeeRevenue = ['Owner', 'Manager'].includes(userRole);

    const [monthFilter, setMonthFilter] = useState(selectedMonth);
    const [yearFilter, setYearFilter] = useState(selectedYear);
    const [selectedDate, setSelectedDate] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [quickAddDate, setQuickAddDate] = useState(null); // Clicked date for '+' button
    const [selectedEventDetail, setSelectedEventDetail] = useState(null); // Clicked event card detail

    // Search Member 1 State for Quick Add Modal
    const [member1SearchQuery, setMember1SearchQuery] = useState('');
    const [selectedMember1, setSelectedMember1] = useState(null);

    // Search Member 2 State (Optional / Berdua)
    const [showSecondMember, setShowSecondMember] = useState(false);
    const [member2SearchQuery, setMember2SearchQuery] = useState('');
    const [selectedMember2, setSelectedMember2] = useState(null);

    const addPtForm = useForm({
        trainer_id: trainer?.id || 1,
        member_id: '',
        secondary_member_id: '',
        session_date: '',
        start_time: '09:00',
        end_time: '10:00',
        notes: 'Sesi Latihan Personal Trainer',
    });

    const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const filteredMembers1 = members.filter((m) =>
        (m.full_name?.toLowerCase().includes(member1SearchQuery.toLowerCase()) ||
            m.member_code?.toLowerCase().includes(member1SearchQuery.toLowerCase()) ||
            m.phone?.toLowerCase().includes(member1SearchQuery.toLowerCase())) &&
        m.id !== selectedMember2?.id
    );

    const filteredMembers2 = members.filter((m) =>
        (m.full_name?.toLowerCase().includes(member2SearchQuery.toLowerCase()) ||
            m.member_code?.toLowerCase().includes(member2SearchQuery.toLowerCase()) ||
            m.phone?.toLowerCase().includes(member2SearchQuery.toLowerCase())) &&
        m.id !== selectedMember1?.id
    );

    const handleSelectMember1 = (member) => {
        setSelectedMember1(member);
        addPtForm.setData('member_id', member.id);
        setMember1SearchQuery('');
    };

    const handleSelectMember2 = (member) => {
        setSelectedMember2(member);
        addPtForm.setData('secondary_member_id', member.id);
        setMember2SearchQuery('');
    };

    const handleMonthChange = (newMonth, newYear) => {
        setMonthFilter(newMonth);
        setYearFilter(newYear);
        router.get('/dashboard', { month: newMonth, year: newYear }, { preserveState: true });
    };

    const openQuickAddModal = (dateStr) => {
        setSelectedMember1(null);
        setSelectedMember2(null);
        setShowSecondMember(false);
        setMember1SearchQuery('');
        setMember2SearchQuery('');
        addPtForm.setData({
            trainer_id: trainer?.id || 1,
            member_id: '',
            secondary_member_id: '',
            session_date: dateStr,
            start_time: '09:00',
            end_time: '10:00',
            notes: 'Sesi Latihan Personal Trainer',
        });
        setQuickAddDate(dateStr);
    };

    const handleQuickAddSubmit = (e) => {
        e.preventDefault();
        addPtForm.post('/personal-trainer', {
            onSuccess: () => {
                setQuickAddDate(null);
                setSelectedMember1(null);
                setSelectedMember2(null);
                setShowSecondMember(false);
                addPtForm.reset();
            },
        });
    };

    const formatIDR = (val) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

    const inputClass = 'w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500';

    // Trainer Full Month Calendar Grid View
    if (isTrainer) {
        // Build Full Month Grid (7 columns: Mon-Sun)
        const gridStartDate = startGridDate ? new Date(startGridDate) : new Date();
        const gridEndDate = endGridDate ? new Date(endGridDate) : new Date();

        const allGridDays = [];
        let curr = new Date(gridStartDate);

        while (curr <= gridEndDate) {
            const dateStr = curr.toISOString().split('T')[0];
            const dayNum = curr.getDate();
            const currMonth = curr.getMonth() + 1;
            const events = calendarEvents[dateStr] || [];

            allGridDays.push({
                dateStr,
                dayNum,
                isCurrentMonth: currMonth === Number(monthFilter),
                isToday: dateStr === new Date().toISOString().split('T')[0],
                events,
            });

            curr.setDate(curr.getDate() + 1);
        }

        // Collect all events in flat list for table display below calendar
        const allMonthEvents = Object.entries(calendarEvents).flatMap(([dateKey, events]) =>
            events.map((evt) => ({ ...evt, dateKey }))
        );

        const filteredSessionList = selectedDate
            ? allMonthEvents.filter((item) => item.dateKey === selectedDate)
            : allMonthEvents.sort((a, b) => a.dateKey.localeCompare(b.dateKey));

        const perPage = 10;
        const totalPages = Math.ceil(filteredSessionList.length / perPage) || 1;
        const paginatedSessionList = filteredSessionList.slice((currentPage - 1) * perPage, currentPage * perPage);

        return (
            <AdminLayout title="Jadwal & Sesi PT">
                <Head title="Jadwal & Sesi PT" />

                <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans antialiased text-gray-900">
                    {/* Header Banner */}
                    <div className="bg-white rounded-3xl p-6 border border-gray-100/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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

                    </div>

                    {/* Main Interactive Month Calendar Section */}
                    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-100/80 shadow-xs space-y-4">
                        {/* Calendar Header Controls */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3">
                            <div className="flex items-center gap-3">
                                <h2 className="text-sm font-semibold text-slate-900">
                                    Kalender Sesi PT ({monthNames[monthFilter - 1]} {yearFilter})
                                </h2>
                                <button
                                    type="button"
                                    onClick={() => {
                                        const today = new Date();
                                        handleMonthChange(today.getMonth() + 1, today.getFullYear());
                                        setSelectedDate('');
                                        setCurrentPage(1);
                                    }}
                                    className="text-[11px] font-medium text-slate-700 bg-gray-100 px-2 py-0.5 rounded hover:bg-gray-200 transition-colors cursor-pointer"
                                >
                                    Bulan Ini
                                </button>
                            </div>

                            {/* Controls: Month Arrow Navigation */}
                            <div className="flex items-center gap-2 flex-wrap">

                                <div className="flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => handleMonthChange(monthFilter === 1 ? 12 : monthFilter - 1, monthFilter === 1 ? yearFilter - 1 : yearFilter)}
                                        className="w-7 h-7 flex items-center justify-center text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-md border border-gray-200 transition-colors cursor-pointer"
                                        title="Bulan Sebelumnya"
                                    >
                                        ‹
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleMonthChange(monthFilter === 12 ? 1 : monthFilter + 1, monthFilter === 12 ? yearFilter + 1 : yearFilter)}
                                        className="w-7 h-7 flex items-center justify-center text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-md border border-gray-200 transition-colors cursor-pointer"
                                        title="Bulan Berikutnya"
                                    >
                                        ›
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Days Header */}
                        <div>
                            <div className="grid grid-cols-7 text-center border-b border-gray-200 pb-2 mb-2">
                                {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map((day, idx) => (
                                    <div key={idx} className="text-xs font-semibold text-gray-500">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Dates Cells Grid */}
                            <div className="grid grid-cols-7 gap-1.5">
                                {allGridDays.map((cell, idx) => {
                                    const isDateActive = selectedDate === cell.dateStr;
                                    const isToday = cell.isToday;
                                    const dayEvents = cell.events;

                                    return (
                                        <div
                                            key={idx}
                                            onClick={() => {
                                                if (cell.isCurrentMonth) {
                                                    if (selectedDate === cell.dateStr) {
                                                        setSelectedDate('');
                                                    } else {
                                                        setSelectedDate(cell.dateStr);
                                                    }
                                                }
                                            }}
                                            className={`min-h-[92px] rounded-md border p-1.5 flex flex-col justify-between transition-all cursor-pointer select-none relative ${isDateActive
                                                ? 'bg-blue-50/60 border-2 border-blue-600 ring-2 ring-blue-500/20 text-slate-900 shadow-2xs'
                                                : cell.isCurrentMonth
                                                    ? 'bg-white border-gray-200 hover:border-gray-300 text-slate-900'
                                                    : 'bg-gray-50/50 border-gray-100 text-gray-300 hover:bg-gray-100'
                                                }`}
                                        >
                                            {/* Day Header */}
                                            <div className="w-full flex items-center justify-between">
                                                <span className={`text-xs font-semibold ${isToday ? 'bg-blue-600 text-white px-1.5 py-0.2 rounded text-[11px]' : isDateActive ? 'text-blue-700 font-bold' : ''}`}>
                                                    {cell.dayNum}
                                                </span>

                                                {dayEvents.length > 0 && (
                                                    <span className={`text-[9px] font-medium px-1 rounded border ${isDateActive ? 'bg-blue-100 text-blue-800 border-blue-200' : 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                                                        {dayEvents.length} Sesi
                                                    </span>
                                                )}
                                            </div>

                                            {/* Event Badges */}
                                            {dayEvents.length > 0 ? (
                                                <div className="w-full space-y-1 my-1 overflow-hidden">
                                                    {dayEvents.slice(0, 3).map((evt, eIdx) => {
                                                        const isCompleted = evt.status === 'completed';
                                                        const isCancelled = evt.status === 'cancelled';
                                                        const isClass = evt.type === 'class';

                                                        return (
                                                            <div
                                                                key={evt.id || eIdx}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setSelectedEventDetail(evt);
                                                                }}
                                                                className={`w-full px-1 py-0.5 rounded text-[9px] font-medium flex items-center justify-between truncate border ${isCompleted
                                                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200/80'
                                                                    : isCancelled
                                                                        ? 'bg-gray-100 text-gray-600 border-gray-200 line-through opacity-75'
                                                                        : isClass
                                                                            ? 'bg-pink-50 text-pink-900 border-pink-200/80'
                                                                            : 'bg-amber-50 text-amber-900 border-amber-200/80'
                                                                    }`}
                                                                title={`${evt.time} • ${evt.title}`}
                                                            >
                                                                <span className="truncate">{evt.time} {evt.title}</span>
                                                            </div>
                                                        );
                                                    })}
                                                    {dayEvents.length > 3 && (
                                                        <span className="text-[8px] text-gray-500 font-medium block text-center">
                                                            +{dayEvents.length - 3} sesi
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
                                    {selectedDate ? `Menampilkan sesi latihan khusus tanggal ${selectedDate}` : 'Menampilkan seluruh rincian sesi Personal Trainer & Kelas Gym'}
                                </p>
                            </div>

                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-xs font-medium text-gray-500 border-b border-gray-200 uppercase tracking-wider">
                                    <tr>
                                        <th className="px-4 py-3">Tipe / Kategori</th>
                                        <th className="px-4 py-3">Member Client / Nama Kelas</th>
                                        <th className="px-4 py-3">Tanggal & Jam Sesi</th>
                                        <th className="px-4 py-3">Catatan / Detail</th>
                                        <th className="px-4 py-3">Status</th>
                                        <th className="px-4 py-3 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredSessionList.length === 0 ? (
                                        <tr>
                                            <td colSpan="6" className="px-4 py-8 text-center text-gray-400 text-xs">
                                                Tidak ada sesi Personal Trainer atau kelas gym untuk kriteria filter ini.
                                            </td>
                                        </tr>
                                    ) : (
                                        paginatedSessionList.map((item, sIdx) => (
                                            <tr key={item.id || sIdx} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-4 py-3 text-slate-900">
                                                    <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${item.type === 'pt' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-pink-50 text-pink-700 border-pink-200'
                                                        }`}>
                                                        {item.type === 'pt' ? 'Sesi PT' : 'Kelas Gym'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-gray-700">
                                                    <p className="font-semibold text-slate-900 text-xs">{item.title}</p>
                                                    {item.details?.member_code && (
                                                        <p className="text-[10px] text-gray-400">{item.details.member_code}</p>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-gray-600">
                                                    <p className="text-xs font-medium text-slate-900">
                                                        {formatInTimezone(item.dateKey, systemTimezone, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </p>
                                                    <p className="text-[11px] font-mono text-gray-500">
                                                        {item.time} {tzAbbr}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-3 text-xs text-gray-600 max-w-xs truncate">
                                                    {item.details?.notes || item.details?.room || '—'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${item.status === 'scheduled' ? 'bg-amber-50 text-amber-800 border-amber-200' :
                                                        item.status === 'completed' ? 'bg-emerald-50 text-emerald-800 border-emerald-200' :
                                                            'bg-rose-50 text-rose-800 border-rose-200'
                                                        }`}>
                                                        {item.status === 'scheduled' ? 'Terjadwal' : item.status === 'completed' ? 'Selesai' : 'Dibatalkan'}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    {(() => {
                                                        const itemDateObj = new Date(item.dateKey);
                                                        const todayObj = new Date();
                                                        todayObj.setHours(0, 0, 0, 0);
                                                        const isPast = itemDateObj < todayObj;

                                                        if (item.status === 'cancelled') {
                                                            return <span className="text-[11px] text-gray-400 font-medium italic">Dibatalkan</span>;
                                                        }

                                                        if (isPast || item.status === 'completed') {
                                                            return <span className="text-[11px] text-gray-400 font-medium italic">Sudah Lewat</span>;
                                                        }

                                                        if (item.type === 'pt') {
                                                            return (
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        if (confirm('Apakah Anda yakin ingin membatalkan sesi Personal Trainer ini?')) {
                                                                            router.post(`/personal-trainer/${item.id}/cancel`);
                                                                        }
                                                                    }}
                                                                    className="px-2.5 py-1 text-xs font-medium text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded transition-colors cursor-pointer"
                                                                >
                                                                    Batalkan Sesi
                                                                </button>
                                                            );
                                                        }

                                                        return <span className="text-[11px] text-gray-400 font-medium">—</span>;
                                                    })()}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination Bar */}
                        {filteredSessionList.length > 0 && (
                            <div className="px-4 py-3 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white">
                                <p className="text-xs text-gray-500">
                                    Menampilkan <span className="font-semibold text-gray-900">{Math.min((currentPage - 1) * perPage + 1, filteredSessionList.length)}</span> - <span className="font-semibold text-gray-900">{Math.min(currentPage * perPage, filteredSessionList.length)}</span> dari <span className="font-semibold text-gray-900">{filteredSessionList.length}</span> sesi
                                </p>
                                {totalPages > 1 && (
                                    <div className="flex items-center gap-1">
                                        <button
                                            type="button"
                                            disabled={currentPage === 1}
                                            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                                            className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                        >
                                            ‹ SBLM
                                        </button>
                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                                            <button
                                                key={page}
                                                type="button"
                                                onClick={() => setCurrentPage(page)}
                                                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${currentPage === page
                                                    ? 'bg-blue-600 text-white shadow-2xs'
                                                    : 'text-gray-700 bg-white border border-gray-200 hover:bg-gray-50'
                                                    }`}
                                            >
                                                {page}
                                            </button>
                                        ))}
                                        <button
                                            type="button"
                                            disabled={currentPage === totalPages}
                                            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                                            className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                                        >
                                            SLNJ ›
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Modal Detail Event (Click on event card) */}
                    {selectedEventDetail && (
                        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
                            <div className="bg-white w-full max-w-md rounded-xl shadow-lg relative p-6">
                                <button onClick={() => setSelectedEventDetail(null)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600">
                                    <X className="w-5 h-5" />
                                </button>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${selectedEventDetail.type === 'pt' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-pink-50 text-pink-700 border border-pink-200'
                                            }`}>
                                            {selectedEventDetail.type === 'pt' ? 'Sesi Personal Trainer' : 'Jadwal Kelas Gym'}
                                        </span>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900">{selectedEventDetail.title}</h3>
                                        <p className="text-xs text-gray-500 mt-0.5">{selectedEventDetail.time}</p>
                                    </div>

                                    {selectedEventDetail.type === 'pt' ? (
                                        <div className="space-y-2 text-xs text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                            <p className="flex items-center gap-2">
                                                <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
                                                <span><strong>Client:</strong> {selectedEventDetail.details?.client_name || selectedEventDetail.title}</span>
                                            </p>
                                            <p className="flex items-center gap-2">
                                                <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                                                <span><strong>Telepon:</strong> {selectedEventDetail.details?.phone || '—'}</span>
                                            </p>
                                            <p className="flex items-center gap-2">
                                                <Mail className="w-4 h-4 text-gray-400 shrink-0" />
                                                <span><strong>Kode Member:</strong> {selectedEventDetail.details?.member_code || '—'}</span>
                                            </p>
                                            <div className="pt-2 border-t border-gray-200/80">
                                                <p className="font-semibold text-gray-900 mb-1">Catatan Program PT:</p>
                                                <p className="text-gray-600 bg-white p-2 rounded-lg border border-gray-200 text-xs">
                                                    {selectedEventDetail.details?.notes || 'Sesi latihan personal trainer.'}
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 text-xs text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                            <p className="flex items-center gap-2">
                                                <Dumbbell className="w-4 h-4 text-pink-600 shrink-0" />
                                                <span><strong>Kategori:</strong> {selectedEventDetail.details?.category || 'Umum'}</span>
                                            </p>
                                            <p className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-gray-400 shrink-0" />
                                                <span><strong>Ruangan:</strong> {selectedEventDetail.details?.room || 'Utama'}</span>
                                            </p>
                                            <p className="flex items-center gap-2">
                                                <Users className="w-4 h-4 text-gray-400 shrink-0" />
                                                <span><strong>Kapasitas:</strong> {selectedEventDetail.details?.capacity || '—'}</span>
                                            </p>
                                            {selectedEventDetail.details?.participants && selectedEventDetail.details.participants.length > 0 && (
                                                <div className="pt-2 border-t border-gray-200/80">
                                                    <p className="font-semibold text-gray-900 mb-1">Daftar Member Terdaftar:</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {selectedEventDetail.details.participants.map((pName, idx) => (
                                                            <span key={idx} className="bg-white px-2.5 py-1 rounded-md border border-gray-200 text-xs text-gray-800">
                                                                {pName}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="pt-3 flex justify-end">
                                        <button onClick={() => setSelectedEventDetail(null)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-medium rounded-lg">
                                            Tutup Detail
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Quick Add Modal when clicking '+' on any date cell */}
                    {quickAddDate && (
                        <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
                            <div className="bg-white w-full max-w-md rounded-xl shadow-lg relative max-h-[90vh] overflow-y-auto">
                                <div className="flex items-center justify-between p-4 border-b border-gray-200 sticky top-0 bg-white z-10">
                                    <div>
                                        <h3 className="text-base font-semibold text-gray-900">Tambah Client Sesi PT</h3>
                                        <p className="text-xs text-gray-400">Jadwal Tanggal: <strong>{formatInTimezone(quickAddDate, systemTimezone, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</strong></p>
                                    </div>
                                    <button onClick={() => setQuickAddDate(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                                </div>

                                <form onSubmit={handleQuickAddSubmit} className="p-5 space-y-4">
                                    {/* Member 1 Search */}
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Cari Member Client (Pertama) *</label>
                                        {selectedMember1 ? (
                                            <div className="flex items-center justify-between p-2.5 bg-blue-50 border border-blue-200 rounded-lg">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                                                        {selectedMember1.full_name?.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-semibold text-blue-900">{selectedMember1.full_name}</p>
                                                        <p className="text-[10px] text-blue-600">{selectedMember1.member_code} • {selectedMember1.phone || 'No phone'}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => { setSelectedMember1(null); addPtForm.setData('member_id', ''); }}
                                                    className="text-blue-400 hover:text-blue-700 p-1"
                                                    title="Ganti Member"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="relative">
                                                <div className="relative">
                                                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                                                    <input
                                                        type="text"
                                                        value={member1SearchQuery}
                                                        onChange={(e) => setMember1SearchQuery(e.target.value)}
                                                        placeholder="Ketik nama atau kode member..."
                                                        className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                        autoFocus
                                                    />
                                                </div>
                                                <div className="mt-1 max-h-36 overflow-y-auto border border-gray-200 rounded-lg bg-white shadow-sm divide-y divide-gray-100">
                                                    {filteredMembers1.length === 0 ? (
                                                        <p className="p-3 text-xs text-gray-400 text-center">Member tidak ditemukan.</p>
                                                    ) : (
                                                        filteredMembers1.map((m) => (
                                                            <div
                                                                key={m.id}
                                                                onClick={() => handleSelectMember1(m)}
                                                                className="p-2 hover:bg-blue-50 cursor-pointer flex items-center justify-between transition-colors"
                                                            >
                                                                <div>
                                                                    <p className="text-xs font-semibold text-gray-900">{m.full_name}</p>
                                                                    <p className="text-[10px] text-gray-400">{m.member_code} • {m.phone || '—'}</p>
                                                                </div>
                                                                <span className="text-[10px] text-blue-600 font-medium">Pilih</span>
                                                            </div>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Member 2 Search (Optional / Berdua) */}
                                    {showSecondMember ? (
                                        <div className="pt-2 border-t border-dashed border-gray-200">
                                            <div className="flex items-center justify-between mb-1">
                                                <label className="block text-xs font-medium text-purple-900">Member Client 2 (Berdua / Semi-Private)</label>
                                                <button
                                                    type="button"
                                                    onClick={() => { setShowSecondMember(false); setSelectedMember2(null); addPtForm.setData('secondary_member_id', ''); }}
                                                    className="text-xs text-red-600 hover:underline"
                                                >
                                                    Hapus Member 2
                                                </button>
                                            </div>
                                            {selectedMember2 ? (
                                                <div className="flex items-center justify-between p-2.5 bg-purple-50 border border-purple-200 rounded-lg">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-7 h-7 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold">
                                                            {selectedMember2.full_name?.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="text-xs font-semibold text-purple-900">{selectedMember2.full_name}</p>
                                                            <p className="text-[10px] text-purple-600">{selectedMember2.member_code} • {selectedMember2.phone || 'No phone'}</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => { setSelectedMember2(null); addPtForm.setData('secondary_member_id', ''); }}
                                                        className="text-purple-400 hover:text-purple-700 p-1"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="relative">
                                                    <div className="relative">
                                                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                                                        <input
                                                            type="text"
                                                            value={member2SearchQuery}
                                                            onChange={(e) => setMember2SearchQuery(e.target.value)}
                                                            placeholder="Cari member kedua (berdua)..."
                                                            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-purple-500"
                                                        />
                                                    </div>
                                                    <div className="mt-1 max-h-36 overflow-y-auto border border-gray-200 rounded-lg bg-white shadow-sm divide-y divide-gray-100">
                                                        {filteredMembers2.length === 0 ? (
                                                            <p className="p-3 text-xs text-gray-400 text-center">Member tidak ditemukan.</p>
                                                        ) : (
                                                            filteredMembers2.map((m) => (
                                                                <div
                                                                    key={m.id}
                                                                    onClick={() => handleSelectMember2(m)}
                                                                    className="p-2 hover:bg-purple-50 cursor-pointer flex items-center justify-between transition-colors"
                                                                >
                                                                    <div>
                                                                        <p className="text-xs font-semibold text-gray-900">{m.full_name}</p>
                                                                        <p className="text-[10px] text-gray-400">{m.member_code} • {m.phone || '—'}</p>
                                                                    </div>
                                                                    <span className="text-[10px] text-purple-600 font-medium">Pilih</span>
                                                                </div>
                                                            ))
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => setShowSecondMember(true)}
                                            className="inline-flex items-center justify-center gap-1 px-3 py-1.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-700 text-xs font-semibold rounded-lg transition-colors"
                                            title="Tambah Client Berdua"
                                        >
                                            <Users className="w-3.5 h-3.5" /> +
                                        </button>
                                    )}

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Jam Mulai *</label>
                                            <input
                                                type="time"
                                                value={addPtForm.data.start_time}
                                                onChange={(e) => addPtForm.setData('start_time', e.target.value)}
                                                className={inputClass}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">Jam Selesai *</label>
                                            <input
                                                type="time"
                                                value={addPtForm.data.end_time}
                                                onChange={(e) => addPtForm.setData('end_time', e.target.value)}
                                                className={inputClass}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Catatan Latihan / Program Sesi</label>
                                        <input
                                            type="text"
                                            value={addPtForm.data.notes}
                                            onChange={(e) => addPtForm.setData('notes', e.target.value)}
                                            placeholder="Contoh: 1to1 Workout Personal Trainer"
                                            className={inputClass}
                                        />
                                    </div>

                                    <div className="pt-4 border-t border-gray-200 flex justify-end gap-2">
                                        <button type="button" onClick={() => setQuickAddDate(null)} className="px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg">
                                            Batal
                                        </button>
                                        <button type="submit" disabled={addPtForm.processing || !addPtForm.data.member_id} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg disabled:opacity-50 transition-colors">
                                            Simpan Sesi Client PT
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </AdminLayout>
        );
    }

    const stats = [
        { label: 'Member Aktif', value: metrics.activeMembers, sub: `/ ${metrics.totalMembers} total`, icon: Users, color: 'text-blue-600 bg-blue-50', show: true },
        { label: 'Pendapatan Hari Ini', value: formatIDR(metrics.todayRevenue), icon: DollarSign, color: 'text-green-600 bg-green-50', show: canSeeRevenue },
        { label: 'Kehadiran Hari Ini', value: metrics.todayAttendance, sub: 'check-in', icon: QrCode, color: 'text-purple-600 bg-purple-50', show: true },
        { label: 'Kelas Hari Ini', value: metrics.activeClassesCount, sub: 'sesi', icon: Calendar, color: 'text-amber-600 bg-amber-50', show: true },
    ].filter((s) => s.show);

    return (
        <AdminLayout title="Dashboard">
            <Head title="Dashboard" />

            <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans antialiased text-gray-900">
                {/* Stats - Laporan style top metrics */}
                <div className={`grid grid-cols-1 sm:grid-cols-2 ${canSeeRevenue ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-4 sm:gap-6`}>
                    {stats.map((s) => {
                        const Icon = s.icon;
                        return (
                            <div key={s.label} className="bg-white rounded-3xl p-6 border border-gray-100/80 shadow-xs">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-medium text-gray-500">{s.label}</p>
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${s.color}`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                </div>
                                <p className="text-2xl font-semibold text-gray-900 mt-2">
                                    {s.value}
                                    {s.sub && <span className="text-xs font-normal text-gray-400 ml-1">{s.sub}</span>}
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* Charts */}
                <div className={`grid grid-cols-1 ${canSeeRevenue ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-6`}>
                    {canSeeRevenue && (
                        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-100/80 shadow-xs">
                            <h3 className="text-sm font-semibold text-gray-900 mb-1">Pendapatan 7 Hari</h3>
                            <p className="text-xs text-gray-400 mb-4">Penjualan POS & Membership</p>
                            <div className="h-56">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={revenueChartData}>
                                        <defs>
                                            <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                                            formatter={(val) => formatIDR(val)}
                                        />
                                        <Area type="monotone" dataKey="Total" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorRev)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-100/80 shadow-xs">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900">Kunjungan Member</h3>
                                <p className="text-xs text-gray-400">Tren check-in 7 hari terakhir</p>
                            </div>
                            <div className="px-3 py-1 bg-blue-50 border border-blue-100 rounded-full text-xs font-semibold text-blue-700 flex items-center gap-1.5 shadow-2xs">
                                <QrCode className="w-3.5 h-3.5 text-blue-600" />
                                <span>Total: {attendanceChartData.reduce((acc, curr) => acc + (curr.Attendances || 0), 0)} Check-in</span>
                            </div>
                        </div>

                        <div className="h-56">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={attendanceChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="blueBarGrad" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                                            <stop offset="100%" stopColor="#60a5fa" stopOpacity={0.7} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                    <XAxis
                                        dataKey="day"
                                        stroke="#94a3b8"
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={false}
                                    />
                                    <YAxis
                                        stroke="#94a3b8"
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={false}
                                        allowDecimals={false}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '12px', fontWeight: 600 }}
                                        formatter={(val) => [`${val} Check-in`, 'Total Presensi']}
                                        cursor={{ fill: '#f8fafc' }}
                                    />
                                    <Bar
                                        dataKey="Attendances"
                                        fill="url(#blueBarGrad)"
                                        radius={[8, 8, 0, 0]}
                                        maxBarSize={38}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>

                {/* Bottom panels */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent check-ins */}
                    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-100/80 shadow-xs">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-gray-900">Check-in Terbaru</h3>
                            <Link href="/attendance/kiosk" className="text-xs text-blue-600 hover:underline">Lihat Semua</Link>
                        </div>
                        <div className="h-60 overflow-y-auto scrollbar-hide space-y-2 pr-1">
                            {recentCheckIns.length === 0 ? (
                                <p className="text-xs text-gray-400 py-6 text-center">Belum ada check-in hari ini.</p>
                            ) : (
                                recentCheckIns.slice(0, 10).map((att) => (
                                    <div key={att.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-semibold text-gray-600">
                                                {att.member?.full_name?.substring(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-gray-900">{att.member?.full_name}</p>
                                                <p className="text-[10px] text-gray-400">{att.member?.member_code}</p>
                                            </div>
                                        </div>
                                        <span className="text-[11px] text-gray-500">
                                            {formatInTimezone(att.check_in_time, systemTimezone, { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Expiring memberships */}
                    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-100/80 shadow-xs">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-gray-900">
                                Segera Expired
                            </h3>
                            <Link href="/members" className="text-xs text-blue-600 hover:underline">Lihat Semua</Link>
                        </div>
                        <div className="h-60 overflow-y-auto scrollbar-hide space-y-2 pr-1">
                            {expiringMemberships.length === 0 ? (
                                <p className="text-xs text-gray-400 py-6 text-center">Tidak ada membership yang akan expired.</p>
                            ) : (
                                expiringMemberships.slice(0, 5).map((sub) => (
                                    <div key={sub.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                        <div>
                                            <p className="text-xs font-medium text-gray-900">{sub.member?.full_name}</p>
                                            <p className="text-[10px] text-gray-400">{sub.package?.name}</p>
                                        </div>
                                        <span className="text-[10px] font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                                            {sub.end_date}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Low stock */}
                    <div className="bg-white rounded-3xl p-6 sm:p-7 border border-gray-100/80 shadow-xs">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-gray-900">
                                Stock Barang
                            </h3>
                            <Link href="/inventory" className="text-xs text-blue-600 hover:underline">Ke Inventori</Link>
                        </div>
                        <div className="h-60 overflow-y-auto scrollbar-hide space-y-2 pr-1">
                            {lowStockProducts.length === 0 ? (
                                <p className="text-xs text-gray-400 py-6 text-center">Semua stok aman.</p>
                            ) : (
                                lowStockProducts.slice(0, 5).map((prod) => (
                                    <div key={prod.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                        <div>
                                            <p className="text-xs font-medium text-gray-900">{prod.name}</p>
                                            <p className="text-[10px] text-gray-400">SKU: {prod.sku}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs font-semibold text-red-600">{prod.stock}</span>
                                            <span className="text-[10px] text-gray-400 ml-0.5">{prod.unit}</span>
                                            <p className="text-[9px] text-gray-400">Min: {prod.min_stock}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

import React, { useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import MemberLayout from '@/Layouts/MemberLayout';
import { formatStartSchedule as formatStartScheduleInTz } from '@/Utils/timezone';
import {
    Clock,
    MapPin,
    Dumbbell,
    CheckCircle2,
    AlertTriangle,
    X,
    ArrowLeft,
    ChevronRight,
    Users,
    Sparkles,
} from 'lucide-react';

const formatStartSchedule = (isoString, timezone) => formatStartScheduleInTz(isoString, timezone);

export default function MemberClasses({ schedules = [], member }) {
    const pageProps = usePage().props;
    const systemTimezone = pageProps.gym_settings?.system_timezone || pageProps.gymSettings?.system_timezone || 'Asia/Jakarta';
    const [selectedSchedule, setSelectedSchedule] = useState(null);
    const [isClosingDetail, setIsClosingDetail] = useState(false);
    const bookForm = useForm({});

    const handleOpenDetail = (sch) => {
        setIsClosingDetail(false);
        setSelectedSchedule(sch);
    };

    const handleCloseDetail = () => {
        setIsClosingDetail(true);
        setTimeout(() => {
            setSelectedSchedule(null);
            setIsClosingDetail(false);
        }, 360);
    };

    const handleDirectBook = (sch) => {
        if (!sch || bookForm.processing) return;
        bookForm.post(`/member/classes/${sch.id}/book`, {
            onSuccess: () => handleCloseDetail(),
        });
    };

    return (
        <MemberLayout title="Kelas Gym">
            <Head title="Jadwal & Booking Kelas" />

            <div className="space-y-5">
                
                {/* Header Title */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900 tracking-tight">
                            Kelas Gym
                        </h1>
                        <p className="text-xs text-gray-400 font-medium mt-0.5">
                            Pilih sesi favorit dan join kelas bersama member lainnya
                        </p>
                    </div>
                </div>

                {/* Class List (Grid / Card List matching Image 2 wireframe) */}
                <div className="space-y-4">
                    {schedules.length === 0 ? (
                        <div className="py-20 bg-white rounded-3xl border border-gray-100 text-center flex flex-col items-center justify-center px-4 shadow-xs">
                            <div className="w-14 h-14 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mb-3">
                                <Dumbbell className="w-7 h-7" />
                            </div>
                            <h3 className="text-base font-bold text-gray-900">Belum Ada Jadwal Kelas</h3>
                            <p className="text-xs text-gray-400 max-w-xs mt-1 leading-relaxed">
                                Jadwal kelas baru akan segera diperbarui oleh admin.
                            </p>
                        </div>
                    ) : (
                        schedules.map((sch) => {
                            const attendees = sch.attendees || [];
                            const visibleAttendees = attendees.slice(0, 4);
                            const remainingAttendees = Math.max(0, attendees.length - 4);

                            return (
                                <div
                                    key={sch.id}
                                    className={`bg-white rounded-3xl border transition-all duration-300 overflow-hidden flex flex-col group ${
                                        sch.is_registered
                                            ? 'opacity-70 hover:opacity-85 border-gray-200'
                                            : 'border-gray-100 shadow-xs hover:shadow-md'
                                    }`}
                                >
                                    {/* Top Image Section (Matching Image 2 wireframe) */}
                                    <div
                                        onClick={() => handleOpenDetail(sch)}
                                        className="relative h-44 sm:h-52 w-full overflow-hidden cursor-pointer bg-gray-900"
                                    >
                                        {sch.gym_class?.image ? (
                                            <img
                                                src={sch.gym_class.image}
                                                alt={sch.gym_class?.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-gradient-to-br from-slate-900 via-gray-900 to-black flex items-center justify-center text-white/20">
                                                <Dumbbell className="w-12 h-12" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />

                                        {/* Floating Category Pill */}
                                        <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5">
                                            <span className="bg-blue-600/90 backdrop-blur-xs text-white border border-blue-400/40 text-[11px] font-bold px-3 py-1 rounded-full shadow-xs">
                                                {sch.gym_class?.category || 'Fitness'}
                                            </span>
                                        </div>

                                        {/* Overlay Title & Start Time */}
                                        <div className="absolute bottom-3.5 left-4 right-4 text-white">
                                            <h3 className="text-lg sm:text-xl font-black tracking-tight leading-tight drop-shadow-xs">
                                                {sch.gym_class?.name}
                                            </h3>
                                            <p className="text-xs font-medium text-white/95 mt-0.5 drop-shadow-xs">
                                                {formatStartSchedule(sch.start_time, systemTimezone)}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Middle Info Details */}
                                    <div className="p-4 sm:p-5 space-y-3">
                                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                                            <div className="flex items-center truncate">
                                                <span className="truncate">
                                                    <strong>Coach:</strong> {sch.trainer?.full_name || 'Coach'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 truncate justify-end sm:justify-start">
                                                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                <span className="truncate">
                                                    <strong>Ruang:</strong> {sch.room || 'Studio 1'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Divider */}
                                        <div className="border-t border-gray-100 pt-3 flex items-center justify-between gap-3">
                                            
                                            {/* Bottom-Left: Overlapping Attendee Avatars (Matching Image 2 wireframe) */}
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className="flex -space-x-2.5 overflow-hidden shrink-0">
                                                    {visibleAttendees.length > 0 ? (
                                                        visibleAttendees.map((att, idx) => (
                                                            <div
                                                                key={att.id || idx}
                                                                className="w-7 h-7 rounded-full border-2 border-white bg-indigo-100 text-indigo-700 font-bold text-[10px] flex items-center justify-center overflow-hidden shadow-2xs"
                                                                title={att.name}
                                                            >
                                                                {att.photo ? (
                                                                    <img src={att.photo} alt="" className="w-full h-full object-cover" />
                                                                ) : (
                                                                    att.name.substring(0, 2).toUpperCase()
                                                                )}
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="w-7 h-7 rounded-full border-2 border-white bg-gray-100 text-gray-400 flex items-center justify-center">
                                                            <Users className="w-3.5 h-3.5" />
                                                        </div>
                                                    )}

                                                    {remainingAttendees > 0 && (
                                                        <div className="w-7 h-7 rounded-full border-2 border-white bg-gray-900 text-white font-bold text-[10px] flex items-center justify-center shadow-2xs">
                                                            +{remainingAttendees}
                                                        </div>
                                                    )}
                                                </div>

                                                <span className="text-[11px] font-bold text-gray-700 truncate">
                                                    {sch.available_slots} spots left
                                                </span>
                                            </div>

                                            {/* Bottom-Right: Detail Button (Matching Image 2 wireframe) */}
                                            <button
                                                type="button"
                                                onClick={() => handleOpenDetail(sch)}
                                                className="px-4 py-2 bg-gray-900 hover:bg-black active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1 transition-all cursor-pointer shrink-0"
                                            >
                                                <span>Detail</span>
                                                <ChevronRight className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* ========================================================= */}
                {/* CLASS DETAIL VIEW MODAL (Matching Image 1 Design Reference) */}
                {/* ========================================================= */}
                {selectedSchedule && (
                    <div
                        className={`fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 select-none ${
                            isClosingDetail ? 'animate-backdrop-fade-out' : 'animate-backdrop-fade-in'
                        }`}
                    >
                        {/* Backdrop */}
                        <div className="fixed inset-0" onClick={handleCloseDetail} />

                        {/* Modal Container with Smooth Slide-Up and Slide-Down */}
                        <div
                            className={`relative bg-white w-full max-w-md h-[92vh] sm:h-auto sm:max-h-[92vh] rounded-t-[32px] sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden ${
                                isClosingDetail ? 'animate-sheet-down' : 'animate-sheet-up'
                            }`}
                        >
                            
                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto pb-6">
                                
                                {/* Hero Top Photo (Matching Image 1) */}
                                <div className="relative h-64 sm:h-72 w-full bg-gray-900 overflow-hidden">
                                    {selectedSchedule.gym_class?.image ? (
                                        <img
                                            src={selectedSchedule.gym_class.image}
                                            alt={selectedSchedule.gym_class?.name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-slate-900 via-gray-900 to-black flex items-center justify-center text-white/20">
                                            <Dumbbell className="w-16 h-16" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

                                    {/* Floating Dark Circular Back Button (Matching Image 1) */}
                                    <button
                                        type="button"
                                        onClick={handleCloseDetail}
                                        className="absolute top-4 left-4 w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white flex items-center justify-center transition-all active:scale-95 cursor-pointer shadow-md"
                                        title="Kembali"
                                    >
                                        <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
                                    </button>
                                </div>

                                {/* Body Information */}
                                <div className="p-5 sm:p-6 space-y-5">
                                    
                                    {/* Title & Category Pill (Matching Image 1) */}
                                    <div>
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">
                                                {selectedSchedule.gym_class?.name}
                                            </h2>
                                            <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold px-3.5 py-1 rounded-full shadow-2xs">
                                                {selectedSchedule.gym_class?.category || 'Barre Studio'}
                                            </span>
                                        </div>
                                        <p className="text-xs font-semibold text-gray-500 mt-1">
                                            {formatStartSchedule(selectedSchedule.start_time, systemTimezone)}
                                        </p>
                                    </div>

                                    {/* Coach Section (Matching Image 1) */}
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-bold text-gray-900">
                                            Coach
                                        </h4>
                                        <div className="bg-gray-50 border border-gray-100/90 rounded-2xl p-3 flex items-center gap-3.5 shadow-2xs">
                                            <div className="w-12 h-12 rounded-full overflow-hidden bg-indigo-100 text-indigo-700 font-bold text-sm flex items-center justify-center shrink-0 border border-white shadow-xs">
                                                {selectedSchedule.trainer_photo ? (
                                                    <img
                                                        src={selectedSchedule.trainer_photo}
                                                        alt={selectedSchedule.trainer?.full_name}
                                                        className="w-full h-full object-cover"
                                                    />
                                                ) : (
                                                    (selectedSchedule.trainer?.full_name || 'CH').substring(0, 2).toUpperCase()
                                                )}
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-sm text-gray-900">
                                                    {selectedSchedule.trainer?.full_name || 'Jane Miller'}
                                                </h5>
                                                <p className="text-xs text-gray-400 font-medium">
                                                    {selectedSchedule.trainer?.specialization || 'Certified Coach & Instructor'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Spots Left & Overlapping Member Avatars (Matching Image 1) */}
                                    <div className="flex items-center justify-between py-1">
                                        <span className="text-sm font-extrabold text-gray-900">
                                            {selectedSchedule.available_slots} spots left
                                        </span>

                                        <div className="flex -space-x-2.5 overflow-hidden">
                                            {(selectedSchedule.attendees || []).slice(0, 5).map((att, idx) => (
                                                <div
                                                    key={att.id || idx}
                                                    className="w-8 h-8 rounded-full border-2 border-white bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center overflow-hidden shadow-2xs"
                                                    title={att.name}
                                                >
                                                    {att.photo ? (
                                                        <img src={att.photo} alt="" className="w-full h-full object-cover" />
                                                    ) : (
                                                        att.name.substring(0, 2).toUpperCase()
                                                    )}
                                                </div>
                                            ))}

                                            {(selectedSchedule.attendees || []).length > 5 && (
                                                <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-900 text-white font-bold text-xs flex items-center justify-center shadow-2xs">
                                                    +{(selectedSchedule.attendees || []).length - 5}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Description Box (Matching Image 1) */}
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-bold text-gray-900">
                                            Workout Description
                                        </h4>
                                        <div className="bg-gray-50/90 border border-gray-100 rounded-2xl p-4 text-xs sm:text-sm text-gray-600 leading-relaxed space-y-2 shadow-2xs">
                                            <p>
                                                {selectedSchedule.gym_class?.description ||
                                                    'This workout is suitable for all fitness levels, for both men and women, and focuses on improving flexibility, strength and functional movement.'}
                                            </p>
                                            <div className="pt-2 border-t border-gray-200/60 flex items-center gap-4 text-xs font-semibold text-gray-500">
                                                <span>⏱ {selectedSchedule.gym_class?.duration_minutes || 60} Menit</span>
                                                <span>📍 Ruangan: {selectedSchedule.room || 'Studio'}</span>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>

                            {/* Bottom Fixed Action Button (Blue Book Button & Dashed Registered State) */}
                            <div className="p-4 sm:p-5 border-t border-gray-100 bg-white shrink-0 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                                {selectedSchedule.is_registered ? (
                                    <div className="w-full py-4 bg-blue-50/90 text-blue-700 font-extrabold text-sm rounded-full border-2 border-dashed border-blue-500 flex items-center justify-center gap-2 shadow-2xs">
                                        <CheckCircle2 className="w-5 h-5 text-blue-600" />
                                        <span>Terdaftar di Kelas Ini</span>
                                    </div>
                                ) : selectedSchedule.available_slots <= 0 ? (
                                    <button
                                        type="button"
                                        disabled
                                        className="w-full py-4 bg-gray-100 text-gray-400 font-bold text-sm rounded-full cursor-not-allowed text-center"
                                    >
                                        Kelas Penuh (0 Slot)
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => handleDirectBook(selectedSchedule)}
                                        disabled={bookForm.processing}
                                        className="w-full py-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-black text-base rounded-full shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition-all cursor-pointer text-center disabled:opacity-50"
                                    >
                                        {bookForm.processing ? 'Memproses...' : 'Book'}
                                    </button>
                                )}
                            </div>

                        </div>
                    </div>
                )}


            </div>
        </MemberLayout>
    );
}

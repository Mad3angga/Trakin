import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import MemberLayout from '@/Layouts/MemberLayout';
import {
    ArrowLeft,
    Users,
    X,
    MessageCircle,
    ArrowUpRight
} from 'lucide-react';

export default function MemberTrainers({ trainers = [], member, selectedId }) {
    const { gym_name } = usePage().props;
    const [selectedTrainer, setSelectedTrainer] = useState(null);
    const [isOpenAnimation, setIsOpenAnimation] = useState(false);
    const [isClosingModal, setIsClosingModal] = useState(false);
    const [dragY, setDragY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);

    const touchStartYRef = useRef(0);
    const isSwipingFromHeaderRef = useRef(false);
    const isSwipingFromTopRef = useRef(false);
    const scrollContentRef = useRef(null);

    // Auto-open modal if selectedId is passed from query params (e.g. from Dashboard)
    useEffect(() => {
        if (selectedId && trainers.length > 0) {
            const found = trainers.find((t) => String(t.id) === String(selectedId));
            if (found) {
                handleOpenDetail(found);
            }
        }
    }, [selectedId, trainers]);

    const handleOpenDetail = (tr) => {
        setIsClosingModal(false);
        setDragY(0);
        setSelectedTrainer(tr);
        setIsOpenAnimation(false);
        requestAnimationFrame(() => {
            setTimeout(() => {
                setIsOpenAnimation(true);
            }, 25);
        });
    };

    const handleCloseDetail = () => {
        setIsOpenAnimation(false);
        setIsClosingModal(true);
        setTimeout(() => {
            setSelectedTrainer(null);
            setIsClosingModal(false);
            setDragY(0);
        }, 280);
    };

    // Header touch handlers (guaranteed downward drag)
    const handleHeaderTouchStart = (e) => {
        touchStartYRef.current = e.touches[0].clientY;
        isSwipingFromHeaderRef.current = true;
        setIsDragging(true);
    };

    const handleHeaderTouchMove = (e) => {
        if (!isSwipingFromHeaderRef.current) return;
        const currentY = e.touches[0].clientY;
        const diff = currentY - touchStartYRef.current;
        if (diff > 0) {
            setDragY(diff);
            if (e.cancelable) e.preventDefault();
        } else {
            setDragY(0);
        }
    };

    // Body touch handlers (only drags when scrolled to top)
    const handleBodyTouchStart = (e) => {
        touchStartYRef.current = e.touches[0].clientY;
        if (scrollContentRef.current && scrollContentRef.current.scrollTop <= 2) {
            isSwipingFromTopRef.current = true;
        } else {
            isSwipingFromTopRef.current = false;
        }
    };

    const handleBodyTouchMove = (e) => {
        if (!isSwipingFromTopRef.current) return;
        const currentY = e.touches[0].clientY;
        const diff = currentY - touchStartYRef.current;

        if (diff > 0 && scrollContentRef.current && scrollContentRef.current.scrollTop <= 2) {
            setIsDragging(true);
            setDragY(diff);
            if (e.cancelable) e.preventDefault();
        } else {
            setIsDragging(false);
            setDragY(0);
        }
    };

    const handleTouchEnd = () => {
        isSwipingFromHeaderRef.current = false;
        isSwipingFromTopRef.current = false;
        setIsDragging(false);

        if (dragY > 80) {
            handleCloseDetail();
        } else {
            setDragY(0);
        }
    };

    // Format WA URL
    const getWaUrl = (phone, name) => {
        if (!phone) return null;
        const clean = phone.replace(/[^0-9]/g, '');
        const formatted = clean.startsWith('0') ? '62' + clean.substring(1) : clean;
        const text = encodeURIComponent(`Halo Coach ${name}, saya member gym ingin konsultasi mengenai program latihan dan sesi Personal Trainer.`);
        return `https://wa.me/${formatted}?text=${text}`;
    };

    // Helper to get personal skills strictly from database (no dummy fallback)
    const getTrainerSkills = (tr) => {
        if (!tr || !tr.skills) return [];
        if (typeof tr.skills === 'string' && tr.skills.trim()) {
            return tr.skills.split(',').map((s) => s.trim()).filter(Boolean);
        }
        if (Array.isArray(tr.skills)) {
            return tr.skills.filter(Boolean);
        }
        return [];
    };

    // Helper to get achievements strictly from database (no dummy fallback)
    const getTrainerAchievements = (tr) => {
        if (!tr || !tr.achievements) return [];
        if (typeof tr.achievements === 'string' && tr.achievements.trim()) {
            return tr.achievements.split('\n').map((a) => a.trim()).filter(Boolean);
        }
        if (Array.isArray(tr.achievements)) {
            return tr.achievements.filter(Boolean);
        }
        return [];
    };

    const trainerSkills = selectedTrainer ? getTrainerSkills(selectedTrainer) : [];
    const trainerAchievements = selectedTrainer ? getTrainerAchievements(selectedTrainer) : [];

    return (
        <MemberLayout title="Coach & Personal Trainer">
            <Head title="Our Coaches - Personal Trainer" />

            <div className="space-y-4 pb-8">
                {/* Top Header Bar - Unboxed / Clean */}
                <div className="flex items-center gap-2 pt-1 pb-1">
                    <Link
                        href="/member/dashboard"
                        className="p-2 -ml-2 text-gray-800 hover:text-gray-900 active:scale-95 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                        title="Kembali ke Dashboard"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight">
                        Personal Trainer
                    </h1>
                </div>

                {/* Coach Photo Cards Grid */}
                {trainers.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center space-y-3 shadow-xs">
                        <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
                            <Users className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-sm text-gray-800">Belum ada personal trainer</h3>
                        <p className="text-xs text-gray-400 max-w-xs mx-auto">
                            Saat ini belum ada data personal trainer yang terdaftar.
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4">
                        {trainers.map((tr) => {
                            const photoUrl = tr.portrait_photo || tr.photo;

                            return (
                                <div
                                    key={tr.id}
                                    onClick={() => handleOpenDetail(tr)}
                                    className="group relative aspect-[3/4] rounded-2xl overflow-hidden shadow-xs border border-gray-200/80 bg-slate-900 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg active:scale-[0.98] select-none"
                                >
                                    {/* Coach Photo */}
                                    {photoUrl ? (
                                        <img
                                            src={photoUrl}
                                            alt={tr.full_name}
                                            className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-105"
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-950 flex flex-col items-center justify-center p-4 text-center">
                                            <div className="w-14 h-14 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 mb-2">
                                                <span className="text-xl font-black text-white tracking-wider uppercase">
                                                    {tr.full_name?.substring(0, 2) || 'PT'}
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-white/50 font-medium uppercase tracking-wider">Coach</span>
                                        </div>
                                    )}

                                    {/* Smooth Gradient Dark Overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 via-40% to-transparent opacity-90 group-hover:opacity-95 transition-opacity" />

                                    {/* Bottom Content Overlay */}
                                    <div className="absolute inset-x-0 bottom-0 p-3 sm:p-3.5 space-y-0.5 text-white z-10 text-left">
                                        <h3 className="font-bold text-xs sm:text-sm text-white leading-tight drop-shadow-xs truncate">
                                            {tr.full_name}
                                        </h3>
                                        {tr.specialization ? (
                                            <p className="text-[10px] text-white/80 line-clamp-1 font-medium">
                                                {tr.specialization}
                                            </p>
                                        ) : tr.bio ? (
                                            <p className="text-[10px] text-white/70 line-clamp-1">
                                                {tr.bio}
                                            </p>
                                        ) : null}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Coach Detail Modal / Bottom Sheet - Seamless Swipe Up & Down */}
            {selectedTrainer && (
                <div
                    className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-sm transition-opacity duration-300 ${
                        isOpenAnimation && !isClosingModal ? 'opacity-100' : 'opacity-0'
                    }`}
                    onClick={handleCloseDetail}
                >
                    <div
                        style={{
                            transform: !isOpenAnimation || isClosingModal
                                ? 'translateY(100%)'
                                : dragY > 0
                                ? `translateY(${dragY}px)`
                                : 'translateY(0)',
                            transition: isDragging
                                ? 'none'
                                : 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.28s ease',
                            opacity: !isOpenAnimation || isClosingModal ? 0 : Math.max(0.4, 1 - dragY / 450),
                        }}
                        className="bg-white rounded-t-[32px] sm:rounded-3xl max-w-md w-full max-h-[92vh] shadow-2xl overflow-hidden relative flex flex-col will-change-transform select-none"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* TOP SECTION: Hero Image Showcase - Seamlessly clipped by parent rounded corners */}
                        <div
                            onTouchStart={handleHeaderTouchStart}
                            onTouchMove={handleHeaderTouchMove}
                            onTouchEnd={handleTouchEnd}
                            className="relative h-80 sm:h-96 w-full bg-slate-900 overflow-hidden shrink-0 cursor-grab active:cursor-grabbing"
                        >
                            {/* Swipe Down Bar Indicator on Mobile */}
                            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-white/80 rounded-full z-40 pointer-events-none shadow-sm" />

                            {/* Background Portrait Photo */}
                            {selectedTrainer.portrait_photo || selectedTrainer.photo ? (
                                <img
                                    src={selectedTrainer.portrait_photo || selectedTrainer.photo}
                                    alt={selectedTrainer.full_name}
                                    className="w-full h-full object-cover object-top pointer-events-none"
                                />
                            ) : (
                                <div className="w-full h-full bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-950 flex items-center justify-center">
                                    <span className="text-6xl font-black text-white/20 tracking-widest uppercase font-mono">
                                        {selectedTrainer.full_name?.substring(0, 2) || 'PT'}
                                    </span>
                                </div>
                            )}

                            {/* Subtle Gradient Overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none" />

                            {/* Top Right Close Button X */}
                            <button
                                type="button"
                                onClick={handleCloseDetail}
                                className="absolute top-4 right-4 p-2.5 rounded-full bg-black/40 hover:bg-black/70 text-white backdrop-blur-md transition-all cursor-pointer shadow-lg border border-white/20 active:scale-95 z-30"
                                title="Kembali"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* BOTTOM SECTION: Scrollable White Content Card */}
                        <div
                            ref={scrollContentRef}
                            onTouchStart={handleBodyTouchStart}
                            onTouchMove={handleBodyTouchMove}
                            onTouchEnd={handleTouchEnd}
                            className="overflow-y-auto flex-1 overscroll-contain scrollbar-none bg-white p-6 sm:p-7 space-y-5"
                        >
                            {/* Coach Name & Specialization */}
                            <div className="border-b border-gray-100 pb-4">
                                <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight leading-tight">
                                    {selectedTrainer.full_name}
                                </h2>
                                <p className="text-xs font-semibold text-gray-500 tracking-wide uppercase mt-1">
                                    {selectedTrainer.specialization || '-'}
                                </p>
                            </div>

                            {/* Bio Section */}
                            <div className="space-y-1.5">
                                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                    Bio
                                </h3>
                                <p className="text-xs sm:text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                                    {selectedTrainer.bio || '-'}
                                </p>
                            </div>

                            {/* Personal Skills Section */}
                            <div className="space-y-2">
                                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                    Personal Skills
                                </h3>
                                {trainerSkills.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {trainerSkills.map((skill, idx) => (
                                            <span
                                                key={idx}
                                                className="px-3 py-1.5 bg-gray-100 text-gray-800 rounded-xl text-xs font-semibold hover:bg-gray-200 transition-colors"
                                            >
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs sm:text-sm text-gray-400 font-medium">-</p>
                                )}
                            </div>

                            {/* Achievements Section */}
                            <div className="space-y-2.5">
                                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                    Achievements & Certifications
                                </h3>
                                {trainerAchievements.length > 0 ? (
                                    <div className="space-y-2">
                                        {trainerAchievements.map((ach, idx) => (
                                            <div
                                                key={idx}
                                                className="p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-800 font-medium leading-snug"
                                            >
                                                {ach}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-xs sm:text-sm text-gray-400 font-medium">-</p>
                                )}
                            </div>

                            {/* Action Bar (Direct Contact & WhatsApp Button) */}
                            <div className="pt-4 border-t border-gray-100 flex items-center justify-between gap-4 sticky bottom-0 bg-white/95 backdrop-blur-md pb-2">
                                <div>
                                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider block">
                                        Direct Contact
                                    </span>
                                    <span className="text-base sm:text-lg font-extrabold text-gray-900 block leading-tight">
                                        Personal Coach
                                    </span>
                                </div>

                                {selectedTrainer.phone ? (
                                    <a
                                        href={getWaUrl(selectedTrainer.phone, selectedTrainer.full_name)}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="px-5 py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-2xl flex items-center gap-2 shadow-md shadow-blue-500/20 hover:shadow-lg transition-all cursor-pointer shrink-0"
                                    >
                                        <MessageCircle className="w-4 h-4" />
                                        <span>Chat WhatsApp</span>
                                        <ArrowUpRight className="w-4 h-4" />
                                    </a>
                                ) : (
                                    <div className="px-4 py-3 bg-gray-100 text-gray-500 font-medium text-xs rounded-xl text-center">
                                        Kontak Belum Tersedia
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </MemberLayout>
    );
}

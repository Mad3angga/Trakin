import React, { useState, useRef } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    Plus,
    Users,
    Clock,
    MapPin,
    X,
    Dumbbell,
    Calendar,
    Edit2,
    Trash2,
    Upload,
    ImageIcon,
    AlertTriangle,
    Layers,
    CheckCircle2,
} from 'lucide-react';
import ImageCropModal from '@/Components/ImageCropModal';

export default function ClassesIndex({
    isTrainer,
    currentTrainer,
    classes = [],
    schedules = [],
    trainers = [],
    members = [],
}) {
    const [activeTab, setActiveTab] = useState('schedules'); // 'schedules' | 'catalog'

    // Class modals state
    const [isClassModalOpen, setIsClassModalOpen] = useState(false);
    const [editingClass, setEditingClass] = useState(null);
    const [deletingClass, setDeletingClass] = useState(null);

    // Schedule modal state
    const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);

    // Image upload & crop state
    const [previewImage, setPreviewImage] = useState(null);
    const [cropImageSrc, setCropImageSrc] = useState(null);
    const fileInputRef = useRef(null);

    // Class Form
    const classForm = useForm({
        name: '',
        category: 'Cardio',
        description: '',
        capacity: 15,
        duration_minutes: 45,
        image: null,
    });

    // Schedule Form
    const scheduleForm = useForm({
        class_id: classes[0]?.id || '',
        trainer_id: isTrainer ? (currentTrainer?.id || trainers[0]?.id || '') : (trainers[0]?.id || ''),
        start_time: '',
        room: 'Studio A',
        max_capacity: 15,
    });

    const openCreateClassModal = () => {
        setEditingClass(null);
        setPreviewImage(null);
        classForm.reset();
        classForm.setData({
            name: '',
            category: 'Yoga & Flexibility',
            description: '',
            capacity: 15,
            duration_minutes: 60,
            image: null,
        });
        setIsClassModalOpen(true);
    };

    const openEditClassModal = (gymClass) => {
        setEditingClass(gymClass);
        setPreviewImage(gymClass.image || null);
        classForm.setData({
            name: gymClass.name || '',
            category: gymClass.category || 'General',
            description: gymClass.description || '',
            capacity: gymClass.capacity || 15,
            duration_minutes: gymClass.duration_minutes || 60,
            image: null,
        });
        setIsClassModalOpen(true);
    };

    // Handle Image file selection
    const handleImageSelect = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setCropImageSrc(reader.result);
            };
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    };

    // Handle Cropped Image Complete
    const handleCropComplete = (croppedFile, previewUrl) => {
        classForm.setData('image', croppedFile);
        setPreviewImage(previewUrl || URL.createObjectURL(croppedFile));
        setCropImageSrc(null);
    };

    // Submit Class (Create or Update)
    const submitClass = (e) => {
        e.preventDefault();
        if (editingClass) {
            classForm.post(`/classes/${editingClass.id}`, {
                forceFormData: true,
                onSuccess: () => {
                    setIsClassModalOpen(false);
                    setEditingClass(null);
                    setPreviewImage(null);
                    classForm.reset();
                },
            });
        } else {
            classForm.post('/classes', {
                forceFormData: true,
                onSuccess: () => {
                    setIsClassModalOpen(false);
                    setPreviewImage(null);
                    classForm.reset();
                },
            });
        }
    };

    // Submit Delete Class
    const submitDeleteClass = () => {
        if (!deletingClass) return;
        router.delete(`/classes/${deletingClass.id}`, {
            onSuccess: () => {
                setDeletingClass(null);
            },
        });
    };

    // Submit Schedule
    const submitSchedule = (e) => {
        e.preventDefault();
        scheduleForm.post('/classes/schedules', {
            onSuccess: () => {
                setIsScheduleModalOpen(false);
                scheduleForm.reset();
            },
        });
    };

    const inputClass =
        'w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors';

    return (
        <AdminLayout title="Kelas">
            <Head title="Manajemen & Jadwal Kelas Gym" />

            <div className="space-y-6">

                {/* Header & Tabs */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-semibold text-gray-900 tracking-tight">
                            {isTrainer ? `Jadwal Kelas Saya (${currentTrainer?.full_name || 'Coach'})` : 'Manajemen Kelas Gym'}
                        </h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            {isTrainer
                                ? 'Daftar jadwal sesi kelas gym yang Anda bimbing'
                                : 'Kelola jenis katalog kelas dan jadwalkan sesi kelas gym'}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {!isTrainer && (
                            <button
                                type="button"
                                onClick={openCreateClassModal}
                                className="px-3.5 py-2.5 text-xs sm:text-sm font-bold text-gray-700 bg-white hover:bg-gray-50 active:scale-95 rounded-xl border border-gray-200 flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                            >
                                <Plus className="w-4 h-4 text-medium-600" />
                                <span>Jenis Kelas</span>
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={() => setIsScheduleModalOpen(true)}
                            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center gap-1.5 shadow-xs transition-all cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Buat Jadwal Sesi</span>
                        </button>
                    </div>
                </div>

                {/* Clean Underline Tab Navigation (Matching Reference Style) */}
                {!isTrainer && (
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-6">
                            <button
                                type="button"
                                onClick={() => setActiveTab('schedules')}
                                className={`pb-3 px-1 text-sm sm:text-base font-medium border-b-2 transition-all cursor-pointer ${activeTab === 'schedules'
                                        ? 'border-gray-900 text-gray-900'
                                        : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Jadwal Sesi ({schedules.length})
                            </button>

                            <button
                                type="button"
                                onClick={() => setActiveTab('catalog')}
                                className={`pb-3 px-1 text-sm sm:text-base font-semibold border-b-2 transition-all cursor-pointer ${activeTab === 'catalog'
                                        ? 'border-gray-900 text-gray-900'
                                        : 'border-transparent text-gray-400 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                Katalog Jenis Kelas ({classes.length})
                            </button>
                        </nav>
                    </div>
                )}

                {/* ========================================================= */}
                {/* TAB 1: JADWAL KELAS (SCHEDULES)                           */}
                {/* ========================================================= */}
                {activeTab === 'schedules' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {schedules.length === 0 ? (
                            <div className="col-span-full py-16 bg-white rounded-3xl border border-gray-100 text-center flex flex-col items-center justify-center px-4 shadow-xs">
                                <div className="w-14 h-14 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mb-3">
                                    <Calendar className="w-7 h-7" />
                                </div>
                                <h3 className="text-base font-bold text-gray-900">Belum Ada Jadwal Sesi</h3>
                                <p className="text-xs text-gray-400 max-w-xs mt-1 leading-relaxed">
                                    {isTrainer
                                        ? 'Belum ada jadwal sesi kelas yang ditugaskan kepada Anda.'
                                        : 'Klik tombol "Buat Jadwal Sesi" di atas untuk menambahkan jadwal sesi kelas baru.'}
                                </p>
                            </div>
                        ) : (
                            schedules.map((sch) => {
                                return (
                                    <div
                                        key={sch.id}
                                        className="bg-white rounded-3xl border border-gray-100 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col group"
                                    >
                                        <div className="relative h-40 w-full overflow-hidden bg-gray-900">
                                            {sch.gym_class?.image ? (
                                                <img
                                                    src={sch.gym_class.image}
                                                    alt=""
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-slate-900 via-gray-900 to-black flex items-center justify-center text-white/20">
                                                    <Dumbbell className="w-10 h-10" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                                            <div className="absolute top-3 right-3">
                                                <span className="bg-blue-600/90 backdrop-blur-xs text-white border border-blue-400/40 text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow-xs">
                                                    {sch.gym_class?.category || 'Umum'}
                                                </span>
                                            </div>

                                            <div className="absolute bottom-3 left-4 right-4 text-white">
                                                <h4 className="font-black text-base tracking-tight leading-tight drop-shadow-xs">
                                                    {sch.gym_class?.name}
                                                </h4>
                                                <p className="text-xs text-white/95 font-medium mt-0.5 drop-shadow-xs">
                                                    {new Date(sch.start_time).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="p-4 space-y-2.5 flex-1 flex flex-col justify-between">
                                            <div className="space-y-1.5 text-xs text-gray-600">
                                                <div className="flex items-center gap-2">
                                                    <Dumbbell className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                    <span>Trainer: <strong>{sch.trainer?.full_name || '—'}</strong></span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                    <span>Ruangan: <strong>{sch.room}</strong></span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                    <span>Durasi: {sch.gym_class?.duration_minutes || 60} Menit</span>
                                                </div>
                                            </div>

                                            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                                                <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                                                    <Users className="w-3.5 h-3.5 text-blue-600" />
                                                    <span>{sch.registrations?.length || 0} / {sch.max_capacity} Peserta</span>
                                                </span>

                                                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                                                    {sch.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {/* ========================================================= */}
                {/* TAB 2: KATALOG JENIS KELAS (CLASS TYPES CATALOG)          */}
                {/* ========================================================= */}
                {activeTab === 'catalog' && !isTrainer && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {classes.length === 0 ? (
                            <div className="col-span-full py-16 bg-white rounded-3xl border border-gray-100 text-center flex flex-col items-center justify-center px-4 shadow-xs">
                                <div className="w-14 h-14 rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center mb-3">
                                    <Layers className="w-7 h-7" />
                                </div>
                                <h3 className="text-base font-semibold text-gray-900">Belum Ada Jenis Kelas</h3>
                                <p className="text-xs text-gray-400 max-w-xs mt-1 leading-relaxed">
                                    Tambahkan jenis kelas pertama seperti Yoga, HIIT, Pilates, atau Stretching.
                                </p>
                            </div>
                        ) : (
                            classes.map((cls) => {
                                return (
                                    <div
                                        key={cls.id}
                                        className="bg-white rounded-3xl border border-gray-100 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col group"
                                    >
                                        {/* Cover Image */}
                                        <div className="relative h-44 w-full overflow-hidden bg-gray-900">
                                            {cls.image ? (
                                                <img
                                                    src={cls.image}
                                                    alt={cls.name}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            ) : (
                                                <div className="w-full h-full bg-gradient-to-br from-slate-900 via-gray-900 to-black flex items-center justify-center text-white/20">
                                                    <Dumbbell className="w-12 h-12" />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                                            {/* Floating Category */}
                                            <div className="absolute top-3.5 right-3.5">
                                                <span className="bg-blue-600/90 backdrop-blur-xs text-white border border-blue-400/40 text-[11px] font-bold px-3 py-1 rounded-full shadow-xs">
                                                    {cls.category || 'Umum'}
                                                </span>
                                            </div>

                                            {/* Name on image */}
                                            <div className="absolute bottom-3.5 left-4 right-4 text-white">
                                                <h3 className="text-lg font-black tracking-tight leading-tight drop-shadow-xs">
                                                    {cls.name}
                                                </h3>
                                            </div>
                                        </div>

                                        {/* Content details */}
                                        <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-4">
                                            <div className="space-y-2">
                                                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                                                    {cls.description || 'Tidak ada deskripsi detail kelas.'}
                                                </p>

                                                <div className="flex items-center gap-3 pt-1 text-xs text-gray-500 font-semibold">
                                                    <span className="flex items-center gap-1 bg-gray-100 px-2.5 py-1 rounded-lg">
                                                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                                                        {cls.duration_minutes} Menit
                                                    </span>
                                                    <span className="flex items-center gap-1 bg-gray-100 px-2.5 py-1 rounded-lg">
                                                        <Users className="w-3.5 h-3.5 text-gray-400" />
                                                        Kapasitas {cls.capacity}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Card Action Buttons (Edit & Delete) */}
                                            <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                                                <span className="text-[11px] text-gray-400 font-semibold">
                                                    {cls.schedules_count || 0} Jadwal Sesi
                                                </span>

                                                <div className="flex items-center gap-1.5">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditClassModal(cls)}
                                                        className="px-3 py-1.5 bg-gray-100 hover:bg-blue-50 hover:text-blue-600 active:scale-95 text-gray-700 text-xs font-bold rounded-xl flex items-center gap-1 transition-all cursor-pointer"
                                                        title="Edit Jenis Kelas"
                                                    >
                                                        <Edit2 className="w-3.5 h-3.5" />
                                                        <span>Edit</span>
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => setDeletingClass(cls)}
                                                        className="p-1.5 bg-gray-100 hover:bg-red-50 hover:text-red-600 active:scale-95 text-gray-400 rounded-xl transition-all cursor-pointer"
                                                        title="Hapus Jenis Kelas"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}

                {/* ========================================================= */}
                {/* MODAL: TAMBAH / EDIT JENIS KELAS                          */}
                {/* ========================================================= */}
                {isClassModalOpen && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-150">

                            {/* Modal Header */}
                            <div className="flex items-center justify-between p-5 border-b border-gray-100">
                                <div>
                                    <h3 className="text-base font-bold text-gray-900">
                                        {editingClass ? 'Edit Jenis Kelas' : 'Tambah Jenis Kelas Baru'}
                                    </h3>
                                    <p className="text-xs text-gray-400">
                                        Isi detail informasi jenis kelas dan upload cover kelas
                                    </p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsClassModalOpen(false)}
                                    className="p-1 text-gray-400 hover:text-gray-700 rounded-lg cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Modal Form */}
                            <form onSubmit={submitClass} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">

                                {/* Cover Photo Upload Section */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                                        Cover Foto Kelas
                                    </label>

                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleImageSelect}
                                        accept="image/jpeg,image/png,image/jpg,image/webp"
                                        className="hidden"
                                    />

                                    {previewImage ? (
                                        <div className="space-y-2">
                                            <div className="relative h-44 w-full rounded-2xl overflow-hidden border border-gray-200 bg-gray-900 shadow-2xs">
                                                <img
                                                    src={previewImage}
                                                    alt="Preview Cover"
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputRef.current?.click()}
                                                    className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 active:scale-95 text-gray-800 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shadow-2xs"
                                                >
                                                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                                                    <span>Ganti Foto Cover</span>
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => fileInputRef.current?.click()}
                                            className="h-36 w-full border-2 border-dashed border-gray-200 hover:border-blue-400 rounded-2xl flex flex-col items-center justify-center cursor-pointer bg-gray-50 hover:bg-blue-50/30 transition-all p-4 text-center"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mb-2">
                                                <ImageIcon className="w-5 h-5" />
                                            </div>
                                            <p className="text-xs font-bold text-gray-800">
                                                Klik untuk Upload Cover Kelas
                                            </p>
                                            <p className="text-[11px] text-gray-400 mt-0.5">
                                                PNG, JPG, WEBP hingga 5MB
                                            </p>
                                        </div>
                                    )}
                                </div>

                                {/* Form Fields */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                        Nama Kelas *
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Stretching, Yoga Vinyasa, HIIT Fat Burn"
                                        value={classForm.data.name}
                                        onChange={(e) => classForm.setData('name', e.target.value)}
                                        className={inputClass}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                        Kategori Kelas *
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Contoh: Barre Studio, Yoga, Pilates, Strength, Cardio, HIIT"
                                        value={classForm.data.category}
                                        onChange={(e) => classForm.setData('category', e.target.value)}
                                        className={inputClass}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                        Deskripsi Kelas
                                    </label>
                                    <textarea
                                        placeholder="Jelaskan mengenai sesi latihan ini, manfaat gerakan, dan level pesertanya..."
                                        value={classForm.data.description}
                                        onChange={(e) => classForm.setData('description', e.target.value)}
                                        rows="3"
                                        className={inputClass}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                            Kapasitas Standar
                                        </label>
                                        <input
                                            type="number"
                                            value={classForm.data.capacity}
                                            onChange={(e) => classForm.setData('capacity', parseInt(e.target.value) || 1)}
                                            min="1"
                                            className={inputClass}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                            Durasi (Menit)
                                        </label>
                                        <input
                                            type="number"
                                            value={classForm.data.duration_minutes}
                                            onChange={(e) => classForm.setData('duration_minutes', parseInt(e.target.value) || 15)}
                                            min="15"
                                            step="5"
                                            className={inputClass}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Modal Footer */}
                                <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsClassModalOpen(false)}
                                        className="px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={classForm.processing}
                                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50 transition-all cursor-pointer"
                                    >
                                        {classForm.processing ? 'Menyimpan...' : (editingClass ? 'Simpan Perubahan' : 'Tambah Jenis Kelas')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* ========================================================= */}
                {/* MODAL: KONFIRMASI HAPUS JENIS KELAS                       */}
                {/* ========================================================= */}
                {deletingClass && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl p-6 border border-gray-100 animate-in zoom-in-95 duration-150 relative">
                            <button
                                type="button"
                                onClick={() => setDeletingClass(null)}
                                className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mb-4">
                                <AlertTriangle className="w-6 h-6" />
                            </div>

                            <h3 className="text-base font-bold text-gray-900">
                                Hapus Jenis Kelas?
                            </h3>

                            <p className="text-xs text-gray-500 my-2 leading-relaxed">
                                Apakah Anda yakin ingin menghapus kelas <strong>"{deletingClass.name}"</strong>?
                                Tindakan ini tidak dapat dibatalkan.
                            </p>

                            <div className="pt-4 mt-4 border-t border-gray-100 grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={() => setDeletingClass(null)}
                                    className="w-full py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={submitDeleteClass}
                                    className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                                >
                                    Ya, Hapus
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ========================================================= */}
                {/* MODAL: BUAT JADWAL SESI KELAS                             */}
                {/* ========================================================= */}
                {isScheduleModalOpen && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 duration-150">
                            <div className="flex items-center justify-between p-5 border-b border-gray-100">
                                <div>
                                    <h3 className="text-base font-bold text-gray-900">Buat Jadwal Sesi Kelas</h3>
                                    <p className="text-xs text-gray-400">Jadwalkan sesi kelas gym untuk member</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setIsScheduleModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={submitSchedule} className="p-5 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                        Jenis Kelas *
                                    </label>
                                    <select
                                        value={scheduleForm.data.class_id}
                                        onChange={(e) => scheduleForm.setData('class_id', e.target.value)}
                                        className={inputClass}
                                        required
                                    >
                                        <option value="">Pilih Jenis Kelas</option>
                                        {classes.map((c) => (
                                            <option key={c.id} value={c.id}>
                                                {c.name} ({c.category}) - {c.duration_minutes} Menit
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {!isTrainer ? (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                            Trainer Pengajar *
                                        </label>
                                        <select
                                            value={scheduleForm.data.trainer_id}
                                            onChange={(e) => scheduleForm.setData('trainer_id', e.target.value)}
                                            className={inputClass}
                                            required
                                        >
                                            <option value="">Pilih Trainer</option>
                                            {trainers.map((t) => (
                                                <option key={t.id} value={t.id}>
                                                    {t.full_name} {t.specialization ? `(${t.specialization})` : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                            Trainer Pengajar
                                        </label>
                                        <input
                                            type="text"
                                            value={currentTrainer?.full_name || 'Coach Trainer'}
                                            disabled
                                            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-100 text-gray-600 font-semibold cursor-not-allowed"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                        Waktu Mulai *
                                    </label>
                                    <input
                                        type="datetime-local"
                                        value={scheduleForm.data.start_time}
                                        onChange={(e) => scheduleForm.setData('start_time', e.target.value)}
                                        className={inputClass}
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                            Ruangan
                                        </label>
                                        <input
                                            type="text"
                                            placeholder="Studio A"
                                            value={scheduleForm.data.room}
                                            onChange={(e) => scheduleForm.setData('room', e.target.value)}
                                            className={inputClass}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                                            Kuota Maksimal
                                        </label>
                                        <input
                                            type="number"
                                            value={scheduleForm.data.max_capacity}
                                            onChange={(e) => scheduleForm.setData('max_capacity', parseInt(e.target.value) || 1)}
                                            min="1"
                                            className={inputClass}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsScheduleModalOpen(false)}
                                        className="px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={scheduleForm.processing}
                                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs disabled:opacity-50 transition-all cursor-pointer"
                                    >
                                        {scheduleForm.processing ? 'Menjadwalkan...' : 'Buat Jadwal Sesi'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Image Cropping Modal */}
                <ImageCropModal
                    isOpen={Boolean(cropImageSrc)}
                    imageSrc={cropImageSrc}
                    onClose={() => setCropImageSrc(null)}
                    onCropComplete={handleCropComplete}
                    aspectRatio={16 / 9}
                    title="Crop Cover Kelas"
                    outputFileName="class_cover.jpg"
                />

            </div>
        </AdminLayout>
    );
}

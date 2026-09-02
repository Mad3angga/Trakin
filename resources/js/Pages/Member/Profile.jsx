import React, { useState, useRef, useEffect } from 'react';
import { Head, useForm, usePage, Link, router } from '@inertiajs/react';
import MemberLayout from '@/Layouts/MemberLayout';
import AdminLayout from '@/Layouts/AdminLayout';
import ImageCropModal from '@/Components/ImageCropModal';
import {
    ArrowLeft, Camera, User, Lock, Phone, Mail, ShieldCheck, ChevronRight,
    Bell, HelpCircle, MessageSquare, LogOut, Check, X, ZoomIn, Move,
    AlertTriangle, Sparkles, FileText, CheckCircle2, Trash2
} from 'lucide-react';

export default function MemberProfile({ user, member, trainer }) {
    const { auth } = usePage().props;
    const currentUser = auth?.user || user;
    const roles = currentUser?.roles || [];
    const isMember = roles.includes('Member');
    const isTrainer = roles.includes('Trainer');
    // Semua role non-Member menggunakan AdminLayout dan endpoint /profile (atau /trainer/profile untuk backward compat Trainer)
    const isAdminRole = !isMember;
    const Layout = isAdminRole ? AdminLayout : MemberLayout;

    const getPostUrl = () => {
        if (isMember) return '/member/profile';
        if (isTrainer) return '/trainer/profile';
        return '/profile';
    };
    const getDeletePhotoUrl = () => {
        if (isMember) return '/member/profile/photo';
        if (isTrainer) return '/trainer/profile/photo';
        return '/profile/photo';
    };
    const handleDeletePhoto = () => {
        if (!previewPhoto) return;
        if (!confirm('Hapus foto profil? Akan kembali ke default inisial.')) return;
        router.delete(getDeletePhotoUrl(), {
            preserveScroll: true,
            onSuccess: () => setPreviewPhoto(null),
        });
    };

    // Sub-Page Navigation State: 'main' | 'edit-profile' | 'change-password' | 'membership' | 'notifications' | 'faq' | 'report-bug'
    const [subPage, setSubPage] = useState('main');
    const [activeTab, setActiveTab] = useState('details');
    useEffect(() => {
        if (isTrainer && activeTab === 'account') setActiveTab('details');
    }, [isTrainer, activeTab]);

    const [previewPhoto, setPreviewPhoto] = useState(user?.photo || member?.photo || trainer?.photo || null);
    const [rawImageSrc, setRawImageSrc] = useState(null);
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const [fileError, setFileError] = useState(null);

    // Notification Toggles State
    const [notifClass, setNotifClass] = useState(true);
    const [notifPt, setNotifPt] = useState(true);
    const [notifChat, setNotifChat] = useState(true);

    // FAQ Accordion State
    const [openFaq, setOpenFaq] = useState(null);

    // Bug Report Form State
    const [bugSubject, setBugSubject] = useState('');
    const [bugMessage, setBugMessage] = useState('');
    const [bugSubmitted, setBugSubmitted] = useState(false);

    const fileInputRef = useRef(null);

    const form = useForm({
        display_name: user?.name || member?.full_name || trainer?.full_name || '',
        phone: trainer?.phone || member?.phone || user?.phone || '',
        photo: null,
        password: '',
        password_confirmation: '',
    });

    const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB Limit for source image

    const handlePhotoChange = (e) => {
        const file = e.target.files?.[0];
        setFileError(null);

        if (!file) return;

        if (file.size > MAX_FILE_SIZE) {
            setFileError(`Ukuran foto terlalu besar (${(file.size / (1024 * 1024)).toFixed(1)} MB). Maksimal 10 MB.`);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setRawImageSrc(reader.result);
            setIsCropModalOpen(true);
        };
        reader.readAsDataURL(file);
    };

    const handleCropComplete = (croppedFile, previewUrl) => {
        form.setData('photo', croppedFile);
        setPreviewPhoto(previewUrl);

        // Auto submit photo update - gunakan endpoint sesuai role
        const postUrl = getPostUrl();
        form.post(postUrl, {
            preserveScroll: true,
            forceFormData: true,
        });
    };

    const submit = (e) => {
        if (e) e.preventDefault();
        const postUrl = getPostUrl();
        form.post(postUrl, {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                form.reset('password', 'password_confirmation');
                setSubPage('main');
            },
        });
    };

    const handleBugSubmit = (e) => {
        e.preventDefault();
        if (!bugSubject || !bugMessage) return;
        setBugSubmitted(true);
        setTimeout(() => {
            setBugSubmitted(false);
            setBugSubject('');
            setBugMessage('');
            setSubPage('main');
        }, 1500);
    };

    const displayName = form.data.display_name || user?.name || member?.full_name || trainer?.full_name || 'User';
    const fullName = member?.full_name || trainer?.full_name || user?.name || 'User';
    const email = user?.email || 'user@trakin.com';

    const faqItems = [
        {
            q: 'Bagaimana cara melakukan Check-In di Gym?',
            a: 'Anda dapat membuka menu Check-In di aplikasi Member, lalu tunjukkan kode QR unik Anda ke scanner atau kasir di area resepsionis gym.'
        },
        {
            q: 'Bagaimana prosedur booking kelas gym?',
            a: 'Pilih menu "Kelas" di navigasi bawah, cari jadwal kelas yang Anda inginkan, lalu tekan tombol "Booking Kelas". Pastikan kuota peserta masih tersedia.'
        },
        {
            q: 'Bagaimana cara menjadwalkan sesi dengan Personal Trainer?',
            a: 'Anda dapat menghubungi pihak resepsionis/kasir gym atau admin untuk penjadwalan sesi PT.'
        },
        {
            q: 'Apakah saya bisa mengubah kata sandi akun?',
            a: 'Bisa, Anda dapat mengubah kata sandi kapan saja melalui menu Settings -> Ubah Kata Sandi.'
        }
    ];

    if (isAdminRole) {
        const roleLabel = isTrainer ? 'Coach' : roles[0] || 'Staff';
        const titleLabel = isTrainer ? 'Pengaturan Coach' : `Pengaturan ${roleLabel}`;
        return (
            <AdminLayout title={titleLabel}>
                <Head title={`Settings — Trakin ${roleLabel}`} />

                <div className="max-w-5xl mx-auto space-y-6 pb-12">
                    {/* Header Title Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                        <div>
                            <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Settings</h1>
                            <p className="text-xs text-gray-500 mt-1">Kelola rincian profil coach, informasi kontak, dan kata sandi akun Anda.</p>
                        </div>

                        <button
                            type="button"
                            onClick={submit}
                            disabled={form.processing}
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center justify-center transition-all disabled:opacity-50 self-start sm:self-auto hover:shadow-md active:scale-95 cursor-pointer"
                        >
                            <span>Simpan Perubahan</span>
                        </button>
                    </div>

                    {/* Horizontal Navigation Tabs (Exact Owner Style) */}
                    <div className="border-b border-gray-200/80 flex items-center gap-8 overflow-x-auto scrollbar-hide">
                        <button
                            type="button"
                            onClick={() => setActiveTab('details')}
                            className={`pb-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                                activeTab === 'details'
                                    ? 'border-gray-900 text-gray-900 font-bold'
                                    : 'border-transparent text-gray-400 hover:text-gray-700 font-medium'
                            }`}
                        >
                            <span>Details</span>
                        </button>

                        {!isTrainer && (
                            <button
                                type="button"
                                onClick={() => setActiveTab('account')}
                                className={`pb-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                                    activeTab === 'account'
                                        ? 'border-gray-900 text-gray-900 font-bold'
                                        : 'border-transparent text-gray-400 hover:text-gray-700 font-medium'
                                }`}
                            >
                                <span>Account</span>
                            </button>
                        )}
                    </div>

                    {/* Main Content Form Card */}
                    <form onSubmit={submit} className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-2xs space-y-6">
                        {/* TAB 1: DETAILS */}
                        {activeTab === 'details' && (
                            <div>
                                <div className="pb-6 border-b border-gray-100">
                                    <h2 className="text-base font-bold text-gray-900">Profile Details</h2>
                                    <p className="text-xs text-gray-500 mt-0.5">Perbarui nama publik, informasi kontak, dan foto profil Anda.</p>
                                </div>

                                {fileError && (
                                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                                        <span>{fileError}</span>
                                    </div>
                                )}

                                {/* Row 1: Public Profile Name */}
                                <div className="py-6 border-b border-gray-100 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                                    <div className="md:col-span-4 pr-2">
                                        <div className="flex items-center gap-1.5">
                                            <label className="text-xs font-bold text-gray-900">Public Profile</label>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                                            Nama profil publik utama Anda yang akan terlihat di sistem.
                                        </p>
                                    </div>

                                    <div className="md:col-span-8 space-y-3">
                                        <div className="relative rounded-2xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 bg-white transition-all overflow-hidden flex items-center px-3.5 py-2.5">
                                            <User className="w-4 h-4 text-gray-400 shrink-0 mr-2.5" />
                                            <input
                                                type="text"
                                                value={form.data.display_name}
                                                onChange={(e) => form.setData('display_name', e.target.value)}
                                                placeholder="Nama Lengkap / Coach Name"
                                                className="w-full text-xs text-gray-900 placeholder-gray-400 bg-transparent focus:outline-none font-medium"
                                                required
                                            />
                                        </div>
                                        {form.errors.display_name && <p className="text-xs text-red-600 mt-1">{form.errors.display_name}</p>}
                                    </div>
                                </div>

                                {/* Row 2: Official Contact */}
                                <div className="py-6 border-b border-gray-100 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                                    <div className="md:col-span-4 pr-2">
                                        <div className="flex items-center gap-1.5">
                                            <label className="text-xs font-bold text-gray-900">Official Contact</label>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                                            Nomor telepon WhatsApp dan alamat email login resmi Anda.
                                        </p>
                                    </div>

                                    <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="relative rounded-2xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 bg-white transition-all overflow-hidden flex items-center px-3.5 py-2.5">
                                            <Phone className="w-4 h-4 text-gray-400 shrink-0 mr-2.5" />
                                            <input
                                                type="text"
                                                value={form.data.phone}
                                                onChange={(e) => form.setData('phone', e.target.value)}
                                                placeholder="0812-3456-7890"
                                                className="w-full text-xs text-gray-900 placeholder-gray-400 bg-transparent focus:outline-none font-medium"
                                            />
                                        </div>

                                        <div className="relative rounded-2xl border border-gray-200 bg-gray-50 flex items-center px-3.5 py-2.5">
                                            <Mail className="w-4 h-4 text-gray-400 shrink-0 mr-2.5" />
                                            <input
                                                type="email"
                                                value={email}
                                                disabled
                                                className="w-full text-xs text-gray-500 bg-transparent focus:outline-none font-medium cursor-not-allowed"
                                            />
                                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 ml-1" />
                                        </div>
                                    </div>
                                </div>

                                {/* Row 3: Profile Picture */}
                                <div className="pt-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                                    <div className="md:col-span-4 pr-2">
                                        <div className="flex items-center gap-1.5">
                                            <label className="text-xs font-bold text-gray-900">Profile Picture</label>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                                            Foto profil resmi Anda yang tampil pada aplikasi.
                                        </p>
                                    </div>

                                    <div className="md:col-span-8 flex items-center gap-5">
                                        <div className="relative group shrink-0">
                                            <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-blue-500 shadow-xs relative bg-blue-50 text-blue-600 font-bold text-2xl flex items-center justify-center shrink-0">
                                                {previewPhoto && (
                                                    <img
                                                        src={previewPhoto}
                                                        alt=""
                                                        onError={(e) => {
                                                            e.currentTarget.style.display = 'none';
                                                        }}
                                                        className="w-full h-full object-cover absolute inset-0 z-10"
                                                    />
                                                )}
                                                <span className="z-0">{displayName.substring(0, 2).toUpperCase()}</span>
                                            </div>
                                            {previewPhoto && (
                                                <button
                                                    type="button"
                                                    onClick={handleDeletePhoto}
                                                    className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-md border-2 border-white transition-colors cursor-pointer"
                                                    title="Hapus foto, kembali ke default"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                        </div>

                                        <label className="border-2 border-dashed border-gray-300 hover:border-blue-500 rounded-2xl p-4 transition-all text-center cursor-pointer flex-1 flex flex-col items-center justify-center bg-gray-50/40 hover:bg-blue-50/20">
                                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                                            <Camera className="w-5 h-5 text-blue-600 mb-1" />
                                            <p className="text-xs font-bold text-gray-900">Pilih / Unggah Foto Profil</p>
                                            <p className="text-[10px] text-gray-400 mt-0.5">Format JPG, PNG, WEBP (Maksimal 2 MB)</p>
                                        </label>
                                        {form.errors.photo && <p className="text-xs text-red-600 mt-2">{form.errors.photo}</p>}
                                    </div>
                                </div>

                                {isTrainer && (
                                    <div className="pt-6 mt-6 border-t border-gray-100 space-y-4">
                                        <div className="pb-2">
                                            <h3 className="text-sm font-bold text-gray-900">Ubah Kata Sandi</h3>
                                            <p className="text-xs text-gray-400 mt-0.5">Gunakan kombinasi password yang kuat dan aman.</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                                            <div className="md:col-span-4 pr-2">
                                                <label className="text-xs font-bold text-gray-900">Kata Sandi Baru</label>
                                                <p className="text-xs text-gray-400 mt-1 leading-relaxed">Minimal 8 karakter</p>
                                            </div>
                                            <div className="md:col-span-8 space-y-4">
                                                <div>
                                                    <div className="relative rounded-2xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 bg-white transition-all overflow-hidden flex items-center px-3.5 py-2.5">
                                                        <Lock className="w-4 h-4 text-gray-400 shrink-0 mr-2.5" />
                                                        <input
                                                            type="password"
                                                            value={form.data.password}
                                                            onChange={(e) => form.setData('password', e.target.value)}
                                                            placeholder="Minimal 8 karakter"
                                                            className="w-full text-xs text-gray-900 placeholder-gray-400 bg-transparent focus:outline-none font-medium"
                                                        />
                                                    </div>
                                                    {form.errors.password && <p className="text-xs text-red-600 mt-1">{form.errors.password}</p>}
                                                </div>
                                                <div>
                                                    <div className="relative rounded-2xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 bg-white transition-all overflow-hidden flex items-center px-3.5 py-2.5">
                                                        <Lock className="w-4 h-4 text-gray-400 shrink-0 mr-2.5" />
                                                        <input
                                                            type="password"
                                                            value={form.data.password_confirmation}
                                                            onChange={(e) => form.setData('password_confirmation', e.target.value)}
                                                            placeholder="Konfirmasi kata sandi baru"
                                                            className="w-full text-xs text-gray-900 placeholder-gray-400 bg-transparent focus:outline-none font-medium"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* TAB 2: ACCOUNT */}
                        {activeTab === 'account' && (
                            <div>
                                <div className="pb-6 border-b border-gray-100">
                                    <h2 className="text-base font-bold text-gray-900">Account Security</h2>
                                    <p className="text-xs text-gray-500 mt-0.5">Kelola kata sandi untuk keamanan akses akun Trainer Anda.</p>
                                </div>

                                <div className="py-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                                    <div className="md:col-span-4 pr-2">
                                        <div className="flex items-center gap-1.5">
                                            <label className="text-xs font-bold text-gray-900">Ubah Kata Sandi</label>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                                            Gunakan kombinasi password yang kuat dan aman.
                                        </p>
                                    </div>

                                    <div className="md:col-span-8 space-y-4">
                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">Kata Sandi Baru</label>
                                            <div className="relative rounded-2xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 bg-white transition-all overflow-hidden flex items-center px-3.5 py-2.5">
                                                <Lock className="w-4 h-4 text-gray-400 shrink-0 mr-2.5" />
                                                <input
                                                    type="password"
                                                    value={form.data.password}
                                                    onChange={(e) => form.setData('password', e.target.value)}
                                                    placeholder="Minimal 4 karakter"
                                                    className="w-full text-xs text-gray-900 placeholder-gray-400 bg-transparent focus:outline-none font-medium"
                                                />
                                            </div>
                                            {form.errors.password && <p className="text-xs text-red-600 mt-1">{form.errors.password}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold text-gray-700 mb-1">Konfirmasi Kata Sandi Baru</label>
                                            <div className="relative rounded-2xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 bg-white transition-all overflow-hidden flex items-center px-3.5 py-2.5">
                                                <Lock className="w-4 h-4 text-gray-400 shrink-0 mr-2.5" />
                                                <input
                                                    type="password"
                                                    value={form.data.password_confirmation}
                                                    onChange={(e) => form.setData('password_confirmation', e.target.value)}
                                                    placeholder="Ulangi kata sandi baru"
                                                    className="w-full text-xs text-gray-900 placeholder-gray-400 bg-transparent focus:outline-none font-medium"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* Photo Crop Modal */}
                <ImageCropModal
                    isOpen={isCropModalOpen}
                    imageSrc={rawImageSrc}
                    onClose={() => {
                        setIsCropModalOpen(false);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    onCropComplete={handleCropComplete}
                    aspectRatio={1}
                    title="Choose Photo"
                />
            </AdminLayout>
        );
    }

    return (
        <Layout>
            <Head title={isTrainer ? "Profil Trainer — Settings" : "Profil Member — Settings"} />

            <div className="max-w-md mx-auto space-y-5 pb-10">
                {/* SUB-PAGE 1: MAIN SETTINGS MENU */}
                {subPage === 'main' && (
                    <div className="space-y-5 animate-in fade-in duration-300">
                        {/* Header */}
                        <div className="pt-2 text-center">
                            <h1 className="text-xl font-bold text-gray-900">Settings</h1>
                        </div>

                        {/* Hero Avatar & Identity Section */}
                        <div className="text-center pt-2 pb-4">
                            <div className="relative inline-block mx-auto group">
                                <label
                                    className="cursor-pointer block relative rounded-full"
                                    title="Pilih foto dari galeri"
                                >
                                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-purple-100 shadow-md bg-gradient-to-tr from-purple-500 to-indigo-600 text-white font-bold text-3xl flex items-center justify-center shrink-0">
                                        {previewPhoto ? (
                                            <img src={previewPhoto} alt={displayName} className="w-full h-full object-cover" />
                                        ) : (
                                            <span>{displayName.substring(0, 2).toUpperCase()}</span>
                                        )}
                                    </div>

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handlePhotoChange}
                                        className="hidden"
                                    />
                                </label>
                                {previewPhoto && (
                                    <button
                                        type="button"
                                        onClick={(e) => { e.preventDefault(); handleDeletePhoto(); }}
                                        className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-md border-2 border-white transition-colors cursor-pointer"
                                        title="Hapus foto, kembali ke default"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                )}
                            </div>

                            <h2 className="text-2xl font-extrabold text-gray-900 mt-3 tracking-tight">{displayName}</h2>
                            <p className="text-xs text-gray-400 font-medium mt-0.5">{email}</p>

                            {fileError && (
                                <div className="mt-3 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium flex items-center justify-center gap-1.5 max-w-xs mx-auto">
                                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                                    <span>{fileError}</span>
                                </div>
                            )}
                        </div>

                        {/* Group 1: Manage Profile & Account */}
                        <div className="bg-white border border-gray-200/80 rounded-3xl overflow-hidden shadow-2xs divide-y divide-gray-100">
                            <button
                                type="button"
                                onClick={() => setSubPage('edit-profile')}
                                className="w-full p-4 flex items-center justify-between hover:bg-gray-50/80 transition-colors text-left group cursor-pointer"
                            >
                                <div className="flex items-center gap-3.5">
                                    <div className="w-9 h-9 rounded-2xl bg-gray-100/90 text-gray-800 flex items-center justify-center shrink-0">
                                        <User className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <span className="text-sm font-bold text-gray-900 block transition-colors">Manage profile</span>
                                        <span className="text-xs text-gray-400 font-medium block">Ubah nama panggilan & nomor telepon</span>
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center transition-all shrink-0">
                                    <ChevronRight className="w-4 h-4" />
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSubPage('change-password')}
                                className="w-full p-4 flex items-center justify-between hover:bg-gray-50/80 transition-colors text-left group cursor-pointer"
                            >
                                <div className="flex items-center gap-3.5">
                                    <div className="w-9 h-9 rounded-2xl bg-gray-100/90 text-gray-800 flex items-center justify-center shrink-0">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <span className="text-sm font-bold text-gray-900 block transition-colors">Ubah Kata Sandi</span>
                                        <span className="text-xs text-gray-400 font-medium block">Perbarui password akun Anda</span>
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center transition-all shrink-0">
                                    <ChevronRight className="w-4 h-4" />
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSubPage('membership')}
                                className="w-full p-4 flex items-center justify-between hover:bg-gray-50/80 transition-colors text-left group cursor-pointer"
                            >
                                <div className="flex items-center gap-3.5">
                                    <div className="w-9 h-9 rounded-2xl bg-gray-100/90 text-gray-800 flex items-center justify-center shrink-0">
                                        <ShieldCheck className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <span className="text-sm font-bold text-gray-900 block transition-colors">Status Membership</span>
                                        <span className="text-xs text-gray-500 font-semibold block">{isTrainer ? 'Trainer Lisensi Resmi' : (member?.status ? `Status: ${member.status}` : 'Member Aktif')}</span>
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center transition-all shrink-0">
                                    <ChevronRight className="w-4 h-4" />
                                </div>
                            </button>
                        </div>

                        {/* Group 2: Manage Notifications & Help */}
                        <div className="bg-white border border-gray-200/80 rounded-3xl overflow-hidden shadow-2xs divide-y divide-gray-100">
                            <button
                                type="button"
                                onClick={() => setSubPage('notifications')}
                                className="w-full p-4 flex items-center justify-between hover:bg-gray-50/80 transition-colors text-left group cursor-pointer"
                            >
                                <div className="flex items-center gap-3.5">
                                    <div className="w-9 h-9 rounded-2xl bg-gray-100/90 text-gray-800 flex items-center justify-center shrink-0">
                                        <Bell className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <span className="text-sm font-bold text-gray-900 block transition-colors">Manage notifications</span>
                                        <span className="text-xs text-gray-400 font-medium block">Notifikasi jadwal kelas & sesi PT</span>
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center transition-all shrink-0">
                                    <ChevronRight className="w-4 h-4" />
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSubPage('faq')}
                                className="w-full p-4 flex items-center justify-between hover:bg-gray-50/80 transition-colors text-left group cursor-pointer"
                            >
                                <div className="flex items-center gap-3.5">
                                    <div className="w-9 h-9 rounded-2xl bg-gray-100/90 text-gray-800 flex items-center justify-center shrink-0">
                                        <HelpCircle className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <span className="text-sm font-bold text-gray-900 block transition-colors">FAQ & Bantuan</span>
                                        <span className="text-xs text-gray-400 font-medium block">Pertanyaan umum seputar gym</span>
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center transition-all shrink-0">
                                    <ChevronRight className="w-4 h-4" />
                                </div>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSubPage('report-bug')}
                                className="w-full p-4 flex items-center justify-between hover:bg-gray-50/80 transition-colors text-left group cursor-pointer"
                            >
                                <div className="flex items-center gap-3.5">
                                    <div className="w-9 h-9 rounded-2xl bg-gray-100/90 text-gray-800 flex items-center justify-center shrink-0">
                                        <MessageSquare className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <span className="text-sm font-bold text-gray-900 block transition-colors">Report a bug</span>
                                        <span className="text-xs text-gray-400 font-medium block">Laporkan kendala / masukan</span>
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center transition-all shrink-0">
                                    <ChevronRight className="w-4 h-4" />
                                </div>
                            </button>
                        </div>

                        {/* Group 3: Logout Action */}
                        <div className="bg-white border border-gray-200/80 rounded-3xl overflow-hidden shadow-2xs">
                            <Link
                                href="/logout"
                                method="post"
                                as="button"
                                className="w-full p-4 flex items-center justify-between hover:bg-gray-50/80 transition-colors text-left group cursor-pointer"
                            >
                                <div className="flex items-center gap-3.5">
                                    <div className="w-9 h-9 rounded-2xl bg-gray-100/90 text-gray-800 flex items-center justify-center shrink-0">
                                        <LogOut className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <span className="text-sm font-bold text-gray-900 block">Keluar dari Akun</span>
                                        <span className="text-xs text-gray-400 font-medium block">Akhiri sesi login Anda</span>
                                    </div>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-700 flex items-center justify-center shrink-0">
                                    <ChevronRight className="w-4 h-4" />
                                </div>
                            </Link>
                        </div>
                    </div>
                )}

                {/* SUB-PAGE 2: EDIT PROFILE */}
                {subPage === 'edit-profile' && (
                    <div className="space-y-5 animate-in fade-in duration-300">
                        <div className="flex items-center gap-2 pt-1 pb-1">
                            <button
                                type="button"
                                onClick={() => setSubPage('main')}
                                className="p-2 -ml-2 text-gray-800 hover:text-gray-900 active:scale-95 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                                title="Kembali"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight">Manage Profile</h1>
                        </div>

                        <div className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-2xs space-y-5">
                            {/* Avatar section */}
                            <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                                <div className="relative shrink-0">
                                    <label className="cursor-pointer flex items-center gap-4 group">
                                        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-indigo-500 shadow-md bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 font-bold text-xl group-hover:opacity-90 transition-opacity">
                                            {previewPhoto ? (
                                                <img src={previewPhoto} alt={displayName} className="w-full h-full object-cover" />
                                            ) : (
                                                <span>{displayName.substring(0, 2).toUpperCase()}</span>
                                            )}
                                        </div>
                                        <div>
                                            <span className="px-3.5 py-2 text-xs font-semibold text-gray-700 group-hover:bg-gray-100 rounded-xl border border-gray-300 inline-flex items-center gap-1.5 transition-colors">
                                                <Camera className="w-3.5 h-3.5 text-blue-600" /> Buka Galeri / Ubah Foto
                                            </span>
                                            <p className="text-[11px] text-gray-400 mt-1">Pilih foto langsung dari galeri HP</p>
                                        </div>
                                        <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                                    </label>
                                    {previewPhoto && (
                                        <button
                                            type="button"
                                            onClick={handleDeletePhoto}
                                            className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-md border-2 border-white transition-colors cursor-pointer"
                                            title="Hapus foto, kembali ke default"
                                        >
                                            <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <form onSubmit={submit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-900 mb-1">Nama Lengkap Terdaftar (Permanen)</label>
                                    <div className="relative rounded-2xl border border-gray-200 bg-gray-50/80 flex items-center px-3.5 py-2.5">
                                        <input
                                            type="text"
                                            value={fullName}
                                            disabled
                                            className="w-full text-xs text-gray-500 bg-transparent focus:outline-none cursor-not-allowed select-none font-medium"
                                        />
                                        <Lock className="w-3.5 h-3.5 text-gray-400 shrink-0 ml-2" />
                                    </div>
                                    <p className="text-[11px] text-gray-400 mt-1">Nama resmi identitas awal pendaftaran gym.</p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-900 mb-1">Nama Tampilan (Display Name) *</label>
                                    <div className="relative rounded-2xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 bg-white transition-all flex items-center px-3.5 py-2.5">
                                        <User className="w-4 h-4 text-gray-400 shrink-0 mr-2.5" />
                                        <input
                                            type="text"
                                            value={form.data.display_name}
                                            onChange={(e) => form.setData('display_name', e.target.value)}
                                            placeholder="Contoh: Budi S."
                                            className="w-full text-xs text-gray-900 placeholder-gray-400 bg-transparent focus:outline-none font-medium"
                                            required
                                        />
                                    </div>
                                    {form.errors.display_name && <p className="text-xs text-red-600 mt-1">{form.errors.display_name}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-900 mb-1">No. WhatsApp / Telepon</label>
                                    <div className="relative rounded-2xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 bg-white transition-all flex items-center px-3.5 py-2.5">
                                        <Phone className="w-4 h-4 text-gray-400 shrink-0 mr-2.5" />
                                        <input
                                            type="text"
                                            value={form.data.phone}
                                            onChange={(e) => form.setData('phone', e.target.value)}
                                            placeholder="08123456789"
                                            className="w-full text-xs text-gray-900 placeholder-gray-400 bg-transparent focus:outline-none font-medium"
                                        />
                                    </div>
                                    {form.errors.phone && <p className="text-xs text-red-600 mt-1">{form.errors.phone}</p>}
                                </div>

                                <div className="pt-3 flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setSubPage('main')}
                                        className="px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={form.processing}
                                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl disabled:opacity-50 shadow-xs"
                                    >
                                        Simpan Perubahan
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* SUB-PAGE 3: CHANGE PASSWORD */}
                {subPage === 'change-password' && (
                    <div className="space-y-5 animate-in fade-in duration-300">
                        <div className="flex items-center gap-2 pt-1 pb-1">
                            <button
                                type="button"
                                onClick={() => setSubPage('main')}
                                className="p-2 -ml-2 text-gray-800 hover:text-gray-900 active:scale-95 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                                title="Kembali"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight">Ubah Kata Sandi</h1>
                        </div>

                        <div className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-2xs space-y-5">
                            <p className="text-xs text-gray-500">Perbarui kata sandi akun Anda secara berkala demi keamanan.</p>

                            <form onSubmit={submit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-900 mb-1">Password Baru</label>
                                    <div className="relative rounded-2xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 bg-white transition-all flex items-center px-3.5 py-2.5">
                                        <Lock className="w-4 h-4 text-gray-400 shrink-0 mr-2.5" />
                                        <input
                                            type="password"
                                            value={form.data.password}
                                            onChange={(e) => form.setData('password', e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full text-xs text-gray-900 placeholder-gray-400 bg-transparent focus:outline-none font-medium"
                                            required
                                        />
                                    </div>
                                    {form.errors.password && <p className="text-xs text-red-600 mt-1">{form.errors.password}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-900 mb-1">Konfirmasi Password Baru</label>
                                    <div className="relative rounded-2xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 bg-white transition-all flex items-center px-3.5 py-2.5">
                                        <Lock className="w-4 h-4 text-gray-400 shrink-0 mr-2.5" />
                                        <input
                                            type="password"
                                            value={form.data.password_confirmation}
                                            onChange={(e) => form.setData('password_confirmation', e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full text-xs text-gray-900 placeholder-gray-400 bg-transparent focus:outline-none font-medium"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="pt-3 flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setSubPage('main')}
                                        className="px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={form.processing}
                                        className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl disabled:opacity-50 shadow-xs"
                                    >
                                        Perbarui Password
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* SUB-PAGE 4: MEMBERSHIP STATUS */}
                {subPage === 'membership' && (
                    <div className="space-y-5 animate-in fade-in duration-300">
                        <div className="flex items-center gap-2 pt-1 pb-1">
                            <button
                                type="button"
                                onClick={() => setSubPage('main')}
                                className="p-2 -ml-2 text-gray-800 hover:text-gray-900 active:scale-95 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                                title="Kembali"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight">Status Membership</h1>
                        </div>

                        {/* Credit Card Style */}
                        <div className="relative w-full aspect-[1.7/1] rounded-[1.5rem] overflow-hidden shadow-xl select-none"
                             style={{ background: 'linear-gradient(135deg, #0f3fc2 0%, #165DFC 40%, #4b7dfd 70%, #7ba0fe 100%)' }}>
                            {/* Decorative Circles */}
                            <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full bg-white/[0.07]" />
                            <div className="absolute -bottom-14 -left-14 w-52 h-52 rounded-full bg-white/[0.05]" />
                            <div className="absolute top-1/2 right-1/4 w-28 h-28 rounded-full bg-white/[0.04]" />

                            {/* Card Content */}
                            <div className="relative z-10 h-full flex flex-col justify-between p-5 sm:p-6 text-white">
                                {/* Top Row: Status & Gym Name */}
                                <div className="flex items-start justify-between">
                                    <div className="space-y-1">
                                        <p className="text-[10px] font-semibold text-white/60 uppercase tracking-widest">
                                            {isTrainer ? 'Coach License' : 'Membership Status'}
                                        </p>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                                            <span className="text-xs font-bold text-emerald-300">Aktif & Terverifikasi</span>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-medium text-white/50 uppercase tracking-wider">Gym</p>
                                        <p className="text-xs font-extrabold text-white/90 mt-0.5 max-w-[120px] truncate">
                                            {usePage().props.gym_name || 'Trakin Fitness'}
                                        </p>
                                    </div>
                                </div>

                                {/* Middle: Member Name & Package */}
                                <div className="space-y-0.5">
                                    <p className="text-lg sm:text-xl font-black tracking-tight leading-tight truncate drop-shadow-sm">
                                        {fullName}
                                    </p>
                                    {member?.active_subscription?.package?.name && (
                                        <p className="text-[11px] font-semibold text-white/70">
                                            Paket: {member.active_subscription.package.name}
                                        </p>
                                    )}
                                </div>

                                {/* Bottom Row: Member Code & Expiry */}
                                <div className="flex items-end justify-between">
                                    <div>
                                        <p className="text-[10px] font-medium text-white/50 uppercase tracking-wider mb-0.5">Member Code</p>
                                        <p className="text-sm sm:text-base font-mono font-bold tracking-[0.15em] text-white/95">
                                            {member?.member_code || trainer?.trainer_code || 'MBR-0000'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-medium text-white/50 uppercase tracking-wider mb-0.5">
                                            {isTrainer ? 'License' : 'Valid Until'}
                                        </p>
                                        <p className="text-sm sm:text-base font-bold text-white/95">
                                            {(() => {
                                                const raw = member?.end_date || member?.expired_at || member?.active_subscription?.end_date;
                                                if (!raw && isTrainer) return 'Active';
                                                if (!raw) return '—';
                                                const d = new Date(raw);
                                                return d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });
                                            })()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                )}

                {/* SUB-PAGE 5: MANAGE NOTIFICATIONS */}
                {subPage === 'notifications' && (
                    <div className="space-y-5 animate-in fade-in duration-300">
                        <div className="flex items-center gap-2 pt-1 pb-1">
                            <button
                                type="button"
                                onClick={() => setSubPage('main')}
                                className="p-2 -ml-2 text-gray-800 hover:text-gray-900 active:scale-95 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                                title="Kembali"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight">Manage Notifications</h1>
                        </div>

                        <div className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-2xs space-y-5">
                            <p className="text-xs text-gray-500">Atur preferensi notifikasi pengingat aktivitas gym Anda.</p>

                            <div className="space-y-4 divide-y divide-gray-100">
                                <div className="flex items-center justify-between pt-2">
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-900">Pengingat Jadwal Kelas</h4>
                                        <p className="text-[11px] text-gray-400">Notifikasi H-1 sebelum kelas gym dimulai</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setNotifClass(!notifClass)}
                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                            notifClass ? 'bg-blue-600' : 'bg-gray-200'
                                        }`}
                                    >
                                        <span
                                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                                notifClass ? 'translate-x-5' : 'translate-x-0'
                                            }`}
                                        />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between pt-4">
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-900">Pengingat Sesi PT</h4>
                                        <p className="text-[11px] text-gray-400">Notifikasi jadwal sesi Personal Trainer</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setNotifPt(!notifPt)}
                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                            notifPt ? 'bg-blue-600' : 'bg-gray-200'
                                        }`}
                                    >
                                        <span
                                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                                notifPt ? 'translate-x-5' : 'translate-x-0'
                                            }`}
                                        />
                                    </button>
                                </div>

                                <div className="flex items-center justify-between pt-4">
                                    <div>
                                        <h4 className="text-xs font-bold text-gray-900">Pengumuman & Update Sistem</h4>
                                        <p className="text-[11px] text-gray-400">Notifikasi update & informasi resmi gym</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setNotifChat(!notifChat)}
                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                                            notifChat ? 'bg-blue-600' : 'bg-gray-200'
                                        }`}
                                    >
                                        <span
                                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                                notifChat ? 'translate-x-5' : 'translate-x-0'
                                            }`}
                                        />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* SUB-PAGE 6: FAQ & HELP */}
                {subPage === 'faq' && (
                    <div className="space-y-5 animate-in fade-in duration-300">
                        <div className="flex items-center gap-2 pt-1 pb-1">
                            <button
                                type="button"
                                onClick={() => setSubPage('main')}
                                className="p-2 -ml-2 text-gray-800 hover:text-gray-900 active:scale-95 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                                title="Kembali"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight">FAQ & Bantuan</h1>
                        </div>

                        <div className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-2xs space-y-4">
                            <p className="text-xs text-gray-500">Pertanyaan umum seputar layanan dan fasilitas gym.</p>

                            <div className="space-y-3">
                                {faqItems.map((item, idx) => (
                                    <div key={idx} className="border border-gray-200/80 rounded-2xl overflow-hidden">
                                        <button
                                            type="button"
                                            onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                            className="w-full p-4 flex items-center justify-between text-left font-bold text-xs text-gray-900 hover:bg-gray-50 transition-colors"
                                        >
                                            <span>{item.q}</span>
                                            <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${openFaq === idx ? 'rotate-90' : ''}`} />
                                        </button>
                                        {openFaq === idx && (
                                            <div className="px-4 pb-4 text-xs text-gray-500 leading-relaxed border-t border-gray-100 pt-2 bg-gray-50/50">
                                                {item.a}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* SUB-PAGE 7: REPORT A BUG */}
                {subPage === 'report-bug' && (
                    <div className="space-y-5 animate-in fade-in duration-300">
                        <div className="flex items-center gap-2 pt-1 pb-1">
                            <button
                                type="button"
                                onClick={() => setSubPage('main')}
                                className="p-2 -ml-2 text-gray-800 hover:text-gray-900 active:scale-95 rounded-xl transition-all flex items-center justify-center cursor-pointer"
                                title="Kembali"
                            >
                                <ArrowLeft className="w-5 h-5" />
                            </button>
                            <h1 className="text-lg sm:text-xl font-extrabold text-gray-900 tracking-tight">Report a Bug</h1>
                        </div>

                        <div className="bg-white border border-gray-200/80 rounded-3xl p-6 shadow-2xs space-y-4">
                            <p className="text-xs text-gray-500">Laporkan masalah aplikasi atau berikan saran pengembangan.</p>

                            {bugSubmitted ? (
                                <div className="p-4 bg-green-50 border border-green-200 rounded-2xl text-xs text-green-700 font-semibold flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                                    <span>Terima kasih! Laporan Anda telah berhasil dikirim.</span>
                                </div>
                            ) : (
                                <form onSubmit={handleBugSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-900 mb-1">Subjek Kendala *</label>
                                        <input
                                            type="text"
                                            value={bugSubject}
                                            onChange={(e) => setBugSubject(e.target.value)}
                                            placeholder="Contoh: Kesulitan check-in QR"
                                            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-2xl text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-900 mb-1">Deskripsi Masalah *</label>
                                        <textarea
                                            value={bugMessage}
                                            onChange={(e) => setBugMessage(e.target.value)}
                                            rows="4"
                                            placeholder="Jelaskan kendala yang Anda alami secara rinci..."
                                            className="w-full px-3.5 py-2.5 border border-gray-200 rounded-2xl text-xs bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                                            required
                                        />
                                    </div>

                                    <div className="pt-2 flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setSubPage('main')}
                                            className="px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl"
                                        >
                                            Batal
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs"
                                        >
                                            Kirim Laporan
                                        </button>
                                    </div>
                                </form>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Photo Crop Modal */}
            <ImageCropModal
                isOpen={isCropModalOpen}
                imageSrc={rawImageSrc}
                onClose={() => {
                    setIsCropModalOpen(false);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                onCropComplete={handleCropComplete}
                aspectRatio={1}
                title="Choose Photo"
            />
        </Layout>
    );
}

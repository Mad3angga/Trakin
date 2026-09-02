import React, { useState, useEffect } from 'react';
import { Head, useForm, usePage, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import ImageCropModal from '@/Components/ImageCropModal';
import {
    Building2, Printer, Camera, MessageSquare, Clock3, Globe,
    HelpCircle, UploadCloud, Sparkles, Phone, Mail, MapPin, CheckCircle2,
    FileText, Settings, ShieldCheck, ChevronRight, User, Lock, Bell,
    Terminal, AlertTriangle, Flame, ShieldAlert, Clock, Calendar, Play,
    Trash2, ToggleLeft, ToggleRight, Sliders, Layers, Send, Smartphone,
    RefreshCw, Zap, BellRing, Check, Info, ShoppingCart, CreditCard, Receipt
} from 'lucide-react';

export default function SettingsMain({ gymSettings = {}, ownerAccount = {}, devStats = {}, devRecentNotifications = [], devHealth = {}, devActivityLogs = [], devLogTail = null, devHealthLive = null, devFcmPreview = null }) {
    const { auth } = usePage().props;
    const user = auth?.user;
    const userRole = user?.roles?.[0] || auth?.user?.roles?.[0] || '';
    const canManageSettings = ['Owner', 'Manager'].includes(userRole);
    const [activeTab, setActiveTab] = useState(canManageSettings ? 'general' : 'account');
    const [logoPreview, setLogoPreview] = useState(null);
    const [ownerPhotoPreview, setOwnerPhotoPreview] = useState(ownerAccount?.photo || user?.photo || null);
    const [rawOwnerPhotoSrc, setRawOwnerPhotoSrc] = useState(null);
    const [isOwnerCropModalOpen, setIsOwnerCropModalOpen] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const canBroadcast = ['Owner', 'Manager'].includes(userRole);

    // Jika bukan Owner/Manager, paksa ke tab Account (yang boleh diakses semua role)
    useEffect(() => {
        if (!canManageSettings && ['general', 'system', 'pos'].includes(activeTab)) {
            setActiveTab('account');
        }
    }, [canManageSettings]);

    // Dev Mode States
    const [activeDevSection, setActiveDevSection] = useState('notifications');
    const [showCustomNotifModal, setShowCustomNotifModal] = useState(false);
    const [featureStates, setFeatureStates] = useState({
        feature_class_booking: gymSettings.feature_class_booking !== '0',
        feature_pt_booking: gymSettings.feature_pt_booking !== '0',
        feature_pos_module: gymSettings.feature_pos_module !== '0',
        feature_kiosk_qr: gymSettings.feature_kiosk_qr !== '0',
        feature_auto_notifications: gymSettings.feature_auto_notifications !== '0',
        feature_maintenance_mode: gymSettings.feature_maintenance_mode === '1',
    });

    const [isSendingTestNotif, setIsSendingTestNotif] = useState(false);
    const customNotifForm = useForm({
        title: '',
        body: '',
        type: 'class_reminder',
        target: 'me',
    });

    const handleSendPresetNotif = (type, title, body, target = 'me') => {
        setIsSendingTestNotif(true);
        router.post('/settings/dev-mode/notify', {
            type,
            title,
            body,
            target,
        }, {
            preserveScroll: true,
            onFinish: () => setIsSendingTestNotif(false),
        });
    };

    const handleSendCustomNotif = (e) => {
        e.preventDefault();
        customNotifForm.post('/settings/dev-mode/notify', {
            preserveScroll: true,
            onSuccess: () => {
                customNotifForm.reset('title', 'body');
                setShowCustomNotifModal(false);
            },
        });
    };

    const handleToggleFeature = (featureKey) => {
        const nextVal = !featureStates[featureKey];
        setFeatureStates(prev => ({ ...prev, [featureKey]: nextVal }));
        router.post('/settings/dev-mode/toggle-feature', {
            feature: featureKey,
            enabled: nextVal,
        }, {
            preserveScroll: true,
        });
    };

    const handleClearNotifications = () => {
        if (confirm('Bersihkan seluruh riwayat notifikasi pada akun Anda?')) {
            router.post('/settings/dev-mode/clear-notifications', {}, { preserveScroll: true });
        }
    };

    const handleClearAllNotifications = () => {
        if (confirm('Bersihkan SELURUH notifikasi global (semua user)? Aksi tidak bisa dibatalkan.')) {
            router.post('/settings/dev-mode/clear-all-notifications', {}, { preserveScroll: true });
        }
    };

    const handleCreateMockClass = () => {
        router.post('/settings/dev-mode/mock-class', {}, { preserveScroll: true });
    };

    const handleCreateMockPt = () => {
        router.post('/settings/dev-mode/mock-pt', {}, { preserveScroll: true });
    };

    const handleMockAttendance = () => {
        router.post('/settings/dev-mode/mock-attendance', {}, { preserveScroll: true });
    };

    const handleExtendMembership = () => {
        router.post('/settings/dev-mode/extend-membership', {}, { preserveScroll: true });
    };

    const handleMockSale = () => {
        router.post('/settings/dev-mode/mock-sale', {}, { preserveScroll: true });
    };
    const handleMockExpense = () => {
        router.post('/settings/dev-mode/mock-expense', {}, { preserveScroll: true });
    };
    const handleMockMembershipTrx = () => {
        router.post('/settings/dev-mode/mock-membership-trx', {}, { preserveScroll: true });
    };
    const handleBulkAttendance = () => {
        const c = prompt('Jumlah check-in bulk (1-50)?', '10');
        if (!c) return;
        router.post('/settings/dev-mode/mock-bulk-attendance', { count: parseInt(c, 10) || 10 }, { preserveScroll: true });
    };
    const handleBulkSales = () => {
        const c = prompt('Jumlah transaksi POS bulk (1-20)?', '5');
        if (!c) return;
        router.post('/settings/dev-mode/mock-bulk-sales', { count: parseInt(c, 10) || 5 }, { preserveScroll: true });
    };
    const handleBulkClassBookings = () => {
        const c = prompt('Jumlah booking kelas bulk (1-20)?', '5');
        if (!c) return;
        router.post('/settings/dev-mode/mock-bulk-class-bookings', { count: parseInt(c, 10) || 5 }, { preserveScroll: true });
    };
    const handleClearActivityLogs = () => {
        if (confirm('Hapus semua activity logs Dev Mode?')) router.post('/settings/dev-mode/clear-activity-logs', {}, { preserveScroll: true });
    };
    const handleHealthCheck = () => {
        router.post('/settings/dev-mode/health-check', {}, { preserveScroll: true });
    };
    const handleWipeDevData = () => {
        const confirmText = prompt('Ketik WIPE untuk konfirmasi penghapusan data transaksional (sales, expenses, attendances, notifications, logs).');
        if (confirmText !== 'WIPE') { if (confirmText !== null) alert('Konfirmasi salah — batal.'); return; }
        router.post('/settings/dev-mode/wipe-dev-data', { confirm: 'WIPE' }, { preserveScroll: true });
    };
    const handleClearCache = () => {
        router.post('/settings/dev-mode/clear-cache', {}, { preserveScroll: true });
    };
    const handleClearLog = () => {
        if (confirm('Kosongkan laravel.log?')) router.post('/settings/dev-mode/clear-log', {}, { preserveScroll: true });
    };
    const handleMockExpiredMembership = () => {
        router.post('/settings/dev-mode/mock-expired-membership', {}, { preserveScroll: true });
    };
    const handleMockLowStock = () => {
        router.post('/settings/dev-mode/mock-low-stock', {}, { preserveScroll: true });
    };
    const handleCreateDummyMember = (withSub = false) => {
        router.post('/settings/dev-mode/create-dummy-member', { with_subscription: withSub }, { preserveScroll: true });
    };

    const form = useForm({
        gym_name: gymSettings.gym_name || 'Trakin Fitness Center',
        gym_tagline: gymSettings.gym_tagline || 'Transform Your Power & Health',
        gym_address: gymSettings.gym_address || '',
        gym_phone: gymSettings.gym_phone || '',
        gym_email: gymSettings.gym_email || '',
        gym_logo: null,
        system_timezone: gymSettings.system_timezone || 'Asia/Jakarta',
        system_date_format: gymSettings.system_date_format || 'd/m/Y',
        system_time_format: gymSettings.system_time_format || 'H:i',
        pos_receipt_gym_name: gymSettings.pos_receipt_gym_name || 'Trakin Fitness Gym',
        pos_receipt_address: gymSettings.pos_receipt_address || 'Jl. Fitness No. 8, Pusat Kota',
        pos_receipt_phone: gymSettings.pos_receipt_phone || '0812-3456-7890',
        pos_receipt_footer_title: gymSettings.pos_receipt_footer_title || 'TERIMA KASIH',
        pos_receipt_footer_note: gymSettings.pos_receipt_footer_note || 'Selamat Berolahraga & Stay Fit!',
        pos_receipt_show_tax: gymSettings.pos_receipt_show_tax ?? '1',
        commission_pt_rate: gymSettings.commission_pt_rate ?? '45',
        commission_pt_type: gymSettings.commission_pt_type ?? 'percent',
        commission_membership_rate: gymSettings.commission_membership_rate ?? '50000',
        commission_membership_type: gymSettings.commission_membership_type ?? 'flat',
        owner_name: ownerAccount?.name || user?.name || '',
        owner_email: ownerAccount?.email || user?.email || '',
        owner_phone: ownerAccount?.phone || user?.phone || '',
        owner_photo: null,
        owner_password: '',
        owner_password_confirmation: '',
    });

    const broadcastForm = useForm({ title: '', body: '', target: 'all' });
    const handleBroadcast = (e) => {
        e.preventDefault();
        broadcastForm.post('/settings/broadcast', { preserveScroll: true, onSuccess: () => broadcastForm.reset('title', 'body') });
    };

    const handleOwnerPhotoChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = () => {
            setRawOwnerPhotoSrc(reader.result);
            setIsOwnerCropModalOpen(true);
        };
        reader.readAsDataURL(file);
    };

    const handleOwnerCropComplete = (croppedFile, previewUrl) => {
        form.setData('owner_photo', croppedFile);
        setOwnerPhotoPreview(previewUrl);
    };

    const handleDeletePhoto = () => {
        if (!confirm('Hapus foto profil? Akan kembali ke default inisial.')) return;
        router.delete('/settings/photo', {
            preserveScroll: true,
            onSuccess: () => {
                setOwnerPhotoPreview(null);
                form.setData('owner_photo', null);
            },
        });
    };

    const submit = (e) => {
        if (e) e.preventDefault();
        form.post('/settings/gym-location', {
            preserveScroll: true,
            forceFormData: true,
            onSuccess: () => {
                if (form.data.gym_logo) setLogoPreview(null);
            },
        });
    };

    const handleLogoChange = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        form.setData('gym_logo', file);
        setLogoPreview(URL.createObjectURL(file));
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (!file) return;

        form.setData('gym_logo', file);
        setLogoPreview(URL.createObjectURL(file));
    };

    return (
        <AdminLayout title="Pengaturan Gym">
            <Head title="Pengaturan Gym" />

            <div className="max-w-5xl mx-auto space-y-6">
                {/* Header Title Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                    <div>
                        <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">Settings</h1>
                        <p className="text-xs text-gray-500 mt-1">Kelola rincian profil gym, akun owner, konfigurasi sistem, dan preferensi cetak struk POS Anda.</p>
                    </div>

                    {form.isDirty && (
                        <button
                            type="button"
                            onClick={submit}
                            disabled={form.processing}
                            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs shadow-blue-600/20 flex items-center justify-center transition-all disabled:opacity-50 self-start sm:self-auto hover:shadow-md active:scale-95 cursor-pointer animate-in fade-in slide-in-from-top-1 duration-200"
                        >
                            <span>Simpan Perubahan</span>
                        </button>
                    )}
                </div>

                {/* Horizontal Navigation Tabs */}
                <div className="border-b border-gray-200/80 flex items-center gap-8 overflow-x-auto scrollbar-hide">
                    {canManageSettings && (
                        <button
                            type="button"
                            onClick={() => setActiveTab('general')}
                            className={`pb-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${activeTab === 'general'
                                    ? 'border-gray-900 text-gray-900'
                                    : 'border-transparent text-gray-400 hover:text-gray-700 font-medium'
                                }`}
                        >
                            <span>Details</span>
                        </button>
                    )}

                    <button
                        type="button"
                        onClick={() => setActiveTab('account')}
                        className={`pb-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${activeTab === 'account'
                                ? 'border-gray-900 text-gray-900'
                                : 'border-transparent text-gray-400 hover:text-gray-700 font-medium'
                            }`}
                    >
                        <span>Account</span>
                    </button>

                    {canManageSettings && (
                        <button
                            type="button"
                            onClick={() => setActiveTab('system')}
                            className={`pb-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${activeTab === 'system'
                                    ? 'border-gray-900 text-gray-900'
                                    : 'border-transparent text-gray-400 hover:text-gray-700 font-medium'
                                }`}
                        >
                            <span>System</span>
                        </button>
                    )}

                    {canManageSettings && (
                        <button
                            type="button"
                            onClick={() => setActiveTab('pos')}
                            className={`pb-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${activeTab === 'pos'
                                    ? 'border-gray-900 text-gray-900'
                                    : 'border-transparent text-gray-400 hover:text-gray-700 font-medium'
                                }`}
                        >
                            <span>POS Receipt</span>
                        </button>
                    )}

                    {canBroadcast && (
                        <button
                            type="button"
                            onClick={() => setActiveTab('broadcast')}
                            className={`pb-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${activeTab === 'broadcast'
                                    ? 'border-gray-900 text-gray-900'
                                    : 'border-transparent text-gray-400 hover:text-gray-700 font-medium'
                                }`}
                        >
                            <span>Broadcast</span>
                        </button>
                    )}

                    {canBroadcast && (
                        <button
                            type="button"
                            onClick={() => setActiveTab('dev')}
                            className={`pb-3 text-xs font-semibold border-b-2 flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${activeTab === 'dev'
                                    ? 'border-gray-900 text-gray-900'
                                    : 'border-transparent text-gray-400 hover:text-gray-700 font-medium'
                                }`}
                        >
                            <Terminal className="w-3.5 h-3.5" />
                            <span>Dev Debug</span>
                            <span className="bg-gray-100 text-gray-600 border border-gray-200 text-[10px] font-mono px-1.5 py-0.2 rounded">
                                debug
                            </span>
                        </button>
                    )}
                </div>

                {/* Main Content Form Card */}
                {activeTab !== 'broadcast' && activeTab !== 'dev' && (
                    <form onSubmit={submit} className="space-y-6">
                        {/* TAB 1: PROFIL GYM (DETAILS) */}
                        {activeTab === 'general' && (
                            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-2xs">
                                {/* Section Subheader */}
                                <div className="pb-6 border-b border-gray-100">
                                    <h2 className="text-base font-bold text-gray-900">Profile Details</h2>
                                    <p className="text-xs text-gray-500 mt-0.5">You can change your profile details here seamlessly.</p>
                                </div>

                                {/* Row 1: Gym Name / Public Profile */}
                                <div className="py-6 border-b border-gray-100 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                                    <div className="md:col-span-4 pr-2">
                                        <div className="flex items-center gap-1.5">
                                            <label className="text-xs font-bold text-gray-900">Public Profile</label>
                                            <div className="group relative cursor-pointer">
                                                <HelpCircle className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600 transition-colors" />
                                                <div className="absolute left-0 bottom-full mb-1.5 hidden group-hover:block bg-gray-900 text-white text-[10px] px-2.5 py-1.5 rounded-xl shadow-xl whitespace-nowrap z-30">
                                                    Nama profil publik utama gym Anda
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                                            This is the main profile that will be visible for everyone.
                                        </p>
                                    </div>

                                    <div className="md:col-span-8 space-y-3">
                                        <div className="relative rounded-2xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 bg-white transition-all overflow-hidden flex items-center px-3.5 py-2.5">
                                            <Building2 className="w-4 h-4 text-gray-400 shrink-0 mr-2.5" />
                                            <input
                                                type="text"
                                                value={form.data.gym_name}
                                                onChange={(e) => form.setData('gym_name', e.target.value)}
                                                placeholder="Trakin Fitness Center"
                                                className="w-full text-xs text-gray-900 placeholder-gray-400 bg-transparent focus:outline-none font-medium"
                                                required
                                            />
                                        </div>

                                        <div className="flex items-center rounded-2xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 bg-white transition-all overflow-hidden">
                                            <span className="px-3.5 py-2.5 bg-gray-50 text-xs text-gray-400 border-r border-gray-200 font-medium select-none shrink-0">
                                                https://trakingym.id/
                                            </span>
                                            <input
                                                type="text"
                                                value={form.data.gym_name.toLowerCase().replace(/[^a-z0-9]/g, '') || 'gym'}
                                                readOnly
                                                className="w-full text-xs text-gray-600 px-3.5 py-2.5 bg-transparent focus:outline-none font-mono"
                                            />
                                        </div>
                                        {form.errors.gym_name && <p className="text-xs text-red-600 mt-1">{form.errors.gym_name}</p>}
                                    </div>
                                </div>

                                {/* Row 2: Tagline / Bio Slogan */}
                                <div className="py-6 border-b border-gray-100 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                                    <div className="md:col-span-4 pr-2">
                                        <div className="flex items-center gap-1.5">
                                            <label className="text-xs font-bold text-gray-900">Bio Description</label>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                                            This will be your main story. Keep it concise & clear.
                                        </p>
                                    </div>

                                    <div className="md:col-span-8">
                                        <div className="relative rounded-2xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 bg-white transition-all p-3">
                                            <textarea
                                                value={form.data.gym_tagline}
                                                onChange={(e) => form.setData('gym_tagline', e.target.value)}
                                                placeholder="Slogan atau cerita singkat profil gym Anda..."
                                                rows="3"
                                                maxLength="300"
                                                className="w-full text-xs text-gray-900 placeholder-gray-400 bg-transparent focus:outline-none resize-none leading-relaxed"
                                            />
                                            <div className="text-[10px] text-gray-400 font-medium text-right mt-1">
                                                {form.data.gym_tagline ? form.data.gym_tagline.length : 0}/300
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Row 3: Alamat Lengkap */}
                                <div className="py-6 border-b border-gray-100 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                                    <div className="md:col-span-4 pr-2">
                                        <div className="flex items-center gap-1.5">
                                            <label className="text-xs font-bold text-gray-900">Alamat Lengkap</label>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                                            Alamat fisik resmi gym Anda untuk invoice & lokasi member.
                                        </p>
                                    </div>

                                    <div className="md:col-span-8">
                                        <div className="relative rounded-2xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 bg-white transition-all p-3">
                                            <textarea
                                                value={form.data.gym_address}
                                                onChange={(e) => form.setData('gym_address', e.target.value)}
                                                placeholder="Jl. Sudirman No. 88, Pusat Kota..."
                                                rows="3"
                                                maxLength="300"
                                                className="w-full text-xs text-gray-900 placeholder-gray-400 bg-transparent focus:outline-none resize-none leading-relaxed"
                                            />
                                            <div className="text-[10px] text-gray-400 font-medium text-right mt-1">
                                                {form.data.gym_address ? form.data.gym_address.length : 0}/300
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Row 4: Phone & Email */}
                                <div className="py-6 border-b border-gray-100 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                                    <div className="md:col-span-4 pr-2">
                                        <div className="flex items-center gap-1.5">
                                            <label className="text-xs font-bold text-gray-900">Official Contact</label>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                                            Nomor telepon WhatsApp dan alamat email resmi gym.
                                        </p>
                                    </div>

                                    <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div className="relative rounded-2xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 bg-white transition-all overflow-hidden flex items-center px-3.5 py-2.5">
                                            <Phone className="w-4 h-4 text-gray-400 shrink-0 mr-2.5" />
                                            <input
                                                type="text"
                                                value={form.data.gym_phone}
                                                onChange={(e) => form.setData('gym_phone', e.target.value)}
                                                placeholder="0812-3456-7890"
                                                className="w-full text-xs text-gray-900 placeholder-gray-400 bg-transparent focus:outline-none font-medium"
                                            />
                                        </div>

                                        <div className="relative rounded-2xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 bg-white transition-all overflow-hidden flex items-center px-3.5 py-2.5">
                                            <Mail className="w-4 h-4 text-gray-400 shrink-0 mr-2.5" />
                                            <input
                                                type="email"
                                                value={form.data.gym_email}
                                                onChange={(e) => form.setData('gym_email', e.target.value)}
                                                placeholder="info@trakingym.id"
                                                className="w-full text-xs text-gray-900 placeholder-gray-400 bg-transparent focus:outline-none font-medium"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Row 5: Profile Picture Drag & Drop */}
                                <div className="pt-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                                    <div className="md:col-span-4 pr-2">
                                        <div className="flex items-center gap-1.5">
                                            <label className="text-xs font-bold text-gray-900">Profile Picture</label>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                                            This is where people will see your actual logo.
                                        </p>
                                    </div>

                                    <div className="md:col-span-8 space-y-3">
                                        {logoPreview && (
                                            <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl">
                                                <img src={logoPreview} alt="Preview logo" className="w-14 h-14 rounded-xl object-cover border border-gray-200" />
                                                <div>
                                                    <p className="text-xs font-semibold text-gray-900">Preview logo baru</p>
                                                    <p className="text-[11px] text-gray-500">Klik Simpan Perubahan untuk menyimpan</p>
                                                </div>
                                                <button type="button" onClick={() => { setLogoPreview(null); form.setData('gym_logo', null); }} className="ml-auto text-xs text-gray-500 hover:text-red-600">Hapus</button>
                                            </div>
                                        )}
                                        <label
                                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                            onDragLeave={() => setIsDragging(false)}
                                            onDrop={handleDrop}
                                            className={`w-full border-2 border-dashed rounded-2xl p-6 transition-all text-center cursor-pointer relative flex flex-col items-center justify-center ${isDragging
                                                    ? 'border-blue-500 bg-blue-50/50'
                                                    : 'border-gray-300 hover:border-gray-400 bg-gray-50/40 hover:bg-gray-50'
                                                }`}
                                        >
                                            <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />

                                            <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-2">
                                                <UploadCloud className="w-5 h-5" />
                                            </div>

                                            <p className="text-xs font-bold text-gray-900">
                                                Click here to upload your file <span className="font-normal text-gray-400">or drag.</span>
                                            </p>
                                            <p className="text-[11px] text-gray-400 mt-1">
                                                Supported Format: JPG, PNG, WEBP (max 2MB)
                                            </p>

                                            <div className="absolute right-4 top-4 opacity-60 hidden sm:flex items-center gap-1 text-[10px] font-bold text-gray-400 border border-gray-300 px-1.5 py-0.5 rounded-md uppercase">
                                                PNG
                                            </div>
                                        </label>
                                        {form.errors.gym_logo && <p className="text-xs text-red-600">{form.errors.gym_logo}</p>}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 2: AKUN OWNER (ACCOUNT) */}
                        {activeTab === 'account' && (
                            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-2xs">
                                {/* Section Subheader */}
                                {/* Row 0: Foto Profil */}
                                <div className="py-6 border-b border-gray-100 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                                    <div className="md:col-span-4 pr-2">
                                        <div className="flex items-center gap-1.5">
                                            <label className="text-xs font-bold text-gray-900">Foto Profil</label>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                                            Foto profil yang ditampilkan pada avatar akun dan header sistem.
                                        </p>
                                    </div>

                                    <div className="md:col-span-8 flex items-center gap-4">
                                        <div className="relative shrink-0">
                                            <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200 shadow-2xs bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
                                                {ownerPhotoPreview ? (
                                                    <img src={ownerPhotoPreview} alt="Foto Profil" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span>{(form.data.owner_name || user?.name || 'O').substring(0, 2).toUpperCase()}</span>
                                                )}
                                            </div>
                                            {ownerPhotoPreview && (
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
                                        <div className="space-y-1.5">
                                            <label className="px-3.5 py-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs font-semibold rounded-xl cursor-pointer shadow-2xs inline-flex items-center gap-1.5 transition-colors">
                                                <Camera className="w-3.5 h-3.5 text-blue-600" />
                                                <span>Pilih Foto Baru</span>
                                                <input type="file" accept="image/*" onChange={handleOwnerPhotoChange} className="hidden" />
                                            </label>
                                            <p className="text-[10px] text-gray-400">Format: JPG, PNG, WEBP. Maksimal 3 MB.</p>
                                            {form.errors.owner_photo && <p className="text-xs text-red-600">{form.errors.owner_photo}</p>}
                                        </div>
                                    </div>
                                </div>

                                {/* Row 1: Nama Lengkap */}
                                <div className="py-6 border-b border-gray-100 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                                    <div className="md:col-span-4 pr-2">
                                        <div className="flex items-center gap-1.5">
                                            <label className="text-xs font-bold text-gray-900">Nama Lengkap</label>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                                            Nama lengkap akun yang terdaftar di aplikasi.
                                        </p>
                                    </div>

                                    <div className="md:col-span-8">
                                        <div className="relative rounded-2xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 bg-white transition-all overflow-hidden flex items-center px-3.5 py-2.5">
                                            <User className="w-4 h-4 text-gray-400 shrink-0 mr-2.5" />
                                            <input
                                                type="text"
                                                value={form.data.owner_name}
                                                onChange={(e) => form.setData('owner_name', e.target.value)}
                                                placeholder="Nama lengkap akun"
                                                className="w-full text-xs text-gray-900 placeholder-gray-400 bg-transparent focus:outline-none font-medium"
                                                required
                                            />
                                        </div>
                                        {form.errors.owner_name && <p className="text-xs text-red-600 mt-1">{form.errors.owner_name}</p>}
                                    </div>
                                </div>

                                {/* Row 2: Email Login */}
                                <div className="py-6 border-b border-gray-100 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                                    <div className="md:col-span-4 pr-2">
                                        <div className="flex items-center gap-1.5">
                                            <label className="text-xs font-bold text-gray-900">Email Login</label>
                                            <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                                                <Lock className="w-3 h-3 text-gray-400" /> Read Only
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                                            Alamat email utama yang digunakan untuk login. Email tidak dapat diubah demi keamanan.
                                        </p>
                                    </div>

                                    <div className="md:col-span-8">
                                        <div className="relative rounded-2xl border border-gray-200 bg-gray-50/80 transition-all overflow-hidden flex items-center px-3.5 py-2.5">
                                            <Mail className="w-4 h-4 text-gray-400 shrink-0 mr-2.5" />
                                            <input
                                                type="email"
                                                value={form.data.owner_email}
                                                readOnly
                                                className="w-full text-xs text-gray-600 bg-transparent focus:outline-none font-medium cursor-not-allowed select-none"
                                            />
                                            <Lock className="w-3.5 h-3.5 text-gray-400 shrink-0 ml-2" />
                                        </div>
                                        <p className="text-[11px] text-gray-400 mt-1">Email login dikunci dan tidak dapat diubah secara langsung.</p>
                                    </div>
                                </div>

                                {/* Row 3: No WhatsApp */}
                                <div className="py-6 border-b border-gray-100 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                                    <div className="md:col-span-4 pr-2">
                                        <div className="flex items-center gap-1.5">
                                            <label className="text-xs font-bold text-gray-900">No. WhatsApp</label>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                                            Nomor kontak pribadi untuk notifikasi & komunikasi.
                                        </p>
                                    </div>

                                    <div className="md:col-span-8">
                                        <div className="relative rounded-2xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 bg-white transition-all overflow-hidden flex items-center px-3.5 py-2.5">
                                            <Phone className="w-4 h-4 text-gray-400 shrink-0 mr-2.5" />
                                            <input
                                                type="text"
                                                value={form.data.owner_phone}
                                                onChange={(e) => form.setData('owner_phone', e.target.value)}
                                                placeholder="0812-3456-7890"
                                                className="w-full text-xs text-gray-900 placeholder-gray-400 bg-transparent focus:outline-none font-medium"
                                            />
                                        </div>
                                        {form.errors.owner_phone && <p className="text-xs text-red-600 mt-1">{form.errors.owner_phone}</p>}
                                    </div>
                                </div>

                                {/* Row 4: Ubah Password */}
                                <div className="pt-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                                    <div className="md:col-span-4 pr-2">
                                        <div className="flex items-center gap-1.5">
                                            <label className="text-xs font-bold text-gray-900">Ubah Password</label>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                                            Kosongkan jika tidak ingin mengubah kata sandi akun Anda.
                                        </p>
                                    </div>

                                    <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-bold text-gray-900 mb-1">Password Baru</label>
                                            <div className="relative rounded-2xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 bg-white transition-all overflow-hidden flex items-center px-3.5 py-2.5">
                                                <Lock className="w-4 h-4 text-gray-400 shrink-0 mr-2.5" />
                                                <input
                                                    type="password"
                                                    value={form.data.owner_password}
                                                    onChange={(e) => form.setData('owner_password', e.target.value)}
                                                    placeholder="••••••••"
                                                    className="w-full text-xs text-gray-900 placeholder-gray-400 bg-transparent focus:outline-none font-medium"
                                                />
                                            </div>
                                            {form.errors.owner_password && <p className="text-xs text-red-600 mt-1">{form.errors.owner_password}</p>}
                                        </div>

                                        <div>
                                            <label className="block text-xs font-bold text-gray-900 mb-1">Konfirmasi Password</label>
                                            <div className="relative rounded-2xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 bg-white transition-all overflow-hidden flex items-center px-3.5 py-2.5">
                                                <Lock className="w-4 h-4 text-gray-400 shrink-0 mr-2.5" />
                                                <input
                                                    type="password"
                                                    value={form.data.owner_password_confirmation}
                                                    onChange={(e) => form.setData('owner_password_confirmation', e.target.value)}
                                                    placeholder="••••••••"
                                                    className="w-full text-xs text-gray-900 placeholder-gray-400 bg-transparent focus:outline-none font-medium"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 3: SYSTEM & REGIONAL */}
                        {activeTab === 'system' && (
                            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-2xs">
                                {/* Section Subheader */}
                                <div className="pb-6 border-b border-gray-100">
                                    <h2 className="text-base font-bold text-gray-900">System Configurations</h2>
                                    <p className="text-xs text-gray-500 mt-0.5">Atur zona waktu aplikasi, preferensi penanggalan, dan format jam.</p>
                                </div>

                                {/* Row 1: Timezone */}
                                <div className="py-6 border-b border-gray-100 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                                    <div className="md:col-span-4 pr-2">
                                        <div className="flex items-center gap-1.5">
                                            <label className="text-xs font-bold text-gray-900">Zona Waktu</label>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                                            Zona waktu lokal yang digunakan untuk pencatatan presensi & jadwal kelas.
                                        </p>
                                    </div>

                                    <div className="md:col-span-8">
                                        <div className="relative rounded-2xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 bg-white transition-all overflow-hidden flex items-center px-3.5 py-2.5">
                                            <Globe className="w-4 h-4 text-gray-400 shrink-0 mr-2.5" />
                                            <select
                                                value={form.data.system_timezone}
                                                onChange={(e) => form.setData('system_timezone', e.target.value)}
                                                className="w-full text-xs text-gray-900 bg-transparent focus:outline-none font-medium cursor-pointer"
                                            >
                                                <option value="Asia/Jakarta">Asia/Jakarta (WIB - Western Indonesian Time)</option>
                                                <option value="Asia/Makassar">Asia/Makassar (WITA - Central Indonesian Time)</option>
                                                <option value="Asia/Jayapura">Asia/Jayapura (WIT - Eastern Indonesian Time)</option>
                                                <option value="UTC">UTC (Universal Coordinated Time)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Row 2: Date Format */}
                                <div className="py-6 border-b border-gray-100 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                                    <div className="md:col-span-4 pr-2">
                                        <div className="flex items-center gap-1.5">
                                            <label className="text-xs font-bold text-gray-900">Format Tanggal</label>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                                            Gaya penulisan tanggal pada laporan dan nota transaksi.
                                        </p>
                                    </div>

                                    <div className="md:col-span-8">
                                        <div className="relative rounded-2xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 bg-white transition-all overflow-hidden flex items-center px-3.5 py-2.5">
                                            <Clock3 className="w-4 h-4 text-gray-400 shrink-0 mr-2.5" />
                                            <select
                                                value={form.data.system_date_format}
                                                onChange={(e) => form.setData('system_date_format', e.target.value)}
                                                className="w-full text-xs text-gray-900 bg-transparent focus:outline-none font-medium cursor-pointer"
                                            >
                                                <option value="d/m/Y">DD/MM/YYYY (Contoh: 31/12/2026)</option>
                                                <option value="m/d/Y">MM/DD/YYYY (Contoh: 12/31/2026)</option>
                                                <option value="Y-m-d">YYYY-MM-DD (Contoh: 2026-12-31)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Row 3: Time Format */}
                                <div className="pt-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                                    <div className="md:col-span-4 pr-2">
                                        <div className="flex items-center gap-1.5">
                                            <label className="text-xs font-bold text-gray-900">Format Waktu</label>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                                            Tampilan format jam (24 Jam vs 12 Jam AM/PM).
                                        </p>
                                    </div>

                                    <div className="md:col-span-8">
                                        <div className="relative rounded-2xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 bg-white transition-all overflow-hidden flex items-center px-3.5 py-2.5">
                                            <Clock3 className="w-4 h-4 text-gray-400 shrink-0 mr-2.5" />
                                            <select
                                                value={form.data.system_time_format}
                                                onChange={(e) => form.setData('system_time_format', e.target.value)}
                                                className="w-full text-xs text-gray-900 bg-transparent focus:outline-none font-medium cursor-pointer"
                                            >
                                                <option value="H:i">Format 24 Jam (Contoh: 16:30)</option>
                                                <option value="h:i A">Format 12 Jam AM/PM (Contoh: 04:30 PM)</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Komisi Card — terpisah di bawah card System */}
                        {activeTab === 'system' && (
                            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-2xs">
                                <div className="pb-6 border-b border-gray-100">
                                    <h2 className="text-base font-bold text-gray-900">Komisi</h2>
                                    <p className="text-xs text-gray-500 mt-0.5">Atur komisi sesi PT dan penjualan membership — otomatis terhitung di Laporan Trakin.</p>
                                </div>

                                <div className="py-6 border-b border-gray-100 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                                    <div className="md:col-span-4 pr-2">
                                        <label className="text-xs font-bold text-gray-900">Komisi Sesi PT</label>
                                        <p className="text-xs text-gray-400 mt-1 leading-relaxed">Trainer / Coach — per sesi selesai.</p>
                                    </div>
                                    <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div className="sm:col-span-2">
                                            <div className="relative rounded-2xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 bg-white transition-all overflow-hidden flex items-center px-3.5 py-2.5">
                                                <span className="text-xs font-bold text-gray-400 mr-2 shrink-0">{form.data.commission_pt_type === 'percent' ? '%' : 'Rp'}</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={form.data.commission_pt_type === 'percent' ? 100 : undefined}
                                                    value={form.data.commission_pt_rate}
                                                    onChange={(e) => form.setData('commission_pt_rate', e.target.value)}
                                                    placeholder={form.data.commission_pt_type === 'percent' ? '45' : '50000'}
                                                    className="w-full text-xs text-gray-900 placeholder-gray-400 bg-transparent focus:outline-none font-medium"
                                                />
                                            </div>
                                            <p className="text-[11px] text-gray-400 mt-1">Contoh: sesi Rp 100.000 × 45% → Rp 45.000</p>
                                        </div>
                                        <div>
                                            <div className="relative rounded-2xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 bg-white transition-all overflow-hidden flex items-center px-3.5 py-2.5">
                                                <select
                                                    value={form.data.commission_pt_type}
                                                    onChange={(e) => form.setData('commission_pt_type', e.target.value)}
                                                    className="w-full text-xs text-gray-900 bg-transparent focus:outline-none font-medium cursor-pointer"
                                                >
                                                    <option value="percent">Persen (%)</option>
                                                    <option value="flat">Flat (Rp)</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-6 grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                                    <div className="md:col-span-4 pr-2">
                                        <label className="text-xs font-bold text-gray-900">Komisi Penjualan Membership</label>
                                        <p className="text-xs text-gray-400 mt-1 leading-relaxed">Sales / Front Desk — per closing paket. Dihitung saat transaksi paid.</p>
                                    </div>
                                    <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-3 gap-3">
                                        <div className="sm:col-span-2">
                                            <div className="relative rounded-2xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 bg-white transition-all overflow-hidden flex items-center px-3.5 py-2.5">
                                                <span className="text-xs font-bold text-gray-400 mr-2 shrink-0">{form.data.commission_membership_type === 'percent' ? '%' : 'Rp'}</span>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={form.data.commission_membership_type === 'percent' ? 100 : undefined}
                                                    value={form.data.commission_membership_rate}
                                                    onChange={(e) => form.setData('commission_membership_rate', e.target.value)}
                                                    placeholder={form.data.commission_membership_type === 'percent' ? '10' : '50000'}
                                                    className="w-full text-xs text-gray-900 placeholder-gray-400 bg-transparent focus:outline-none font-medium"
                                                />
                                            </div>
                                            <p className="text-[11px] text-gray-400 mt-1">Contoh: paket Rp 1.000.000 → flat Rp 50.000</p>
                                        </div>
                                        <div>
                                            <div className="relative rounded-2xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 bg-white transition-all overflow-hidden flex items-center px-3.5 py-2.5">
                                                <select
                                                    value={form.data.commission_membership_type}
                                                    onChange={(e) => form.setData('commission_membership_type', e.target.value)}
                                                    className="w-full text-xs text-gray-900 bg-transparent focus:outline-none font-medium cursor-pointer"
                                                >
                                                    <option value="percent">Persen (%)</option>
                                                    <option value="flat">Flat (Rp)</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* TAB 4: POS RECEIPT */}
                        {activeTab === 'pos' && (
                            <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-2xs">
                                {/* Section Subheader */}
                                <div className="pb-6 border-b border-gray-100">
                                    <h2 className="text-base font-bold text-gray-900">Struk Transaksi POS</h2>
                                    <p className="text-xs text-gray-500 mt-0.5">Sesuaikan teks header, footer, kontak, dan pratinjau langsung nota cetak 80mm.</p>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-2">
                                    {/* Left Fields (7 cols) */}
                                    <div className="lg:col-span-7 space-y-6">
                                        {/* Outlet Header */}
                                        <div className="space-y-3 pb-6 border-b border-gray-100">
                                            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Information Header</h3>

                                            <div>
                                                <label className="block text-xs font-bold text-gray-900 mb-1">Nama Outlet Struk</label>
                                                <div className="relative rounded-2xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 bg-white transition-all overflow-hidden flex items-center px-3.5 py-2.5">
                                                    <Building2 className="w-4 h-4 text-gray-400 shrink-0 mr-2.5" />
                                                    <input
                                                        type="text"
                                                        value={form.data.pos_receipt_gym_name}
                                                        onChange={(e) => form.setData('pos_receipt_gym_name', e.target.value)}
                                                        placeholder="Trakin Fitness Gym"
                                                        className="w-full text-xs text-gray-900 placeholder-gray-400 bg-transparent focus:outline-none font-medium"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-900 mb-1">Alamat Singkat Nota</label>
                                                    <div className="relative rounded-2xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 bg-white transition-all overflow-hidden flex items-center px-3.5 py-2.5">
                                                        <input
                                                            type="text"
                                                            value={form.data.pos_receipt_address}
                                                            onChange={(e) => form.setData('pos_receipt_address', e.target.value)}
                                                            placeholder="Jl. Fitness No. 8"
                                                            className="w-full text-xs text-gray-900 placeholder-gray-400 bg-transparent focus:outline-none font-medium"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-xs font-bold text-gray-900 mb-1">No. Telepon Struk</label>
                                                    <div className="relative rounded-2xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 bg-white transition-all overflow-hidden flex items-center px-3.5 py-2.5">
                                                        <input
                                                            type="text"
                                                            value={form.data.pos_receipt_phone}
                                                            onChange={(e) => form.setData('pos_receipt_phone', e.target.value)}
                                                            placeholder="0812-3456-7890"
                                                            className="w-full text-xs text-gray-900 placeholder-gray-400 bg-transparent focus:outline-none font-medium"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Footer Section */}
                                        <div className="space-y-3">
                                            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Footer Notes & PPN</h3>

                                            <div>
                                                <label className="block text-xs font-bold text-gray-900 mb-1">Judul Penutup (Footer Title)</label>
                                                <div className="relative rounded-2xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 bg-white transition-all overflow-hidden flex items-center px-3.5 py-2.5">
                                                    <input
                                                        type="text"
                                                        value={form.data.pos_receipt_footer_title}
                                                        onChange={(e) => form.setData('pos_receipt_footer_title', e.target.value)}
                                                        placeholder="TERIMA KASIH"
                                                        className="w-full text-xs text-gray-900 placeholder-gray-400 bg-transparent focus:outline-none font-medium"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-gray-900 mb-1">Pesan Penutup (Footer Note)</label>
                                                <div className="relative rounded-2xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 bg-white transition-all overflow-hidden flex items-center px-3.5 py-2.5">
                                                    <input
                                                        type="text"
                                                        value={form.data.pos_receipt_footer_note}
                                                        onChange={(e) => form.setData('pos_receipt_footer_note', e.target.value)}
                                                        placeholder="Selamat Berolahraga & Stay Fit!"
                                                        className="w-full text-xs text-gray-900 placeholder-gray-400 bg-transparent focus:outline-none font-medium"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-gray-900 mb-1">Tampilkan PPN 11%</label>
                                                <div className="relative rounded-2xl border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 bg-white transition-all overflow-hidden flex items-center px-3.5 py-2.5">
                                                    <select
                                                        value={form.data.pos_receipt_show_tax}
                                                        onChange={(e) => form.setData('pos_receipt_show_tax', e.target.value)}
                                                        className="w-full text-xs text-gray-900 bg-transparent focus:outline-none font-medium cursor-pointer"
                                                    >
                                                        <option value="1">Tampilkan PPN 11% Pada Nota</option>
                                                        <option value="0">Sembunyikan PPN</option>
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right Column: Live thermal receipt preview (5 cols) */}
                                    <div className="lg:col-span-5 space-y-3">
                                        <h4 className="font-bold text-xs text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <Printer className="w-3.5 h-3.5 text-gray-400" />
                                            Live Receipt Preview (80mm)
                                        </h4>

                                        <div className="bg-white border border-gray-300/80 rounded-2xl p-6 shadow-md text-black font-mono text-xs max-w-[290px] mx-auto space-y-2 select-none">
                                            <div className="text-center pb-2 border-b border-black border-dashed">
                                                <h5 className="font-extrabold text-sm uppercase">{form.data.pos_receipt_gym_name || 'TRAKIN FITNESS GYM'}</h5>
                                                <p className="text-[10px] text-gray-700">{form.data.pos_receipt_address || 'Jl. Fitness No. 8'}</p>
                                                <p className="text-[10px] text-gray-700">Telp: {form.data.pos_receipt_phone || '0812-3456-7890'}</p>
                                            </div>

                                            <div className="py-2 border-b border-black border-dashed text-[11px] space-y-0.5 text-gray-800">
                                                <p>No. Invoice : INV-20260809-1024</p>
                                                <p>Waktu       : 09/08/2026 13:10</p>
                                                <p>Kasir       : Owner / Admin</p>
                                            </div>

                                            <div className="py-2 border-b border-black border-dashed text-[11px] space-y-1">
                                                <div>
                                                    <p className="font-bold">Air Mineral 600ml</p>
                                                    <div className="flex justify-between text-[10px] text-gray-700">
                                                        <span>2 x Rp 5.000</span>
                                                        <span>Rp 10.000</span>
                                                    </div>
                                                </div>
                                                <div>
                                                    <p className="font-bold">Whey Protein Shake</p>
                                                    <div className="flex justify-between text-[10px] text-gray-700">
                                                        <span>1 x Rp 35.000</span>
                                                        <span>Rp 35.000</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="py-2 border-b border-black border-dashed text-[11px] space-y-0.5 text-gray-800">
                                                <div className="flex justify-between"><span>Subtotal:</span><span>Rp 45.000</span></div>
                                                {form.data.pos_receipt_show_tax === '1' && (
                                                    <div className="flex justify-between"><span>PPN 11%:</span><span>Rp 4.950</span></div>
                                                )}
                                                <div className="flex justify-between font-bold text-xs pt-1 border-t border-black border-dotted">
                                                    <span>TOTAL:</span>
                                                    <span>{form.data.pos_receipt_show_tax === '1' ? 'Rp 49.950' : 'Rp 45.000'}</span>
                                                </div>
                                            </div>

                                            <div className="text-center pt-3 text-[10px] text-gray-800">
                                                <p className="font-bold uppercase">{form.data.pos_receipt_footer_title || 'TERIMA KASIH'}</p>
                                                <p>{form.data.pos_receipt_footer_note || 'Selamat Berolahraga & Stay Fit!'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </form>
                )}

                {activeTab === 'broadcast' && canBroadcast && (
                    <div className="bg-white rounded-2xl border border-gray-200/80 p-6 sm:p-8 shadow-2xs space-y-6">
                        <div className="pb-6 border-b border-gray-100">
                            <h2 className="text-base font-bold text-gray-900">Broadcast Push Notification</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Kirim notifikasi push langsung ke layar HP pengguna & In-App Notification.</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
                            {/* Left Side: Broadcast Input Form */}
                            <div className="lg:col-span-7 space-y-5">
                                <div>
                                    <label className="block text-xs font-bold text-gray-900 mb-1">Judul Notifikasi *</label>
                                    <input
                                        type="text"
                                        value={broadcastForm.data.title}
                                        onChange={e => broadcastForm.setData('title', e.target.value)}
                                        placeholder="Contoh: Promo Diskon Membership Weekend!"
                                        className="w-full px-3.5 py-2.5 border border-white-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 font-medium bg-transparent"
                                    />
                                    {broadcastForm.errors.title && <p className="text-xs text-red-600 mt-1">{broadcastForm.errors.title}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-900 mb-1">Isi Pesan Notifikasi *</label>
                                    <textarea
                                        value={broadcastForm.data.body}
                                        onChange={e => broadcastForm.setData('body', e.target.value)}
                                        rows={4}
                                        placeholder="Tulis pesan broadcast lengkap di sini..."
                                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:border-gray-900 resize-none leading-relaxed bg-transparent"
                                    />
                                    {broadcastForm.errors.body && <p className="text-xs text-red-600 mt-1">{broadcastForm.errors.body}</p>}
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-900 mb-1">Target Penerima</label>
                                    <select
                                        value={broadcastForm.data.target}
                                        onChange={e => broadcastForm.setData('target', e.target.value)}
                                        className="w-full px-3.5 py-2.5 border border-gray-200 rounded-2xl text-xs bg-transparent focus:outline-none font-medium cursor-pointer"
                                    >
                                        <option value="all">Semua Pengguna (Member, Trainer & Staff)</option>
                                        <option value="member">Member Sahaja</option>
                                        <option value="trainer">Trainer / Coach Sahaja</option>
                                        <option value="staff">Staff Gym (Owner, Manager, Front Desk)</option>
                                        <option value="owner">Owner Sahaja</option>
                                    </select>
                                </div>

                                <p className="text-[11px] text-gray-400 leading-relaxed">
                                    Pesan ini akan dikirimkan sebagai Notifikasi Push ke perangkat HP pengguna dan juga tersimpan di In-App Notification.
                                </p>

                                <div className="pt-2 flex justify-end">
                                    <button
                                        type="button"
                                        onClick={handleBroadcast}
                                        disabled={broadcastForm.processing || !broadcastForm.data.title || !broadcastForm.data.body}
                                        className="px-6 py-2.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-all disabled:opacity-50 cursor-pointer active:scale-95"
                                    >
                                        Kirim Broadcast
                                    </button>
                                </div>
                            </div>

                            {/* Right Side: Live Notification Preview */}
                            <div className="lg:col-span-5 space-y-3">
                                <h4 className="font-bold text-xs text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                    <Bell className="w-3.5 h-3.5 text-gray-400" /> Live Notification Preview
                                </h4>

                                {/* Clean Transparent Notification Banner */}
                                <div className="border border-gray-200 rounded-2xl p-4 shadow-sm space-y-2.5 text-gray-900 bg-white/50 backdrop-blur-xs transition-all">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-5 h-5 rounded-md border border-gray-200 flex items-center justify-center text-[10px] font-bold overflow-hidden shadow-2xs">
                                                <img src="/images/logo_trakin.png" alt="Logo" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
                                            </div>
                                            <span className="text-xs font-bold tracking-tight text-gray-900">Trakin Gym</span>
                                        </div>
                                        <span className="text-[10px] text-gray-400 font-medium">Sekarang</span>
                                    </div>

                                    <div className="space-y-0.5 text-left">
                                        <h5 className="text-xs font-bold text-gray-900 tracking-tight line-clamp-1">
                                            {broadcastForm.data.title || 'Judul Notifikasi Broadcast'}
                                        </h5>
                                        <p className="text-[11px] text-gray-600 leading-snug line-clamp-3">
                                            {broadcastForm.data.body || 'Isi pesan notifikasi push yang akan muncul di layar HP pengguna saat broadcast dikirimkan.'}
                                        </p>
                                    </div>

                                    <div className="pt-2 flex items-center justify-between border-t border-gray-100 text-[10px] text-gray-400">
                                        <span>Target: <strong className="text-gray-800 font-semibold">{
                                            {
                                                all: 'Semua Pengguna',
                                                member: 'Member',
                                                trainer: 'Trainer',
                                                staff: 'Staff Gym',
                                                owner: 'Owner'
                                            }[broadcastForm.data.target] || 'Semua'
                                        }</strong></span>
                                        <span className="text-[10px]">Pratinjau Notifikasi</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'dev' && canBroadcast && (
                    <div className="bg-white rounded-3xl border border-gray-100/80 shadow-xs p-4 sm:p-6 space-y-4 text-gray-900">
                        
                        {/* Terminal Environment Status Bar */}
                        <div className="bg-gray-950 text-gray-300 rounded-xl p-3 sm:px-4 sm:py-3 font-mono text-xs border border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                <span className="text-gray-400">env:<strong className="text-white ml-1">{devHealth.app_env}</strong></span>
                                <span className="text-gray-600">|</span>
                                <span className="text-gray-400">debug:<strong className="text-white ml-1">{String(devHealth.app_debug)}</strong></span>
                                <span className="text-gray-600">|</span>
                                <span className="text-gray-400">fcm_devices:<strong className="text-white ml-1">{devStats.total_devices || 0}</strong></span>
                                <span className="text-gray-600">|</span>
                                <span className="text-gray-400">users:<strong className="text-white ml-1">{devStats.total_users || 0}</strong></span>
                                <span className="text-gray-600">|</span>
                                <span className="text-gray-400">notifications:<strong className="text-white ml-1">{devStats.total_notifications || 0}</strong></span>
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                                <span className={`px-2 py-0.5 rounded border font-mono ${devHealth.gemini_configured ? 'bg-gray-900 border-gray-700 text-gray-200' : 'bg-red-950/50 border-red-800 text-red-300'}`}>
                                    gemini:{devHealth.gemini_configured ? 'OK' : 'NULL'}
                                </span>
                                <span className={`px-2 py-0.5 rounded border font-mono ${devHealth.firebase_json_exists ? 'bg-gray-900 border-gray-700 text-gray-200' : 'bg-amber-950/50 border-amber-800 text-amber-300'}`}>
                                    fcm:{devHealth.firebase_json_exists ? 'V1' : 'NO_CONFIG'}
                                </span>
                                <span className={`px-2 py-0.5 rounded border font-mono ${devHealth.storage_writable ? 'bg-gray-900 border-gray-700 text-gray-200' : 'bg-red-950/50 border-red-800 text-red-300'}`}>
                                    storage:{devHealth.storage_writable ? 'RW' : 'RO'}
                                </span>
                            </div>
                        </div>

                        {/* Minimalist Developer Sub-Navigation Tabs */}
                        <div className="flex items-center gap-1 border-b border-gray-200 pb-2 text-xs font-mono overflow-x-auto">
                            {[
                                { id: 'notifications', label: 'events_and_notifications' },
                                { id: 'features', label: 'feature_flags' },
                                { id: 'utils', label: 'data_generator_and_mock' },
                                { id: 'health', label: 'diagnostics_and_logs' },
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveDevSection(tab.id)}
                                    className={`px-3 py-1.5 rounded text-xs transition-colors cursor-pointer whitespace-nowrap ${
                                        activeDevSection === tab.id
                                            ? 'bg-gray-900 text-white font-semibold'
                                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 font-medium'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* ========================================================= */}
                        {/* SECTION 1: EVENTS AND NOTIFICATIONS                       */}
                        {/* ========================================================= */}
                        {activeDevSection === 'notifications' && (
                            <div className="space-y-3">
                                
                                <div className="border border-gray-200 rounded-xl overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left text-xs font-sans">
                                            <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-mono text-[11px] uppercase">
                                                <tr>
                                                    <th className="px-3.5 py-2.5 font-medium">Event Type</th>
                                                    <th className="px-3.5 py-2.5 font-medium">Payload Preview</th>
                                                    <th className="px-3.5 py-2.5 font-medium text-right">Dispatch Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-200 bg-white">
                                                {[
                                                    {
                                                        type: 'class_reminder',
                                                        title: 'Pengingat Sesi Kelas: Yoga Vinyasa',
                                                        body: 'Sesi Yoga Vinyasa Anda akan dimulai dalam 1 jam (08:00 WIB) di Studio 1 bersama Coach Sarah.',
                                                        desc: 'Pengingat H-1 jam sebelum jadwal kelas dimulai',
                                                    },
                                                    {
                                                        type: 'pt_reminder',
                                                        title: 'Pengingat Sesi Personal Trainer',
                                                        body: 'Sesi latihan 1-on-1 bersama Coach Alex dijadwalkan hari ini pukul 16:00 WIB di Gym Area.',
                                                        desc: 'Pengingat jadwal booking Personal Trainer member',
                                                    },
                                                    {
                                                        type: 'class_booking',
                                                        title: 'Booking Kelas Berhasil',
                                                        body: 'Anda berhasil terdaftar di sesi HIIT Fat Burn pada Senin, 18 Agu pukul 09:00 WIB di Studio 2.',
                                                        desc: 'Konfirmasi pendaftaran kelas berhasil',
                                                    },
                                                    {
                                                        type: 'class_update',
                                                        title: 'Update Jadwal Sesi Kelas',
                                                        body: 'Pemberitahuan: Sesi kelas Pilates pukul 16:00 WIB hari ini dialihkan ke Studio Utama.',
                                                        desc: 'Notifikasi perubahan ruangan / waktu kelas',
                                                    },
                                                    {
                                                        type: 'membership_expiry',
                                                        title: 'Membership Segera Berakhir',
                                                        body: 'Paket Membership Gold Anda akan berakhir dalam 3 hari. Perpanjang sekarang agar akses tetap aktif.',
                                                        desc: 'Pengingat masa aktif membership mendekati kadaluarsa (H-3)',
                                                    },
                                                    {
                                                        type: 'membership_expired',
                                                        title: 'Membership Anda Telah Berakhir',
                                                        body: 'Masa aktif membership Anda telah habis hari ini. Silakan perpanjang paket di kasir atau aplikasi.',
                                                        desc: 'Pemberitahuan membership telah melewati tanggal berakhir',
                                                    },
                                                    {
                                                        type: 'attendance',
                                                        title: 'Check-in Gym Berhasil',
                                                        body: 'Selamat datang di Trakin Gym! Check-in berhasil pada 18:30 WIB. Streak latihan: 7 hari.',
                                                        desc: 'Log check-in QR scanner & kalkulasi streak hari',
                                                    },
                                                    {
                                                        type: 'stock_low',
                                                        title: 'Peringatan Stok Produk Menipis',
                                                        body: 'Stok Whey Protein Vanilla tersisa 2 pcs di gudang. Segera lakukan restock order.',
                                                        desc: 'Peringatan stok inventaris POS berada di bawah batas minimum',
                                                    },
                                                    {
                                                        type: 'promo',
                                                        title: 'Promo Spesial Member Trakin',
                                                        body: 'Dapatkan diskon 20% untuk paket Personal Trainer dan Suplemen fitness pekan ini.',
                                                        desc: 'Pengumuman promo broadcast dan diskon',
                                                    },
                                                ].map((item) => (
                                                    <tr key={item.type} className="hover:bg-gray-50/70 transition-colors">
                                                        <td className="px-3.5 py-2.5 whitespace-nowrap align-top">
                                                            <code className="text-gray-900 font-mono font-semibold bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded text-[11px]">
                                                                {item.type}
                                                            </code>
                                                        </td>
                                                        <td className="px-3.5 py-2.5 align-top">
                                                            <div className="font-medium text-gray-900 text-xs">{item.title}</div>
                                                            <div className="text-gray-500 text-[11px] mt-0.5 leading-snug line-clamp-1">{item.body}</div>
                                                            <div className="text-gray-400 font-mono text-[10px] mt-0.5">{item.desc}</div>
                                                        </td>
                                                        <td className="px-3.5 py-2.5 whitespace-nowrap text-right align-middle">
                                                            <div className="flex items-center justify-end gap-1.5">
                                                                <button
                                                                    type="button"
                                                                    disabled={isSendingTestNotif}
                                                                    onClick={() => handleSendPresetNotif(item.type, item.title, item.body, 'me')}
                                                                    className="px-2.5 py-1 bg-gray-900 hover:bg-black text-white text-[11px] font-mono font-medium rounded border border-gray-900 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
                                                                >
                                                                    Dispatch (Me)
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    disabled={isSendingTestNotif}
                                                                    onClick={() => handleSendPresetNotif(item.type, item.title, item.body, 'members')}
                                                                    className="px-2.5 py-1 bg-white hover:bg-gray-100 text-gray-700 text-[11px] font-mono font-medium rounded border border-gray-300 transition-all cursor-pointer disabled:opacity-50 active:scale-95"
                                                                >
                                                                    All Members
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Custom Payload Drawer & Reset Bar */}
                                <div className="flex items-center justify-between pt-1">
                                    <button
                                        type="button"
                                        onClick={() => setShowCustomNotifModal(!showCustomNotifModal)}
                                        className="text-xs font-mono text-gray-700 hover:text-black font-semibold flex items-center gap-1 cursor-pointer"
                                    >
                                        <Send className="w-3.5 h-3.5" />
                                        <span>{showCustomNotifModal ? '[-] close_custom_payload_form' : '[+] open_custom_payload_form'}</span>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={handleClearNotifications}
                                        className="text-xs font-mono text-gray-500 hover:text-gray-900 flex items-center gap-1 cursor-pointer transition-colors"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>truncate_user_inbox</span>
                                    </button>
                                </div>

                                {showCustomNotifModal && (
                                    <form onSubmit={handleSendCustomNotif} className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3 font-mono text-xs animate-in fade-in duration-100">
                                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                            <div className="sm:col-span-2">
                                                <label className="block text-[11px] text-gray-600 mb-1">title:</label>
                                                <input
                                                    type="text"
                                                    value={customNotifForm.data.title}
                                                    onChange={e => customNotifForm.setData('title', e.target.value)}
                                                    placeholder="Notification title..."
                                                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs bg-white focus:outline-none focus:border-gray-900 font-sans"
                                                    required
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[11px] text-gray-600 mb-1">target:</label>
                                                <select
                                                    value={customNotifForm.data.target}
                                                    onChange={e => customNotifForm.setData('target', e.target.value)}
                                                    className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs bg-white focus:outline-none font-mono cursor-pointer"
                                                >
                                                    <option value="me">me (current_user)</option>
                                                    <option value="members">members</option>
                                                    <option value="trainers">trainers</option>
                                                    <option value="all">all_users</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] text-gray-600 mb-1">body:</label>
                                            <textarea
                                                value={customNotifForm.data.body}
                                                onChange={e => customNotifForm.setData('body', e.target.value)}
                                                rows={2}
                                                placeholder="Notification message body..."
                                                className="w-full px-3 py-1.5 border border-gray-300 rounded text-xs bg-white focus:outline-none focus:border-gray-900 font-sans resize-none"
                                                required
                                            />
                                        </div>
                                        <div className="flex justify-end">
                                            <button
                                                type="submit"
                                                disabled={customNotifForm.processing || !customNotifForm.data.title || !customNotifForm.data.body}
                                                className="px-4 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-mono font-medium rounded transition-all disabled:opacity-50 cursor-pointer"
                                            >
                                                POST /dev-mode/notify
                                            </button>
                                        </div>
                                    </form>
                                )}

                            </div>
                        )}

                        {/* ========================================================= */}
                        {/* SECTION 2: FEATURE FLAGS                                  */}
                        {/* ========================================================= */}
                        {activeDevSection === 'features' && (
                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                                <table className="w-full text-left text-xs font-sans">
                                    <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-mono text-[11px] uppercase">
                                        <tr>
                                            <th className="px-3.5 py-2.5 font-medium">Flag Key</th>
                                            <th className="px-3.5 py-2.5 font-medium">Module Description</th>
                                            <th className="px-3.5 py-2.5 font-medium">State</th>
                                            <th className="px-3.5 py-2.5 font-medium text-right">Toggle</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                        {[
                                            {
                                                key: 'feature_class_booking',
                                                title: 'Class Booking Module',
                                                desc: 'Member self-service class schedule booking access',
                                            },
                                            {
                                                key: 'feature_pt_booking',
                                                title: 'Personal Trainer (PT) Booking Module',
                                                desc: 'Member PT session reservation access with coach',
                                            },
                                            {
                                                key: 'feature_pos_module',
                                                title: 'POS & Cashier Module',
                                                desc: 'Cashier checkout access for products & memberships',
                                            },
                                            {
                                                key: 'feature_kiosk_qr',
                                                title: 'Kiosk & QR Scanner Module',
                                                desc: 'Self check-in QR scanner on Kiosk display',
                                            },
                                            {
                                                key: 'feature_auto_notifications',
                                                title: 'Auto Notification Background Engine',
                                                desc: 'Automated scheduler for class reminders & membership H-3',
                                            },
                                            {
                                                key: 'feature_maintenance_mode',
                                                title: 'Maintenance Mode Banner',
                                                desc: 'Display system maintenance warning banner on member app',
                                            },
                                        ].map((feat) => {
                                            const isEnabled = featureStates[feat.key];
                                            return (
                                                <tr key={feat.key} className="hover:bg-gray-50/70 transition-colors">
                                                    <td className="px-3.5 py-2.5 whitespace-nowrap">
                                                        <code className="text-gray-900 font-mono font-semibold bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded text-[11px]">
                                                            {feat.key}
                                                        </code>
                                                    </td>
                                                    <td className="px-3.5 py-2.5">
                                                        <div className="font-medium text-gray-900 text-xs">{feat.title}</div>
                                                        <div className="text-gray-400 font-mono text-[10px]">{feat.desc}</div>
                                                    </td>
                                                    <td className="px-3.5 py-2.5 whitespace-nowrap">
                                                        <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                                            isEnabled ? 'bg-gray-900 text-white border-gray-900' : 'bg-gray-100 text-gray-500 border-gray-200'
                                                        }`}>
                                                            {isEnabled ? 'ENABLED' : 'DISABLED'}
                                                        </span>
                                                    </td>
                                                    <td className="px-3.5 py-2.5 whitespace-nowrap text-right">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleFeature(feat.key)}
                                                            className={`px-3 py-1 rounded text-xs font-mono font-medium border transition-colors cursor-pointer ${
                                                                isEnabled
                                                                    ? 'bg-gray-900 hover:bg-black text-white border-gray-900'
                                                                    : 'bg-white hover:bg-gray-100 text-gray-700 border-gray-300'
                                                            }`}
                                                        >
                                                            {isEnabled ? 'Disable' : 'Enable'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* ========================================================= */}
                        {/* SECTION 3: DATA GENERATOR AND MOCK ACTIONS                */}
                        {/* ========================================================= */}
                        {activeDevSection === 'utils' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 font-mono text-xs">
                                
                                {[
                                    {
                                        cmd: 'seed:class_session',
                                        desc: 'Create mock class session 1 hour ahead for booking & reminder testing.',
                                        action: handleCreateMockClass,
                                        label: 'Run Action',
                                    },
                                    {
                                        cmd: 'seed:pt_session',
                                        desc: 'Create mock Personal Trainer session 45 minutes ahead with trainer.',
                                        action: handleCreateMockPt,
                                        label: 'Run Action',
                                    },
                                    {
                                        cmd: 'simulate:attendance',
                                        desc: 'Record a gym check-in log for current user to test attendance & streak.',
                                        action: handleMockAttendance,
                                        label: 'Run Action',
                                    },
                                    {
                                        cmd: 'extend:membership',
                                        desc: 'Extend current user active membership subscription by +30 days.',
                                        action: handleExtendMembership,
                                        label: 'Run Action',
                                    },
                                    {
                                        cmd: 'seed:pos_sale',
                                        desc: 'Generate 1 random completed POS transaction for chart & report testing.',
                                        action: handleMockSale,
                                        label: 'Run Action',
                                    },
                                    {
                                        cmd: 'seed:membership_trx',
                                        desc: 'Generate 1 paid membership subscription transaction for report metrics.',
                                        action: handleMockMembershipTrx,
                                        label: 'Run Action',
                                    },
                                    {
                                        cmd: 'seed:expense',
                                        desc: 'Generate 1 random gym operational expense record for net income testing.',
                                        action: handleMockExpense,
                                        label: 'Run Action',
                                    },
                                    {
                                        cmd: 'bulk:attendance',
                                        desc: 'Batch insert N attendance records to test weekly volume trends.',
                                        action: handleBulkAttendance,
                                        label: 'Prompt & Run',
                                    },
                                    {
                                        cmd: 'bulk:pos_sales',
                                        desc: 'Batch insert N POS sales to test multi-transaction revenue charts.',
                                        action: handleBulkSales,
                                        label: 'Prompt & Run',
                                    },
                                    {
                                        cmd: 'bulk:class_bookings',
                                        desc: 'Batch book N members into latest scheduled class to test capacity limits.',
                                        action: handleBulkClassBookings,
                                        label: 'Prompt & Run',
                                    },
                                    {
                                        cmd: 'clean:user_notifications',
                                        desc: 'Truncate all notification records belonging to the current user.',
                                        action: handleClearNotifications,
                                        label: 'Clear User Inbox',
                                        isDanger: false,
                                    },
                                    {
                                        cmd: 'clean:all_notifications',
                                        desc: 'Truncate all notifications globally across all users (destructive).',
                                        action: handleClearAllNotifications,
                                        label: 'Purge Global',
                                        isDanger: true,
                                    },
                                ].map((item) => (
                                    <div key={item.cmd} className={`border rounded-xl p-3 bg-white flex flex-col justify-between space-y-2.5 ${item.isDanger ? 'border-gray-300 bg-gray-50/50' : 'border-gray-200'}`}>
                                        <div className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <code className="text-gray-900 font-bold text-[11px] bg-gray-100 border border-gray-200 px-1.5 py-0.5 rounded">
                                                    {item.cmd}
                                                </code>
                                            </div>
                                            <p className="text-[11px] text-gray-500 font-sans leading-snug">
                                                {item.desc}
                                            </p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={item.action}
                                            className={`w-full py-1.5 text-xs font-mono font-medium rounded border transition-colors cursor-pointer active:scale-95 ${
                                                item.isDanger
                                                    ? 'bg-white hover:bg-gray-100 text-gray-800 border-gray-300'
                                                    : 'bg-gray-900 hover:bg-black text-white border-gray-900'
                                            }`}
                                        >
                                            {item.label}
                                        </button>
                                    </div>
                                ))}

                            </div>
                        )}

                        {/* ========================================================= */}
                        {/* SECTION 4: DIAGNOSTICS AND LOGS                           */}
                        {/* ========================================================= */}
                        {activeDevSection === 'health' && (
                            <div className="space-y-3 font-mono text-xs">
                                
                                {/* Diagnostic Summary Box */}
                                <div className="border border-gray-200 rounded-xl p-3.5 bg-white space-y-3">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
                                        <div>
                                            <h4 className="font-bold text-gray-900 text-xs">System Diagnostics</h4>
                                            <p className="text-[11px] text-gray-400 font-sans">Live runtime service configuration check</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={handleHealthCheck}
                                            className="px-3 py-1.5 bg-gray-900 hover:bg-black text-white text-xs font-mono font-medium rounded cursor-pointer self-start sm:self-auto"
                                        >
                                            Execute Live Connectivity Test
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                                        <div className="p-2 border border-gray-200 rounded bg-gray-50/60">
                                            <span className="text-gray-400 block text-[10px]">ENV / DEBUG</span>
                                            <span className="font-semibold text-gray-900">{devHealth.app_env} (debug={String(devHealth.app_debug)})</span>
                                        </div>
                                        <div className="p-2 border border-gray-200 rounded bg-gray-50/60">
                                            <span className="text-gray-400 block text-[10px]">QUEUE / CACHE</span>
                                            <span className="font-semibold text-gray-900">{devHealth.queue_driver} / {devHealth.cache_store}</span>
                                        </div>
                                        <div className="p-2 border border-gray-200 rounded bg-gray-50/60">
                                            <span className="text-gray-400 block text-[10px]">FIREBASE FCM V1</span>
                                            <span className="font-semibold text-gray-900">{devHealth.firebase_json_exists ? (devHealth.firebase_project_id || 'OK') : 'NOT_FOUND'}</span>
                                        </div>
                                        <div className="p-2 border border-gray-200 rounded bg-gray-50/60">
                                            <span className="text-gray-400 block text-[10px]">STORAGE RW</span>
                                            <span className="font-semibold text-gray-900">{devHealth.storage_writable ? 'WRITABLE' : 'READONLY'}</span>
                                        </div>
                                    </div>

                                    {devHealthLive && (
                                        <div className="p-3 rounded bg-gray-950 text-gray-200 text-xs font-mono border border-gray-800 space-y-1">
                                            <div className="text-gray-400 font-bold border-b border-gray-800 pb-1 mb-1">
                                                $ live_connectivity_results:
                                            </div>
                                            {Object.entries(devHealthLive).map(([k, v]) => (
                                                <div key={k} className="flex items-start gap-2">
                                                    <span className={`px-1 rounded text-[10px] ${v.ok ? 'bg-gray-800 text-gray-200' : 'bg-red-900/60 text-red-300'}`}>
                                                        {v.ok ? 'PASS' : 'FAIL'}
                                                    </span>
                                                    <span className="text-gray-400">{k}:</span>
                                                    <span className="text-gray-200 font-sans">{v.msg}</span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {devFcmPreview && (
                                        <div className="p-3 rounded bg-gray-950 text-gray-200 text-xs font-mono border border-gray-800 space-y-1">
                                            <div className="text-gray-400 font-bold border-b border-gray-800 pb-1 mb-1">
                                                $ fcm_payload_preview:
                                            </div>
                                            <pre className="whitespace-pre-wrap break-all text-[11px] text-gray-300">{JSON.stringify(devFcmPreview, null, 2)}</pre>
                                        </div>
                                    )}
                                </div>

                                {/* Recent Notification Database Logs Table */}
                                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white">
                                    <div className="bg-gray-50 border-b border-gray-200 px-3.5 py-2 flex items-center justify-between text-gray-500 font-mono text-[11px] uppercase">
                                        <span>Recent Notification DB Logs</span>
                                        <span>Total: {devStats.total_notifications || 0}</span>
                                    </div>

                                    {(!devStats.recent_notifications || devStats.recent_notifications.length === 0) ? (
                                        <div className="p-6 text-center text-gray-400 font-mono text-xs">
                                            // No notifications found in database.
                                        </div>
                                    ) : (
                                        <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto font-sans">
                                            {devStats.recent_notifications.map((n) => (
                                                <div key={n.id} className="px-3.5 py-2 flex items-center justify-between gap-3 text-xs hover:bg-gray-50/60 transition-colors">
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <span className="font-semibold text-gray-900 truncate">{n.title}</span>
                                                            <code className="text-[10px] font-mono bg-gray-100 border border-gray-200 px-1 py-0.2 rounded text-gray-600">{n.type}</code>
                                                        </div>
                                                        <p className="text-[11px] text-gray-500 truncate mt-0.5">{n.message}</p>
                                                        <p className="text-[10px] font-mono text-gray-400 mt-0.5">
                                                            user: {n.user?.name || 'system'} • {n.created_human} • {n.is_read ? 'read' : 'unread'}
                                                        </p>
                                                    </div>
                                                    <span className={`shrink-0 font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                                                        n.is_read ? 'bg-gray-100 text-gray-500 border-gray-200' : 'bg-gray-900 text-white border-gray-900'
                                                    }`}>
                                                        {n.is_read ? 'READ' : 'UNREAD'}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                    </div>
                )}

                {/* Owner Photo Crop Modal */}
                <ImageCropModal
                    isOpen={isOwnerCropModalOpen}
                    imageSrc={rawOwnerPhotoSrc}
                    onClose={() => setIsOwnerCropModalOpen(false)}
                    onCropComplete={handleOwnerCropComplete}
                    aspectRatio={1}
                    title="Choose Photo"
                />
            </div>
        </AdminLayout>
    );
}

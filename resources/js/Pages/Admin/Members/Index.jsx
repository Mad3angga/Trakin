import React, { useState, useEffect } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Pagination from '@/Components/Pagination';
import { UserPlus, Search, RefreshCw, Snowflake, X, Phone, Mail, Key, Pencil, Trash2, ChevronDown, Users, CheckCircle2, AlertCircle } from 'lucide-react';

export default function MembersIndex({ members, packages, branches, salesStaff = [], filters }) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [actionModalMember, setActionModalMember] = useState(null);

    const [renewModalMember, setRenewModalMember] = useState(null);
    const [freezeModalMember, setFreezeModalMember] = useState(null);
    const [resetModalMember, setResetModalMember] = useState(null);
    const [search, setSearch] = useState(filters.search || '');
    const [selectedStatus, setSelectedStatus] = useState(filters.status || '');

    const addForm = useForm({
        full_name: '', email: '', phone: '', password: '12345678', gender: 'male', date_of_birth: '', address: '',
        emergency_contact_name: '', emergency_contact_phone: '',
        package_id: packages[0]?.id || '',
        sold_by_id: '',
    });

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('open_register') === '1') {
            const pkgId = urlParams.get('package_id');
            if (pkgId) {
                addForm.setData('package_id', Number(pkgId));
            }
            setIsAddModalOpen(true);
        }
    }, []);

    const renewForm = useForm({ package_id: packages[0]?.id || 1, payment_method: 'qris' });
    const freezeForm = useForm({ freeze_days: 14, reason: 'Liburan / Perjalanan Dinas' });
    const resetForm = useForm({ password: '1234' });

    const handleSearch = (e, statusOverride = null) => {
        if (e) e.preventDefault();
        const statusToUse = statusOverride !== null ? statusOverride : selectedStatus;
        router.get('/members', { search, status: statusToUse }, { preserveState: true });
    };

    const submitAddMember = (e) => {
        e.preventDefault();
        addForm.post('/members', { onSuccess: () => { setIsAddModalOpen(false); addForm.reset(); } });
    };

    const submitRenew = (e) => {
        e.preventDefault();
        if (!renewModalMember) return;
        renewForm.post(`/members/${renewModalMember.id}/renew`, { onSuccess: () => setRenewModalMember(null) });
    };

    const submitFreeze = (e) => {
        e.preventDefault();
        if (!freezeModalMember) return;
        freezeForm.post(`/members/${freezeModalMember.id}/freeze`, { onSuccess: () => setFreezeModalMember(null) });
    };

    const submitResetPassword = (e) => {
        e.preventDefault();
        if (!resetModalMember) return;
        resetForm.post(`/members/${resetModalMember.id}/reset-password`, { onSuccess: () => setResetModalMember(null) });
    };

    const handleDeleteMember = (member) => {
        if (confirm(`Apakah Anda yakin ingin menghapus member ${member.full_name} (${member.member_code})?`)) {
            router.delete(`/members/${member.id}`);
        }
    };

    const formatIDR = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

    const inputClass = 'w-full px-3.5 py-2 border bg-gray-50 border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 bg-white';
    const selectClass = inputClass;

    const statusBadge = (status) => {
        const map = {
            active: 'bg-green-50 text-green-700 border-green-200',
            frozen: 'bg-blue-50 text-blue-700 border-blue-200',
            inactive: 'bg-red-50 text-red-700 border-red-200',
        };
        const labels = { active: 'Aktif', frozen: 'Frozen', inactive: 'Inaktif' };
        return <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${map[status] || map.inactive}`}>{labels[status] || status}</span>;
    };

    const getAvatarBg = (name) => {
        const colors = [
            'bg-blue-100 text-blue-700 border-blue-200',
            'bg-purple-100 text-purple-700 border-purple-200',
            'bg-emerald-100 text-emerald-700 border-emerald-200',
            'bg-amber-100 text-amber-700 border-amber-200',
            'bg-indigo-100 text-indigo-700 border-indigo-200',
        ];
        const index = (name.charCodeAt(0) + name.charCodeAt(name.length - 1)) % colors.length;
        return colors[index];
    };

    return (
        <AdminLayout title="Kelola Member">
            <Head title="Kelola Member Gym" />
            <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans antialiased text-gray-900">
                {/* Header Title & Top Summary Badges */}
                <div className="bg-white rounded-3xl border border-gray-100/80 shadow-xs p-5 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-base font-semibold text-gray-900">Kelola Keanggotaan Member</h2>
                            <p className="text-xs text-gray-500">Manajemen pendaftaran member baru, status paket gym, perpanjangan, serta pembekuan membership</p>
                        </div>

                        {/* Top Action Button */}
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-2xs self-start md:self-auto"
                        >
                            <UserPlus className="w-4 h-4" /> Registrasi Member Baru
                        </button>
                    </div>

                    {/* Search & Status Filters */}
                    <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                        <form onSubmit={handleSearch} className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto flex-1">
                            <div className="relative flex-1 min-w-[240px] max-w-md">
                                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                                <input
                                    type="text"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Cari nama, kode member, no. hp, email..."
                                    className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-blue-500 bg-white"
                                />
                            </div>

                            {/* Pill Filter: Status Member */}
                            <div className="relative inline-flex items-center bg-white border border-gray-200 hover:border-gray-300 rounded-full px-3.5 py-1.5 shadow-2xs transition-all cursor-pointer">
                                <span className="text-xs font-bold text-gray-900 mr-1.5">Status:</span>
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setSelectedStatus(val);
                                        handleSearch(null, val);
                                    }}
                                    className="bg-transparent text-xs text-gray-600 font-medium focus:outline-none cursor-pointer pr-5 appearance-none"
                                >
                                    <option value="">Semua Status</option>
                                    <option value="active">Aktif</option>
                                    <option value="inactive">Inaktif</option>
                                    <option value="frozen">Frozen</option>
                                </select>
                                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-3 pointer-events-none" />
                            </div>

                            <button type="submit" className="px-3.5 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-xs font-semibold transition-colors">
                                Cari
                            </button>
                        </form>

                        <div className="text-xs text-gray-500 font-medium">
                            Total: <span className="font-bold text-gray-900">{members.total || members.data?.length || 0}</span> Member
                        </div>
                    </div>
                </div>

                {/* Table Data Member */}
                <div className="bg-white rounded-3xl border border-gray-100/80 shadow-xs overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50/50 text-[11px] font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                                <tr>
                                    <th className="px-4 py-3.5">Member</th>
                                    <th className="px-4 py-3.5">Kontak</th>
                                    <th className="px-4 py-3.5">Paket Active</th>
                                    <th className="px-4 py-3.5">Berlaku s/d</th>
                                    <th className="px-4 py-3.5">Status</th>
                                    <th className="px-4 py-3.5 text-right">Aksi Kelola</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {members.data.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="px-4 py-12 text-center text-gray-400 text-xs">
                                            Tidak ditemukan data member yang sesuai filter.
                                        </td>
                                    </tr>
                                ) : (
                                    members.data.map((m) => {
                                        const activeSub = m.active_subscription;
                                        return (
                                            <tr key={m.id} className="hover:bg-gray-50/70 transition-colors">
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-9 h-9 rounded-full border flex items-center justify-center text-xs font-bold ${getAvatarBg(m.full_name)}`}>
                                                            {m.full_name.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900 text-xs">{m.full_name}</p>
                                                            <p className="text-[11px] font-mono text-gray-500 mt-0.5">{m.member_code}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <p className="text-xs text-gray-700 flex items-center gap-1.5 font-medium">
                                                        <Phone className="w-3 h-3 text-gray-400" />
                                                        {m.phone}
                                                    </p>
                                                    {m.email && (
                                                        <p className="text-[11px] text-gray-400 flex items-center gap-1.5 mt-0.5">
                                                            <Mail className="w-3 h-3 text-gray-400" />
                                                            {m.email}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    {activeSub ? (
                                                        <span className="text-xs font-semibold text-gray-900">{activeSub.package?.name}</span>
                                                    ) : (
                                                        <span className="text-xs text-gray-400">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3.5 text-xs text-gray-600 font-medium">
                                                    {activeSub ? activeSub.end_date : '—'}
                                                </td>
                                                <td className="px-4 py-3.5">{statusBadge(m.status)}</td>
                                                <td className="px-4 py-3.5 text-right whitespace-nowrap">
                                                    <div className="inline-flex items-center gap-1">
                                                        {/* Quick Action: Perpanjang */}
                                                        <button
                                                            onClick={() => setRenewModalMember(m)}
                                                            className="p-1.5 text-green-700 hover:bg-green-50 border border-gray-200 hover:border-green-300 rounded-xl transition-colors"
                                                            title="Perpanjang Membership"
                                                        >
                                                            <RefreshCw className="w-3.5 h-3.5" />
                                                        </button>

                                                        {/* Quick Action: Freeze */}
                                                        {m.status === 'active' && (
                                                            <button
                                                                onClick={() => setFreezeModalMember(m)}
                                                                className="p-1.5 text-blue-700 hover:bg-blue-50 border border-gray-200 hover:border-blue-300 rounded-xl transition-colors"
                                                                title="Freeze Pembekuan Membership"
                                                            >
                                                                <Snowflake className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}

                                                        {/* Quick Action: Reset Password */}
                                                        <button
                                                            onClick={() => { setResetModalMember(m); resetForm.setData('password', '1234'); }}
                                                            className="p-1.5 text-amber-700 hover:bg-amber-50 border border-gray-200 hover:border-amber-300 rounded-xl transition-colors"
                                                            title="Reset Password Akses"
                                                        >
                                                            <Key className="w-3.5 h-3.5" />
                                                        </button>

                                                        {/* Delete Action */}
                                                        <button
                                                            onClick={() => handleDeleteMember(m)}
                                                            className="p-1.5 text-red-600 hover:bg-red-50 border border-gray-200 hover:border-red-300 rounded-xl transition-colors"
                                                            title="Hapus Member"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination paginator={members} preserveScroll preserveState />
                </div>

                {/* Modal: Single Combined Action Menu (Pencil Trigger) */}
                {actionModalMember && (
                    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-md rounded-2xl shadow-xl relative p-5 space-y-4 border border-gray-100">
                            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                                <div>
                                    <h3 className="text-base font-semibold text-gray-900">Kelola Data Member</h3>
                                    <p className="text-xs text-gray-500">{actionModalMember.full_name} ({actionModalMember.member_code})</p>
                                </div>
                                <button onClick={() => setActionModalMember(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-xl hover:bg-gray-100"><X className="w-5 h-5" /></button>
                            </div>

                            <div className="space-y-2">
                                <button
                                    onClick={() => { setRenewModalMember(actionModalMember); setActionModalMember(null); }}
                                    className="w-full p-3 bg-green-50 hover:bg-green-100 border border-green-200 text-green-800 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors"
                                >
                                    <span className="flex items-center gap-2">
                                        <RefreshCw className="w-4 h-4 text-green-600" /> Perpanjang Membership
                                    </span>
                                    <span className="text-[10px] text-green-600 font-normal">Tambah durasi</span>
                                </button>

                                {actionModalMember.status === 'active' && (
                                    <button
                                        onClick={() => { setFreezeModalMember(actionModalMember); setActionModalMember(null); }}
                                        className="w-full p-3 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-800 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors"
                                    >
                                        <span className="flex items-center gap-2">
                                            <Snowflake className="w-4 h-4 text-blue-600" /> Freeze Membership
                                        </span>
                                        <span className="text-[10px] text-blue-600 font-normal">Bekukan sementara</span>
                                    </button>
                                )}

                                <button
                                    onClick={() => { setResetModalMember(actionModalMember); resetForm.setData('password', '1234'); setActionModalMember(null); }}
                                    className="w-full p-3 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors"
                                >
                                    <span className="flex items-center gap-2">
                                        <Key className="w-4 h-4 text-amber-600" /> Reset Password Akses
                                    </span>
                                    <span className="text-[10px] text-amber-600 font-normal">Atur ulang sandi (Default: 1234)</span>
                                </button>

                                <button
                                    onClick={() => { handleDeleteMember(actionModalMember); setActionModalMember(null); }}
                                    className="w-full p-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors"
                                >
                                    <span className="flex items-center gap-2">
                                        <Trash2 className="w-4 h-4 text-red-600" /> Hapus Member
                                    </span>
                                    <span className="text-[10px] text-red-600 font-normal">Hapus permanen</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal: Add member */}
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl relative max-h-[90vh] overflow-y-auto border border-gray-100">
                            <div className="flex items-center justify-between p-5 border-b border-gray-200">
                                <div>
                                    <h3 className="text-base font-semibold text-gray-900">Registrasi Member Baru</h3>
                                    <p className="text-xs text-gray-500">Isi formulir pendaftaran keanggotaan gym baru</p>
                                </div>
                                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-xl hover:bg-gray-100"><X className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={submitAddMember} className="p-5 space-y-4">
                                {Object.keys(addForm.errors).length > 0 && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                                        <p className="font-bold mb-1">Gagal Menyimpan Member:</p>
                                        <ul className="list-disc list-inside space-y-0.5">
                                            {Object.values(addForm.errors).map((err, idx) => (
                                                <li key={idx}>{err}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Lengkap *</label>
                                        <input type="text" value={addForm.data.full_name} onChange={(e) => addForm.setData('full_name', e.target.value)} className={inputClass} required placeholder="Contoh: Budi Santoso" />
                                        {addForm.errors.full_name && <p className="text-xs text-red-600 mt-1">{addForm.errors.full_name}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">No. HP *</label>
                                        <input type="text" value={addForm.data.phone} onChange={(e) => addForm.setData('phone', e.target.value)} className={inputClass} required placeholder="08123456789" />
                                        {addForm.errors.phone && <p className="text-xs text-red-600 mt-1">{addForm.errors.phone}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Email (Opsional)</label>
                                        <input type="email" value={addForm.data.email} onChange={(e) => addForm.setData('email', e.target.value)} className={inputClass} placeholder="budi@example.com" />
                                        {addForm.errors.email && <p className="text-xs text-red-600 mt-1">{addForm.errors.email}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Password Akses Member *</label>
                                        <input type="text" value={addForm.data.password} onChange={(e) => addForm.setData('password', e.target.value)} className={inputClass} placeholder="Default: 12345678" required />
                                        {addForm.errors.password && <p className="text-xs text-red-600 mt-1">{addForm.errors.password}</p>}
                                        <p className="text-[10px] text-gray-400 mt-1">Default password login: <strong>12345678</strong></p>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Jenis Kelamin</label>
                                        <select value={addForm.data.gender} onChange={(e) => addForm.setData('gender', e.target.value)} className={selectClass}>
                                            <option value="male">Laki-laki</option>
                                            <option value="female">Perempuan</option>
                                        </select>
                                        {addForm.errors.gender && <p className="text-xs text-red-600 mt-1">{addForm.errors.gender}</p>}
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Pilihan Paket Membership</label>
                                        <select value={addForm.data.package_id} onChange={(e) => addForm.setData('package_id', e.target.value)} className={selectClass}>
                                            <option value="">-- Pilih Paket (Akan Dilanjutkan di POS) --</option>
                                            {packages.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.duration_days} Hari) — {formatIDR(p.price)}</option>)}
                                        </select>
                                        {addForm.errors.package_id && <p className="text-xs text-red-600 mt-1">{addForm.errors.package_id}</p>}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Komisi Penjualan (Sales / PT)</label>
                                        <select value={addForm.data.sold_by_id} onChange={(e) => addForm.setData('sold_by_id', e.target.value)} className={selectClass}>
                                            <option value="">-- Tanpa Komisi / Ditangani Kasir --</option>
                                            {salesStaff.map((s) => (
                                                <option key={s.id} value={s.id}>{s.name} — {s.role || 'Staff'}</option>
                                            ))}
                                        </select>
                                        {addForm.errors.sold_by_id && <p className="text-xs text-red-600 mt-1">{addForm.errors.sold_by_id}</p>}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Alamat Lengkap</label>
                                    <textarea value={addForm.data.address} onChange={(e) => addForm.setData('address', e.target.value)} rows="2" className={inputClass} placeholder="Alamat domisili member..." />
                                </div>
                                <div className="pt-4 border-t border-gray-200 flex justify-end gap-2">
                                    <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">Batal</button>
                                    <button type="submit" disabled={addForm.processing} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl disabled:opacity-50 transition-colors shadow-2xs">Simpan Member</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal: Renew */}
                {renewModalMember && (
                    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-gray-100">
                            <div className="flex items-center justify-between p-5 border-b border-gray-200">
                                <div>
                                    <h3 className="text-base font-semibold text-gray-900">Perpanjang Membership</h3>
                                    <p className="text-xs text-gray-500">{renewModalMember.full_name} ({renewModalMember.member_code})</p>
                                </div>
                                <button onClick={() => setRenewModalMember(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-xl hover:bg-gray-100"><X className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={submitRenew} className="p-5 space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Pilih Paket Membership</label>
                                    <select value={renewForm.data.package_id} onChange={(e) => renewForm.setData('package_id', e.target.value)} className={selectClass}>
                                        {packages.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.duration_days} Hari) — {formatIDR(p.price)}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Metode Pembayaran</label>
                                    <select value={renewForm.data.payment_method} onChange={(e) => renewForm.setData('payment_method', e.target.value)} className={selectClass}>
                                        <option value="cash">Tunai</option><option value="qris">QRIS / Transfer</option><option value="debit">Kartu Debit / Kredit</option>
                                    </select>
                                </div>
                                <div className="pt-4 border-t border-gray-200 flex justify-end gap-2">
                                    <button type="button" onClick={() => setRenewModalMember(null)} className="px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">Batal</button>
                                    <button type="submit" disabled={renewForm.processing} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl disabled:opacity-50 transition-colors shadow-2xs">Perpanjang Sekarang</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal: Freeze */}
                {freezeModalMember && (
                    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-gray-100">
                            <div className="flex items-center justify-between p-5 border-b border-gray-200">
                                <div>
                                    <h3 className="text-base font-semibold text-gray-900">Freeze Membership</h3>
                                    <p className="text-xs text-gray-500">{freezeModalMember.full_name} ({freezeModalMember.member_code})</p>
                                </div>
                                <button onClick={() => setFreezeModalMember(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-xl hover:bg-gray-100"><X className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={submitFreeze} className="p-5 space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Durasi Pembekuan (Hari)</label>
                                    <input type="number" value={freezeForm.data.freeze_days} onChange={(e) => freezeForm.setData('freeze_days', e.target.value)} min="1" max="90" className={inputClass} required />
                                    <p className="text-[11px] text-gray-400 mt-1">Masa aktif membership akan diperpanjang otomatis sesuai durasi pembekuan.</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Alasan Pembekuan</label>
                                    <input type="text" value={freezeForm.data.reason} onChange={(e) => freezeForm.setData('reason', e.target.value)} className={inputClass} placeholder="Contoh: Liburan / Sakit" required />
                                </div>
                                <div className="pt-4 border-t border-gray-200 flex justify-end gap-2">
                                    <button type="button" onClick={() => setFreezeModalMember(null)} className="px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">Batal</button>
                                    <button type="submit" disabled={freezeForm.processing} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl disabled:opacity-50 transition-colors shadow-2xs">Bekukan Membership</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal: Reset Password */}
                {resetModalMember && (
                    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-gray-100">
                            <div className="flex items-center justify-between p-5 border-b border-gray-200">
                                <div>
                                    <h3 className="text-base font-semibold text-gray-900">Reset Password Member</h3>
                                    <p className="text-xs text-gray-500">{resetModalMember.full_name} ({resetModalMember.member_code})</p>
                                </div>
                                <button onClick={() => setResetModalMember(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-xl hover:bg-gray-100"><X className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={submitResetPassword} className="p-5 space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Password Baru Member *</label>
                                    <input
                                        type="text"
                                        value={resetForm.data.password}
                                        onChange={(e) => resetForm.setData('password', e.target.value)}
                                        className={inputClass}
                                        placeholder="1234"
                                        required
                                    />
                                    <p className="text-[11px] text-gray-400 mt-1">Default reset password: <strong>1234</strong></p>
                                </div>
                                <div className="pt-4 border-t border-gray-200 flex justify-end gap-2">
                                    <button type="button" onClick={() => setResetModalMember(null)} className="px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-xl transition-colors">Batal</button>
                                    <button type="submit" disabled={resetForm.processing} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl disabled:opacity-50 transition-colors shadow-2xs">Simpan Password Baru</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

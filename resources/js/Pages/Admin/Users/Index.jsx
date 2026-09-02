import React, { useState, useMemo } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import {
    UserPlus,
    X,
    Edit3,
    Mail,
    Phone,
    Trash2,
    AlertTriangle,
    Shield,
    Crown,
    Briefcase,
    TrendingUp,
    Dumbbell,
    UserCheck,
    Search,
    Check,
    Users as UsersIcon,
    Building2,
} from 'lucide-react';

export default function UsersIndex({ users = [], roles = [], branches = [] }) {
    const { auth } = usePage().props;
    const currentUserId = auth?.user?.id;

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editRoleUser, setEditRoleUser] = useState(null);
    const [deleteUser, setDeleteUser] = useState(null);
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'management', 'staff'
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRoleFilter, setSelectedRoleFilter] = useState('');

    const addForm = useForm({
        name: '',
        email: '',
        password: '',
        phone: '',
        branch_id: branches[0]?.id || 1,
        role: 'Front Desk',
    });

    const roleForm = useForm({
        role: 'Front Desk',
    });

    const deleteForm = useForm({});

    const submitAddUser = (e) => {
        e.preventDefault();
        addForm.post('/users', {
            onSuccess: () => {
                setIsAddModalOpen(false);
                addForm.reset();
            },
        });
    };

    const submitUpdateRole = (e) => {
        e.preventDefault();
        if (!editRoleUser) return;
        roleForm.put(`/users/${editRoleUser.id}/role`, {
            onSuccess: () => {
                setEditRoleUser(null);
            },
        });
    };

    const submitDeleteUser = (e) => {
        e.preventDefault();
        if (!deleteUser) return;
        deleteForm.delete(`/users/${deleteUser.id}`, {
            onSuccess: () => {
                setDeleteUser(null);
            },
        });
    };

    const openEditRole = (u) => {
        setEditRoleUser(u);
        const rName = u.roles?.[0]?.name || u.role_name || 'Front Desk';
        roleForm.setData('role', rName);
    };

    // Role definitions with metadata
    const roleMetaMap = {
        Owner: {
            name: 'Owner',
            category: 'management',
            categoryLabel: 'Manajemen',
            displayLabel: 'Owner',
            icon: Crown,
            badgeClass: 'bg-purple-50 text-purple-700 border-purple-200',
            bgIcon: 'text-purple-600',
            description: 'Pemilik Gym. Hak akses tertinggi mencakup manajemen staf, laporan finansial, analitik, dan pengaturan sistem.',
            permissions: ['Akses Penuh Semua Modul', 'Kelola Akun Staf & Role', 'Laporan Keuangan & Pengeluaran', 'AI Assistant & Dev Mode'],
        },
        Manager: {
            name: 'Manager',
            category: 'management',
            categoryLabel: 'Manajemen',
            displayLabel: 'Manager',
            icon: Briefcase,
            badgeClass: 'bg-indigo-50 text-indigo-700 border-indigo-200',
            bgIcon: 'text-indigo-600',
            description: 'Pengelola Operasional. Hak akses operasional lengkap untuk paket gym, inventori, laporan, dan kelas.',
            permissions: ['Laporan & Statistik Bisnis', 'Inventori Produk & POS', 'Kelola Paket Gym & PT', 'Manajemen Kelas & Trainer'],
        },
        Sales: {
            name: 'Sales',
            category: 'staff',
            categoryLabel: 'Staf Operasional',
            displayLabel: 'Staff (Sales)',
            icon: TrendingUp,
            badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
            bgIcon: 'text-emerald-600',
            description: 'Staf Penjualan. Khusus penanganan pendaftaran member, penjualan paket & ritel POS, dan target penjualan.',
            permissions: ['Registrasi Member Baru', 'POS Kasir Ritel & Paket', 'Tracking Member & Penjualan', 'Jadwal Sesi PT'],
        },
        'Front Desk': {
            name: 'Front Desk',
            category: 'staff',
            categoryLabel: 'Staf Operasional',
            displayLabel: 'Staff (Front Desk)',
            icon: UserCheck,
            badgeClass: 'bg-blue-50 text-blue-700 border-blue-200',
            bgIcon: 'text-blue-600',
            description: 'Staf Resepsionis / Kasir. Akses operasional meja depan, check-in kiosk kehadiran, dan kasir harian.',
            permissions: ['Kiosk QR Check-In Kehadiran', 'POS Kasir Ritel & Paket', 'Registrasi & Data Member', 'Kehadiran Harian'],
        },
        Trainer: {
            name: 'Trainer',
            category: 'staff',
            categoryLabel: 'Staf Operasional',
            displayLabel: 'Staff (Trainer)',
            icon: Dumbbell,
            badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
            bgIcon: 'text-amber-600',
            description: 'Staf Instruktur & Pelatih. Akses ke jadwal booking sesi PT personal, kelas latihan, dan log kehadiran.',
            permissions: ['Jadwal Kalender Sesi PT', 'Manajemen Kelas & Booking', 'Log Kehadiran Sesi', 'Profil Coach Pelatih'],
        },
    };

    const getRoleMeta = (roleName) => {
        return roleMetaMap[roleName] || {
            name: roleName,
            category: 'staff',
            categoryLabel: 'Staf Operasional',
            displayLabel: `Staff (${roleName})`,
            icon: Shield,
            badgeClass: 'bg-gray-100 text-gray-700 border-gray-200',
            bgIcon: 'text-gray-600',
            description: 'Staf operasional gym.',
            permissions: ['Akses Operasional'],
        };
    };

    // Calculate counts
    const counts = useMemo(() => {
        let total = users.length;
        let management = 0;
        let staff = 0;

        users.forEach((u) => {
            const rName = u.roles?.[0]?.name || u.role_name || '';
            if (['Owner', 'Manager'].includes(rName)) {
                management++;
            } else {
                staff++;
            }
        });

        return { total, management, staff };
    }, [users]);

    // Filter users based on tab, search query, and specific role filter
    const filteredUsers = useMemo(() => {
        return users.filter((u) => {
            const rName = u.roles?.[0]?.name || u.role_name || '';
            const isManagement = ['Owner', 'Manager'].includes(rName);

            if (activeTab === 'management' && !isManagement) return false;
            if (activeTab === 'staff' && isManagement) return false;

            if (selectedRoleFilter && rName !== selectedRoleFilter) return false;

            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const matchName = u.name?.toLowerCase().includes(q);
                const matchEmail = u.email?.toLowerCase().includes(q);
                const matchPhone = u.phone?.toLowerCase().includes(q);
                const matchRole = rName.toLowerCase().includes(q);
                const matchBranch = u.branch?.name?.toLowerCase().includes(q);
                if (!matchName && !matchEmail && !matchPhone && !matchRole && !matchBranch) return false;
            }

            return true;
        });
    }, [users, activeTab, selectedRoleFilter, searchQuery]);

    const inputClass = 'w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all';
    const selectClass = 'w-full px-3.5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer';

    return (
        <AdminLayout title="Manajemen Staf & Hak Akses Role">
            <Head title="Manajemen Staf & Role" />

            <div className="space-y-6 max-w-7xl mx-auto pb-10">
                {/* Top Action Bar */}
                <div className="flex justify-end">
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
                    >
                        <UserPlus className="w-4 h-4" /> Tambah Staf Baru
                    </button>
                </div>

                {/* Stat Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white p-4 rounded-2xl border border-gray-100/80 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 font-medium">Total Akun Sistem</p>
                            <h3 className="text-xl font-bold text-gray-900 mt-0.5">{counts.total} <span className="text-xs font-normal text-gray-400">Pengguna</span></h3>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                            <UsersIcon className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-gray-100/80 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 font-medium">Manajemen</p>
                            <h3 className="text-xl font-bold text-purple-900 mt-0.5">{counts.management} <span className="text-xs font-normal text-gray-400">Owner & Manager</span></h3>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
                            <Crown className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="bg-white p-4 rounded-2xl border border-gray-100/80 shadow-xs flex items-center justify-between">
                        <div>
                            <p className="text-xs text-gray-500 font-medium">Staf Operasional</p>
                            <h3 className="text-xl font-bold text-emerald-900 mt-0.5">{counts.staff} <span className="text-xs font-normal text-gray-400">Sales, Trainer, Front Desk</span></h3>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                    </div>
                </div>

                {/* Main Filter & Table Card */}
                <div className="bg-white rounded-3xl border border-gray-100/80 shadow-xs overflow-hidden">
                    {/* Filter Controls Bar */}
                    <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row items-center justify-between gap-3">
                        {/* Tab Pills */}
                        <div className="flex items-center gap-1.5 p-1 bg-gray-100/80 rounded-xl w-full sm:w-auto">
                            <button
                                type="button"
                                onClick={() => { setActiveTab('all'); setSelectedRoleFilter(''); }}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                                    activeTab === 'all' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
                                }`}
                            >
                                Semua ({counts.total})
                            </button>
                            <button
                                type="button"
                                onClick={() => { setActiveTab('management'); setSelectedRoleFilter(''); }}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                                    activeTab === 'management' ? 'bg-white text-purple-700 shadow-xs font-bold' : 'text-gray-500 hover:text-purple-700'
                                }`}
                            >
                                <Crown className="w-3.5 h-3.5" /> Manajemen ({counts.management})
                            </button>
                            <button
                                type="button"
                                onClick={() => { setActiveTab('staff'); setSelectedRoleFilter(''); }}
                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                                    activeTab === 'staff' ? 'bg-white text-emerald-700 shadow-xs font-bold' : 'text-gray-500 hover:text-emerald-700'
                                }`}
                            >
                                <TrendingUp className="w-3.5 h-3.5" /> Staf ({counts.staff})
                            </button>
                        </div>

                        {/* Search & Role Specific Filter */}
                        <div className="flex items-center gap-2.5 w-full md:w-auto">
                            <div className="relative flex-1 md:w-60">
                                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Cari nama, email, no hp..."
                                    className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                            </div>

                            <select
                                value={selectedRoleFilter}
                                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 font-medium focus:outline-none cursor-pointer"
                            >
                                <option value="">Filter Role</option>
                                <optgroup label="Manajemen">
                                    <option value="Owner">Owner</option>
                                    <option value="Manager">Manager</option>
                                </optgroup>
                                <optgroup label="Staf Operasional">
                                    <option value="Sales">Sales</option>
                                    <option value="Front Desk">Front Desk</option>
                                    <option value="Trainer">Trainer</option>
                                </optgroup>
                            </select>
                        </div>
                    </div>

                    {/* Table Users */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50/60 text-[11px] font-bold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                                <tr>
                                    <th className="px-5 py-3.5">Nama & Profil Staf</th>
                                    <th className="px-5 py-3.5">Kontak</th>
                                    <th className="px-5 py-3.5">Cabang Gym</th>
                                    <th className="px-5 py-3.5">Kategori & Role</th>
                                    <th className="px-5 py-3.5 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-5 py-10 text-center text-xs text-gray-400">
                                            Tidak ada akun pengguna staf yang sesuai dengan kriteria filter.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredUsers.map((u) => {
                                        const currentRoleName = u.roles?.[0]?.name || u.role_name || 'Front Desk';
                                        const meta = getRoleMeta(currentRoleName);
                                        const RoleIcon = meta.icon;
                                        const isSelf = u.id === currentUserId;

                                        return (
                                            <tr key={u.id} className="hover:bg-gray-50/80 transition-colors">
                                                <td className="px-5 py-3.5">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-full overflow-hidden border border-gray-200 bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-700 shrink-0">
                                                            {u.photo ? (
                                                                <img src={u.photo} alt={u.name} className="w-full h-full object-cover" />
                                                            ) : (
                                                                u.name.substring(0, 2).toUpperCase()
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-900 text-xs flex items-center gap-1.5">
                                                                {u.name}
                                                                {isSelf && (
                                                                    <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.2 rounded-full border border-blue-200 font-bold">
                                                                        Akun Anda
                                                                    </span>
                                                                )}
                                                            </p>
                                                            <p className="text-[11px] text-gray-400 font-mono mt-0.5">ID: #{u.id}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 text-xs text-gray-600">
                                                    <div className="space-y-0.5">
                                                        <p className="flex items-center gap-1.5">
                                                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                                                            <span>{u.email}</span>
                                                        </p>
                                                        {u.phone && (
                                                            <p className="flex items-center gap-1.5 text-[11px] text-gray-500">
                                                                <Phone className="w-3 h-3 text-gray-400" />
                                                                <span>{u.phone}</span>
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 text-xs text-gray-700 font-medium">
                                                    <div className="flex items-center gap-1.5">
                                                        <Building2 className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                        <span>{u.branch?.name || 'Semua Cabang'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <div className="flex flex-col gap-1 items-start">
                                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${meta.badgeClass} shadow-2xs`}>
                                                            <RoleIcon className="w-3.5 h-3.5" />
                                                            <span>{meta.displayLabel}</span>
                                                        </span>
                                                        <span className="text-[10px] text-gray-400 ml-1">
                                                            {meta.categoryLabel}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 text-right">
                                                    <div className="inline-flex items-center gap-1.5">
                                                        <button
                                                            onClick={() => openEditRole(u)}
                                                            className="w-8 h-8 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 flex items-center justify-center transition-colors cursor-pointer"
                                                            title="Ubah Role"
                                                        >
                                                            <Edit3 className="w-4 h-4" />
                                                        </button>
                                                        {!isSelf && (
                                                            <button
                                                                onClick={() => setDeleteUser(u)}
                                                                className="w-8 h-8 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 flex items-center justify-center transition-colors cursor-pointer"
                                                                title="Hapus Akun"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* MODAL: TAMBAH STAF BARU */}
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-lg rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
                                <div>
                                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                        <UserPlus className="w-4 h-4 text-blue-600" /> Tambah Staf Baru
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-0.5">Buat akun untuk manajemen atau staf operasional gym</p>
                                </div>
                                <button
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={submitAddUser} className="p-5 space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Lengkap Staf *</label>
                                    <input
                                        type="text"
                                        value={addForm.data.name}
                                        onChange={(e) => addForm.setData('name', e.target.value)}
                                        className={inputClass}
                                        placeholder="Contoh: Budi Santoso"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Email Akun *</label>
                                        <input
                                            type="email"
                                            value={addForm.data.email}
                                            onChange={(e) => addForm.setData('email', e.target.value)}
                                            className={inputClass}
                                            placeholder="budi@trakin.com"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Password Baru *</label>
                                        <input
                                            type="password"
                                            value={addForm.data.password}
                                            onChange={(e) => addForm.setData('password', e.target.value)}
                                            className={inputClass}
                                            placeholder="Min. 8 karakter"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">No. WhatsApp / HP</label>
                                        <input
                                            type="text"
                                            value={addForm.data.phone}
                                            onChange={(e) => addForm.setData('phone', e.target.value)}
                                            className={inputClass}
                                            placeholder="081234567890"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Penugasan Cabang *</label>
                                        <select
                                            value={addForm.data.branch_id}
                                            onChange={(e) => addForm.setData('branch_id', e.target.value)}
                                            className={selectClass}
                                        >
                                            {branches.map((b) => (
                                                <option key={b.id} value={b.id}>{b.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Pilih Hak Akses Role *</label>
                                    <select
                                        value={addForm.data.role}
                                        onChange={(e) => addForm.setData('role', e.target.value)}
                                        className={selectClass}
                                    >
                                        <optgroup label="Manajemen">
                                            <option value="Owner">Owner</option>
                                            <option value="Manager">Manager</option>
                                        </optgroup>
                                        <optgroup label="Staf Operasional">
                                            <option value="Sales">Sales</option>
                                            <option value="Front Desk">Front Desk</option>
                                            <option value="Trainer">Trainer</option>
                                        </optgroup>
                                    </select>
                                </div>

                                {/* Interactive Role Description Preview */}
                                {(() => {
                                    const meta = getRoleMeta(addForm.data.role);
                                    const RoleIcon = meta.icon;
                                    return (
                                        <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-2 text-xs">
                                            <div className="flex items-center gap-2 font-bold text-gray-900">
                                                <RoleIcon className={`w-4 h-4 ${meta.bgIcon}`} />
                                                <span>{meta.displayLabel}</span>
                                                <span className="text-[10px] text-gray-400 font-normal">({meta.categoryLabel})</span>
                                            </div>
                                            <p className="text-[11px] text-gray-600">{meta.description}</p>
                                            <div className="flex flex-wrap gap-1.5 pt-1">
                                                {meta.permissions.map((p, idx) => (
                                                    <span key={idx} className="inline-flex items-center gap-1 text-[10px] bg-white border border-gray-200 px-2 py-0.5 rounded-md text-gray-700 font-medium">
                                                        <Check className="w-2.5 h-2.5 text-emerald-600" /> {p}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}

                                <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={addForm.processing}
                                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold rounded-xl disabled:opacity-50 transition-all cursor-pointer shadow-xs"
                                    >
                                        {addForm.processing ? 'Menyimpan...' : 'Simpan Akun Staf'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL: UBAH ROLE STAF */}
                {editRoleUser && (
                    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-md rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                            <div className="flex items-center justify-between p-5 border-b border-gray-100 bg-gray-50/50">
                                <div>
                                    <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                        <Edit3 className="w-4 h-4 text-blue-600" /> Ubah Role Staf
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-0.5">{editRoleUser.name} ({editRoleUser.email})</p>
                                </div>
                                <button
                                    onClick={() => setEditRoleUser(null)}
                                    className="text-gray-400 hover:text-gray-600 p-1.5 rounded-xl hover:bg-gray-100 transition-colors cursor-pointer"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={submitUpdateRole} className="p-5 space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Pilih Role Baru *</label>
                                    <select
                                        value={roleForm.data.role}
                                        onChange={(e) => roleForm.setData('role', e.target.value)}
                                        className={selectClass}
                                    >
                                        <optgroup label="Manajemen">
                                            <option value="Owner">Owner</option>
                                            <option value="Manager">Manager</option>
                                        </optgroup>
                                        <optgroup label="Staf Operasional">
                                            <option value="Sales">Sales</option>
                                            <option value="Front Desk">Front Desk</option>
                                            <option value="Trainer">Trainer</option>
                                        </optgroup>
                                    </select>
                                </div>

                                {/* Interactive Role Description Preview */}
                                {(() => {
                                    const meta = getRoleMeta(roleForm.data.role);
                                    const RoleIcon = meta.icon;
                                    return (
                                        <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-2 text-xs">
                                            <div className="flex items-center gap-2 font-bold text-gray-900">
                                                <RoleIcon className={`w-4 h-4 ${meta.bgIcon}`} />
                                                <span>{meta.displayLabel}</span>
                                                <span className="text-[10px] text-gray-400 font-normal">({meta.categoryLabel})</span>
                                            </div>
                                            <p className="text-[11px] text-gray-600">{meta.description}</p>
                                            <div className="flex flex-wrap gap-1.5 pt-1">
                                                {meta.permissions.map((p, idx) => (
                                                    <span key={idx} className="inline-flex items-center gap-1 text-[10px] bg-white border border-gray-200 px-2 py-0.5 rounded-md text-gray-700 font-medium">
                                                        <Check className="w-2.5 h-2.5 text-emerald-600" /> {p}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })()}

                                <div className="pt-4 border-t border-gray-100 flex justify-end gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setEditRoleUser(null)}
                                        className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={roleForm.processing}
                                        className="px-5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold rounded-xl disabled:opacity-50 transition-all cursor-pointer shadow-xs"
                                    >
                                        {roleForm.processing ? 'Menyimpan...' : 'Simpan Perubahan Role'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL: HAPUS STAF */}
                {deleteUser && (
                    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-md rounded-3xl shadow-xl border border-gray-100 p-6 space-y-4">
                            <div className="flex items-center gap-3 text-rose-600">
                                <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                                    <AlertTriangle className="w-5 h-5 text-rose-600" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900">Hapus Akun Staf</h3>
                                    <p className="text-xs text-gray-500">Tindakan ini tidak dapat dibatalkan</p>
                                </div>
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed">
                                Apakah Anda yakin ingin menghapus akun staf <strong>{deleteUser.name}</strong> ({deleteUser.email})? Akun ini tidak akan dapat login lagi ke sistem.
                            </p>
                            <form onSubmit={submitDeleteUser} className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setDeleteUser(null)}
                                    className="px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={deleteForm.processing}
                                    className="px-5 py-2 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white text-xs font-semibold rounded-xl disabled:opacity-50 transition-all cursor-pointer shadow-xs"
                                >
                                    {deleteForm.processing ? 'Menghapus...' : 'Hapus Akun'}
                                </button>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

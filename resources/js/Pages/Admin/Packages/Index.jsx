import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Plus, Edit2, X } from 'lucide-react';

export default function PackagesIndex({ packages = [], ptPackages = [], branches = [] }) {
    // Membership Packages State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editPackage, setEditPackage] = useState(null);

    // PT Packages State
    const [isAddPtModalOpen, setIsAddPtModalOpen] = useState(false);
    const [editPtPackage, setEditPtPackage] = useState(null);

    // Membership Forms
    const addForm = useForm({
        name: '',
        description: '',
        duration_days: 30,
        price: 350000,
        registration_fee: 50000,
        branch_id: branches[0]?.id || 1,
    });

    const editForm = useForm({
        name: '',
        description: '',
        duration_days: 30,
        price: 0,
        registration_fee: 0,
        status: 'active',
    });

    // PT Forms
    const addPtForm = useForm({
        name: '',
        total_sessions: 10,
        price: 1500000,
        validity_days: 45,
    });

    const editPtForm = useForm({
        name: '',
        total_sessions: 10,
        price: 1500000,
        validity_days: 45,
        status: 'active',
    });

    // Membership Handlers
    const submitAdd = (e) => {
        e.preventDefault();
        addForm.post('/packages', {
            onSuccess: () => {
                setIsAddModalOpen(false);
                addForm.reset();
            },
        });
    };

    const submitEdit = (e) => {
        e.preventDefault();
        if (!editPackage) return;
        editForm.put(`/packages/${editPackage.id}`, {
            onSuccess: () => {
                setEditPackage(null);
            },
        });
    };

    const openEdit = (pkg) => {
        setEditPackage(pkg);
        editForm.setData({
            name: pkg.name,
            description: pkg.description || '',
            duration_days: pkg.duration_days,
            price: pkg.price,
            registration_fee: pkg.registration_fee || 0,
            status: pkg.status,
        });
    };

    // PT Handlers
    const submitAddPt = (e) => {
        e.preventDefault();
        addPtForm.post('/pt-packages', {
            onSuccess: () => {
                setIsAddPtModalOpen(false);
                addPtForm.reset();
            },
        });
    };

    const submitEditPt = (e) => {
        e.preventDefault();
        if (!editPtPackage) return;
        editPtForm.put(`/pt-packages/${editPtPackage.id}`, {
            onSuccess: () => {
                setEditPtPackage(null);
            },
        });
    };

    const openEditPt = (pkg) => {
        setEditPtPackage(pkg);
        editPtForm.setData({
            name: pkg.name,
            total_sessions: pkg.total_sessions,
            price: pkg.price,
            validity_days: pkg.validity_days,
            status: pkg.status,
        });
    };

    const formatIDR = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
    const inputClass = 'w-full px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-blue-500';

    return (
        <AdminLayout title="Paket Gym & Personal Trainer">
            <Head title="Paket Gym & Personal Trainer" />
            <div className="space-y-8 max-w-7xl mx-auto pb-10">
                {/* SECTION 1: PAKET MEMBERSHIP GYM */}
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <h2 className="text-base font-semibold text-gray-900">Paket Membership Gym</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Kelola paket langganan keanggotaan gym dan fasilitasnya</p>
                        </div>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                            <Plus className="w-4 h-4" /> Buat Paket Membership
                        </button>
                    </div>

                    {/* Grid of Membership Packages */}
                    {packages.length === 0 ? (
                        <div className="bg-white rounded-3xl border border-gray-100/80 shadow-xs p-8 text-center text-gray-400 text-xs">
                            Belum ada paket membership yang dibuat.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {packages.map((pkg) => (
                                <div key={pkg.id} className="bg-white rounded-3xl border border-gray-100/80 shadow-xs p-5 space-y-3 flex flex-col justify-between hover:border-gray-300 transition-all shadow-2xs">
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium text-gray-500">{pkg.branch?.name || 'Semua Cabang'}</span>
                                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${pkg.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                                {pkg.status === 'active' ? 'Aktif' : 'Inaktif'}
                                            </span>
                                        </div>

                                        <div>
                                            <h3 className="text-base font-bold text-gray-900 leading-snug">{pkg.name}</h3>
                                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">{pkg.description || 'Fasilitas akses lengkap fitness gym.'}</p>
                                        </div>

                                        <div className="pt-3 border-t border-gray-100 space-y-1.5 text-xs">
                                            <div className="flex justify-between items-baseline">
                                                <span className="text-gray-500">Harga Paket</span>
                                                <span className="font-bold text-slate-900 text-sm">{formatIDR(pkg.price)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Durasi Akses</span>
                                                <span className="font-medium text-gray-700">{pkg.duration_days} Hari</span>
                                            </div>
                                            {pkg.registration_fee > 0 && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Biaya Registrasi</span>
                                                    <span className="text-gray-600">{formatIDR(pkg.registration_fee)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-gray-100 flex justify-end">
                                        <button onClick={() => openEdit(pkg)} className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 flex items-center gap-1 transition-colors cursor-pointer">
                                            <Edit2 className="w-3.5 h-3.5" /> Edit Paket
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* SECTION 2: PAKET SESI PERSONAL TRAINER */}
                <div className="pt-6 border-t border-gray-200 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <h2 className="text-base font-semibold text-gray-900">Paket Sesi Personal Trainer</h2>
                            <p className="text-xs text-gray-500 mt-0.5">Kelola pilihan kuota sesi latihan privat bersama Coach / PT</p>
                        </div>
                        <button
                            onClick={() => setIsAddPtModalOpen(true)}
                            className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                        >
                            <Plus className="w-4 h-4" /> Buat Paket PT Baru
                        </button>
                    </div>

                    {/* Grid of PT Packages */}
                    {ptPackages.length === 0 ? (
                        <div className="bg-white rounded-3xl border border-gray-100/80 shadow-xs p-8 text-center space-y-2">
                            <p className="text-sm font-medium text-gray-700">Belum ada paket Personal Trainer</p>
                            <p className="text-xs text-gray-400">Buat paket kuota sesi latihan PT pertama untuk client gym Anda.</p>
                            <button onClick={() => setIsAddPtModalOpen(true)} className="mt-2 px-3 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg cursor-pointer">
                                + Buat Paket PT
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {ptPackages.map((ptPkg) => {
                                const pricePerSession = ptPkg.total_sessions > 0 ? Math.round(ptPkg.price / ptPkg.total_sessions) : 0;
                                return (
                                    <div key={ptPkg.id} className="bg-white rounded-3xl border border-gray-100/80 shadow-xs p-5 space-y-3 relative hover:border-gray-300 transition-all shadow-2xs flex flex-col justify-between">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                                    {ptPkg.total_sessions} Sesi PT
                                                </span>
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${ptPkg.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                                                    {ptPkg.status === 'active' ? 'Aktif' : 'Inaktif'}
                                                </span>
                                            </div>

                                            <div>
                                                <h3 className="text-base font-bold text-gray-900 leading-snug">{ptPkg.name}</h3>
                                                <p className="text-xs text-gray-500 mt-0.5 font-medium">Masa berlaku: {ptPkg.validity_days} Hari</p>
                                            </div>

                                            <div className="pt-3 border-t border-gray-100 space-y-1.5 text-xs">
                                                <div className="flex justify-between items-baseline">
                                                    <span className="text-gray-500">Harga Paket</span>
                                                    <span className="font-bold text-slate-900 text-sm">{formatIDR(ptPkg.price)}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-gray-500">Estimasi Biaya / Sesi</span>
                                                    <span className="font-medium text-gray-700">{formatIDR(pricePerSession)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="pt-3 border-t border-gray-100 flex justify-end">
                                            <button onClick={() => openEditPt(ptPkg)} className="px-3 py-1.5 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200 flex items-center gap-1 transition-colors cursor-pointer">
                                                <Edit2 className="w-3.5 h-3.5" /> Edit Paket PT
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* MODALS */}

                {/* Modal Add Membership Package */}
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50/50">
                                <h3 className="text-sm font-bold text-gray-900">Buat Paket Membership Baru</h3>
                                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                            </div>
                            <form onSubmit={submitAdd} className="p-5 space-y-3.5">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Paket *</label>
                                    <input type="text" value={addForm.data.name} onChange={(e) => addForm.setData('name', e.target.value)} className={inputClass} placeholder="Contoh: Platinum 1 Bulan" required />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Deskripsi</label>
                                    <textarea value={addForm.data.description} onChange={(e) => addForm.setData('description', e.target.value)} rows="2" className={inputClass} placeholder="Fasilitas dan keterangan paket..." />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Harga (Rp) *</label>
                                        <input type="number" value={addForm.data.price} onChange={(e) => addForm.setData('price', e.target.value)} className={inputClass} required />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Durasi (Hari) *</label>
                                        <input type="number" value={addForm.data.duration_days} onChange={(e) => addForm.setData('duration_days', e.target.value)} className={inputClass} required />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Biaya Registrasi Awal (Rp)</label>
                                    <input type="number" value={addForm.data.registration_fee} onChange={(e) => addForm.setData('registration_fee', e.target.value)} className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Cabang *</label>
                                    <select value={addForm.data.branch_id} onChange={(e) => addForm.setData('branch_id', e.target.value)} className={inputClass}>
                                        {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                                    </select>
                                </div>

                                <div className="pt-4 border-t border-gray-200 flex justify-end gap-2">
                                    <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-3.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg">Batal</button>
                                    <button type="submit" disabled={addForm.processing} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl disabled:opacity-50 transition-colors shadow-2xs">Simpan</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal Edit Membership Package */}
                {editPackage && (
                    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50/50">
                                <h3 className="text-sm font-bold text-gray-900">Edit Paket Membership</h3>
                                <button onClick={() => setEditPackage(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                            </div>
                            <form onSubmit={submitEdit} className="p-5 space-y-3.5">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Paket *</label>
                                    <input type="text" value={editForm.data.name} onChange={(e) => editForm.setData('name', e.target.value)} className={inputClass} required />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Deskripsi</label>
                                    <textarea value={editForm.data.description} onChange={(e) => editForm.setData('description', e.target.value)} rows="2" className={inputClass} />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Harga (Rp) *</label>
                                        <input type="number" value={editForm.data.price} onChange={(e) => editForm.setData('price', e.target.value)} className={inputClass} required />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Durasi (Hari) *</label>
                                        <input type="number" value={editForm.data.duration_days} onChange={(e) => editForm.setData('duration_days', e.target.value)} className={inputClass} required />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Biaya Registrasi Awal (Rp)</label>
                                    <input type="number" value={editForm.data.registration_fee} onChange={(e) => editForm.setData('registration_fee', e.target.value)} className={inputClass} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Status Paket</label>
                                    <select value={editForm.data.status} onChange={(e) => editForm.setData('status', e.target.value)} className={inputClass}>
                                        <option value="active">Aktif</option>
                                        <option value="inactive">Inaktif (Disembunyikan)</option>
                                    </select>
                                </div>

                                <div className="pt-4 border-t border-gray-200 flex justify-end gap-2">
                                    <button type="button" onClick={() => setEditPackage(null)} className="px-3.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg">Batal</button>
                                    <button type="submit" disabled={editForm.processing} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl disabled:opacity-50 transition-colors shadow-2xs">Perbarui</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal Add PT Package */}
                {isAddPtModalOpen && (
                    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50/50">
                                <h3 className="text-sm font-bold text-gray-900">Buat Paket Personal Trainer Baru</h3>
                                <button onClick={() => setIsAddPtModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                            </div>
                            <form onSubmit={submitAddPt} className="p-5 space-y-3.5">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Paket PT *</label>
                                    <input type="text" value={addPtForm.data.name} onChange={(e) => addPtForm.setData('name', e.target.value)} className={inputClass} placeholder="Contoh: Paket 10 Sesi Personal Training" required />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Jumlah Sesi Latihan *</label>
                                        <input type="number" min="1" value={addPtForm.data.total_sessions} onChange={(e) => addPtForm.setData('total_sessions', e.target.value)} className={inputClass} required />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Masa Berlaku (Hari) *</label>
                                        <input type="number" min="1" value={addPtForm.data.validity_days} onChange={(e) => addPtForm.setData('validity_days', e.target.value)} className={inputClass} required />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Harga Paket (Rp) *</label>
                                    <input type="number" min="0" value={addPtForm.data.price} onChange={(e) => addPtForm.setData('price', e.target.value)} className={inputClass} required />
                                </div>

                                <div className="pt-4 border-t border-gray-200 flex justify-end gap-2">
                                    <button type="button" onClick={() => setIsAddPtModalOpen(false)} className="px-3.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg">Batal</button>
                                    <button type="submit" disabled={addPtForm.processing} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl disabled:opacity-50 transition-colors shadow-2xs">Simpan Paket PT</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Modal Edit PT Package */}
                {editPtPackage && (
                    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-md rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
                            <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50/50">
                                <h3 className="text-sm font-bold text-gray-900">Edit Paket Personal Trainer</h3>
                                <button onClick={() => setEditPtPackage(null)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
                            </div>
                            <form onSubmit={submitEditPt} className="p-5 space-y-3.5">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Nama Paket PT *</label>
                                    <input type="text" value={editPtForm.data.name} onChange={(e) => editPtForm.setData('name', e.target.value)} className={inputClass} required />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Jumlah Sesi Latihan *</label>
                                        <input type="number" min="1" value={editPtForm.data.total_sessions} onChange={(e) => editPtForm.setData('total_sessions', e.target.value)} className={inputClass} required />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">Masa Berlaku (Hari) *</label>
                                        <input type="number" min="1" value={editPtForm.data.validity_days} onChange={(e) => editPtForm.setData('validity_days', e.target.value)} className={inputClass} required />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Harga Paket (Rp) *</label>
                                    <input type="number" min="0" value={editPtForm.data.price} onChange={(e) => editPtForm.setData('price', e.target.value)} className={inputClass} required />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">Status Paket</label>
                                    <select value={editPtForm.data.status} onChange={(e) => editPtForm.setData('status', e.target.value)} className={inputClass}>
                                        <option value="active">Aktif</option>
                                        <option value="inactive">Inaktif (Disembunyikan)</option>
                                    </select>
                                </div>

                                <div className="pt-4 border-t border-gray-200 flex justify-end gap-2">
                                    <button type="button" onClick={() => setEditPtPackage(null)} className="px-3.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg">Batal</button>
                                    <button type="submit" disabled={editPtForm.processing} className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl disabled:opacity-50 transition-colors shadow-2xs">Perbarui</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import ImageCropModal from '@/Components/ImageCropModal';
import {
    Plus,
    X,
    Pencil,
    Camera,
    Search,
    UserCheck
} from 'lucide-react';

export default function TrainersIndex({ trainers = [], ptPackages, members }) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingTrainer, setEditingTrainer] = useState(null);
    const [portraitPreview, setPortraitPreview] = useState(null);
    const [editPortraitPreview, setEditPortraitPreview] = useState(null);
    const [rawPortraitSrc, setRawPortraitSrc] = useState(null);
    const [isCropModalOpen, setIsCropModalOpen] = useState(false);
    const [isEditingCrop, setIsEditingCrop] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Form for Adding New Trainer
    const addForm = useForm({
        full_name: '',
        email: '',
        phone: '',
        specialization: '',
        bio: '',
        skills: '',
        achievements: '',
        photo: null,
        portrait_photo: null,
    });

    // Form for Editing Existing Trainer
    const editForm = useForm({
        full_name: '',
        email: '',
        phone: '',
        specialization: '',
        bio: '',
        skills: '',
        achievements: '',
        status: 'active',
        photo: null,
        portrait_photo: null,
    });

    const handlePortraitChange = (e, isEdit = false) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsEditingCrop(isEdit);
        const reader = new FileReader();
        reader.onload = () => {
            setRawPortraitSrc(reader.result);
            setIsCropModalOpen(true);
        };
        reader.readAsDataURL(file);
    };

    const handleCropComplete = (croppedFile, previewUrl) => {
        if (isEditingCrop) {
            setEditPortraitPreview(previewUrl);
            editForm.setData('portrait_photo', croppedFile);
        } else {
            setPortraitPreview(previewUrl);
            addForm.setData('portrait_photo', croppedFile);
        }
    };

    const submitAddTrainer = (e) => {
        e.preventDefault();
        addForm.post('/trainers', {
            forceFormData: true,
            onSuccess: () => {
                setIsAddModalOpen(false);
                addForm.reset();
                setPortraitPreview(null);
            },
        });
    };

    const handleOpenEdit = (trainer) => {
        setEditingTrainer(trainer);
        editForm.setData({
            full_name: trainer.full_name || '',
            email: trainer.email || '',
            phone: trainer.phone || '',
            specialization: trainer.specialization || '',
            bio: trainer.bio || '',
            skills: trainer.skills || '',
            achievements: trainer.achievements || '',
            status: trainer.status || 'active',
            photo: null,
            portrait_photo: null,
        });
        setEditPortraitPreview(trainer.portrait_photo || null);
    };

    const submitEditTrainer = (e) => {
        e.preventDefault();
        editForm.post(`/trainers/${editingTrainer.id}`, {
            forceFormData: true,
            onSuccess: () => {
                setEditingTrainer(null);
                editForm.reset();
                setEditPortraitPreview(null);
            },
        });
    };

    // Filter trainers by search
    const filteredTrainers = trainers.filter((tr) => {
        const query = searchTerm.toLowerCase();
        return (
            (tr.full_name || '').toLowerCase().includes(query) ||
            (tr.trainer_code || '').toLowerCase().includes(query) ||
            (tr.specialization || '').toLowerCase().includes(query) ||
            (tr.phone || '').toLowerCase().includes(query) ||
            (tr.email || '').toLowerCase().includes(query)
        );
    });

    const inputClass = 'w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-medium transition-all';

    return (
        <AdminLayout title="Daftar Trainer">
            <Head title="Daftar Personal Trainer" />

            <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans antialiased text-gray-900">
                {/* Header & Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 tracking-tight">Kelola Personal Trainer</h2>
                        <p className="text-xs text-gray-500 mt-0.5">
                            Daftar pelatih gym, spesialisasi, skill kebugaran, sertifikasi, dan foto poster portrait.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Search Input */}
                        <div className="relative">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Cari nama / kode trainer..."
                                className="pl-9 pr-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 sm:w-64"
                            />
                        </div>

                        <button
                            onClick={() => {
                                addForm.reset();
                                setPortraitPreview(null);
                                setIsAddModalOpen(true);
                            }}
                            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer shrink-0"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Tambah Trainer</span>
                        </button>
                    </div>
                </div>

                {/* Trainer List Table */}
                <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-xs">
                    {filteredTrainers.length === 0 ? (
                        <div className="py-12 px-4 text-center space-y-3">
                            <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto">
                                <UserCheck className="w-6 h-6" />
                            </div>
                            <h3 className="font-bold text-sm text-gray-800">
                                {searchTerm ? 'Trainer tidak ditemukan' : 'Belum ada data trainer'}
                            </h3>
                            <p className="text-xs text-gray-400 max-w-xs mx-auto">
                                {searchTerm
                                    ? `Tidak ditemukan trainer dengan kata kunci "${searchTerm}".`
                                    : 'Tambahkan personal trainer baru untuk melatih member gym Anda.'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 font-bold uppercase tracking-wider text-[10px]">
                                        <th className="py-3.5 px-4">Trainer</th>
                                        <th className="py-3.5 px-4">Kontak</th>
                                        <th className="py-3.5 px-4">Spesialisasi & Skills</th>
                                        <th className="py-3.5 px-4">Pencapaian</th>
                                        <th className="py-3.5 px-4 text-center">Status</th>
                                        <th className="py-3.5 px-4 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 text-gray-700 font-medium">
                                    {filteredTrainers.map((tr) => {
                                        const skillList = tr.skills
                                            ? tr.skills.split(',').map((s) => s.trim()).filter(Boolean)
                                            : [];
                                        const achievementList = tr.achievements
                                            ? tr.achievements.split('\n').map((a) => a.trim()).filter(Boolean)
                                            : [];

                                        return (
                                            <tr key={tr.id} className="hover:bg-blue-50/30 transition-colors">
                                                {/* Trainer Info (Name + Code + Bio) */}
                                                <td className="py-3.5 px-4">
                                                    <div className="min-w-0">
                                                        <div className="font-bold text-gray-900 text-sm truncate">
                                                            {tr.full_name}
                                                        </div>
                                                        <span className="inline-block px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-mono font-semibold mt-0.5">
                                                            {tr.trainer_code || `TR-${tr.id}`}
                                                        </span>
                                                        {tr.bio && (
                                                            <p className="text-[11px] text-gray-400 line-clamp-1 max-w-[240px] mt-0.5">
                                                                {tr.bio}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Contact Details */}
                                                <td className="py-3.5 px-4 whitespace-nowrap">
                                                    <div className="space-y-0.5 text-xs">
                                                        <div className="text-gray-900 font-mono font-medium">
                                                            {tr.phone || tr.user?.phone || '-'}
                                                        </div>
                                                        <div className="text-gray-500 font-mono text-[11px]">
                                                            {tr.email || tr.user?.email || '-'}
                                                        </div>
                                                    </div>
                                                </td>

                                                {/* Specialization & Skills */}
                                                <td className="py-3 px-4 max-w-xs">
                                                    <div className="space-y-1.5">
                                                        <span className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-md font-semibold text-[11px]">
                                                            {tr.specialization || 'Personal Trainer'}
                                                        </span>

                                                        {skillList.length > 0 ? (
                                                            <div className="flex flex-wrap gap-1">
                                                                {skillList.slice(0, 3).map((s, idx) => (
                                                                    <span
                                                                        key={idx}
                                                                        className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-[10px] font-medium"
                                                                    >
                                                                        {s}
                                                                    </span>
                                                                ))}
                                                                {skillList.length > 3 && (
                                                                    <span className="px-1.5 py-0.5 bg-gray-100 text-gray-400 rounded text-[10px]">
                                                                        +{skillList.length - 3}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <span className="text-[11px] text-gray-400 italic block">
                                                                Belum diatur
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>

                                                {/* Achievements */}
                                                <td className="py-3 px-4 max-w-xs">
                                                    {achievementList.length > 0 ? (
                                                        <div className="space-y-1">
                                                            {achievementList.slice(0, 2).map((ach, idx) => (
                                                                <p key={idx} className="text-[11px] text-gray-600 line-clamp-1 leading-tight flex items-center gap-1">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                                                                    <span>{ach}</span>
                                                                </p>
                                                            ))}
                                                            {achievementList.length > 2 && (
                                                                <span className="text-[10px] text-blue-600 font-medium">
                                                                    +{achievementList.length - 2} sertifikasi lainnya
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-[11px] text-gray-400 italic">
                                                            Belum diatur
                                                        </span>
                                                    )}
                                                </td>

                                                {/* Status */}
                                                <td className="py-3 px-4 text-center whitespace-nowrap">
                                                    <span
                                                        className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                                            tr.status === 'active'
                                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                                : 'bg-red-50 text-red-600 border border-red-200'
                                                        }`}
                                                    >
                                                        {tr.status === 'active' ? 'Aktif' : 'Non-Aktif'}
                                                    </span>
                                                </td>

                                                {/* Actions */}
                                                <td className="py-3 px-4 text-right whitespace-nowrap">
                                                    <button
                                                        onClick={() => handleOpenEdit(tr)}
                                                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 active:scale-95 rounded-xl transition-all cursor-pointer inline-flex items-center gap-1 text-xs font-semibold"
                                                        title="Edit Trainer"
                                                    >
                                                        <Pencil className="w-3.5 h-3.5" />
                                                        <span>Edit</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* MODAL 1: Tambah Trainer Baru */}
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                            <div className="flex items-center justify-between p-5 border-b border-gray-100">
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900">Tambah Personal Trainer Baru</h3>
                                    <p className="text-xs text-gray-400">Lengkapi profil, foto poster, spesialisasi, skill & sertifikasi</p>
                                </div>
                                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={submitAddTrainer} className="p-6 space-y-4 overflow-y-auto">
                                {/* Dedicated Portrait Photo Upload */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-900 mb-1.5">
                                        Foto Portrait Poster (Tampil di Aplikasi Member) *
                                    </label>
                                    <div className="flex items-center gap-4 bg-gray-50 p-3.5 rounded-2xl border border-gray-200">
                                        <div className="relative w-20 h-28 rounded-xl border-2 border-dashed border-blue-400 flex items-center justify-center overflow-hidden bg-slate-900 shrink-0 shadow-xs">
                                            {portraitPreview ? (
                                                <img src={portraitPreview} alt="Preview Portrait" className="w-full h-full object-cover object-top" />
                                            ) : (
                                                <Camera className="w-7 h-7 text-white/50" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handlePortraitChange(e, false)}
                                                className="block w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                                                required
                                            />
                                            <p className="text-[10px] text-gray-500 mt-1.5 leading-relaxed">
                                                Gunakan foto posisi tegak / berdiri (rasio 3:4) agar pas pada kartu poster portal member.
                                            </p>
                                        </div>
                                    </div>
                                    {addForm.errors.portrait_photo && <p className="text-xs text-red-600 mt-1">{addForm.errors.portrait_photo}</p>}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-900 mb-1">Nama Lengkap *</label>
                                        <input type="text" value={addForm.data.full_name} onChange={(e) => addForm.setData('full_name', e.target.value)} className={inputClass} placeholder="Contoh: Coach Alex" required />
                                        {addForm.errors.full_name && <p className="text-xs text-red-600 mt-1">{addForm.errors.full_name}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-900 mb-1">Email *</label>
                                        <input type="email" value={addForm.data.email} onChange={(e) => addForm.setData('email', e.target.value)} className={inputClass} placeholder="alex@trakin.com" required />
                                        {addForm.errors.email && <p className="text-xs text-red-600 mt-1">{addForm.errors.email}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-900 mb-1">No. WhatsApp / HP *</label>
                                        <input type="text" value={addForm.data.phone} onChange={(e) => addForm.setData('phone', e.target.value)} className={inputClass} placeholder="08123456789" required />
                                        {addForm.errors.phone && <p className="text-xs text-red-600 mt-1">{addForm.errors.phone}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-900 mb-1">Spesialisasi Utama *</label>
                                        <input type="text" value={addForm.data.specialization} onChange={(e) => addForm.setData('specialization', e.target.value)} className={inputClass} placeholder="Bodybuilding & Strength" required />
                                        {addForm.errors.specialization && <p className="text-xs text-red-600 mt-1">{addForm.errors.specialization}</p>}
                                    </div>
                                </div>

                                {/* Personal Skills Input */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-900 mb-1">
                                        Personal Skills (Keahlian)
                                    </label>
                                    <input
                                        type="text"
                                        value={addForm.data.skills}
                                        onChange={(e) => addForm.setData('skills', e.target.value)}
                                        className={inputClass}
                                        placeholder="Hypertrophy, Strength Conditioning, Fat Loss, Biomechanics"
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1">
                                        Pisahkan setiap skill dengan koma (,). Akan ditampilkan sebagai tag chips di detail coach.
                                    </p>
                                </div>

                                {/* Achievements Input */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-900 mb-1">
                                        Achievements & Certifications (Pencapaian / Sertifikasi)
                                    </label>
                                    <textarea
                                        value={addForm.data.achievements}
                                        onChange={(e) => addForm.setData('achievements', e.target.value)}
                                        rows="3"
                                        className={inputClass}
                                        placeholder={"Certified IFBB Pro / APKI Personal Trainer\n100+ Member Transformation Portfolio\nCertified CPR / AED Level 2"}
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1">
                                        Tuliskan satu pencapaian per baris (tekan Enter untuk baris baru).
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-900 mb-1">Bio Singkat (Tentang Coach)</label>
                                    <textarea value={addForm.data.bio} onChange={(e) => addForm.setData('bio', e.target.value)} rows="2" className={inputClass} placeholder="Deskripsi singkat profil & pendekatan latihan coach..." />
                                </div>

                                <div className="pt-3 border-t border-gray-100 flex justify-end gap-2 shrink-0">
                                    <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer">
                                        Batal
                                    </button>
                                    <button type="submit" disabled={addForm.processing} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold rounded-xl disabled:opacity-50 shadow-sm cursor-pointer">
                                        Simpan Trainer
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL 2: Edit Data Trainer */}
                {editingTrainer && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                            <div className="flex items-center justify-between p-5 border-b border-gray-100">
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900">Edit Data Trainer</h3>
                                    <p className="text-xs text-gray-400">Perbarui profil, foto poster, spesialisasi, skill & sertifikasi</p>
                                </div>
                                <button onClick={() => setEditingTrainer(null)} className="text-gray-400 hover:text-gray-600 cursor-pointer">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            <form onSubmit={submitEditTrainer} className="p-6 space-y-4 overflow-y-auto">
                                {/* Dedicated Portrait Photo Upload */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-900 mb-1.5">
                                        Foto Portrait Poster (Tampil di Aplikasi Member)
                                    </label>
                                    <div className="flex items-center gap-4 bg-gray-50 p-3.5 rounded-2xl border border-gray-200">
                                        <div className="relative w-20 h-28 rounded-xl border-2 border-dashed border-blue-400 flex items-center justify-center overflow-hidden bg-slate-900 shrink-0 shadow-xs">
                                            {editPortraitPreview ? (
                                                <img src={editPortraitPreview} alt="Preview Portrait" className="w-full h-full object-cover object-top" />
                                            ) : (
                                                <Camera className="w-7 h-7 text-white/50" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handlePortraitChange(e, true)}
                                                className="block w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                                            />
                                            <p className="text-[10px] text-gray-500 mt-1.5 leading-relaxed">
                                                Pilih foto tegak portrait baru untuk mengganti poster kartu trainer di aplikasi member.
                                            </p>
                                        </div>
                                    </div>
                                    {editForm.errors.portrait_photo && <p className="text-xs text-red-600 mt-1">{editForm.errors.portrait_photo}</p>}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-900 mb-1">Nama Lengkap *</label>
                                        <input type="text" value={editForm.data.full_name} onChange={(e) => editForm.setData('full_name', e.target.value)} className={inputClass} required />
                                        {editForm.errors.full_name && <p className="text-xs text-red-600 mt-1">{editForm.errors.full_name}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-900 mb-1">Email *</label>
                                        <input type="email" value={editForm.data.email} onChange={(e) => editForm.setData('email', e.target.value)} className={inputClass} required />
                                        {editForm.errors.email && <p className="text-xs text-red-600 mt-1">{editForm.errors.email}</p>}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-900 mb-1">No. WhatsApp / HP *</label>
                                        <input type="text" value={editForm.data.phone} onChange={(e) => editForm.setData('phone', e.target.value)} className={inputClass} required />
                                        {editForm.errors.phone && <p className="text-xs text-red-600 mt-1">{editForm.errors.phone}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-gray-900 mb-1">Spesialisasi Utama *</label>
                                        <input type="text" value={editForm.data.specialization} onChange={(e) => editForm.setData('specialization', e.target.value)} className={inputClass} required />
                                        {editForm.errors.specialization && <p className="text-xs text-red-600 mt-1">{editForm.errors.specialization}</p>}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-900 mb-1">Status Trainer *</label>
                                    <select value={editForm.data.status} onChange={(e) => editForm.setData('status', e.target.value)} className={inputClass}>
                                        <option value="active">Aktif</option>
                                        <option value="inactive">Non-Aktif</option>
                                    </select>
                                </div>

                                {/* Personal Skills Edit */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-900 mb-1">
                                        Personal Skills (Keahlian)
                                    </label>
                                    <input
                                        type="text"
                                        value={editForm.data.skills}
                                        onChange={(e) => editForm.setData('skills', e.target.value)}
                                        className={inputClass}
                                        placeholder="Hypertrophy, Strength Conditioning, Fat Loss, Biomechanics"
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1">
                                        Pisahkan setiap skill dengan koma (,).
                                    </p>
                                </div>

                                {/* Achievements Edit */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-900 mb-1">
                                        Achievements & Certifications (Pencapaian / Sertifikasi)
                                    </label>
                                    <textarea
                                        value={editForm.data.achievements}
                                        onChange={(e) => editForm.setData('achievements', e.target.value)}
                                        rows="3"
                                        className={inputClass}
                                        placeholder={"Certified IFBB Pro / APKI Personal Trainer\n100+ Member Transformation Portfolio\nCertified CPR / AED Level 2"}
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1">
                                        Tuliskan satu pencapaian per baris (tekan Enter untuk baris baru).
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-900 mb-1">Bio Singkat</label>
                                    <textarea value={editForm.data.bio} onChange={(e) => editForm.setData('bio', e.target.value)} rows="2" className={inputClass} />
                                </div>

                                <div className="pt-3 border-t border-gray-100 flex justify-end gap-2 shrink-0">
                                    <button type="button" onClick={() => setEditingTrainer(null)} className="px-4 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl cursor-pointer">
                                        Batal
                                    </button>
                                    <button type="submit" disabled={editForm.processing} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold rounded-xl disabled:opacity-50 shadow-sm cursor-pointer">
                                        Simpan Perubahan
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Trainer Portrait Photo Crop Modal */}
                <ImageCropModal
                    isOpen={isCropModalOpen}
                    imageSrc={rawPortraitSrc}
                    onClose={() => setIsCropModalOpen(false)}
                    onCropComplete={handleCropComplete}
                    aspectRatio={0.75}
                    title="Potong Foto Portrait Trainer"
                    outputFileName="trainer_portrait.jpg"
                />
            </div>
        </AdminLayout>
    );
}

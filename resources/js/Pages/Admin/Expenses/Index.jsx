import React, { useState, useRef } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Pagination from '@/Components/Pagination';
import {
    Receipt, Plus, Search, Filter, Calendar, DollarSign,
    TrendingDown, Trash2, Edit3, Eye, UploadCloud, X, Download,
    Printer, PieChart, Tag, CreditCard, ArrowDownRight, Check,
    AlertCircle, Image, ChevronDown, CheckCircle2
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export default function ExpensesIndex({
    expenses = {},
    summary = {},
    categoryBreakdown = [],
    chartData = [],
    categories = [],
    filters = {},
}) {
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [selectedCategory, setSelectedCategory] = useState(filters.category || '');
    const [searchKeyword, setSearchKeyword] = useState(filters.search || '');

    // Modals state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isPresetDropdownOpen, setIsPresetDropdownOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [previewReceipt, setPreviewReceipt] = useState(null);
    const [deletingExpense, setDeletingExpense] = useState(null);

    // Role guard: hanya Owner & Manager yang boleh kelola (hapus/edit) pengeluaran
    const { auth } = usePage().props;
    const userRoles = auth?.user?.roles || [];
    const canManageExpense = userRoles.some((r) => ['Owner', 'Manager'].includes(r));

    // Add / Edit Form State
    const createForm = useForm({
        category: categories[0] || 'Operasional & Keperluan Harian',
        description: '',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0],
        payment_method: 'cash',
        notes: '',
        receipt_photo: null,
    });

    const editForm = useForm({
        category: '',
        description: '',
        amount: '',
        expense_date: '',
        payment_method: 'cash',
        notes: '',
        receipt_photo: null,
    });

    const fileInputRef = useRef(null);
    const editFileInputRef = useRef(null);

    const handleFilterSubmit = (e) => {
        e?.preventDefault();
        router.get('/expenses', {
            start_date: startDate,
            end_date: endDate,
            category: selectedCategory,
            search: searchKeyword,
        }, { preserveState: true });
    };

    const handleResetFilter = () => {
        const today = new Date();
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

        setStartDate(firstDay);
        setEndDate(lastDay);
        setSelectedCategory('');
        setSearchKeyword('');

        router.get('/expenses', {
            start_date: firstDay,
            end_date: lastDay,
        }, { preserveState: true });
    };

    const handleQuickPreset = (type) => {
        const today = new Date();
        let s = '';
        let e = today.toISOString().split('T')[0];

        if (type === 'today') {
            s = e;
        } else if (type === 'month') {
            s = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
            e = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
        } else if (type === '30days') {
            const d = new Date();
            d.setDate(d.getDate() - 30);
            s = d.toISOString().split('T')[0];
        }

        setStartDate(s);
        setEndDate(e);
        router.get('/expenses', {
            start_date: s,
            end_date: e,
            category: selectedCategory,
            search: searchKeyword,
        }, { preserveState: true });
    };

    const handleOpenCreateModal = () => {
        createForm.reset();
        createForm.setData({
            category: categories[0] || 'Operasional & Keperluan Harian',
            description: '',
            amount: '',
            expense_date: new Date().toISOString().split('T')[0],
            payment_method: 'cash',
            notes: '',
            receipt_photo: null,
        });
        setIsAddModalOpen(true);
    };

    const handleCreateSubmit = (e) => {
        e.preventDefault();
        createForm.post('/expenses', {
            onSuccess: () => {
                setIsAddModalOpen(false);
                createForm.reset();
            },
        });
    };

    const handleOpenEditModal = (expense) => {
        setEditingExpense(expense);
        editForm.setData({
            category: expense.category,
            description: expense.description,
            amount: expense.amount,
            expense_date: expense.expense_date,
            payment_method: expense.payment_method || 'cash',
            notes: expense.notes || '',
            receipt_photo: null,
        });
    };

    const handleEditSubmit = (e) => {
        e.preventDefault();
        if (!editingExpense) return;

        editForm.post(`/expenses/${editingExpense.id}`, {
            onSuccess: () => {
                setEditingExpense(null);
                editForm.reset();
            },
        });
    };

    const handleDeleteConfirm = () => {
        if (!deletingExpense) return;
        router.delete(`/expenses/${deletingExpense.id}`, {
            onSuccess: () => setDeletingExpense(null),
        });
    };

    const formatIDR = (val) => new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        maximumFractionDigits: 0
    }).format(Number(val) || 0);

    const formatCurrencyDisplay = (value) => {
        if (value === '' || value == null) return '';
        let str = String(value).replace(/[^0-9.]/g, '');
        if (str === '' || str === '.') return str;
        const [intPart, decPart] = str.split('.');
        const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        if (decPart !== undefined) return `${formattedInt},${decPart.slice(0, 2)}`;
        return formattedInt;
    };

    const parseCurrencyInput = (formatted) => {
        if (!formatted) return '';
        let cleaned = formatted.replace(/\./g, '').replace(',', '.');
        cleaned = cleaned.replace(/[^0-9.]/g, '');
        const parts = cleaned.split('.');
        if (parts.length > 2) cleaned = parts[0] + '.' + parts.slice(1).join('');
        if (cleaned.startsWith('.')) cleaned = '0' + cleaned;
        return cleaned;
    };

    const handleExportCSV = () => {
        let csvContent = "\uFEFF"; // UTF-8 BOM
        csvContent += "LAPORAN PENGELUARAN OPERASIONAL TRAKIN GYM\n";
        csvContent += `Periode,${startDate} s/d ${endDate}\n`;
        csvContent += `Kategori,${selectedCategory || 'Semua Kategori'}\n`;
        csvContent += `Total Pengeluaran,${summary.periodTotal}\n\n`;

        csvContent += "TANGGAL,KATEGORI,DESKRIPSI,METODE BAYAR,NOMINAL,STAF PEMBUAT,CATATAN\n";
        (expenses.data || []).forEach((exp) => {
            const cleanDesc = (exp.description || '').replace(/"/g, '""');
            const cleanNotes = (exp.notes || '').replace(/"/g, '""');
            csvContent += `"${exp.expense_date}","${exp.category}","${cleanDesc}","${(exp.payment_method || 'CASH').toUpperCase()}",${exp.amount},"${exp.creator?.name || '-'}","${cleanNotes}"\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `Laporan_Pengeluaran_${startDate}_sd_${endDate}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handlePrint = () => {
        window.print();
    };

    const categoryBadgeColors = {
        'Operasional & Keperluan Harian': 'bg-blue-50 text-blue-700 border-blue-200',
        'Utilitas (Listrik, Air, Wifi)': 'bg-amber-50 text-amber-700 border-amber-200',
        'Sewa Tempat & Gedung': 'bg-rose-50 text-rose-700 border-rose-200',
        'Maintenance Alat & Fasilitas': 'bg-purple-50 text-purple-700 border-purple-200',
        'Gaji & Honor Karyawan': 'bg-emerald-50 text-emerald-700 border-emerald-200',
        'Pemasaran & Promosi': 'bg-indigo-50 text-indigo-700 border-indigo-200',
        'Belanja Stok & Perlengkapan': 'bg-cyan-50 text-cyan-700 border-cyan-200',
        'Lain-lain': 'bg-gray-100 text-gray-700 border-gray-300',
    };

    return (
        <AdminLayout title="Pengeluaran">
            <Head title="Manajemen Pengeluaran Operasional" />

            <div className="space-y-6">
                {/* Print Header */}
                <div className="hidden print:block mb-6 border-b border-gray-300 pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">TRAKIN GYM MANAGEMENT</h1>
                            <p className="text-xs text-gray-600">Laporan Resmi Pengeluaran & Biaya Operasional</p>
                        </div>
                        <div className="text-right text-xs text-gray-500">
                            <p><span className="font-semibold text-gray-900">Periode:</span> {startDate} s/d {endDate}</p>
                            <p><span className="font-semibold text-gray-900">Kategori:</span> {selectedCategory || 'Semua Kategori'}</p>
                            <p><span className="font-semibold text-gray-900">Dicetak:</span> {new Date().toLocaleString('id-ID')}</p>
                        </div>
                    </div>
                </div>

                {/* Top Header & Actions */}
                <div className="bg-white rounded-3xl border border-gray-100/80 shadow-xs p-5 space-y-4 no-print shadow-2xs">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <h2 className="text-base font-semibold text-gray-900">Pengeluaran & Beban Biaya Gym</h2>
                            <p className="text-xs text-gray-500">Pencatatan biaya operasional, utilitas, gaji, sewa, dan pemeliharaan alat</p>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                            {canManageExpense && (
                                <button
                                    type="button"
                                    onClick={handleOpenCreateModal}
                                    className="px-3.5 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                                >
                                    <Plus className="w-3.5 h-3.5" /> Tambah Pengeluaran
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={handlePrint}
                                className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                            >
                                <Printer className="w-3.5 h-3.5 text-gray-500" /> Cetak
                            </button>
                            <button
                                type="button"
                                onClick={handleExportCSV}
                                className="px-3 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                            >
                                <Download className="w-3.5 h-3.5 text-gray-500" /> Excel (CSV)
                            </button>
                        </div>
                    </div>

                    {/* Filter Bar */}
                    <div className="pt-4 border-t border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                            {/* Filter Preset Dropdown */}
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setIsPresetDropdownOpen(!isPresetDropdownOpen)}
                                    className={`inline-flex items-center gap-1.5 border rounded-lg px-3 py-1.5 text-xs font-medium transition-all shadow-2xs ${isPresetDropdownOpen
                                        ? 'bg-blue-50 border-blue-500 text-blue-700 font-semibold'
                                        : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                                        }`}
                                    title="Filter Periode Cepat"
                                >
                                    <Filter className="w-3.5 h-3.5 text-gray-500" />
                                    <span>Periode Cepat</span>
                                    <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isPresetDropdownOpen ? 'rotate-180' : ''}`} />
                                </button>

                                {isPresetDropdownOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-20"
                                            onClick={() => setIsPresetDropdownOpen(false)}
                                        />
                                        <div className="absolute left-0 mt-1.5 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-30 py-1 text-xs">
                                            <button
                                                type="button"
                                                onClick={() => { handleQuickPreset('month'); setIsPresetDropdownOpen(false); }}
                                                className="w-full text-left px-3.5 py-2 hover:bg-gray-50 text-gray-700 font-medium flex items-center justify-between"
                                            >
                                                <span>Bulan Ini</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { handleQuickPreset('30days'); setIsPresetDropdownOpen(false); }}
                                                className="w-full text-left px-3.5 py-2 hover:bg-gray-50 text-gray-700 font-medium flex items-center justify-between"
                                            >
                                                <span>30 Hari Terakhir</span>
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => { handleQuickPreset('today'); setIsPresetDropdownOpen(false); }}
                                                className="w-full text-left px-3.5 py-2 hover:bg-gray-50 text-gray-700 font-medium flex items-center justify-between"
                                            >
                                                <span>Hari Ini</span>
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Category Filter */}
                            <div className="relative inline-flex items-center bg-white border border-gray-200 hover:border-gray-300 rounded-lg px-3 py-1.5 shadow-2xs transition-all">
                                <Tag className="w-3.5 h-3.5 text-gray-400 mr-1.5" />
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => {
                                        setSelectedCategory(e.target.value);
                                        router.get('/expenses', {
                                            start_date: startDate,
                                            end_date: endDate,
                                            category: e.target.value,
                                            search: searchKeyword,
                                        }, { preserveState: true });
                                    }}
                                    className="bg-transparent text-xs text-gray-700 font-medium focus:outline-none cursor-pointer pr-5 appearance-none"
                                >
                                    <option value="">Semua Kategori</option>
                                    {categories.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2 pointer-events-none" />
                            </div>
                        </div>

                        {/* Date Range & Search */}
                        <form onSubmit={handleFilterSubmit} className="flex flex-wrap items-center gap-2">
                            <div className="relative inline-flex items-center bg-white border border-gray-200 hover:border-gray-300 rounded-lg px-3 py-1.5 shadow-2xs transition-all">
                                <Calendar className="w-3.5 h-3.5 text-gray-400 mr-1.5" />
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="bg-transparent text-xs text-gray-700 font-medium focus:outline-none cursor-pointer"
                                />
                                <span className="text-xs text-gray-400 mx-1">s/d</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="bg-transparent text-xs text-gray-700 font-medium focus:outline-none cursor-pointer"
                                />
                            </div>

                            <div className="relative inline-flex items-center bg-white border border-gray-200 hover:border-gray-300 rounded-lg px-3 py-1.5 shadow-2xs transition-all">
                                <Search className="w-3.5 h-3.5 text-gray-400 mr-1.5" />
                                <input
                                    type="text"
                                    placeholder="Cari deskripsi..."
                                    value={searchKeyword}
                                    onChange={(e) => setSearchKeyword(e.target.value)}
                                    className="bg-transparent text-xs text-gray-700 placeholder-gray-400 focus:outline-none w-28 sm:w-36"
                                />
                            </div>

                            <button
                                type="submit"
                                className="px-3.5 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
                            >
                                Terapkan
                            </button>
                        </form>
                    </div>
                </div>

                {/* 4 Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white rounded-3xl border border-gray-100/80 shadow-xs p-4 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-500">Pengeluaran (Periode Ini)</span>
                            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                                <TrendingDown className="w-4 h-4" />
                            </div>
                        </div>
                        <p className="text-2xl font-semibold text-gray-900 mt-2">{formatIDR(summary.periodTotal)}</p>
                        <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-400" /> Sesuai filter tanggal
                        </p>
                    </div>

                    <div className="bg-white rounded-3xl border border-gray-100/80 shadow-xs p-4 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-500">Pengeluaran Bulan Ini</span>
                            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                                <DollarSign className="w-4 h-4" />
                            </div>
                        </div>
                        <p className="text-2xl font-semibold text-gray-900 mt-2">{formatIDR(summary.thisMonthTotal)}</p>
                        <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                            Bulan {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                        </p>
                    </div>

                    <div className="bg-white rounded-3xl border border-gray-100/80 shadow-xs p-4 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-500">Pengeluaran Hari Ini</span>
                            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Receipt className="w-4 h-4" />
                            </div>
                        </div>
                        <p className="text-2xl font-semibold text-gray-900 mt-2">{formatIDR(summary.todayTotal)}</p>
                        <p className="text-[11px] text-gray-400 mt-1">Biaya kasir & operasional hari ini</p>
                    </div>

                    <div className="bg-white rounded-3xl border border-gray-100/80 shadow-xs p-4 shadow-2xs">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-500">Kategori Terbesar</span>
                            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                                <PieChart className="w-4 h-4" />
                            </div>
                        </div>
                        <p className="text-base font-semibold text-gray-900 mt-2 truncate" title={summary.topCategory}>
                            {summary.topCategory}
                        </p>
                        <p className="text-[11px] text-gray-500 mt-1 font-medium">
                            {formatIDR(summary.topCategoryAmount)}
                        </p>
                    </div>
                </div>

                {/* Grid: Chart & Category Breakdown */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    {/* Trend Chart */}
                    <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100/80 shadow-xs p-5 shadow-2xs">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900">Tren Beban Pengeluaran</h3>
                                <p className="text-xs text-gray-400">Visualisasi fluktuasi biaya operasional harian / bulanan</p>
                            </div>
                        </div>

                        <div className="h-60 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                    <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                                    <YAxis
                                        stroke="#94a3b8"
                                        fontSize={11}
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(val) => val >= 1000000 ? `${(val / 1000000).toFixed(0)} Jt` : `${(val / 1000).toFixed(0)} rb`}
                                        width={50}
                                    />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px' }}
                                        formatter={(val) => [formatIDR(val), 'Pengeluaran']}
                                    />
                                    <Area type="monotone" name="Pengeluaran" dataKey="total" stroke="#f43f5e" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Breakdown by Category */}
                    <div className="bg-white rounded-3xl border border-gray-100/80 shadow-xs p-5 shadow-2xs flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between mb-3 border-b border-gray-100 pb-2">
                                <h3 className="text-sm font-semibold text-gray-900">Rincian Per Kategori</h3>
                                <span className="text-[11px] text-gray-400">{categoryBreakdown.length} Kategori</span>
                            </div>
                            <div className="space-y-3 max-h-52 overflow-y-auto pr-1">
                                {categoryBreakdown.length === 0 ? (
                                    <p className="text-xs text-gray-400 py-6 text-center">Belum ada data pengeluaran.</p>
                                ) : (
                                    categoryBreakdown.map((item, idx) => {
                                        const pct = summary.periodTotal > 0 ? ((item.total / summary.periodTotal) * 100).toFixed(1) : 0;
                                        return (
                                            <div key={idx} className="space-y-1">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="font-medium text-gray-800 truncate max-w-[150px]" title={item.category}>
                                                        {item.category}
                                                    </span>
                                                    <span className="font-semibold text-gray-900">{formatIDR(item.total)}</span>
                                                </div>
                                                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                                    <div
                                                        className="bg-rose-500 h-1.5 rounded-full"
                                                        style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}
                                                    />
                                                </div>
                                                <div className="flex justify-between text-[10px] text-gray-400">
                                                    <span>{item.count} transaksi</span>
                                                    <span>{pct}% dari total</span>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        <div className="pt-3 border-t border-gray-100 mt-2 flex items-center justify-between text-xs font-semibold text-gray-900">
                            <span>Total Akumulasi</span>
                            <span className="text-rose-600">{formatIDR(summary.periodTotal)}</span>
                        </div>
                    </div>
                </div>

                {/* Expenses Table Card */}
                <div className="bg-white rounded-3xl border border-gray-100/80 shadow-xs overflow-hidden shadow-2xs">
                    <div className="px-5 py-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <Receipt className="w-4 h-4 text-rose-600" />
                            <h3 className="font-semibold text-sm text-gray-900">Daftar Transaksi Pengeluaran</h3>
                        </div>
                        <span className="text-xs text-gray-500 font-medium">
                            Total: {expenses.total || expenses.data?.length || 0} Data
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50/50 text-[11px] font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                                <tr>
                                    <th className="px-5 py-3">Tanggal</th>
                                    <th className="px-5 py-3">Kategori</th>
                                    <th className="px-5 py-3">Deskripsi & Catatan</th>
                                    <th className="px-5 py-3">Metode Bayar</th>
                                    <th className="px-5 py-3 text-center">Struk / Bukti</th>
                                    <th className="px-5 py-3 text-right">Nominal</th>
                                    <th className="px-5 py-3 text-right no-print">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {(!expenses.data || expenses.data.length === 0) ? (
                                    <tr>
                                        <td colSpan="7" className="px-5 py-10 text-center text-gray-400 text-xs">
                                            Tidak ada catatan pengeluaran pada rentang waktu ini.
                                        </td>
                                    </tr>
                                ) : (
                                    expenses.data.map((exp) => {
                                        const badgeColor = categoryBadgeColors[exp.category] || 'bg-gray-100 text-gray-700 border-gray-300';
                                        return (
                                            <tr key={exp.id} className="hover:bg-gray-50/80 transition-colors">
                                                <td className="px-5 py-3.5 text-xs text-gray-700 whitespace-nowrap font-medium">
                                                    {new Date(exp.expense_date).toLocaleDateString('id-ID', {
                                                        day: 'numeric',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </td>
                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${badgeColor}`}>
                                                        {exp.category}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <p className="text-xs font-semibold text-gray-900">{exp.description}</p>
                                                    {exp.notes && (
                                                        <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{exp.notes}</p>
                                                    )}
                                                    <p className="text-[10px] text-gray-400 mt-0.5">Oleh: {exp.creator?.name || 'Staf Gym'}</p>
                                                </td>
                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    <span className="text-xs uppercase font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                                        {exp.payment_method || 'CASH'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-center whitespace-nowrap">
                                                    {exp.receipt_photo ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => setPreviewReceipt(exp.receipt_photo)}
                                                            className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded transition-colors font-medium"
                                                        >
                                                            <Image className="w-3.5 h-3.5" /> Lihat Struk
                                                        </button>
                                                    ) : (
                                                        <span className="text-[11px] text-gray-400 italic">—</span>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3.5 text-right font-semibold text-rose-600 whitespace-nowrap">
                                                    - {formatIDR(exp.amount)}
                                                </td>
                                                <td className="px-5 py-3.5 text-right whitespace-nowrap no-print">
                                                    {canManageExpense ? (
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => handleOpenEditModal(exp)}
                                                                className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                                title="Edit Pengeluaran"
                                                            >
                                                                <Edit3 className="w-3.5 h-3.5" />
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => setDeletingExpense(exp)}
                                                                className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                                                title="Hapus Pengeluaran"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-[11px] text-gray-400 italic">—</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    <Pagination paginator={expenses} only={['expenses']} preserveScroll preserveState />
                </div>
            </div>

            {/* Modal Tambah Pengeluaran */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                            <h3 className="text-base font-bold text-gray-900">Catat Pengeluaran Baru</h3>
                            <button
                                onClick={() => setIsAddModalOpen(false)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateSubmit} className="space-y-4">
                            {/* Kategori */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Kategori Pengeluaran <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={createForm.data.category}
                                    onChange={(e) => createForm.setData('category', e.target.value)}
                                    className="w-full bg-white border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-3 py-2 text-xs text-gray-900 font-medium"
                                    required
                                >
                                    {categories.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Deskripsi */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Deskripsi Pengeluaran <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Contoh: Tagihan Listrik PLN Bulan Agustus / Beli Air Galon"
                                    value={createForm.data.description}
                                    onChange={(e) => createForm.setData('description', e.target.value)}
                                    className="w-full bg-white border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-3 py-2 text-xs text-gray-900"
                                    required
                                />
                                {createForm.errors.description && (
                                    <p className="text-[11px] text-rose-500 mt-1">{createForm.errors.description}</p>
                                )}
                            </div>

                            {/* Grid: Nominal & Tanggal */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        Nominal Biaya (Rp) <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-xs text-gray-400 font-bold">Rp</span>
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            placeholder="0"
                                            value={formatCurrencyDisplay(createForm.data.amount)}
                                            onChange={(e) => createForm.setData('amount', parseCurrencyInput(e.target.value))}
                                            className="w-full bg-white border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg pl-9 pr-3 py-2 text-xs text-gray-900 font-semibold"
                                            required
                                        />
                                    </div>
                                    {createForm.errors.amount && (
                                        <p className="text-[11px] text-rose-500 mt-1">{createForm.errors.amount}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        Tanggal Pengeluaran <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={createForm.data.expense_date}
                                        onChange={(e) => createForm.setData('expense_date', e.target.value)}
                                        className="w-full bg-white border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-3 py-2 text-xs text-gray-900 cursor-pointer"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Metode Pembayaran */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Metode Pembayaran <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        value={createForm.data.payment_method}
                                        onChange={(e) => createForm.setData('payment_method', e.target.value)}
                                        className="w-full bg-white border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-3 py-2 text-xs text-gray-900 font-medium cursor-pointer appearance-none pr-8"
                                        required
                                    >
                                        <option value="cash">Tunai (Cash)</option>
                                        <option value="transfer">Transfer Bank</option>
                                        <option value="qris">QRIS</option>
                                        <option value="debit">Kartu Debit</option>
                                        <option value="credit">Kartu Kredit</option>
                                    </select>
                                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-2.5 pointer-events-none" />
                                </div>
                            </div>

                            {/* Upload Bukti Struk Foto */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Foto Bukti / Struk Pembayaran (Opsional)
                                </label>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    accept="image/*"
                                    onChange={(e) => createForm.setData('receipt_photo', e.target.files[0])}
                                    className="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-800 hover:file:bg-gray-200 cursor-pointer border border-gray-200 rounded-lg p-1"
                                />
                                <p className="text-[10px] text-gray-400 mt-1">Format: JPG, PNG, WEBP (Maksimal 5MB)</p>
                            </div>

                            {/* Catatan Tambahan */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Catatan / Keterangan Tambahan
                                </label>
                                <textarea
                                    rows="2"
                                    placeholder="Contoh: No faktur #98231, dibayarkan via rekening BCA Gym"
                                    value={createForm.data.notes}
                                    onChange={(e) => createForm.setData('notes', e.target.value)}
                                    className="w-full bg-white border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-3 py-2 text-xs text-gray-900 placeholder-gray-400"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={createForm.processing}
                                    className="px-4 py-2 bg-blue-600 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                                >
                                    {createForm.processing ? 'Menyimpan...' : 'Simpan Pengeluaran'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Edit Pengeluaran */}
            {editingExpense && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
                            <h3 className="text-base font-bold text-gray-900">Edit Data Pengeluaran</h3>
                            <button
                                onClick={() => setEditingExpense(null)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleEditSubmit} className="space-y-4">
                            {/* Kategori */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Kategori Pengeluaran <span className="text-rose-500">*</span>
                                </label>
                                <select
                                    value={editForm.data.category}
                                    onChange={(e) => editForm.setData('category', e.target.value)}
                                    className="w-full bg-white border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-3 py-2 text-xs text-gray-900 font-medium"
                                    required
                                >
                                    {categories.map((cat) => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Deskripsi */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Deskripsi Pengeluaran <span className="text-rose-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={editForm.data.description}
                                    onChange={(e) => editForm.setData('description', e.target.value)}
                                    className="w-full bg-white border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-3 py-2 text-xs text-gray-900"
                                    required
                                />
                            </div>

                            {/* Grid: Nominal & Tanggal */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        Nominal Biaya (Rp) <span className="text-rose-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2 text-xs text-gray-400 font-bold">Rp</span>
                                        <input
                                            type="text"
                                            inputMode="decimal"
                                            value={formatCurrencyDisplay(editForm.data.amount)}
                                            onChange={(e) => editForm.setData('amount', parseCurrencyInput(e.target.value))}
                                            className="w-full bg-white border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg pl-9 pr-3 py-2 text-xs text-gray-900 font-semibold"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        Tanggal Pengeluaran <span className="text-rose-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={editForm.data.expense_date}
                                        onChange={(e) => editForm.setData('expense_date', e.target.value)}
                                        className="w-full bg-white border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-3 py-2 text-xs text-gray-900 cursor-pointer"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Metode Pembayaran */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Metode Pembayaran <span className="text-rose-500">*</span>
                                </label>
                                <div className="relative">
                                    <select
                                        value={editForm.data.payment_method}
                                        onChange={(e) => editForm.setData('payment_method', e.target.value)}
                                        className="w-full bg-white border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-3 py-2 text-xs text-gray-900 font-medium cursor-pointer appearance-none pr-8"
                                        required
                                    >
                                        <option value="cash">Tunai (Cash)</option>
                                        <option value="transfer">Transfer Bank</option>
                                        <option value="qris">QRIS</option>
                                        <option value="debit">Kartu Debit</option>
                                        <option value="credit">Kartu Kredit</option>
                                    </select>
                                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-2.5 top-2.5 pointer-events-none" />
                                </div>
                            </div>

                            {/* Upload Bukti Struk Foto */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Ganti Foto Struk (Opsional)
                                </label>
                                {editingExpense.receipt_photo && (
                                    <div className="mb-2 flex items-center gap-2 p-2 bg-gray-50 rounded-lg border border-gray-200">
                                        <img
                                            src={editingExpense.receipt_photo}
                                            alt="Struk"
                                            className="w-10 h-10 object-cover rounded border border-gray-200"
                                        />
                                        <span className="text-xs text-gray-600">Struk saat ini tersimpan</span>
                                    </div>
                                )}
                                <input
                                    type="file"
                                    ref={editFileInputRef}
                                    accept="image/*"
                                    onChange={(e) => editForm.setData('receipt_photo', e.target.files[0])}
                                    className="block w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gray-100 file:text-gray-800 hover:file:bg-gray-200 cursor-pointer border border-gray-200 rounded-lg p-1"
                                />
                            </div>

                            {/* Catatan Tambahan */}
                            <div>
                                <label className="block text-xs font-semibold text-gray-700 mb-1">
                                    Catatan / Keterangan Tambahan
                                </label>
                                <textarea
                                    rows="2"
                                    value={editForm.data.notes}
                                    onChange={(e) => editForm.setData('notes', e.target.value)}
                                    className="w-full bg-white border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 rounded-lg px-3 py-2 text-xs text-gray-900"
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setEditingExpense(null)}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={editForm.processing}
                                    className="px-4 py-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-2xs"
                                >
                                    {editForm.processing ? 'Menyimpan...' : 'Perbarui Pengeluaran'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Preview Struk */}
            {previewReceipt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs" onClick={() => setPreviewReceipt(null)}>
                    <div className="relative max-w-2xl w-full bg-white rounded-2xl p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
                            <h4 className="text-sm font-bold text-gray-900">Lampiran Struk / Bukti Pembayaran</h4>
                            <button
                                onClick={() => setPreviewReceipt(null)}
                                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="max-h-[75vh] overflow-auto flex items-center justify-center bg-gray-50 rounded-xl p-2">
                            <img
                                src={previewReceipt}
                                alt="Struk Pengeluaran"
                                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-sm"
                            />
                        </div>
                        <div className="mt-3 text-right">
                            <a
                                href={previewReceipt}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium"
                            >
                                Buka di Tab Baru
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Konfirmasi Hapus */}
            {deletingExpense && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-gray-100">
                        <div className="w-10 h-10 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
                            <AlertCircle className="w-5 h-5" />
                        </div>
                        <h4 className="text-base font-bold text-gray-900">Hapus Catatan Pengeluaran?</h4>
                        <p className="text-xs text-gray-500 mt-1">
                            Anda akan menghapus pengeluaran <span className="font-semibold text-gray-800">"{deletingExpense.description}"</span> sebesar <span className="font-semibold text-rose-600">{formatIDR(deletingExpense.amount)}</span>. Data yang dihapus tidak dapat dipulihkan.
                        </p>
                        <div className="flex items-center justify-end gap-2 mt-5">
                            <button
                                type="button"
                                onClick={() => setDeletingExpense(null)}
                                className="px-3.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-semibold transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={handleDeleteConfirm}
                                className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-2xs"
                            >
                                Ya, Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}

import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Pagination from '@/Components/Pagination';
import { Download, Printer, Filter, DollarSign, CreditCard, ShoppingCart, TrendingUp, Calendar, ArrowUpRight, QrCode, BarChart3, ChevronDown, Wallet, Receipt } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from 'recharts';

export default function ReportsIndex({ summary, commissionSummary = {}, ptCommissionByTrainer = [], ptCommissionList = [], memCommissionBySales = [], memCommissionList = [], sales, membershipTransactions, chartData, weeklyVisitData = [], monthlyVisitData = [], yearlyVisitData = [], filters }) {
    const [startDate, setStartDate] = useState(filters.start_date);
    const [endDate, setEndDate] = useState(filters.end_date);
    const [selectedYear, setSelectedYear] = useState(filters.year || new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(filters.month || (new Date().getMonth() + 1));
    const isTrakinReport = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('tab') === 'kunjungan';
    const [reportType, setReportType] = useState(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            if (params.get('tab') === 'kunjungan') return 'kunjungan';
        }
        return 'all';
    }); // 'all', 'membership', 'kasir' | 'kunjungan', 'komisi'
    const [visitPeriod, setVisitPeriod] = useState('bulanan'); // 'bulanan', 'tahunan'
    const [isPresetDropdownOpen, setIsPresetDropdownOpen] = useState(false);
    const [commissionDetail, setCommissionDetail] = useState(null);

    const handleFilter = (e) => {
        e.preventDefault();
        router.get('/reports', { start_date: startDate, end_date: endDate, year: selectedYear }, { preserveState: true });
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
        router.get('/reports', { start_date: s, end_date: e, year: selectedYear }, { preserveState: true });
    };

    const handleYearChange = (yr) => {
        setSelectedYear(yr);
        router.get('/reports', { start_date: startDate, end_date: endDate, year: yr }, { preserveState: true });
    };

    const handlePrint = () => {
        document.body.classList.remove('printing-receipt');
        window.print();
    };

    const handleExportCSV = () => {
        let csvContent = "\uFEFF"; // UTF-8 BOM
        let filename = `Laporan_Trakin_${reportType}_${startDate}_sd_${endDate}.csv`;

        if (reportType === 'kunjungan') {
            csvContent += "PERIODE WAKTU,TOTAL CHECK-IN\n";
            activeVisitData.forEach(row => {
                csvContent += `"${row.full_label}",${row.count}\n`;
            });
        } else if (reportType === 'membership') {
            csvContent += "NO TRANSACTION,MEMBER,PAKET GYM,WAKTU TRANSAKSI,METODE BAYAR,TOTAL AMOUNT\n";
            (membershipTransactions.data || []).forEach(tx => {
                csvContent += `"${tx.transaction_code}","${tx.member?.full_name || '-'}","${tx.subscription?.package?.name || 'Paket Gym'}","${tx.created_at}","${tx.payment_method.toUpperCase()}",${tx.amount}\n`;
            });
        } else if (reportType === 'kasir') {
            csvContent += "NO INVOICE,STAF KASIR,WAKTU TRANSAKSI,METODE BAYAR,TOTAL TRANSAKSI\n";
            (sales.data || []).forEach(s => {
                csvContent += `"${s.invoice_number}","${s.cashier?.name || 'Staff POS'}","${s.created_at}","${s.payment_method.toUpperCase()}",${s.total_amount}\n`;
            });
        } else {
            csvContent += "RINGKASAN KEUSANGAN TRAKIN GYM\n";
            csvContent += `Periode,${startDate} s/d ${endDate}\n`;
            csvContent += `Total Omset POS,${summary.posTotal}\n`;
            csvContent += `Total Omset Membership,${summary.membershipTotal}\n`;
            csvContent += `Grand Total Pendapatan,${summary.totalRevenue}\n`;
            csvContent += `Total Pengeluaran,${summary.expensesTotal}\n`;
            csvContent += `Laba Bersih,${summary.netIncome}\n\n`;

            csvContent += "RINCIAN TRANSAKSI POS KASIR\n";
            csvContent += "NO INVOICE,STAF KASIR,WAKTU TRANSAKSI,METODE BAYAR,TOTAL TRANSAKSI\n";
            (sales.data || []).forEach(s => {
                csvContent += `"${s.invoice_number}","${s.cashier?.name || 'Staff POS'}","${s.created_at}","${s.payment_method.toUpperCase()}",${s.total_amount}\n`;
            });
        }

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatIDR = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

    const formatYAxisTick = (val) => {
        if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)} M`;
        if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(0)} Jt`;
        if (val >= 1_000) return `${(val / 1_000).toFixed(0)} rb`;
        return val;
    };

    // Active Visit Data based on visitPeriod
    const activeVisitData = visitPeriod === 'bulanan'
        ? monthlyVisitData.map(d => ({ label: d.month_name, full_label: `${d.month_name} ${d.year}`, count: d.count }))
        : yearlyVisitData.map(d => ({ label: d.year, full_label: `Tahun ${d.year}`, count: d.count }));

    const totalVisitCount = activeVisitData.reduce((acc, curr) => acc + curr.count, 0);
    const avgVisitCount = activeVisitData.length > 0 ? Math.round(totalVisitCount / activeVisitData.length) : 0;

    return (
        <AdminLayout title="Laporan">
            <Head title="Laporan Finansial & Kunjungan" />
            <div className="space-y-6">
                {/* Printable Report Header */}
                <div className="hidden print:block mb-6 border-b border-gray-300 pb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">TRAKIN GYM MANAGEMENT</h1>
                            <p className="text-xs text-gray-600">Laporan Resmi Keuangan, POS, dan Kunjungan Member</p>
                        </div>
                        <div className="text-right text-xs text-gray-500">
                            <p><span className="font-semibold text-gray-900">Periode:</span> {startDate} s/d {endDate}</p>
                            <p><span className="font-semibold text-gray-900">Dicetak:</span> {new Date().toLocaleString('id-ID')}</p>
                        </div>
                    </div>
                </div>

                {/* Header & Filter Toolbar */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4 no-print">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <h2 className="text-base font-semibold text-gray-900">{isTrakinReport ? 'Laporan Trakin' : 'Laporan Keuangan'}</h2>
                            <p className="text-xs text-gray-500">{isTrakinReport ? 'Laporan kunjungan, komisi & aktivitas member' : 'Ringkasan omset finansial & transaksi kasir'}</p>
                        </div>
                        <div className="flex items-center gap-2 self-start sm:self-auto">
                            <button
                                type="button"
                                onClick={handlePrint}
                                className="px-3.5 py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                            >
                                <Printer className="w-3.5 h-3.5" /> Cetak PDF
                            </button>
                            <button
                                type="button"
                                onClick={handleExportCSV}
                                className="px-3.5 py-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                            >
                                <Download className="w-3.5 h-3.5 text-gray-500" /> Export Excel (CSV)
                            </button>
                        </div>
                    </div>

                    {/* Filter Controls Bar */}
                    <div className="pt-4 border-t border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                        {isTrakinReport ? (
                            <div className="flex flex-wrap items-center bg-gray-100 p-1 rounded-lg gap-1">
                                <button
                                    type="button"
                                    onClick={() => setReportType('kunjungan')}
                                    className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors ${reportType === 'kunjungan' ? 'bg-white text-gray-900 shadow-xs font-semibold' : 'text-gray-600 hover:text-gray-900'}`}
                                >
                                    Laporan Kunjungan
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setReportType('komisi')}
                                    className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors ${reportType === 'komisi' ? 'bg-white text-gray-900 shadow-xs font-semibold' : 'text-gray-600 hover:text-gray-900'}`}
                                >
                                    Laporan Komisi
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-wrap items-center bg-gray-100 p-1 rounded-lg gap-1">
                                <button
                                    type="button"
                                    onClick={() => setReportType('all')}
                                    className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors ${reportType === 'all' ? 'bg-white text-gray-900 shadow-xs font-semibold' : 'text-gray-600 hover:text-gray-900'}`}
                                >
                                    Ringkasan Keuangan
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setReportType('membership')}
                                    className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors ${reportType === 'membership' ? 'bg-white text-gray-900 shadow-xs font-semibold' : 'text-gray-600 hover:text-gray-900'}`}
                                >
                                    Transaksi Membership
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setReportType('kasir')}
                                    className={`px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors ${reportType === 'kasir' ? 'bg-white text-gray-900 shadow-xs font-semibold' : 'text-gray-600 hover:text-gray-900'}`}
                                >
                                    Transaksi POS Kasir
                                </button>
                            </div>
                        )}

                        {/* Pill-Style Date Filter for Financial Reports */}
                        {['all', 'membership', 'kasir'].includes(reportType) && (
                            <div className="flex flex-wrap items-center gap-2">
                                {/* Periode Cepat Dropdown — sinkron dengan Pengeluaran */}
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setIsPresetDropdownOpen(!isPresetDropdownOpen)}
                                        className={`inline-flex items-center gap-1.5 border rounded-full px-3.5 py-1.5 text-xs font-medium transition-all shadow-2xs ${isPresetDropdownOpen
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

                                <form onSubmit={handleFilter} className="flex flex-wrap items-center gap-2">
                                    <div className="relative inline-flex items-center bg-white border border-gray-200 hover:border-gray-300 rounded-full px-3.5 py-1.5 shadow-2xs transition-all">
                                        <span className="text-xs font-bold text-gray-900 mr-1.5">Tanggal:</span>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="bg-transparent text-xs text-gray-600 font-medium focus:outline-none cursor-pointer"
                                        />
                                        <span className="text-xs text-gray-400 mx-1">s/d</span>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="bg-transparent text-xs text-gray-600 font-medium focus:outline-none cursor-pointer"
                                        />
                                    </div>
                                    <button type="submit" className="px-4 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold rounded-full shadow-2xs transition-colors">
                                        Terapkan
                                    </button>
                                </form>
                            </div>
                        )}
                        {reportType === 'komisi' && (
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="relative">
                                    <button
                                        type="button"
                                        onClick={() => setIsPresetDropdownOpen(!isPresetDropdownOpen)}
                                        className={`inline-flex items-center gap-1.5 border rounded-full px-3.5 py-1.5 text-xs font-medium transition-all shadow-2xs ${isPresetDropdownOpen
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
                                            <div className="fixed inset-0 z-20" onClick={() => setIsPresetDropdownOpen(false)} />
                                            <div className="absolute left-0 mt-1.5 w-44 bg-white border border-gray-200 rounded-xl shadow-lg z-30 py-1 text-xs">
                                                <button type="button" onClick={() => { handleQuickPreset('month'); setIsPresetDropdownOpen(false); }} className="w-full text-left px-3.5 py-2 hover:bg-gray-50 text-gray-700 font-medium">Bulan Ini</button>
                                                <button type="button" onClick={() => { handleQuickPreset('30days'); setIsPresetDropdownOpen(false); }} className="w-full text-left px-3.5 py-2 hover:bg-gray-50 text-gray-700 font-medium">30 Hari Terakhir</button>
                                                <button type="button" onClick={() => { handleQuickPreset('today'); setIsPresetDropdownOpen(false); }} className="w-full text-left px-3.5 py-2 hover:bg-gray-50 text-gray-700 font-medium">Hari Ini</button>
                                            </div>
                                        </>
                                    )}
                                </div>
                                <form onSubmit={handleFilter} className="flex flex-wrap items-center gap-2">
                                    <div className="relative inline-flex items-center bg-white border border-gray-200 hover:border-gray-300 rounded-full px-3.5 py-1.5 shadow-2xs transition-all">
                                        <span className="text-xs font-bold text-gray-900 mr-1.5">Tanggal:</span>
                                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="bg-transparent text-xs text-gray-600 font-medium focus:outline-none cursor-pointer" />
                                        <span className="text-xs text-gray-400 mx-1">s/d</span>
                                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="bg-transparent text-xs text-gray-600 font-medium focus:outline-none cursor-pointer" />
                                    </div>
                                    <button type="submit" className="px-4 py-1.5 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold rounded-full shadow-2xs transition-colors">Terapkan</button>
                                </form>
                            </div>
                        )}
                    </div>
                </div>

                {/* Financial Reports (Ringkasan Keuangan, Membership, Kasir) */}
                {['all', 'membership', 'kasir'].includes(reportType) && (
                    <>
                        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${reportType === 'all' ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
                            {(reportType === 'all' || reportType === 'kasir') && (
                                <div className="bg-white rounded-xl border border-gray-200 p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-gray-500">Pendapatan POS</span>
                                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                            <ShoppingCart className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <p className="text-2xl font-semibold text-gray-900 mt-2">{formatIDR(summary.posTotal)}</p>
                                    <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                                        <ArrowUpRight className="w-3 h-3 text-green-500" /> Penjualan produk & ritel
                                    </p>
                                </div>
                            )}

                            {(reportType === 'all' || reportType === 'membership') && (
                                <div className="bg-white rounded-xl border border-gray-200 p-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-medium text-gray-500">Pendapatan Membership</span>
                                        <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                                            <CreditCard className="w-4 h-4" />
                                        </div>
                                    </div>
                                    <p className="text-2xl font-semibold text-gray-900 mt-2">{formatIDR(summary.membershipTotal)}</p>
                                    <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1">
                                        <ArrowUpRight className="w-3 h-3 text-green-500" /> Registrasi & perpanjangan
                                    </p>
                                </div>
                            )}

                            {reportType === 'all' && (
                                <>
                                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium text-gray-500">Total Omset Kotor</span>
                                            <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                                                <DollarSign className="w-4 h-4" />
                                            </div>
                                        </div>
                                        <p className="text-2xl font-semibold text-gray-900 mt-2">{formatIDR(summary.totalRevenue)}</p>
                                        <p className="text-[11px] text-gray-400 mt-1">Gabungan POS + Membership + PT</p>
                                    </div>

                                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium text-gray-500">Total Pengeluaran</span>
                                            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                                                <Wallet className="w-4 h-4" />
                                            </div>
                                        </div>
                                        <p className="text-2xl font-semibold text-gray-900 mt-2">{formatIDR(summary.expensesTotal || 0)}</p>
                                        <p className="text-[11px] text-gray-400 mt-1">
                                            {(summary.expensesTotal || 0) === 0 ? 'Tidak ada pengeluaran' : 'Periode terpilih'}
                                        </p>
                                    </div>

                                    <div className="bg-white rounded-xl border border-gray-200 p-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium text-gray-500">Estimasi Laba Bersih</span>
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${ (summary.netIncome || 0) < 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                <TrendingUp className="w-4 h-4" />
                                            </div>
                                        </div>
                                        <p className={`text-2xl font-semibold mt-2 ${(summary.netIncome || 0) < 0 ? 'text-rose-600' : 'text-gray-900'}`}>{formatIDR(summary.netIncome || 0)}</p>
                                        <p className="text-[11px] text-gray-400 mt-1">
                                            {(summary.expensesTotal || 0) === 0 ? 'Tidak ada pengeluaran pada periode ini' : 'Sesudah dipotong pengeluaran'}
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="bg-white rounded-xl border border-gray-200 p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900">
                                        {reportType === 'all' && 'Grafik Tren Penjualan & Membership'}
                                        {reportType === 'membership' && 'Grafik Tren Pendapatan Membership'}
                                        {reportType === 'kasir' && 'Grafik Tren Penjualan POS Kasir'}
                                    </h3>
                                    <p className="text-xs text-gray-400">Visualisasi omset harian berdasarkan rentang waktu terpilih</p>
                                </div>
                            </div>

                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorPos" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorMem" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.15} />
                                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="day" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={15} />
                                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={formatYAxisTick} width={55} />
                                        <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px' }} formatter={(val) => formatIDR(val)} />
                                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                                        {(reportType === 'all' || reportType === 'kasir') && (
                                            <Area type="monotone" name="POS Kasir" dataKey="POS Kasir" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorPos)" />
                                        )}
                                        {(reportType === 'all' || reportType === 'membership') && (
                                            <Area type="monotone" name="Membership" dataKey="Membership" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorMem)" />
                                        )}
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </>
                )}

                {/* Single Unified Laporan Kunjungan Tab */}
                {reportType === 'kunjungan' && (
                    <>
                        {/* Pill-Style Sub Filter Toolbar inside Laporan Kunjungan */}
                        <div className="flex flex-wrap items-center gap-2.5">
                            {/* Pill 1: Periode Kunjungan */}
                            <div className="relative inline-flex items-center bg-white border border-gray-200 hover:border-gray-300 rounded-full px-3.5 py-1.5 shadow-2xs transition-all cursor-pointer">
                                <span className="text-xs font-bold text-gray-900 mr-1.5">Periode:</span>
                                <select
                                    value={visitPeriod}
                                    onChange={(e) => setVisitPeriod(e.target.value)}
                                    className="bg-transparent text-xs text-gray-600 font-medium focus:outline-none cursor-pointer pr-5 appearance-none capitalize"
                                >
                                    <option value="bulanan">Bulanan</option>
                                    <option value="tahunan">Tahunan</option>
                                </select>
                                <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-3 pointer-events-none" />
                            </div>

                            {/* Pill 2: Pilih Tahun */}
                            {visitPeriod === 'bulanan' && (
                                <div className="relative inline-flex items-center bg-white border border-gray-200 hover:border-gray-300 rounded-full px-3.5 py-1.5 shadow-2xs transition-all cursor-pointer">
                                    <span className="text-xs font-bold text-gray-900 mr-1.5">Tahun:</span>
                                    <select
                                        value={selectedYear}
                                        onChange={(e) => handleYearChange(Number(e.target.value))}
                                        className="bg-transparent text-xs text-gray-600 font-medium focus:outline-none cursor-pointer pr-5 appearance-none"
                                    >
                                        <option value={2025}>2025</option>
                                        <option value={2026}>2026</option>
                                        <option value={2027}>2027</option>
                                    </select>
                                    <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-3 pointer-events-none" />
                                </div>
                            )}
                        </div>

                        {/* Stat Cards Grid (Identical Layout & Styling) */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div className="bg-white rounded-xl border border-gray-200 p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-gray-500">
                                        {visitPeriod === 'mingguan' ? 'Total Kunjungan Mingguan' : visitPeriod === 'bulanan' ? 'Total Kunjungan Bulanan' : 'Akumulasi Kunjungan Tahunan'}
                                    </span>
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                                        <QrCode className="w-4 h-4" />
                                    </div>
                                </div>
                                <p className="text-2xl font-semibold text-gray-900 mt-2">
                                    {totalVisitCount}
                                    <span className="text-xs font-normal text-gray-400 ml-1">Check-in</span>
                                </p>
                                <p className="text-[11px] text-gray-400 mt-1">
                                    {visitPeriod === 'tahunan' ? 'Akumulasi seluruh tahun' : `Tahun ${selectedYear}`}
                                </p>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-200 p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-gray-500">Jumlah Periode Terekam</span>
                                    <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                                        <Calendar className="w-4 h-4" />
                                    </div>
                                </div>
                                <p className="text-2xl font-semibold text-gray-900 mt-2">
                                    {activeVisitData.length}
                                    <span className="text-xs font-normal text-gray-400 ml-1">
                                        {visitPeriod === 'mingguan' ? 'Minggu' : visitPeriod === 'bulanan' ? 'Bulan' : 'Tahun'}
                                    </span>
                                </p>
                                <p className="text-[11px] text-gray-400 mt-1">Total unit periode</p>
                            </div>

                            <div className="bg-white rounded-xl border border-gray-200 p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-gray-500">Rata-rata Kunjungan</span>
                                    <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                                        <TrendingUp className="w-4 h-4" />
                                    </div>
                                </div>
                                <p className="text-2xl font-semibold text-gray-900 mt-2">
                                    {avgVisitCount}
                                    <span className="text-xs font-normal text-gray-400 ml-1">
                                        Check-in / {visitPeriod === 'mingguan' ? 'minggu' : visitPeriod === 'bulanan' ? 'bulan' : 'tahun'}
                                    </span>
                                </p>
                                <p className="text-[11px] text-gray-400 mt-1">Estimasi rata-rata</p>
                            </div>
                        </div>

                        {/* Identical Chart Card */}
                        <div className="bg-white rounded-xl border border-gray-200 p-5">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900">
                                        Grafik Tren Kunjungan {visitPeriod === 'mingguan' ? `Mingguan (${selectedYear})` : visitPeriod === 'bulanan' ? `Bulanan (${selectedYear})` : 'Tahunan'}
                                    </h3>
                                    <p className="text-xs text-gray-400">Visualisasi total check-in member berdasarkan periode terpilih</p>
                                </div>
                            </div>

                            <div className="h-64 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={activeVisitData}>
                                        <defs>
                                            <linearGradient id="colorVisitSingle" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                        <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={15} />
                                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                                        <Tooltip contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', borderRadius: '8px', fontSize: '12px' }} />
                                        <Area type="monotone" name="Kunjungan" dataKey="count" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorVisitSingle)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Identical Table Card */}
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                                <h3 className="font-semibold text-sm text-gray-900">
                                    Rincian Tabel Kunjungan {visitPeriod === 'bulanan' ? `Per Bulan (${selectedYear})` : 'Per Tahun'}
                                </h3>
                                <span className="text-xs text-gray-500 font-medium">Total: {activeVisitData.length} Periode</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 text-xs font-medium text-gray-500 border-b border-gray-200">
                                        <tr>
                                            <th className="px-5 py-3">Periode Waktu</th>
                                            <th className="px-5 py-3 text-right">Total Check-in</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {activeVisitData.length === 0 ? (
                                            <tr><td colSpan="2" className="px-5 py-8 text-center text-gray-400 text-xs">Tidak ada data kunjungan.</td></tr>
                                        ) : (
                                            activeVisitData.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-5 py-3.5 text-gray-900 font-medium">{row.full_label}</td>
                                                    <td className="px-5 py-3.5 text-right font-semibold text-gray-900">{row.count} Check-in</td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}

                {/* Laporan Komisi */}
                {reportType === 'komisi' && (
                    <>
                        {/* Summary Cards — klik untuk lihat detail */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            <button type="button" onClick={() => setCommissionDetail({ type: 'pt', title: 'Detail Paket PT', list: ptCommissionList })} className="bg-white rounded-xl border border-gray-200 p-4 text-left hover:border-blue-200 hover:shadow-sm transition-all cursor-pointer">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-gray-500">Komisi PT</span>
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center"><Wallet className="w-4 h-4" /></div>
                                </div>
                                <p className="text-xl font-semibold text-gray-900 mt-2">{formatIDR(commissionSummary.pt_total || 0)}</p>
                                <p className="text-[11px] text-gray-400 mt-1">{commissionSummary.pt_count || 0} paket • Rate {commissionSummary.pt_rate}{commissionSummary.pt_type === 'percent' ? '%' : ' flat'}</p>
                                <p className="text-[10px] text-blue-600 mt-2 font-medium">Klik untuk detail →</p>
                            </button>
                            <button type="button" onClick={() => setCommissionDetail({ type: 'membership', title: 'Detail Closing Membership', list: memCommissionList })} className="bg-white rounded-xl border border-gray-200 p-4 text-left hover:border-amber-200 hover:shadow-sm transition-all cursor-pointer">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-gray-500">Komisi Membership</span>
                                    <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center"><CreditCard className="w-4 h-4" /></div>
                                </div>
                                <p className="text-xl font-semibold text-gray-900 mt-2">{formatIDR(commissionSummary.membership_total || 0)}</p>
                                <p className="text-[11px] text-gray-400 mt-1">{commissionSummary.membership_count || 0} closing • {commissionSummary.membership_type === 'percent' ? commissionSummary.membership_rate+'%' : formatIDR(commissionSummary.membership_rate)+' flat'}</p>
                                <p className="text-[10px] text-amber-600 mt-2 font-medium">Klik untuk detail →</p>
                            </button>
                            <div className="bg-white rounded-xl border border-gray-200 p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-gray-500">Total Komisi</span>
                                    <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center"><DollarSign className="w-4 h-4" /></div>
                                </div>
                                <p className="text-xl font-semibold text-gray-900 mt-2">{formatIDR(commissionSummary.grand_total || 0)}</p>
                                <p className="text-[11px] text-gray-400 mt-1">PT + Membership periode ini</p>
                            </div>
                        </div>

                        {/* PT Commission by Trainer */}
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                                <h3 className="font-semibold text-sm text-gray-900">Komisi PT per Trainer</h3>
                                <span className="text-xs text-gray-500 font-medium">{ptCommissionByTrainer.length} Trainer</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 text-xs font-medium text-gray-500 border-b border-gray-200">
                                        <tr>
                                            <th className="px-5 py-3">Trainer</th>
                                            <th className="px-5 py-3 text-center">Paket</th>
                                            <th className="px-5 py-3 text-right">Omset PT</th>
                                            <th className="px-5 py-3 text-right">Komisi ({commissionSummary.pt_type === 'percent' ? commissionSummary.pt_rate+'%' : 'flat'})</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {ptCommissionByTrainer.length === 0 ? (
                                            <tr><td colSpan="4" className="px-5 py-8 text-center text-gray-400 text-xs">Tidak ada komisi PT di periode ini.</td></tr>
                                        ) : ptCommissionByTrainer.map((row) => (
                                            <tr key={row.trainer_id} onClick={() => setCommissionDetail({ type: 'pt', title: `Detail PT — ${row.trainer_name}`, list: ptCommissionList.filter(x => x.trainer_name === row.trainer_name) })} className="hover:bg-gray-50 transition-colors cursor-pointer">
                                                <td className="px-5 py-3.5 font-medium text-gray-900">{row.trainer_name}</td>
                                                <td className="px-5 py-3.5 text-center text-gray-600">{row.count}</td>
                                                <td className="px-5 py-3.5 text-right text-gray-900">{formatIDR(row.omset)}</td>
                                                <td className="px-5 py-3.5 text-right font-semibold text-blue-600">{formatIDR(row.komisi)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Membership Commission by Sales */}
                        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                            <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                                <h3 className="font-semibold text-sm text-gray-900">Komisi Membership per Sales</h3>
                                <span className="text-xs text-gray-500 font-medium">{memCommissionBySales.length} Sales</span>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 text-xs font-medium text-gray-500 border-b border-gray-200">
                                        <tr>
                                            <th className="px-5 py-3">Sales</th>
                                            <th className="px-5 py-3 text-center">Closing</th>
                                            <th className="px-5 py-3 text-right">Omset Membership</th>
                                            <th className="px-5 py-3 text-right">Komisi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {memCommissionBySales.length === 0 ? (
                                            <tr><td colSpan="4" className="px-5 py-8 text-center text-gray-400 text-xs">Tidak ada komisi membership di periode ini.</td></tr>
                                        ) : memCommissionBySales.map((row) => (
                                            <tr key={row.user_id} onClick={() => setCommissionDetail({ type: 'membership', title: `Detail Closing — ${row.user_name}`, list: memCommissionList.filter(x => x.sales_name === row.user_name) })} className="hover:bg-gray-50 transition-colors cursor-pointer">
                                                <td className="px-5 py-3.5 font-medium text-gray-900">{row.user_name}</td>
                                                <td className="px-5 py-3.5 text-center text-gray-600">{row.count}</td>
                                                <td className="px-5 py-3.5 text-right text-gray-900">{formatIDR(row.omset)}</td>
                                                <td className="px-5 py-3.5 text-right font-semibold text-amber-600">{formatIDR(row.komisi)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Detail Inline Card */}
                        {commissionDetail && (
                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 bg-gray-50">
                                    <h3 className="text-sm font-bold text-gray-900">{commissionDetail.title}</h3>
                                    <button onClick={() => setCommissionDetail(null)} className="text-xs font-medium text-gray-500 hover:text-gray-700">Tutup ✕</button>
                                </div>
                                <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                                    {commissionDetail.list.length === 0 ? (
                                        <p className="p-8 text-center text-xs text-gray-400">Tidak ada data.</p>
                                    ) : commissionDetail.list.map((r) => (
                                        <div key={r.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50">
                                            <div>
                                                <p className="text-xs font-medium text-gray-900">{commissionDetail.type === 'pt' ? `${r.member_name} — ${r.trainer_name}` : `${r.member_name} — ${r.sales_name}`}</p>
                                                <p className="text-[11px] text-gray-400">{commissionDetail.type === 'pt' ? `${r.date} • ${r.total_sessions} sesi` : `${r.transaction_code} • ${r.date}`}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs font-medium text-gray-900">{formatIDR(commissionDetail.type === 'pt' ? r.price_paid : r.amount)}</p>
                                                <p className={`text-[11px] font-semibold ${commissionDetail.type === 'pt' ? 'text-blue-600' : 'text-amber-600'}`}>Komisi {formatIDR(r.komisi)}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* Membership Transactions Table */}
                {!isTrakinReport && (reportType === 'all' || reportType === 'membership') && (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="font-semibold text-sm text-gray-900">Rincian Transaksi Membership</h3>
                            <span className="text-xs text-gray-500 font-medium">Total: {membershipTransactions.total || membershipTransactions.data?.length || 0} Transaksi</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-xs font-medium text-gray-500 border-b border-gray-200">
                                    <tr>
                                        <th className="px-5 py-3">Kode Transaksi</th>
                                        <th className="px-5 py-3">Member</th>
                                        <th className="px-5 py-3">Paket</th>
                                        <th className="px-5 py-3">Waktu Bayar</th>
                                        <th className="px-5 py-3">Metode</th>
                                        <th className="px-5 py-3 text-right">Nominal</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {membershipTransactions.data?.length === 0 ? (
                                        <tr><td colSpan="6" className="px-5 py-8 text-center text-gray-400 text-xs">Tidak ada transaksi membership.</td></tr>
                                    ) : (
                                        membershipTransactions.data?.map((tx) => (
                                            <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-5 py-3.5 font-mono text-xs font-medium text-gray-900">{tx.transaction_code}</td>
                                                <td className="px-5 py-3.5 text-gray-900 font-medium">{tx.member?.full_name || '—'}</td>
                                                <td className="px-5 py-3.5 text-xs text-gray-600">{tx.subscription?.package?.name || 'Paket Gym'}</td>
                                                <td className="px-5 py-3.5 text-xs text-gray-500">{new Date(tx.paid_at || tx.created_at).toLocaleString('id-ID')}</td>
                                                <td className="px-5 py-3.5 text-xs uppercase font-medium text-gray-600">{tx.payment_method}</td>
                                                <td className="px-5 py-3.5 text-right font-semibold text-gray-900">{formatIDR(tx.amount)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <Pagination paginator={membershipTransactions} only={['membershipTransactions']} preserveScroll preserveState />
                    </div>
                )}

                {/* POS Sales Table */}
                {!isTrakinReport && (reportType === 'all' || reportType === 'kasir') && (
                    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="font-semibold text-sm text-gray-900">Rincian Transaksi POS Kasir</h3>
                            <span className="text-xs text-gray-500 font-medium">Total: {sales.total || sales.data?.length || 0} Transaksi</span>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-xs font-medium text-gray-500 border-b border-gray-200">
                                    <tr>
                                        <th className="px-5 py-3">No. Invoice</th>
                                        <th className="px-5 py-3">Kasir Staf</th>
                                        <th className="px-5 py-3">Waktu Transaksi</th>
                                        <th className="px-5 py-3">Metode Bayar</th>
                                        <th className="px-5 py-3 text-right">Total Transaksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {sales.data?.length === 0 ? (
                                        <tr><td colSpan="5" className="px-5 py-8 text-center text-gray-400 text-xs">Tidak ada transaksi kasir.</td></tr>
                                    ) : (
                                        sales.data?.map((s) => (
                                            <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-5 py-3.5 font-mono text-xs font-medium text-gray-900">{s.invoice_number}</td>
                                                <td className="px-5 py-3.5 text-gray-900 font-medium">{s.cashier?.name || 'Kasir Staff'}</td>
                                                <td className="px-5 py-3.5 text-xs text-gray-500">{new Date(s.created_at).toLocaleString('id-ID')}</td>
                                                <td className="px-5 py-3.5 text-xs uppercase font-medium text-gray-600">{s.payment_method}</td>
                                                <td className="px-5 py-3.5 text-right font-semibold text-gray-900">{formatIDR(s.total_amount)}</td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <Pagination paginator={sales} only={['sales']} preserveScroll preserveState />
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
    Wallet, 
    CreditCard, 
    DollarSign, 
    Search, 
    ChevronDown, 
    Check 
} from 'lucide-react';

const AVATAR_COLORS = [
    'bg-blue-100 text-blue-700',
    'bg-emerald-100 text-emerald-700',
    'bg-amber-100 text-amber-700',
    'bg-purple-100 text-purple-700',
    'bg-rose-100 text-rose-700',
    'bg-teal-100 text-teal-700',
];

const getInitials = (name) => {
    if (!name || name === 'Tanpa Trainer' || name === 'Tanpa Komisi') return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const getColorClass = (name) => {
    if (!name) return AVATAR_COLORS[0];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

export default function CommissionReport({
    commissionSummary = {},
    ptCommissionByTrainer = [],
    ptCommissionList = [],
    memCommissionBySales = [],
    memCommissionList = [],
    allCommissionList = [],
    startDate,
    endDate,
    formatIDR,
}) {
    // Filter controls matching reference layout
    const [searchKeyword, setSearchKeyword] = useState('');
    const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'pt', 'membership'
    const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

    // Row selection checkboxes (as in reference image)
    const [selectedRowIds, setSelectedRowIds] = useState(new Set());

    // Dropdown click outside detection
    const statusDropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (statusDropdownRef.current && !statusDropdownRef.current.contains(e.target)) {
                setIsStatusDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Combine all transactions if not already passed
    const rawTransactions = useMemo(() => {
        if (allCommissionList && allCommissionList.length > 0) {
            return allCommissionList;
        }
        const pt = (ptCommissionList || []).map(x => ({
            ...x,
            transaction_code: x.transaction_code || `#PT-${String(x.id).padStart(5, '0')}`,
            staff_name: x.trainer_name,
            staff_photo: x.trainer_photo,
            amount: x.price_paid || 0,
            date: x.date,
            unit_count: x.total_sessions || 1,
            rate_label: `${commissionSummary.pt_rate}${commissionSummary.pt_type === 'percent' ? '%' : ' flat'}`,
            payment_method: x.payment_method || 'Cash',
            type: 'pt',
            type_label: 'Trainer PT',
            status: 'Success',
        }));
        const mem = (memCommissionList || []).map(x => ({
            ...x,
            transaction_code: x.transaction_code,
            staff_name: x.sales_name,
            staff_photo: x.sales_photo,
            amount: x.amount || 0,
            date: x.date,
            unit_count: 1,
            rate_label: `${commissionSummary.membership_rate}${commissionSummary.membership_type === 'percent' ? '%' : ' flat'}`,
            payment_method: x.payment_method || 'Cash',
            type: 'membership',
            type_label: 'Sales Membership',
            status: 'Success',
        }));
        return [...pt, ...mem];
    }, [allCommissionList, ptCommissionList, memCommissionList, commissionSummary]);

    // Filtered transaction list matching search & status
    const filteredTransactions = useMemo(() => {
        return rawTransactions.filter((item) => {
            // Status/Type filter
            if (statusFilter === 'pt' && item.type !== 'pt') return false;
            if (statusFilter === 'membership' && item.type !== 'membership') return false;

            // Search keyword
            if (!searchKeyword) return true;
            const q = searchKeyword.toLowerCase();
            const staffMatch = (item.staff_name || item.trainer_name || item.sales_name || '').toLowerCase().includes(q);
            const memberMatch = (item.member_name || '').toLowerCase().includes(q);
            const codeMatch = (item.transaction_code || '').toLowerCase().includes(q);
            const packageMatch = (item.package_name || '').toLowerCase().includes(q);
            return staffMatch || memberMatch || codeMatch || packageMatch;
        });
    }, [rawTransactions, statusFilter, searchKeyword]);

    // Checkbox selection helpers
    const isAllSelected = filteredTransactions.length > 0 && selectedRowIds.size === filteredTransactions.length;
    const isSomeSelected = selectedRowIds.size > 0 && selectedRowIds.size < filteredTransactions.length;

    const handleToggleSelectAll = () => {
        if (isAllSelected) {
            setSelectedRowIds(new Set());
        } else {
            const allIds = new Set(filteredTransactions.map(t => `${t.type}-${t.id}`));
            setSelectedRowIds(allIds);
        }
    };

    const handleToggleRow = (rowKey) => {
        setSelectedRowIds(prev => {
            const next = new Set(prev);
            if (next.has(rowKey)) {
                next.delete(rowKey);
            } else {
                next.add(rowKey);
            }
            return next;
        });
    };

    return (
        <div className="space-y-4">
            {/* 1. Summary Metric Cards (Clean Trakin Style) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Komisi PT */}
                <div 
                    onClick={() => setStatusFilter(statusFilter === 'pt' ? 'all' : 'pt')}
                    className={`bg-white rounded-xl border p-4 transition-all cursor-pointer ${
                        statusFilter === 'pt' ? 'border-blue-500 shadow-xs ring-1 ring-blue-500/20' : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">Komisi Trainer PT</span>
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Wallet className="w-4 h-4" />
                        </div>
                    </div>
                    <p className="text-2xl font-semibold text-gray-900 mt-2">
                        {formatIDR(commissionSummary.pt_total || 0)}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">
                        {commissionSummary.pt_count || 0} paket terjual
                    </p>
                </div>

                {/* Komisi Membership */}
                <div 
                    onClick={() => setStatusFilter(statusFilter === 'membership' ? 'all' : 'membership')}
                    className={`bg-white rounded-xl border p-4 transition-all cursor-pointer ${
                        statusFilter === 'membership' ? 'border-amber-500 shadow-xs ring-1 ring-amber-500/20' : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">Komisi Sales Membership</span>
                        <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                            <CreditCard className="w-4 h-4" />
                        </div>
                    </div>
                    <p className="text-2xl font-semibold text-gray-900 mt-2">
                        {formatIDR(commissionSummary.membership_total || 0)}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">
                        {commissionSummary.membership_count || 0} closing member
                    </p>
                </div>

                {/* Total Komisi */}
                <div 
                    onClick={() => setStatusFilter('all')}
                    className={`bg-white rounded-xl border p-4 transition-all cursor-pointer ${
                        statusFilter === 'all' ? 'border-purple-300 shadow-xs' : 'border-gray-200 hover:border-gray-300'
                    }`}
                >
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-gray-500">Total Komisi</span>
                        <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                            <DollarSign className="w-4 h-4" />
                        </div>
                    </div>
                    <p className="text-2xl font-semibold text-gray-900 mt-2">
                        {formatIDR(commissionSummary.grand_total || 0)}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">
                        Akumulasi PT + Membership
                    </p>
                </div>
            </div>

            {/* 2. Main Reference Table Container */}
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xs overflow-hidden">
                {/* Reference Toolbar: Search, Date Range, Status Filter, Export buttons */}
                <div className="p-4 border-b border-gray-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                    {/* Left Controls: Search, Select Date Range, Status Dropdown */}
                    <div className="flex flex-wrap items-center gap-2.5 grow">
                        {/* Search Input (Pill input matching reference image) */}
                        <div className="relative w-full sm:w-64">
                            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            <input
                                type="text"
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                placeholder="Cari staf, member, transaksi..."
                                className="w-full pl-9 pr-7 py-2 text-xs bg-white border border-gray-200 hover:border-gray-300 focus:border-gray-400 rounded-xl transition-all focus:outline-none placeholder:text-gray-400 shadow-2xs"
                            />
                            {searchKeyword && (
                                <button
                                    type="button"
                                    onClick={() => setSearchKeyword('')}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                                >
                                    ✕
                                </button>
                            )}
                        </div>

                        {/* Status Dropdown */}
                        <div className="relative" ref={statusDropdownRef}>
                            <button
                                type="button"
                                onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
                                className={`inline-flex items-center gap-2 border rounded-xl px-3.5 py-2 text-xs font-medium transition-all shadow-2xs ${
                                    isStatusDropdownOpen || statusFilter !== 'all'
                                        ? 'bg-gray-50 border-gray-400 text-gray-900 font-semibold'
                                        : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                                }`}
                            >
                                <span>
                                    {statusFilter === 'all' && 'Semua Tipe'}
                                    {statusFilter === 'pt' && 'Trainer PT'}
                                    {statusFilter === 'membership' && 'Sales Membership'}
                                </span>
                                <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isStatusDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isStatusDropdownOpen && (
                                <div className="absolute left-0 mt-2 w-44 bg-white border border-gray-200 rounded-xl shadow-xl z-30 py-1 text-xs">
                                    <button
                                        type="button"
                                        onClick={() => { setStatusFilter('all'); setIsStatusDropdownOpen(false); }}
                                        className={`w-full text-left px-3.5 py-2 hover:bg-gray-50 flex items-center justify-between ${statusFilter === 'all' ? 'font-semibold text-gray-900 bg-gray-50' : 'text-gray-700'}`}
                                    >
                                        <span>Semua Tipe</span>
                                        {statusFilter === 'all' && <Check className="w-3.5 h-3.5 text-gray-900" />}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setStatusFilter('pt'); setIsStatusDropdownOpen(false); }}
                                        className={`w-full text-left px-3.5 py-2 hover:bg-gray-50 flex items-center justify-between ${statusFilter === 'pt' ? 'font-semibold text-blue-700 bg-blue-50/50' : 'text-gray-700'}`}
                                    >
                                        <span>Trainer PT</span>
                                        {statusFilter === 'pt' && <Check className="w-3.5 h-3.5 text-blue-700" />}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setStatusFilter('membership'); setIsStatusDropdownOpen(false); }}
                                        className={`w-full text-left px-3.5 py-2 hover:bg-gray-50 flex items-center justify-between ${statusFilter === 'membership' ? 'font-semibold text-amber-700 bg-amber-50/50' : 'text-gray-700'}`}
                                    >
                                        <span>Sales Membership</span>
                                        {statusFilter === 'membership' && <Check className="w-3.5 h-3.5 text-amber-700" />}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Side: Selection indicator if any rows checked */}
                    {selectedRowIds.size > 0 && (
                        <div className="flex items-center gap-2 self-start lg:self-auto shrink-0">
                            <span className="text-xs text-gray-500 font-medium">
                                {selectedRowIds.size} dipilih
                            </span>
                            <button
                                type="button"
                                onClick={() => setSelectedRowIds(new Set())}
                                className="text-xs text-blue-600 hover:underline"
                            >
                                Reset
                            </button>
                        </div>
                    )}
                </div>

                {/* Table Layout Faithful to Reference Image */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                        <thead className="bg-gray-50/60 text-gray-500 font-medium border-b border-gray-100">
                            <tr>
                                <th className="px-4 py-3.5 w-10 text-center">
                                    <input
                                        type="checkbox"
                                        checked={isAllSelected}
                                        ref={el => {
                                            if (el) el.indeterminate = isSomeSelected;
                                        }}
                                        onChange={handleToggleSelectAll}
                                        className="rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer"
                                    />
                                </th>
                                <th className="px-4 py-3.5">Nama Staf</th>
                                <th className="px-4 py-3.5">ID Transaksi</th>
                                <th className="px-4 py-3.5">Member & Paket</th>
                                <th className="px-4 py-3.5">Tanggal</th>
                                <th className="px-4 py-3.5 text-center">Sesi / Qty</th>
                                <th className="px-4 py-3.5">Rate Komisi</th>
                                <th className="px-4 py-3.5 text-right">Total Omset</th>
                                <th className="px-4 py-3.5 text-right">Komisi</th>
                                <th className="px-4 py-3.5">Metode Bayar</th>
                                <th className="px-4 py-3.5 text-center">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredTransactions.length === 0 ? (
                                <tr>
                                    <td colSpan="11" className="px-5 py-12 text-center text-gray-400 text-xs">
                                        Tidak ada data transaksi komisi pada rentang waktu atau filter ini.
                                    </td>
                                </tr>
                            ) : (
                                filteredTransactions.map((row) => {
                                    const rowKey = `${row.type}-${row.id}`;
                                    const isSelected = selectedRowIds.has(rowKey);
                                    const staffName = row.staff_name || row.trainer_name || row.sales_name || 'Staf';
                                    const staffPhoto = row.staff_photo || row.trainer_photo || row.sales_photo;

                                    return (
                                        <tr
                                            key={rowKey}
                                            onClick={() => handleToggleRow(rowKey)}
                                            className={`transition-colors cursor-pointer ${
                                                isSelected ? 'bg-blue-50/40 hover:bg-blue-50/60' : 'hover:bg-gray-50/80'
                                            }`}
                                        >
                                            {/* Checkbox Column */}
                                            <td className="px-4 py-3.5 text-center" onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    onChange={() => handleToggleRow(rowKey)}
                                                    className="rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer"
                                                />
                                            </td>

                                            {/* Staf (Avatar + Nama) */}
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-2.5">
                                                    {staffPhoto ? (
                                                        <img
                                                            src={staffPhoto}
                                                            alt={staffName}
                                                            className="w-7 h-7 rounded-full object-cover shrink-0 border border-gray-200"
                                                        />
                                                    ) : (
                                                        <div className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-[10px] shrink-0 ${getColorClass(staffName)}`}>
                                                            {getInitials(staffName)}
                                                        </div>
                                                    )}
                                                    <span className="font-medium text-gray-900 truncate max-w-[140px]">
                                                        {staffName}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* ID Transaksi */}
                                            <td className="px-4 py-3.5 text-gray-600 font-mono text-[11px]">
                                                {row.transaction_code || `#TX-${row.id}`}
                                            </td>

                                            {/* Member & Paket */}
                                            <td className="px-4 py-3.5">
                                                <p className="font-medium text-gray-900">{row.member_name}</p>
                                                <p className="text-[11px] text-gray-400 mt-0.5">
                                                    {row.package_name || (row.total_sessions ? `${row.total_sessions} Sesi PT` : 'Paket Gym')}
                                                </p>
                                            </td>

                                            {/* Tanggal */}
                                            <td className="px-4 py-3.5 text-gray-600 font-normal">
                                                {row.date}
                                            </td>

                                            {/* Sesi / Qty */}
                                            <td className="px-4 py-3.5 text-center text-gray-700 font-normal">
                                                {row.unit_count || row.total_sessions || 1}
                                            </td>

                                            {/* Rate Komisi */}
                                            <td className="px-4 py-3.5 text-gray-600">
                                                {row.rate_label}
                                            </td>

                                            {/* Total Omset */}
                                            <td className="px-4 py-3.5 text-right font-medium text-gray-900">
                                                {formatIDR(row.price_paid || row.amount || 0)}
                                            </td>

                                            {/* Komisi */}
                                            <td className="px-4 py-3.5 text-right font-semibold text-gray-900">
                                                {formatIDR(row.komisi)}
                                            </td>

                                            {/* Metode Bayar */}
                                            <td className="px-4 py-3.5 text-gray-600">
                                                {row.payment_method || 'Cash'}
                                            </td>

                                            {/* Status */}
                                            <td className="px-4 py-3.5 text-center">
                                                <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-600 border border-emerald-200/60">
                                                    Success
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Table Bottom Footer */}
                <div className="px-5 py-3.5 border-t border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                        <span>
                            Menampilkan <strong>{filteredTransactions.length}</strong> transaksi
                        </span>
                        {selectedRowIds.size > 0 && (
                            <button
                                type="button"
                                onClick={() => setSelectedRowIds(new Set())}
                                className="text-blue-600 hover:underline text-xs"
                            >
                                (Batalkan pilihan)
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Pagination from '@/Components/Pagination';
import { Search, LogOut, Users, Clock } from 'lucide-react';

export default function AttendanceIndex({ attendances, currentlyCheckedInCount = 0, filters }) {
    const [search, setSearch] = useState(filters.search || '');
    const [date, setDate] = useState(filters.date || new Date().toISOString().split('T')[0]);

    const handleFilter = (e) => {
        e.preventDefault();
        router.get('/attendance', { search, date }, { preserveState: true });
    };

    const handleCheckOutAll = () => {
        if (confirm(`Apakah Anda yakin ingin melakukan Check-out Massal untuk ${currentlyCheckedInCount} member yang aktif saat ini?`)) {
            router.post('/attendance/check-out-all', {}, { preserveState: true });
        }
    };

    return (
        <AdminLayout title="Kehadiran Member">
            <Head title="Riwayat Kehadiran" />
            <div className="space-y-4">
                {/* Header Banner */}
                <div className="bg-white rounded-3xl border border-gray-100/80 shadow-xs p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                    <div>
                        <h2 className="text-base font-semibold text-gray-900">Riwayat Presensi & Check-in Gym</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Sistem dilengkapi Auto Check-Out otomatis setelah 3 jam</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="px-3 py-1.5 bg-green-50 border border-green-200 rounded-lg text-xs font-semibold text-green-700 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5" />
                            <span>Aktif Latihan: {currentlyCheckedInCount} Member</span>
                        </div>

                        {currentlyCheckedInCount > 0 && (
                            <button
                                type="button"
                                onClick={handleCheckOutAll}
                                className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                            >
                                <LogOut className="w-3.5 h-3.5" /> Check-out All
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter Form */}
                <form onSubmit={handleFilter} className="flex flex-col sm:flex-row items-center gap-3">
                    <div className="relative flex-1 w-full">
                        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Cari nama atau kode member..."
                            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-blue-500 bg-white"
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        <input
                            type="date"
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="px-3 py-2 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-blue-500 bg-white"
                        />
                        <button type="submit" className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold rounded-lg transition-colors">
                            Filter
                        </button>
                    </div>
                </form>

                {/* Data Table */}
                <div className="bg-white rounded-3xl border border-gray-100/80 shadow-xs overflow-hidden shadow-2xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50/50 text-[11px] font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                                <tr>
                                    <th className="px-4 py-3.5">Member</th>
                                    <th className="px-4 py-3.5">Paket Active</th>
                                    <th className="px-4 py-3.5">Waktu Check-in</th>
                                    <th className="px-4 py-3.5">Waktu Check-out</th>
                                    <th className="px-4 py-3.5">Catatan / Sistem</th>
                                    <th className="px-4 py-3.5">Metode</th>
                                    <th className="px-4 py-3.5">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {attendances.data.length === 0 ? (
                                    <tr><td colSpan="7" className="px-4 py-8 text-center text-gray-400 text-xs">Tidak ada riwayat kehadiran pada tanggal ini.</td></tr>
                                ) : (
                                    attendances.data.map((att) => (
                                        <tr key={att.id} className="hover:bg-gray-50/70 transition-colors">
                                            <td className="px-4 py-3.5">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center text-xs font-bold">
                                                        {att.member?.full_name?.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-gray-900 text-xs">{att.member?.full_name}</p>
                                                        <p className="text-[11px] font-mono text-gray-400">{att.member?.member_code}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3.5 text-xs font-medium text-gray-700">{att.member?.active_subscription?.package?.name || '—'}</td>
                                            <td className="px-4 py-3.5 text-xs text-gray-600 font-medium">{new Date(att.check_in_time).toLocaleString('id-ID')}</td>
                                            <td className="px-4 py-3.5 text-xs text-gray-600 font-medium">{att.check_out_time ? new Date(att.check_out_time).toLocaleString('id-ID') : '—'}</td>
                                            <td className="px-4 py-3.5 text-xs text-gray-500">
                                                {att.notes ? (
                                                    <span className="text-[11px] px-2 py-0.5 rounded bg-gray-100 text-gray-600 font-medium">{att.notes}</span>
                                                ) : '—'}
                                            </td>
                                            <td className="px-4 py-3.5 text-xs text-gray-500 uppercase font-mono">{att.check_in_method}</td>
                                            <td className="px-4 py-3.5">
                                                {att.status === 'checked_in' ? (
                                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200 animate-pulse">Aktif Latihan</span>
                                                ) : (
                                                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">Checked Out</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <Pagination paginator={attendances} preserveScroll preserveState />
                </div>
            </div>
        </AdminLayout>
    );
}

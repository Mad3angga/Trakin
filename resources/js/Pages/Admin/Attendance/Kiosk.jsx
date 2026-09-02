import React, { useState, useRef } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { ScanLine } from 'lucide-react';

export default function AttendanceKiosk({ recentCheckIns }) {
    const [scanInput, setScanInput] = useState('');
    const inputRef = useRef(null);
    const form = useForm({ query: '' });

    const processCheckIn = (token) => {
        const queryToken = token.trim();
        if (!queryToken || form.processing) return;

        router.post('/attendance/check-in', { query: queryToken }, {
            onSuccess: () => {
                setScanInput('');
                if (inputRef.current) inputRef.current.focus();
            },
            onError: () => {
                setScanInput('');
                if (inputRef.current) inputRef.current.focus();
            }
        });
    };

    const autoTimerRef = useRef(null);

    const handlePaste = (e) => {
        const pasted = (e.clipboardData || window.clipboardData).getData('text');
        const token = pasted.trim();
        if (token && !form.processing) {
            e.preventDefault();
            setScanInput(token);
            clearTimeout(autoTimerRef.current);
            autoTimerRef.current = setTimeout(() => processCheckIn(token), 50);
        }
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        setScanInput(val);
        const trimmed = val.trim();
        if (!trimmed || form.processing) return;
        clearTimeout(autoTimerRef.current);

        // Auto-process whenever a QR/member code is scanned or pasted
        // Supports: TRK-QR-..., MBR-..., dynamic QR with timestamp (TOKEN:timestamp)
        const isQrLike = trimmed.startsWith('TRK-QR-') || trimmed.startsWith('MBR-') || trimmed.includes(':');
        if (isQrLike && trimmed.length >= 6) {
            autoTimerRef.current = setTimeout(() => processCheckIn(trimmed), 180);
        } else if (trimmed.length >= 6) {
            // Generic fallback for any scanned/pasted code (6+ chars) - catches scanner bursts
            autoTimerRef.current = setTimeout(() => processCheckIn(trimmed), 350);
        }
    };

    const handleScanSubmit = (e) => {
        e.preventDefault();
        clearTimeout(autoTimerRef.current);
        processCheckIn(scanInput);
    };

    return (
        <AdminLayout title="Check-in Gym">
            <Head title="Check-in Gym" />
            <div className="max-w-3xl mx-auto space-y-6">
                {/* Scanner */}
                <div className="bg-white rounded-3xl border border-gray-100/80 shadow-xs p-6 text-center">
                    <h2 className="text-lg font-semibold text-gray-900">Terminal Check-in Member</h2>
                    <p className="text-sm text-gray-500 mt-1">Scan QR Code atau Ketik Kode Member (otomatis memproses saat di-scan)</p>

                    <form onSubmit={handleScanSubmit} className="mt-6 max-w-lg mx-auto space-y-3">
                        <div className="relative">
                            <ScanLine className="w-4 h-4 text-blue-600 absolute left-3 top-3 animate-pulse" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={scanInput}
                                onChange={handleInputChange}
                                onPaste={handlePaste}
                                placeholder="Scan QR / Ketik kode member..."
                                className="w-full pl-9 pr-3 py-2.5 border border-blue-400 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500"
                                autoFocus
                            />
                        </div>
                    </form>

                    <div className="mt-6 pt-4 border-t border-gray-200 flex flex-wrap items-center justify-center gap-2">
                        <span className="text-xs text-gray-400">Klik Sampel Token (Otomatis Check-In):</span>
                        {[
                            { code: 'TRK-QR-MBR-1001', name: 'Budi Santoso' },
                            { code: 'MBR-1002', name: 'Dewi Lestari' },
                        ].map((d) => (
                            <button
                                key={d.code}
                                type="button"
                                onClick={() => processCheckIn(d.code)}
                                className="px-2.5 py-1 text-xs text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors font-mono"
                            >
                                {d.code} <span className="text-gray-500 font-sans">({d.name})</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Today's check-ins */}
                <div className="bg-white rounded-3xl border border-gray-100/80 shadow-xs p-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-gray-900">Kehadiran Hari Ini</h3>
                        <span className="text-xs text-gray-400">{recentCheckIns.length} check-in hari ini</span>
                    </div>
                    <div className="h-[420px] overflow-y-auto scrollbar-hide space-y-2 pr-1">
                        {recentCheckIns.length === 0 ? (
                            <p className="text-sm text-gray-400 py-6 text-center">Belum ada check-in.</p>
                        ) : (
                            recentCheckIns.map((att) => (
                                <div key={att.id} className="flex items-center justify-between py-2.5 border-b border-gray-100 last:border-0">
                                    <div className="flex items-center gap-2.5">
                                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600">
                                            {att.member?.full_name?.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">{att.member?.full_name}</p>
                                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                                                <span className="text-xs text-gray-400 font-mono">{att.member?.member_code}</span>
                                                {att.notes && (
                                                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                                                        {att.notes}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-gray-500">
                                            {new Date(att.check_in_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {att.status === 'checked_in' ? (
                                            <button
                                                onClick={() => router.post(`/attendance/${att.id}/check-out`)}
                                                className="px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded-xl border border-red-200 transition-colors"
                                            >
                                                Check-out
                                            </button>
                                        ) : (
                                            <span className="text-xs text-gray-400">
                                                Selesai {new Date(att.check_out_time).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

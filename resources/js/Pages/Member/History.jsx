import React from 'react';
import { Head } from '@inertiajs/react';
import MemberLayout from '@/Layouts/MemberLayout';
import { CreditCard, CheckCircle2 } from 'lucide-react';

export default function MemberHistory({ transactions }) {
    const formatIDR = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

    return (
        <MemberLayout title="Riwayat Pembayaran">
            <Head title="Riwayat Pembayaran" />

            <div className="space-y-4">
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <CreditCard className="w-4 h-4 text-blue-600" />
                            <span className="text-xs text-gray-500 font-medium">Daftar Transaksi Paket Membership</span>
                        </div>
                        <span className="text-xs text-gray-400 font-mono">{transactions.length} Transaksi</span>
                    </div>

                    <div className="p-4 space-y-2.5">
                        {transactions.length === 0 ? (
                            <div className="py-12 text-center text-gray-400 text-xs">Belum ada transaksi pembayaran.</div>
                        ) : (
                            transactions.map((tx) => (
                                <div key={tx.id} className="p-3.5 rounded-xl bg-gray-50/80 border border-gray-100 flex items-center justify-between text-xs hover:border-gray-200 transition-colors">
                                    <div className="space-y-0.5">
                                        <p className="font-semibold text-gray-900 text-sm">{tx.subscription?.package?.name || 'Pembayaran Membership'}</p>
                                        <p className="font-mono text-[11px] text-gray-500">{tx.transaction_code}</p>
                                        <p className="text-[10px] text-gray-400">{new Date(tx.created_at).toLocaleString('id-ID')}</p>
                                    </div>
                                    <div className="text-right space-y-1">
                                        <span className="text-sm font-bold text-gray-900 block">{formatIDR(tx.amount)}</span>
                                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded-full border border-green-200 uppercase">
                                            <CheckCircle2 className="w-3 h-3 text-green-600" /> {tx.payment_method}
                                        </span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </MemberLayout>
    );
}

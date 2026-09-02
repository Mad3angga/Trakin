import React from 'react';
import { Head, useForm, Link } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { Settings, Printer, Building2, MessageSquare, ArrowLeft } from 'lucide-react';

export default function POSReceiptSettings({ receiptSettings = {} }) {
    const form = useForm({
        pos_receipt_gym_name: receiptSettings?.pos_receipt_gym_name || 'Trakin Fitness Gym',
        pos_receipt_address: receiptSettings?.pos_receipt_address || 'Jl. Fitness No. 8, Pusat Kota',
        pos_receipt_phone: receiptSettings?.pos_receipt_phone || '0812-3456-7890',
        pos_receipt_footer_title: receiptSettings?.pos_receipt_footer_title || 'TERIMA KASIH',
        pos_receipt_footer_note: receiptSettings?.pos_receipt_footer_note || 'Selamat Berolahraga & Stay Fit!',
        pos_receipt_show_tax: receiptSettings?.pos_receipt_show_tax ?? '1',
    });

    const submit = (e) => {
        e.preventDefault();
        form.post('/pos/receipt-settings', {
            preserveScroll: true,
        });
    };

    const inputClass = 'w-full px-3.5 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 bg-white text-gray-900';

    return (
        <AdminLayout title="Pengaturan Struk POS">
            <Head title="Pengaturan Struk POS" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Link href="/settings" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                                <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke Pengaturan Gym
                            </Link>
                        </div>
                        <h2 className="text-base font-semibold text-gray-900">Pengaturan Tampilan Cetak Struk POS</h2>
                        <p className="text-xs text-gray-500">Sesuaikan header, alamat, nomor kontak, serta pesan footer pada nota cetak kasir</p>
                    </div>

                    <button
                        type="button"
                        onClick={submit}
                        disabled={form.processing}
                        className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
                    >
                        Simpan Struk
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Form Settings */}
                    <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100/80 shadow-xs p-6 space-y-6">
                        <div className="flex items-center gap-3 border-b border-gray-100 pb-4">
                            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Settings className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900">Form Identitas & Pesan Nota</h3>
                                <p className="text-xs text-gray-500">Informasi ini akan tercetak langsung pada kertas struk kasir 80mm</p>
                            </div>
                        </div>

                        <form onSubmit={submit} className="space-y-6 max-w-7xl mx-auto pb-12 font-sans antialiased text-gray-900">
                            {/* Header Info */}
                            <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans antialiased text-gray-900">
                                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                                    <Building2 className="w-4 h-4 text-blue-600" /> Informasi Gym (Header Struk)
                                </h4>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Nama Gym / Outlet *</label>
                                    <input
                                        type="text"
                                        value={form.data.pos_receipt_gym_name}
                                        onChange={(e) => form.setData('pos_receipt_gym_name', e.target.value)}
                                        placeholder="Contoh: Trakin Fitness Gym"
                                        className={inputClass}
                                        required
                                    />
                                    {form.errors.pos_receipt_gym_name && <p className="text-xs text-red-600 mt-1">{form.errors.pos_receipt_gym_name}</p>}
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">Alamat Gym *</label>
                                        <input
                                            type="text"
                                            value={form.data.pos_receipt_address}
                                            onChange={(e) => form.setData('pos_receipt_address', e.target.value)}
                                            placeholder="Alamat singkat untuk nota"
                                            className={inputClass}
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-700 mb-1">No. Telepon / WhatsApp *</label>
                                        <input
                                            type="text"
                                            value={form.data.pos_receipt_phone}
                                            onChange={(e) => form.setData('pos_receipt_phone', e.target.value)}
                                            placeholder="0812-3456-7890"
                                            className={inputClass}
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Footer Notes */}
                            <div className="pt-4 border-t border-gray-100 space-y-4">
                                <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                                    <MessageSquare className="w-4 h-4 text-blue-600" /> Catatan Kaki (Footer Struk)
                                </h4>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Judul Penutup (Footer Title) *</label>
                                    <input
                                        type="text"
                                        value={form.data.pos_receipt_footer_title}
                                        onChange={(e) => form.setData('pos_receipt_footer_title', e.target.value)}
                                        placeholder="TERIMA KASIH"
                                        className={inputClass}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Pesan Tambahan (Footer Note) *</label>
                                    <input
                                        type="text"
                                        value={form.data.pos_receipt_footer_note}
                                        onChange={(e) => form.setData('pos_receipt_footer_note', e.target.value)}
                                        placeholder="Selamat Berolahraga & Stay Fit!"
                                        className={inputClass}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-medium text-gray-700 mb-1">Tampilkan PPN 11% di Struk</label>
                                    <select
                                        value={form.data.pos_receipt_show_tax}
                                        onChange={(e) => form.setData('pos_receipt_show_tax', e.target.value)}
                                        className={inputClass}
                                    >
                                        <option value="1">Ya, Tampilkan PPN 11%</option>
                                        <option value="0">Tidak (Sembunyikan PPN)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={form.processing}
                                    className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
                                >
                                    Simpan Pengaturan Struk
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Real-time Live Receipt Preview */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-xs text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                            <Printer className="w-4 h-4 text-gray-400" /> Live Preview Nota Struk
                        </h3>

                        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs text-black font-mono text-xs max-w-[300px] mx-auto space-y-2">
                            <div className="text-center pb-2 border-b border-black border-dashed">
                                <h4 className="font-bold text-sm uppercase">{form.data.pos_receipt_gym_name || 'TRAKIN FITNESS GYM'}</h4>
                                <p className="text-[10px]">{form.data.pos_receipt_address || 'Jl. Fitness No. 8'}</p>
                                <p className="text-[10px]">Telp: {form.data.pos_receipt_phone || '0812-3456-7890'}</p>
                            </div>

                            <div className="py-2 border-b border-black border-dashed text-[11px] space-y-0.5">
                                <p>No. Invoice : INV-20260805-1024</p>
                                <p>Waktu       : 05/08/2026 16:00</p>
                                <p>Kasir       : Staff POS</p>
                            </div>

                            <div className="py-2 border-b border-black border-dashed text-[11px] space-y-1">
                                <div>
                                    <p className="font-bold">Air Mineral 600ml</p>
                                    <div className="flex justify-between text-[10px]">
                                        <span>2 x Rp 5.000</span>
                                        <span>Rp 10.000</span>
                                    </div>
                                </div>
                                <div>
                                    <p className="font-bold">Whey Protein Shake</p>
                                    <div className="flex justify-between text-[10px]">
                                        <span>1 x Rp 35.000</span>
                                        <span>Rp 35.000</span>
                                    </div>
                                </div>
                            </div>

                            <div className="py-2 border-b border-black border-dashed text-[11px] space-y-0.5">
                                <div className="flex justify-between"><span>Subtotal:</span><span>Rp 45.000</span></div>
                                {form.data.pos_receipt_show_tax === '1' && (
                                    <div className="flex justify-between"><span>PPN 11%:</span><span>Rp 4.950</span></div>
                                )}
                                <div className="flex justify-between font-bold text-xs pt-1 border-t border-black border-dotted">
                                    <span>TOTAL:</span>
                                    <span>{form.data.pos_receipt_show_tax === '1' ? 'Rp 49.950' : 'Rp 45.000'}</span>
                                </div>
                                <div className="flex justify-between"><span>Bayar (CASH):</span><span>Rp 50.000</span></div>
                                <div className="flex justify-between"><span>Kembali:</span><span>{form.data.pos_receipt_show_tax === '1' ? 'Rp 50' : 'Rp 5.000'}</span></div>
                            </div>

                            <div className="text-center pt-3 text-[10px]">
                                <p className="font-bold uppercase">{form.data.pos_receipt_footer_title || 'TERIMA KASIH'}</p>
                                <p>{form.data.pos_receipt_footer_note || 'Selamat Berolahraga & Stay Fit!'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

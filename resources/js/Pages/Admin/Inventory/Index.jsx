import React, { useState } from 'react';
import { Head, useForm, router } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import Pagination from '@/Components/Pagination';
import { Plus, X, Layers, Trash2 } from 'lucide-react';

export default function InventoryIndex({ products, categories, suppliers, movements }) {
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [adjustProduct, setAdjustProduct] = useState(null);
    const [deleteProduct, setDeleteProduct] = useState(null);

    const productForm = useForm({
        category_id: categories[0]?.id || 1,
        name: '',
        sku: '',
        barcode: '',
        price: 0,
        cost_price: 0,
        stock: 10,
        min_stock: 5,
        unit: 'pcs',
    });

    const adjustForm = useForm({
        actual_stock: 0,
        reason: 'Hasil Stock Opname Fisik',
    });

    const submitProduct = (e) => {
        e.preventDefault();
        productForm.post('/inventory/products', {
            onSuccess: () => {
                setIsAddModalOpen(false);
                productForm.reset();
            },
        });
    };

    const submitAdjust = (e) => {
        e.preventDefault();
        if (!adjustProduct) return;
        adjustForm.post(`/inventory/products/${adjustProduct.id}/adjust`, {
            onSuccess: () => setAdjustProduct(null),
        });
    };

    const formatIDR = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
    const inputClass = 'w-full px-3 py-2 border bg-gray-50 border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500';

    return (
        <AdminLayout title="Inventori">
            <Head title="Inventori" />
            <div className="space-y-4">
                <div className="flex items-center justify-end">
                    <button onClick={() => setIsAddModalOpen(true)} className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg flex items-center gap-1.5 transition-colors">
                        <Plus className="w-4 h-4" /> Tambah Produk
                    </button>
                </div>

                {/* Table */}
                <div className="bg-white rounded-3xl border border-gray-100/80 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50/50 text-[11px] font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                                <tr>
                                    <th className="px-4 py-3">Produk</th>
                                    <th className="px-4 py-3">Kategori</th>
                                    <th className="px-4 py-3">Harga Jual</th>
                                    <th className="px-4 py-3">Harga Beli</th>
                                    <th className="px-4 py-3">Stok</th>
                                    <th className="px-4 py-3 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {(products.data || products).map((p) => (
                                    <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-4 py-3">
                                            <p className="font-medium text-gray-900">{p.name}</p>
                                            <p className="text-xs text-gray-400">SKU: {p.sku}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded">
                                                {p.category?.name}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 font-semibold text-gray-900">{formatIDR(p.price)}</td>
                                        <td className="px-4 py-3 text-gray-400">{formatIDR(p.cost_price)}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${p.stock <= p.min_stock ? 'bg-red-50 text-red-600 border border-red-200' : 'bg-gray-100 text-gray-700'}`}>
                                                {p.stock} {p.unit}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => {
                                                        setAdjustProduct(p);
                                                        adjustForm.setData('actual_stock', p.stock);
                                                    }}
                                                    className="px-2.5 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors"
                                                >
                                                    Adjust
                                                </button>
                                                <button
                                                    onClick={() => setDeleteProduct(p)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200 transition-colors"
                                                    title="Hapus Produk"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <Pagination paginator={products} only={['products']} preserveScroll preserveState />
                </div>

                {/* Stock movements */}
                <div className="bg-white rounded-3xl border border-gray-100/80 shadow-xs overflow-hidden">
                    <div className="p-5 pb-3">
                        <h3 className="font-semibold text-sm text-gray-900 flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-gray-500" /> Histori Mutasi Stok
                        </h3>
                    </div>
                    <div className="px-5 pb-3 space-y-2">
                        {((movements.data || movements).length === 0) ? (
                            <p className="text-xs text-gray-400 py-4 text-center">Belum ada riwayat mutasi stok.</p>
                        ) : (
                            (movements.data || movements).map((mov) => (
                                <div key={mov.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0 text-xs">
                                    <div>
                                        <p className="font-medium text-gray-900">{mov.product?.name || 'Produk'}</p>
                                        <p className="text-[10px] text-gray-400">{mov.notes || '-'}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {mov.type === 'in' && <span className="text-emerald-600 font-medium">+ {mov.quantity} (Masuk)</span>}
                                        {mov.type === 'out' && <span className="text-rose-600 font-medium">- {mov.quantity} (Penjualan)</span>}
                                        {mov.type === 'adjustment' && <span className="text-blue-600 font-medium">~ {mov.quantity} (Adjust)</span>}
                                        <span className="text-[10px] text-gray-400">{new Date(mov.created_at).toLocaleDateString('id-ID')}</span>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    {movements?.links && (
                        <Pagination paginator={movements} only={['movements']} preserveScroll preserveState />
                    )}
                </div>

                {/* Add product modal */}
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-lg rounded-xl shadow-lg">
                            <div className="flex items-center justify-between p-5 border-b border-gray-200">
                                <h3 className="text-base font-semibold text-gray-900">Tambah Produk</h3>
                                <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={submitProduct} className="p-5 space-y-4">
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Nama Produk *</label><input type="text" value={productForm.data.name} onChange={(e) => productForm.setData('name', e.target.value)} className={inputClass} required /></div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Kategori *</label>
                                        <select value={productForm.data.category_id} onChange={(e) => productForm.setData('category_id', e.target.value)} className={inputClass}>
                                            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div><label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label><input type="text" value={productForm.data.sku} onChange={(e) => productForm.setData('sku', e.target.value)} className={inputClass} required /></div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Harga Jual *</label><input type="number" value={productForm.data.price} onChange={(e) => productForm.setData('price', e.target.value)} className={inputClass} required /></div>
                                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Harga Modal</label><input type="number" value={productForm.data.cost_price} onChange={(e) => productForm.setData('cost_price', e.target.value)} className={inputClass} /></div>
                                </div>
                                <div className="grid grid-cols-3 gap-4">
                                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Stok Awal</label><input type="number" value={productForm.data.stock} onChange={(e) => productForm.setData('stock', e.target.value)} className={inputClass} /></div>
                                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Min Stok</label><input type="number" value={productForm.data.min_stock} onChange={(e) => productForm.setData('min_stock', e.target.value)} className={inputClass} /></div>
                                    <div><label className="block text-sm font-medium text-gray-700 mb-1">Satuan</label><input type="text" value={productForm.data.unit} onChange={(e) => productForm.setData('unit', e.target.value)} className={inputClass} /></div>
                                </div>
                                <div className="pt-4 border-t border-gray-200 flex justify-end gap-2">
                                    <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">Batal</button>
                                    <button type="submit" disabled={productForm.processing} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-50">Simpan</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Adjust stock modal */}
                {adjustProduct && (
                    <div className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-md rounded-xl shadow-lg">
                            <div className="flex items-center justify-between p-5 border-b border-gray-200">
                                <h3 className="text-base font-semibold text-gray-900">Adjust Stok</h3>
                                <button onClick={() => setAdjustProduct(null)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
                            </div>
                            <form onSubmit={submitAdjust} className="p-5 space-y-4">
                                <p className="text-sm text-gray-600">Produk: <strong>{adjustProduct.name}</strong> (Stok saat ini: {adjustProduct.stock})</p>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Stok Fisik *</label><input type="number" value={adjustForm.data.actual_stock} onChange={(e) => adjustForm.setData('actual_stock', e.target.value)} className={inputClass} required /></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">Alasan *</label><input type="text" value={adjustForm.data.reason} onChange={(e) => adjustForm.setData('reason', e.target.value)} className={inputClass} required /></div>
                                <div className="pt-4 border-t border-gray-200 flex justify-end gap-2">
                                    <button type="button" onClick={() => setAdjustProduct(null)} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg">Batal</button>
                                    <button type="submit" disabled={adjustForm.processing} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-50">Simpan</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Delete product confirmation modal */}
                {deleteProduct && (
                    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0 text-red-600">
                                    <Trash2 className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 text-sm">Hapus Produk</h3>
                                    <p className="text-xs text-gray-500">Konfirmasi Hapus dari Inventori</p>
                                </div>
                            </div>
                            <p className="text-xs text-gray-600 leading-relaxed">
                                Apakah Anda yakin ingin menghapus produk <strong className="text-gray-900">"{deleteProduct.name}"</strong> (SKU: {deleteProduct.sku})? Tindakan ini akan menghapus produk secara permanen.
                            </p>
                            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={() => setDeleteProduct(null)}
                                    className="px-3.5 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        router.delete(`/inventory/products/${deleteProduct.id}`, {
                                            onSuccess: () => setDeleteProduct(null),
                                        });
                                    }}
                                    className="px-3.5 py-2 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-xl transition-colors shadow-xs"
                                >
                                    Ya, Hapus Produk
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}

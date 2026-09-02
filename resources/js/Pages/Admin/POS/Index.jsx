import React, { useState, useEffect } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AdminLayout from '@/Layouts/AdminLayout';
import { ShoppingCart, Plus, Minus, Trash2, Search, Printer, X, UserCheck, UserPlus, Check } from 'lucide-react';

export default function POSIndex({ products = [], members = [], packages = [], ptPackages = [], salesStaff = [], receiptSettings = {}, selectedMemberId = null, selectedPackageId = null, selectedPtPackageId = null, selectedPtSubscriptionId = null, selectedPtBookingToken = null, pendingPtBooking = null, selectedSoldById = null }) {
    const { auth } = usePage().props;
    const cashierName = auth?.user?.name || 'Staff Kasir';
    const [cart, setCart] = useState([]);
    const [search, setSearch] = useState('');
    const [catalogTab, setCatalogTab] = useState('all'); // 'all', 'products', 'packages'
    const [selectedMember, setSelectedMember] = useState(null);
    const [soldById, setSoldById] = useState(selectedSoldById || '');
    const [memberSearch, setMemberSearch] = useState('');
    const [paymentMethod, setPaymentMethod] = useState('cash');
    const [paidAmount, setPaidAmount] = useState('');
    const [discount, setDiscount] = useState(0);
    const [lastSaleReceipt, setLastSaleReceipt] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    // Modal Registrasi Member via POS
    const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
    const [isSubmittingMember, setIsSubmittingMember] = useState(false);
    const [regErrors, setRegErrors] = useState({});
    const [regForm, setRegForm] = useState({
        full_name: '',
        phone: '',
        email: '',
        password: '12345678',
        gender: 'male',
        package_id: packages[0]?.id || 1,
        sold_by_id: '',
    });

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const mId = urlParams.get('member_id') || selectedMemberId;
        const pId = urlParams.get('package_id') || selectedPackageId;
        const ptId = urlParams.get('pt_package_id') || selectedPtPackageId;
        const ptSubId = urlParams.get('pt_subscription_id') || selectedPtSubscriptionId;
        const ptBookToken = urlParams.get('pt_booking_token') || selectedPtBookingToken;
        const sId = urlParams.get('sold_by_id') || selectedSoldById;

        if (mId && members.length > 0) {
            const foundMember = members.find((m) => String(m.id) === String(mId));
            if (foundMember) {
                setSelectedMember(foundMember);
            }
        }

        if (pId && packages.length > 0) {
            const foundPackage = packages.find((p) => String(p.id) === String(pId));
            if (foundPackage) {
                addPackageToCart(foundPackage);
            }
        }

        if (pendingPtBooking) {
            addPendingPtBookingToCart(pendingPtBooking);
        } else if (ptId && ptPackages.length > 0) {
            const foundPtPkg = ptPackages.find((p) => String(p.id) === String(ptId));
            if (foundPtPkg) {
                addPtPackageToCart(foundPtPkg, ptSubId, ptBookToken);
            }
        }

        if (sId) {
            setSoldById(String(sId));
        }

        if ((urlParams.has('member_id') || urlParams.has('package_id') || urlParams.has('pt_package_id') || urlParams.has('pt_subscription_id') || urlParams.has('pt_booking_token') || urlParams.has('sold_by_id')) && window.history && window.history.replaceState) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }, [members, packages, ptPackages, pendingPtBooking]);

    const handleSelectPackage = (pkg) => {
        if (selectedMember) {
            addPackageToCart(pkg);
        } else {
            setRegForm((prev) => ({ ...prev, package_id: pkg.id }));
            setIsRegisterModalOpen(true);
        }
    };

    const addPackageToCart = (pkg) => {
        const cartItemId = 'pkg-' + pkg.id;
        const existing = cart.find((item) => item.product.id === cartItemId);
        if (existing) {
            setCart(cart.map((item) =>
                item.product.id === cartItemId ? { ...item, quantity: item.quantity + 1 } : item
            ));
        } else {
            setCart([
                ...cart,
                {
                    item_type: 'package',
                    package_id: pkg.id,
                    product: {
                        id: cartItemId,
                        name: `Paket Gym: ${pkg.name}`,
                        price: Number(pkg.price),
                        stock: 999,
                    },
                    quantity: 1,
                },
            ]);
        }
    };

    const addPendingPtBookingToCart = (booking) => {
        const cartItemId = 'ptbooking-' + booking.token;
        const existing = cart.find((item) => item.product.id === cartItemId);
        if (!existing) {
            setCart((prev) => [
                ...prev,
                {
                    item_type: 'pt_package',
                    pt_package_id: booking.pt_package_id,
                    pt_booking_token: booking.token,
                    booking_data: booking,
                    product: {
                        id: cartItemId,
                        name: `Sesi PT: ${booking.package_name || 'Paket PT'} (${booking.session_count || booking.sessions?.length || 1} Sesi)`,
                        price: Number(booking.price),
                        stock: 999,
                    },
                    quantity: 1,
                },
            ]);
        }
    };

    const addPtPackageToCart = (ptPkg, ptSubscriptionId = null, ptBookingToken = null) => {
        const cartItemId = 'ptpkg-' + ptPkg.id;
        const existing = cart.find((item) => item.product.id === cartItemId);
        if (existing) {
            setCart(cart.map((item) =>
                item.product.id === cartItemId ? { ...item, quantity: item.quantity + 1 } : item
            ));
        } else {
            setCart([
                ...cart,
                {
                    item_type: 'pt_package',
                    pt_package_id: ptPkg.id,
                    pt_subscription_id: ptSubscriptionId ? Number(ptSubscriptionId) : null,
                    pt_booking_token: ptBookingToken || null,
                    product: {
                        id: cartItemId,
                        name: `Sesi PT: ${ptPkg.name}`,
                        price: Number(ptPkg.price),
                        stock: 999,
                    },
                    quantity: 1,
                },
            ]);
        }
    };

    const addToCart = (product) => {
        const existing = cart.find((item) => item.product.id === product.id);
        if (existing) {
            if (existing.quantity >= product.stock) return;
            setCart(cart.map((item) =>
                item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            ));
        } else {
            setCart([
                ...cart,
                {
                    item_type: 'product',
                    product_id: product.id,
                    product,
                    quantity: 1,
                },
            ]);
        }
    };

    const updateQty = (productId, delta) => {
        setCart(cart.map((item) => {
            if (item.product.id === productId) {
                const newQty = item.quantity + delta;
                if (newQty > item.product.stock) return item;
                return newQty > 0 ? { ...item, quantity: newQty } : null;
            }
            return item;
        }).filter(Boolean));
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter((item) => item.product.id !== productId));
    };

    const handleRegisterMemberSubmit = async (e) => {
        e.preventDefault();
        if (isSubmittingMember) return;
        setIsSubmittingMember(true);
        setRegErrors({});

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const res = await fetch('/pos/register-member', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(regForm),
            });

            const data = await res.json();
            if (res.ok && data.success) {
                setSelectedMember(data.member);
                if (regForm.sold_by_id) {
                    setSoldById(String(regForm.sold_by_id));
                }

                if (data.package) {
                    addPackageToCart(data.package);
                }

                setIsRegisterModalOpen(false);
                setRegForm({
                    full_name: '',
                    phone: '',
                    email: '',
                    password: '12345678',
                    gender: 'male',
                    package_id: packages[0]?.id || 1,
                    sold_by_id: '',
                });
                alert(`✓ Member ${data.member.full_name} (${data.member.member_code}) berhasil terdaftar & paket dimasukkan ke keranjang!`);
            } else {
                const errObj = data.errors || {};
                setRegErrors(errObj);
                const errorMsg = data.message || (Object.values(errObj).flat().join('\n') || 'Gagal mendaftarkan member.');
                alert(`Gagal Registrasi Member:\n${errorMsg}`);
            }
        } catch (err) {
            alert('Terjadi kesalahan koneksi saat registrasi member.');
        } finally {
            setIsSubmittingMember(false);
        }
    };

    const handlePrintReceipt = () => {
        document.body.classList.add('printing-receipt');
        window.print();
        setTimeout(() => {
            document.body.classList.remove('printing-receipt');
        }, 1000);
    };

    const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
    const taxableSubtotal = cart
        .filter((item) => item.item_type !== 'package' && item.item_type !== 'pt_package')
        .reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    const showTaxSetting = receiptSettings.pos_receipt_show_tax !== '0';
    const tax = showTaxSetting ? Math.round(taxableSubtotal * 0.11) : 0;
    const totalAmount = Math.max(0, subtotal + tax - Number(discount || 0));
    const changeAmount = Math.max(0, Number(paidAmount || 0) - totalAmount);

    const handleCheckout = async (e) => {
        e.preventDefault();
        if (cart.length === 0 || isProcessing) return;

        if (Number(paidAmount) < totalAmount) {
            alert(`Pembayaran kurang! Total transaksi: ${formatIDR(totalAmount)}`);
            return;
        }

        setIsProcessing(true);

        const payload = {
            member_id: selectedMember ? selectedMember.id : null,
            sold_by_id: soldById ? Number(soldById) : null,
            payment_method: paymentMethod,
            cart: cart.map((i) => ({
                item_type: i.item_type || 'product',
                product_id: i.product_id || null,
                package_id: i.package_id || null,
                pt_package_id: i.pt_package_id || null,
                pt_subscription_id: i.pt_subscription_id || null,
                pt_booking_token: i.pt_booking_token || null,
                booking_data: i.booking_data || null,
                quantity: i.quantity,
            })),
            paid_amount: Number(paidAmount),
            discount: Number(discount),
            tax: tax,
        };

        try {
            const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const res = await fetch('/pos/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (res.ok && data.success) {
                const sale = data.sale || {};
                setLastSaleReceipt({
                    invoice: sale.invoice_number || ('INV-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.floor(1000 + Math.random() * 9000)),
                    date: new Date().toLocaleString('id-ID'),
                    cashierName: cashierName,
                    member: selectedMember ? selectedMember.full_name : 'Guest/Non-Member',
                    cart: [...cart],
                    subtotal: subtotal,
                    tax: tax,
                    discount: Number(discount || 0),
                    totalAmount: totalAmount,
                    paidAmount: Number(paidAmount),
                    changeAmount: changeAmount,
                    paymentMethod: paymentMethod.toUpperCase(),
                });

                setCart([]);
                setSelectedMember(null);
                setSoldById('');
                setPaidAmount('');
                setDiscount(0);

                if (window.history && window.history.replaceState) {
                    window.history.replaceState({}, document.title, window.location.pathname);
                }
            } else {
                alert(`Gagal Transaksi:\n${data.message || 'Terjadi kesalahan saat memproses transaksi.'}`);
            }
        } catch (err) {
            alert('Terjadi kesalahan koneksi saat memproses transaksi.');
        } finally {
            setIsProcessing(false);
        }
    };

    const formatIDR = (val) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

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

    const filteredProducts = products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(search.toLowerCase()))
    );

    const filteredPackages = packages.filter((pkg) =>
        pkg.name.toLowerCase().includes(search.toLowerCase())
    );

    const filteredMembers = members.filter((m) =>
        m.full_name.toLowerCase().includes(memberSearch.toLowerCase()) ||
        m.member_code.toLowerCase().includes(memberSearch.toLowerCase()) ||
        (m.phone && m.phone.includes(memberSearch))
    );

    const handleCancelTransaction = () => {
        if (cart.length === 0 && !selectedMember && !paidAmount && Number(discount) === 0) return;
        setCart([]);
        setSelectedMember(null);
        setSoldById('');
        setPaidAmount('');
        setDiscount(0);
        setMemberSearch('');
        if (window.history && window.history.replaceState) {
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    };

    const inputClass = 'w-full px-3 py-2 border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white';

    return (
        <AdminLayout title="POS Kasir Gym">
            {/* Printable Receipt Overlay & Interactive Pop-Up Modal */}
            {lastSaleReceipt && (
                <>
                    {/* Thermal Printer Target View (Targeted by app.css #printable-receipt) */}
                    <div id="printable-receipt" className="hidden print:block text-black font-mono text-xs max-w-[300px] mx-auto space-y-2 select-none">
                        <div className="text-center pb-2 border-b border-black border-dashed">
                            <h4 className="font-bold text-sm uppercase">{receiptSettings.pos_receipt_gym_name || 'TRAKIN FITNESS GYM'}</h4>
                            <p className="text-[10px]">{receiptSettings.pos_receipt_address || 'Jl. Fitness No. 8'}</p>
                            <p className="text-[10px]">Telp: {receiptSettings.pos_receipt_phone || '0812-3456-7890'}</p>
                        </div>

                        <div className="py-2 border-b border-black border-dashed text-[11px] space-y-0.5">
                            <p>No. Invoice : {lastSaleReceipt.invoice}</p>
                            <p>Waktu       : {lastSaleReceipt.date}</p>
                            <p>Kasir       : {lastSaleReceipt.cashierName}</p>
                            <p>Member      : {lastSaleReceipt.member}</p>
                        </div>

                        <div className="py-2 border-b border-black border-dashed text-[11px] space-y-1">
                            {lastSaleReceipt.cart.map((item, idx) => (
                                <div key={idx}>
                                    <p className="font-bold">{item.product.name}</p>
                                    <div className="flex justify-between text-[10px]">
                                        <span>{item.quantity} x {formatIDR(item.product.price)}</span>
                                        <span>{formatIDR(item.quantity * item.product.price)}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="py-2 border-b border-black border-dashed text-[11px] space-y-0.5">
                            <div className="flex justify-between"><span>Subtotal:</span><span>{formatIDR(lastSaleReceipt.subtotal)}</span></div>
                            {receiptSettings.pos_receipt_show_tax !== '0' && lastSaleReceipt.tax > 0 && (
                                <div className="flex justify-between"><span>PPN 11%:</span><span>{formatIDR(lastSaleReceipt.tax)}</span></div>
                            )}
                            {lastSaleReceipt.discount > 0 && (
                                <div className="flex justify-between"><span>Diskon:</span><span>-{formatIDR(lastSaleReceipt.discount)}</span></div>
                            )}
                            <div className="flex justify-between font-bold text-xs pt-1 border-t border-black border-dotted">
                                <span>TOTAL:</span>
                                <span>{formatIDR(lastSaleReceipt.totalAmount)}</span>
                            </div>
                            <div className="flex justify-between"><span>Bayar ({lastSaleReceipt.paymentMethod}):</span><span>{formatIDR(lastSaleReceipt.paidAmount)}</span></div>
                            <div className="flex justify-between"><span>Kembali:</span><span>{formatIDR(lastSaleReceipt.changeAmount)}</span></div>
                        </div>

                        <div className="text-center pt-3 text-[10px]">
                            <p className="font-bold uppercase">{receiptSettings.pos_receipt_footer_title || 'TERIMA KASIH'}</p>
                            <p>{receiptSettings.pos_receipt_footer_note || 'Selamat Berolahraga & Stay Fit!'}</p>
                        </div>
                    </div>

                    {/* On-Screen Interactive Transaction Success Pop-Up Modal */}
                    <div className="print:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white w-full max-w-sm rounded-2xl shadow-xl border border-gray-200 p-6 space-y-5 relative text-center text-black">
                            {/* Success Icon */}
                            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-2xs">
                                <Check className="w-7 h-7 stroke-[2]" />
                            </div>

                            {/* Title & Invoice */}
                            <div className="space-y-1">
                                <h3 className="text-base font-semibold text-black">Transaksi Berhasil!</h3>
                                <p className="text-xs text-gray-500 font-mono">{lastSaleReceipt.invoice}</p>
                            </div>

                            {/* Transaction Brief Details */}
                            <div className="bg-gray-50 rounded-xl p-3.5 border border-gray-200 text-xs space-y-2 text-left text-black">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Pelanggan</span>
                                    <span className="font-medium text-black">{lastSaleReceipt.member}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Metode Bayar</span>
                                    <span className="font-medium uppercase text-black">{lastSaleReceipt.paymentMethod}</span>
                                </div>
                                <div className="flex justify-between pt-1.5 border-t border-gray-200">
                                    <span className="text-gray-600">Total Transaksi</span>
                                    <span className="font-semibold text-black font-mono text-sm">{formatIDR(lastSaleReceipt.totalAmount)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Kembalian</span>
                                    <span className="font-semibold font-mono text-sm text-black">{formatIDR(lastSaleReceipt.changeAmount)}</span>
                                </div>
                            </div>

                            {/* Modal Action Buttons */}
                            <div className="flex items-center gap-2 pt-1">
                                <button
                                    onClick={handlePrintReceipt}
                                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                                >
                                    <Printer className="w-4 h-4" />
                                    <span>Cetak Struk / Nota</span>
                                </button>
                                <button
                                    onClick={() => setLastSaleReceipt(null)}
                                    className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-black text-xs font-semibold rounded-xl transition-all cursor-pointer"
                                >
                                    Selesai
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}

            <div className="h-[calc(100vh-100px)] flex flex-col md:flex-row gap-4">
                {/* Left Area: Product / Package Catalog */}
                <div className="flex-1 bg-white rounded-3xl border border-gray-100/80 shadow-xs p-4 flex flex-col">
                    {/* Header Controls */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-gray-200">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Katalog Produk</h3>

                        <div className="relative w-full sm:w-64">
                            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Cari produk ritel..."
                                className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Catalog Grid (Retail Products Only) */}
                    <div className="flex-1 overflow-y-auto pt-4">
                        {filteredProducts.length === 0 ? (
                            <p className="text-xs text-gray-400 py-8 text-center">Produk ritel tidak ditemukan.</p>
                        ) : (
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                {filteredProducts.map((p) => (
                                    <div
                                        key={p.id}
                                        onClick={() => p.stock > 0 && addToCart(p)}
                                        className={`p-3 rounded-xl border transition-colors cursor-pointer flex flex-col justify-between space-y-2 ${p.stock > 0 ? 'bg-white border-gray-200 hover:border-blue-400 hover:bg-gray-50' : 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed'
                                            }`}
                                    >
                                        <div>
                                            <div className="flex items-center justify-between text-[10px] text-gray-400">
                                                <span>{p.category?.name || 'Ritel'}</span>
                                                <span>Stok: {p.stock}</span>
                                            </div>
                                            <h4 className="font-semibold text-xs text-gray-900 mt-1">{p.name}</h4>
                                        </div>
                                        <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                                            <span className="text-xs font-bold text-gray-900">{formatIDR(p.price)}</span>
                                            <span className="text-xs font-medium text-blue-600">+</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Area: Cart & Checkout Form */}
                <div className="w-full md:w-96 bg-white rounded-3xl border border-gray-100/80 shadow-xs p-4 flex flex-col">
                    <div className="pb-3 border-b border-gray-200 space-y-2">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-sm text-gray-900 flex items-center gap-2">
                                <ShoppingCart className="w-4 h-4 text-blue-600" /> Ringkasan Kasir
                            </h3>
                        </div>

                        {/* Selected Member Display / Selector */}
                        <div className="relative">
                            {selectedMember ? (
                                <div className="flex items-center justify-between p-2 rounded-xl bg-blue-50 border border-blue-200 text-xs">
                                    <div>
                                        <p className="font-bold text-blue-900">{selectedMember.full_name}</p>
                                        <p className="text-[10px] text-blue-600">{selectedMember.member_code} • {selectedMember.phone}</p>
                                    </div>
                                    <button onClick={() => setSelectedMember(null)} className="text-blue-500 hover:text-blue-800 p-1"><X className="w-3.5 h-3.5" /></button>
                                </div>
                            ) : (
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={memberSearch}
                                        onChange={(e) => setMemberSearch(e.target.value)}
                                        placeholder="Pilih/Cari Member Gym..."
                                        className="w-full px-2.5 py-1.5 border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500"
                                    />
                                    {memberSearch && (
                                        <div className="absolute z-20 left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                                            {filteredMembers.length === 0 ? (
                                                <p className="p-2 text-xs text-gray-400 text-center">Member tidak ditemukan.</p>
                                            ) : (
                                                filteredMembers.map((m) => (
                                                    <div
                                                        key={m.id}
                                                        onClick={() => {
                                                            setSelectedMember(m);
                                                            setMemberSearch('');
                                                        }}
                                                        className="p-2 hover:bg-blue-50 cursor-pointer text-xs border-b border-gray-100 last:border-0"
                                                    >
                                                        <p className="font-semibold text-gray-900">{m.full_name}</p>
                                                        <p className="text-[10px] text-gray-400">{m.member_code} • {m.phone}</p>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Cart Items List */}
                    <div className="flex-1 overflow-y-auto py-3 space-y-2">
                        {cart.length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-8">Keranjang masih kosong.</p>
                        ) : (
                            cart.map((item) => (
                                <div key={item.product.id} className={`flex items-center justify-between p-2 rounded-xl text-xs ${(item.item_type === 'package' || item.item_type === 'pt_package') ? 'bg-blue-50/70 border border-blue-200' : 'bg-gray-50'}`}>
                                    <div className="flex-1 min-w-0 pr-2">
                                        <p className="font-medium text-gray-900 truncate">{item.product.name}</p>
                                        <p className="text-gray-500">{formatIDR(item.product.price)}</p>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => updateQty(item.product.id, -1)} className="p-1 hover:bg-gray-200"><Minus className="w-3 h-3 text-gray-600" /></button>
                                        <span className="w-6 text-center font-medium">{item.quantity}</span>
                                        <button onClick={() => updateQty(item.product.id, 1)} className="p-1 hover:bg-gray-200"><Plus className="w-3 h-3 text-gray-600" /></button>
                                        <button onClick={() => removeFromCart(item.product.id)} className="p-1 text-red-500 hover:bg-red-50 ml-1"><Trash2 className="w-3 h-3" /></button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Summary & Form */}
                    <div className="border-t border-gray-200 pt-3 space-y-2 text-xs">
                        <div className="flex justify-between"><span>Subtotal</span><span className="font-medium">{formatIDR(subtotal)}</span></div>
                        {showTaxSetting && (
                            <div className="flex justify-between text-gray-600">
                                <span>PPN 11% (Ritel)</span>
                                <span className="font-medium">{formatIDR(tax)}</span>
                            </div>
                        )}
                        <div className="flex justify-between items-center">
                            <span>Diskon</span>
                            <input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))}
                                className="w-24 px-2 py-1 border border-gray-300 rounded text-right text-xs" />
                        </div>
                        <div className="flex justify-between pt-2 border-t border-gray-200 text-base font-semibold text-gray-900">
                            <span>Total</span><span>{formatIDR(totalAmount)}</span>
                        </div>

                        <div className="pt-2">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Metode Pembayaran</label>
                            <div className="grid grid-cols-3 gap-1.5">
                                {['cash', 'qris', 'debit'].map((m) => (
                                    <button key={m} type="button" onClick={() => setPaymentMethod(m)}
                                        className={`py-1.5 text-xs font-medium uppercase border transition-colors ${paymentMethod === m ? 'bg-blue-50 text-blue-700 border-blue-300 font-bold' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}>
                                        {m}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-2">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Uang Diterima</label>
                            <input type="text" inputMode="decimal" value={formatCurrencyDisplay(paidAmount)} onChange={(e) => setPaidAmount(parseCurrencyInput(e.target.value))}
                                placeholder="0" className={inputClass} />
                        </div>

                        {Number(paidAmount) >= totalAmount && totalAmount > 0 && (
                            <div className="flex justify-between pt-1 text-green-600 font-medium text-sm">
                                <span>Kembalian</span><span>{formatIDR(changeAmount)}</span>
                            </div>
                        )}

                        <button onClick={handleCheckout} disabled={cart.length === 0 || isProcessing}
                            className="w-full mt-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl disabled:opacity-40 transition-colors shadow-2xs cursor-pointer">
                            {isProcessing ? 'Memproses Transaksi...' : 'Bayar Transaksi'}
                        </button>

                        <button
                            type="button"
                            onClick={handleCancelTransaction}
                            disabled={cart.length === 0 && !selectedMember && !paidAmount && Number(discount) === 0}
                            className="w-full mt-1.5 py-2 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 text-xs font-semibold rounded-xl border border-gray-200 hover:border-red-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                        >
                            <X className="w-3.5 h-3.5" />
                            <span>Batalkan Transaksi</span>
                        </button>
                    </div>
                </div>
            </div>
        </AdminLayout>
    );
}

import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Dumbbell, Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck, UserCheck, User } from 'lucide-react';

export default function DesktopLoginView({
    data,
    setData,
    processing,
    errors,
    demoAccounts,
    selectedRole,
    handleSelectDemo,
    handleSubmit,
    showPassword,
    setShowPassword,
}) {
    const { gym_name, gym_tagline, gym_logo } = usePage().props;

    return (
        <div className="min-h-screen text-gray-900 flex items-center justify-center p-6 lg:p-10 selection:bg-blue-600 selection:text-white relative overflow-hidden font-sans">
            <Head title={`Masuk — ${gym_name || 'Trakin Fitness Portal'}`} />

            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/images/login.avif')" }} />
            <div className="absolute inset-0 bg-white/75 backdrop-blur-[2px]" />
            <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />

            {/* CENTERED CARD PANEL */}
            <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl overflow-hidden shadow-xl shadow-blue-950/5 p-8 border border-gray-200/80 relative z-10 space-y-6">
                
                {/* Header Logo & Title */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl overflow-hidden border border-gray-200 shadow-md mb-1 bg-white">
                        <img src="/images/logo_trakin.png" alt="Trakin Logo" className="w-full h-full object-cover" />
                    </div>
                    <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight">{gym_name || 'Trakin Fitness'}</h1>
                    <p className="text-xs text-gray-500 font-medium">
                        {gym_tagline || 'Masukkan kredensial akun Anda untuk mengakses portal.'}
                    </p>
                </div>

                {/* Demo Accounts Quick Pill Selector */}
                <div className="bg-gray-50/80 p-3 rounded-2xl border border-gray-200/80 space-y-2">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                        Peran Akses Demo:
                    </span>
                    <div className="grid grid-cols-2 gap-1.5">
                        {demoAccounts.map((acc) => {
                            const Icon = acc.icon;
                            const isActive = selectedRole === acc.role;
                            return (
                                <button
                                    key={acc.role}
                                    type="button"
                                    onClick={() => handleSelectDemo(acc)}
                                    className={`flex items-center gap-2 p-2 rounded-xl text-left border transition-all ${
                                        isActive
                                            ? 'bg-blue-600 text-white border-blue-600 font-semibold shadow-md shadow-blue-600/25'
                                            : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                                    }`}
                                >
                                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                                        isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                                    }`}>
                                        <Icon className="w-3.5 h-3.5" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[11px] font-bold truncate leading-tight">{acc.role}</p>
                                        <p className={`text-[9px] truncate ${isActive ? 'text-blue-100' : 'text-gray-400'}`}>{acc.desc}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Username / Email */}
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Email / Username
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={data.email}
                                onChange={(e) => setData('email', e.target.value)}
                                placeholder="email / username / no. hp"
                                className="w-full pl-10 pr-4 py-3 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                required
                            />
                            <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
                        </div>
                        {errors.email && <p className="text-xs text-rose-600 font-medium mt-1">{errors.email}</p>}
                    </div>

                    {/* Password */}
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={data.password}
                                onChange={(e) => setData('password', e.target.value)}
                                placeholder="••••••••"
                                className="w-full pl-10 pr-10 py-3 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20 transition-all"
                                required
                            />
                            <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3.5 pointer-events-none" />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="p-1 text-gray-400 hover:text-gray-700 absolute right-3 top-3 transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        {errors.password && <p className="text-xs text-rose-600 font-medium mt-1">{errors.password}</p>}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={processing}
                        className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-blue-600/30 active:scale-[0.99] disabled:opacity-50 transition-all flex items-center justify-center gap-2 group mt-2"
                    >
                        {processing ? (
                            <span>Memproses...</span>
                        ) : (
                            <>
                                <span>Login</span>
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                </form>

                <div className="pt-2 text-center text-gray-400 text-[11px] font-medium border-t border-gray-100">
                    Trakin Management System • Versi 1.0
                </div>
            </div>
        </div>
    );
}

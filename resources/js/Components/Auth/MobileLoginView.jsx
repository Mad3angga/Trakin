import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import { Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function MobileLoginView({
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
    const { gym_name } = usePage().props;

    return (
        <div className="min-h-screen text-gray-900 flex flex-col justify-between relative overflow-hidden font-sans selection:bg-blue-600 selection:text-white">
            <Head title={`Masuk — ${gym_name || 'Trakin Fitness Mobile'}`} />

            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: "url('/images/login.avif')" }} />
            <div className="absolute inset-0 bg-white/75 backdrop-blur-[2px]" />
            <div className="absolute -top-32 -left-32 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none" />

            {/* Main Form Body */}
            <div className="flex-1 flex flex-col justify-between p-5 relative z-10 safe-top safe-bottom">
                {/* Login Card & Form */}
                <div className="my-auto space-y-5 py-4">
                    <div>
                        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Selamat Datang</h2>
                        <p className="text-xs text-gray-500 font-medium mt-1">
                            Masukkan kredensial akun Anda untuk masuk ke portal.
                        </p>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-3.5 bg-white/95 backdrop-blur-md p-5 rounded-2xl border border-gray-200/80 shadow-xl shadow-blue-950/5">
                        {/* Debug Info */}
                        <div className="bg-yellow-100 p-2 rounded text-xs">
                            <div>Form loaded: {new Date().toISOString()}</div>
                            <div>Processing: {processing ? 'YES' : 'NO'}</div>
                            <div>Email: {data.email}</div>
                        </div>
                        
                        {/* Email / Username */}
                        <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider">
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
                        <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider">
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
                                    className="p-2 text-gray-400 hover:text-gray-700 absolute right-2 top-2 transition-colors"
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
                            onClick={(e) => {
                                console.log('[DEBUG MOBILE] Button clicked directly', {
                                    processing,
                                    disabled: processing,
                                    eventType: e.type,
                                    target: e.target.tagName,
                                });
                            }}
                            className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-blue-600/30 active:scale-[0.98] disabled:opacity-50 transition-all flex items-center justify-center gap-2 group mt-2"
                        >
                            {processing ? (
                                <span>Memproses...</span>
                            ) : (
                                <>
                                    <span>Login Sekarang</span>
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Footer */}
                <div className="text-center text-[10px] text-gray-400 font-medium py-1">
                    Trakin App v1.0 • Capacitor iOS Ready
                </div>
            </div>
        </div>
    );
}

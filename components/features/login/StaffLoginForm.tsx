'use client';

import React from 'react';
import { Mail, KeyRound, Eye, EyeOff, AlertCircle, ArrowRight, LucideIcon } from 'lucide-react';
import { UserRole } from '@/lib/types';

interface Role {
    id: UserRole;
    name: string;
    icon: LucideIcon;
    color: string;
}

interface StaffLoginFormProps {
    selectedRole: UserRole;
    roles: Role[];
    isDemo: boolean;
    email: string;
    setEmail: (e: string) => void;
    password: string;
    setPassword: (p: string) => void;
    showPassword: boolean;
    setShowPassword: (s: boolean) => void;
    loginError: string;
    setLoginError: (e: string) => void;
    isLoading: boolean;
    onLogin: (e: React.FormEvent) => void;
    onDirectLogin: (role: UserRole) => void;
    onBack: () => void;
}

export const StaffLoginForm: React.FC<StaffLoginFormProps> = ({
    selectedRole, roles, isDemo,
    email, setEmail,
    password, setPassword,
    showPassword, setShowPassword,
    loginError, setLoginError,
    isLoading,
    onLogin, onDirectLogin, onBack
}) => {
    const roleData = roles.find(r => r.id === selectedRole);
    const Icon = roleData?.icon;

    return (
        <div className="w-full max-w-md animate-in slide-in-from-bottom-6 fade-in duration-500">
            <div className="bg-white rounded-3xl shadow-2xl p-8">
                <div className="text-center mb-6">
                    <div className={`h-14 w-14 ${roleData?.color.replace('bg-', 'bg-').replace('600', '100')} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                        {Icon && <Icon size={28} className={roleData?.color.replace('bg-', 'text-')} />}
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">{roleData?.name} Login</h2>
                </div>

                {isDemo ? (
                    <div className="flex flex-col gap-4">
                        <div className="bg-amber-50 text-amber-800 p-4 rounded-xl text-sm flex items-start gap-2">
                            <AlertCircle size={16} className="mt-0.5 shrink-0" />
                            <p>You are in <strong>Demo Mode</strong>. Click to login instantly without credentials.</p>
                        </div>
                        <button
                            onClick={() => onDirectLogin(selectedRole)}
                            className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                            Enter as {roleData?.name}
                            <ArrowRight size={20} />
                        </button>
                    </div>
                ) : (
                    <form onSubmit={onLogin} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <div className="relative">
                                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    value={email}
                                    onChange={e => { setEmail(e.target.value); setLoginError(''); }}
                                    placeholder={`admin@school.com`}
                                    className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                                    required
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                            <div className="relative">
                                <KeyRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => { setPassword(e.target.value); setLoginError(''); }}
                                    placeholder="Enter your password"
                                    className="w-full pl-11 pr-12 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                                    required
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        {loginError && (
                            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-xl">
                                <AlertCircle size={18} />
                                {loginError}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isLoading ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                            ) : (
                                <>
                                    Login
                                    <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>
                )}

                <div className="flex justify-center mt-6">
                    <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1">
                        ← Select a different role
                    </button>
                </div>
            </div>
        </div>
    );
};

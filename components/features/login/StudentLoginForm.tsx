'use client';

import React from 'react';
import { GraduationCap, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';

interface StudentLoginFormProps {
    studentNo: string;
    setStudentNo: (s: string) => void;
    password: string;
    setPassword: (p: string) => void;
    showPassword: boolean;
    setShowPassword: (s: boolean) => void;
    loginError: string;
    setLoginError: (e: string) => void;
    isLoading: boolean;
    onSubmit: (e: React.FormEvent) => void;
    onBack: () => void;
    onForgotPassword: () => void;
}

export const StudentLoginForm: React.FC<StudentLoginFormProps> = ({
    studentNo, setStudentNo,
    password, setPassword,
    showPassword, setShowPassword,
    loginError, setLoginError,
    isLoading,
    onSubmit, onBack, onForgotPassword
}) => {
    return (
        <div className="w-full max-w-md animate-in slide-in-from-bottom-6 fade-in duration-500">
            <div className="bg-white rounded-3xl shadow-2xl p-8">
                <div className="text-center mb-6">
                    <div className="h-14 w-14 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <GraduationCap size={28} className="text-purple-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Student / Parent Portal</h2>
                </div>

                <form onSubmit={onSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Student Number</label>
                        <input
                            type="text"
                            value={studentNo}
                            onChange={e => { setStudentNo(e.target.value); setLoginError(''); }}
                            placeholder="e.g. ST001"
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={e => { setPassword(e.target.value); setLoginError(''); }}
                                placeholder="Enter your password"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 pr-12"
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
                        className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                        {isLoading ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                        ) : (
                            <>
                                Login to Portal
                                <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                </form>

                <div className="flex items-center justify-between mt-4">
                    <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-700 font-medium">
                        ← Back
                    </button>
                    <button onClick={onForgotPassword} className="text-sm text-purple-600 hover:text-purple-800 font-medium">
                        Forgot Password?
                    </button>
                </div>
            </div>
        </div>
    );
};

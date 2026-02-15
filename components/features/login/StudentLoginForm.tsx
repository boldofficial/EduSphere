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
    isDemo: boolean;
    onDirectLogin: (role: 'student') => void;
}

export const StudentLoginForm: React.FC<StudentLoginFormProps> = ({
    studentNo, setStudentNo,
    password, setPassword,
    showPassword, setShowPassword,
    loginError, setLoginError,
    isLoading,
    onSubmit, onBack, onForgotPassword,
    isDemo, onDirectLogin
}) => {
    return (
        <div className="w-full max-w-md animate-in fade-in duration-500">
            {isDemo ? (
                <div className="mb-6">
                    <div className="bg-purple-50 text-purple-800 p-4 rounded-xl text-sm flex items-start gap-2 mb-4 border border-purple-100">
                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                        <p>You are in <strong>Demo Mode</strong>. One-click access to the student dashboard.</p>
                    </div>
                    <button
                        onClick={() => onDirectLogin('student')}
                        className="w-full py-4 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                        Enter as Demo Student
                        <ArrowRight size={20} />
                    </button>

                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                        <div className="relative flex justify-center text-xs uppercase"><span className="bg-white px-2 text-gray-400">Or Login Manually</span></div>
                    </div>
                </div>
            ) : null}

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
    );
};

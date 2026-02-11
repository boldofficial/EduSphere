'use client';

import React from 'react';
import { KeyRound, Mail, AlertCircle, CheckCircle } from 'lucide-react';

interface ForgotPasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
    studentNo: string;
    setStudentNo: (s: string) => void;
    email: string;
    setEmail: (e: string) => void;
    error: string;
    setError: (e: string) => void;
    success: boolean;
    setSuccess: (s: boolean) => void;
    newPassword: string;
    isLoading: boolean;
    onSubmit: (e: React.FormEvent) => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
    isOpen, onClose,
    studentNo, setStudentNo,
    email, setEmail,
    error, setError,
    success, setSuccess,
    newPassword,
    isLoading,
    onSubmit
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 fade-in duration-300" onClick={e => e.stopPropagation()}>
                {!success ? (
                    <>
                        <div className="text-center mb-6">
                            <div className="h-14 w-14 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <KeyRound size={28} className="text-purple-600" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900">Reset Password</h2>
                            <p className="text-sm text-gray-500 mt-2">Enter your Student Number and registered email to reset your password.</p>
                        </div>

                        <form onSubmit={onSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Student Number</label>
                                <input
                                    type="text"
                                    value={studentNo}
                                    onChange={e => { setStudentNo(e.target.value); setError(''); }}
                                    placeholder="e.g. ST001"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Registered Parent Email</label>
                                <div className="relative">
                                    <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => { setEmail(e.target.value); setError(''); }}
                                        placeholder="parent@example.com"
                                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                                        required
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-xl">
                                    <AlertCircle size={18} />
                                    {error}
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
                                    'Reset Password'
                                )}
                            </button>
                        </form>

                        <button onClick={onClose} className="w-full mt-4 text-sm text-gray-500 hover:text-gray-700 font-medium">
                            Cancel
                        </button>
                    </>
                ) : (
                    <div className="text-center">
                        <div className="h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle size={32} className="text-green-600" />
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Reset!</h2>
                        <p className="text-gray-600 mb-6">Your new password has been generated. Please save it securely.</p>
                        <div className="bg-gray-100 rounded-xl p-4 mb-6">
                            <p className="text-xs text-gray-500 uppercase font-medium mb-1">New Password</p>
                            <p className="text-2xl font-mono font-bold text-gray-900 tracking-wider">{newPassword}</p>
                        </div>
                        <p className="text-xs text-gray-500 mb-6">In a real system, this password would be sent to your registered email.</p>
                        <button
                            onClick={() => { setSuccess(false); onClose(); }}
                            className="w-full py-3 bg-gray-900 text-white font-bold rounded-xl hover:bg-gray-800 transition-colors"
                        >
                            Done
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

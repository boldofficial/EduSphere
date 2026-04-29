'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Shield, Loader2, AlertCircle, Key } from 'lucide-react';

interface TwoFactorVerifyProps {
    onVerify: (code: string) => Promise<void>;
    onUseBackupCode: (code: string) => Promise<void>;
    onCancel: () => void;
    error?: string;
}

export const TwoFactorVerify: React.FC<TwoFactorVerifyProps> = ({
    onVerify,
    onUseBackupCode,
    onCancel,
    error
}) => {
    const [code, setCode] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [localError, setLocalError] = useState('');
    const [mode, setMode] = useState<'totp' | 'backup'>('totp');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        inputRef.current?.focus();
    }, [mode]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code || code.length < 6) {
            setLocalError('Please enter a valid code');
            return;
        }

        setIsLoading(true);
        setLocalError('');

        try {
            if (mode === 'totp') {
                await onVerify(code);
            } else {
                await onUseBackupCode(code);
            }
        } catch (err: any) {
            setLocalError(err.message || 'Invalid code');
        } finally {
            setIsLoading(false);
        }
    };

    const displayError = localError || error;

    return (
        <div className="w-full max-w-md mx-auto">
            <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Shield className="w-8 h-8 text-brand-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Two-Factor Authentication</h2>
                    <p className="text-gray-500 mt-2">
                        {mode === 'totp' 
                            ? 'Enter the 6-digit code from your authenticator app'
                            : 'Enter one of your backup codes'}
                    </p>
                </div>

                {displayError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                        <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                        <p className="text-sm text-red-600">{displayError}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <input
                            ref={inputRef}
                            type="text"
                            value={code}
                            onChange={(e) => {
                                const val = mode === 'totp' 
                                    ? e.target.value.replace(/\D/g, '').slice(0, 6)
                                    : e.target.value.toUpperCase();
                                setCode(val);
                                setLocalError('');
                            }}
                            placeholder={mode === 'totp' ? '000000' : 'ABCD-1234'}
                            className="w-full px-4 py-4 border border-gray-300 rounded-xl text-center text-2xl tracking-[0.5em] font-mono focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
                            autoComplete="one-time-code"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading || (mode === 'totp' ? code.length < 6 : code.length < 4)}
                        className="w-full py-4 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Verifying...
                            </>
                        ) : (
                            'Verify'
                        )}
                    </button>
                </form>

                <div className="mt-6 pt-6 border-t border-gray-100">
                    {mode === 'totp' ? (
                        <button
                            type="button"
                            onClick={() => { setMode('backup'); setCode(''); setLocalError(''); }}
                            className="w-full text-center text-sm text-gray-500 hover:text-brand-600 flex items-center justify-center gap-2"
                        >
                            <Key className="w-4 h-4" />
                            Use a backup code instead
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={() => { setMode('totp'); setCode(''); setLocalError(''); }}
                            className="w-full text-center text-sm text-gray-500 hover:text-brand-600"
                        >
                            Use authenticator app instead
                        </button>
                    )}
                </div>

                <div className="mt-4">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="w-full text-center text-sm text-gray-400 hover:text-gray-600"
                    >
                        Cancel and go back
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TwoFactorVerify;
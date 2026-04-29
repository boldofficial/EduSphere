'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Copy, Check, AlertCircle, Loader2 } from 'lucide-react';
import apiClient from '@/lib/api-client';

interface TwoFactorSetupProps {
    onComplete?: () => void;
    onCancel?: () => void;
}

interface SetupData {
    secret: string;
    qr_code: string;
    backup_codes: string[];
}

export const TwoFactorSetup: React.FC<TwoFactorSetupProps> = ({ onComplete, onCancel }) => {
    const [step, setStep] = useState<'setup' | 'verify' | 'success'>('setup');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [setupData, setSetupData] = useState<SetupData | null>(null);
    const [verificationCode, setVerificationCode] = useState('');
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    useEffect(() => {
        initiateSetup();
    }, []);

    const initiateSetup = async () => {
        setLoading(true);
        setError('');
        
        try {
            const res = await apiClient.post('users/2fa/setup/');
            setSetupData(res.data);
            setStep('verify');
        } catch (err: any) {
            console.error('2FA setup error:', err);
            setError(err.response?.data?.error || 'Failed to setup 2FA');
        } finally {
            setLoading(false);
        }
    };

    const verifyCode = async () => {
        if (!verificationCode || verificationCode.length < 6) {
            setError('Please enter a valid 6-digit code');
            return;
        }

        setLoading(true);
        setError('');

        try {
            await apiClient.post('users/2fa/verify/', { code: verificationCode });
            setStep('success');
            onComplete?.();
        } catch (err: any) {
            console.error('2FA verification error:', err);
            setError(err.response?.data?.error || 'Invalid verification code');
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = async (text: string, index: number) => {
        await navigator.clipboard.writeText(text);
        setCopiedCode(index.toString());
        setTimeout(() => setCopiedCode(null), 2000);
    };

    if (loading && !setupData) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
                <span className="ml-2 text-gray-600">Setting up 2FA...</span>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center">
                    <Shield className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Two-Factor Authentication</h3>
                    <p className="text-sm text-gray-500">Secure your account with 2FA</p>
                </div>
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            {step === 'verify' && setupData && (
                <div className="space-y-4">
                    <div className="text-center">
                        <p className="text-sm text-gray-600 mb-4">
                            Scan this QR code with your authenticator app (Google Authenticator, Authy, etc.)
                        </p>
                        <div className="flex justify-center mb-4">
                            <img 
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(setupData.qr_code)}`}
                                alt="2FA QR Code"
                                className="border rounded-lg"
                            />
                        </div>
                        <p className="text-xs text-gray-500 mb-4">
                            Or enter this secret manually: <code className="bg-gray-100 px-2 py-1 rounded">{setupData.secret}</code>
                        </p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Enter verification code
                        </label>
                        <input
                            type="text"
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl tracking-widest font-mono"
                            maxLength={6}
                        />
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                        <p className="text-sm text-yellow-800">
                            <strong>Save these backup codes!</strong> You can use them to access your account if you lose your phone.
                        </p>
                        <div className="mt-2 grid grid-cols-2 gap-2">
                            {setupData.backup_codes.map((code, index) => (
                                <button
                                    key={index}
                                    onClick={() => copyToClipboard(code, index)}
                                    className="flex items-center justify-between px-2 py-1 bg-white border rounded text-xs font-mono hover:bg-gray-50"
                                >
                                    <span>{code}</span>
                                    {copiedCode === index.toString() ? (
                                        <Check className="w-3 h-3 text-green-500" />
                                    ) : (
                                        <Copy className="w-3 h-3 text-gray-400" />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onCancel}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={verifyCode}
                            disabled={loading || verificationCode.length < 6}
                            className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Verify & Enable'}
                        </button>
                    </div>
                </div>
            )}

            {step === 'success' && (
                <div className="text-center py-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Check className="w-8 h-8 text-green-600" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">2FA Enabled!</h4>
                    <p className="text-sm text-gray-600 mb-4">
                        Your account is now protected with two-factor authentication.
                    </p>
                    <button
                        onClick={onComplete}
                        className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700"
                    >
                        Done
                    </button>
                </div>
            )}
        </div>
    );
};

export default TwoFactorSetup;
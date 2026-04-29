'use client';

import React, { useState, useEffect } from 'react';
import { Shield, ShieldOff, RefreshCw, Copy, Check, AlertCircle, Loader2, Key } from 'lucide-react';
import apiClient from '@/lib/api-client';

interface TwoFactorSettingsProps {
    onUpdate?: () => void;
}

export const TwoFactorSettings: React.FC<TwoFactorSettingsProps> = ({ onUpdate }) => {
    const [status, setStatus] = useState<{
        enabled: boolean;
        has_backup_codes: boolean;
        backup_codes_count: number;
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showSetup, setShowSetup] = useState(false);
    const [newBackupCodes, setNewBackupCodes] = useState<string[] | null>(null);

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        setLoading(true);
        try {
            const res = await apiClient.get('users/2fa/status/');
            setStatus(res.data);
        } catch (err: any) {
            console.error('Failed to fetch 2FA status:', err);
            setError('Failed to load 2FA status');
        } finally {
            setLoading(false);
        }
    };

    const handleDisable = async () => {
        if (!confirm('Are you sure you want to disable two-factor authentication? This will make your account less secure.')) {
            return;
        }

        setProcessing(true);
        setError('');
        setSuccess('');

        try {
            await apiClient.delete('users/2fa/setup/');
            setSuccess('Two-factor authentication has been disabled');
            await fetchStatus();
            onUpdate?.();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to disable 2FA');
        } finally {
            setProcessing(false);
        }
    };

    const handleRegenerateCodes = async () => {
        if (!confirm('This will invalidate your current backup codes and generate new ones. Continue?')) {
            return;
        }

        setProcessing(true);
        setError('');
        setSuccess('');
        setNewBackupCodes(null);

        try {
            const res = await apiClient.post('users/2fa/backup-codes/');
            setNewBackupCodes(res.data.backup_codes);
            setSuccess('New backup codes generated. Save them securely!');
            await fetchStatus();
            onUpdate?.();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to regenerate backup codes');
        } finally {
            setProcessing(false);
        }
    };

    const copyToClipboard = async (text: string) => {
        await navigator.clipboard.writeText(text);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="w-6 h-6 animate-spin text-brand-600 mr-2" />
                <span className="text-gray-600">Loading...</span>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    {status?.enabled ? (
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <Shield className="w-5 h-5 text-green-600" />
                        </div>
                    ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <ShieldOff className="w-5 h-5 text-gray-500" />
                        </div>
                    )}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Two-Factor Authentication</h3>
                        <p className="text-sm text-gray-500">
                            {status?.enabled ? 'Enabled' : 'Disabled'}
                        </p>
                    </div>
                </div>

                {status?.enabled && (
                    <button
                        onClick={handleDisable}
                        disabled={processing}
                        className="px-4 py-2 text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-50 flex items-center gap-2"
                    >
                        {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldOff className="w-4 h-4" />}
                        Disable
                    </button>
                )}
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            {success && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
                    <Check className="w-5 h-5 text-green-500 mt-0.5" />
                    <p className="text-sm text-green-600">{success}</p>
                </div>
            )}

            {newBackupCodes && (
                <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <Key className="w-5 h-5 text-yellow-600" />
                        <h4 className="font-medium text-yellow-800">New Backup Codes</h4>
                    </div>
                    <p className="text-sm text-yellow-700 mb-3">
                        Save these codes in a secure location. Each code can only be used once.
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        {newBackupCodes.map((code, index) => (
                            <div
                                key={index}
                                className="flex items-center justify-between px-3 py-2 bg-white border border-yellow-200 rounded text-sm font-mono"
                            >
                                <span>{code}</span>
                                <button
                                    onClick={() => copyToClipboard(code)}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <Copy className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!status?.enabled && !showSetup && (
                <div className="text-center py-4">
                    <p className="text-gray-600 mb-4">
                        Add an extra layer of security to your account by enabling two-factor authentication.
                    </p>
                    <button
                        onClick={() => setShowSetup(true)}
                        className="px-6 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 flex items-center gap-2 mx-auto"
                    >
                        <Shield className="w-4 h-4" />
                        Enable 2FA
                    </button>
                </div>
            )}

            {showSetup && (
                <div className="mt-4">
                    <TwoFactorSetupForm onComplete={() => {
                        setShowSetup(false);
                        fetchStatus();
                        onUpdate?.();
                    }} onCancel={() => setShowSetup(false)} />
                </div>
            )}

            {status?.enabled && (
                <div className="border-t border-gray-200 pt-4 mt-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-medium text-gray-900">Backup Codes</h4>
                            <p className="text-sm text-gray-500">
                                {status.backup_codes_count} codes remaining
                            </p>
                        </div>
                        <button
                            onClick={handleRegenerateCodes}
                            disabled={processing}
                            className="px-4 py-2 text-brand-600 border border-brand-200 rounded-lg hover:bg-brand-50 disabled:opacity-50 flex items-center gap-2"
                        >
                            {processing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                            Regenerate
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

// Inline form component for setup
function TwoFactorSetupForm({ onComplete, onCancel }: { onComplete: () => void; onCancel: () => void }) {
    const [loading, setLoading] = useState(true);
    const [setupData, setSetupData] = useState<{
        secret: string;
        qr_code: string;
        backup_codes: string[];
    } | null>(null);
    const [code, setCode] = useState('');
    const [error, setError] = useState('');
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        initiateSetup();
    }, []);

    const initiateSetup = async () => {
        setLoading(true);
        try {
            const res = await apiClient.post('users/2fa/setup/');
            setSetupData(res.data);
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to setup 2FA');
        } finally {
            setLoading(false);
        }
    };

    const verify = async () => {
        if (code.length < 6) {
            setError('Please enter a valid 6-digit code');
            return;
        }

        setProcessing(true);
        setError('');

        try {
            await apiClient.post('users/2fa/verify/', { code });
            onComplete();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Invalid verification code');
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-4">
                <Loader2 className="w-5 h-5 animate-spin text-brand-600 mr-2" />
                <span>Setting up...</span>
            </div>
        );
    }

    if (!setupData) {
        return (
            <div className="text-center p-4">
                <p className="text-red-600">{error}</p>
                <button onClick={onCancel} className="mt-2 text-brand-600">Cancel</button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="text-center">
                <p className="text-sm text-gray-600 mb-3">Scan with your authenticator app</p>
                <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(setupData.qr_code)}`}
                    alt="QR Code"
                    className="mx-auto border rounded"
                />
                <p className="text-xs text-gray-500 mt-2">
                    Secret: <code className="bg-gray-100 px-1 rounded">{setupData.secret}</code>
                </p>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Enter code from app
                </label>
                <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="w-full px-3 py-2 border rounded-lg text-center font-mono tracking-widest"
                    maxLength={6}
                />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <div className="flex gap-2">
                <button
                    onClick={onCancel}
                    className="flex-1 px-3 py-2 border rounded-lg hover:bg-gray-50"
                >
                    Cancel
                </button>
                <button
                    onClick={verify}
                    disabled={processing || code.length < 6}
                    className="flex-1 px-3 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
                >
                    {processing ? 'Verifying...' : 'Verify'}
                </button>
            </div>
        </div>
    );
}

export default TwoFactorSettings;
import { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api-client';

interface TwoFactorStatus {
    enabled: boolean;
    has_backup_codes: boolean;
    backup_codes_count: number;
}

export function useTwoFactor() {
    const [status, setStatus] = useState<TwoFactorStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchStatus = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const res = await apiClient.get('users/2fa/status/');
            setStatus(res.data);
        } catch (err: any) {
            console.error('Failed to fetch 2FA status:', err);
            setError(err.response?.data?.error || 'Failed to fetch 2FA status');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStatus();
    }, [fetchStatus]);

    const enable = useCallback(async (code: string) => {
        const res = await apiClient.post('users/2fa/verify/', { code });
        await fetchStatus();
        return res.data;
    }, [fetchStatus]);

    const disable = useCallback(async () => {
        await apiClient.delete('users/2fa/setup/');
        await fetchStatus();
    }, [fetchStatus]);

    const regenerateBackupCodes = useCallback(async () => {
        const res = await apiClient.post('users/2fa/backup-codes/');
        await fetchStatus();
        return res.data.backup_codes;
    }, [fetchStatus]);

    return {
        status,
        loading,
        error,
        isEnabled: status?.enabled ?? false,
        refresh: fetchStatus,
        enable,
        disable,
        regenerateBackupCodes,
    };
}
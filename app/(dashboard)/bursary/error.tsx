'use client';

import { useEffect } from 'react';
import { RefreshCw, CreditCard, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function BursaryError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Bursary Module Error:', error);
    }, [error]);

    return (
        <div className="min-h-[60vh] flex items-center justify-center p-6 text-center">
            <div className="max-w-md w-full space-y-6">
                <div className="relative mx-auto w-24 h-24 bg-amber-50 rounded-3xl flex items-center justify-center text-amber-600">
                    <CreditCard className="w-12 h-12" />
                    <AlertCircle className="absolute -top-1 -right-1 w-8 h-8 bg-white rounded-full p-1 text-red-500" />
                </div>
                
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-gray-900">Bursary Module Failure</h2>
                    <p className="text-gray-600">
                        We were unable to load the financial records at this time. This may be due to a secure session timeout or a server communication error.
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    <Button 
                        onClick={reset}
                        className="w-full bg-brand-600 hover:bg-brand-700 py-6 text-lg rounded-xl"
                    >
                        <RefreshCw className="mr-2 h-5 w-5" />
                        Retry Financial Sync
                    </Button>
                    <p className="text-xs text-gray-400 font-mono">
                        System Reference: {error.digest || 'FIN_SYNC_FAILED'}
                    </p>
                </div>
            </div>
        </div>
    );
}

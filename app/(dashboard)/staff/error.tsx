'use client';

import { useEffect } from 'react';
import { RefreshCw, Users, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function StaffError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Staff Module Error:', error);
    }, [error]);

    return (
        <div className="min-h-[60vh] flex items-center justify-center p-6">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="relative mx-auto w-24 h-24 bg-red-50 rounded-3xl flex items-center justify-center text-red-600">
                    <Users className="w-12 h-12" />
                    <AlertCircle className="absolute -top-1 -right-1 w-8 h-8 bg-white rounded-full p-1" />
                </div>
                
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-gray-900">Staff Records Unavailable</h2>
                    <p className="text-gray-600">
                        We encountered a problem while trying to load the staff directory. This usually happens due to a temporary connection issue.
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    <Button 
                        onClick={reset}
                        className="w-full bg-brand-600 hover:bg-brand-700 py-6 text-lg"
                    >
                        <RefreshCw className="mr-2 h-5 w-5" />
                        Retry Connection
                    </Button>
                    <p className="text-xs text-gray-400">
                        Error ID: {error.digest || 'Internal Module Failure'}
                    </p>
                </div>
            </div>
        </div>
    );
}

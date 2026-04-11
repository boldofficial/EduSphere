'use client';

import { useEffect } from 'react';
import { RefreshCw, GraduationCap, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function StudentsError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Students Module Error:', error);
    }, [error]);

    return (
        <div className="min-h-[60vh] flex items-center justify-center p-6 text-center">
            <div className="max-w-md w-full space-y-6">
                <div className="relative mx-auto w-24 h-24 bg-brand-50 rounded-3xl flex items-center justify-center text-brand-600">
                    <GraduationCap className="w-12 h-12" />
                    <AlertCircle className="absolute -top-1 -right-1 w-8 h-8 bg-white rounded-full p-1 text-red-500" />
                </div>
                
                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-gray-900">Unable to load Students</h2>
                    <p className="text-gray-600">
                        Something went wrong while fetching the student database. This could be due to a brief interruption in service.
                    </p>
                </div>

                <div className="flex flex-col gap-3">
                    <Button 
                        onClick={reset}
                        className="w-full bg-brand-600 hover:bg-brand-700 py-6 text-lg rounded-xl"
                    >
                        <RefreshCw className="mr-2 h-5 w-5" />
                        Try to Reconnect
                    </Button>
                    <p className="text-xs text-gray-400 font-mono">
                        Error Reference: {error.digest || 'STUDENT_TRANS_FAILED'}
                    </p>
                </div>
            </div>
        </div>
    );
}

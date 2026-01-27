import React from 'react';

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success';
}

export function Badge({ className = '', variant = 'default', ...props }: BadgeProps) {
    const variants = {
        default: 'border-transparent bg-brand-600 text-white hover:bg-brand-700',
        secondary: 'border-transparent bg-gray-100 text-gray-900 hover:bg-gray-200',
        destructive: 'border-transparent bg-red-500 text-white hover:bg-red-600',
        outline: 'text-gray-950 border-gray-200',
        success: 'border-transparent bg-green-100 text-green-700 hover:bg-green-200',
    };

    return (
        <div
            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-gray-950 focus:ring-offset-2 ${variants[variant]} ${className}`}
            {...props}
        />
    );
}

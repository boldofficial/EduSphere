import React from 'react';

interface CardProps {
    children?: React.ReactNode;
    title?: string;
    className?: string;
    action?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, title, className, action }) => (
    <div className={`rounded-lg border border-gray-200 bg-white text-gray-950 shadow-sm transition-all hover:shadow-md ${className || ''}`}>
        {(title || action) && (
            <div className="flex flex-col space-y-1.5 p-6 pb-2">
                <div className="flex items-center justify-between">
                    {title && <h3 className="font-semibold leading-none tracking-tight">{title}</h3>}
                    {action && <div>{action}</div>}
                </div>
            </div>
        )}
        <div className="p-6 pt-2">{children}</div>
    </div>
);

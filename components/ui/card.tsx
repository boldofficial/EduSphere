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

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
    <div className={`flex flex-col space-y-1.5 p-6 ${className || ''}`} {...props} />
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, ...props }) => (
    <h3 className={`font-semibold leading-none tracking-tight ${className || ''}`} {...props} />
);

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, ...props }) => (
    <p className={`text-sm text-muted-foreground ${className || ''}`} {...props} />
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
    <div className={`p-6 pt-0 ${className || ''}`} {...props} />
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
    <div className={`flex items-center p-6 pt-0 ${className || ''}`} {...props} />
);


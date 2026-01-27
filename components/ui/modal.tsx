import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
    if (!isOpen) return null;
    const sizes = {
        sm: "max-w-md",
        md: "max-w-lg sm:max-w-2xl",
        lg: "max-w-4xl",
        xl: "max-w-6xl"
    };
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200 overflow-y-auto backdrop-blur-sm">
            <div className={`relative w-full ${sizes[size]} rounded-xl bg-white shadow-2xl my-8 flex flex-col max-h-[90vh]`}>
                <div className="flex items-center justify-between border-b p-4 bg-gray-50 rounded-t-xl shrink-0">
                    <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
                    <button onClick={onClose} className="rounded-full p-1 hover:bg-gray-200 transition-colors">
                        <X className="h-5 w-5 text-gray-500" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">{children}</div>
            </div>
        </div>
    );
};

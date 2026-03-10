'use client';

import React from 'react';

interface ConfirmActionModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    confirmVariant?: 'danger' | 'warning' | 'primary';
    isProcessing?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

const variantClasses = {
    danger: 'bg-rose-600 hover:bg-rose-700',
    warning: 'bg-amber-600 hover:bg-amber-700',
    primary: 'bg-brand-600 hover:bg-brand-700',
};

export function ConfirmActionModal({
    isOpen,
    title,
    message,
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    confirmVariant = 'danger',
    isProcessing = false,
    onConfirm,
    onCancel,
}: ConfirmActionModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[110] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl bg-white border border-gray-100 shadow-2xl overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-100">
                    <h3 className="text-lg font-black text-gray-900">{title}</h3>
                    <p className="text-sm text-gray-500 mt-1">{message}</p>
                </div>
                <div className="px-6 py-4 flex items-center justify-end gap-3 bg-gray-50">
                    <button
                        type="button"
                        onClick={onCancel}
                        disabled={isProcessing}
                        className="px-4 py-2 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
                    >
                        {cancelLabel}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        disabled={isProcessing}
                        className={`px-4 py-2 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-50 ${variantClasses[confirmVariant]}`}
                    >
                        {isProcessing ? 'Please wait...' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}


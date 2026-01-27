'use client';

import React, { useRef } from 'react';
import { Camera, X, User } from 'lucide-react';

interface PhotoUploadProps {
    value?: string | null;
    onChange: (base64: string | null) => void;
    label?: string;
    size?: 'sm' | 'md' | 'lg';
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({
    value,
    onChange,
    label = "Photo",
    size = 'md'
}) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const sizeClasses = {
        sm: 'h-16 w-16',
        md: 'h-24 w-24',
        lg: 'h-32 w-32'
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file');
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert('Image must be less than 2MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const base64 = event.target?.result as string;
            onChange(base64);
        };
        reader.readAsDataURL(file);
    };

    const handleRemove = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange(null);
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-2">
            {label && (
                <label className="block text-sm font-medium text-gray-700">
                    {label}
                </label>
            )}
            <div
                className={`relative ${sizeClasses[size]} rounded-lg border-2 border-dashed border-gray-300 hover:border-brand-400 transition-colors cursor-pointer overflow-hidden bg-gray-50 group`}
                onClick={() => inputRef.current?.click()}
            >
                {value ? (
                    <>
                        <img
                            src={value}
                            alt="Preview"
                            className="h-full w-full object-cover"
                        />
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="absolute top-1 right-1 h-5 w-5 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </>
                ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center text-gray-400 group-hover:text-brand-500 transition-colors">
                        <Camera className="h-6 w-6 mb-1" />
                        <span className="text-[10px] font-medium">Upload</span>
                    </div>
                )}
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                />
            </div>
            <p className="text-[10px] text-gray-400">Max 2MB, JPG/PNG</p>
        </div>
    );
};

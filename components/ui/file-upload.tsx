'use client';

import React, { useRef, useState } from 'react';
import { Upload, X, FileText, Image as ImageIcon } from 'lucide-react';

interface FileUploadProps {
    value?: string | null;
    onChange: (base64: string | null) => void;
    label?: string;
    accept?: string;
    maxSizeMB?: number;
}

export const FileUpload: React.FC<FileUploadProps> = ({
    value,
    onChange,
    label,
    accept = "*/*",
    maxSizeMB = 5
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [fileName, setFileName] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size
        if (file.size > maxSizeMB * 1024 * 1024) {
            alert(`File must be less than ${maxSizeMB}MB`);
            return;
        }

        setFileName(file.name);
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
        setFileName(null);
        if (inputRef.current) {
            inputRef.current.value = '';
        }
    };

    const isImage = value?.startsWith('data:image/');

    return (
        <div className="space-y-2">
            {label && (
                <label className="block text-sm font-medium text-gray-700">
                    {label}
                </label>
            )}
            <div
                className={`relative min-h-[80px] w-full rounded-md border-2 border-dashed border-gray-300 hover:border-brand-400 transition-colors cursor-pointer overflow-hidden bg-gray-50 flex items-center justify-center p-4`}
                onClick={() => inputRef.current?.click()}
            >
                {value ? (
                    <div className="flex items-center gap-3 w-full">
                        {isImage ? (
                            <div className="h-12 w-12 rounded border bg-white overflow-hidden flex-shrink-0">
                                <img src={value} alt="Preview" className="h-full w-full object-cover" />
                            </div>
                        ) : (
                            <div className="h-12 w-12 rounded border bg-white flex items-center justify-center text-brand-600 flex-shrink-0">
                                <FileText className="h-6 w-6" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                                {fileName || (isImage ? 'Image Attached' : 'File Attached')}
                            </p>
                            <p className="text-xs text-gray-500">Click to change</p>
                        </div>
                        <button
                            type="button"
                            onClick={handleRemove}
                            className="p-1.5 hover:bg-red-50 rounded-full text-red-500 transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center text-gray-400 gap-1">
                        <Upload className="h-6 w-6" />
                        <span className="text-sm font-medium">Click to upload or drag & drop</span>
                        <span className="text-[10px]">Max {maxSizeMB}MB</span>
                    </div>
                )}
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    onChange={handleFileChange}
                    className="hidden"
                />
            </div>
        </div>
    );
};

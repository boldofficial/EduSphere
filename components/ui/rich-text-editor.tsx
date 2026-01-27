'use client';

import React, { useRef, useEffect, useState } from 'react';
import { Bold, Italic, List, ListOrdered, Type } from 'lucide-react';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export function RichTextEditor({ value, onChange, placeholder, className = '' }: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Sync external value to editor only if content is different
    useEffect(() => {
        if (editorRef.current && value !== editorRef.current.innerHTML) {
            editorRef.current.innerHTML = value || '';
        }
    }, [value]);

    const execCommand = (command: string, value: string | undefined = undefined) => {
        document.execCommand(command, false, value);
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    if (!isMounted) return null;

    return (
        <div className={`border rounded-md bg-white overflow-hidden focus-within:ring-2 focus-within:ring-brand-500 focus-within:border-transparent transition-all ${className}`}>
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-1 bg-gray-50 border-b border-gray-200">
                <button
                    type="button"
                    onClick={() => execCommand('bold')}
                    className="p-1.5 hover:bg-white hover:shadow-sm rounded text-gray-600 transition-all"
                    title="Bold"
                >
                    <Bold className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => execCommand('italic')}
                    className="p-1.5 hover:bg-white hover:shadow-sm rounded text-gray-600 transition-all"
                    title="Italic"
                >
                    <Italic className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-gray-300 mx-1" />
                <button
                    type="button"
                    onClick={() => execCommand('insertUnorderedList')}
                    className="p-1.5 hover:bg-white hover:shadow-sm rounded text-gray-600 transition-all"
                    title="Bullet List"
                >
                    <List className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => execCommand('insertOrderedList')}
                    className="p-1.5 hover:bg-white hover:shadow-sm rounded text-gray-600 transition-all"
                    title="Numbered List"
                >
                    <ListOrdered className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-gray-300 mx-1" />
                <button
                    type="button"
                    onClick={() => {
                        const url = prompt('Enter URL:');
                        if (url) execCommand('createLink', url);
                    }}
                    className="px-2 py-1 text-xs font-bold hover:bg-white hover:shadow-sm rounded text-gray-600 transition-all"
                >
                    Link
                </button>
                <button
                    type="button"
                    onClick={() => execCommand('removeFormat')}
                    className="p-1.5 hover:bg-white hover:shadow-sm rounded text-gray-600 transition-all"
                    title="Clear Formatting"
                >
                    <Type className="w-4 h-4" />
                </button>
            </div>

            {/* Editable Area */}
            <div
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                className="p-3 min-h-[120px] max-h-[300px] overflow-auto focus:outline-none text-sm leading-relaxed prose prose-sm max-w-none"
                data-placeholder={placeholder}
            />

            <style jsx>{`
                [contenteditable]:empty:before {
                    content: attr(data-placeholder);
                    color: #9ca3af;
                    cursor: text;
                }
            `}</style>
        </div>
    );
}

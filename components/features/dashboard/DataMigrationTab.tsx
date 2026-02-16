'use client';

import React, { useState } from 'react';
import { Download, Upload, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import apiClient from '@/lib/api-client';
import { useToast } from '@/components/providers/toast-provider';

export const DataMigrationTab = () => {
    const { addToast } = useToast();
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [results, setResults] = useState<any>(null);

    const handleDownloadTemplate = async () => {
        try {
            // Direct download using window.location or fetch/blob
            // Using API route
            window.location.href = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/academic/data-migration/student-template/`;
        } catch (error) {
            addToast("Failed to download template", 'error');
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResults(null); // Reset results on new file
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            const response = await apiClient.post('academic/data-migration/import-students/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setResults(response.data);
            if (response.data.error_count === 0) {
                addToast(`Successfully imported ${response.data.success_count} students!`, 'success');
            } else {
                addToast(`Import completed with ${response.data.error_count} errors.`, 'warning');
            }
        } catch (error) {
            console.error("Upload failed", error);
            addToast("Failed to upload file. Please check the format.", 'error');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Data Migration</h2>
                    <p className="text-gray-500">Bulk import student records using standardized CSV templates.</p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Step 1: Download Template */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-10 w-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                            <span className="font-bold">1</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Download Template</h3>
                    </div>
                    <p className="text-gray-600 mb-6 text-sm">
                        Get the standardized CSV file. Fill it with your student data.
                        <br />
                        <span className="text-xs text-amber-600 font-medium">Note: Ensure 'Class Name' matches exactly with classes in the system (e.g., "JSS 1").</span>
                    </p>

                    <button
                        onClick={handleDownloadTemplate}
                        className="flex items-center gap-2 px-5 py-3 bg-white border-2 border-indigo-100 text-indigo-700 rounded-xl hover:bg-indigo-50 transition-colors font-bold w-full justify-center"
                    >
                        <Download size={20} />
                        Download CSV Template
                    </button>
                </div>

                {/* Step 2: Upload Data */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-10 w-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600">
                            <span className="font-bold">2</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Upload Data</h3>
                    </div>

                    <div className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-indigo-300 transition-colors bg-gray-50/50 group">
                        <FileSpreadsheet className="text-gray-400 mb-4 group-hover:text-indigo-400 transition-colors" size={40} />

                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="hidden"
                            id="file-upload"
                        />
                        <label
                            htmlFor="file-upload"
                            className="cursor-pointer text-indigo-600 font-bold hover:text-indigo-700 mb-2"
                        >
                            {file ? file.name : "Select CSV File"}
                        </label>
                        <p className="text-xs text-gray-400">Supported format: .csv</p>
                    </div>

                    <button
                        onClick={handleUpload}
                        disabled={!file || isUploading}
                        className="mt-6 flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors font-bold w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-200"
                    >
                        {isUploading ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                        {isUploading ? 'Importing...' : 'Start Import'}
                    </button>
                </div>
            </div>

            {/* Results Section */}
            {results && (
                <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Import Results</h3>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="p-4 bg-green-50 rounded-2xl border border-green-100 flex items-center gap-3">
                            <CheckCircle className="text-green-600" />
                            <div>
                                <p className="text-sm text-green-800 font-medium">Successful</p>
                                <p className="text-2xl font-bold text-green-900">{results.success_count}</p>
                            </div>
                        </div>
                        <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex items-center gap-3">
                            <AlertCircle className="text-red-600" />
                            <div>
                                <p className="text-sm text-red-800 font-medium">Errors</p>
                                <p className="text-2xl font-bold text-red-900">{results.error_count}</p>
                            </div>
                        </div>
                    </div>

                    {results.errors && results.errors.length > 0 && (
                        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
                            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 font-bold text-sm text-gray-700">
                                Detailed Error Log
                            </div>
                            <div className="max-h-96 overflow-y-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-gray-500 uppercase bg-gray-50 sticky top-0 font-bold">
                                        <tr>
                                            <th className="px-6 py-3">Row</th>
                                            <th className="px-6 py-3">Student Name</th>
                                            <th className="px-6 py-3">Issue</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.errors.map((err: any, idx: number) => (
                                            <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/50">
                                                <td className="px-6 py-3 font-bold text-gray-900">{err.row}</td>
                                                <td className="px-6 py-3 font-medium">{err.student}</td>
                                                <td className="px-6 py-3 text-red-600 font-medium">{err.reason}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

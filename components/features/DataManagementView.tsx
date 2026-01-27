'use client';

import React, { useRef } from 'react';
import { Download, Upload, Database, Cloud } from 'lucide-react';
import * as Utils from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/providers/toast-provider';
import {
    useStudents, useTeachers, useStaff, useClasses,
    useScores, useFees, usePayments, useExpenses, useAttendance,
    useSettings
} from '@/lib/hooks/use-data';

export const DataManagementView: React.FC = () => {
    const { addToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Get data from TanStack Query
    const { data: settings = Utils.INITIAL_SETTINGS } = useSettings();
    const { data: students = [] } = useStudents();
    const { data: teachers = [] } = useTeachers();
    const { data: staff = [] } = useStaff();
    const { data: classes = [] } = useClasses();
    const { data: scores = [] } = useScores();
    const { data: fees = [] } = useFees();
    const { data: payments = [] } = usePayments();
    const { data: expenses = [] } = useExpenses();
    const { data: attendance = [] } = useAttendance();

    const handleExport = () => {
        // Export from store (which is synced with database)
        const data = {
            settings,
            students,
            teachers,
            staff,
            classes,
            scores,
            fees,
            payments,
            expenses,
            attendance,
            exportedAt: new Date().toISOString(),
            version: '2.0' // Database version
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `school_backup_${Utils.getTodayString()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        addToast('Backup downloaded successfully', 'success');
    };

    const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target?.result as string);
                if (data.settings && data.students) {
                    addToast('Data import is not supported with database mode. Please use Supabase dashboard for bulk imports.', 'info');
                } else {
                    addToast('Invalid backup file format', 'error');
                }
            } catch (err) {
                addToast('Error parsing file', 'error');
            }
        };
        reader.readAsText(file);
        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <h1 className="text-2xl font-bold text-gray-900">Data Management</h1>

            <Card title="Backup & Restore">
                <div className="space-y-6">
                    <div className="flex items-center gap-4 p-4 border rounded-lg bg-blue-50 border-blue-100">
                        <div className="p-3 bg-blue-100 text-blue-600 rounded-full">
                            <Download className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900">Export Data</h3>
                            <p className="text-sm text-gray-600">
                                Download a complete JSON backup of all school records from the database.
                            </p>
                        </div>
                        <Button onClick={handleExport}>Download Backup</Button>
                    </div>

                    <div className="flex items-center gap-4 p-4 border rounded-lg bg-orange-50 border-orange-100">
                        <div className="p-3 bg-orange-100 text-orange-600 rounded-full">
                            <Upload className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-900">Import Data</h3>
                            <p className="text-sm text-gray-600">
                                For bulk data imports, please use the Supabase dashboard or SQL scripts.
                            </p>
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept=".json"
                            onChange={handleImport}
                        />
                        <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
                            Select File
                        </Button>
                    </div>
                </div>
            </Card>

            <Card title="System Info">
                <div className="text-sm text-gray-500 space-y-2">
                    <div className="flex items-center gap-2">
                        <Cloud className="h-4 w-4 text-green-500" />
                        <p>Storage Engine: <span className="font-medium text-green-600">Supabase Database</span></p>
                    </div>
                    <p>Last Sync: {new Date().toLocaleString()}</p>
                    <p className="text-xs mt-4">
                        All data is stored securely in the cloud database.
                    </p>
                </div>
            </Card>
        </div>
    );
};

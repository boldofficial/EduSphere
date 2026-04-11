'use client';

import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, Download, AlertCircle, Check, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/providers/toast-provider';
import { useStudents, useBulkImportScores, type BulkScoreImportData } from '@/lib/hooks/use-data';
import * as Utils from '@/lib/utils';
import * as Types from '@/lib/types';

interface BulkScoreImportProps {
    students: Types.Student[];
    session: string;
    term: string;
    onSuccess?: () => void;
}

export const BulkScoreImport: React.FC<BulkScoreImportProps> = ({
    students,
    session,
    term,
    onSuccess,
}) => {
    const { addToast } = useToast();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const { mutate: importScores, isPending: isImporting } = useBulkImportScores();

    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [parsedData, setParsedData] = useState<BulkScoreImportData[]>([]);
    const [errors, setErrors] = useState<Array<{ row: number; studentNo: string; error: string }>>([]);
    const [importMode, setImportMode] = useState<'create' | 'update' | 'upsert'>('upsert');
    const [selectedSubject, setSelectedSubject] = useState('');

    const getCsvTemplate = () => {
        const headers = 'student_no,subject,ca1_score,ca2_score,exam_score';
        const exampleRows = students.slice(0, 3).map(s =>
            `${s.student_no},${selectedSubject || 'Mathematics'},0,0,0`
        ).join('\n');
        return `${headers}\n${exampleRows}`;
    };

    const downloadTemplate = () => {
        const csv = getCsvTemplate();
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `score_import_template_${session}_${term}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        addToast('Template downloaded', 'success');
    };

    const parseFile = async (file: File) => {
        const text = await file.text();
        const lines = text.trim().split('\n');
        const headers = lines[0].toLowerCase().split(',').map(h => h.trim());

        const requiredHeaders = ['student_no', 'subject', 'ca1_score', 'ca2_score', 'exam_score'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

        if (missingHeaders.length > 0) {
            addToast(`Missing columns: ${missingHeaders.join(', ')}`, 'error');
            return;
        }

        const parsed: BulkScoreImportData[] = [];
        const parseErrors: Array<{ row: number; studentNo: string; error: string }> = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            if (values.length < 5) continue;

            const [studentNo, subject, ca1Str, ca2Str, examStr] = values;
            const ca1 = parseFloat(ca1Str);
            const ca2 = parseFloat(ca2Str);
            const exam = parseFloat(examStr);

            if (isNaN(ca1) || isNaN(ca2) || isNaN(exam)) {
                parseErrors.push({ row: i + 1, studentNo, error: 'Invalid score values' });
                continue;
            }

            if (ca1 > 20 || ca2 > 20 || exam > 60) {
                parseErrors.push({ row: i + 1, studentNo, error: 'Score exceeds maximum (CA:20, Exam:60)' });
                continue;
            }

            const student = students.find(s => s.student_no === studentNo);
            if (!student) {
                parseErrors.push({ row: i + 1, studentNo, error: 'Student not found' });
                continue;
            }

            parsed.push({
                student_id: student.id,
                subject: subject || selectedSubject,
                ca1,
                ca2,
                exam,
            });
        }

        setParsedData(parsed);
        setErrors(parseErrors);

        if (parseErrors.length > 0) {
            addToast(`Found ${parseErrors.length} errors`, 'warning');
        } else {
            addToast(`Parsed ${parsed.length} scores successfully`, 'success');
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.name.endsWith('.csv') && !file.name.endsWith('.xlsx')) {
            addToast('Please upload a CSV or Excel file', 'error');
            return;
        }

        setSelectedFile(file);
        parseFile(file);
    };

    const handleImport = () => {
        if (parsedData.length === 0) {
            addToast('No data to import', 'error');
            return;
        }

        importScores({
            session,
            term,
            mode: importMode,
            data: parsedData,
        }, {
            onSuccess: () => {
                addToast(`Successfully imported ${parsedData.length} scores`, 'success');
                setSelectedFile(null);
                setParsedData([]);
                setErrors([]);
                onSuccess?.();
            },
            onError: (err: any) => {
                addToast(err?.message || 'Import failed', 'error');
            },
        });
    };

    const handleReset = () => {
        setSelectedFile(null);
        setParsedData([]);
        setErrors([]);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <Card className="p-6">
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Bulk Score Import</h3>
                        <p className="text-sm text-gray-500">Import scores from CSV file</p>
                    </div>
                    <Button variant="outline" onClick={downloadTemplate}>
                        <Download className="h-4 w-4 mr-2" />
                        Download Template
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Select
                        label="Default Subject (if not in CSV)"
                        value={selectedSubject}
                        onChange={e => setSelectedSubject(e.target.value)}
                    >
                        <option value="">Select Subject</option>
                        <option value="Mathematics">Mathematics</option>
                        <option value="English">English</option>
                        <option value="Science">Science</option>
                        <option value="Social Studies">Social Studies</option>
                        <option value="Religious Studies">Religious Studies</option>
                    </Select>

                    <Select
                        label="Import Mode"
                        value={importMode}
                        onChange={e => setImportMode(e.target.value as any)}
                    >
                        <option value="upsert">Upsert (Create or Update)</option>
                        <option value="create">Create Only (Skip existing)</option>
                        <option value="update">Update Only (Skip new)</option>
                    </Select>

                    <div className="flex items-end">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv,.xlsx"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <Button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full"
                        >
                            <Upload className="h-4 w-4 mr-2" />
                            Select File
                        </Button>
                    </div>
                </div>

                {selectedFile && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FileSpreadsheet className="h-5 w-5 text-green-600" />
                                <span className="font-medium">{selectedFile.name}</span>
                            </div>
                            <Button variant="ghost" size="sm" onClick={handleReset}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}

                {parsedData.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <Check className="h-5 w-5 text-green-500" />
                                <span className="font-medium">{parsedData.length} scores to import</span>
                            </div>
                            {errors.length > 0 && (
                                <div className="flex items-center gap-2 text-red-600">
                                    <AlertCircle className="h-5 w-5" />
                                    <span>{errors.length} errors found</span>
                                </div>
                            )}
                        </div>

                        {errors.length > 0 && (
                            <div className="p-3 bg-red-50 rounded-lg border border-red-200">
                                <h4 className="text-sm font-semibold text-red-700 mb-2">Errors</h4>
                                <div className="max-h-40 overflow-y-auto space-y-1">
                                    {errors.slice(0, 10).map((err, i) => (
                                        <div key={i} className="text-xs text-red-600">
                                            Row {err.row} ({err.studentNo}): {err.error}
                                        </div>
                                    ))}
                                    {errors.length > 10 && (
                                        <p className="text-xs text-gray-500">
                                            ...and {errors.length - 10} more errors
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        <div className="overflow-x-auto max-h-60">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-100 sticky top-0">
                                    <tr>
                                        <th className="px-3 py-2 text-left">Student No</th>
                                        <th className="px-3 py-2 text-left">Subject</th>
                                        <th className="px-3 py-2 text-center">CA1</th>
                                        <th className="px-3 py-2 text-center">CA2</th>
                                        <th className="px-3 py-2 text-center">Exam</th>
                                        <th className="px-3 py-2 text-center">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {parsedData.slice(0, 20).map((row, i) => (
                                        <tr key={i} className="border-t">
                                            <td className="px-3 py-2">
                                                {students.find(s => s.id === row.student_id)?.student_no}
                                            </td>
                                            <td className="px-3 py-2">{row.subject}</td>
                                            <td className="px-3 py-2 text-center">{row.ca1}</td>
                                            <td className="px-3 py-2 text-center">{row.ca2}</td>
                                            <td className="px-3 py-2 text-center">{row.exam}</td>
                                            <td className="px-3 py-2 text-center font-medium">
                                                {row.ca1 + row.ca2 + row.exam}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {parsedData.length > 20 && (
                            <p className="text-sm text-gray-500">
                                ...and {parsedData.length - 20} more rows
                            </p>
                        )}

                        <div className="flex justify-end gap-2">
                            <Button variant="outline" onClick={handleReset}>
                                Cancel
                            </Button>
                            <Button onClick={handleImport} disabled={isImporting}>
                                {isImporting ? 'Importing...' : `Import ${parsedData.length} Scores`}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
};
'use client';

import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import apiClient from '@/lib/api-client';
import { useToast } from '@/components/providers/toast-provider';

interface ReportCardPDFProps {
    reportId?: string;
    classId?: string;
    session?: string;
    term?: string;
    studentName?: string;
    schoolName?: string;
    className?: string;
    disabled?: boolean;
    variant?: 'outline' | 'primary' | 'secondary' | 'danger' | 'ghost';
    label?: string;
    successMessage?: string;
}

export const ReportCardPDF: React.FC<ReportCardPDFProps> = ({
    reportId, classId, session, term, studentName, schoolName, className, disabled, variant = 'outline', label, successMessage
}) => {
    const [isDownloading, setIsDownloading] = useState(false);
    const { addToast } = useToast();

    const sanitizeFilePart = (value: string) =>
        value
            .trim()
            .replace(/\s+/g, '_')
            .replace(/[^a-zA-Z0-9_-]/g, '');

    const handleDownloadPDF = async () => {
        setIsDownloading(true);
        try {
            const browserWindow = globalThis?.window;
            const browserDocument = globalThis?.document;
            const BrowserBlob = globalThis?.Blob;

            if (!browserWindow || !browserDocument || !BrowserBlob) {
                throw new Error('PDF download is only available in the browser');
            }

            let url = '';
            let params = {};
            let filename = 'ReportCard.pdf';

            if (reportId) {
                url = `reports/${reportId}/export-pdf/`;
                filename = [
                    schoolName ? sanitizeFilePart(schoolName) : '',
                    studentName ? sanitizeFilePart(studentName) : sanitizeFilePart(reportId),
                    term ? sanitizeFilePart(term) : '',
                    session ? sanitizeFilePart(session) : '',
                    'Report_Card',
                ]
                    .filter(Boolean)
                    .join('_') + '.pdf';
            } else if (classId && session && term) {
                url = `classes/${classId}/bulk-export-report-cards-pdf/`;
                params = { session, term };
                filename = `Bulk_ReportCards_${sanitizeFilePart(classId)}_${sanitizeFilePart(session)}_${sanitizeFilePart(term)}.pdf`;
            } else {
                throw new Error('Invalid download parameters');
            }

            const response = await apiClient.get(url, {
                params,
                responseType: 'blob'
            });

            const blob = new BrowserBlob([response.data], { type: 'application/pdf' });
            const downloadUrl = browserWindow.URL.createObjectURL(blob);
            const link = browserDocument.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', filename.replace(/\//g, '-'));
            browserDocument.body.appendChild(link);
            link.click();
            link.remove();
            browserWindow.URL.revokeObjectURL(downloadUrl);

            addToast(successMessage || 'Report card PDF downloaded successfully', 'success');
        } catch (error: unknown) {
            globalThis.console?.error('Export failed', error);
            const apiError = error as { response?: { data?: { message?: string; error?: string; detail?: string } }; message?: string };
            const message =
                apiError?.response?.data?.message ||
                apiError?.response?.data?.error ||
                apiError?.response?.data?.detail ||
                apiError?.message ||
                'Failed to download PDF';
            addToast(message, 'error');
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <Button
            variant={variant}
            onClick={handleDownloadPDF}
            disabled={disabled || isDownloading}
            className={`flex items-center gap-2 ${className || ''}`}
        >
            {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <Download className="h-4 w-4" />
            )}
            {isDownloading ? 'Downloading...' : label || (reportId ? 'Download PDF' : 'Bulk Download PDFs')}
        </Button>
    );
};

// Alternative: Direct HTML to PDF using html2canvas + jsPDF approach
// This requires installing additional packages, so we use print-to-PDF for now
export const downloadReportAsPDF = async (elementId: string = 'report-card') => {
    const browserDocument = globalThis?.document;
    const browserWindow = globalThis?.window;
    if (!browserDocument || !browserWindow) return;

    const element = browserDocument.getElementById(elementId);
    if (!element) {
        globalThis.console?.error('Element not found:', elementId);
        return;
    }

    // Print-based PDF generation
    browserWindow.print();
};

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
    disabled?: boolean;
    variant?: 'outline' | 'primary' | 'secondary' | 'danger' | 'ghost';
}

export const ReportCardPDF: React.FC<ReportCardPDFProps> = ({
    reportId, classId, session, term, studentName, disabled, variant = 'outline'
}) => {
    const [isDownloading, setIsDownloading] = useState(false);
    const { addToast } = useToast();

    const handleDownloadPDF = async () => {
        setIsDownloading(true);
        try {
            let url = '';
            let params = {};
            let filename = 'ReportCard.pdf';

            if (reportId) {
                url = `report-cards/${reportId}/export-pdf/`;
                filename = `ReportCard_${studentName || reportId}.pdf`;
            } else if (classId && session && term) {
                url = `classes/${classId}/bulk-export-report-cards-pdf/`;
                params = { session, term };
                filename = `Bulk_ReportCards_${classId}_${session}_${term}.pdf`;
            } else {
                throw new Error('Invalid download parameters');
            }

            const response = await apiClient.get(url, {
                params,
                responseType: 'blob'
            });

            const blob = new Blob([response.data], { type: 'application/pdf' });
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.setAttribute('download', filename.replace(/\//g, '-'));
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(downloadUrl);

            addToast('Report Card PDF downloaded successfully', 'success');
        } catch (error: any) {
            console.error('Export failed', error);
            addToast(error.message || 'Failed to download PDF', 'error');
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <Button
            variant={variant}
            onClick={handleDownloadPDF}
            disabled={disabled || isDownloading}
            className="flex items-center gap-2"
        >
            {isDownloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <Download className="h-4 w-4" />
            )}
            {isDownloading ? 'Downloading...' : reportId ? 'Download PDF' : 'Bulk Download PDFs'}
        </Button>
    );
};

// Alternative: Direct HTML to PDF using html2canvas + jsPDF approach
// This requires installing additional packages, so we use print-to-PDF for now
export const downloadReportAsPDF = async (elementId: string = 'report-card') => {
    const element = document.getElementById(elementId);
    if (!element) {
        console.error('Element not found:', elementId);
        return;
    }

    // Print-based PDF generation
    window.print();
};

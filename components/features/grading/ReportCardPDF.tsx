'use client';

import React from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ReportCardPDFProps {
    onDownload: () => void;
    disabled?: boolean;
}

export const ReportCardPDF: React.FC<ReportCardPDFProps> = ({ onDownload, disabled }) => {
    const handleDownloadPDF = async () => {
        // Use browser's print functionality to generate PDF
        // The report card already has print-optimized styles
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Please allow pop-ups to download PDF');
            return;
        }

        const reportCard = document.getElementById('report-card');
        if (!reportCard) {
            alert('Report card not found');
            return;
        }

        // Clone the report card content
        const content = reportCard.cloneNode(true) as HTMLElement;

        // Get all stylesheets
        const styles = Array.from(document.styleSheets)
            .map(sheet => {
                try {
                    return Array.from(sheet.cssRules)
                        .map(rule => rule.cssText)
                        .join('\n');
                } catch {
                    return '';
                }
            })
            .join('\n');

        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Report Card</title>
                <style>
                    ${styles}
                    @page { 
                        margin: 0.5in; 
                        size: A4;
                    }
                    body { 
                        margin: 0; 
                        padding: 20px;
                        background: white;
                    }
                    .page-break { 
                        page-break-before: always; 
                        break-before: page;
                    }
                    @media print {
                        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    }
                </style>
            </head>
            <body>
                ${content.outerHTML}
            </body>
            </html>
        `);

        printWindow.document.close();

        // Wait for content to load then trigger print
        printWindow.onload = () => {
            setTimeout(() => {
                printWindow.print();
                // Close after a delay to allow print dialog
                setTimeout(() => printWindow.close(), 1000);
            }, 250);
        };
    };

    return (
        <Button
            variant="outline"
            onClick={handleDownloadPDF}
            disabled={disabled}
            className="flex items-center gap-2"
        >
            <Download className="h-4 w-4" />
            Download PDF
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

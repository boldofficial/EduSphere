import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from './button';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    isLoading?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    isLoading = false,
}) => {
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-center space-x-2 py-6 border-t mt-4">
            <Button
                variant="secondary"
                size="sm"
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1 || isLoading}
                className="w-10 p-0 flex items-center justify-center"
                title="First Page"
            >
                <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
                variant="secondary"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
                className="w-10 p-0 flex items-center justify-center"
                title="Previous Page"
            >
                <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center px-4 space-x-2">
                <span className="text-sm text-gray-500">Page</span>
                <span className="text-sm font-semibold text-gray-900">{currentPage}</span>
                <span className="text-sm text-gray-500">of</span>
                <span className="text-sm font-semibold text-gray-900">{totalPages}</span>
            </div>

            <Button
                variant="secondary"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages || isLoading}
                className="w-10 p-0 flex items-center justify-center"
                title="Next Page"
            >
                <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
                variant="secondary"
                size="sm"
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage === totalPages || isLoading}
                className="w-10 p-0 flex items-center justify-center"
                title="Last Page"
            >
                <ChevronsRight className="h-4 w-4" />
            </Button>
        </div>
    );
};

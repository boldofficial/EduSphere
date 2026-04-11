'use client';

import React, { useCallback, useRef, useMemo, forwardRef, useImperativeHandle } from 'react';

interface VirtualItem<T> {
    index: number;
    data: T;
    start: number;
    size: number;
    key: string;
}

interface VirtualizerOptions {
    estimateSize?: number;
    overscan?: number;
    keyExtractor: (item: any, index: number) => string;
}

interface VirtualListProps<T> {
    items: T[];
    containerClassName?: string;
    containerHeight?: number | string;
    renderItem: (item: T, index: number) => React.ReactNode;
    renderEmpty?: () => React.ReactNode;
    estimateSize?: number;
    overscan?: number;
    keyExtractor: (item: T, index: number) => string;
    onEndReached?: () => void;
    threshold?: number;
    loading?: boolean;
    loadingMore?: React.ReactNode;
    hasMore?: boolean;
}

export interface VirtualListRef {
    scrollTo: (index: number) => void;
    scrollToTop: () => void;
    scrollToBottom: () => void;
    getCurrentScroll: () => number;
}

export const VirtualList = forwardRef<VirtualListRef, VirtualListProps<any>>(({
    items,
    containerClassName = '',
    containerHeight = '500px',
    renderItem,
    renderEmpty,
    estimateSize = 56,
    overscan = 5,
    keyExtractor,
    onEndReached,
    threshold = 200,
    loading = false,
    loadingMore,
    hasMore = false,
}, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollRef = useRef<number>(0);
    const mountedRef = useRef(false);

    const getItemKey = useCallback((item: any, index: number) => {
        return typeof keyExtractor === 'function' 
            ? keyExtractor(item, index) 
            : item?.id || `item-${index}`;
    }, [keyExtractor]);

    const virtualItems = useMemo(() => {
        return items.map((item, index) => ({
            index,
            data: item,
            key: getItemKey(item, index),
        }));
    }, [items, getItemKey]);

    const totalHeight = virtualItems.length * estimateSize;

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        const scrollTop = target.scrollTop;
        const clientHeight = target.clientHeight;
        const scrollHeight = target.scrollHeight;
        
        scrollRef.current = scrollTop;

        if (onEndReached && scrollHeight - scrollTop - clientHeight < threshold) {
            onEndReached();
        }
    }, [onEndReached, threshold]);

    useImperativeHandle(ref, () => ({
        scrollTo: (index: number) => {
            if (containerRef.current) {
                const scrollPosition = index * estimateSize;
                containerRef.current.scrollTo({
                    top: scrollPosition,
                    behavior: 'smooth',
                });
            }
        },
        scrollToTop: () => {
            containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
        },
        scrollToBottom: () => {
            if (containerRef.current) {
                containerRef.current.scrollTo({
                    top: containerRef.current.scrollHeight,
                    behavior: 'smooth',
                });
            }
        },
        getCurrentScroll: () => scrollRef.current,
    }));

    if (!items.length && !loading) {
        return renderEmpty ? (
            <>{renderEmpty()}</>
        ) : (
            <div className="flex items-center justify-center h-48 text-gray-400">
                No items found
            </div>
        );
    }

    return (
        <div
            ref={containerRef}
            className={`overflow-auto ${containerClassName}`}
            style={{ height: containerHeight }}
            onScroll={handleScroll}
        >
            <div
                style={{
                    height: `${totalHeight}px`,
                    width: '100%',
                    position: 'relative',
                }}
            >
                {virtualItems.map((virtualItem) => (
                    <div
                        key={virtualItem.key}
                        style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            width: '100%',
                            transform: `translateY(${virtualItem.index * estimateSize}px)`,
                        }}
                    >
                        {renderItem(virtualItem.data, virtualItem.index)}
                    </div>
                ))}
            </div>
            
            {loading && loadingMore && (
                <div className="py-4 text-center text-gray-500">
                    {loadingMore}
                </div>
            )}
            
            {!loading && hasMore && onEndReached && (
                <div className="py-4 text-center text-gray-400">
                    Scroll for more...
                </div>
            )}
        </div>
    );
});

VirtualList.displayName = 'VirtualList';

// =============================================
// Simple Virtual Table for Data Tables
// =============================================

interface VirtualTableColumn<T> {
    key: string;
    header: string;
    width?: number;
    render?: (item: T, index: number) => React.ReactNode;
}

interface VirtualTableProps<T> {
    data: T[];
    columns: VirtualTableColumn<T>[];
    rowHeight?: number;
    containerHeight?: number | string;
    keyExtractor: (item: T) => string;
    onRowClick?: (item: T) => void;
    renderEmpty?: () => React.ReactNode;
}

export function VirtualTable<T>({
    data,
    columns,
    rowHeight = 48,
    containerHeight = '500px',
    keyExtractor,
    onRowClick,
    renderEmpty,
}: VirtualTableProps<T>) {
    const totalHeight = data.length * rowHeight;

    const renderCell = useCallback((item: T, column: VirtualTableColumn<T>, index: number) => {
        if (column.render) {
            return column.render(item, index);
        }
        return String((item as any)[column.key] ?? '-');
    }, []);

    return (
        <div className="border rounded-lg overflow-hidden">
            <div className="bg-gray-50 border-b flex" style={{ minHeight: rowHeight }}>
                {columns.map(col => (
                    <div
                        key={col.key}
                        className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider"
                        style={{ width: col.width || 150, flexShrink: 0 }}
                    >
                        {col.header}
                    </div>
                ))}
            </div>
            
            <VirtualList
                items={data}
                containerHeight={containerHeight}
                estimateSize={rowHeight}
                keyExtractor={keyExtractor}
                renderEmpty={renderEmpty}
                renderItem={(item, index) => (
                    <div
                        className={`flex border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                            index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                        }`}
                        style={{ minHeight: rowHeight }}
                        onClick={() => onRowClick?.(item)}
                    >
                        {columns.map(col => (
                            <div
                                key={col.key}
                                className="px-4 flex items-center text-sm text-gray-700"
                                style={{ width: col.width || 150, flexShrink: 0 }}
                            >
                                {renderCell(item, col, index)}
                            </div>
                        ))}
                    </div>
                )}
            />
        </div>
    );
}

// =============================================
// Infinite Scroll Hook
// =============================================

export interface UseInfiniteScrollOptions {
    fetchNextPage: () => void;
    hasNextPage: boolean;
    isFetchingNextPage: boolean;
    threshold?: number;
}

export function useInfiniteScroll(
    containerRef: React.RefObject<HTMLDivElement>,
    options: UseInfiniteScrollOptions
) {
    const { fetchNextPage, hasNextPage, isFetchingNextPage, threshold = 200 } = options;

    const handleScroll = useCallback(() => {
        if (!containerRef.current || !hasNextPage || isFetchingNextPage) return;

        const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
        const scrollBottom = scrollHeight - scrollTop - clientHeight;

        if (scrollBottom < threshold) {
            fetchNextPage();
        }
    }, [containerRef, hasNextPage, isFetchingNextPage, fetchNextPage, threshold]);

    return { handleScroll };
}

// =============================================
// Pagination Controls Component
// =============================================

interface PaginationControlsProps {
    page: number;
    pageSize: number;
    totalCount: number;
    onPageChange: (page: number) => void;
    onPageSizeChange?: (size: number) => void;
    pageSizeOptions?: number[];
}

export function PaginationControls({
    page,
    pageSize,
    totalCount,
    onPageChange,
    onPageSizeChange,
    pageSizeOptions = [10, 20, 50, 100],
}: PaginationControlsProps) {
    const totalPages = Math.ceil(totalCount / pageSize);
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, totalCount);

    return (
        <div className="flex items-center justify-between py-3 px-4 border-t bg-gray-50">
            <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500">
                    Showing {start}-{end} of {totalCount}
                </span>
                
                {onPageSizeChange && (
                    <select
                        value={pageSize}
                        onChange={(e) => onPageSizeChange(Number(e.target.value))}
                        className="text-sm border rounded px-2 py-1"
                    >
                        {pageSizeOptions.map(size => (
                            <option key={size} value={size}>
                                {size} per page
                            </option>
                        ))}
                    </select>
                )}
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={() => onPageChange(1)}
                    disabled={page <= 1}
                    className="px-3 py-1 text-sm border rounded disabled:opacity-50 hover:bg-gray-100"
                >
                    First
                </button>
                <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={page <= 1}
                    className="px-3 py-1 text-sm border rounded disabled:opacity-50 hover:bg-gray-100"
                >
                    Previous
                </button>
                
                <span className="text-sm text-gray-600 px-3">
                    Page {page} of {totalPages}
                </span>
                
                <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={page >= totalPages}
                    className="px-3 py-1 text-sm border rounded disabled:opacity-50 hover:bg-gray-100"
                >
                    Next
                </button>
                <button
                    onClick={() => onPageChange(totalPages)}
                    disabled={page >= totalPages}
                    className="px-3 py-1 text-sm border rounded disabled:opacity-50 hover:bg-gray-100"
                >
                    Last
                </button>
            </div>
        </div>
    );
}
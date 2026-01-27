'use client';

import dynamic from 'next/dynamic';
import React from 'react';

// Loading placeholder for charts
const ChartLoading = () => (
    <div className="w-full h-full bg-gray-50 rounded-lg flex items-center justify-center animate-pulse">
        <div className="text-gray-400 text-sm">Loading chart...</div>
    </div>
);

// Dynamically import Recharts components to reduce initial bundle size
export const DynamicLineChart = dynamic(
    () => import('recharts').then(mod => ({ default: mod.LineChart })),
    { loading: () => <ChartLoading />, ssr: false }
);

export const DynamicBarChart = dynamic(
    () => import('recharts').then(mod => ({ default: mod.BarChart })),
    { loading: () => <ChartLoading />, ssr: false }
);

export const DynamicPieChart = dynamic(
    () => import('recharts').then(mod => ({ default: mod.PieChart })),
    { loading: () => <ChartLoading />, ssr: false }
);

export const DynamicAreaChart = dynamic(
    () => import('recharts').then(mod => ({ default: mod.AreaChart })),
    { loading: () => <ChartLoading />, ssr: false }
);

// Re-export all other chart components that are commonly used
// These will be tree-shaken if not used
export {
    Line,
    Bar,
    Pie,
    Cell,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';

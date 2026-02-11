'use client';

import React from 'react';
import { Palette, Layout } from 'lucide-react';
import { Settings } from '@/lib/types';

interface CmsAppearanceTabProps {
    localSettings: Settings;
    updateField: (field: keyof Settings, value: any) => void;
}

export const CmsAppearanceTab: React.FC<CmsAppearanceTabProps> = ({
    localSettings,
    updateField
}) => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-xl font-black text-gray-900 mb-2 flex items-center gap-2">
                    <Palette className="text-indigo-500" size={24} />
                    Branding & Theme
                </h2>
                <p className="text-gray-500 text-sm">Control the visual identity of your website.</p>
            </div>

            <div className="p-8 bg-gray-50 rounded-[2.5rem] flex flex-col items-center text-center">
                <div className="mb-6">
                    <p className="text-sm font-bold text-gray-700 mb-4 uppercase tracking-widest">Primary Brand Color</p>
                    <div className="flex items-center gap-6">
                        <input
                            type="color"
                            value={localSettings.landing_primary_color}
                            onChange={(e) => updateField('landing_primary_color', e.target.value)}
                            className="w-24 h-24 rounded-full border-4 border-white shadow-2xl cursor-pointer"
                        />
                        <div className="text-left">
                            <p className="font-black text-2xl text-gray-900">{localSettings.landing_primary_color.toUpperCase()}</p>
                            <p className="text-sm text-gray-500">Current accent color</p>
                        </div>
                    </div>
                </div>
                <div className="max-w-md bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
                    <p className="text-xs text-brand-600 font-black mb-4 uppercase tracking-tighter">Live Preview Context</p>
                    <div
                        className="px-6 py-3 rounded-xl text-white font-bold shadow-lg transition-colors"
                        style={{ backgroundColor: localSettings.landing_primary_color }}
                    >
                        Interactive Button Example
                    </div>
                    <p className="text-[11px] text-gray-400 mt-4 leading-normal">
                        This color will be used for buttons, icons, and overlays across your school's public website to maintain consistency.
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                <h4 className="font-bold text-gray-900 flex items-center gap-2">
                    <Layout size={18} />
                    Visibility Toggles
                </h4>
                <div className="grid sm:grid-cols-2 gap-4">
                    <label className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-transparent hover:border-gray-200 cursor-pointer">
                        <span className="text-sm font-bold text-gray-700">Display School Statistics</span>
                        <input
                            type="checkbox"
                            checked={localSettings.landing_show_stats}
                            onChange={(e) => updateField('landing_show_stats', e.target.checked)}
                            className="w-5 h-5 accent-brand-600"
                        />
                    </label>
                </div>
            </div>
        </div>
    );
};

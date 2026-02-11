'use client';

import React from 'react';
import { Sparkles, Type, Image as ImageIcon } from 'lucide-react';
import { Settings } from '@/lib/types';

interface CmsHeroTabProps {
    localSettings: Settings;
    updateField: (field: keyof Settings, value: any) => void;
    handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => void;
}

export const CmsHeroTab: React.FC<CmsHeroTabProps> = ({
    localSettings,
    updateField,
    handleImageUpload
}) => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-xl font-black text-gray-900 mb-2 flex items-center gap-2">
                    <Sparkles className="text-amber-500" size={24} />
                    Hero Section
                </h2>
                <p className="text-gray-500 text-sm">The first thing visitors see. Make it count.</p>
            </div>

            <div className="grid gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <Type size={16} className="text-brand-600" />
                        Main Title
                    </label>
                    <input
                        type="text"
                        value={localSettings.landing_hero_title}
                        onChange={(e) => updateField('landing_hero_title', e.target.value)}
                        className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-brand-500 focus:bg-white outline-none transition-all font-medium"
                        placeholder="e.g. Welcome to Excellence"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700">Hero Subtitle</label>
                    <textarea
                        rows={2}
                        value={localSettings.landing_hero_subtitle}
                        onChange={(e) => updateField('landing_hero_subtitle', e.target.value)}
                        className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-brand-500 focus:bg-white outline-none transition-all font-medium resize-none"
                        placeholder="Catchy sub-heading..."
                    />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Button Text</label>
                        <input
                            type="text"
                            value={localSettings.landing_cta_text}
                            onChange={(e) => updateField('landing_cta_text', e.target.value)}
                            className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-brand-500 focus:bg-white outline-none transition-all font-medium"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 italic">Floating Features (Comma separated)</label>
                        <input
                            type="text"
                            value={localSettings.landing_features}
                            onChange={(e) => updateField('landing_features', e.target.value)}
                            className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-brand-500 focus:bg-white outline-none transition-all font-medium"
                        />
                    </div>
                </div>

                <div className="space-y-4">
                    <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                        <ImageIcon size={16} className="text-brand-600" />
                        Hero Background Image
                    </label>
                    <div className="relative group overflow-hidden rounded-3xl aspect-[21/9] bg-gray-100 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center transition-all hover:border-brand-400">
                        {localSettings.landing_hero_image ? (
                            <>
                                <img src={localSettings.landing_hero_image} className="absolute inset-0 w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                    <label className="cursor-pointer px-5 py-2.5 bg-white text-gray-900 rounded-xl font-bold text-sm shadow-lg hover:scale-105 transition-all">
                                        Change Image
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, (url) => updateField('landing_hero_image', url))} />
                                    </label>
                                    <button onClick={() => updateField('landing_hero_image', null)} className="px-5 py-2.5 bg-red-500 text-white rounded-xl font-bold text-sm shadow-lg hover:scale-105 transition-all">
                                        Remove
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center p-8">
                                <ImageIcon className="mx-auto text-gray-400 mb-4" size={48} />
                                <p className="text-gray-500 font-bold mb-2">No Image Selected</p>
                                <label className="cursor-pointer px-6 py-2 bg-brand-600 text-white rounded-xl font-bold text-sm hover:bg-brand-700 transition-all inline-block">
                                    Upload Hero Image
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, (url) => updateField('landing_hero_image', url))} />
                                </label>
                                <p className="text-xs text-gray-400 mt-4 uppercase tracking-widest font-black">Landscape (1920x1080) Recommended</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

'use client';

import React from 'react';
import { Building, Image as ImageIcon } from 'lucide-react';
import { Settings } from '@/lib/types';

interface CmsIdentityTabProps {
    localSettings: Settings;
    updateField: (field: keyof Settings, value: any) => void;
    handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => void;
}

export const CmsIdentityTab: React.FC<CmsIdentityTabProps> = ({
    localSettings,
    updateField,
    handleImageUpload
}) => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
                <h2 className="text-xl font-black text-gray-900 mb-2 flex items-center gap-2">
                    <Building className="text-brand-600" size={24} />
                    School Identity
                </h2>
                <p className="text-gray-500 text-sm">Fundamental settings for your school's brand.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-10">
                {/* Logo Upload */}
                <div className="md:col-span-1 space-y-4">
                    <label className="text-sm font-bold text-gray-700 block">School Logo</label>
                    <div className="relative group aspect-square rounded-[2rem] bg-gray-50 border-2 border-dashed border-gray-200 flex flex-col items-center justify-center transition-all hover:border-brand-400 overflow-hidden">
                        {localSettings.logo_media ? (
                            <>
                                <img src={localSettings.logo_media} className="w-full h-full object-contain p-6" />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <label className="cursor-pointer p-3 bg-white rounded-full text-brand-600 shadow-xl hover:scale-110 transition-transform">
                                        <ImageIcon size={24} />
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, (url) => updateField('logo_media', url))} />
                                    </label>
                                </div>
                            </>
                        ) : (
                            <label className="cursor-pointer flex flex-col items-center gap-2 text-gray-400 hover:text-brand-600 transition-all">
                                <ImageIcon size={40} />
                                <span className="text-xs font-black uppercase tracking-widest">Upload Logo</span>
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, (url) => updateField('logo_media', url))} />
                            </label>
                        )}
                    </div>
                </div>

                {/* Info Fields */}
                <div className="md:col-span-2 space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700">Official School Name</label>
                        <input
                            type="text"
                            value={localSettings.school_name}
                            onChange={(e) => updateField('school_name', e.target.value)}
                            className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-brand-500 focus:bg-white outline-none transition-all font-bold text-lg"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-bold text-gray-700 italic text-brand-600">Motto / Tagline</label>
                        <input
                            type="text"
                            value={localSettings.school_tagline}
                            onChange={(e) => updateField('school_tagline', e.target.value)}
                            className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-brand-500 focus:bg-white outline-none transition-all font-medium"
                            placeholder="e.g. ...reaching the highest height"
                        />
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 uppercase tracking-tighter">Contact Email</label>
                    <input
                        type="email"
                        value={localSettings.school_email}
                        onChange={(e) => updateField('school_email', e.target.value)}
                        className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-brand-500 focus:bg-white outline-none transition-all font-medium"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 uppercase tracking-tighter">Contact Phone</label>
                    <input
                        type="text"
                        value={localSettings.school_phone}
                        onChange={(e) => updateField('school_phone', e.target.value)}
                        className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-brand-500 focus:bg-white outline-none transition-all font-medium"
                    />
                </div>
                <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-bold text-gray-700 uppercase tracking-tighter">Physical Address</label>
                    <input
                        type="text"
                        value={localSettings.school_address}
                        onChange={(e) => updateField('school_address', e.target.value)}
                        className="w-full px-5 py-3.5 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-brand-500 focus:bg-white outline-none transition-all font-medium"
                    />
                </div>
            </div>
        </div>
    );
};

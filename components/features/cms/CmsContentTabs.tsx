'use client';

import React from 'react';
import { Info, Heart, GraduationCap, Plus, Star, Trash2, Image as ImageIcon } from 'lucide-react';
import { Settings, CoreValue, AcademicProgram } from '@/lib/types';

interface CmsContentTabsProps {
    localSettings: Settings;
    activeTab: 'about' | 'values' | 'programs';
    updateField: (field: keyof Settings, value: any) => void;
    addCoreValue: () => void;
    removeCoreValue: (index: number) => void;
    updateCoreValue: (index: number, field: keyof CoreValue, value: string) => void;
    addProgram: () => void;
    removeProgram: (index: number) => void;
    updateProgram: (index: number, field: keyof AcademicProgram, value: any) => void;
    handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => void;
}

export const CmsContentTabs: React.FC<CmsContentTabsProps> = ({
    localSettings,
    activeTab,
    updateField,
    addCoreValue,
    removeCoreValue,
    updateCoreValue,
    addProgram,
    removeProgram,
    updateProgram,
    handleImageUpload
}) => {
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* 2. ABOUT US EDITOR */}
            {activeTab === 'about' && (
                <div className="space-y-8">
                    <div>
                        <h2 className="text-xl font-black text-gray-900 mb-2 flex items-center gap-2">
                            <Info className="text-blue-500" size={24} />
                            About Us Section
                        </h2>
                        <p className="text-gray-500 text-sm">Tell your school's history and mission.</p>
                    </div>
                    <div className="space-y-4">
                        <label className="text-sm font-bold text-gray-700">Detailed Introduction</label>
                        <textarea
                            rows={10}
                            value={localSettings.landing_about_text}
                            onChange={(e) => updateField('landing_about_text', e.target.value)}
                            className="w-full px-6 py-5 rounded-[2rem] bg-gray-50 border-2 border-transparent focus:border-brand-500 focus:bg-white outline-none transition-all font-medium leading-relaxed"
                            placeholder="Write about your school's journey, values, and vision..."
                        />
                    </div>
                </div>
            )}

            {/* 3. CORE VALUES MANAGER */}
            {activeTab === 'values' && (
                <div className="space-y-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-black text-gray-900 mb-2 flex items-center gap-2">
                                <Heart className="text-rose-500" size={24} />
                                Core Values
                            </h2>
                            <p className="text-gray-500 text-sm">Define what makes your school special.</p>
                        </div>
                        <button
                            onClick={addCoreValue}
                            className="flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-600 rounded-xl font-bold text-sm hover:bg-brand-100 transition-all"
                        >
                            <Plus size={18} />
                            Add Value
                        </button>
                    </div>

                    <div className="grid gap-4">
                        {localSettings.landing_core_values.map((val, idx) => (
                            <div key={idx} className="group bg-gray-50 p-6 rounded-3xl border-2 border-transparent hover:border-brand-200 transition-all">
                                <div className="flex gap-6 items-start">
                                    <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-brand-600 shadow-sm shrink-0">
                                        <Star size={24} />
                                    </div>
                                    <div className="flex-1 space-y-4">
                                        <div className="grid md:grid-cols-2 gap-4">
                                            <input
                                                type="text"
                                                value={val.title}
                                                onChange={(e) => updateCoreValue(idx, 'title', e.target.value)}
                                                className="w-full px-4 py-2 rounded-xl bg-white border border-gray-100 outline-none font-bold"
                                                placeholder="Title (e.g. Integrity)"
                                            />
                                            <select
                                                value={val.icon}
                                                onChange={(e) => updateCoreValue(idx, 'icon', e.target.value)}
                                                className="w-full px-4 py-2 rounded-xl bg-white border border-gray-100 outline-none font-medium"
                                            >
                                                <option value="Heart">Heart Icon</option>
                                                <option value="Users">Users Icon</option>
                                                <option value="Award">Award Icon</option>
                                                <option value="Star">Star Icon</option>
                                                <option value="Shield">Shield Icon</option>
                                                <option value="Globe">Globe Icon</option>
                                            </select>
                                        </div>
                                        <textarea
                                            rows={2}
                                            value={val.description}
                                            onChange={(e) => updateCoreValue(idx, 'description', e.target.value)}
                                            className="w-full px-4 py-2 rounded-xl bg-white border border-gray-100 outline-none text-sm leading-relaxed"
                                            placeholder="Short description..."
                                        />
                                    </div>
                                    <button
                                        onClick={() => removeCoreValue(idx)}
                                        className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        {localSettings.landing_core_values.length === 0 && (
                            <div className="text-center py-12 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
                                <Heart className="mx-auto text-gray-300 mb-4" size={40} />
                                <p className="text-gray-500 font-bold">No Core Values Added</p>
                                <p className="text-xs text-gray-400 mt-1">Add values to show your school's philosophy</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* 4. ACADEMIC PROGRAMS */}
            {activeTab === 'programs' && (
                <div className="space-y-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-black text-gray-900 mb-2 flex items-center gap-2">
                                <GraduationCap className="text-brand-600" size={24} />
                                Academic Divisions
                            </h2>
                            <p className="text-gray-500 text-sm">Manage entries for Crèche, Primary, etc.</p>
                        </div>
                        <button
                            onClick={addProgram}
                            className="flex items-center gap-2 px-4 py-2 bg-brand-50 text-brand-600 rounded-xl font-bold text-sm hover:bg-brand-100 transition-all"
                        >
                            <Plus size={18} />
                            Add Division
                        </button>
                    </div>

                    <div className="grid gap-6">
                        {localSettings.landing_academic_programs.map((prog, idx) => (
                            <div key={idx} className="group bg-gray-50 p-6 rounded-[2rem] border-2 border-transparent hover:border-brand-200 transition-all">
                                <div className="grid md:grid-cols-4 gap-6">
                                    <div className="relative group overflow-hidden rounded-2xl aspect-square bg-white border border-gray-100 flex items-center justify-center">
                                        {prog.image ? (
                                            <>
                                                <img src={prog.image} className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <label className="cursor-pointer p-2 bg-white rounded-full text-brand-600 shadow-xl">
                                                        <ImageIcon size={20} />
                                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, (url) => updateProgram(idx, 'image', url))} />
                                                    </label>
                                                </div>
                                            </>
                                        ) : (
                                            <label className="cursor-pointer flex flex-col items-center gap-2 text-gray-400 hover:text-brand-600 transition-all">
                                                <ImageIcon size={30} />
                                                <span className="text-[10px] font-black uppercase tracking-tighter">Add Image</span>
                                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, (url) => updateProgram(idx, 'image', url))} />
                                            </label>
                                        )}
                                    </div>
                                    <div className="md:col-span-3 space-y-4">
                                        <div className="flex justify-between">
                                            <div className="grid md:grid-cols-2 gap-4 flex-1 mr-4">
                                                <input
                                                    type="text"
                                                    value={prog.title}
                                                    onChange={(e) => updateProgram(idx, 'title', e.target.value)}
                                                    className="w-full px-4 py-2 rounded-xl bg-white border border-gray-100 outline-none font-bold"
                                                    placeholder="e.g. Primary School"
                                                />
                                                <input
                                                    type="text"
                                                    value={prog.age_range}
                                                    onChange={(e) => updateProgram(idx, 'age_range', e.target.value)}
                                                    className="w-full px-4 py-2 rounded-xl bg-white border border-gray-100 outline-none font-medium text-brand-600"
                                                    placeholder="e.g. Ages 6-11"
                                                />
                                            </div>
                                            <button
                                                onClick={() => removeProgram(idx)}
                                                className="p-2 text-gray-300 hover:text-red-500 transition-all"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </div>
                                        <textarea
                                            rows={3}
                                            value={prog.description}
                                            onChange={(e) => updateProgram(idx, 'description', e.target.value)}
                                            className="w-full px-4 py-2 rounded-xl bg-white border border-gray-100 outline-none text-sm leading-relaxed"
                                            placeholder="Program description..."
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

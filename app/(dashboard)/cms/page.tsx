'use client';

import React, { useState, useEffect } from 'react';
import {
    Globe, Save, Plus, Trash2, Image as ImageIcon, Sparkles,
    Type, Layout, Palette, GraduationCap, Star, Info, Loader2,
    Heart, Users, Award, MoveUp, MoveDown, Building
} from 'lucide-react';
import { useSettings } from '@/lib/hooks/use-data';
import { Settings, CoreValue, AcademicProgram } from '@/lib/types';
import * as Utils from '@/lib/utils';
import { useToast } from '@/components/providers/toast-provider';

export default function CMSPage() {
    const { data: settings = Utils.INITIAL_SETTINGS, isLoading } = useSettings();
    const { addToast } = useToast();
    const [localSettings, setLocalSettings] = useState<Settings>(settings);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'branding' | 'hero' | 'about' | 'values' | 'programs' | 'appearance'>('branding');

    useEffect(() => {
        if (settings) {
            setLocalSettings(settings);
        }
    }, [settings]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const response = await fetch('/api/proxy/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(localSettings)
            });

            if (!response.ok) throw new Error('Failed to save settings');

            addToast('Website content updated successfully!', 'success');
        } catch (error) {
            console.error(error);
            addToast('Failed to save changes.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // Helper to update specific fields
    const updateField = (field: keyof Settings, value: any) => {
        setLocalSettings(prev => ({ ...prev, [field]: value }));
    };

    // --- CORE VALUES MANAGERS ---
    const addCoreValue = () => {
        const newValue: CoreValue = { title: 'New Value', description: 'Description here...', icon: 'Star' };
        updateField('landing_core_values', [...localSettings.landing_core_values, newValue]);
    };

    const removeCoreValue = (index: number) => {
        const newValues = localSettings.landing_core_values.filter((_, i) => i !== index);
        updateField('landing_core_values', newValues);
    };

    const updateCoreValue = (index: number, field: keyof CoreValue, value: string) => {
        const newValues = [...localSettings.landing_core_values];
        newValues[index] = { ...newValues[index], [field]: value };
        updateField('landing_core_values', newValues);
    };

    // --- ACADEMIC PROGRAMS MANAGERS ---
    const addProgram = () => {
        const newProg: AcademicProgram = { title: 'New Program', age_range: 'Ages 0-0', description: 'Description...', image: null };
        updateField('landing_academic_programs', [...localSettings.landing_academic_programs, newProg]);
    };

    const removeProgram = (index: number) => {
        const newProgs = localSettings.landing_academic_programs.filter((_, i) => i !== index);
        updateField('landing_academic_programs', newProgs);
    };

    const updateProgram = (index: number, field: keyof AcademicProgram, value: any) => {
        const newProgs = [...localSettings.landing_academic_programs];
        newProgs[index] = { ...newProgs[index], [field]: value };
        updateField('landing_academic_programs', newProgs);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, callback: (url: string) => void) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Convert to Base64 for now as per current system pattern
        const reader = new FileReader();
        reader.onloadend = () => {
            callback(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="w-10 h-10 text-brand-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 shadow-inner">
                        <Globe size={30} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Website CMS</h1>
                        <p className="text-gray-500 text-sm font-medium">Customize your school's public landing page</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <a
                        href="/"
                        target="_blank"
                        rel="noreferrer"
                        className="px-5 py-2.5 bg-gray-50 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-all flex items-center gap-2 text-sm border border-gray-200"
                    >
                        <Globe size={18} />
                        View Website
                    </a>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-6 py-2.5 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-all flex items-center gap-2 text-sm shadow-lg shadow-brand-200 disabled:bg-brand-400 group"
                    >
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} className="group-hover:scale-110 transition-transform" />}
                        {isSaving ? 'Saving Changes...' : 'Publish Changes'}
                    </button>
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
                {/* Navigation Sidebar */}
                <div className="lg:col-span-3 space-y-2">
                    {[
                        { id: 'branding', name: 'School Identity', icon: Building },
                        { id: 'hero', name: 'Hero Section', icon: Sparkles },
                        { id: 'about', name: 'About Us', icon: Info },
                        { id: 'values', name: 'Core Values', icon: Heart },
                        { id: 'programs', name: 'Academic Divisions', icon: GraduationCap },
                        { id: 'appearance', name: 'Branding & Theme', icon: Palette },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all text-sm border-2 ${activeTab === tab.id
                                ? 'bg-brand-600 text-white border-brand-600 shadow-lg shadow-brand-100'
                                : 'bg-white text-gray-600 border-transparent hover:bg-gray-50 hover:border-gray-200'
                                }`}
                        >
                            <tab.icon size={20} />
                            {tab.name}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="lg:col-span-9 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-8 md:p-10">

                        {/* 0. BRANDING EDITOR */}
                        {activeTab === 'branding' && (
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
                        )}

                        {/* 1. HERO EDITOR */}
                        {activeTab === 'hero' && (
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
                        )}

                        {/* 2. ABOUT US EDITOR */}
                        {activeTab === 'about' && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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

                        {/* 5. APPEARANCE EDITOR */}
                        {activeTab === 'appearance' && (
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
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}

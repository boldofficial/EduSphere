'use client';

import React, { useState, useEffect } from 'react';
import {
    Globe, Save, Loader2, Building, Sparkles, Info, Heart, GraduationCap, Palette
} from 'lucide-react';
import { useSettings } from '@/lib/hooks/use-data';
import { Settings, CoreValue, AcademicProgram } from '@/lib/types';
import * as Utils from '@/lib/utils';
import { useToast } from '@/components/providers/toast-provider';

// Extracted Components
import { CmsIdentityTab } from '@/components/features/cms/CmsIdentityTab';
import { CmsHeroTab } from '@/components/features/cms/CmsHeroTab';
import { CmsContentTabs } from '@/components/features/cms/CmsContentTabs';
import { CmsAppearanceTab } from '@/components/features/cms/CmsAppearanceTab';

export default function CMSPage() {
    const { data: settings = Utils.INITIAL_SETTINGS, isLoading } = useSettings();
    const { addToast } = useToast();
    const [localSettings, setLocalSettings] = useState<Settings>(settings);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'branding' | 'hero' | 'about' | 'values' | 'programs' | 'appearance'>('branding');

    useEffect(() => {
        if (settings) setLocalSettings(settings);
    }, [settings]);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const response = await fetch('/api/proxy/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(localSettings)
            });

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                const errorMsg = result.detail || result.error || 'Failed to save settings';
                throw new Error(errorMsg);
            }
            addToast('Website content updated successfully!', 'success');
        } catch (error: any) {
            console.error(error);
            addToast(error.message || 'Failed to save changes.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const updateField = (field: keyof Settings, value: any) => {
        setLocalSettings(prev => ({ ...prev, [field]: value }));
    };

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
        const reader = new FileReader();
        reader.onloadend = () => callback(reader.result as string);
        reader.readAsDataURL(file);
    };

    if (isLoading) {
        return (
            <div className="flex h-[60vh] items-center justify-center">
                <Loader2 className="w-10 h-10 text-brand-600 animate-spin" />
            </div>
        );
    }

    const navigation = [
        { id: 'branding', name: 'School Identity', icon: Building },
        { id: 'hero', name: 'Hero Section', icon: Sparkles },
        { id: 'about', name: 'About Us', icon: Info },
        { id: 'values', name: 'Core Values', icon: Heart },
        { id: 'programs', name: 'Academic Divisions', icon: GraduationCap },
        { id: 'appearance', name: 'Branding & Theme', icon: Palette },
    ];

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
                    <a href="/" target="_blank" rel="noreferrer" className="px-5 py-2.5 bg-gray-50 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-all flex items-center gap-2 text-sm border border-gray-200">
                        <Globe size={18} /> View Website
                    </a>
                    <button onClick={handleSave} disabled={isSaving} className="px-6 py-2.5 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-all flex items-center gap-2 text-sm shadow-lg shadow-brand-200 disabled:bg-brand-400 group">
                        {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} className="group-hover:scale-110 transition-transform" />}
                        {isSaving ? 'Saving Changes...' : 'Publish Changes'}
                    </button>
                </div>
            </div>

            <div className="grid lg:grid-cols-12 gap-8">
                {/* Navigation Sidebar */}
                <div className="lg:col-span-3 space-y-2">
                    {navigation.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all text-sm border-2 ${activeTab === tab.id
                                ? 'bg-brand-600 text-white border-brand-600 shadow-lg shadow-brand-100'
                                : 'bg-white text-gray-600 border-transparent hover:bg-gray-50 hover:border-gray-200'
                                }`}
                        >
                            <tab.icon size={20} /> {tab.name}
                        </button>
                    ))}
                </div>

                {/* Content Area */}
                <div className="lg:col-span-9 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-8 md:p-10">
                        {activeTab === 'branding' && <CmsIdentityTab localSettings={localSettings} updateField={updateField} handleImageUpload={handleImageUpload} />}
                        {activeTab === 'hero' && <CmsHeroTab localSettings={localSettings} updateField={updateField} handleImageUpload={handleImageUpload} />}
                        {(activeTab === 'about' || activeTab === 'values' || activeTab === 'programs') && (
                            <CmsContentTabs
                                localSettings={localSettings}
                                activeTab={activeTab}
                                updateField={updateField}
                                addCoreValue={addCoreValue}
                                removeCoreValue={removeCoreValue}
                                updateCoreValue={updateCoreValue}
                                addProgram={addProgram}
                                removeProgram={removeProgram}
                                updateProgram={updateProgram}
                                handleImageUpload={handleImageUpload}
                            />
                        )}
                        {activeTab === 'appearance' && <CmsAppearanceTab localSettings={localSettings} updateField={updateField} />}
                    </div>
                </div>
            </div>
        </div>
    );
}

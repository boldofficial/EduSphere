/**
 * Dashboard CMS Tab
 *
 * Landing page content management: hero section, branding, about, features.
 */
'use client';

import React from 'react';
import {
    Save, Eye, Trash2, Plus, Upload,
    Palette, Type, FileText, Settings, CheckCircle,
    Heart, GraduationCap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import * as Types from '@/lib/types';

interface DashboardCmsTabProps {
    editedSettings: Types.Settings;
    handleChange: (field: keyof Types.Settings, value: any) => void;
    handleSaveSettings: () => void;
    handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>, field: keyof Types.Settings) => void;
    features: string[];
    newFeature: string;
    setNewFeature: (v: string) => void;
    addFeature: () => void;
    removeFeature: (index: number) => void;
    handleCoreValueChange: (index: number, field: keyof Types.CoreValue, value: string) => void;
    addCoreValue: () => void;
    removeCoreValue: (index: number) => void;
    handleAcademicProgramChange: (index: number, field: keyof Types.AcademicProgram, value: any) => void;
    addAcademicProgram: () => void;
    removeAcademicProgram: (index: number) => void;
}

export const DashboardCmsTab: React.FC<DashboardCmsTabProps> = ({
    editedSettings, handleChange, handleSaveSettings, handleImageUpload,
    features, newFeature, setNewFeature, addFeature, removeFeature,
    handleCoreValueChange, addCoreValue, removeCoreValue,
    handleAcademicProgramChange, addAcademicProgram, removeAcademicProgram
}) => (
    <div className="space-y-8">
        {/* Save Bar */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-4 z-20">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-brand-100 text-brand-600 rounded-xl flex items-center justify-center">
                    <Settings size={20} />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900">Landing Page CMS</h3>
                    <p className="text-xs text-gray-500">Edit your public school website</p>
                </div>
            </div>
            <div className="flex gap-3">
                <a
                    href="/"
                    target="_blank"
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-medium transition-colors"
                >
                    <Eye size={16} /> Preview
                </a>
                <Button onClick={handleSaveSettings} className="flex items-center gap-2">
                    <Save size={16} /> Save Changes
                </Button>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Hero Section */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Type size={18} className="text-brand-500" />
                    Hero Section
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Hero Title</label>
                        <Input
                            value={editedSettings.landing_hero_title}
                            onChange={(e) => handleChange('landing_hero_title', e.target.value)}
                            placeholder="Excellence in Education"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Hero Subtitle</label>
                        <textarea
                            value={editedSettings.landing_hero_subtitle}
                            onChange={(e) => handleChange('landing_hero_subtitle', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                            rows={3}
                            placeholder="Nurturing the leaders of tomorrow..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">CTA Button Text</label>
                        <Input
                            value={editedSettings.landing_cta_text}
                            onChange={(e) => handleChange('landing_cta_text', e.target.value)}
                            placeholder="Start Your Journey"
                        />
                    </div>
                </div>
            </div>

            {/* Branding */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <Palette size={18} className="text-brand-500" />
                    Branding & Media
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Primary Color</label>
                        <div className="flex gap-3">
                            <input
                                type="color"
                                value={editedSettings.landing_primary_color}
                                onChange={(e) => handleChange('landing_primary_color', e.target.value)}
                                className="h-12 w-20 rounded-xl border-2 border-gray-200 cursor-pointer"
                            />
                            <Input
                                value={editedSettings.landing_primary_color}
                                onChange={(e) => handleChange('landing_primary_color', e.target.value)}
                                placeholder="#16a34a"
                                className="flex-1"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Hero Background Image</label>
                        <div className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center hover:border-brand-300 transition-colors">
                            {editedSettings.landing_hero_image ? (
                                <div className="relative">
                                    <img src={editedSettings.landing_hero_image} alt="Hero" className="h-32 w-full object-cover rounded-lg" />
                                    <button
                                        onClick={() => handleChange('landing_hero_image', null)}
                                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ) : (
                                <label className="cursor-pointer block py-6">
                                    <Upload size={32} className="mx-auto text-gray-400 mb-2" />
                                    <p className="text-sm text-gray-500">Click to upload hero image</p>
                                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, 'landing_hero_image')} className="hidden" />
                                </label>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                        <input
                            type="checkbox"
                            id="showStats"
                            checked={editedSettings.landing_show_stats}
                            onChange={(e) => handleChange('landing_show_stats', e.target.checked)}
                            className="h-5 w-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
                        />
                        <label htmlFor="showStats" className="font-medium text-gray-700">Show Statistics Section</label>
                    </div>
                </div>
            </div>

            {/* About & Mission Section */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <FileText size={18} className="text-brand-500" />
                    About & Mission
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">About Our School</label>
                        <textarea
                            value={editedSettings.landing_about_text}
                            onChange={(e) => handleChange('landing_about_text', e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                            rows={4}
                            placeholder="Tell visitors about your school..."
                        />
                    </div>
                    {/* Add Mission/Vision if fields exist in Settings, or use placeholder logic */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">School Tagline</label>
                        <Input
                            value={editedSettings.school_tagline}
                            onChange={(e) => handleChange('school_tagline', e.target.value)}
                            placeholder="Nurturing Excellence"
                        />
                    </div>
                </div>
            </div>

            {/* Core Values */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 lg:col-span-2">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Heart size={18} className="text-brand-500" />
                        Core Values
                    </h3>
                    <Button onClick={addCoreValue} size="sm" variant="outline" className="flex items-center gap-2">
                        <Plus size={14} /> Add Value
                    </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {editedSettings.landing_core_values?.map((value, index) => (
                        <div key={index} className="p-4 bg-gray-50 rounded-2xl relative border border-gray-100 group">
                            <button
                                onClick={() => removeCoreValue(index)}
                                className="absolute -top-2 -right-2 p-1.5 bg-white shadow-sm border border-gray-200 text-gray-400 hover:text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 size={14} />
                            </button>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Title</label>
                                    <Input
                                        value={value.title}
                                        onChange={(e) => handleCoreValueChange(index, 'title', e.target.value)}
                                        placeholder="e.g. Excellence"
                                        className="bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Icon (Lucide name)</label>
                                    <Input
                                        value={value.icon}
                                        onChange={(e) => handleCoreValueChange(index, 'icon', e.target.value)}
                                        placeholder="Heart, Star, Shield..."
                                        className="bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Description</label>
                                    <textarea
                                        value={value.description}
                                        onChange={(e) => handleCoreValueChange(index, 'description', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none bg-white font-medium"
                                        rows={3}
                                        placeholder="Brief description..."
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                    {(editedSettings.landing_core_values?.length || 0) === 0 && (
                        <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-100 rounded-3xl text-gray-400">
                            No core values added yet
                        </div>
                    )}
                </div>
            </div>

            {/* Academic Programs */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 lg:col-span-2">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <GraduationCap size={18} className="text-brand-500" />
                        Academic Divisions
                    </h3>
                    <Button onClick={addAcademicProgram} size="sm" variant="outline" className="flex items-center gap-2">
                        <Plus size={14} /> Add Division
                    </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {editedSettings.landing_academic_programs?.map((program, index) => (
                        <div key={index} className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 group relative">
                            <button
                                onClick={() => removeAcademicProgram(index)}
                                className="absolute top-2 right-2 z-10 p-1.5 bg-white/90 backdrop-blur shadow-sm border border-gray-200 text-gray-400 hover:text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 size={14} />
                            </button>
                            <div className="p-4 space-y-3">
                                <div className="h-32 bg-gray-200 rounded-xl overflow-hidden mb-3 relative group/img">
                                    {program.image ? (
                                        <img src={program.image} alt={program.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                                            <Upload size={24} className="mb-2" />
                                            <span className="text-[10px] font-bold">No Image</span>
                                        </div>
                                    )}
                                    <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity cursor-pointer">
                                        <Upload size={20} className="text-white" />
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => handleAcademicProgramChange(index, 'image', reader.result as string);
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                    </label>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Division Name</label>
                                    <Input
                                        value={program.title}
                                        onChange={(e) => handleAcademicProgramChange(index, 'title', e.target.value)}
                                        placeholder="e.g. Primary School"
                                        className="bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Age Range</label>
                                    <Input
                                        value={program.age_range}
                                        onChange={(e) => handleAcademicProgramChange(index, 'age_range', e.target.value)}
                                        placeholder="e.g. Ages 6 - 11"
                                        className="bg-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Description</label>
                                    <textarea
                                        value={program.description}
                                        onChange={(e) => handleAcademicProgramChange(index, 'description', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none bg-white font-medium"
                                        rows={3}
                                        placeholder="Program details..."
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                    {(editedSettings.landing_academic_programs?.length || 0) === 0 && (
                        <div className="col-span-full py-12 text-center border-2 border-dashed border-gray-100 rounded-3xl text-gray-400">
                            No academic divisions added yet
                        </div>
                    )}
                </div>
            </div>

            {/* Features Management */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                    <CheckCircle size={18} className="text-brand-500" />
                    School Features
                </h3>
                <div className="space-y-4">
                    <div className="flex gap-2">
                        <Input
                            value={newFeature}
                            onChange={(e) => setNewFeature(e.target.value)}
                            placeholder="Add a new feature..."
                            onKeyPress={(e) => e.key === 'Enter' && addFeature()}
                        />
                        <Button onClick={addFeature} className="shrink-0">
                            <Plus size={18} />
                        </Button>
                    </div>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {features.map((feature, index) => (
                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl group">
                                <span className="font-medium text-gray-700">{feature}</span>
                                <button
                                    onClick={() => removeFeature(index)}
                                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                    {features.length === 0 && (
                        <p className="text-center text-gray-400 py-8 italic">No features added yet</p>
                    )}
                </div>
            </div>
        </div>
    </div>
);

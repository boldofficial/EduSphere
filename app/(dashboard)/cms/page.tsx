'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Globe,
  Save,
  Loader2,
  Building,
  Sparkles,
  Info,
  Heart,
  GraduationCap,
  Palette,
  Code2,
  Images,
  Eye,
  History,
  Inbox,
  ListPlus,
} from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys, useSettings } from '@/lib/hooks/use-data';
import { Settings, CoreValue, AcademicProgram } from '@/lib/types';
import * as Utils from '@/lib/utils';
import { useToast } from '@/components/providers/toast-provider';

// Extracted Components
import { CmsIdentityTab } from '@/components/features/cms/CmsIdentityTab';
import { CmsHeroTab } from '@/components/features/cms/CmsHeroTab';
import { CmsContentTabs } from '@/components/features/cms/CmsContentTabs';
import { CmsAppearanceTab } from '@/components/features/cms/CmsAppearanceTab';
import { CmsSectionsTab } from '@/components/features/cms/CmsSectionsTab';
import { CmsMediaTab } from '@/components/features/cms/CmsMediaTab';
import { CmsExtrasTab } from '@/components/features/cms/CmsExtrasTab';
import { CmsEnquiriesTab, useNewEnquiryCount } from '@/components/features/cms/CmsEnquiriesTab';
import {
  type CmsTabId,
  WebsiteChecklist,
  WebsiteHistory,
  WebsitePreview,
} from '@/components/features/cms/CmsWebsiteTools';

function getErrorMessage(result: unknown) {
  if (!result || typeof result !== 'object') return 'Failed to save settings';
  const payload = result as {
    detail?: string;
    error?: string;
    errors?: Record<string, string | string[]>;
  };
  if (payload.detail) return payload.detail;
  if (payload.error) return payload.error;
  const firstError = payload.errors && Object.values(payload.errors)[0];
  if (Array.isArray(firstError)) return firstError[0] || 'Failed to save settings';
  return firstError || 'Failed to save settings';
}

export default function CMSPage() {
  const { data: settings = Utils.INITIAL_SETTINGS, isLoading } = useSettings();
  const { addToast } = useToast();
  const [localSettings, setLocalSettings] = useState<Settings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<CmsTabId>('branding');
  const [showPreview, setShowPreview] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const queryClient = useQueryClient();
  const { data: newEnquiries = 0 } = useNewEnquiryCount();

  useEffect(() => {
    if (settings) setLocalSettings(settings);
  }, [settings]);

  // Unpublished edits: shown next to Publish, and the browser warns before leaving the page.
  const hasChanges = useMemo(
    () => !isLoading && JSON.stringify(localSettings) !== JSON.stringify(settings),
    [localSettings, settings, isLoading]
  );
  useEffect(() => {
    if (!hasChanges) return;
    const warn = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [hasChanges]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await fetch('/api/proxy/core/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(localSettings),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(getErrorMessage(result));
      }
      // The response is the saved settings: uploaded images now have their permanent addresses,
      // so a later publish doesn't upload them again.
      const saved = { ...Utils.INITIAL_SETTINGS, ...result } as Settings;
      queryClient.setQueryData(queryKeys.settings, saved);
      queryClient.invalidateQueries({ queryKey: queryKeys.publicSettings });
      queryClient.invalidateQueries({ queryKey: ['website-revisions'] });
      setLocalSettings(saved);
      addToast('Website published', 'success');
    } catch (error: any) {
      console.error(error);
      addToast(error.message || 'Failed to save changes.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const updateField = (field: keyof Settings, value: any) => {
    setLocalSettings((prev) => ({ ...prev, [field]: value }));
  };

  const addCoreValue = () => {
    const newValue: CoreValue = {
      title: 'New Value',
      description: 'Description here...',
      icon: 'Star',
    };
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
    const newProg: AcademicProgram = {
      title: 'New Program',
      age_range: 'Ages 0-0',
      description: 'Description...',
      image: null,
    };
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

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    callback: (url: string) => void
  ) => {
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
    { id: 'extras', name: 'More Content', icon: ListPlus },
    { id: 'media', name: 'Media & Gallery', icon: Images },
    { id: 'appearance', name: 'Branding & Theme', icon: Palette },
    { id: 'sections', name: 'Page Sections & Code', icon: Code2 },
    { id: 'enquiries', name: 'Enquiries', icon: Inbox, badge: newEnquiries },
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
            <p className="text-gray-500 text-sm font-medium">
              Customize your school&apos;s public landing page
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowHistory(true)}
            className="px-4 py-2.5 bg-gray-50 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-all flex items-center gap-2 text-sm border border-gray-200"
          >
            <History size={18} /> History
          </button>
          <button
            type="button"
            onClick={() => setShowPreview(true)}
            className="px-4 py-2.5 bg-gray-50 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-all flex items-center gap-2 text-sm border border-gray-200"
          >
            <Eye size={18} /> Preview
          </button>
          <a
            href="/"
            target="_blank"
            rel="noreferrer"
            className="px-5 py-2.5 bg-gray-50 text-gray-700 font-bold rounded-xl hover:bg-gray-100 transition-all flex items-center gap-2 text-sm border border-gray-200"
          >
            <Globe size={18} /> View Website
          </a>
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="px-6 py-2.5 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-all flex items-center gap-2 text-sm shadow-lg shadow-brand-200 disabled:bg-brand-400 group"
          >
            {isSaving ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} className="group-hover:scale-110 transition-transform" />
            )}
            {isSaving ? 'Publishing…' : hasChanges ? 'Publish Changes' : 'Published'}
          </button>
        </div>
      </div>

      <WebsiteChecklist settings={localSettings} onOpen={setActiveTab} />

      <div className="grid lg:grid-cols-12 gap-8">
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-2">
          {navigation.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as CmsTabId)}
              className={`w-full flex items-center gap-3 px-5 py-4 rounded-2xl font-bold transition-all text-sm border-2 ${
                activeTab === tab.id
                  ? 'bg-brand-600 text-white border-brand-600 shadow-lg shadow-brand-100'
                  : 'bg-white text-gray-600 border-transparent hover:bg-gray-50 hover:border-gray-200'
              }`}
            >
              <tab.icon size={20} /> {tab.name}
              {'badge' in tab && tab.badge ? (
                <span
                  className={`ml-auto rounded-full px-2 py-0.5 text-xs ${activeTab === tab.id ? 'bg-white text-brand-700' : 'bg-brand-600 text-white'}`}
                >
                  {tab.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="lg:col-span-9 bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8 md:p-10">
            {activeTab === 'branding' && (
              <CmsIdentityTab
                localSettings={localSettings}
                updateField={updateField}
                handleImageUpload={handleImageUpload}
              />
            )}
            {activeTab === 'hero' && (
              <CmsHeroTab
                localSettings={localSettings}
                updateField={updateField}
                handleImageUpload={handleImageUpload}
              />
            )}
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
            {activeTab === 'appearance' && (
              <CmsAppearanceTab localSettings={localSettings} updateField={updateField} />
            )}
            {activeTab === 'media' && <CmsMediaTab />}
            {activeTab === 'extras' && (
              <CmsExtrasTab localSettings={localSettings} updateField={updateField} />
            )}
            {activeTab === 'enquiries' && <CmsEnquiriesTab />}
            {activeTab === 'sections' && (
              <CmsSectionsTab localSettings={localSettings} updateField={updateField} />
            )}
          </div>
        </div>
      </div>
      {showPreview && (
        <WebsitePreview settings={localSettings} onClose={() => setShowPreview(false)} />
      )}
      <WebsiteHistory isOpen={showHistory} onClose={() => setShowHistory(false)} />
    </div>
  );
}

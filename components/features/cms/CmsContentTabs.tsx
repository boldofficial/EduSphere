'use client';

import React from 'react';
import { Info, Heart, GraduationCap, Plus, Star, Trash2, Image as ImageIcon } from 'lucide-react';
import { Settings, CoreValue, AcademicProgram } from '@/lib/types';
import * as Utils from '@/lib/utils';
import { RichTextEditor } from '@/components/features/blog/RichTextEditor';

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
  handleImageUpload: (
    e: React.ChangeEvent<HTMLInputElement>,
    callback: (url: string) => void
  ) => void;
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
  handleImageUpload,
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
            <p className="text-gray-500 text-sm">
              Build a polished introduction with formatted content and responsive imagery.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <label className="space-y-2">
              <span className="text-sm font-bold text-gray-700">Section label</span>
              <input
                value={localSettings.landing_about_eyebrow}
                onChange={(e) => updateField('landing_about_eyebrow', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:border-brand-500"
                placeholder="Who we are"
              />
            </label>
            <label className="space-y-2">
              <span className="text-sm font-bold text-gray-700">Section heading</span>
              <input
                value={localSettings.landing_about_title}
                onChange={(e) => updateField('landing_about_title', e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 outline-none focus:border-brand-500"
                placeholder="A tradition of excellence"
              />
            </label>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-gray-700">Formatted story</label>
            <RichTextEditor
              content={localSettings.landing_about_html || localSettings.landing_about_text}
              onChange={(html) => updateField('landing_about_html', html)}
              placeholder="Share your school's story, mission, achievements, and approach..."
            />
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {(
              [
                ['landing_about_primary_image', 'Main image'],
                ['landing_about_secondary_image', 'Supporting image'],
              ] as const
            ).map(([field, label]) => (
              <div key={field} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-700">{label}</span>
                  {localSettings[field] && (
                    <button
                      type="button"
                      onClick={() => updateField(field, null)}
                      className="text-xs font-bold text-red-500"
                    >
                      Remove
                    </button>
                  )}
                </div>
                {localSettings[field] ? (
                  <img
                    src={Utils.getMediaUrl(localSettings[field])}
                    alt=""
                    className="mb-3 h-40 w-full rounded-xl object-cover"
                  />
                ) : (
                  <div className="mb-3 flex h-40 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-white text-gray-400">
                    <ImageIcon size={32} />
                  </div>
                )}
                <label className="block cursor-pointer rounded-xl bg-white px-4 py-2 text-center text-sm font-bold text-brand-600 shadow-sm">
                  {localSettings[field] ? 'Replace image' : 'Upload image'}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event) => handleImageUpload(event, (url) => updateField(field, url))}
                  />
                </label>
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <span className="text-sm font-bold text-gray-700">Image placement</span>
            <div className="grid grid-cols-2 gap-3">
              {(['left', 'right'] as const).map((position) => (
                <button
                  key={position}
                  type="button"
                  onClick={() => updateField('landing_about_image_position', position)}
                  className={`rounded-xl border px-4 py-3 text-sm font-bold capitalize transition-colors ${
                    localSettings.landing_about_image_position === position
                      ? 'border-brand-600 bg-brand-50 text-brand-700'
                      : 'border-gray-200 text-gray-600'
                  }`}
                >
                  Images on the {position}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. CORE VALUES MANAGER */}
      {activeTab === 'values' && (
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-gray-900 mb-2 flex items-center gap-2">
                <Heart className="text-red-500" size={24} />
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
              <div
                key={idx}
                className="group bg-gray-50 p-6 rounded-3xl border-2 border-transparent hover:border-brand-200 transition-all"
              >
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
                <p className="text-xs text-gray-400 mt-1">
                  Add values to show your school&apos;s philosophy
                </p>
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
              <div
                key={idx}
                className="group bg-gray-50 p-6 rounded-[2rem] border-2 border-transparent hover:border-brand-200 transition-all"
              >
                <div className="grid md:grid-cols-4 gap-6">
                  <div className="relative group overflow-hidden rounded-2xl aspect-square bg-white border border-gray-100 flex items-center justify-center">
                    {prog.image ? (
                      <>
                        <img
                          src={Utils.getMediaUrl(prog.image)}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <label className="cursor-pointer p-2 bg-white rounded-full text-brand-600 shadow-xl">
                            <ImageIcon size={20} />
                            <input
                              type="file"
                              className="hidden"
                              accept="image/*"
                              onChange={(e) =>
                                handleImageUpload(e, (url) => updateProgram(idx, 'image', url))
                              }
                            />
                          </label>
                        </div>
                      </>
                    ) : (
                      <label className="cursor-pointer flex flex-col items-center gap-2 text-gray-400 hover:text-brand-600 transition-all">
                        <ImageIcon size={30} />
                        <span className="text-xs font-black uppercase tracking-tighter">
                          Add Image
                        </span>
                        <input
                          type="file"
                          className="hidden"
                          accept="image/*"
                          onChange={(e) =>
                            handleImageUpload(e, (url) => updateProgram(idx, 'image', url))
                          }
                        />
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

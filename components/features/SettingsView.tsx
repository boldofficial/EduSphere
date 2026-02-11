import React, { useState, useEffect } from 'react';
import { Save } from 'lucide-react';
import * as Types from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/providers/toast-provider';

interface SettingsViewProps {
    settings: Types.Settings;
    onUpdate: (s: Types.Settings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ settings, onUpdate }) => {
    // Ensure all new fields have default values to prevent uncontrolled input errors
    const initializeForm = (s: Types.Settings) => ({
        ...s,
        school_name: s.school_name ?? '',
        school_email: s.school_email ?? '',
        school_phone: s.school_phone ?? '',
        school_address: s.school_address ?? '',
        school_tagline: s.school_tagline ?? '',
        current_session: s.current_session ?? '',
        current_term: s.current_term ?? 'First Term',
        next_term_begins: s.next_term_begins ?? '',
        report_font_family: s.report_font_family ?? 'inherit',
        class_teacher_label: s.class_teacher_label ?? 'Class Teacher',
        head_teacher_label: (s.head_teacher_label === 'Head Teacher' ? 'Head of Schools' : s.head_teacher_label) ?? 'Head of Schools',
        landing_hero_title: s.landing_hero_title ?? '',
        landing_hero_subtitle: s.landing_hero_subtitle ?? '',
        landing_about_text: s.landing_about_text ?? '',
        landing_features: s.landing_features ?? '',
        landing_cta_text: s.landing_cta_text ?? '',
        show_bank_details: s.show_bank_details ?? true,
        bank_name: s.bank_name ?? '',
        bank_account_name: s.bank_account_name ?? '',
        bank_account_number: s.bank_account_number ?? '',
        bank_sort_code: s.bank_sort_code ?? '',
        invoice_notes: s.invoice_notes ?? '',
        invoice_due_days: s.invoice_due_days ?? 14,
        director_name: s.director_name ?? '',
        head_of_school_name: s.head_of_school_name ?? '',
    });

    const [formData, setFormData] = useState<Types.Settings>(initializeForm(settings));

    // Update form data when settings prop changes (e.g. data loaded)
    useEffect(() => {
        setFormData(initializeForm(settings));
    }, [settings]);
    const { addToast } = useToast();
    const handleChange = (field: keyof Types.Settings, value: any) => { setFormData(prev => ({ ...prev, [field]: value })); };
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof Types.Settings) => {
        const file = e.target.files?.[0];
        if (file) { const reader = new FileReader(); reader.onloadend = () => { handleChange(field, reader.result as string); }; reader.readAsDataURL(file); }
    };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await onUpdate({ ...formData, updated_at: Date.now() });
            addToast('Settings updated successfully', 'success');
        } catch (error) {
            addToast('Failed to update settings', 'error');
        }
    };
    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center"><div><h1 className="text-2xl font-bold text-gray-900">Settings & Branding</h1><p className="text-gray-500">Configure school identity, session details, and report card assets.</p></div><Button onClick={handleSubmit}><Save className="h-4 w-4 mr-2" /> Save Changes</Button></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title="School Profile">
                    <div className="space-y-4"><Input label="School Name" value={formData.school_name} onChange={e => handleChange('school_name', e.target.value)} /><Input label="Email" value={formData.school_email} onChange={e => handleChange('school_email', e.target.value)} /><Input label="Phone" value={formData.school_phone} onChange={e => handleChange('school_phone', e.target.value)} /><Input label="Address" value={formData.school_address} onChange={e => handleChange('school_address', e.target.value)} /><Input label="Tagline" value={formData.school_tagline} onChange={e => handleChange('school_tagline', e.target.value)} /></div>
                </Card>
                <Card title="Session & Display">
                    <div className="space-y-4">
                        <Input label="Current Session" value={formData.current_session} onChange={e => handleChange('current_session', e.target.value)} />
                        <div className="grid grid-cols-2 gap-4">
                            <Select label="Current Term" value={formData.current_term} onChange={e => handleChange('current_term', e.target.value)}><option>First Term</option><option>Second Term</option><option>Third Term</option></Select>
                            <Input label="Next Term Begins" type="date" value={formData.next_term_begins} onChange={e => handleChange('next_term_begins', e.target.value)} />
                        </div>
                        <div className="space-y-3 pt-2">
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="show_position" checked={formData.show_position} onChange={e => handleChange('show_position', e.target.checked)} className="h-4 w-4 text-brand-600 border-gray-300 rounded" />
                                <label htmlFor="show_position" className="text-sm font-medium text-gray-700">Display Student Rank/Position</label>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" id="show_skills" checked={formData.show_skills} onChange={e => handleChange('show_skills', e.target.checked)} className="h-4 w-4 text-brand-600 border-gray-300 rounded" />
                                <label htmlFor="show_skills" className="text-sm font-medium text-gray-700">Display Skills & Behavior Domain</label>
                            </div>
                            <div className="pt-2">
                                <Select label="Report Card Font" value={formData.report_font_family} onChange={e => handleChange('report_font_family', e.target.value)}>
                                    <option value="inherit">Default (Inter)</option>
                                    <option value="'Roboto', sans-serif">Roboto</option>
                                    <option value="'Montserrat', sans-serif">Montserrat</option>
                                    <option value="Georgia, serif">Classic Serif (Georgia)</option>
                                    <option value="'Courier New', monospace">Typewriter (Mono)</option>
                                </Select>
                            </div>
                            <div className="pt-2 space-y-2">
                                <label className="text-sm font-medium text-gray-700 block">Report Card Scale: {formData.report_scale}%</label>
                                <input
                                    type="range"
                                    min="70"
                                    max="100"
                                    step="5"
                                    value={formData.report_scale}
                                    onChange={e => handleChange('report_scale', parseInt(e.target.value))}
                                    className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
                                />
                                <p className="text-[10px] text-gray-500 italic">Reduce if the report card is too large for your paper.</p>
                            </div>
                            <div className="flex items-center gap-2 text-brand-600 border-t pt-3">
                                <input type="checkbox" id="tiled_watermark" checked={formData.tiled_watermark} onChange={e => handleChange('tiled_watermark', e.target.checked)} className="h-4 w-4 text-brand-600 border-gray-300 rounded" />
                                <label htmlFor="tiled_watermark" className="text-sm font-bold">Tile Watermark (Repeating)</label>
                            </div>
                        </div>
                    </div>
                </Card>
                <Card title="Branding & Signatories">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <Input label="Class Teacher Label" value={formData.class_teacher_label} onChange={e => handleChange('class_teacher_label', e.target.value)} />
                            <Input label="Head of Schools Label" value={formData.head_teacher_label} onChange={e => handleChange('head_teacher_label', e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-4 border-t pt-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">School Logo</label>
                                <input type="file" className="text-xs mt-1 block w-full" onChange={e => handleFileChange(e, 'logo_media')} />
                                {formData.logo_media && <img src={formData.logo_media} className="mt-2 h-12 object-contain border" />}
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Watermark</label>
                                <input type="file" className="text-xs mt-1 block w-full" onChange={e => handleFileChange(e, 'watermark_media')} />
                                {formData.watermark_media && <img src={formData.watermark_media} className="mt-2 h-12 object-contain border" />}
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 border-t pt-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">Director Signature (for ID Card)</label>
                                <Input placeholder="Director's Name" value={formData.director_name || ''} onChange={e => handleChange('director_name', e.target.value)} className="mt-1" />
                                <input type="file" className="text-xs mt-2 block w-full" accept="image/*" onChange={e => handleFileChange(e, 'director_signature')} />
                                {formData.director_signature && <img src={formData.director_signature} className="mt-2 h-10 object-contain border border-dashed p-1" />}
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">{formData.head_teacher_label} Signature</label>
                                <Input placeholder="Head of School Name" value={formData.head_of_school_name || ''} onChange={e => handleChange('head_of_school_name', e.target.value)} className="mt-1" />
                                <input type="file" className="text-xs mt-2 block w-full" accept="image/*" onChange={e => handleFileChange(e, 'head_of_school_signature')} />
                                {formData.head_of_school_signature && <img src={formData.head_of_school_signature} className="mt-2 h-10 object-contain border border-dashed p-1" />}
                            </div>
                        </div>
                    </div>
                </Card>
                <Card title="Invoice & Bank Details">
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="show_bank_details" checked={formData.show_bank_details} onChange={e => handleChange('show_bank_details', e.target.checked)} className="h-4 w-4 text-brand-600 border-gray-300 rounded" />
                            <label htmlFor="show_bank_details" className="text-sm font-medium text-gray-700">Show Bank Details on Invoice</label>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <Input label="Bank Name" value={formData.bank_name || ''} onChange={e => handleChange('bank_name', e.target.value)} placeholder="e.g. First Bank" />
                            <Input label="Account Name" value={formData.bank_account_name || ''} onChange={e => handleChange('bank_account_name', e.target.value)} placeholder="School Account" />
                            <Input label="Account Number" value={formData.bank_account_number || ''} onChange={e => handleChange('bank_account_number', e.target.value)} placeholder="0123456789" />
                            <Input label="Due Days" type="number" value={formData.invoice_due_days?.toString() || '14'} onChange={e => handleChange('invoice_due_days', parseInt(e.target.value) || 14)} />
                        </div>
                        <textarea value={formData.invoice_notes || ''} onChange={e => handleChange('invoice_notes', e.target.value)} placeholder="Invoice notes (optional)..." rows={1} className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-brand-500" />
                    </div>
                </Card>
            </div>
        </div>
    );
};

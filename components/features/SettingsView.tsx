import React, { useState, useEffect } from 'react';
import { Save, Lock } from 'lucide-react';
import * as Types from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/providers/toast-provider';
import { PaymentSettingsCard } from '@/components/features/settings/PaymentSettingsCard';

interface SettingsViewProps {
    settings: Types.Settings;
    onUpdate: (s: any) => Promise<unknown>;
    paymentSettings?: Types.SchoolPaymentSettings | null;
    onUpdatePaymentSettings?: (s: Partial<Types.SchoolPaymentSettings>) => Promise<unknown>;
    canManagePaymentSettings?: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
    settings,
    onUpdate,
    paymentSettings,
    onUpdatePaymentSettings,
    canManagePaymentSettings = false
}) => {
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
        custom_domain: s.custom_domain ?? '',
    });

    const [formData, setFormData] = useState<Types.Settings>(initializeForm(settings));
    const initializePaymentSettings = (s?: Types.SchoolPaymentSettings | null): Types.SchoolPaymentSettings => ({
        enable_cash: s?.enable_cash ?? true,
        enable_bank_transfer: s?.enable_bank_transfer ?? true,
        enable_paystack: s?.enable_paystack ?? false,
        enable_flutterwave: s?.enable_flutterwave ?? false,
        default_payment_method: s?.default_payment_method ?? 'bank_transfer',
        supports_online_payment: s?.supports_online_payment ?? false,
        enabled_methods: s?.enabled_methods ?? ['cash', 'bank_transfer'],
        paystack_public_key: s?.paystack_public_key ?? '',
        paystack_secret_key: '',
        paystack_webhook_secret: '',
        has_paystack_secret: s?.has_paystack_secret ?? false,
        flutterwave_public_key: s?.flutterwave_public_key ?? '',
        flutterwave_secret_key: '',
        flutterwave_webhook_secret: '',
        has_flutterwave_secret: s?.has_flutterwave_secret ?? false,
        bank_name: s?.bank_name ?? '',
        bank_account_name: s?.bank_account_name ?? '',
        bank_account_number: s?.bank_account_number ?? '',
        bank_sort_code: s?.bank_sort_code ?? '',
        transfer_instructions: s?.transfer_instructions ?? '',
        require_transfer_proof: s?.require_transfer_proof ?? true,
        updated_at: s?.updated_at,
    });
    const [paymentForm, setPaymentForm] = useState<Types.SchoolPaymentSettings>(initializePaymentSettings(paymentSettings));
    const [isSavingPaymentSettings, setIsSavingPaymentSettings] = useState(false);

    const normalizeDateForApi = (value?: string | null): string | undefined => {
        const trimmed = (value || '').trim();
        if (!trimmed) return undefined;

        if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
            return trimmed;
        }

        const parsed = new Date(trimmed);
        if (Number.isNaN(parsed.getTime())) {
            return undefined;
        }

        return parsed.toISOString().slice(0, 10);
    };

    const formatApiError = (error: any): string => {
        const data = error?.response?.data;
        if (typeof data?.detail === 'string') return data.detail;
        if (typeof data?.error === 'string') return data.error;
        if (typeof error?.message === 'string' && error.message) return error.message;

        if (data && typeof data === 'object') {
            const firstEntry = Object.entries(data)[0];
            if (firstEntry) {
                const [field, value] = firstEntry;
                if (Array.isArray(value) && value.length > 0) {
                    return `${field}: ${String(value[0])}`;
                }
                if (typeof value === 'string') {
                    return `${field}: ${value}`;
                }
            }
        }

        return 'Failed to update settings';
    };

    const buildSettingsPayload = (data: Types.Settings) => {
        const normalizedNextTermBegins = normalizeDateForApi(data.next_term_begins);

        return {
        school_name: data.school_name,
        school_address: data.school_address,
        school_email: data.school_email,
        school_phone: data.school_phone,
        school_tagline: data.school_tagline,
        current_session: data.current_session,
        current_term: data.current_term,
        ...(normalizedNextTermBegins ? { next_term_begins: normalizedNextTermBegins } : {}),
        class_teacher_label: data.class_teacher_label,
        head_teacher_label: data.head_teacher_label,
        report_font_family: data.report_font_family,
        report_scale: data.report_scale,
        show_position: data.show_position,
        show_skills: data.show_skills,
        tiled_watermark: data.tiled_watermark,
        logo_media: data.logo_media,
        watermark_media: data.watermark_media,
        director_name: data.director_name,
        director_signature: data.director_signature,
        head_of_school_name: data.head_of_school_name,
        head_of_school_signature: data.head_of_school_signature,
        show_bank_details: data.show_bank_details,
        bank_name: data.bank_name,
        bank_account_name: data.bank_account_name,
        bank_account_number: data.bank_account_number,
        bank_sort_code: data.bank_sort_code,
        invoice_notes: data.invoice_notes,
        invoice_due_days: data.invoice_due_days,
        promotion_threshold: data.promotion_threshold,
        promotion_rules: data.promotion_rules,
        custom_domain: data.custom_domain?.trim() ? data.custom_domain.trim() : null,
        subjects_global: data.subjects_global,
        terms_list: data.terms,
        role_permissions: data.role_permissions,
        landing_hero_title: data.landing_hero_title,
        landing_hero_subtitle: data.landing_hero_subtitle,
        landing_features: data.landing_features,
        landing_hero_image: data.landing_hero_image,
        landing_about_text: data.landing_about_text,
        landing_gallery_images: data.landing_gallery_images,
        landing_primary_color: data.landing_primary_color,
        landing_show_stats: data.landing_show_stats,
        landing_cta_text: data.landing_cta_text,
        landing_core_values: data.landing_core_values,
        landing_academic_programs: data.landing_academic_programs,
        landing_testimonials: data.landing_testimonials,
        landing_stats_config: data.landing_stats_config,
        };
    };

    // Update form data when settings prop changes (e.g. data loaded)
    useEffect(() => {
        setFormData(initializeForm(settings));
    }, [settings]);
    useEffect(() => {
        setPaymentForm(initializePaymentSettings(paymentSettings));
    }, [paymentSettings]);
    const { addToast } = useToast();
    const handleChange = (field: keyof Types.Settings, value: unknown) => { setFormData(prev => ({ ...prev, [field]: value })); };
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof Types.Settings) => {
        const file = e.target.files?.[0];
        if (file) { const reader = new FileReader(); reader.onloadend = () => { handleChange(field, reader.result as string); }; reader.readAsDataURL(file); }
    };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await onUpdate(buildSettingsPayload(formData));
            addToast('Settings updated successfully', 'success');
        } catch (error) {
            addToast(formatApiError(error), 'error');
        }
    };
    const handlePaymentSettingsChange = (updates: Partial<Types.SchoolPaymentSettings>) => {
        setPaymentForm((prev) => {
            const next = { ...prev, ...updates };
            const enabledMethods: Types.SchoolPaymentMethod[] = [];
            if (next.enable_cash) enabledMethods.push('cash');
            if (next.enable_bank_transfer) enabledMethods.push('bank_transfer');
            if (next.enable_paystack) enabledMethods.push('paystack');
            if (next.enable_flutterwave) enabledMethods.push('flutterwave');
            if (!enabledMethods.includes(next.default_payment_method)) {
                next.default_payment_method = enabledMethods[0] || 'bank_transfer';
            }
            return next;
        });
    };
    const handleSavePaymentSettings = async () => {
        if (!onUpdatePaymentSettings) return;
        const hasEnabledMethod = [
            paymentForm.enable_cash,
            paymentForm.enable_bank_transfer,
            paymentForm.enable_paystack,
            paymentForm.enable_flutterwave,
        ].some(Boolean);
        if (!hasEnabledMethod) {
            addToast('Enable at least one payment method before saving.', 'error');
            return;
        }
        if (paymentForm.enable_paystack && !paymentForm.paystack_public_key?.trim()) {
            addToast('Paystack public key is required when Paystack is enabled.', 'error');
            return;
        }
        if (paymentForm.enable_flutterwave && !paymentForm.flutterwave_public_key?.trim()) {
            addToast('Flutterwave public key is required when Flutterwave is enabled.', 'error');
            return;
        }
        try {
            setIsSavingPaymentSettings(true);
            await onUpdatePaymentSettings(paymentForm);
            addToast('Payment settings updated successfully', 'success');
        } catch (error) {
            addToast('Failed to update payment settings', 'error');
        } finally {
            setIsSavingPaymentSettings(false);
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
                {paymentSettings && onUpdatePaymentSettings && (
                    <PaymentSettingsCard
                        paymentSettings={paymentForm}
                        onChange={handlePaymentSettingsChange}
                        onSave={handleSavePaymentSettings}
                        isSaving={isSavingPaymentSettings}
                        canManage={canManagePaymentSettings}
                    />
                )}
                <Card title="Domain Management">
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Standard Subdomain</label>
                            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm text-brand-600">
                                <span>.{settings.domain || 'your-school'}</span>
                                <span className="text-[10px] bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-bold uppercase">Default</span>
                            </div>
                        </div>
                        <div className="pt-4 border-t border-gray-100">
                            <Input
                                label="Custom Domain"
                                placeholder="e.g. portal.yourschool.com"
                                value={formData.custom_domain || ''}
                                onChange={e => handleChange('custom_domain', e.target.value)}
                                disabled={!settings.subscription?.plan?.custom_domain_enabled}
                                className="font-mono"
                            />
                            {settings.subscription?.plan?.custom_domain_enabled && (
                                <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-3">
                                    <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[11px] font-bold text-blue-900 uppercase tracking-tight">DNS Configuration Required</p>
                                        <p className="text-[10px] text-blue-800 font-medium leading-relaxed">
                                            Point your domain&apos;s <strong>CNAME</strong> record to: <code className="bg-blue-100 px-1 rounded text-blue-900 font-bold">app.myregistra.net</code>
                                        </p>
                                    </div>
                                </div>
                            )}
                            {!settings.subscription?.plan?.custom_domain_enabled && (
                                <div className="mt-2 p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-3">
                                    <div className="p-1.5 bg-amber-100 text-amber-600 rounded-lg">
                                        <Lock size={14} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[11px] font-bold text-amber-900 uppercase tracking-tight">Upgrade Required</p>
                                        <p className="text-[10px] text-amber-800 font-medium">Custom domains are only available on Enterprise plans. Contact support to upgrade.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

'use client';

import React, { useState, useEffect } from 'react';
import { GraduationCap, CheckCircle, Send, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import SiteHeader from '@/components/features/SiteHeader';
import SiteFooter from '@/components/features/SiteFooter';
import * as Utils from '@/lib/utils';
import * as Types from '@/lib/types';
import * as DataService from '@/lib/data-service';

const AdmissionPage = () => {
    const [settings, setSettings] = useState(Utils.INITIAL_SETTINGS);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        child_name: '',
        child_dob: '',
        child_gender: 'Male' as 'Male' | 'Female',
        previous_school: '',
        program: 'pre-school' as 'creche' | 'pre-school' | 'primary',
        class_applied: '',
        parent_name: '',
        parent_email: '',
        parent_phone: '',
        parent_address: '',
        relationship: 'Father' as 'Father' | 'Mother' | 'Guardian',
    });

    useEffect(() => {
        const loadSettings = async () => {
            const dbSettings = await DataService.fetchSettings();
            if (dbSettings) {
                setSettings(dbSettings);
            } else {
                setSettings(Utils.INITIAL_SETTINGS);
            }
            setIsLoaded(true);
        };
        loadSettings();
    }, []);

    const handleChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Create admission record
            const admission: Types.Admission = {
                id: Utils.generateId(),
                created_at: Date.now(),
                updated_at: Date.now(),
                ...formData,
                status: 'pending',
                reviewed_at: undefined,
                reviewed_by: undefined
            };

            // Save to Supabase
            await DataService.createItem('admissions', admission);

            setIsSubmitting(false);
            setIsSubmitted(true);
        } catch (error) {
            console.error("Submission failed", error);
            alert("Submission failed. Please try again or contact the school.");
            setIsSubmitting(false);
        }
    };

    const classOptions = {
        'creche': ['Infant', 'Toddler'],
        'pre-school': ['Playgroup', 'Nursery 1', 'Nursery 2', 'Kindergarten'],
        'primary': ['Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6'],
    };

    if (!isLoaded) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-brand-900">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4"></div>
                    <p className="text-white/60 font-medium">Loading...</p>
                </div>
            </div>
        );
    }

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <SiteHeader settings={settings} />
                <main className="flex-grow flex items-center justify-center py-32 px-4">
                    <div className="bg-white rounded-3xl shadow-xl p-12 text-center max-w-lg">
                        <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle size={40} className="text-green-600" />
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-4">Application Submitted!</h1>
                        <p className="text-gray-600 mb-8">
                            Thank you for applying to {settings.school_name}. We have received your application and will contact you shortly at <strong>{formData.parent_email}</strong>.
                        </p>
                        <Link href="/" className="inline-flex items-center gap-2 px-6 py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors">
                            <ArrowLeft size={20} />
                            Return to Homepage
                        </Link>
                    </div>
                </main>
                <SiteFooter settings={settings} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <SiteHeader settings={settings} />

            <main className="flex-grow py-32 px-4">
                <div className="max-w-3xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center justify-center h-16 w-16 bg-brand-100 rounded-2xl mb-6">
                            <GraduationCap size={32} className="text-brand-600" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Admission Application</h1>
                        <p className="text-gray-600 max-w-xl mx-auto">
                            Complete the form below to apply for admission to {settings.school_name}. We look forward to welcoming your child!
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 md:p-10 space-y-8">
                        {/* Child Information */}
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">Child Information</h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Child's Full Name *</label>
                                    <input type="text" required value={formData.child_name} onChange={e => handleChange('child_name', e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500" placeholder="Enter full name" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                                    <input type="date" required value={formData.child_dob} onChange={e => handleChange('child_dob', e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                                    <select required value={formData.child_gender} onChange={e => handleChange('child_gender', e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white">
                                        <option value="Male">Male</option>
                                        <option value="Female">Female</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Previous School (if any)</label>
                                    <input type="text" value={formData.previous_school} onChange={e => handleChange('previous_school', e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500" placeholder="Name of previous school" />
                                </div>
                            </div>
                        </div>

                        {/* Program Selection */}
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">Program Selection</h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Program *</label>
                                    <select required value={formData.program} onChange={e => { handleChange('program', e.target.value); handleChange('class_applied', ''); }} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white">
                                        <option value="creche">Crèche</option>
                                        <option value="pre-school">Pre-School</option>
                                        <option value="primary">Primary School</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Class Applying For *</label>
                                    <select required value={formData.class_applied} onChange={e => handleChange('class_applied', e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white">
                                        <option value="">Select Class</option>
                                        {classOptions[formData.program].map(cls => (
                                            <option key={cls} value={cls}>{cls}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Parent/Guardian Information */}
                        <div>
                            <h2 className="text-lg font-bold text-gray-900 mb-4 pb-2 border-b">Parent/Guardian Information</h2>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                                    <input type="text" required value={formData.parent_name} onChange={e => handleChange('parent_name', e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500" placeholder="Enter full name" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Relationship *</label>
                                    <select required value={formData.relationship} onChange={e => handleChange('relationship', e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white">
                                        <option value="Father">Father</option>
                                        <option value="Mother">Mother</option>
                                        <option value="Guardian">Guardian</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                                    <input type="email" required value={formData.parent_email} onChange={e => handleChange('parent_email', e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500" placeholder="you@example.com" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                                    <input type="tel" required value={formData.parent_phone} onChange={e => handleChange('parent_phone', e.target.value)} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500" placeholder="08012345678" />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Residential Address *</label>
                                    <textarea required value={formData.parent_address} onChange={e => handleChange('parent_address', e.target.value)} rows={2} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-brand-500" placeholder="Enter full address" />
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                            <button type="submit" disabled={isSubmitting} className="w-full py-4 bg-accent-500 hover:bg-accent-600 text-brand-950 text-lg font-bold rounded-xl transition-all shadow-lg hover:shadow-accent-500/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                                {isSubmitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-brand-950 border-t-transparent"></div>
                                        Submitting...
                                    </>
                                ) : (
                                    <>
                                        <Send size={20} />
                                        Submit Application
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </main>

            <SiteFooter settings={settings} />
        </div>
    );
};

export default AdmissionPage;

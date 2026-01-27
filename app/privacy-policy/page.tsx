'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Lock, FileText, Globe } from 'lucide-react';
import SiteHeader from '@/components/features/SiteHeader';
import SiteFooter from '@/components/features/SiteFooter';
import * as Utils from '@/lib/utils';
import * as DataService from '@/lib/data-service';

const PrivacyPolicy = () => {
    const [settings, setSettings] = useState(Utils.INITIAL_SETTINGS);
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            try {
                const loadedSettings = await DataService.fetchSettings();
                setSettings(loadedSettings);
            } catch (error) {
                console.error('Error loading settings:', error);
            } finally {
                setIsLoaded(true);
            }
        };
        loadData();
    }, []);

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

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <SiteHeader settings={settings} />

            <main className="flex-grow max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-32">
                <div className="bg-white rounded-2xl shadow-sm p-8 md:p-12">
                    <div className="flex items-center gap-4 mb-8 border-b pb-8">
                        <div className="h-12 w-12 bg-brand-100 rounded-xl flex items-center justify-center text-brand-600">
                            <Shield size={24} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-brand-900">Privacy Policy</h1>
                            <p className="text-gray-500">Last Updated: {new Date().toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div className="prose prose-brand max-w-none text-gray-600">
                        <p className="lead text-xl text-gray-700 mb-8">
                            At Fruitful Vine Heritage Schools, we are committed to protecting the privacy and security of our students, parents, and staff. This Privacy Policy outlines how we collect, use, and safeguard your personal information.
                        </p>

                        <h3 className="text-brand-800 font-bold mt-8 mb-4 flex items-center gap-2">
                            <FileText size={20} className="text-accent-500" />
                            Information We Collect
                        </h3>
                        <p>We collect various types of information to provide educational services, including:</p>
                        <ul className="list-disc pl-5 space-y-2 mb-6">
                            <li><strong>Student Information:</strong> Names, dates of birth, academic records, attendance, and medical information.</li>
                            <li><strong>Parent/Guardian Information:</strong> Names, contact details, and payment information.</li>
                            <li><strong>Staff Information:</strong> Employment history, qualifications, and contact details.</li>
                            <li><strong>Digital Data:</strong> Information collected via our website and portal, such as IP addresses and cookies.</li>
                        </ul>

                        <h3 className="text-brand-800 font-bold mt-8 mb-4 flex items-center gap-2">
                            <Lock size={20} className="text-accent-500" />
                            How We Use Information
                        </h3>
                        <p>Your information is used for legitimate educational and administrative purposes, such as:</p>
                        <ul className="list-disc pl-5 space-y-2 mb-6">
                            <li>Managing student enrollment and academic progress.</li>
                            <li>Communicating with parents and guardians.</li>
                            <li>Processing payments and financial records.</li>
                            <li>Ensuring the safety and security of our school community.</li>
                            <li>Improving our educational programs and digital services.</li>
                        </ul>

                        <h3 className="text-brand-800 font-bold mt-8 mb-4 flex items-center gap-2">
                            <Globe size={20} className="text-accent-500" />
                            Data Sharing and Disclosure
                        </h3>
                        <p className="mb-6">
                            We do not sell your personal information. We may share data with third-party service providers (e.g., payment processors, educational software) who assist us in our operations, strictly under confidentiality agreements. We may also disclose information if required by law.
                        </p>

                        <h3 className="text-brand-800 font-bold mt-8 mb-4">Data Security</h3>
                        <p className="mb-6">
                            We implement robust security measures to protect your data from unauthorized access, alteration, or disclosure. This includes secure servers, encryption, and strict access controls.
                        </p>

                        <h3 className="text-brand-800 font-bold mt-8 mb-4">Your Rights</h3>
                        <p className="mb-6">
                            You have the right to access, correct, or request the deletion of your personal information, subject to legal and educational record-retention requirements. Please contact the school administration for any such requests.
                        </p>

                        <h3 className="text-brand-800 font-bold mt-8 mb-4">Contact Us</h3>
                        <p>
                            If you have any questions about this Privacy Policy, please contact us at: <a href="mailto:info@fruitfulvineheritageschools.org.ng" className="text-brand-600 hover:text-brand-700 font-medium">info@fruitfulvineheritageschools.org.ng</a>.
                        </p>
                    </div>
                </div>
            </main>

            <SiteFooter settings={settings} />
        </div>
    );
};

export default PrivacyPolicy;

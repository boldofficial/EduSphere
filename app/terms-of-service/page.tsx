'use client';

import React, { useState, useEffect } from 'react';
import { ScrollText, Gavel, Scale, AlertCircle } from 'lucide-react';
import SiteHeader from '@/components/features/SiteHeader';
import SiteFooter from '@/components/features/SiteFooter';
import * as Utils from '@/lib/utils';
import * as DataService from '@/lib/data-service';

const TermsOfService = () => {
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
                            <Scale size={24} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-brand-900">Terms of Service</h1>
                            <p className="text-gray-500">Last Updated: {new Date().toLocaleDateString()}</p>
                        </div>
                    </div>

                    <div className="prose prose-brand max-w-none text-gray-600">
                        <p className="lead text-xl text-gray-700 mb-8">
                            Welcome to the Fruitful Vine Heritage Schools website and portal. By accessing or using our services, you agree to be bound by these Terms of Service.
                        </p>

                        <h3 className="text-brand-800 font-bold mt-8 mb-4 flex items-center gap-2">
                            <ScrollText size={20} className="text-accent-500" />
                            Acceptance of Terms
                        </h3>
                        <p className="mb-6">
                            By using our website, portal, and related services, you signify your acceptance of these terms. If you do not agree to these terms, please do not use our services.
                        </p>

                        <h3 className="text-brand-800 font-bold mt-8 mb-4 flex items-center gap-2">
                            <Gavel size={20} className="text-accent-500" />
                            Use of Services
                        </h3>
                        <p>You agree to use our services only for lawful purposes and in a way that does not infringe the rights of others or restrict their use and enjoyment of the services. Prohibited behavior includes:</p>
                        <ul className="list-disc pl-5 space-y-2 mb-6">
                            <li>Harassing or causing distress to any person.</li>
                            <li>Transmitting obscene or offensive content.</li>
                            <li>Attempting to gain unauthorized access to our systems or data.</li>
                            <li>Using the service to distribute spam or malicious software.</li>
                        </ul>

                        <h3 className="text-brand-800 font-bold mt-8 mb-4 flex items-center gap-2">
                            <AlertCircle size={20} className="text-accent-500" />
                            Intellectual Property
                        </h3>
                        <p className="mb-6">
                            All content on this website, including text, graphics, logos, and images, is the property of Fruitful Vine Heritage Schools or its content suppliers and is protected by intellectual property laws. You may not reproduce, distribute, or create derivative works without our express permission.
                        </p>

                        <h3 className="text-brand-800 font-bold mt-8 mb-4">User Accounts</h3>
                        <p className="mb-6">
                            If you are issued a portal account, you are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account.
                        </p>

                        <h3 className="text-brand-800 font-bold mt-8 mb-4">Disclaimer of Warranties</h3>
                        <p className="mb-6">
                            Our services are provided "as is" without any warranties, express or implied. We do not guarantee that the services will be uninterrupted or error-free.
                        </p>

                        <h3 className="text-brand-800 font-bold mt-8 mb-4">Limitation of Liability</h3>
                        <p className="mb-6">
                            Fruitful Vine Heritage Schools shall not be liable for any indirect, incidental, special, or consequential damages arising out of or in connection with your use of our services.
                        </p>

                        <h3 className="text-brand-800 font-bold mt-8 mb-4">Changes to Terms</h3>
                        <p>
                            We reserve the right to modify these terms at any time. Your continued use of the services after any such changes constitutes your acceptance of the new terms.
                        </p>
                    </div>
                </div>
            </main>

            <SiteFooter settings={settings} />
        </div>
    );
};

export default TermsOfService;

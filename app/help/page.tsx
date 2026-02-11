'use client';

import React from 'react';
import { Search, HelpCircle, Book, MessageCircle, FileText, ChevronRight } from 'lucide-react';
import { SystemPageLayout } from '@/components/features/SystemPageLayout';
import * as Utils from '@/lib/utils';

export default function HelpCenterPage() {
    return (
        <SystemPageLayout>
            <main className="flex-grow pt-24 pb-16">
                {/* Hero Section */}
                <div className="bg-brand-900 text-white py-16 px-4">
                    <div className="max-w-4xl mx-auto text-center space-y-6">
                        <div className="inline-flex items-center justify-center p-3 bg-white/10 rounded-2xl mb-4">
                            <HelpCircle size={32} className="text-accent-400" />
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tight">How can we help you?</h1>
                        <p className="text-xl text-brand-100 max-w-2xl mx-auto">
                            Search our knowledge base or browse frequently asked questions.
                        </p>

                        <div className="max-w-xl mx-auto relative mt-8">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Search for answers (e.g. 'Reset Password', 'Add Student')..."
                                className="w-full pl-14 pr-6 py-4 rounded-2xl text-gray-900 font-medium focus:outline-none focus:ring-4 focus:ring-accent-500/50 shadow-xl"
                            />
                        </div>
                    </div>
                </div>

                {/* Categories */}
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <HelpCard
                            icon={Book}
                            title="Getting Started"
                            description="Guides for new schools, admins, and initial setup."
                            link="#"
                        />
                        <HelpCard
                            icon={FileText}
                            title="User Manuals"
                            description="Detailed documentation for Teachers, Parents, and Staff."
                            link="#"
                        />
                        <HelpCard
                            icon={MessageCircle}
                            title="Support"
                            description="Contact our support team for technical assistance."
                            link="#"
                        />
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="max-w-4xl mx-auto px-4 py-20">
                    <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">Frequently Asked Questions</h2>
                    <div className="space-y-4">
                        <FaqItem
                            question="How do I reset my admin password?"
                            answer="You can reset your password from the login page by clicking 'Forgot Password'. You'll need access to the recovery email set during school registration."
                        />
                        <FaqItem
                            question="Can I upgrade my subscription plan later?"
                            answer="Yes, you can upgrade your plan at any time from the 'Plans & Billing' section in your Super Admin dashboard. Changes take effect immediately."
                        />
                        <FaqItem
                            question="How do parents access their portal?"
                            answer="Parents can log in using their child's Student Number and the password provided by the school. They should visit your school's subdomain (e.g., school.myregistra.net)."
                        />
                        <FaqItem
                            question="Is my data secure?"
                            answer="Absolutely. We use industry-standard encryption for all data transmission and storage. We perform regular backups and security audits to ensure your school's information is safe."
                        />
                    </div>
                </div>

                {/* Contact CTA */}
                <div className="bg-white border-t border-gray-100 py-16">
                    <div className="max-w-4xl mx-auto px-4 text-center">
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">Still need help?</h3>
                        <p className="text-gray-500 mb-8">Our support team is available Monday to Friday, 8am - 5pm.</p>
                        <div className="flex justify-center gap-4">
                            <a href="mailto:support@myregistra.net" className="px-8 py-3 bg-brand-600 text-white font-bold rounded-xl hover:bg-brand-700 transition-colors">
                                Email Support
                            </a>
                            <a href="/#contact" className="px-8 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">
                                Contact Sales
                            </a>
                        </div>
                    </div>
                </div>
            </main>
        </SystemPageLayout>
    );
}

function HelpCard({ icon: Icon, title, description, link }: any) {
    return (
        <a href={link} className="bg-white p-8 rounded-3xl shadow-lg border border-gray-100 hover:-translate-y-1 transition-transform group">
            <div className="h-14 w-14 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 mb-6 group-hover:bg-brand-600 group-hover:text-white transition-colors">
                <Icon size={28} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-brand-600 transition-colors">{title}</h3>
            <p className="text-gray-500 leading-relaxed mb-4">{description}</p>
            <div className="flex items-center text-brand-600 font-bold text-sm">
                View Articles <ChevronRight size={16} />
            </div>
        </a>
    );
}

function FaqItem({ question, answer }: any) {
    return (
        <div className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-md transition-shadow">
            <h4 className="text-lg font-bold text-gray-900 mb-2">{question}</h4>
            <p className="text-gray-600 leading-relaxed">{answer}</p>
        </div>
    );
}
